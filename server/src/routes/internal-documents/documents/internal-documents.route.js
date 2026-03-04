const express = require("express");
const router = express.Router();
const { documents } = require("./internal-documents.controller");
const upload = require("../../../config/multerConfig/documentUpload");
router.get("/", documents.getDataController);
router.post(
  "/upload",
  upload.single("file"),
  documents.uploadDocumentController,
);
router.get("/files/:id", documents.getFilesByCategoryController);
module.exports = router;
