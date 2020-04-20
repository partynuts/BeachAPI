
async function up() {
  await global.client.query(`
        CREATE TABLE IF NOT EXISTS courts2
        (
            id               SERIAL PRIMARY KEY,
            courts_name      VARCHAR(250),
            address          VARCHAR(250),
            telephone        VARCHAR(250),
            time             VARCHAR(250),
            price            DECIMAL
        )
    `)
}

async function down() {
  await global.client.query('DROP TABLE courts2');
}

module.exports = { up, down };
