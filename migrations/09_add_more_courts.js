async function up() {

  await global.client.query(`
  DELETE FROM courts;
  `);

  await global.client.query(`
  INSERT into courts (courts_name, address, telephone, time, price)
  VALUES ('East61-indoor', 'Naumannstr. 43, 10829 Berlin', '017699852515', 'SA/SO 10.30, MO-FR 13.30', 36),
         ('East61-outdoor', 'Naumannstr. 43, 10829 Berlin', '017699852515', 'SA/SO 10.30, MO-FR 13.30', 22),
        ('Beach61', 'Gleisdreieck Park (western part)', '01772322461', 'SA/SO 10.30, MO-FR 13.30', 22),
        ('BeachMitte-summer', 'Caroline-Michaelis-Str. 8, 10115 Berlin', 'www.beachmitte.de/angebot/buchung/', 'all day online', 19.50),
        ('BeachMitte-winter', 'Caroline-Michaelis-Str. 8, 10115 Berlin', 'www.beachmitte.de/angebot/buchung/', 'all day online', 42),
        ('VP-Friedrichshain', 'Margarete-Sommer-Str., 10407 Berlin', 'own net', '24/7', 0),
        ('Jungfernheide See', 'Volkspark Jungfernheide, 13629 Berlin', 'own net', '24/7', 0)
  `);

}

async function down() {
}

module.exports = { up, down };

