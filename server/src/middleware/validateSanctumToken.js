const fetch = require("node-fetch");

const LARAVEL_BACKEND_URL =
  process.env.LARAVEL_BACKEND_URL || "http://10.10.253.3:8000";

async function validateSanctumToken(req, res, next) {
  const header = req.headers && req.headers.authorization;
  const cookieToken = req.cookies && req.cookies.erp_token;
  const queryToken = req.query && req.query.token;
  const token =
    header && header.startsWith("Bearer ")
      ? header.split(" ")[1]
      : cookieToken || queryToken;

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const response = await fetch(`${LARAVEL_BACKEND_URL}/api/user`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const user = await response.json();
    req.user = user;

    next();
  } catch (err) {
    console.error("validateSanctumToken error:", err);
    return res.status(500).json({ message: "Token validation failed" });
  }
}

module.exports = validateSanctumToken;
