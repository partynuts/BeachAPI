const request = require("supertest");
const notification = require("../../src/models/notification-model");
const sinon = require("sinon");
const App = require("../../src/app");
const { Event, User, sync } = require("../../src/models");
const { expect } = require("chai");

describe("courts controller", () => {
  let app;

  beforeEach(async () => {
    app = await App({ connectionString: process.env.DATABASE_URL, database: "beachapptest" });

    await sync({ force: true });
  });

  afterEach(() => global.client.end());

  describe("GET /courtsinfo", () => {
    it("returns all the info regarding the courts available", async () => {
      await request(app)
        .get("/courtsinfo")
        .expect(200)
        .expect([ { id: 1,
          courts_name: 'East61-indoor',
          address: 'Naumannstr. 43, 10829 Berlin',
          telephone: '017699852515',
          time: 'SA/SO 10.30, MO-FR 13.30',
          price: '36' },
          { id: 2,
            courts_name: 'Beach61',
            address: 'Gleisdreieck Park (western part)',
            telephone: '01772322461',
            time: 'SA/SO 10.30, MO-FR 13.30',
            price: '20' },
          { id: 3,
            courts_name: 'East61-indoor',
            address: 'Naumannstr. 43, 10829 Berlin',
            telephone: '017699852515',
            time: 'SA/SO 10.30, MO-FR 13.30',
            price: '36' },
          { id: 4,
            courts_name: 'Beach61',
            address: 'Gleisdreieck Park (western part)',
            telephone: '01772322461',
            time: 'SA/SO 10.30, MO-FR 13.30',
            price: '20' } ])
    })
  });
});

