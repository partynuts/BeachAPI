const User = require('./user-model');
const models = [User];

module.exports = {
  User,
  sync: async ({ force } = {}) => {
    if (force) {
      await models.map(async model => await model.dropTable());
    }

    await models.map(async model => await model.ensureTable());
  }
};
