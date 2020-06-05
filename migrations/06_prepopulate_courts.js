async function up() {
   await global.client.query(`
  INSERT into courts (courts_name, address, telephone, time, price)
  VALUES ('East61-indoor', 'Naumannstr. 43, 10829 Berlin', '017699852515', 'SA/SO 10.30, MO-FR 13.30', 36),
        ('Beach61', 'Gleisdreieck Park (western part)', '01772322461', 'SA/SO 10.30, MO-FR 13.30', 20)
  `)
}

async function down() {
}

module.exports = { up, down };
