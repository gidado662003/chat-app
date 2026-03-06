const {
  getHeadOfDepartments: getHeadOfDepartmentsService,
  createHeadOfDepartment: createHeadOfDepartmentService,
} = require("../../../services/headOfDepartment.service");

async function getHeadOfDepartments(req, res) {
  try {
    const headOfDepartments = await getHeadOfDepartmentsService();
    res.status(200).json(headOfDepartments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function createHeadOfDepartment(req, res) {
  try {
    const headOfDepartment = await createHeadOfDepartmentService(req.body);
    res.status(201).json(headOfDepartment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
module.exports = { getHeadOfDepartments, createHeadOfDepartment };
