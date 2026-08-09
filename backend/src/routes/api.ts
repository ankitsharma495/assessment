import { Router } from "express";
import { signup, login, me } from "../controllers/authController";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  bulkDeleteOrders,
} from "../controllers/orderController";
import { recordPayment, getOrderPayments, deletePayment } from "../controllers/paymentController";
import {
  issueCreditNote,
  getOrderCreditNotes,
} from "../controllers/creditNoteController";
import { authenticateJWT } from "../middleware/auth";

const router = Router();

// Auth routes
router.post("/auth/signup", signup);
router.post("/auth/login", login);
router.get("/auth/me", authenticateJWT, me);

// Order routes
router.post("/orders", authenticateJWT, createOrder);
router.get("/orders", authenticateJWT, getOrders);
router.post("/orders/bulk-delete", authenticateJWT, bulkDeleteOrders);
router.get("/orders/:id", authenticateJWT, getOrderById);
router.put("/orders/:id", authenticateJWT, updateOrder);
router.delete("/orders/:id", authenticateJWT, deleteOrder);

// Payment routes
router.post("/orders/:orderId/payments", authenticateJWT, recordPayment);
router.get("/orders/:orderId/payments", authenticateJWT, getOrderPayments);
router.delete("/orders/:orderId/payments/:paymentId", authenticateJWT, deletePayment);

// Credit Note routes
router.post("/orders/:orderId/credit-notes", authenticateJWT, issueCreditNote);
router.get("/orders/:orderId/credit-notes", authenticateJWT, getOrderCreditNotes);

export default router;
