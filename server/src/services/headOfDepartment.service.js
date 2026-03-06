const HeadOfDepartments = require("../models/headofDepartments.schema");

async function getHeadOfDepartments() {
  const headOfDepartments = await HeadOfDepartments.find();
  return headOfDepartments;
}

async function createHeadOfDepartment(data) {
  const headOfDepartment = await HeadOfDepartments.create(data);
  return headOfDepartment;
}

module.exports = { getHeadOfDepartments, createHeadOfDepartment };

