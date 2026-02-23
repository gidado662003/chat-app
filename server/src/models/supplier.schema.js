const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true, // enforces your standard
    },

    contactInfo: {
      email: { type: String, lowercase: true, trim: true },
      phone: String,
      address: String,
    },

    productsSupplied: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
      default: [],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Supplier", supplierSchema);
