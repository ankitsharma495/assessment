import "reflect-metadata";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/database";
import apiRoutes from "./routes/api";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Ensure database is connected (essential for Vercel / serverless deployments)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error: any) {
    console.error("Database connection failure:", error);
    return res.status(500).json({
      success: false,
      message: "Database connection failed: " + (error?.message || String(error)),
    });
  }
});

// API Routes
app.use("/api", apiRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled Server Error:", err);
  res.status(500).json({
    success: false,
    message: err?.message || "Internal Server Error",
  });
});

export default app;
