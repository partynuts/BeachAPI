const Umzug  = require('umzug');
const UmzugStorage = require('umzug-pg-storage');

const User = require('./user-model');
const Event = require('./event-model');
const Enrollment = require('./enrollment-model');

module.exports = {
  User,
  Event,
  Enrollment,
  sync: async ({ force } = {}) => {
    const storage = new UmzugStorage({ client: global.client });
    const umzug = new Umzug({ storage });

    if (force) {
      await umzug.down({ to: 0 });
    }

    await umzug.up();
  }
};
