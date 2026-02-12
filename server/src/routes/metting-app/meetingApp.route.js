const express = require("express");
const router = express.Router();
const {
  getMeetings,
  getMeetingById,
  createMeeting,
} = require("./meetingApp.controller");

router.post("/create", createMeeting);
router.get("/list", getMeetings);
router.get("/list/:id", getMeetingById);

module.exports = router;
