async function up() {
  await global.client.query(`
      UPDATE users
      SET booking_count = 0
      WHERE booking_count is null
  `)

  await global.client.query(`
      ALTER TABLE users
          ALTER COLUMN booking_count SET DEFAULT 0
  `);

  await global.client.query(`
      ALTER TABLE users
          ALTER COLUMN booking_count SET NOT NULL
  `);
}

async function down() {
  await global.client.query(`
      ALTER TABLE users
          ALTER COLUMN booking_count DROP NOT NULL
  `);
  await global.client.query(`
      ALTER TABLE users
          ALTER COLUMN booking_count DROP DEFAULT
  `);
}

module.exports = { up, down };
