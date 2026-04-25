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
app.use(cors());
app.use(express.json({ limit: REQUEST_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: REQUEST_BODY_LIMIT }));
app.use(morgan("dev"));
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
  res.status(err.status || 500).json({success: false, message: err.message || "Internal Server Error",
  });
});

// ====================== SERVER START ======================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

