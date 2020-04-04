const request = require("supertest");
const App = require("../../src/app");
const { Event, User, sync } = require("../../src/models");
const { expect } = require("chai");

describe("events controller", () => {
  let app;

  beforeEach(async () => {
    app = await App({ database: "beachapptest" });

    await sync({ force: true });
  });

  afterEach(() => global.client.end());

  describe("GET /events", () => {
    it("returns empty arrays if no events have been created yet", () =>
      request(app)
        .get("/events")
        .expect(200)
        .expect({
          pastEvent: [],
          nextEvents: []
        }));

      it("returns the only existing upcoming event", async () => {
        const nextEvents = [
          await Event.createEvent({
            event_date: new Date("2020/04/15"),
            number_of_fields: 2,
            location: "irgendwo",
            creator_id: 1,
          }),
        ];
  
        await request(app)
          .get("/events")
          .expect(200)
          .expect({
            pastEvent: [],
            nextEvents: [
              {
                id: 1,
                event_date: "2020-04-14T22:00:00.000Z",
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
          event_date: new Date("2020/04/15"),
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
          pastEvent: [
            {
              id: 1,
              event_date: "2020-03-14T23:00:00.000Z",
              number_of_fields: 2,
              location: "irgendwo",
              creator_id: 1,
              participants: null
            }
          ],
          nextEvents: [
            {
              id: 2,
              event_date: "2020-04-14T22:00:00.000Z",
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

    it('can handle removed participants', async()=>{
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
    })
  });
});
