module.exports = {

  async up() {
    await global.client.query(`
        CREATE TABLE IF NOT EXISTS enrollments
        (
            id       SERIAL PRIMARY KEY,
            user_id  INTEGER not null,
            guests   INTEGER not null DEFAULT 0,
            event_id INTEGER not null
        )
    `)
  },

  async down() {
    await global.client.query(`
        DROP TABLE IF EXISTS enrollments;
    `)
  },
};

