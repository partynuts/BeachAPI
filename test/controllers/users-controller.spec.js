const request = require('supertest');
const App = require('../../src/app');
const { User, sync } = require('../../src/models');
const {expect} = require('chai');

describe('users controller', () => {
  let app;

  beforeEach(async () => {
    app = await App({ database: "beachapptest" });

    await sync({ force: true });
  });

  afterEach(async() => {
    // await global.client.end();
  });

  describe('POST /users', () => {
    it('should save new user with username and email in db', async () => {
      await request(app)
        .post(`/users`)
        .send({ username: "user1", email: 'email1' })
        .expect(201)
        .then(res => {
          expect(res.body.username).to.equal("user1");
          expect(res.body.email).to.equal("email1");
        });

      const users = await User.findAll();

      expect(users[0].username).to.equal("user1");
      expect(users[0].email).to.equal('email1');
    });
    it('should return 400 if username already exists', async () => {
      const user = await User.createUser({
        username: "user1",
        email: "email18"
      });
      await request(app)
        .post(`/users`)
        .send({ username: "user1", email: 'email1' })
        .expect(400)
        .then(res => {
          expect(res.body.errorMsg).to.equal("Username is already taken. Try another one!");
        });

      const users = await User.findAll();

      expect(users).to.have.lengthOf(1);
    });
    it('should return 400 if email already exists', async () => {
      const user = await User.createUser({
        username: "user1",
        email: "email18"
      });
      await request(app)
        .post(`/users`)
        .send({ username: "user0", email: 'email18' })
        .expect(400)
        .then(res => {
          expect(res.body.errorMsg).to.equal("Email is already taken. Try another one!");
        });

      const users = await User.findAll();

      expect(users).to.have.lengthOf(1);
    });
    it('should return 200 if email and username already exist', async () => {
      const user = await User.createUser({
        username: "user1",
        email: "email18"
      });
      await request(app)
        .post(`/users`)
        .send({ username: "user1", email: 'email18' })
        .expect(200)
        .then(res => {
          expect(res.body.username).to.equal("user1");
          expect(res.body.email).to.equal("email18");
        });

      const users = await User.findAll();

      expect(users).to.have.lengthOf(1);
    });
    it('should return 400 if email is missing', async () => {
      await request(app)
        .post(`/users`)
        .send({ username: "user1" })
        .expect(400)
        .then(res => {
          expect(res.body.errorMsg).to.equal("Email is required!");
        });
    });
    it('should return 400 if username is missing', async () => {
      await request(app)
        .post(`/users`)
        .send({ email: "email1" })
        .expect(400)
        .then(res => {
          expect(res.body.errorMsg).to.equal("Username is required!");
        });
    });
  });
});

