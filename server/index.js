// index.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();

// ======================
// MIDDLEWARE
// ======================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// ======================
// BASIC ROUTE
// ======================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running 🚀",
  });
});

// ======================
// SAMPLE API ROUTE
// ======================
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    data: "Test API working properly",
  });
});

// ======================
// 404 HANDLER
// ======================
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route Not Found",
  });
});

// ======================
// GLOBAL ERROR HANDLER
// ======================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ======================
// SERVER START
// ======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
