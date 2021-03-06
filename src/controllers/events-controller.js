const { Router } = require("express");
const controller = Router();
const ics = require('ics');
const {
  createEvent,
  checkIfSignUpStillPossible,
  findMostRecentPastEvent,
  findNextTwoEvents,
  signUpUserForEvent,
  cancelUserFromEvent,
  findEventById,
  createCalendarEvent,
  checkIfGuestsAreWelcome,
  updateEvent,
  SIGNUP_ALLOWED,
  SIGNUP_FORBIDDEN_ALREADY_SIGNED_UP,
  SIGNUP_FORBIDDEN_MAX_REACHED,
  SIGNUP_FORBIDDEN_NOT_SIGNED_UP,
  REDUCED_SIGNUP_ALLOWED,
  enrichEvent,
  removeEvent
} = require("../models/event-model")
const {
  findUsersByIds,
  addBookingCountToUser,
  getAllUsersWithToken,
  findUserById
} = require("../models/user-model");
const {
  findCourtPriceByProviderName,
  findCourtProviderByName
} = require("../models/court-model");
const {
  enrollUserForEvent,
  addParticipants,
  removeUserFromEvent,
  setGuestsForEnrollment,
  getSingleEnrollmentForEvent,
  getParticipantsCount
} = require('../models/enrollment-model');
const Notification = require("../models/notification-model");

controller.post("/events", async (req, res) => {
  console.log("-------CREATING EVENT IN CONTROLLER-------", req.body)

  if (!req.body.event_date || !req.body.location || !req.body.number_of_fields) {
    return res.status(400).json({ errorMsg: "All fields are required!" })
  }

  const newEvent = await createEvent(req.body);
  const increasedBookingCount = await addBookingCountToUser(req.body.creator_id);
  const allUsersWithToken = Array.from(await getAllUsersWithToken());
  const notificationTokens = allUsersWithToken.filter(user => user.id !== req.body.creator_id).map(user => user.notifications_token)
  const sentNotifications = Notification.sendPushNotification(`New event for ${newEvent.event_date.toLocaleDateString()}`, notificationTokens, newEvent.id);

  res.status(201).json(await enrichEvent(newEvent))
});

controller.delete("/events/:eventId", async (req, res) => {
  console.log("-----------DELETING EVENT------------", req.params.eventId);
  const foundEvent = await findEventById(req.params.eventId);
  if (!req.params.eventId || !foundEvent) {
    res.status(404).json({errorMessage: "Event does not exist."})
  }

  await removeEvent(req.params.eventId);

  res.sendStatus(204);
});

controller.put("/events", async (req, res) => {
  console.log("-------UPDATING EVENT IN CONTROLLER-------", req.body)
  if (!req.body.eventId) {
    return res.status(400).json({ errorMsg: "Event does not exist" })
  }
  const updatedEvent = await updateEvent(req.body);

  console.log("-------UPDATED EVENT----- ", updatedEvent);

  const allUsersWithToken = Array.from(await getAllUsersWithToken());
  console.log("AAAAALL THE USERS WITH TOKEN", allUsersWithToken);
  // const notificationTokens = allUsersWithToken.map(user => user.notifications_token);
  const notificationTokens = allUsersWithToken.filter(user => user.id !== req.body.userId).map(user => user.notifications_token)
  console.log("############################### NOTI TOKEN ########################", notificationTokens)
  const sentNotifications = Notification.sendPushNotification(`Event update ${updatedEvent.event_date.toLocaleDateString()}`, notificationTokens, updatedEvent.id);
  res.status(201).json(await enrichEvent(updatedEvent))
});

controller.post("/events/:eventId/signup", async (req, res) => {
  if (!req.body.userId) {
    return res.sendStatus(400)
  }
  const foundEvent = await findEventById(req.params.eventId);

  if (!foundEvent) {
    return res.sendStatus(404)
  }

  const signUpChecked = await checkIfSignUpStillPossible(req.body.userId, foundEvent);

  if (signUpChecked === SIGNUP_FORBIDDEN_ALREADY_SIGNED_UP) {
    return res.status(403).json({ msg: "You are already signed up for this event!" });
  }
  if (signUpChecked === SIGNUP_FORBIDDEN_MAX_REACHED) {
    return res.status(403).json({ msg: "Maximum number of participants is already reached. You cannot sign up for this event at the moment." });
  }

  const allUsersWithToken = Array.from(await getAllUsersWithToken());
  const notificationTokens = allUsersWithToken.filter(user => user.id !== req.body.userId).map(user => user.notifications_token)

  const newParticipant = await enrollUserForEvent(req.body.userId, foundEvent);
  // const sentNotifications = Notification.sendPushNotification("New signup", notificationTokens, req.params.eventId);

  return res.status(201).json(await enrichEvent(foundEvent))
});

controller.put("/events/:eventId/guests", async (req, res) => {
  if (!req.body.userId) {
    return res.sendStatus(400)
  }

  const foundEvent = await findEventById(req.params.eventId);
  if (!foundEvent) {
    return res.sendStatus(404)
  }

  const enrollment = await getSingleEnrollmentForEvent(foundEvent.id, req.body.userId);
  const guestWelcomeChecked = await checkIfGuestsAreWelcome(foundEvent, req.body.userId, req.body.guestCount)

  if (guestWelcomeChecked.status === SIGNUP_FORBIDDEN_MAX_REACHED) {
    return res.status(403).json({
      enrollment,
      msg: "Maximum number of participants is already reached. You cannot sign up anyone for this event at the moment.",
      totalParticipants: await getParticipantsCount(foundEvent.id),
      eventData: await enrichEvent(foundEvent)
    });
  }
  if (guestWelcomeChecked.status === SIGNUP_FORBIDDEN_NOT_SIGNED_UP) {
    return res.status(403).json({
      enrollment,
      msg: "You are not signed up for this event!",
      totalParticipants: await getParticipantsCount(foundEvent.id),
      eventData: await enrichEvent(foundEvent)
    });
  }
  if (guestWelcomeChecked.status === REDUCED_SIGNUP_ALLOWED) {
    const enrollmentFoo = await setGuestsForEnrollment(enrollment, guestWelcomeChecked.capacity + enrollment.guests);

    return res.json({
      enrollment: enrollmentFoo,
      msg: `The capacity was lower than your request. You'll bring ${guestWelcomeChecked.capacity + enrollment.guests} guests.`,
      totalParticipants: await getParticipantsCount(foundEvent.id),
      eventData: await enrichEvent(foundEvent)
    })
  }

  const enrollmentFoo = await setGuestsForEnrollment(enrollment, req.body.guestCount);

  return res.json({
    enrollment: enrollmentFoo,
    msg: `${req.body.guestCount} guests have been added.`,
    totalParticipants: await getParticipantsCount(foundEvent.id),
    eventData: await enrichEvent(foundEvent)
  })
});

controller.post("/events/:eventId/cancel", async (req, res) => {
  // console.log("-------CANCELLING FOR EVENT IN CONTROLLER-------", req.body)

  if (!req.body.userId) {
    return res.sendStatus(400)
  }
  const eventData = await findEventById(req.params.eventId);

  await removeUserFromEvent(req.body.userId, eventData);
  await enrichEvent(eventData);

  console.log("EVENT DATA", (new Date(eventData.event_date)).toLocaleDateString('de-DE'));

  const allUsersWithToken = Array.from(await getAllUsersWithToken());
  const notificationTokens = allUsersWithToken.filter(user => user.id !== req.body.userId).map(user => user.notifications_token)
  const cancellingUser = await findUserById(req.body.userId);

  console.log("CANCELLATION!!!!!!", `${cancellingUser.username} has cancelled for ${(new Date(eventData.event_date)).toLocaleDateString('de-DE')}!`, notificationTokens, req.params.eventId)
  const sentNotifications = Notification.sendPushNotification(`${cancellingUser.username} has cancelled for ${(new Date(eventData.event_date)).toLocaleDateString('de-DE')}!`, notificationTokens, req.params.eventId);
  res.status(200).json(eventData)
});

/*
  TODO: Write many many tests and refactor it :)
*/
controller.get("/events", async (req, res) => {
  console.log("-------GETTING EVENT IN CONTROLLER-------");

  const pastEvents = await findMostRecentPastEvent();
  const pastEvent = pastEvents[0] || null;
  const nextEvents = await findNextTwoEvents();
  let eventData = { pastEvent, nextEvents };

  if (pastEvent) {
    const courtPricePast = await findCourtPriceByProviderName(pastEvent.location)
    await addParticipants(pastEvent);

    if (courtPricePast) {
      console.log("COURT PRICE PAST", Number(courtPricePast.price))
      pastEvent.courtPrice = Number(courtPricePast.price)
    }
  }

  if (nextEvents[0]) {
    const courtPriceNext0 = await findCourtPriceByProviderName(nextEvents[0].location)
    eventData.nextEvents[0] = await addParticipants(nextEvents[0]);

    if (courtPriceNext0) {
      console.log("COURT PRICE 0", courtPriceNext0)
      nextEvents[0].courtPrice = Number(courtPriceNext0.price);
    }
  }

  if (nextEvents[1]) {
    const courtPriceNext1 = await findCourtPriceByProviderName(nextEvents[1].location)
    eventData.nextEvents[1] = await addParticipants(nextEvents[1])

    if (courtPriceNext1) {
      console.log("COURT PRICE 1", courtPriceNext1)
      nextEvents[1].courtPrice = Number(courtPriceNext1.price)
    }
  }

  console.log("EVENT DATA IN HOME", eventData);
  return res.status(200).json(eventData)

});

controller.get("/events/:eventId/calendar", async (req, res) => {
  const foundEvent = await findEventById(req.params.eventId);

  const value = await createCalendarEvent(foundEvent)
  console.log("VALUE OF CREATE CAL EVE", value)

  res.set('Content-Type', 'text/calendar;charset=utf-8');
  res.set('Content-Disposition', 'attachment; filename="beachen.pro.calendar.my.ics"');
  console.log("iCal String", value);
  return res.send(value);

});

controller.get("/events/:eventId", async (req, res) => {
  const foundEvent = await findEventById(req.params.eventId);
  // const courtPricePast = await findCourtPriceByProviderName(foundEvent.location);
  // await addParticipants(foundEvent);
  // foundEvent.courtPrice = Number(courtPricePast.price);
  //  console.log("SINGLE EVENT", foundEvent);

  await enrichEvent(foundEvent);

  return res.status(200).json(foundEvent);
});

module.exports = controller;
