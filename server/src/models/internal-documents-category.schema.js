const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // slug: {
    //   type: String,
    //   required: true,
    //   lowercase: true,
    //   trim: true,
    // },
    filesCount: {
      type: Number,
      default: 0,
    },
    department: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

categorySchema.index({ department: 1 }, { unique: true });

module.exports = mongoose.model("Category", categorySchema);
