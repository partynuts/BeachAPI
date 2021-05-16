const { Pool } = require('pg');
const { PGStorage, migrateInTransaction } = require('@robotty/umzug-postgres-storage');
const Umzug = require('umzug');
const secrets = require('../../secrets.json')
const User = require('./user-model');
const Event = require('./event-model');
const Enrollment = require('./enrollment-model');

module.exports = {
  User,
  Event,
  Enrollment,
  sync: async ({ force } = {}, { database = secrets.DB, connectionString } ) => {
    // const storage = new UmzugStorage({ client: global.client });
    // const umzug = new Umzug({ storage });
    const dbConfig = connectionString ? { connectionString } :
      {
        user: secrets.USER,
        password: secrets.PW,
        database
      };

    let dbPool = new Pool({
      database: dbConfig.database,
      host: "was.muss.hier.hin.com"
    });

    let migrations = await migrateInTransaction(dbPool, async ({ db = dbConfig.database, connectionString } = {}) => {
      let umzug = new Umzug({
        storage: new PGStorage(db),
        migrations: {
          params: [db]
        }
      });

      if (force) {
        return await umzug.down({ to: 0 });
      }

      return await umzug.up();
    });
  }
};
