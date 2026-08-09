import "reflect-metadata";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRoutes from "./routes/api";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api", apiRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

export default app;
