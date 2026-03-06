const InternalRequisition = require("../../../models/internal-requsitions-schema");
const requisitionService = require("../../../services/internalRequisition.service");

async function getAllDataFigures(req, res) {
  try {
    const figures = await requisitionService.getAllDataFigures(req.user);
    res.status(200).json(figures);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch requisition figures" });
  }
}

async function getAllData(req, res) {
  try {
    const result = await requisitionService.getAllData(req.query, req.user);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error getting data" });
  }
}
async function getDataById(req, res) {
  try {
    const { id } = req.params;
    const request = await requisitionService.getDataById(id);
    res.status(200).json(request);
  } catch (error) {
    console.error(error);
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: "Error getting data" });
  }
}

async function createRequest(req, res) {
  try {
    const request = await requisitionService.createRequest({
      user: req.user,
      body: req.body,
      files: req.files,
    });
    res.status(201).json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error submitting request" });
  }
}

async function updateRequest(req, res) {
  const { id } = req.params;
  const data = req.body;

  try {
    const response = await requisitionService.updateRequest(id, data, req.user);
    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    if (error.statusCode === 403) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this request" });
    }
    if (error.statusCode === 404) {
      return res.status(404).json({ message: "Not found" });
    }
    res.status(500).json({ message: "Error updating request" });
  }
}

module.exports = {
  getAllDataFigures,
  getAllData,
  getDataById,
  createRequest,
  updateRequest,
};
