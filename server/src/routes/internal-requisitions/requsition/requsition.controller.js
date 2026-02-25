const internalRequsitionsSchema = require("../../../models/internal-requsitions-schema");
const InternalRequisition = require("../../../models/internal-requsitions-schema");
const mongoose = require("mongoose");
const sendEmail = require("../../../helper/mailTemplate");
const {
  createProductsFromRequest,
} = require("../../../services/inventory.service");

async function getAllDataFigures(req, res) {
  try {
    const matchStage = {};

    if (
      req.user.role !== "Admin Manager" &&
      req.user.department.name !== "Finance"
    ) {
      matchStage.department = req.user.department.name;
    }

    const result = await InternalRequisition.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const figures = {
      countTotal: 0,
      approvedTotal: 0,
      pendingTotal: 0,
      rejectedTotal: 0,
      outstandingTotal: 0,
    };

    result.forEach((item) => {
      figures.countTotal += item.count;

      if (item._id === "approved") figures.approvedTotal = item.count;
      if (item._id === "pending") figures.pendingTotal = item.count;
      if (item._id === "rejected") figures.rejectedTotal = item.count;
      if (item._id === "outstanding") figures.outstandingTotal = item.count;
    });

    res.status(200).json(figures);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch requisition figures" });
  }
}

async function getAllData(req, res) {
  try {
    const {
      search,
      status,
      bank,
      cursorTimestamp,
      cursorId,
      startDate,
      endDate,
    } = req.query;

    const limit = 10;
    const filters = [];

    // 🔐 Role / department restriction
    if (
      req.user.role !== "Admin Manager" &&
      req.user.department.name !== "Finance"
    ) {
      filters.push({ department: req.user.department.name });
    }

    if (cursorTimestamp && cursorId) {
      filters.push({
        $or: [
          { requestedOn: { $lt: new Date(cursorTimestamp) } },
          {
            requestedOn: new Date(cursorTimestamp),
            _id: { $lt: cursorId },
          },
        ],
      });
    }

    // 🔍 Search filter
    if (search) {
      filters.push({
        $or: [
          { department: { $regex: search, $options: "i" } },
          { location: { $regex: search, $options: "i" } },
          { "paymentHistory.bank": { $regex: search, $options: "i" } },
          { requisitionNumber: { $regex: search, $options: "i" } },
          { "user.name": { $regex: search, $options: "i" } },
        ],
      });
    }

    // 📊 Status & bank filters
    if (status) filters.push({ status });
    if (bank) filters.push({ bank });

    // 📅 Date range filter (requestedOn)
    if (startDate && endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      filters.push({
        requestedOn: {
          $gte: new Date(startDate),
          $lte: end,
        },
      });
    }

    const query = filters.length ? { $and: filters } : {};

    // 📥 Fetch data (limit + 1 to check hasMore)
    const results = await InternalRequisition.find(query)
      .sort({ requestedOn: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, limit) : results;

    // ⏭️ Next cursor
    let nextCursor = null;
    if (hasMore) {
      const lastItem = data[data.length - 1];
      nextCursor = {
        timestamp: lastItem.requestedOn,
        id: lastItem._id,
      };
    }

    // 📈 Status counts
    const counts = await InternalRequisition.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const figures = {
      countTotal: 0,
      approvedTotal: 0,
      pendingTotal: 0,
      rejectedTotal: 0,
      outstandingTotal: 0,
    };

    counts.forEach((item) => {
      figures.countTotal += item.count;
      if (item._id === "approved") figures.approvedTotal = item.count;
      if (item._id === "pending") figures.pendingTotal = item.count;
      if (item._id === "rejected") figures.rejectedTotal = item.count;
      if (item._id === "outstanding") figures.outstandingTotal = item.count;
    });

    // ✅ Response
    res.status(200).json({
      data,
      nextCursor,
      hasMore,
      counts: figures,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error getting data" });
  }
}
async function getDataById(req, res) {
  try {
    const { id } = req.params;
    const request = await InternalRequisition.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    res.status(200).json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error getting data" });
  }
}

async function createRequest(req, res) {
  const isDev = process.env.NODE_ENV === "development";

  try {
    const laravelUser = req.user;
    const user = {
      name: laravelUser.name || laravelUser.username,
      email: laravelUser.email || "",
      department: laravelUser.department.name || laravelUser.department,
      role: laravelUser.role || "user",
    };

    const items = JSON.parse(req.body.items);
    const accountToPay = JSON.parse(req.body.accountToPay);
    const attachments =
      req.files?.map((file) => `/uploads/${file.filename}`) || [];
    const totalAmount = items.reduce((acc, item) => acc + item.total, 0);

    const date = new Date();
    const requisitionNumber = `IR-${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}-${Date.now().toString().slice(-6)}`;

    const request = await InternalRequisition.create({
      title: req.body.title,
      department: laravelUser.department.name,
      requestedOn: req.body.requestedOn,
      type: req.body.type,
      accountToPay,
      requisitionNumber,
      totalAmount,
      location: req.body.location,
      category: req.body.category,
      items,
      attachments,
      user,
    });

    try {
      if (!isDev) {
        await sendEmail({
          to: process.env.NOTIFICATION_EMAIL,
          subject: `New Internal Requisition: ${requisitionNumber}`,
          text: `A new internal requisition ${requisitionNumber} has been submitted by ${user.name} from the ${user.department} department.`,
          cc: user.email,
          type: "requisition",
          data: {
            requisitionNumber,
            requestedBy: user.name,
            department: user.department,
            email: user.email,
            totalAmount,
            category: req.body.category,
            location: req.body.location,
            title: req.body.title,
            items: items,
            routeId: request._id,
          },
        });
      }
    } catch (emailError) {
      console.error("Error sending email:", emailError);
    }

    res.status(201).json("request");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error submitting request" });
  }
}

async function updateRequest(req, res) {
  const isDev = process.env.NODE_ENV === "development";

  const { id } = req.params;
  const data = req.body;

  if (!isDev && req.user.department.name !== "Finance") {
    return res
      .status(403)
      .json({ message: "You are not authorized to update this request" });
  }
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const request = await InternalRequisition.findById(id).session(session);
    if (!request) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Not found" });
    }
    request.status = data.status;

    if (data.status === "rejected") {
      request.rejectedOn = new Date();
      request.comment = data.financeComment;
    } else {
      request.approvedByFinance = {
        name: req.user.name,
        email: req.user.email,
        department: req.user.department.name,
      };

      if (data.amountPaid > 0) {
        request.paymentHistory.push({
          amount: data.amountPaid,
          comment: data.financeComment,
          bank: data.sourceBank,
          paidBy: req.user.name,
          paymentMethod: data.paymentMethod,
          date: new Date(),
        });
      }
    }

    const response = await request.save({ session });

    // pass data for product creation only when status is approved or when it's completed with equipment-procured items (to handle case where finance approves payment after procurement has marked as completed)
    if (
      data.status === "approved" ||
      (data.status === "completed" &&
        response.category === "equipment-procured")
    ) {
      await createProductsFromRequest(request, session);
    }
    await session.commitTransaction();

    const totalPaid = request.paymentHistory.reduce(
      (sum, payment) => sum + (payment.amount || 0),
      0,
    );
    const outstandingBalance = request.totalAmount - totalPaid;

    const daysPending = Math.floor(
      (new Date() - new Date(request.createdAt)) / (1000 * 60 * 60 * 24),
    );

    try {
      if (!isDev) {
        if (data.status === "approved") {
          await sendEmail({
            to: request.user?.email || process.env.NOTIFICATION_EMAIL,
            cc: process.env.NOTIFICATION_EMAIL,
            subject: `Requisition Approved: ${request.requisitionNumber}`,
            text: `Your requisition ${request.requisitionNumber} has been approved by ${req.user.name}.`,
            type: "approval",
            data: {
              requisitionNumber: request.requisitionNumber,
              approvedBy: {
                name: req.user.name,
                email: req.user.email,
                department: req.user.department.name,
              },
              totalAmount: request.totalAmount,
              comment: data.financeComment || "",
              routeId: request._id,
            },
          });
        } else if (data.status === "rejected") {
          await sendEmail({
            to: request.user?.email || process.env.NOTIFICATION_EMAIL,
            cc: process.env.NOTIFICATION_EMAIL,
            subject: `Requisition Rejected: ${request.requisitionNumber}`,
            text: `Your requisition ${request.requisitionNumber} has been rejected by ${req.user.name}.`,
            type: "rejection",
            data: {
              requisitionNumber: request.requisitionNumber,
              rejectedBy: {
                name: req.user.name,
                email: req.user.email,
                department: req.user.department.name,
              },
              comment: data.financeComment || request.comment || "",
              routeId: request._id,
            },
          });
        } else if (data.status === "outstanding") {
          await sendEmail({
            to: request.user?.email || process.env.NOTIFICATION_EMAIL,
            cc: process.env.NOTIFICATION_EMAIL,
            subject: `Requisition Partially Paid (Outstanding): ${request.requisitionNumber}`,
            text: `Your requisition ${request.requisitionNumber} has been partially paid. Outstanding balance: ${outstandingBalance.toFixed(2)}`,
            type: "outstanding",
            data: {
              requisitionNumber: request.requisitionNumber,
              updatedBy: {
                name: req.user.name,
                email: req.user.email,
                department: req.user.department.name,
              },
              totalAmount: request.totalAmount,
              paidAmount: totalPaid,
              outstandingAmount: outstandingBalance,
              comment: data.financeComment || "",
              paymentHistory: request.paymentHistory,
              routeId: request._id,
            },
          });
        } else if (data.status === "pending") {
          await sendEmail({
            to: request.user?.email || process.env.NOTIFICATION_EMAIL,
            cc: process.env.NOTIFICATION_EMAIL,
            subject: `Requisition Pending Review: ${request.requisitionNumber}`,
            text: `Your requisition ${request.requisitionNumber} is currently pending review by the Finance team.`,
            type: "pending",
            data: {
              requisitionNumber: request.requisitionNumber,
              requestedBy: request.user?.name || "Unknown",
              department: request.department || "",
              totalAmount: request.totalAmount,
              comment: data.financeComment || "",
              daysPending: daysPending,
              routeId: request._id,
            },
          });
        }
      }
    } catch (emailError) {
      console.error("Error sending status email:", emailError);
    }

    res.status(200).json(response);
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    res.status(500).json({ message: "Error updating request" });
  } finally {
    session.endSession();
  }
}

module.exports = {
  getAllDataFigures,
  getAllData,
  getDataById,
  createRequest,
  updateRequest,
};
