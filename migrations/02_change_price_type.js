async function up() {
  await global.client.query(`
      ALTER TABLE courts2 
          ALTER COLUMN price TYPE MONEY
          `)
}

async function down() {
  await global.client.query('ALTER TABLE courts2 ALTER COLUMN price TYPE DECIMAL');
}

module.exports = { up, down };
