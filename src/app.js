const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const morgan = require("morgan");
const requireAll = require("require-dir-all");
const { Client } = require("pg");
const cors = require("cors");

module.exports = async ({ database = "beachapp", connectionString } = {}) => {
  // app.use(morgan("dev"));
  app.use(bodyParser.json());
  console.log("CONNECTING")
  const dbConfig = connectionString
    ? { connectionString, ssl: true }
    : {
      user: process.env.USER,
      password: process.env.PASSWORD,
      database
    };
  console.log("dbConfig", dbConfig)

  global.client = new Client(dbConfig);
  const oldPoolQuery = global.client.query;
  console.log("oldPoolQuery", oldPoolQuery)

  global.client.query = (...args) => {
    console.log("QUERY:", args);
    return oldPoolQuery.apply(global.client, args);
  };
  console.log("BEFORE CONNECT")
  try {
    await global.client.connect().catch(console.log);
    console.log("AFTER CONNECT")
  } catch (e) {
    console.log("ERROR", e)
  }

  app.use(cors());

  Object.values(requireAll("./controllers")).forEach((c) => app.use(c));

  return app;
};
process.on("unhandledRejection", (reason, p) => {
  console.error("Unhandled Rejection at: Promise", p, "reason:", reason);
});
