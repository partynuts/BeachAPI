const User = require('./user-model');
const Event = require('./event-model');
const models = [User, Event];

module.exports = {
  User,
  Event,
  sync: async ({ force } = {}) => {
    if (force) {
      await models.map(async model => await model.dropTable());
    }

    await models.map(async model => await model.ensureTable());
  }
};
