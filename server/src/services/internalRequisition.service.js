const mongoose = require("mongoose");
const InternalRequisition = require("../models/internal-requsitions-schema");
const Category = require("../models/internal-documents-category.schema");
const Document = require("../models/internal-documents.schema");
const sendEmail = require("../helper/mailTemplate");
const { createProductsFromRequest } = require("./inventory.service");

async function getAllDataFigures(user) {
  const matchStage = {};

  if (user.role !== "Admin Manager" && user.department.name !== "Finance") {
    matchStage.department = user.department.name;
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

  return figures;
}

async function getAllData(queryParams, user) {
  const {
    search,
    status,
    bank,
    cursorTimestamp,
    cursorId,
    startDate,
    endDate,
  } = queryParams;

  const limit = 10;
  const filters = [];

  if (user.role !== "Admin Manager" && user.department.name !== "Finance") {
    filters.push({ department: user.department.name });
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

  if (search) {
    filters.push({
      $or: [
        { department: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { "paymentHistory.bank": { $regex: search, $options: "i" } },
        { requisitionNumber: { $regex: search, $options: "i" } },
        { "user.name": { $regex: search, $options: "i" } },
      ],
    });
  }

  if (status) filters.push({ status });
  if (bank) filters.push({ bank });

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

  const results = await InternalRequisition.find(query)
    .sort({ requestedOn: -1, _id: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = results.length > limit;
  const data = hasMore ? results.slice(0, limit) : results;

  let nextCursor = null;
  if (hasMore) {
    const lastItem = data[data.length - 1];
    nextCursor = {
      timestamp: lastItem.requestedOn,
      id: lastItem._id,
    };
  }

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

  return {
    data,
    nextCursor,
    hasMore,
    counts: figures,
  };
}

async function getDataById(id) {
  const request = await InternalRequisition.findById(id);
  if (!request) {
    const error = new Error("Request not found");
    error.statusCode = 404;
    throw error;
  }
  return request;
}

async function createRequest(payload) {
  const { user: laravelUser, body, files } = payload;
  const isDev = process.env.NODE_ENV === "development";

  const user = {
    name: laravelUser.name || laravelUser.username,
    email: laravelUser.email || "",
    department: laravelUser.department.name || laravelUser.department,
    role: laravelUser.role || "user",
  };

  const items = JSON.parse(body.items);
  const accountToPay = JSON.parse(body.accountToPay);
  const attachments = files?.map((file) => `/uploads/${file.filename}`) || [];
  const totalAmount = items.reduce((acc, item) => acc + item.total, 0);

  const date = new Date();
  const requisitionNumber = `IR-${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}-${Date.now()
    .toString()
    .slice(-6)}`;

  const request = await InternalRequisition.create({
    title: body.title,
    department: laravelUser.department.name,
    requestedOn: body.requestedOn,
    type: body.type,
    accountToPay,
    requisitionNumber,
    totalAmount,
    location: body.location,
    category: body.category,
    items,
    attachments,
    user,
  });

  if (files?.length > 0 && body.category) {
    try {
      let category = await Category.findOne({
        name: body.category.toLowerCase(),
        department: "finance",
      });

      if (!category) {
        category = await Category.create({
          name: body.category.toLowerCase(),
          department: "finance",
          source: "auto",
          createdBy: {
            id: laravelUser.id.toString(),
            name: user.name,
            email: user.email,
            department: user.department,
          },
        });
      }

      await Promise.all(
        files.map((file) =>
          Document.create({
            name: file.originalname.replace(/\.[^.]+$/, ""),
            fileName: file.originalname,
            filePath: file.path,
            fileSize: file.size,
            mimeType: file.mimetype,
            extension: file.originalname.split(".").pop().toLowerCase(),
            department: "finance",
            category: category._id,
            source: "requisition",
            requisitionId: request._id,
            uploadedBy: {
              id: laravelUser.id.toString(),
              name: user.name,
              email: user.email,
              department: user.department,
            },
          }),
        ),
      );
    } catch (attachmentError) {
      console.error("Error auto-attaching documents:", attachmentError);
    }
  }

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
          category: body.category,
          location: body.location,
          title: body.title,
          items,
          routeId: request._id,
        },
      });
    }
  } catch (emailError) {
    console.error("Error sending email:", emailError);
  }

  return request;
}

async function updateRequest(id, data, user) {
  const isDev = process.env.NODE_ENV === "development";

  if (!isDev && user.department.name !== "Finance") {
    const error = new Error("You are not authorized to update this request");
    error.statusCode = 403;
    throw error;
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const request = await InternalRequisition.findById(id).session(session);
    if (!request) {
      await session.abortTransaction();
      const error = new Error("Not found");
      error.statusCode = 404;
      throw error;
    }

    request.status = data.status;

    if (data.status === "rejected") {
      request.rejectedOn = new Date();
      request.comment = data.financeComment;
    } else {
      request.approvedByFinance = {
        name: user.name,
        email: user.email,
        department: user.department.name,
      };

      if (data.amountPaid > 0) {
        request.paymentHistory.push({
          amount: data.amountPaid,
          comment: data.financeComment,
          bank: data.sourceBank,
          paidBy: user.name,
          paymentMethod: data.paymentMethod,
          date: new Date(),
        });
      }
    }

    const response = await request.save({ session });

    const isApprovedOrCompleted =
      data.status === "approved" || data.status === "completed";
    const isEquipmentProcured = data.category === "equipment-procured";

    if (isApprovedOrCompleted && isEquipmentProcured) {
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
            text: `Your requisition ${request.requisitionNumber} has been approved by ${user.name}.`,
            type: "approval",
            data: {
              requisitionNumber: request.requisitionNumber,
              approvedBy: {
                name: user.name,
                email: user.email,
                department: user.department.name,
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
            text: `Your requisition ${request.requisitionNumber} has been rejected by ${user.name}.`,
            type: "rejection",
            data: {
              requisitionNumber: request.requisitionNumber,
              rejectedBy: {
                name: user.name,
                email: user.email,
                department: user.department.name,
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
            text: `Your requisition ${request.requisitionNumber} has been partially paid. Outstanding balance: ${outstandingBalance.toFixed(
              2,
            )}`,
            type: "outstanding",
            data: {
              requisitionNumber: request.requisitionNumber,
              updatedBy: {
                name: user.name,
                email: user.email,
                department: user.department.name,
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

    return response;
  } catch (error) {
    await session.abortTransaction();
    throw error;
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

