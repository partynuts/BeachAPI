const { Router } = require("express");
const controller = Router();
const ics = require('ics');
const { writeFileSync } = require('fs')
const {
  createEvent,
  checkIfSignUpStillPossible,
  findMostRecentPastEvent,
  findNextTwoEvents,
  signUpUserForEvent,
  cancelUserFromEvent,
  findEventById,
  SIGNUP_ALLOWED, SIGNUP_FORBIDDEN_ALREADY_SIGNED_UP, SIGNUP_FORBIDDEN_MAX_REACHED
} = require("../models/event-model")
const {
  findUsersByIds,
  addBookingCountToUser,
  getAllUsersWithToken,
  findUserById
} = require("../models/user-model");
const { findCourtProviderByName } = require("../models/court-model");
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

controller.get("/events", async (req, res) => {
  console.log("-------GETTING EVENT IN CONTROLLER-------")

  const pastEvent = await findMostRecentPastEvent();
  const nextEvents = await findNextTwoEvents();
  let eventData = { pastEvent, nextEvents };

  const courtPricePast = await findCourtProviderByName(pastEvent[0].location)
  console.log("COURT PRICE PAST", courtPricePast.price)
  pastEvent[0].courtPrice = courtPricePast.price
  const courtPriceNext0 = await findCourtProviderByName(nextEvents[0].location)
  console.log("COURT PRICE 0", courtPriceNext0)
  nextEvents[0].courtPrice = courtPriceNext0.price;
  const courtPriceNext1 = await findCourtProviderByName(nextEvents[1].location)
  console.log("COURT PRICE 1", courtPriceNext1)
  nextEvents[1].courtPrice = courtPriceNext1.price

  if (pastEvent.length && pastEvent[0].participants !== null) {
    console.log("-------------EINS-------------", pastEvent[0])
    const pastEventUserData = await findUsersByIds(pastEvent[0].participants);
    pastEvent[0].participants = pastEventUserData.map(user => user.username);
    eventData.pastEvent = pastEvent[0];

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

controller.get("/events/:eventid/calendar", async (req, res) => {
  console.log("CREATING iCAL Event");
  const event = {
    start: [2020, 5, 1, 6, 30],
    end: [2020, 5, 1, 8, 30],
    // duration: { hours: 6, minutes: 30 },
    title: 'Bitch-Time',
    description: 'weekly bitchy with the bitches',
    location: 'East61',
    url: 'http://www.beach61.com/',
    // geo: { lat: 40.0095, lon: 105.2669 },
    attendees: [
      { name: 'Parinaz', email: 'parinazroghany@yahoo.de' }
    ]
  };

  const iCal = ics.createEvent(event, (error, value) => {
    if (error) {
      console.log(error)
      return
    }
    console.log("iCal Event value", value)
    // return res.status(200).json(value)

    res.set('Content-Type', 'text/calendar;charset=utf-8');
    res.set('Content-Disposition', 'attachment; filename="bitchen.pro.calendar.my.ics"');
    console.log("iCal String", value)
    return res.send(value);
  });


});

// controller.get("/events/:eventid/calendar", async (req, res) => {
//   BEGIN:VCALENDAR
//   VERSION:2.0
//   PRODID:http://www.example.com/calendarapplication/
//     METHOD:PUBLISH
//   BEGIN:VTIMEZONE
//   TZID:Europe/Berlin
//   BEGIN:STANDARD
//   DTSTART:16011028T030000
//   RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10
//   TZOFFSETFROM:+0200
//   TZOFFSETTO:+0100
//   END:STANDARD
//   BEGIN:DAYLIGHT
//   DTSTART:16010325T020000
//   RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3
//   TZOFFSETFROM:+0100
//   TZOFFSETTO:+0200
//   END:DAYLIGHT
//   END:VTIMEZONE
//   BEGIN:VEVENT
//   UID:461092315540@example.com
//   ORGANIZER;CN="Alice Balder, Example Inc.":MAILTO:alice@example.com
//   LOCATION:Irgendwo
//   GEO:48.85299;2.36885
//   SUMMARY:Eine Kurzinfo
//   DESCRIPTION:Beschreibung des Termines
//   CLASS:PUBLIC
//   DTSTART;TZID=Europe/Berlin:20200910T220000Z
//   DTEND;TZID=Europe/Berlin:20200919T215900Z
//   DTSTAMP;TZID=Europe/Berlin:20200812T125900Z
//   END:VEVENT
//   END:VCALENDAR
// })

module.exports = controller;
