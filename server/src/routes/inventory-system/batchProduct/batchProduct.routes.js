 const express = require("express");
const router = express.Router();
const batchProductController = require("./batchProduct.controller");
router.get("/", batchProductController.getBatchProducts);
router.post("/:id", batchProductController.getBatchProduct);
module.exports = router;
