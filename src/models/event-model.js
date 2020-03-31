const SIGNUP_ALLOWED = 'signupAllowed';
const SIGNUP_FORBIDDEN_MAX_REACHED = 'signupForbiddenMaxReached';
const SIGNUP_FORBIDDEN_ALREADY_SIGNED_UP = 'signupForbiddenAlreadySignedUp';

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

  checkIfSignUpStillPossible(userId, event) {
    console.log("Checking sign UP FOR EVENT IN DB", userId, event)

        console.log("RIGHT EVENT?========================", event)

        const participationCondition = [
          {
            numberOfFields: 1,
            maxNumberOfParticipants: 2
          },
          {
            numberOfFields: 2,
            maxNumberOfParticipants: 10
          },
          {
            numberOfFields: 3,
            maxNumberOfParticipants: 1
          },
          {
            numberOfFields: 4,
            maxNumberOfParticipants: 2
          }
        ];

        const participantsAllowed = !!(participationCondition.filter(config => event.number_of_fields === config.numberOfFields && (event.participants || []).length < config.maxNumberOfParticipants)).length

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

  findEventById(eventId) {
    return global.client.query(`
        SELECT *
        FROM events
        WHERE $1 = id
    `, [eventId])
      .then(res => {
        return res.rows[0];
      })
  }
};
