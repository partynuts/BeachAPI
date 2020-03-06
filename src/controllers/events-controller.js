const { Router } = require("express");
const controller = Router();
const { createEvent, findMostRecentPastEvent } = require("../models/event-model")

controller.post("/events", async (req, res) => {
  console.log("-------CREATING EVENT IN CONTROLLER-------")

  if (!req.body.eventDate) {
    return res.status(400).json({ errorMsg: "Event date is required!" })
  }

  const newEvent = await createEvent(req.body);
  res.status(201).json(newEvent)

});

controller.get("/events", async (req, res) => {
  console.log("-------GETTING EVENT IN CONTROLLER-------")

  if (req.query.filter === "past") {

    const pastEvent = await findMostRecentPastEvent();
    return res.json(pastEvent)
  }
});

module.exports = controller;
