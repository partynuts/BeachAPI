const  { findUsersByIds, addBookingCountToUser, getAllUsersWithToken } = require("../models/user-model");
const { sendPushNotification } = require("../models/notification-model")

const { Router } = require("express");
const controller = Router();
const { createEvent, findMostRecentPastEvent, findNextTwoEvents, signUpUserForEvent, cancelUserFromEvent, findEventById } = require("../models/event-model")

controller.post("/events", async (req, res) => {
  console.log("-------CREATING EVENT IN CONTROLLER-------", req.body)

  if (!req.body.event_date) {
    return res.status(400).json({ errorMsg: "Event date is required!" })
  }

  const newEvent = await createEvent(req.body);
  const increasedBookingCount = await addBookingCountToUser();
  console.log("HAS BOOKING COUNT INCREASED FOR ", req.body.creator_id, increasedBookingCount);

  const allUsersWithToken = Array.from(await getAllUsersWithToken());
  console.log("AAAAALL THE USERS WITH TOKEN", allUsersWithToken)
  const notificationTokens = allUsersWithToken.filter(user => user.id !== req.body.creator_id).map(user => user.notifications_token)
  console.log("@@@@@@@@@@@ NOTIFICTAIONS TOKENS @@@@@@", notificationTokens);

  const sentNotifications = sendPushNotification("A new event has been created", notificationTokens, newEvent.id);
  res.status(201).json(newEvent)
});

controller.post("/events/:eventId/signup", async (req, res) => {
  console.log("-------SIGNING UP FOR EVENT IN CONTROLLER-------", req.body)

  if (!req.body.userId || !req.params.eventId) {
    return res.sendStatus(400)
  }
  const foundEvent = await findEventById(req.params.eventId);
  if (!foundEvent) {
    return res.sendStatus(404)
  }
  if (foundEvent.participants && foundEvent.participants.includes(req.body.userId)) {
    return res.status(200).json({msg: "User is already signed up!"})
  }
  const newParticipant = await signUpUserForEvent(req.body.userId, req.params.eventId);
  const userData = await findUsersByIds(newParticipant.participants);
  newParticipant.participants = userData.map(user => user.username);

  console.log("NEW PARTICIPANTS", newParticipant);
  res.status(201).json(newParticipant)
});

controller.post("/events/:eventId/cancel", async (req, res) => {
  console.log("-------CANCELLING FOR EVENT IN CONTROLLER-------", req.body)

  if (!req.body.userId || !req.params.eventId) {
    return res.sendStatus(400)
  }

  const updatedParticipants = await cancelUserFromEvent(req.body.userId, req.params.eventId);
  const userData = await findUsersByIds(updatedParticipants.participants);
  updatedParticipants.participants = userData.map(user => user.username);
  res.status(200).json(updatedParticipants)
});

controller.get("/events", async (req, res) => {
  console.log("-------GETTING EVENT IN CONTROLLER-------")

  const pastEvent = await findMostRecentPastEvent();
  const nextEvents = await findNextTwoEvents();
  let eventData = {pastEvent, nextEvents};

  if (pastEvent[0].participants !== null) {
    console.log("-------------EINS-------------", pastEvent[0])
    const pastEventUserData = await findUsersByIds(pastEvent[0].participants);
    pastEvent[0].participants = pastEventUserData.map(user => user.username);
    eventData.pastEvent = pastEvent[0];
  }
  if (nextEvents[1].participants !== null) {
    console.log("-------------DREI-------------")
    const nextEventsUserData1 = await findUsersByIds(nextEvents[1].participants);
    nextEvents[1].participants = nextEventsUserData1.map(user => user.username);
    eventData.nextEvents[1] = nextEvents[1];
  }
  if (nextEvents[0].participants !== null) {
    console.log("-------------VIER-------------")
    const nextEventsUserData0 = await findUsersByIds(nextEvents[0].participants);
    nextEvents[0].participants = nextEventsUserData0.map(user => user.username);
    eventData.nextEvents[0] = nextEvents[0];
  }

  console.log("EVENT DATA IN HOME",eventData);
  return res.status(200).json(eventData)

});

module.exports = controller;
