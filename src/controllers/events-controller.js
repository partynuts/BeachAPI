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
  console.log("NEW PARTICIPANTS", newParticipant);
  res.status(201).json(newParticipant)

});

controller.get("/events", async (req, res) => {
  console.log("-------GETTING EVENT IN CONTROLLER-------")

  const pastEvent = await findMostRecentPastEvent();
  const nextEvents = await findNextTwoEvents();
  const eventsData = {pastEvent, nextEvents};
  console.log(eventsData)
  return res.status(200).json(eventsData)
});

module.exports = controller;
