const request = require("supertest");
const App = require("../../src/app");
const { User, sync } = require("../../src/models");
const { expect } = require("chai");

describe("users controller", () => {
  let app;

  beforeEach(async () => {
    app = await App({ connectionString: process.env.DATABASE_URL, database: "beachapptest" });

    await sync({ force: true });
  });

  afterEach(() => global.client.end().then(console.log, console.log));

  describe("POST /users", () => {
    it("should save new user with username and email in db", async () => {
      await request(app)
        .post(`/users`)
        .send({ username: "user1", email: "email1" })
        .expect(201)
        .then(res => {
          expect(res.body.username).to.equal("user1");
          expect(res.body.email).to.equal("email1");
        });

      const users = await User.findAll();

      expect(users[0].username).to.equal("user1");
      expect(users[0].email).to.equal("email1");
    });
    it("should return 400 if username already exists", async () => {
      const user = await User.createUser({
        username: "user1",
        email: "email18"
      });
      await request(app)
        .post(`/users`)
        .send({ username: "user1", email: "email1" })
        .expect(400)
        .then(res => {
          expect(res.body.errorMsg).to.equal(
            "Username is already taken. Try another one!"
          );
        });

      const users = await User.findAll();

      expect(users).to.have.lengthOf(1);
    });
    it("should return 400 if email already exists", async () => {
      const user = await User.createUser({
        username: "user1",
        email: "email18"
      });
      await request(app)
        .post(`/users`)
        .send({ username: "user0", email: "email18" })
        .expect(400)
        .then(res => {
          expect(res.body.errorMsg).to.equal(
            "Email is already taken. Try another one!"
          );
        });

      const users = await User.findAll();

      expect(users).to.have.lengthOf(1);
    });
    it("should return 200 if email and username already exist", async () => {
      const user = await User.createUser({
        username: "user1",
        email: "email18"
      });
      await request(app)
        .post(`/users`)
        .send({ username: "user1", email: "email18" })
        .expect(200)
        .then(res => {
          expect(res.body.username).to.equal("user1");
          expect(res.body.email).to.equal("email18");
        });

      const users = await User.findAll();

      expect(users).to.have.lengthOf(1);
    });
    it("should return 400 if email is missing", async () => {
      await request(app)
        .post(`/users`)
        .send({ username: "user1" })
        .expect(400)
        .then(res => {
          expect(res.body.errorMsg).to.equal("Email is required!");
        });
    });
    it("should return 400 if username is missing", async () => {
      await request(app)
        .post(`/users`)
        .send({ email: "email1" })
        .expect(400)
        .then(res => {
          expect(res.body.errorMsg).to.equal("Username is required!");
        });
    });
  });

  describe("GET /users", () => {
    it("should return empty array if no users are signed up", async () => {
      await request(app)
        .get('/users')
        .expect(200, [])
    });
    it("should return all signed up users", async () => {
      const user1 = await User.createUser({
        username: "user1",
        email: "email18"
      });

      const user2 = await User.createUser({
        username: "user2",
        email: "email12"
      });

      await request(app)
        .get('/users')
        .expect(200, [user1, user2])
    })
  });

  describe("PATCH /users/:userId", async () => {
    it("should return 404 if user is not found", async () => {
      await request(app)
        .patch('/users/5')
        .expect(404)
    });
    it("should return 400 if no body is provided", async () => {
      const user = await User.createUser({
        username: "user1",
        email: "email18",
      });

      await request(app)
        .patch(`/users/${user.id}`)
        .expect(400)
    });

    it("should return 200 and the updated user data", async () => {
      const user = await User.createUser({
        username: "user1",
        email: "email18",
      });

      await request(app)
        .patch(`/users/${user.id}`)
        .send({ email: "neu@email.de" })
        .expect(200, {...user, email: "neu@email.de"});

      const updatedUser = await User.findUserById(user.id);
      expect(updatedUser).to.deep.equal({...user, email: "neu@email.de"})
    });

    it ("should return 400 if body is invalid", async () => {
      const user = await User.createUser({
        username: "user1",
        email: "email18",
      });

      await request(app)
        .patch(`/users/${user.id}`)
        .send("Hallo")
        .expect(400)

      await request(app)
        .patch(`/users/${user.id}`)
        .send("6")
        .expect(400)
    });

    it.skip ("should return 400 if user changes their id", async () => {

    });

    it.skip ("should return 400 if user changes their email to another existing email", async () => {

    });

    it.skip ("should encrypt passwords", async () => {

    });
  })
});
