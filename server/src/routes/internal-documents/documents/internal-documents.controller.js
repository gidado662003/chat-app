const {
  getData,
  uploadDocument,
  getFilesByCategory,
} = require("../../../services/documents.service");

const documents = {
  getDataController: (req, res) => {
    try {
      const user = req.user;

      res.status(200).json(data);
    } catch (error) {
      console.error("Error in getDataController:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
  uploadDocumentController: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "File is required" });
      }
      const response = await uploadDocument(req.file, req.body, req.user);
      res.status(200).json(response);
    } catch (error) {
      console.error("Error in uploadDocumentController:", error);
      res.status(500).json({ message: "uploadDocument error" });
    }
  },
  getFilesByCategoryController: async (req, res) => {
    try {
      const response = await getFilesByCategory(req.user, req.params.id);
      res.status(200).json(response);
    } catch (error) {
      console.error("Error in getFilesByCategoryController:", error);
      res.status(500).json({ message: "getFiles error" });
    }
  },
};
module.exports = {
  documents,
};
