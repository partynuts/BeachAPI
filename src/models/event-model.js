const Event = module.exports = {

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

  // uncaughtException: malformed array literal: "28"
  signUpUserForEvent(userId, eventId) {
    console.log("SIGNING UP FOR EVENT IN DB", userId, eventId)
    return Event.findEventById(eventId).then(res => {
      console.log("RIGHT EVENT?========================", res)
      if (!res.participants) {
        res.participants = [userId]
      } else if (!res.participants.includes(userId)) {
        res.participants.push(userId);
      } else {
        return res;
      }

      return global.client.query(`
          UPDATE events
          SET participants = $1
          WHERE id = $2
          RETURNING *
      `, [res.participants, eventId])
        .then(res => {
          return res.rows[0]
        })
    })

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
