const dashboardService = require("../../../services/internalRequisitionDashboard.service");

// Get priority distribution
exports.getPriorityDistribution = async (req, res) => {
  try {
    const data = await dashboardService.getPriorityDistribution(req.query);
    res.json(data);
  } catch (error) {
    console.error("Error fetching priority distribution:", error);
    res.status(500).json({ error: "Failed to fetch priority distribution" });
  }
};

// Get amount range analysis
exports.getAmountRanges = async (req, res) => {
  try {
    const data = await dashboardService.getAmountRanges(req.query);
    res.json(data);
  } catch (error) {
    console.error("Error fetching amount ranges:", error);
    res.status(500).json({ error: "Failed to fetch amount ranges" });
  }
};

// Get approval trends over time
exports.getApprovalTrends = async (req, res) => {
  try {
    const data = await dashboardService.getApprovalTrends(req.query);
    res.json(data);
  } catch (error) {
    console.error("Error fetching approval trends:", error);
    res.status(500).json({ error: "Failed to fetch approval trends" });
  }
};

// Get department performance trends
exports.getDepartmentTrends = async (req, res) => {
  try {
    const data = await dashboardService.getDepartmentTrends(req.query);
    res.json(data);
  } catch (error) {
    console.error("Error fetching department trends:", error);
    res.status(500).json({ error: "Failed to fetch department trends" });
  }
};

// Get processing time distribution
exports.getProcessingTimeDistribution = async (req, res) => {
  try {
    const data = await dashboardService.getProcessingTimeDistribution(
      req.query,
    );
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
    const data = await dashboardService.getHourlyPatterns(req.query);
    res.json(data);
  } catch (error) {
    console.error("Error fetching hourly patterns:", error);
    res.status(500).json({ error: "Failed to fetch hourly patterns" });
  }
};

// Get dashboard metrics
exports.getDashboardMetrics = async (req, res) => {
  try {
    const metrics = await dashboardService.getDashboardMetrics(req.query);
    res.json(metrics);
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    res.status(500).json({ error: "Failed to fetch dashboard metrics" });
  }
};
