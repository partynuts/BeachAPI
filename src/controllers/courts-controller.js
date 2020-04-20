const { Router } = require("express");
const controller = Router();
const {getAllCourts} = require('../models/court-model');

controller.get("/courtsinfo", async (req, res) => {
  console.log("IM COURTS CONTROLLER");
  const courtsInfo = await getAllCourts();
  console.log("ALL COURTS INFO", courtsInfo);
  res.status(200).json(courtsInfo);
});

module.exports = controller;

