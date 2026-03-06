const InventoryMovement = require("../models/inventoryMovement.schema");

async function getMovements(query = {}) {
  const filter = {};
  if (query.productId) {
    filter.product = query.productId;
  }

  const movements = await InventoryMovement.find(filter)
    .populate("product")
    .sort({ createdAt: -1 })
    .limit(200);

  return movements;
}

module.exports = { getMovements };

