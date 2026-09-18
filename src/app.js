import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ApiError } from "./utils/ApiError.js";

// =====================================================================
// ROUTE IMPORTS
// =====================================================================
// --- MEMBER 1 ROUTES ---
import authRouter from "./routes/auth.routes.js";
import schoolRouter from "./routes/school.routes.js";
import publicRouter from "./routes/public.routes.js";
import socialRouter from "./routes/social.routes.js";

// --- MEMBER 2 ROUTES ---
import masterDataRouter from "./routes/masterData.routes.js";
import voiceRouter from "./routes/voice.routes.js";
import templateRouter from "./routes/template.routes.js";
import grievanceRouter from "./routes/grievance.routes.js";
import authorityRouter from "./routes/authority.routes.js";
import adminRouter from "./routes/admin.routes.js";

const app = express();

// =====================================================================
// GLOBAL MIDDLEWARES
// =====================================================================
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// =====================================================================
// SYSTEM HEALTH CHECK ROUTE
// =====================================================================
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    statusCode: 200,
    success: true,
    message: "Samarthya Backend API is healthy and operational",
    timestamp: new Date().toISOString(),
  });
});

// =====================================================================
// MEMBER 1 ROUTE DECLARATIONS
// (User Access, School Discovery & Public Advocacy Suite)
// =====================================================================
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/schools", schoolRouter);
app.use("/api/v1/public", publicRouter);
app.use("/api/v1/social", socialRouter);

// =====================================================================
// MEMBER 2 ROUTE DECLARATIONS
// (Core Grievance Engine, Voice/STT, Templates & Authority Workflow)
// =====================================================================
app.use("/api/v1", masterDataRouter); // Handles /categories, /departments, /authorities
app.use("/api/v1/voice", voiceRouter);
app.use("/api/v1/templates", templateRouter);
app.use("/api/v1/grievances", grievanceRouter);
app.use("/api/v1/authority", authorityRouter);
app.use("/api/v1/admin", adminRouter);

// =====================================================================
// GLOBAL 404 NOT FOUND HANDLER
// =====================================================================
app.use((req, res, next) => {
  res.status(404).json({
    statusCode: 404,
    success: false,
    message: `API endpoint not found: [${req.method}] ${req.originalUrl}`,
    errors: ["Route not found"],
  });
});

// =====================================================================
// GLOBAL ERROR HANDLER MIDDLEWARE
// =====================================================================
app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      statusCode: err.statusCode,
      success: false,
      message: err.message,
      errors: err.errors || [],
    });
  }

  // Unhandled internal errors
  console.error("Unhandled Server Error:", err);
  return res.status(500).json({
    statusCode: 500,
    success: false,
    message: err.message || "Internal Server Error",
    errors: process.env.NODE_ENV === "development" ? [err.stack] : [],
  });
});

export { app };
export default app;
