const {
  getCategories,
  createCategory,
} = require("../../../services/documents.service");
const category = {
  getCategoriesController: async (req, res) => {
    try {
      const user = req.user;
      const department = user.department.name;
      const categories = await getCategories(department);
      res.status(200).json(categories);
    } catch (error) {
      console.error("Error in getCategoriesController:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
  createCategoryController: async (req, res) => {
    try {
      const user = req.user;
      console.log("User in createCategoryController:", user);
      const department = user.department.name;
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Category name is required" });
      }
      const newCategory = await createCategory({
        name: name,
        department: department,
        createdBy: user.id,
      });
      res.status(201).json(newCategory);
    } catch (error) {
      console.error("Error in createCategoryController:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
};
module.exports = {
  category,
};
