const Product = require("../models/product.schema");
const Inventory = require("../models/inventory.schema");
const Asset = require("../models/asset.schema");
const ProcurementBatch = require("../models/productBatch.schema");
const Supplier = require("../models/supplier.schema");
const InventoryMovement = require("../models/inventoryMovement.schema");

async function createProductsFromRequest(request, session) {
  if (request.productsCreated) return;

  for (const item of request.items) {
    if (!["asset", "inventory"].includes(item.type)) {
      throw new Error(`Invalid item type: ${item.type}`);
    }

    const productName = item.description.trim().toLowerCase();

    let product = await Product.findOne({ name: productName }, null, {
      session,
    });

    if (!product) {
      [product] = await Product.create(
        [
          {
            name: productName,
            unit: item.unit || "pcs",
            trackIndividually: item.type === "asset",
          },
        ],
        { session },
      );
    }

    await ProcurementBatch.create(
      [
        {
          product: product._id,
          requisition: request._id,
          expectedQuantity: item.quantity,
          status: "awaiting_receipt",
          location: request.location,
          supplier: item.supplier,
        },
      ],
      { session },
    );
  }

  request.productsCreated = true;
  await request.save({ session });
}

// Get all batches that are awaiting receipt or partially received, with product and requisition details
async function getBatchProducts() {
  const batches = await ProcurementBatch.find({
    status: { $in: ["awaiting_receipt", "partially_received"] },
  })
    .populate("product")
    .populate("requisition");
  return batches;
}

// Get batch by ID with product and requisition details
async function getBatchById(id) {
  const batch = await ProcurementBatch.findById(id)
    .populate("product")
    .populate("requisition");
  return batch;
}

// Get batch by ID with product and requisition details, and process receiving the batch (update quantities, create assets if needed)
async function getBatchProduct(
  id,
  quantity,
  assetMetas = [],
  serialNumbers = [],
) {
  const batch = await ProcurementBatch.findById(id).populate("product");
  if (!batch) throw new Error("Batch product not found");

  const remainingToReceive = batch.expectedQuantity - batch.receivedQuantity;
  if (quantity > remainingToReceive || quantity <= 0) {
    throw new Error(
      `Quantity must be between 1 and ${remainingToReceive} (remaining to receive)`,
    );
  }

  if (batch.product.trackIndividually) {
    if (!Array.isArray(assetMetas) || assetMetas.length !== quantity) {
      throw new Error(
        `For assets, assetMetas array must have length ${quantity} (one per unit)`,
      );
    }
    // Ensure every unit has a serial number
    assetMetas.forEach((meta, i) => {
      if (!meta.serialNumber?.trim()) {
        throw new Error(`Serial number is required for unit ${i + 1}`);
      }
    });
  }

  batch.receivedQuantity += quantity;
  batch.status =
    batch.receivedQuantity >= batch.expectedQuantity
      ? "received"
      : "partially_received";
  await batch.save();

  if (!batch.product.trackIndividually) {
    await Inventory.findOneAndUpdate(
      { product: batch.product._id },
      {
        $inc: { quantity },
        $set: { location: batch.location, supplier: batch.supplier },
      },
      { upsert: true },
    );
    await Supplier.findByIdAndUpdate(batch.supplier, {
      $addToSet: { suppliedProducts: batch.product._id },
    });
  } else {
    for (let i = 0; i < quantity; i++) {
      const meta = assetMetas[i];
      await Asset.create({
        product: batch.product._id,
        batch: batch._id,
        status: "IN_STOCK",
        location: batch.location,
        supplier: batch.supplier,
        serialNumber: meta.serialNumber,
        condition: meta.condition ?? "NEW",
        category: meta.category ?? "equipment",
        ownership: meta.ownership ?? "COMPANY",
        purchaseDate: meta.purchaseDate
          ? new Date(meta.purchaseDate)
          : undefined,
        notes: meta.notes || undefined,
      });
      await Supplier.findByIdAndUpdate(batch.supplier, {
        $addToSet: { suppliedProducts: batch.product._id },
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
  getBatchById,
  getBatchProduct,
  createProductsFromRequest,
  getInventory,
  getAssets,
};
