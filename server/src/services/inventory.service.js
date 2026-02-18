const Product = require("../models/product.schema");
const Inventory = require("../models/inventory.schema");
const Asset = require("../models/asset.schema");
const ProcurementBatch = require("../models/productBatch.schema");

async function createProductsFromRequest(request) {
  console.log("Creating products from request:", request._id);
  for (const item of request.items) {
    let product = await Product.findOne({
      name: item.description.trim().toLowerCase(),
    });

    if (!product) {
      product = await Product.create({
        name: item.description.trim().toLowerCase(),
        unit: item.unit || "pcs",
        trackIndividually: item.type === "asset",
      });
    }

    const batch = await ProcurementBatch.create({
      product: product._id,
      requisition: request._id,
      expectedQuantity: item.quantity,
      status: "awaiting_receipt",
      location: request.location,
    });
    await batch.save();

    // 2️⃣ If Asset
    // if (item.type === "asset") {
    //   for (let i = 0; i < item.quantity; i++) {
    //     await Asset.create({
    //       product: product._id,
    //       status: "IN_STOCK",
    //       location: request.location,
    //       serialNumber: item.serialNumbers[i],
    //     });
    //   }
    // }

    // 3️⃣ If Inventory
    // if (item.type === "inventory") {
    //   await Inventory.findOneAndUpdate(
    //     { product: product._id },
    //     {
    //       $inc: { quantity: item.quantity },
    //       $set: { location: request.location },
    //     },
    //     { upsert: true },
    //   );
    // }
  }
}

async function getBatchProducts() {
  const batches = await ProcurementBatch.find({ status: "awaiting_receipt" })
    .populate("product")
    .populate("requisition");
  return batches;
}

async function getBatchProduct(id, quantity, serialNumbers = []) {
  const batch = await ProcurementBatch.findById(id).populate("product");
  if (!batch) {
    throw new Error("Batch product not found");
  }

  const remainingToReceive = batch.expectedQuantity - batch.receivedQuantity;
  if (quantity > remainingToReceive || quantity <= 0) {
    throw new Error(
      `Quantity must be between 1 and ${remainingToReceive} (remaining to receive)`,
    );
  }

  if (batch.product.trackIndividually) {
    if (!Array.isArray(serialNumbers) || serialNumbers.length !== quantity) {
      throw new Error(
        `For assets, serialNumbers array must have length ${quantity} (one per unit)`,
      );
    }
  }

  batch.receivedQuantity += quantity;
  if (batch.receivedQuantity >= batch.expectedQuantity) {
    batch.status = "received";
  } else {
    batch.status = "partially_received";
  }
  await batch.save();

  if (!batch.product.trackIndividually) {
    await Inventory.findOneAndUpdate(
      { product: batch.product._id },
      {
        $inc: { quantity: quantity },
        $set: { location: batch.location },
      },
      { upsert: true },
    );
  } else {
    for (let i = 0; i < quantity; i++) {
      await Asset.create({
        product: batch.product._id,
        status: "IN_STOCK",
        location: batch.location,
        serialNumber: serialNumbers[i] || "",
      });
    }
  }

  return batch;
}

async function getInventory() {
  const inventory = await Inventory.find().populate("product");
  return inventory;
}

async function getAssets() {
  const assets = await Asset.find().populate("product");
  return assets;
}

module.exports = {
  getBatchProducts,
  getBatchProduct,
  createProductsFromRequest,
  getInventory,
  getAssets,
};
