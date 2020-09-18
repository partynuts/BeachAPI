async function up() {
  await global.client.query(`
      ALTER TABLE users
          ADD COLUMN paypal_username VARCHAR(250)
  `)
}

async function down() {
  await global.client.query('ALTER TABLE users DROP COLUMN paypal_username');
}

module.exports = { up, down };
