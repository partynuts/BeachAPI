const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const morgan = require("morgan");
const requireAll = require("require-dir-all");
const { Client } = require('pg');
const cors = require("cors");


module.exports = async ({ database = "beachapp", connectionString } = {}) => {
  app.use(morgan("dev"));
  app.use(bodyParser.json());

  const dbConfig = connectionString ? { connectionString } :
    {
      user: 'proghany',
      password: 'proghany',
      database
    };
  console.log(dbConfig);
  global.client = new Client(dbConfig);

  const oldPoolQuery = global.client.query;
  global.client.query = (...args) => {
    console.log('QUERY:', args);
    return oldPoolQuery.apply(global.client, args);
  };

  await global.client.connect().catch(console.log);

  app.use(cors());

  Object.values(requireAll("./controllers")).forEach(c => app.use(c));

  return app;
};
process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
});
