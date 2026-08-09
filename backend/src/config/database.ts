import { Sequelize } from "sequelize-typescript";
import dotenv from "dotenv";
import { User } from "../models/User";
import { Order } from "../models/Order";
import { OrderItem } from "../models/OrderItem";
import { Payment } from "../models/Payment";
import { CreditNote } from "../models/CreditNote";
import { OrderAdditionalCharge } from "../models/OrderAdditionalCharge";
import { OrderAuditLog } from "../models/OrderAuditLog";

dotenv.config();

const models = [
  User,
  Order,
  OrderItem,
  Payment,
  CreditNote,
  OrderAdditionalCharge,
  OrderAuditLog,
];

const isTest = process.env.NODE_ENV === "test";
const databaseUrl = isTest ? undefined : (process.env.DATABASE_URL || process.env.NEON_DATABASE_URL);

export const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, {
      dialect: "postgres",
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false, // Required for Neon Postgres SSL connection
        },
      },
      models,
    })
  : new Sequelize({
      dialect: "sqlite",
      storage: process.env.DB_STORAGE || "./database.sqlite",
      logging: false,
      models,
    });

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) return;
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    isConnected = true;

    // Auto-migration helper for Neon PostgreSQL / SQLite
    try {
      if (databaseUrl) {
        // Ensure 'role' column exists in users
        await sequelize.query(`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name='users' AND column_name='role'
            ) THEN
              ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user';
            END IF;
          END $$;
        `);

        // Ensure 'order_audit_logs' table exists
        await sequelize.query(`
          CREATE TABLE IF NOT EXISTS order_audit_logs (
            id SERIAL PRIMARY KEY,
            "orderId" INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            action VARCHAR(255) NOT NULL,
            "previousStatus" VARCHAR(255),
            "newStatus" VARCHAR(255),
            description TEXT NOT NULL,
            "performedByUserId" INTEGER,
            "performedByName" VARCHAR(255),
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
          );
        `);
      } else {
        await sequelize.query(`ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user';`).catch(() => {});
      }
    } catch (migErr: any) {
      console.log("Migration helper completed:", migErr?.message || migErr);
    }

    console.log(
      databaseUrl
        ? "Connected & synced to Neon PostgreSQL successfully."
        : "Connected & synced to SQLite database successfully."
    );
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};
