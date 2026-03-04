const Document = require("../models/internal-documents.schema");
const Category = require("../models/internal-documents-category.schema");
const User = require("../models/user.schema");

const getDocumentsData = async (user) => {
  try {
    const department = user.department;
    const categories = await Category.find({ department }).lean();
    const categoryIds = categories.map((cat) => cat._id);
    const documents = await Document.find({
      department,
      category: { $in: categoryIds },
    })
      .populate("category", "name slug")
      .populate("uploadedBy", "displayName email")
      .lean();

    return {
      categories,
      documents,
    };
  } catch (error) {
    console.error("Error in getDocumentsData:", error);
    throw error;
  }
};

const getCategories = async (user) => {
  try {
    let query = {};

    if (user.role !== "admin") {
      query.department = user.department.name.toLowerCase();
    }

    const categories = await Category.find(query).lean();
    return categories;
  } catch (error) {
    console.error("Error in getCategories:", error);
    throw error;
  }
};

const createCategory = async (categoryData) => {
  const { name, department, createdBy } = categoryData;
  try {
    const existingCategory = await Category.findOne({
      name,
      department,
      createdBy,
    });
    if (existingCategory) {
      throw new Error(
        "Category with this name already exists in the department",
      );
    }

    const newCategory = new Category({ name, department, createdBy });
    await newCategory.save();
    return newCategory;
  } catch (error) {
    console.error("Error in createCategory:", error);
    throw error;
  }
};

const uploadDocument = async (file, fileData, user) => {
  const dataBuild = {
    name: fileData.name,
    fileName: fileData.fileName,
    filePath: file.path,
    fileSize: file.size,
    category: fileData.category,
    department: user.department.name,
    uploadedBy: user.id,
  };
  const response = await Document.create(dataBuild);
  return response;
};

const getFilesByCategory = async (user, category) => {
  try {
    const department = user.department.name.toLowerCase();

    return await Document.find({
      department,
      category: category,
    })
      .sort({ createdAt: -1 })
      .lean();
  } catch (error) {
    console.error("Error in getFilesByCategory:", error);
    throw error;
  }
};

module.exports = {
  getDocumentsData,
  getCategories,
  createCategory,
  uploadDocument,
  getFilesByCategory,
};
