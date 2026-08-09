import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Order } from "../models/Order";
import { Payment } from "../models/Payment";
import { OrderService } from "../services/orderService";

export const recordPayment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { orderId } = req.params;
    const { amount, paymentDate, paymentMethod, notes } = req.body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Payment amount must be a positive number greater than 0.",
      });
    }

    if (!paymentDate) {
      return res.status(400).json({
        success: false,
        message: "Payment date is required.",
      });
    }

    const order = await Order.findOne({
      where: { id: orderId, userId },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const result = await OrderService.recordPayment(order.id, userId, {
      amount,
      paymentDate,
      paymentMethod,
      notes,
    });

    return res.status(201).json({
      success: true,
      message: `Payment of $${amount.toFixed(2)} recorded successfully.`,
      data: {
        payment: result.payment,
        order: result.order,
      },
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to record payment.",
    });
  }
};

export const getOrderPayments = async (req: AuthRequest, res: Response) => {
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

    const payments = await Payment.findAll({
      where: { orderId: order.id },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch payments.",
    });
  }
};

export const deletePayment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { orderId, paymentId } = req.params;

    const order = await Order.findOne({ where: { id: orderId, userId } });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const updatedOrder = await OrderService.deletePayment(
      Number(paymentId),
      order.id
    );

    return res.status(200).json({
      success: true,
      message: "Payment deleted successfully. Order status and balance have been recalculated.",
      data: updatedOrder,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to delete payment.",
    });
  }
};
