const express = require("express");
const {
  syncUserProfile,
  getAllusers,
  getUserById,
  isAuthenticated,
} = require("./users.controller");
const validateSanctumToken = require("../../middleware/validateSanctumToken");

const route = express.Router();

// Sync user profile with Laravel token (protected by Sanctum middleware)
route.post("/sync", validateSanctumToken, syncUserProfile);

// Protected routes (authentication required)
route.get("/", validateSanctumToken, getAllusers);
route.get("/:id", validateSanctumToken, getUserById);

route.get("/is-authenticated", validateSanctumToken, isAuthenticated);

module.exports = route;
