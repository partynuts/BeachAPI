const { Router } = require("express");
const controller = Router();
const {getAllCourts} = require('../models/court-model');

controller.get("/courtsinfo", async (req, res) => {
  const courtsInfo = await getAllCourts();
  res.status(200).json(courtsInfo);
});

module.exports = controller;

