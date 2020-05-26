async function up() {
  await global.client.query(`
      CREATE TABLE IF NOT EXISTS users
      (
          id                  SERIAL PRIMARY KEY,
          username            VARCHAR(250),
          email               VARCHAR(250),
          booking_count       INTEGER,
          notifications_token VARCHAR(250)
      );
  `)
}

async function down() {
  await global.client.query('DROP TABLE IF EXISTS users');
}

module.exports = { up, down };
