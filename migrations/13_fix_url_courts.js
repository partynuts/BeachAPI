async function up() {

  await global.client.query(`
  DELETE FROM courts;
  `);

  await global.client.query(`
  INSERT into courts (courts_name, address, telephone, time, price)
  VALUES ('East61-indoor', 'Naumannstr. 43, 10829 Berlin', 'www.eversports.de/s/east61', 'all day online', 36),
         ('East61-outdoor', 'Naumannstr. 43, 10829 Berlin', 'www.eversports.de/s/east61', 'all day online', 22),
        ('Beach61', 'Gleisdreieck Park (western part)', 'www.eversports.de/s/beach61-neu', 'all day online', 22),
        ('BeachMitte-summer', 'Caroline-Michaelis-Str. 8, 10115 Berlin', 'www.beachmitte.de/angebot/buchung/', 'all day online', 19.50),
        ('BeachMitte-winter', 'Caroline-Michaelis-Str. 8, 10115 Berlin', 'www.beachmitte.de/angebot/buchung/', 'all day online', 42),
        ('VP-Friedrichshain', 'Margarete-Sommer-Str., 10407 Berlin', 'own net', '24/7', 0),
        ('Jungfernheide See', 'Volkspark Jungfernheide, 13629 Berlin', 'own net', '24/7', 0)
  `);

}

async function down() {
}

module.exports = { up, down };

