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
  SIGNUP_ALLOWED, SIGNUP_FORBIDDEN_ALREADY_SIGNED_UP, SIGNUP_FORBIDDEN_MAX_REACHED
} = require("../models/event-model")
const {
  findUsersByIds,
  addBookingCountToUser,
  getAllUsersWithToken,
  findUserById
} = require("../models/user-model");
const { findCourtPriceByProviderName, findCourtProviderByName } = require("../models/court-model");
const { sendPushNotification } = require("../models/notification-model");

controller.post("/events", async (req, res) => {
  console.log("-------CREATING EVENT IN CONTROLLER-------", req.body)

  if (!req.body.event_date) {
    return res.status(400).json({ errorMsg: "Event date is required!" })
  }

  const newEvent = await createEvent(req.body);
  const increasedBookingCount = await addBookingCountToUser();
  // console.log("HAS BOOKING COUNT INCREASED FOR ", req.body.creator_id, increasedBookingCount);
  // console.log("-------NEW EVENT----- ", newEvent);

  const allUsersWithToken = Array.from(await getAllUsersWithToken());
  // console.log("AAAAALL THE USERS WITH TOKEN", allUsersWithToken)
  const notificationTokens = allUsersWithToken.filter(user => user.id !== req.body.creator_id).map(user => user.notifications_token)
  // console.log("@@@@@@@@@@@ NOTIFICTAIONS TOKENS @@@@@@", notificationTokens);

  const sentNotifications = sendPushNotification(`New event for ${newEvent.event_date.toLocaleDateString()}`, notificationTokens, newEvent.id);
  res.status(201).json(newEvent)
});

controller.post("/events/:eventId/signup", async (req, res) => {
  // console.log("-------SIGNING UP FOR EVENT IN CONTROLLER-------", req.body)

  if (!req.body.userId || !req.params.eventId) {
    return res.sendStatus(400)
  }
  const foundEvent = await findEventById(req.params.eventId);
  if (!foundEvent) {
    return res.sendStatus(404)
  }

  const signUpChecked = checkIfSignUpStillPossible(req.body.userId, foundEvent);

  if (signUpChecked === SIGNUP_ALLOWED) {
    const newParticipant = await signUpUserForEvent(req.body.userId, foundEvent);
    const userData = await findUsersByIds(newParticipant.participants);
    newParticipant.participants = userData.map(user => user.username);

    // console.log("NEW PARTICIPANTS", newParticipant);
    return res.status(201).json(newParticipant)
  }
  if (signUpChecked === SIGNUP_FORBIDDEN_ALREADY_SIGNED_UP) {
    return res.status(403).json({ msg: "You are already signed up for this event!" });
  }
  if (signUpChecked === SIGNUP_FORBIDDEN_MAX_REACHED) {
    return res.status(403).json({ msg: "Maximum number of participants is already reached. You cannot sign up for this event at the moment." });
  }
});

controller.post("/events/:eventId/cancel", async (req, res) => {
  // console.log("-------CANCELLING FOR EVENT IN CONTROLLER-------", req.body)

  if (!req.body.userId || !req.params.eventId) {
    return res.sendStatus(400)
  }

  const updatedParticipants = await cancelUserFromEvent(req.body.userId, req.params.eventId);
  const userData = await findUsersByIds(updatedParticipants.participants);
  updatedParticipants.participants = userData.map(user => user.username);
  const eventData = await findEventById(req.params.eventId);
  console.log("EVENT DATA", (new Date(eventData.event_date)).toLocaleDateString('de-DE'));
// console.log("USERDATA", userData)
  const allUsersWithToken = Array.from(await getAllUsersWithToken());
  // console.log("AAAAALL THE USERS WITH TOKEN", allUsersWithToken)
  const notificationTokens = allUsersWithToken.filter(user => user.id !== req.body.userId).map(user => user.notifications_token)
  // console.log("@@@@@@@@@@@ NOTIFICTAIONS TOKENS @@@@@@", notificationTokens);
  const cancellingUser = await findUserById(req.body.userId);
  // console.log("CANCELLING USER", cancellingUser);

  const sentNotifications = sendPushNotification(`${cancellingUser.username} has cancelled for ${(new Date(eventData.event_date)).toLocaleDateString('de-DE')}!`, notificationTokens, req.params.eventId);

  res.status(200).json(updatedParticipants)
});

/*
  TODO: Write many many tests and refactor it :)
*/
controller.get("/events", async (req, res) => {
  console.log("-------GETTING EVENT IN CONTROLLER-------")

  const pastEvents = await findMostRecentPastEvent();
  const pastEvent = pastEvents[0] || null;
  const nextEvents = await findNextTwoEvents();
  let eventData = { pastEvent, nextEvents };

  if (pastEvent) {
    const courtPricePast = await findCourtPriceByProviderName(pastEvent.location)

    if (courtPricePast) {
      console.log("COURT PRICE PAST", Number(courtPricePast.price))
      pastEvent.courtPrice = Number(courtPricePast.price)
    }
  }

  if (nextEvents[0]) {
    const courtPriceNext0 = await findCourtPriceByProviderName(nextEvents[0].location)

    if (courtPriceNext0) {
      console.log("COURT PRICE 0", courtPriceNext0)
      nextEvents[0].courtPrice = Number(courtPriceNext0.price);
    }
  }

  if (nextEvents[1]) {
    const courtPriceNext1 = await findCourtPriceByProviderName(nextEvents[1].location)

    if (courtPriceNext1) {
      console.log("COURT PRICE 1", courtPriceNext1)
      nextEvents[1].courtPrice = Number(courtPriceNext1.price)
    }
  }

  if (pastEvent && pastEvent.participants !== null) {
    console.log("-------------EINS-------------", pastEvent)
    const pastEventUserData = await findUsersByIds(pastEvent.participants);
    pastEvent.participants = pastEventUserData.map(user => user.username);
  }
  if (nextEvents.length && nextEvents[0].participants !== null) {
    console.log("-------------VIER-------------")
    const nextEventsUserData0 = await findUsersByIds(nextEvents[0].participants);
    nextEvents[0].participants = nextEventsUserData0.map(user => user.username);
    eventData.nextEvents[0] = nextEvents[0];
  }
  if (nextEvents.length && nextEvents[1] && nextEvents[1].participants !== null) {
    console.log("-------------DREI-------------")
    const nextEventsUserData1 = await findUsersByIds(nextEvents[1].participants);
    nextEvents[1].participants = nextEventsUserData1.map(user => user.username);
    eventData.nextEvents[1] = nextEvents[1];

  }


  console.log("EVENT DATA IN HOME", eventData);
  return res.status(200).json(eventData)

});

controller.get("/events/:eventId/calendar", async (req, res) => {
  console.log("CREATING iCAL Event", req.params.eventId);
  const foundEvent = await findEventById(req.params.eventId);
  console.log("EVENT DATA", foundEvent)

  const value = await createCalendarEvent(foundEvent)
  console.log("VALUE OF CREATE CAL EVE", value)

    res.set('Content-Type', 'text/calendar;charset=utf-8');
    res.set('Content-Disposition', 'attachment; filename="beachen.pro.calendar.my.ics"');
    console.log("iCal String", value);
    return res.send(value);

});

module.exports = controller;
