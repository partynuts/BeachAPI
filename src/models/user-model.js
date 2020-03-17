module.exports = {

  ensureTable() {
    return global.client.query(`
        CREATE TABLE IF NOT EXISTS users
        (
            id       SERIAL PRIMARY KEY,
            username VARCHAR(250),
            email    VARCHAR(250),
            booking_count INTEGER
        );
    `);
  },

  dropTable() {
    return global.client.query(`
        DROP TABLE IF EXISTS users;
    `)
  },

  addBookingCountToUser() {
    console.log("INCREASING COUNT OF USER IN DB")
    return global.client.query(`
        UPDATE users
        SET booking_count = booking_count + 1
    `)
      .then(res => {
        return res.rows[0]
      })
  },

  getAllUsers() {
    return global.client.query(`
                SELECT *
                FROM users
      `)
      .then(res => {
        return res.rows;
      })
  },

  findUserByUsername(username) {
    return global.client.query(`
                SELECT *
                FROM users
                WHERE username = $1
      `,
      [username])
      .then(res => {
        return res.rows[0];
      })
  },

  findUserByEmail(email) {
    return global.client.query(`
                SELECT *
                FROM users
                WHERE email = $1
      `,
      [email])
      .then(res => {
        return res.rows[0];
      })
  },

  findUserById(participantsIds) {
    return global.client.query(`
                SELECT *
                FROM users
                WHERE id IN (${participantsIds.join()})
      `)
      .then(res => {
        return res.rows;
      })
  },

  findUserByEmailAndUsername(username, email) {
    return global.client.query(`
                SELECT *
                FROM users
                WHERE username = $1 AND email = $2
      `,
      [username, email])
      .then(res => {
        return res.rows[0];
      })
  },

  createUser({username, email}) {
    return global.client.query(`
        INSERT into users (username, email)
        VALUES ($1, $2)
        RETURNING *
    `, [username, email])
      .then(res => {
        return res.rows[0]
      })
  },

  findAll() {
    return global.client.query(`
        SELECT *
        FROM users
    `)
      .then(res => {
        return res.rows;
      })
  }
}
