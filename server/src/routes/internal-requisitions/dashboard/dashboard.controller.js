const InternalRequisition = require("../../../models/internal-requsitions-schema");

// Get priority distribution
exports.getPriorityDistribution = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.requestedOn = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const data = await InternalRequisition.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $ifNull: ["$priority", "medium"] },
          count: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ["$totalAmount", 0] } },
          approved: {
            $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          priority: "$_id",
          count: 1,
          totalAmount: 1,
          approved: 1,
          pending: 1,
          approvalRate: {
            $cond: [
              { $eq: ["$count", 0] },
              0,
              { $multiply: [{ $divide: ["$approved", "$count"] }, 100] },
            ],
          },
          _id: 0,
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json(data);
  } catch (error) {
    console.error("Error fetching priority distribution:", error);
    res.status(500).json({ error: "Failed to fetch priority distribution" });
  }
};

// Get amount range analysis
exports.getAmountRanges = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.requestedOn = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const data = await InternalRequisition.aggregate([
      { $match: dateFilter },
      {
        $bucket: {
          groupBy: "$totalAmount",
          boundaries: [
            0,
            10000,
            50000,
            100000,
            250000,
            500000,
            1000000,
            Infinity,
          ],
          default: "Other",
          output: {
            count: { $sum: 1 },
            totalAmount: { $sum: "$totalAmount" },
            approved: {
              $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
            },
            pending: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
            },
          },
        },
      },
      {
        $project: {
          range: {
            $switch: {
              branches: [
                { case: { $eq: ["$_id", 0] }, then: "₦0 - ₦10,000" },
                { case: { $eq: ["$_id", 10000] }, then: "₦10,001 - ₦50,000" },
                { case: { $eq: ["$_id", 50000] }, then: "₦50,001 - ₦100,000" },
                {
                  case: { $eq: ["$_id", 100000] },
                  then: "₦100,001 - ₦250,000",
                },
                {
                  case: { $eq: ["$_id", 250000] },
                  then: "₦250,001 - ₦500,000",
                },
                {
                  case: { $eq: ["$_id", 500000] },
                  then: "₦500,001 - ₦1,000,000",
                },
                { case: { $eq: ["$_id", 1000000] }, then: "₦1,000,000+" },
              ],
              default: "Other",
            },
          },
          count: 1,
          totalAmount: 1,
          approved: 1,
          pending: 1,
          approvalRate: {
            $cond: [
              { $eq: ["$count", 0] },
              0,
              { $multiply: [{ $divide: ["$approved", "$count"] }, 100] },
            ],
          },
          _id: 0,
        },
      },
    ]);

    res.json(data);
  } catch (error) {
    console.error("Error fetching amount ranges:", error);
    res.status(500).json({ error: "Failed to fetch amount ranges" });
  }
};

// Get approval trends over time
exports.getApprovalTrends = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.requestedOn = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const data = await InternalRequisition.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: "$approvedOn" },
            month: { $month: "$approvedOn" },
            week: { $week: "$approvedOn" },
          },
          approved: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ["$totalAmount", 0] } },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1 } },
    ]);

    res.json(data);
  } catch (error) {
    console.error("Error fetching approval trends:", error);
    res.status(500).json({ error: "Failed to fetch approval trends" });
  }
};

// Get department performance trends
exports.getDepartmentTrends = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.requestedOn = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const data = await InternalRequisition.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            department: "$department",
            month: { $month: "$requestedOn" },
            year: { $year: "$requestedOn" },
          },
          count: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ["$totalAmount", 0] } },
          approved: {
            $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          department: "$_id.department",
          month: "$_id.month",
          year: "$_id.year",
          count: 1,
          totalAmount: 1,
          approved: 1,
          pending: 1,
          approvalRate: {
            $cond: [
              { $eq: ["$count", 0] },
              0,
              { $multiply: [{ $divide: ["$approved", "$count"] }, 100] },
            ],
          },
          _id: 0,
        },
      },
      { $sort: { year: 1, month: 1, department: 1 } },
    ]);

    res.json(data);
  } catch (error) {
    console.error("Error fetching department trends:", error);
    res.status(500).json({ error: "Failed to fetch department trends" });
  }
};

// Get processing time distribution
exports.getProcessingTimeDistribution = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.requestedOn = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const data = await InternalRequisition.aggregate([
      {
        $match: {
          ...dateFilter,
          status: "approved",
          approvedOn: { $ne: null },
        },
      },
      {
        $project: {
          processingDays: {
            $divide: [
              { $subtract: ["$approvedOn", "$requestedOn"] },
              1000 * 60 * 60 * 24,
            ],
          },
          totalAmount: 1,
          department: 1,
        },
      },
      {
        $bucket: {
          groupBy: "$processingDays",
          boundaries: [0, 1, 3, 7, 14, 30, Infinity],
          default: "30+ days",
          output: {
            count: { $sum: 1 },
            avgAmount: { $avg: "$totalAmount" },
            departments: { $addToSet: "$department" },
          },
        },
      },
      {
        $project: {
          range: {
            $switch: {
              branches: [
                { case: { $eq: ["$_id", 0] }, then: "< 1 day" },
                { case: { $eq: ["$_id", 1] }, then: "1-3 days" },
                { case: { $eq: ["$_id", 3] }, then: "3-7 days" },
                { case: { $eq: ["$_id", 7] }, then: "7-14 days" },
                { case: { $eq: ["$_id", 14] }, then: "14-30 days" },
                { case: { $eq: ["$_id", 30] }, then: "30+ days" },
              ],
              default: "30+ days",
            },
          },
          count: 1,
          avgAmount: 1,
          departments: { $size: "$departments" },
          _id: 0,
        },
      },
    ]);

    res.json(data);
  } catch (error) {
    console.error("Error fetching processing time distribution:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch processing time distribution" });
  }
};

// Get hourly submission patterns
exports.getHourlyPatterns = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.requestedOn = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const data = await InternalRequisition.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $hour: "$requestedOn" },
          count: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ["$totalAmount", 0] } },
        },
      },
      {
        $project: {
          hour: "$_id",
          count: 1,
          totalAmount: 1,
          hourLabel: {
            $concat: [{ $toString: "$_id" }, ":00"],
          },
          _id: 0,
        },
      },
      { $sort: { hour: 1 } },
    ]);

    res.json(data);
  } catch (error) {
    console.error("Error fetching hourly patterns:", error);
    res.status(500).json({ error: "Failed to fetch hourly patterns" });
  }
};

// Get dashboard metrics
exports.getDashboardMetrics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.requestedOn = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const statusMatch = (status) => ({ ...dateFilter, status });

    const [
      totalCount,
      pendingCount,
      approvedCount,
      rejectedCount,
      totalAmountAgg,
      departmentStats,
      locationStats,
      recentRequisitions,
      monthlyTrends,
      approvalsForDuration,
      categoryCount,
    ] = await Promise.all([
      InternalRequisition.countDocuments(dateFilter),
      InternalRequisition.countDocuments(statusMatch("pending")),
      InternalRequisition.countDocuments(statusMatch("approved")),
      InternalRequisition.countDocuments(statusMatch("rejected")),
      InternalRequisition.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ["$totalAmount", 0] } },
          },
        },
      ]),
      InternalRequisition.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: "$department",
            count: { $sum: 1 },
            totalAmount: { $sum: { $ifNull: ["$totalAmount", 0] } },
            pending: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
            },
            approved: {
              $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
            },
            rejected: {
              $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
            },
            pendingAmount: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "pending"] },
                  { $ifNull: ["$totalAmount", 0] },
                  0,
                ],
              },
            },
            approvedAmount: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "approved"] },
                  { $ifNull: ["$totalAmount", 0] },
                  0,
                ],
              },
            },
            rejectedAmount: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "rejected"] },
                  { $ifNull: ["$totalAmount", 0] },
                  0,
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: "$_id",
            count: 1,
            totalAmount: 1,
            approved: 1,
            pending: 1,
            rejected: 1,
            pendingAmount: 1,
            approvedAmount: 1,
            rejectedAmount: 1,
          },
        },
        { $sort: { count: -1 } },
      ]),
      InternalRequisition.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: "$location",
            count: { $sum: 1 },
            totalAmount: { $sum: { $ifNull: ["$totalAmount", 0] } },
            pending: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
            },
            approved: {
              $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
            },
            rejected: {
              $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
            },
            pendingAmount: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "pending"] },
                  { $ifNull: ["$totalAmount", 0] },
                  0,
                ],
              },
            },
            approvedAmount: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "approved"] },
                  { $ifNull: ["$totalAmount", 0] },
                  0,
                ],
              },
            },
            rejectedAmount: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "rejected"] },
                  { $ifNull: ["$totalAmount", 0] },
                  0,
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: "$_id",
            count: 1,
            totalAmount: 1,
            approved: 1,
            pending: 1,
            rejected: 1,
            pendingAmount: 1,
            approvedAmount: 1,
            rejectedAmount: 1,
          },
        },
        { $sort: { count: -1 } },
      ]),
      // Sort recent requisitions by requestedOn descending
      InternalRequisition.find(dateFilter)
        .sort({ requestedOn: -1 })
        .limit(5)
        .select(
          "requisitionNumber title department status totalAmount requestedOn amountRemaining totalAmmontPaid",
        ),
      InternalRequisition.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: {
              year: { $year: "$requestedOn" },
              month: { $month: "$requestedOn" },
            },
            count: { $sum: 1 },
            totalAmount: { $sum: { $ifNull: ["$totalAmount", 0] } },
            approved: {
              $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
            },
            pending: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
            },
            rejected: {
              $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            _id: 1,
            count: 1,
            totalAmount: 1,
            approved: 1,
            pending: 1,
            rejected: 1,
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      // Processing days: from requestedOn to approvedOn
      InternalRequisition.aggregate([
        {
          $match: {
            ...dateFilter,
            status: "approved",
            approvedOn: { $ne: null },
          },
        },
        {
          $project: {
            diffDays: {
              $divide: [
                { $subtract: ["$approvedOn", "$requestedOn"] },
                1000 * 60 * 60 * 24,
              ],
            },
          },
        },
        { $group: { _id: null, avgDays: { $avg: "$diffDays" } } },
      ]),
      InternalRequisition.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    const totalAmount = totalAmountAgg[0]?.total || 0;

    const approvalRate = totalCount
      ? Number(((approvedCount / totalCount) * 100).toFixed(1))
      : 0;
    const avgProcessingDays = approvalsForDuration[0]?.avgDays
      ? Number(approvalsForDuration[0].avgDays.toFixed(1))
      : 0;

    let monthOverMonthGrowth = 0;
    if (monthlyTrends.length >= 2) {
      const last = monthlyTrends[monthlyTrends.length - 1].count || 0;
      const prev = monthlyTrends[monthlyTrends.length - 2].count || 0;
      if (prev > 0) {
        monthOverMonthGrowth = Number(
          (((last - prev) / prev) * 100).toFixed(1),
        );
      } else if (last > 0) {
        monthOverMonthGrowth = 100;
      }
    }

    res.json({
      overview: {
        total: totalCount,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        totalAmount,
      },
      departmentStats,
      locationStats,
      recentRequisitions,
      monthlyTrends,
      insights: {
        approvalRate,
        avgProcessingDays,
        topDepartment: departmentStats[0]?._id || "N/A",
        monthOverMonthGrowth,
      },
      categoryCount,
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    res.status(500).json({ error: "Failed to fetch dashboard metrics" });
  }
};
