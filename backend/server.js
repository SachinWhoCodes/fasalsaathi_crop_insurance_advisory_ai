require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./database/db");
const sessionMiddleware = require("./middleware/session");

const app = express();

connectDB()
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });

const allowedOrigins =
  process.env.NODE_ENV === "development"
    ? ["http://localhost:8080", "https://fasalsaathi-hackintime.vercel.app"]
    : ["https://fasalsaathi-hackintime.vercel.app"];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "ngrok-skip-browser-warning",
    ],
    credentials: true,
  })
);

app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.url} from ${
      req.headers.origin
    }`
  );
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(sessionMiddleware);

console.log("Loading auth-routes:", require.resolve("./routes/auth-routes"));
app.use("/api/auth", require("./routes/auth-routes"));

console.log(
  "Loading raw-report-routes:",
  require.resolve("./routes/raw-report-routes")
);
app.use("/api/data", require("./routes/raw-report-routes"));

app.get("/api/data/test", (req, res) => {
  res.json({ message: "Data route is working" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.get("/api/debug-session", (req, res) => {
  res.json({ session: req.session });
});

app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(500).json({ msg: "Something went wrong!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
