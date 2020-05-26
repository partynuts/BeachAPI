const ics = require('ics');
const SIGNUP_ALLOWED = 'signupAllowed';
const SIGNUP_FORBIDDEN_MAX_REACHED = 'signupForbiddenMaxReached';
const SIGNUP_FORBIDDEN_ALREADY_SIGNED_UP = 'signupForbiddenAlreadySignedUp';
const { findCourtProviderByName } = require("../models/court-model");
const { getNumberOfGuestsForEvent } = require("../models/enrollment-model");

const Event = module.exports = {
  SIGNUP_ALLOWED, SIGNUP_FORBIDDEN_ALREADY_SIGNED_UP, SIGNUP_FORBIDDEN_MAX_REACHED,

  ensureTable() {
    console.log("EVENTS TABLE")
    return global.client.query(`
        CREATE TABLE IF NOT EXISTS events
        (
            id               SERIAL PRIMARY KEY,
            event_date       timestamptz,
            number_of_fields INTEGER,
            location         VARCHAR(250),
            creator_id       INTEGER,
            participants     INTEGER ARRAY
        );
    `);
  },

  dropTable() {
    return global.client.query(`
        DROP TABLE IF EXISTS events;
    `)
  },

  createEvent({ event_date, number_of_fields, location, creator_id }) {
    console.log("CREATING EVENT IN DB")
    return global.client.query(`
        INSERT into events (event_date, number_of_fields, location, creator_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `, [event_date, number_of_fields, location, creator_id])
      .then(res => {
        return res.rows[0]
      })
  },

  findMostRecentPastEvent() {
    return global.client.query(`
        SELECT *
        FROM events
        WHERE event_date < NOW()
        ORDER BY event_date DESC
        LIMIT 1
    `)
      .then(res => {
        console.log("-------------Vergangenes EVENT----------------", res.rows, "---------------------------")
        return res.rows;
      })
  },

  findNextTwoEvents() {
    return global.client.query(`
        SELECT *
        FROM events
        WHERE event_date > NOW()
        ORDER BY event_date ASC
    `)
      .then(res => {
        console.log("-------------EVENTS NACH JETZT----------------", res.rows, "---------------------------")
        return res.rows.slice(0, 2);
      })
  },

  cancelUserFromEvent(userId, eventId) {
    console.log("Cancelling FOR EVENT IN DB", userId, eventId)
    return Event.findEventById(eventId).then(res => {
      return global.client.query(`
          UPDATE events
          SET participants = array_remove(participants, $1)
          WHERE id = $2
          RETURNING *
      `, [userId, eventId])
        .then(res => {
          console.log("NEUE TEILNEHMER", res.rows[0])
          return res.rows[0]
        })
    })
  },

  signUpUserForEvent(userId, event) {
    console.log("SIGNING UP FOR EVENT IN DB", userId, event)


    if (!event.participants) {
      event.participants = [userId]
    } else {
      event.participants.push(userId);
    }

    return global.client.query(`
        UPDATE events
        SET participants = $1
        WHERE id = $2
        RETURNING *
    `, [event.participants, event.id])
      .then(res => {
        return res.rows[0]
      })
  },

  async checkIfSignUpStillPossible(userId, event) {
    console.log("Checking sign UP FOR EVENT IN DB", userId, event)

    console.log("RIGHT EVENT?========================", event)

    const participationCondition = [
      {
        numberOfFields: 1,
        maxNumberOfParticipants: 3
      },
      {
        numberOfFields: 2,
        maxNumberOfParticipants: 3
      },
      {
        numberOfFields: 3,
        maxNumberOfParticipants: 3
      },
      {
        numberOfFields: 4,
        maxNumberOfParticipants: 3
      }
    ];

    const guests = await getNumberOfGuestsForEvent(event.id);
    console.log("GUESTS IN EVENTS MODEL", guests);

    // const participantsAllowed = !!(participationCondition.filter(config => event.number_of_fields === config.numberOfFields && (event.participants || []).length < config.maxNumberOfParticipants)).length
    const participantsAllowed = !!(participationCondition.filter(config => {
      const matchingNumberOfFields = event.number_of_fields === config.numberOfFields;
      const numberTotalParticipants = (event.participants || []).length + guests;
      return matchingNumberOfFields && numberTotalParticipants < config.maxNumberOfParticipants;
    })).length;

    const numberOfAllowedParticipants = participationCondition.filter(config => {
      const matchingNumberOfFields = event.number_of_fields === config.numberOfFields;
      const numberTotalParticipants = (event.participants || []).length + guests;
      return matchingNumberOfFields && numberTotalParticipants < config.maxNumberOfParticipants;
    });

    console.log("+++++++ RESULT OF FILTER ++++++++", numberOfAllowedParticipants);

    console.log("********* Participants still allowed? ********", participantsAllowed)

    if (!event.participants) {
      return SIGNUP_ALLOWED;
    } else if (event.participants.includes(userId)) {
      return SIGNUP_FORBIDDEN_ALREADY_SIGNED_UP
    } else if (!participantsAllowed) {
      return SIGNUP_FORBIDDEN_MAX_REACHED
    } else {
      return SIGNUP_ALLOWED;
    }

  },

  async checkIfGuestSignupPossible(event) {
    console.log("Checking sign UP FOR GUEST IN EVENT IN DB", event)

    const participationConditions = [
      {
        numberOfFields: 1,
        maxNumberOfParticipants: 3
      },
      {
        numberOfFields: 2,
        maxNumberOfParticipants: 3
      },
      {
        numberOfFields: 3,
        maxNumberOfParticipants: 3
      },
      {
        numberOfFields: 4,
        maxNumberOfParticipants: 3
      }
    ];

    const guests = await getNumberOfGuestsForEvent(event.id);
    const numberTotalParticipants = (event.participants || []).length + guests;
    console.log("GUESTS IN EVENTS MODEL", guests);

    const participationCondition = (participationConditions.filter(config => {
      const matchingNumberOfFields = event.number_of_fields === config.numberOfFields;
      return matchingNumberOfFields && numberTotalParticipants < config.maxNumberOfParticipants;
    }))[0];
    const numberOfAvailableSeats = participationCondition.maxNumberOfParticipants - numberTotalParticipants;

    const participantsAllowed = participationCondition !== undefined;

    console.log("********* Participants still allowed? ********", participantsAllowed)

    if (!event.participants) {
      return {result: SIGNUP_ALLOWED, numberOfAvailableSeats};
    } else if (!participantsAllowed) {
      return {result: SIGNUP_FORBIDDEN_MAX_REACHED, numberOfAvailableSeats}
    } else {
      return {result: SIGNUP_ALLOWED, numberOfAvailableSeats};
    }
  },

  findEventById(eventId) {
    return global.client.query(`
        SELECT *
        FROM events
        WHERE $1 = id
    `, [eventId])
      .then(res => {
        return res.rows[0];
      })
  },

  async createCalendarEvent(event) {
    console.log("TYPE", typeof event.event_date)
    const courtLocation = await findCourtProviderByName(event.location);
    console.log("******** LOCATION COURT", courtLocation);

    const startDay = event.event_date.getDate()
    const startMonth = event.event_date.getMonth() + 1;
    const startYear = event.event_date.getFullYear()
    const startHour = event.event_date.getHours()
    const startMinute = event.event_date.getMinutes()
    console.log("EVENT START DAY", startDay, startMonth,startYear, startHour, startMinute);
    console.log("TYPE OF START DAY", typeof startDay);

    const calEvent = {
      start: [startYear, startMonth, startDay, startHour, startMinute],
      // end: [2020, 5, 1, 8, 30],
      duration: { hours: 2, minutes: 0 },
      title: 'Beach-Time',
      description: 'weekly Beachvolleyball fun',
      location: `${event.location}, ${courtLocation.address}`,
      url: 'http://www.beach61.com/',
      // geo: { lat: 40.0095, lon: 105.2669 },
      alarms: [{ action: 'display', trigger: { hours: 2, minutes: 30, before: true }},
        { action: 'display', trigger: { hours: 24, minutes: 0, before: true }}]
    };
    console.log("CALENDAR EVENT OBJECT", calEvent);
    console.log("EVENT START", calEvent.start);
    return new Promise((resolve, reject) => {
      const iCal = ics.createEvent(calEvent, (error, value) => {
        if (error) {
          console.log(error)
          return reject(error)
        }
        console.log("iCal Event value", value)
        resolve(value)
      });
    });
  }
};
