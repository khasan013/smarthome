require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const flatRoutes = require("./routes/flatRoutes");
const noticeRoutes = require("./routes/noticeRoutes");
const billRoutes = require("./routes/billRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const facilityRoutes = require("./routes/facilityRoutes");
const profileRoutes = require("./routes/profileRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*",
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

app.get("/", (req, res) => {
  res.json({
    ok: true,
    name: "Smart Building Manager API",
    health: "/api/health"
  });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/flats", flatRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/facilities", facilityRoutes);
app.use("/api/profile", profileRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
