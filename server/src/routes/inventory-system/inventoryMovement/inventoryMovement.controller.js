const {
  getMovements: getMovementsService,
} = require("../../../services/inventoryMovement.service");

const inventoryMovementController = {
  getMovements: async (req, res) => {
    try {
      const movements = await getMovementsService(req.query);
      res.status(200).json(movements);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = inventoryMovementController;

