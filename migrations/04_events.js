async function up() {
  await global.client.query(`
      CREATE TABLE IF NOT EXISTS events
      (
          id               SERIAL PRIMARY KEY,
          event_date       timestamptz,
          number_of_fields INTEGER,
          location         VARCHAR(250),
          creator_id       INTEGER,
          participants     INTEGER ARRAY
      );
  `)
}

async function down() {
  await global.client.query('DROP TABLE IF EXISTS events');
}

module.exports = { up, down };
