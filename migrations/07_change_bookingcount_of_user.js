async function up() {
  await global.client.query(`
      ALTER TABLE users
      ALTER COLUMN booking_count SET NOT NULL
  `);

  await global.client.query(`
      ALTER TABLE users
      ALTER COLUMN booking_count SET DEFAULT 0
  `);
}

async function down() {
  await global.client.query(`
      ALTER TABLE users
      ALTER COLUMN booking_count DROP NOT NULL
  `);
  await global.client.query(`
      ALTER TABLE users
      ALTER COLUMN booking_count DROP  DEFAULT
  `);
}

module.exports = { up, down };
