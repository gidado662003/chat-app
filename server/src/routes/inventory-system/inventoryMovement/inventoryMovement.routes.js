const express = require("express");
const router = express.Router();
const inventoryMovementController = require("./inventoryMovement.controller");

router.get("/", inventoryMovementController.getMovements);

module.exports = router;

