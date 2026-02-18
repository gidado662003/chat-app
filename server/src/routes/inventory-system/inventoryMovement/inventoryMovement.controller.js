const InventoryMovement = require("../../../models/inventoryMovement.schema");

const inventoryMovementController = {
  getMovements: async (req, res) => {
    try {
      const filter = {};
      if (req.query.productId) {
        filter.product = req.query.productId;
      }

      const movements = await InventoryMovement.find(filter)
        .populate("product")
        .sort({ createdAt: -1 })
        .limit(200);

      res.status(200).json(movements);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = inventoryMovementController;

