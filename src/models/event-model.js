module.exports = {

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
            participants     integer[]
        );
    `);
  },

  dropTable() {
    return global.client.query(`
        DROP TABLE IF EXISTS events;
    `)
  },

  createEvent({ eventDate, numberOfFields, location, userId }) {
    console.log("CREATING EVENT IN DB")
    return global.client.query(`
        INSERT into events (event_date, number_of_fields, location, creator_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `, [eventDate, numberOfFields, location, userId])
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
        return res.rows;
      })
  }
};
