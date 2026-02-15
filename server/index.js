
import express from "express"
import cors from "cors"
import env from "dotenv"
import morgan from "morgan";
import dbConnect from "./src/configs/db.config.js";
import routes from "./src/routes/authRoute.js";


env.config({ quiet: true });

const app = express(); 
const PORT = process.env.PORT;
dbConnect();

// ====================== MIDDLEWARE ==================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// ====================== SAMPLE API ROUTE ======================

app.use("/api/auth", routes);

// ====================== 404 HANDLER ======================

app.use((req, res, next) => { res.status(404).json({
success: false,
message: "Route Not Found",
  });
});

// ====================== GLOBAL ERROR HANDLER ======================

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({success: false, message: err.message || "Internal Server Error",
  });
});

// ====================== SERVER START ======================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
