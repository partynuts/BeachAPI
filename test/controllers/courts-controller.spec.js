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
        .expect([
          {
            id: 5,
            courts_name: 'East61-indoor',
            address: 'Naumannstr. 43, 10829 Berlin',
            telephone: '017699852515',
            time: 'SA/SO 10.30, MO-FR 13.30',
            price: '36'
          },
          {
            id: 6,
            courts_name: 'East61-outdoor',
            address: 'Naumannstr. 43, 10829 Berlin',
            telephone: '017699852515',
            time: 'SA/SO 10.30, MO-FR 13.30',
            price: '22'
          },
          {
            id: 7,
            courts_name: 'Beach61',
            address: 'Gleisdreieck Park (western part)',
            telephone: '01772322461',
            time: 'SA/SO 10.30, MO-FR 13.30',
            price: '22'
          },
          {
            id: 8,
            courts_name: 'BeachMitte-summer',
            address: 'Caroline-Michaelis-Str. 8, 10115 Berlin',
            telephone: 'www.beachmitte.de/angebot/buchung/',
            time: 'all day online',
            price: '19.50'
          },
          {
            id: 9,
            courts_name: 'BeachMitte-winter',
            address: 'Caroline-Michaelis-Str. 8, 10115 Berlin',
            telephone: 'www.beachmitte.de/angebot/buchung/',
            time: 'all day online',
            price: '42'
          },
          {
            id: 10,
            courts_name: 'VP-Friedrichshain',
            address: 'Margarete-Sommer-Str., 10407 Berlin',
            telephone: 'own net',
            time: '24/7',
            price: '0'
          },
          {
            id: 11,
            courts_name: 'Jungfernheide See',
            address: 'Volkspark Jungfernheide, 13629 Berlin',
            telephone: 'own net',
            time: '24/7',
            price: '0'
          }
        ])
    })
  });
});

