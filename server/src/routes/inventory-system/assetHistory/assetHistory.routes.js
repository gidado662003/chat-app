const express = require("express");
const router = express.Router();
const assetHistoryController = require("./assetHistory.controller");

router.get("/:assetId", assetHistoryController.getHistoryForAsset);

module.exports = router;

