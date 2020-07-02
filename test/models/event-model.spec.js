const { Event, User, sync } = require("../../src/models");
const { checkIfGuestsAreWelcome } = require("../../src//models/event-model");
const { enrollUserForEvent, setGuestsForEnrollment } = require("../../src/models/enrollment-model");
const App = require("../../src/app");
const { expect } = require("chai");
const { SIGNUP_ALLOWED, REDUCED_SIGNUP_ALLOWED, SIGNUP_FORBIDDEN_MAX_REACHED, SIGNUP_FORBIDDEN_NOT_SIGNED_UP } = require("../../src/models/event-model");
const sinon = require("sinon");

describe('event-model', () => {
  let app;

  beforeEach(async () => {
    app = await App({ connectionString: process.env.DATABASE_URL, database: "beachapptest" });

    await sync({ force: true });
  });

  describe('checkIfGuestsAreWelcome', () => {
    let user;
    let event;

    beforeEach(async () => {
      user = await User.createUser({
        username: "somebody else",
        email: "somebody@else.com"
      });

      event = await Event.createEvent({
        event_date: new Date("2020/03/15"),
        number_of_fields: 2,
        location: "Beach61",
        creator_id: user.id
      });

      sinon.stub(Event, 'getParticipationCondition').returns(
        {
          numberOfFields: 2,
          maxNumberOfParticipants: 2
        })
    });

    afterEach(() => {
      Event.getParticipationCondition.restore()
    });

    it('should return SIGNUP_FORBIDDEN_MAX_REACHED if there is no capacities left (no guest)', async () => {
      const guestCount = 5;
      const user2 = await User.createUser({
        username: "somebody",
        email: "somebody@part.com"
      });

      await enrollUserForEvent(user.id, event);
      await enrollUserForEvent(user2.id, event);
      console.log("WELCOME", checkIfGuestsAreWelcome(event, user.id, guestCount));
      expect(await checkIfGuestsAreWelcome(event, user.id, guestCount)).to.deep.equal({
        status: SIGNUP_FORBIDDEN_MAX_REACHED,
        capacity: 0
      })
    });

    it('should return SIGNUP_FORBIDDEN_MAX_REACHED if there is no capacities left (with guest)', async () => {
      const guestCount = 3;

      const enrollment = await enrollUserForEvent(user.id, event);

      setGuestsForEnrollment(enrollment, 1);

      expect(await checkIfGuestsAreWelcome(event, user.id, guestCount)).to.deep.equal({
        status: SIGNUP_FORBIDDEN_MAX_REACHED,
        capacity: 0
      })
    });

    it('should return SIGNUP_ALLOWED if there is still capacities', async () => {
      const guestCount = 1;
      await enrollUserForEvent(user.id, event);

      expect(await checkIfGuestsAreWelcome(event, user.id, guestCount)).to.deep.equal({
        status: SIGNUP_ALLOWED,
        capacity: 1
      })
    });

    it('should return REDUCED_SIGNUP_ALLOWED if there is less capacities than required', async () => {
      const guestCount = 2;
      await enrollUserForEvent(user.id, event);

      expect(await checkIfGuestsAreWelcome(event, user.id, guestCount)).to.deep.equal({
        status: REDUCED_SIGNUP_ALLOWED,
        capacity: 1
      })
    });

    it('should return SIGNUP_FORBIDDEN_NOT_SIGNED_UP if user is not signed up themself', async () => {
      const guestCount = 2;

      expect(await checkIfGuestsAreWelcome(event, user.id, guestCount)).to.deep.equal({
        status: SIGNUP_FORBIDDEN_NOT_SIGNED_UP,
        capacity: 2
      })
    });

    it('should return SIGNUP_ALLOWED if user is signed up with guest and there are capacities', async () => {
      Event.getParticipationCondition.restore()

      sinon.stub(Event, 'getParticipationCondition').returns(
        {
          numberOfFields: 2,
          maxNumberOfParticipants: 3
        });

      const guestCount = 1;

      const enrollment = await enrollUserForEvent(user.id, event);
      setGuestsForEnrollment(enrollment, 1);

      expect(await checkIfGuestsAreWelcome(event, user.id, guestCount)).to.deep.equal({
        status: SIGNUP_ALLOWED,
        capacity: 1
      })
    });

    it('should return SIGNUP_ALLOWED if user is signed up with guest and there are capacities', async () => {
      const guestCount = 0;

      const enrollment = await enrollUserForEvent(user.id, event);
      setGuestsForEnrollment(enrollment, 1);

      expect(await checkIfGuestsAreWelcome(event, user.id, guestCount)).to.deep.equal({
        status: SIGNUP_ALLOWED,
        capacity: 0
      })
    });

    it('should return SIGNUP_ALLOWED if user is signed up with guest, wants to increase guest count and there are capacities', async () => {
      Event.getParticipationCondition.restore()

      sinon.stub(Event, 'getParticipationCondition').returns(
        {
          numberOfFields: 2,
          maxNumberOfParticipants: 4
        });

      const guestCount = 3;

      const enrollment = await enrollUserForEvent(user.id, event);
      setGuestsForEnrollment(enrollment, 2);

      expect(await checkIfGuestsAreWelcome(event, user.id, guestCount)).to.deep.equal({
        status: SIGNUP_ALLOWED,
        capacity: 1
      })
    });
  })
});
