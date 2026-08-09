import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: "admin" | "user";
  };
}

export const authenticateJWT = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access token missing or invalid format",
    });
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET || "super-secret-key";

  try {
    const decoded = jwt.verify(token, secret) as {
      id: number;
      email: string;
      role: "admin" | "user";
    };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired access token",
    });
  }
};
