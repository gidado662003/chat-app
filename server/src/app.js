const express = require("express");
const allRoutes = require("./routes/api");
const authRoutes = require("./routes/auth.route");
const cors = require("cors");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const app = express();
app.use(cookieParser());
// CORS Configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:3000", // Allow your frontend
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // Allow cookies/auth headers
};

app.use("/uploads", express.static("public/uploads"));

// Apply CORS middleware BEFORE other middleware
app.use(cors(corsOptions));

// OR for development (allow all origins):
// app.use(cors());

app.use(bodyParser.json());
app.use(morgan("dev"));
app.use("/api", allRoutes);
app.use("/auth", authRoutes);

module.exports = app;
