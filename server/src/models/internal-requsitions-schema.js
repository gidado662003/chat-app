// models/requisition.model.js
const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  unit: { type: String },
  type: {
    type: String,
    enum: ["asset", "inventory"],
  },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
  total: {
    type: Number,
    default: function () {
      return this.quantity * this.unitPrice;
    },
  },
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    department: { type: String, required: true },
    role: { type: String },
  },
  { _id: false },
);

const approvedByFinanceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    department: { type: String, required: true },
    role: { type: String },
  },
  { _id: false },
);

const accountToPaySchema = new mongoose.Schema(
  {
    accountName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    bankName: { type: String, required: true },
  },
  { _id: false },
);

const paymentHistorySchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    paymentMethod: { type: String },
    bank: { type: String },
    referenceNumber: { type: String },
    paidBy: { type: String },
    comment: { type: String },
  },
  { _id: false },
);

const requisitionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    department: { type: String, required: true },
    location: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ["expenses", "equipment-procured", "refunds", "other"],
    },
    requestedOn: { type: Date, default: Date.now },
    approvedOn: { type: Date, default: null },
    rejectedOn: { type: Date, default: null },
    comment: { type: String, default: null },

    items: { type: [itemSchema], required: true },
    user: { type: userSchema, required: true },
    attachments: [String],

    approvedByFinance: {
      type: approvedByFinanceSchema,
      default: null,
    },

    totalAmount: { type: Number, default: 0 },
    requisitionNumber: { type: String, unique: true },

    accountToPay: { type: accountToPaySchema, default: null },

    paymentMethod: {
      type: String,
      enum: ["cheque", "transfer"],
      default: null,
    },

    bank: { type: String, default: null },
    referenceNumber: { type: String, default: null },

    paymentType: {
      type: String,
      enum: ["full", "partial"],
      default: null,
    },

    paymentHistory: {
      type: [paymentHistorySchema],
      default: [],
    },

    status: {
      type: String,
      enum: [
        "pending",
        "in review",
        "approved",
        "rejected",
        "completed",
        "outstanding",
      ],
      default: "pending",
    },
  },
  { timestamps: true },
);

requisitionSchema.virtual("amountRemaining").get(function () {
  const history = this.paymentHistory || [];
  const totalPaid = history.reduce(
    (sum, payment) => sum + (payment.amount || 0),
    0,
  );

  return Math.max(0, (this.totalAmount || 0) - totalPaid);
});
requisitionSchema.virtual("totalAmmontPaid").get(function () {
  const history = this.paymentHistory || [];
  const totalPaid = history.reduce(
    (sum, payment) => sum + (payment.amount || 0),
    0,
  );

  return totalPaid;
});

requisitionSchema.pre("save", async function () {
  // 'this' refers to the document

  // 1. If status is rejected, stop here.
  if (this.status === "rejected") {
    this.rejectedOn = this.rejectedOn || new Date();
    return; // In async middleware, return acts as next()
  }

  // 2. Logic for payment history
  if (!this.paymentHistory || this.paymentHistory.length === 0) return;

  const totalPaid = this.paymentHistory.reduce(
    (sum, payment) => sum + (payment.amount || 0),
    0,
  );

  // Using a small epsilon or Math.round to avoid floating point math issues
  if (totalPaid >= this.totalAmount && this.totalAmount > 0) {
    this.status = "approved";
    this.paymentType = "full";
    this.approvedOn = this.approvedOn || new Date();
  } else if (totalPaid > 0) {
    this.status = "outstanding";
    this.paymentType = "partial";
  }
});

requisitionSchema.set("toJSON", { virtuals: true });
requisitionSchema.set("toObject", { virtuals: true });
requisitionSchema.index({ requestedOn: -1, _id: -1 });

module.exports = mongoose.model("InternalRequisition", requisitionSchema);
