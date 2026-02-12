const mongoose = require("mongoose");
const { Schema } = mongoose;

const actionItemSchema = new Schema({
  desc: {
    type: String,
    required: [true, "Action item description is required."],
    trim: true,
    minlength: [3, "Description must be at least 3 characters."],
  },
  penalty: {
    type: String,
  },
  owner: {
    type: String,
    trim: true,
  },
  due: {
    type: Date,
    // validate: {
    //   validator: (v) => v >= new Date(),
    //   message: "Due date must be in the future.",
    // },
  },
  status: {
    type: String,
    enum: ["pending", "completed", "ongoing"],
    default: "pending",
    trim: true,
  },
});

const meetingSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Meeting title is required."],
      trim: true,
      minlength: [2, "Title must be at least 5 characters."],
    },
    date: {
      type: Date,
      required: [true, "Meeting date is required."],
      index: true, // Indexing this field for faster queries
    },
    attendees: {
      type: [String],
      default: [],
    },
    agenda: {
      type: String,
      trim: true,
    },
    minutes: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      required: [true, "Department is required."],
      trim: true,
      index: true, // Indexing department for common queries
    },
    actionItems: {
      type: [actionItemSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "canceled"],
      default: "scheduled",
      trim: true,
      index: true, // Indexing status for common queries
    },
  },
  { timestamps: true }
);
meetingSchema.pre("save", function (next) {
  if (
    this.actionItems.length > 0 &&
    this.actionItems.every((item) => item.status === "completed")
  ) {
    this.status = "completed";
  }
  next();
});

module.exports = mongoose.model("Meeting", meetingSchema);
