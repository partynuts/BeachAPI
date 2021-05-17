const { Pool } = require("pg");
const {
  PGStorage,
  migrateInTransaction,
} = require("@robotty/umzug-postgres-storage");
const Umzug = require("umzug");
const User = require("./user-model");
const Event = require("./event-model");
const Enrollment = require("./enrollment-model");

let dbPool, poolConnection;

module.exports = {
  User,
  Event,
  Enrollment,
  sync: async ({ force } = {}) => {
    if (!dbPool) {
      dbPool = new Pool(global.client.connectionParameters);
      poolConnection = await dbPool.connect();
    }

    const storage = new PGStorage(poolConnection, {
      tableName: "migrations",
      columnName: "migration_name"
    });
    const umzug = new Umzug({
      migrations: { glob: "migrations/*.js" },
      storage,
    });

    if (force) {
      await umzug.down({ to: 0 });
    }

    await umzug.up();
  },
};
