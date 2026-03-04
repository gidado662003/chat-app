const express = require("express");
const router = express.Router();

const { category } = require("./internal-documents-category.controller");

router.get("/", category.getCategoriesController);
router.post("/", category.createCategoryController);
module.exports = router;
