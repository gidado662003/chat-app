const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD_HASH =
  "$2b$10$Dh64vkjeb.GWVwKBiVE2IerJOSRAUr4ZUgBouWwRg4evffJkzYnyK"; // Expecting a pre-hashed password
async function adminLogin(req, res) {
  try {
    const { username, password } = req.body;

    if (
      username !== ADMIN_USERNAME ||
      !(await bcrypt.compare(password, ADMIN_PASSWORD_HASH))
    ) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    const token = jwt.sign({ isAdmin: true }, process.env.ADMIN_JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("admin_token", token, {
      httpOnly: true,
      secure: false,
      maxAge: 3600000,
      path: "/",
    });

    res.status(200).json({ message: "Admin login successful" });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { adminLogin };
