const express  = require("express");
const mongoose = require("mongoose");
const fs       = require("fs");
const cors     = require("cors");
require("dotenv").config();

// ── CRITICAL: Validate required env vars before anything else ──
// If SECRET_KEY is missing, crypto-js silently uses the string
// "undefined" as the AES key. Data appears to encrypt/decrypt
// fine in the same session but is permanently unreadable if the
// server ever restarts with a proper key set.
const REQUIRED_ENV = ["MONGO_URI", "SECRET_KEY"];
const missingEnv   = REQUIRED_ENV.filter(k => !process.env[k]);
if (missingEnv.length) {
  console.error(`❌ Missing required environment variables: ${missingEnv.join(", ")}`);
  console.error("   Add them to your .env file and restart the server.");
  process.exit(1);
}

if (!fs.existsSync("./uploads")) fs.mkdirSync("./uploads");

const datasetRoutes  = require("./routes/datasetRoutes");
const accessRoutes   = require("./routes/accessRoutes");
const disasterRoutes = require("./routes/disasterRoutes");
const systemRoutes   = require("./routes/systemRoutes");

const app = express();

// app.use(cors({
//   origin: process.env.FRONTEND_URL || "http://localhost:3000",
//   credentials: true
// }));

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5000",
  // Primary production frontend — set this in Render env vars
  process.env.FRONTEND_URL,
].filter(Boolean).map(o => o.replace(/\/$/, "")); // strip trailing slashes
 
const corsOptions = {
  origin: (origin, callback) => {
    // No origin = non-browser request (curl, Postman, mobile app
    // without a webview, server-to-server) — always allow.
    if (!origin) return callback(null, true);
 
    const cleanOrigin = origin.replace(/\/$/, "");
 
    // Exact match against the allowlist
    if (ALLOWED_ORIGINS.includes(cleanOrigin)) {
      return callback(null, true);
    }
 
    // Allow any Vercel preview deployment automatically.
    // Vercel preview URLs follow the pattern:
    //   https://<project>-<hash>-<team>.vercel.app
    if (cleanOrigin.endsWith(".vercel.app")) {
      return callback(null, true);
    }
 
    // Blocked
    console.warn(`🚫 CORS blocked origin: ${origin}`);
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods:     ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};
 
// Apply CORS to all routes including preflight OPTIONS requests
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

app.use("/api/dataset",  datasetRoutes);
app.use("/api/access",   accessRoutes);
app.use("/api/disaster", disasterRoutes);
app.use("/api/system",   systemRoutes);

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date(),
    services: {
      database:           mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      disasterMonitoring: "active"
    }
  });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Global error:", err);
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API available at http://localhost:${PORT}/api`);
  console.log(`🚨 Disaster monitoring enabled at http://localhost:${PORT}/api/disaster`);
});