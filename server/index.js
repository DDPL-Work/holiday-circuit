import express from "express"
import cors from "cors"
import env from "dotenv"
import morgan from "morgan";
import dbConnect from "./src/configs/db.config.js";
import routes from "./src/routes/authRoute.js";
import adminRoutes from "./src/routes/admin.routes.js";
import agentRoutes from "./src/routes/agent.routes.js"
import opsRoutes from "./src/routes/ops.routes.js"
import dmcRoutes from "./src/routes/dmcRoutes.js"
import financeManagerRoutes from "./src/routes/financeManager.routes.js";


env.config({ quiet: true });

const app = express(); 
const PORT = process.env.PORT;
const REQUEST_BODY_LIMIT = process.env.REQUEST_BODY_LIMIT || "25mb";
dbConnect();

// ====================== MIDDLEWARE ==================
const allowedOrigins = [
  "https://holidaycircuit.com",
  "https://www.holidaycircuit.com",
  "https://admin.holidaycircuit.com",
  "https://agent.holidaycircuit.com",
  "https://dmc.holidaycircuit.com",
  "https://ops.holidaycircuit.com",
  "https://finance.holidaycircuit.com",
];
// const allowedOrigins = [
//   "http://localhost:5173",
//   "http://localhost:5174",
//   "http://localhost:5175",
//   "http://localhost:5176",
//   "http://localhost:5177",
// ];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cache-Control"],
}));
app.use(express.json({ limit: REQUEST_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: REQUEST_BODY_LIMIT }));
app.use(morgan("dev"));
import { pdfMemoryCache } from "./src/utils/pdfCache.js";

// Intercept /uploads requests to serve from memory cache if available
app.use("/uploads", (req, res, next) => {
  const cacheKey = `/uploads${req.path}`;
  if (pdfMemoryCache.has(cacheKey)) {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline");
    return res.send(pdfMemoryCache.get(cacheKey));
  }
  next();
});
app.use("/uploads", express.static("uploads"))

// ====================== SAMPLE API ROUTE ======================

app.use("/api/auth", routes);
app.use("/api/admin", adminRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/ops", opsRoutes);
app.use("/api/dmc", dmcRoutes);
app.use("/api/finance-manager", financeManagerRoutes);


// ====================== 404 HANDLER ======================

app.use((req, res, next) => { res.status(404).json({
success: false,
message: "Route Not Found",
  });
});

// ====================== GLOBAL ERROR HANDLER ======================

app.use((err, req, res, next) => {
  if (err?.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: `Request payload is too large. Max allowed size is ${REQUEST_BODY_LIMIT}.`,
    });
  }



  

  console.error(err.stack);
  res.status(err.statusCode || err.status || 500).json({success: false, message: err.message || "Internal Server Error",
  });
});





// ====================== SERVER START ======================
app.listen(PORT, () => {
  const env = process.env.NODE_ENV || "dev";
  console.log(`🚀 Server running in ${env} mode on port ${PORT}`);
});
