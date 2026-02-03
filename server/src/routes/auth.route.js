const express = require("express");
const fetch = require("node-fetch");

const router = express.Router();

const LARAVEL_BACKEND_URL =
  process.env.LARAVEL_BACKEND_URL || "http://10.10.253.3:8000";

router.post("/token", express.json(), async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: "token required" });

  try {
    const response = await fetch(`${LARAVEL_BACKEND_URL}/api/user`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("Token exchange response status:", response);

    if (!response.ok) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const user = await response.json();
    console.log("User data received from Laravel backend:", user);

    res.cookie("erp_token", token, {
      httpOnly: true, // Prevents XSS (JavaScript access)
      secure: false, // Only sends over HTTPS                            // Protects against CSRF // 1 hour in milliseconds
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.json({ ok: true, user });
  } catch (err) {
    console.error("Token exchange error:", err);
    return res.status(500).json({ message: "Token validation failed" });
  }
});

module.exports = router;
