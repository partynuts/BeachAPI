const user = module.exports = {
  updateUser(data, userId) {
    const fragment = Object.entries(data) //date = Objekt mit notifications_token als key und value = x
      .map(([key, value]) => `${key} = '${value}'`)
      .join(', ');

    return global.client.query(`
        UPDATE users
        SET ${fragment}
        WHERE id = $1
        RETURNING *
    `, [userId]).then(res => {
      return res.rows[0]
    })
  },

  addBookingCountToUser(userId) {
    console.log("INCREASING COUNT OF USER IN DB")
    return global.client.query(`
        UPDATE users
        SET booking_count = booking_count + 1
        WHERE id = $1
    `, [userId])
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

  getAllUsersWithToken() {
    console.log("####GETTING USERS WITH TOKENS####")
    return global.client.query(`
        SELECT *
        FROM users
        WHERE notifications_token IS NOT NULL
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
                WHERE lower(email) = $1
      `,
      [email.toLowerCase()])
      .then(res => {
        return res.rows[0];
      });
  },

  findUsersByIds(participantsIds) {
    if (participantsIds.length > 0) {
      return global.client.query(`
                SELECT *
                FROM users
                WHERE id IN (${participantsIds.join()})
      `)
        .then(res => {
          return res.rows;
        })
    } else {
      return [];
    }
  },

  findUserById(userId) {
    return user.findUsersByIds([userId])
      .then(res => {
        return res[0];
      })
  },

  findUserByEmailAndUsername(username, email) {
    console.log("FINDING USER BY NAME AND MAIL", username, email)
    return global.client.query(`
                SELECT *
                FROM users
                WHERE lower(username) = $1
                  AND lower(email) = $2
      `,
      [username.toLowerCase(), email.toLowerCase()])
      .then(res => {
        console.log("RESPONSE FROM FINDING USER", res)
        return res.rows[0];
      })
  },

  createUser({ username, email, paypal_username }) {
    return global.client.query(`
        INSERT into users (username, email, paypal_username)
        VALUES ($1, $2, $3)
        RETURNING *
    `, [username, email, paypal_username || null])
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
