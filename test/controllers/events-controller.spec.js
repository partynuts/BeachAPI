const request = require("supertest");
const App = require("../../src/app");
const { Event, User, sync } = require("../../src/models");
const { expect } = require("chai");

describe("events controller", () => {
  let app;

  beforeEach(async () => {
    app = await App({ connectionString: process.env.DATABASE_URL, database: "beachapptest" });

    await sync({ force: true });
  });

  afterEach(() => global.client.end());

  describe("GET /events", () => {
    it("returns empty arrays if no events have been created yet", () =>
      request(app)
        .get("/events")
        .expect(200)
        .expect({
          pastEvent: null,
          nextEvents: []
        }));

    it("returns the only existing upcoming event", async () => {
      const nextEvents = [
        await Event.createEvent({
          event_date: new Date("2120/04/15"),
          number_of_fields: 2,
          location: "irgendwo",
          creator_id: 1,
        }),
      ];

      await request(app)
        .get("/events")
        .expect(200)
        .expect({
          pastEvent: null,
          nextEvents: [
            {
              id: 1,
              event_date: "2120-04-14T22:00:00.000Z",
              number_of_fields: 2,
              location: "irgendwo",
              creator_id: 1,
              participants: null,
            },
          ],
        });
    });

    it("returns events if any are available", async () => {
      const pastEvent = await Event.createEvent({
        event_date: new Date("2020/03/15"),
        number_of_fields: 2,
        location: "irgendwo",
        creator_id: 1
      });

      const nextEvents = [
        await Event.createEvent({
          event_date: new Date("2120/04/15"),
          number_of_fields: 2,
          location: "irgendwo",
          creator_id: 1
        }),

        await Event.createEvent({
          event_date: new Date("2120/04/16"),
          number_of_fields: 2,
          location: "irgendwo",
          creator_id: 1
        }),
        await Event.createEvent({
          event_date: new Date("2120/04/17"),
          number_of_fields: 2,
          location: "irgendwo",
          creator_id: 1
        })
      ];

      await request(app)
        .get("/events")
        .expect(200)
        .expect({
          pastEvent:
            {
              id: 1,
              event_date: "2020-03-14T23:00:00.000Z",
              number_of_fields: 2,
              location: "irgendwo",
              creator_id: 1,
              participants: null
            },
          nextEvents: [
            {
              id: 2,
              event_date: "2120-04-14T22:00:00.000Z",
              number_of_fields: 2,
              location: "irgendwo",
              creator_id: 1,
              participants: null
            },
            {
              id: 3,
              event_date: "2120-04-15T22:00:00.000Z",
              number_of_fields: 2,
              location: "irgendwo",
              creator_id: 1,
              participants: null
            }
          ]
        });
    });

    it("resolves the participants names if any are available", async () => {
      const user = await User.createUser({
        username: "somebody",
        email: "some@body.com"
      });
      const otherUser = await User.createUser({
        username: "somebody else",
        email: "somebody@else.com"
      });

      const pastEvent = await Event.createEvent({
        event_date: new Date("2020/03/15"),
        number_of_fields: 2,
        location: "irgendwo",
        creator_id: user.id
      });
      await Event.signUpUserForEvent(otherUser.id, pastEvent);

      await request(app)
        .get("/events")
        .expect(200)
        .expect({
          pastEvent: {
            id: 1,
            event_date: "2020-03-14T23:00:00.000Z",
            number_of_fields: 2,
            location: "irgendwo",
            creator_id: user.id,
            participants: ["somebody else"]
          },
          nextEvents: []
        });
    });

    it('can handle removed participants', async () => {
      const user = await User.createUser({
        username: "somebody",
        email: "some@body.com"
      });
      const otherUser = await User.createUser({
        username: "somebody else",
        email: "somebody@else.com"
      });

      const pastEvent = await Event.createEvent({
        event_date: new Date("2020/03/15"),
        number_of_fields: 2,
        location: "irgendwo",
        creator_id: user.id
      });
      await Event.signUpUserForEvent(otherUser.id, pastEvent);
      await Event.cancelUserFromEvent(otherUser.id, pastEvent.id)

      await request(app)
        .get("/events")
        .expect(200)
        .expect({
          pastEvent: {
            id: 1,
            event_date: "2020-03-14T23:00:00.000Z",
            number_of_fields: 2,
            location: "irgendwo",
            creator_id: user.id,
            participants: []
          },
          nextEvents: []
        });
    });

    it('should return participants for next events', async () => {
      const nextEvents = [
        await Event.createEvent({
          event_date: new Date("2120/04/15"),
          number_of_fields: 2,
          location: "irgendwo",
          creator_id: 1
        }),

        await Event.createEvent({
          event_date: new Date("2120/04/16"),
          number_of_fields: 2,
          location: "irgendwo",
          creator_id: 1
        }),
        await Event.createEvent({
          event_date: new Date("2120/04/17"),
          number_of_fields: 2,
          location: "irgendwo",
          creator_id: 1
        })
      ];

      const user = await User.createUser({
        username: "somebody",
        email: "some@body.com"
      });
      const otherUser = await User.createUser({
        username: "somebody else",
        email: "somebody@else.com"
      });

      await Event.signUpUserForEvent(user.id, nextEvents[0]);
      await Event.signUpUserForEvent(otherUser.id, nextEvents[0]);
      await Event.signUpUserForEvent(otherUser.id, nextEvents[1]);

      await request(app)
        .get("/events")
        .expect(200)
        .expect({
          pastEvent: null,
          nextEvents: [
            { ...nextEvents[0], event_date: '2120-04-14T22:00:00.000Z', participants: [user.username, otherUser.username] },
            { ...nextEvents[1], event_date: '2120-04-15T22:00:00.000Z', participants: [otherUser.username] }
          ]
        });
    });

    it('should return the correct court price for the chosen location', async () => {
      const user = await User.createUser({
        username: "somebody",
        email: "some@body.com"
      });
      const otherUser = await User.createUser({
        username: "somebody else",
        email: "somebody@else.com"
      });

      const nextEvents = [
        await Event.createEvent({
          event_date: new Date("2120/04/15"),
          number_of_fields: 2,
          location: "Beach61",
          creator_id: 1
        }),

        await Event.createEvent({
          event_date: new Date("2120/04/16"),
          number_of_fields: 2,
          location: "East61-indoor",
          creator_id: 1
        }),
        await Event.createEvent({
          event_date: new Date("2120/04/17"),
          number_of_fields: 2,
          location: "Beach61",
          creator_id: 1
        })
      ];
      const pastEvent = await Event.createEvent({
        event_date: new Date("2020/03/15"),
        number_of_fields: 2,
        location: "Beach61",
        creator_id: user.id
      });


      await Event.signUpUserForEvent(user.id, nextEvents[0]);
      await Event.signUpUserForEvent(otherUser.id, nextEvents[0]);
      await Event.signUpUserForEvent(otherUser.id, nextEvents[1]);
      await Event.signUpUserForEvent(otherUser.id, pastEvent);

      await request(app)
        .get("/events")
        .expect(200)
        .expect({
          pastEvent: { ...pastEvent, event_date: '2020-03-14T23:00:00.000Z', participants: [otherUser.username], courtPrice: 20},
          nextEvents: [
            { ...nextEvents[0], event_date: '2120-04-14T22:00:00.000Z', participants: [user.username, otherUser.username], courtPrice: 20},
            { ...nextEvents[1], event_date: '2120-04-15T22:00:00.000Z', participants: [otherUser.username], courtPrice: 36 }
          ]
        });
    })

  });
});

