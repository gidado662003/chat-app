const fetch = require("node-fetch");
const User = require("../models/user.schema");

const AUTH_MODE = process.env.AUTH_MODE || "laravel";

const LARAVEL_BACKEND_URL =
  process.env.LARAVEL_BACKEND_URL || "http://10.10.253.3:8000";
const TICKETS_WEBHOOK_KEY = process.env.TICKETS_WEBHOOK_KEY;

async function validateSanctumToken(req, res, next) {
  try {
    // Special handling for external tickets webhook using static env key
    if (req.path === "/chats/tickets/webhook") {
      if (!TICKETS_WEBHOOK_KEY) {
        console.error(
          "TICKETS_WEBHOOK_KEY is not set in environment for tickets webhook",
        );
        return res.status(500).json({
          message: "Webhook key is not configured",
        });
      }

      const providedKey =
        req.headers["x-tickets-key"] || req.headers["x-tickets-token"];

      if (!providedKey || providedKey !== TICKETS_WEBHOOK_KEY) {
        return res.status(401).json({
          message: "Unauthorized: invalid webhook key",
        });
      }

      return next();
    }

    /* =========================================================
       🔥 MOCK AUTH MODE (Development Only)
    ========================================================= */
    if (AUTH_MODE === "mock") {
      let mongoUser = await User.findOne({ email: "dev@test.com" });

      if (!mongoUser) {
        mongoUser = await User.create({
          username: "dev.user",
          email: "dev@test.com",
          displayName: "Dev User",
          role: "admin",
          department: "Development",
        });
      }

      req.user = req.user = {
        id: mongoUser._id,
        name: mongoUser.displayName || mongoUser.username,
        email: mongoUser.email,
        role: mongoUser.role,
        department: {
          name: mongoUser.department || "Development",
        },
      };
      req.userId = mongoUser._id.toString();

      console.log("🧪 MOCK AUTH ACTIVE:", mongoUser.displayName);

      return next();
    }

    /* =========================================================
       🔥 LARAVEL AUTH MODE (Production)
    ========================================================= */

    const header = req.headers?.authorization;
    const cookieToken = req.cookies?.erp_token;
    const queryToken = req.query?.token;
    const bodyToken = req.body?.token;
    const token =
      header && header.startsWith("Bearer ")
        ? header.split(" ")[1]
        : cookieToken || queryToken || bodyToken;
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const response = await fetch(`${LARAVEL_BACKEND_URL}/api/user`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const laravelUser = await response.json();

    req.user = laravelUser;

    console.log("Laravel User:", {
      name: laravelUser.name,
      role: laravelUser.role,
      department: laravelUser.department?.name,
    });

    /* =========================================================
       🔥 AUTO SYNC WITH MONGO
    ========================================================= */

    const mappedRole =
      typeof laravelUser.role === "string" &&
      laravelUser.role.toLowerCase().includes("admin")
        ? "admin"
        : "user";

    let mongoUser = await User.findOne({
      $or: [{ email: laravelUser.email }, { laravel_id: laravelUser.id }],
    });

    /* ================= CREATE USER ================= */

    if (!mongoUser) {
      const baseFromEmail = laravelUser.email?.split("@")[0] || "";

      const baseFromName =
        laravelUser.name
          ?.toLowerCase()
          .trim()
          .replace(/\s+/g, ".")
          .replace(/[^a-z0-9_.-]/g, "") || "";

      const baseUsername =
        baseFromEmail || baseFromName || `user${laravelUser.id}` || "user";

      let attempt = 0;
      let created = false;

      while (!created && attempt < 5) {
        const suffix =
          attempt === 0 ? "" : `${attempt}${Math.floor(Math.random() * 1000)}`;

        const username = `${baseUsername}${suffix}`;

        try {
          mongoUser = await User.create({
            username,
            email: laravelUser.email,
            laravel_id: laravelUser.id,
            department:
              laravelUser.department?.name || laravelUser.department || null,
            displayName: laravelUser.name || "",
            phone: laravelUser.phone || null,
            avatar: laravelUser.profile_photo_url || null,
            role: mappedRole,
          });

          created = true;
        } catch (createErr) {
          if (createErr?.code === 11000 && createErr?.keyPattern?.username) {
            attempt += 1;
            continue;
          }

          throw createErr;
        }
      }

      if (!created || !mongoUser) {
        throw new Error("Failed to create synced user");
      }
    } else {
      /* ================= UPDATE USER ================= */
      mongoUser.displayName = laravelUser.name || mongoUser.displayName;

      mongoUser.phone = laravelUser.phone || mongoUser.phone;

      mongoUser.role = mappedRole;

      mongoUser.laravel_id = laravelUser.id;

      mongoUser.department =
        laravelUser.department?.name ||
        laravelUser.department ||
        mongoUser.department;

      mongoUser.avatar =
        laravelUser.profile_photo_url || mongoUser.avatar || null;

      await mongoUser.save();
    }

    req.userId = mongoUser._id.toString();

    next();
  } catch (err) {
    console.error("validateSanctumToken error:", err);
    return res.status(500).json({
      message: "Token validation failed",
    });
  }
}

module.exports = validateSanctumToken;
