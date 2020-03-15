const  { findUserById } = require("../models/user-model");

const { Router } = require("express");
const controller = Router();
const { createEvent, findMostRecentPastEvent, findNextTwoEvents, signUpUserForEvent, findEventById } = require("../models/event-model")

controller.post("/events", async (req, res) => {
  console.log("-------CREATING EVENT IN CONTROLLER-------", req.body)

  if (!req.body.event_date) {
    return res.status(400).json({ errorMsg: "Event date is required!" })
  }

  const newEvent = await createEvent(req.body);
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
  const userData = await findUserById(newParticipant.participants);
  newParticipant.participants = userData.map(user => user.username);

  console.log("NEW PARTICIPANTS", newParticipant);
  res.status(201).json(newParticipant)
});

controller.get("/events", async (req, res) => {
  console.log("-------GETTING EVENT IN CONTROLLER-------")

  const pastEvent = await findMostRecentPastEvent();
  const nextEvents = await findNextTwoEvents();
  let eventData = {pastEvent, nextEvents};

  if (pastEvent[0].participants !== null) {
    console.log("-------------EINS-------------", pastEvent[0])
    const pastEventUserData = await findUserById(pastEvent[0].participants);
    pastEvent.participants = pastEventUserData.map(user => user.username);
    eventData.pastEvent = pastEvent;
  }
  if (nextEvents[1].participants !== null) {
    console.log("-------------DREI-------------")
    const nextEventsUserData1 = await findUserById(nextEvents[1].participants);
    nextEvents[1].participants = nextEventsUserData1.map(user => user.username);
    eventData.nextEvents[1] = nextEvents[1];
  }
  if (nextEvents[0].participants !== null) {
    console.log("-------------VIER-------------")
    const nextEventsUserData0 = await findUserById(nextEvents[0].participants);
    nextEvents[0].participants = nextEventsUserData0.map(user => user.username);
    eventData.nextEvents[0] = nextEvents[0];
  }

  console.log("EVENT DATA IN HOME",eventData);
  return res.status(200).json(eventData)
  //
  // if (pastEvent[0].participants === null || nextEvents[0].participants === null || nextEvents[1].participants === null) {
  //   console.log("NO PARTICIPANTS")
  //   const eventsData = {pastEvent, nextEvents};
  //
  //   console.log("EVENTS DATA IN GETTING EVENTS", eventsData);
  //   return res.status(200).json(eventsData)
  // } else {
  //   console.log("LOOKING FOR PARTICIPANTS", pastEvent, "NEXT EVENTS", nextEvents)
  //   const pastEventUserData = await findUserById(pastEvent[0].participants);
  //   // const nextEventsUserData = await findUserById(nextEvents.participants);
  //   pastEvent.participants = pastEventUserData.map(user => user.username);
  //   // nextEvents.participants = nextEventsUserData.map(user => user.username);
  //
  //   const eventsData = {pastEvent, nextEvents};
  //   console.log("EVENTS DATA IN GETTING EVENTS", eventsData);
  //   return res.status(200).json(eventsData)
  // }
});

module.exports = controller;
