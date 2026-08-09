import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Order } from "../models/Order";
import { CreditNote } from "../models/CreditNote";
import { OrderService } from "../services/orderService";

export const issueCreditNote = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { orderId } = req.params;
    const { amount, reason, issueDate } = req.body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Credit note amount must be greater than zero.",
      });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reason for credit note is required.",
      });
    }

    const order = await Order.findOne({ where: { id: orderId, userId } });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const effectiveIssueDate = issueDate || new Date().toISOString().split("T")[0];

    const result = await OrderService.issueCreditNote(order.id, userId, {
      amount,
      reason,
      issueDate: effectiveIssueDate,
    });

    return res.status(201).json({
      success: true,
      message: `Credit note of $${amount.toFixed(2)} issued successfully.`,
      data: {
        creditNote: result.creditNote,
        order: result.order,
      },
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to issue credit note.",
    });
  }
};

export const getOrderCreditNotes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { orderId } = req.params;

    const order = await Order.findOne({ where: { id: orderId, userId } });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const creditNotes = await CreditNote.findAll({
      where: { orderId: order.id },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: creditNotes,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch credit notes.",
    });
  }
};
