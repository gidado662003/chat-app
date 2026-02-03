const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");
const User = require("../models/user.schema");

const LARAVEL_BACKEND_URL =
  process.env.LARAVEL_BACKEND_URL || "http://10.10.253.3:8000";

async function authMiddleware(req, res, next) {
  // 1) Try JWT (legacy / same-origin cookie)
  const jwtToken = req.cookies && req.cookies.token;
  if (jwtToken) {
    try {
      const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);
      req.userId = decoded.userId;
      return next();
    } catch (err) {
      // JWT invalid, fall through to Sanctum
    }
  }

  // 2) Try Sanctum (erp_token cookie or Authorization header)
  const header = req.headers && req.headers.authorization;
  const cookieToken = req.cookies && req.cookies.erp_token;
  const queryToken = req.query && req.query.token;
  const sanctumToken =
    header && header.startsWith("Bearer ")
      ? header.split(" ")[1]
      : cookieToken || queryToken;

  if (!sanctumToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const response = await fetch(`${LARAVEL_BACKEND_URL}/api/user`, {
      headers: { Authorization: `Bearer ${sanctumToken}` },
    });
    if (!response.ok) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    const laravelUser = await response.json();
    req.user = laravelUser;
    console.log("laravelUser", { name: laravelUser.name, role: laravelUser.role, department: laravelUser.department.name });

    const user = await User.findOne({
      $or: [{ email: laravelUser.email }, { laravel_id: laravelUser.id }],
    });
    if (!user) {
      return res.status(401).json({
        message: "User not synced. Complete profile sync first.",
      });
    }
    req.userId = user._id.toString();

    next();
  } catch (err) {
    console.error("authMiddleware Sanctum error:", err);
    return res.status(500).json({ message: "Token validation failed" });
  }
}

module.exports = authMiddleware;
