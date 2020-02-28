module.exports = {

  ensureTable() {
    console.log("DATENBANKEN")
    return global.client.query(`
        CREATE TABLE IF NOT EXISTS users
        (
            id       SERIAL PRIMARY KEY,
            username VARCHAR(250),
            email    VARCHAR(250)
        );
    `);
  },

  dropTable() {
    return global.client.query(`
        DROP TABLE IF EXISTS users;
    `)
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
