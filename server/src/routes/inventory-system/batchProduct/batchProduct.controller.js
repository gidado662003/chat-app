const {
  getBatchProducts,
  getBatchById,
  getBatchProduct,
} = require("../../../services/inventory.service");
const batchProductController = {
  getBatchProducts: async (req, res) => {
    try {
      const batchProducts = await getBatchProducts();
      res.status(200).json(batchProducts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  getBatchById: async (req, res) => {
    try {
      const batch = await getBatchById(req.params.id);
      if (!batch) {
        return res.status(404).json({ error: "Batch not found" });
      }
      res.status(200).json(batch);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  getBatchProduct: async (req, res) => {
    try {
      const { quantity, assetMetas, performedBy } = req.body;
      const batchProduct = await getBatchProduct(
        req.params.id,
        quantity,
        assetMetas ?? [],
        performedBy ||
          (req.user && { name: req.user.name, email: req.user.email }),
      );
      res.status(200).json(batchProduct);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = batchProductController;
