const { Router } = require("express");
const controller = Router();
const { getAllUsers, findUserByUsername, findUserByEmail, createUser, findUserByEmailAndUsername } = require("../models/user-model")

controller.post("/users", async (req, res) => {

  if (!req.body.username) {
    return res.status(400).json({ errorMsg: "Username is required!" })
  }
  if (!req.body.email) {
    return res.status(400).json({ errorMsg: "Email is required!" })
  }

  const foundUserByEmailAndUsername = await findUserByEmailAndUsername(req.body.username, req.body.email);

  if (foundUserByEmailAndUsername) {
    return res.status(200).json(foundUserByEmailAndUsername);
  }
  const foundUserByUsername = await findUserByUsername(req.body.username);

  if (foundUserByUsername) {
    return res.status(400).json({ errorMsg: "Username is already taken. Try another one!" })
  }
  const foundUserByEmail = await findUserByEmail(req.body.email);

  if (foundUserByEmail) {
    return res.status(400).json({ errorMsg: "Email is already taken. Try another one!" })
  }

  const newUser = await createUser(req.body);
  res.status(201).json(newUser)

});

controller.get("/users", async (req, res) => {
  console.log("GET ALL USERS")
  const allUsers = await getAllUsers();
  console.log("++++++ALL USERS++++", allUsers)
  res.status(200).json(allUsers)
});


module.exports = controller;
