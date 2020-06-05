const request = require("supertest");
const notification = require("../../src/models/notification-model");
const sinon = require("sinon");
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

  describe("POST /events", () => {
    it('should create an event with the data provided by the user', async () => {
      await request(app)
        .post('/events')
        .send({
          event_date: "2120-04-14T22:00:00.000Z",
          number_of_fields: 2,
          location: "Beach61",
          creator_id: 47
        })
        .expect(201, {
          id: 1,
          event_date: "2120-04-14T22:00:00.000Z",
          number_of_fields: 2,
          location: "Beach61",
          creator_id: 47,
          participants: null,
        })
    });

    it('should return 400 if invalid or incomplete data is provided', async () => {
      await request(app)
        .post('/events')
        .send({
          event_date: null,
          number_of_fields: 2,
          location: "Beach61",
          creator_id: 47
        })
        .expect(400, { errorMsg: "All fields are required!" });

      await request(app)
        .post('/events')
        .send({
          event_date: "2120-04-14T22:00:00.000Z",
          number_of_fields: 1,
          location: null,
          creator_id: 47
        })
        .expect(400, { errorMsg: "All fields are required!" });

      await request(app)
        .post('/events')
        .send({
          event_date: "2120-04-14T22:00:00.000Z",
          number_of_fields: null,
          location: "East61-indoor",
          creator_id: 47
        })
        .expect(400, { errorMsg: "All fields are required!" });

      await request(app)
        .post('/events')
        .send({
          event_date: "2120-04-14T22:00:00.000Z",
          number_of_fields: 2,
          location: "East61-indoor",
          creator_id: null
        })
        .expect(201)
    });

    it('should send a notification to all users with a token', async () => {
      const user = await User.createUser({
        username: "somebody",
        email: "some@body.com",
      });
      const otherUser = await User.createUser({
        username: "somebody else",
        email: "somebody@else.com"
      });
      const creator = await User.createUser({
        username: "creator",
        email: "creator@else.com",
      });

      await User.updateUser({notifications_token: "my token creator"}, creator.id);
      await User.updateUser({notifications_token: "my token user"}, user.id);

      const mock = sinon.mock(notification);
      mock.expects("sendPushNotification")
        .withArgs(`New event for ${new Date('2120-04-14T22:00:00.000Z').toLocaleDateString()}`, ["my token user"], 1)
        .once();

      await request(app)
        .post('/events')
        .send({
          event_date: "2120-04-14T22:00:00.000Z",
          number_of_fields: 2,
          location: "East61-indoor",
          creator_id: creator.id
        })
        .expect(201);

      mock.verify();
      mock.restore();
    });

    it('should increase the booking count of the user who has created the event', async () => {
      const user = await User.createUser({
        username: "somebody",
        email: "some@body.com",
      });

      await request(app)
        .post('/events')
        .send({
          event_date: "2120-04-14T22:00:00.000Z",
          number_of_fields: 2,
          location: "East61-indoor",
          creator_id: user.id
        })
        .expect(201);

      const updatedUser = await User.findUserByUsername(user.username)
      expect(updatedUser.booking_count).to.equal(1);
    });
  })
});

