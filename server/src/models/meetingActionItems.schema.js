const mongoose = require("mongoose");
const { Schema } = mongoose;

const actionItemSchema = new Schema(
  {
    meetingId: { type: Schema.Types.ObjectId, ref: "Meeting", required: true },
    desc: { type: String, required: true, trim: true },
    owner: { type: String, required: true, trim: true },
    due: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ActionItem", actionItemSchema);
