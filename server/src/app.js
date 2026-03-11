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
const allowedOrigins = [
  "http://102.36.135.18:3000",
  "http://10.10.253.3:3000",
  "http://localhost:3000",
  "http://localhost:3001",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like curl or server-side)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("CORS policy: Origin not allowed"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Tickets-Key",
    "X-Tickets-Token",
  ],
  credentials: true,
};

app.use("/uploads", express.static("public/uploads"));

// Apply CORS middleware BEFORE other middleware
app.use(cors(corsOptions));

// OR for development (allow all origins):
// app.use(cors());

app.use(bodyParser.json());
app.use(morgan("dev"));
app.use("/api", allRoutes);
app.use("/api/auth", authRoutes);

module.exports = app;
