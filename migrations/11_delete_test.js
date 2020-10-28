async function up() {
  await global.client.query('DROP TABLE IF EXISTS courts2');
}

async function down() {

}

module.exports = { up, down };
