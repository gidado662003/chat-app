const Category = require("./internal-documents-category.schema");

const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

documentSchema.index({ department: 1, category: 1 });

documentSchema.post("save", async function (doc, next) {
  try {
    await Category.findByIdAndUpdate(doc.category, { $inc: { filesCount: 1 } });
    next();
  } catch (err) {
    console.error("Error updating Category filesCount:", err);
    next(err);
  }
});

module.exports = mongoose.model("Document", documentSchema);
