module.exports = {

  ensureTable() {
    console.log("ENROLLMENTS TABLE");
    return global.client.query(`
        CREATE TABLE IF NOT EXISTS enrollments
        (
            id       SERIAL PRIMARY KEY,
            user_id  INTEGER not null,
            guests   INTEGER,
            event_id INTEGER not null
        )
    `)
  },

  dropTable() {
    return global.client.query(`
        DROP TABLE IF EXISTS enrollments;
    `)
  },

  getNumberOfGuestsForEvent(eventId) {
    console.log("getting all guests")
    return global.client.query(`
        SELECT *
        FROM enrollments
        WHERE $1 = event_id
    `, [eventId])
      .then(res => {
        const result = res.length === 0 ? 0 : res.rows.reduce((acc, currentVal) => {
          return acc + currentVal.guests
        }, 0);
        console.log("RESULT FOR GUESTS", result)
        return result;
      })
  },

  addGuestsToEvent(userId, guests, eventId) {
    return global.client.query(`
        INSERT into enrollments (user_id, guests, event_id)
        VALUES ($1, $2, $3)
        RETURNING *
    `, [username, guests, eventId])
      .then(res => {
        return res.rows[0]
      })
  },

   findUsersByEvent(event) {

    return global.client.query(`
        SELECT *
        FROM users
        LEFT JOIN enrollments
        ON (users.id = enrollments.user_id
        AND enrollments.event_id = $1)
        WHERE users.id
        IN (${(event.participants || []).join()});
    `, [event.id])
  }

};

