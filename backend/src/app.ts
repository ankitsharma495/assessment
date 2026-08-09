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
  } catch (error) {
    next(error);
  }
});

// API Routes
app.use("/api", apiRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

export default app;
