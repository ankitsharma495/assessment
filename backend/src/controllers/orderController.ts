import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Order } from "../models/Order";
import { OrderItem } from "../models/OrderItem";
import { OrderAdditionalCharge } from "../models/OrderAdditionalCharge";
import { Payment } from "../models/Payment";
import { CreditNote } from "../models/CreditNote";
import { OrderAuditLog } from "../models/OrderAuditLog";
import { User } from "../models/User";
import { OrderService } from "../services/orderService";
import { Op } from "sequelize";

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      customerName,
      dueDate,
      orderDate,
      notes,
      items,
      additionalCharges,
    } = req.body;

    if (!customerName || !customerName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required.",
      });
    }

    if (!dueDate) {
      return res.status(400).json({
        success: false,
        message: "Payment due date is required.",
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one line item is required.",
      });
    }

    // Validate line items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.description || !item.description.trim()) {
        return res.status(400).json({
          success: false,
          message: `Line item #${i + 1} requires a valid description.`,
        });
      }
      if (typeof item.quantity !== "number" || item.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: `Line item #${i + 1} quantity must be a positive integer (>= 1).`,
        });
      }
      if (typeof item.unitPrice !== "number" || item.unitPrice < 0) {
        return res.status(400).json({
          success: false,
          message: `Line item #${i + 1} unit price must be a non-negative number (>= 0).`,
        });
      }
    }

    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const effectiveOrderDate = orderDate || new Date().toISOString().split("T")[0];

    const order = await Order.create({
      orderNumber,
      userId,
      customerName,
      orderDate: effectiveOrderDate,
      dueDate,
      notes,
      subtotal: 0,
      totalAmount: 0,
      totalPaid: 0,
      totalCreditNotes: 0,
      balanceDue: 0,
      status: "pending",
    });

    // Create line items
    for (const item of items) {
      const totalPrice = Number((item.quantity * item.unitPrice).toFixed(2));
      await OrderItem.create({
        orderId: order.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice,
      });
    }

    // Create additional charges if provided
    if (additionalCharges && Array.isArray(additionalCharges)) {
      for (const charge of additionalCharges) {
        if (charge.title && typeof charge.value === "number") {
          await OrderAdditionalCharge.create({
            orderId: order.id,
            title: charge.title,
            chargeType: charge.chargeType === "percentage" ? "percentage" : "fixed",
            value: charge.value,
            amount: 0, // Will be computed in recalculate
            isDeduction: Boolean(charge.isDeduction),
          });
        }
      }
    }

    // Compute totals & derived status
    const updatedOrder = await OrderService.recalculateOrderStatusAndTotals(order.id);

    await OrderService.logAudit({
      orderId: order.id,
      action: "ORDER_CREATED",
      newStatus: updatedOrder.status,
      description: `Order #${order.orderNumber} created for customer ${customerName} with total amount $${updatedOrder.totalAmount.toFixed(2)}.`,
      userId,
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: updatedOrder,
    });
  } catch (error: any) {
    console.error("Error in createOrder:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create order",
    });
  }
};

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { status, search, page, limit } = req.query;

    const whereClause: any = {};
    if (userRole !== "admin") {
      whereClause.userId = userId;
    }

    if (search && typeof search === "string" && search.trim()) {
      whereClause.customerName = {
        [Op.like]: `%${search.trim()}%`,
      };
    }

    const orders = await Order.findAll({
      where: whereClause,
      include: [
        OrderItem,
        OrderAdditionalCharge,
        Payment,
        CreditNote,
        { model: User, attributes: ["id", "name", "email", "role"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Fast in-memory status & financial totals calculation (0ms delay)
    const today = new Date().toISOString().split("T")[0];
    const updatedOrders = orders.map((ord) => {
      const ordJson = ord.toJSON() as any;
      const subtotal = (ordJson.items || []).reduce(
        (acc: number, item: any) => acc + item.quantity * item.unitPrice,
        0
      );

      let additionalTotal = 0;
      (ordJson.additionalCharges || []).forEach((ch: any) => {
        const val = ch.chargeType === "percentage" ? (subtotal * ch.value) / 100 : ch.value;
        if (ch.isDeduction) additionalTotal -= val;
        else additionalTotal += val;
      });

      const totalAmount = Math.max(0, Number((subtotal + additionalTotal).toFixed(2)));
      const totalPaid = Number(
        (ordJson.payments || []).reduce((acc: number, p: any) => acc + Number(p.amount), 0).toFixed(2)
      );
      const totalCreditNotes = Number(
        (ordJson.creditNotes || []).reduce((acc: number, cn: any) => acc + Number(cn.amount), 0).toFixed(2)
      );

      const effectivePaid = totalPaid + totalCreditNotes;
      const balanceDue = Math.max(0, Number((totalAmount - effectivePaid).toFixed(2)));

      let computedStatus = "pending";
      if (effectivePaid >= totalAmount && totalAmount > 0) {
        computedStatus = "paid";
      } else if (effectivePaid > 0) {
        computedStatus = "partially_paid";
      } else if (ordJson.dueDate < today) {
        computedStatus = "overdue";
      }

      ordJson.subtotal = subtotal;
      ordJson.totalAmount = totalAmount;
      ordJson.totalPaid = totalPaid;
      ordJson.totalCreditNotes = totalCreditNotes;
      ordJson.balanceDue = balanceDue;
      ordJson.status = computedStatus;
      return ordJson;
    }).filter((ord) => !status || ord.status === status);

    const totalItems = updatedOrders.length;
    const pageNum = page ? parseInt(page as string, 10) : 1;
    const limitNum = limit ? parseInt(limit as string, 10) : 10;

    return res.status(200).json({
      success: true,
      data: updatedOrders,
      pagination: {
        totalItems,
        currentPage: pageNum,
        totalPages: Math.ceil(totalItems / limitNum) || 1,
        limit: limitNum,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch orders",
    });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { id } = req.params;

    const whereClause: any = { id };
    if (userRole !== "admin") {
      whereClause.userId = userId;
    }

    const order = await Order.findOne({
      where: whereClause,
      include: [
        { model: OrderItem },
        { model: OrderAdditionalCharge },
        { model: Payment },
        { model: CreditNote },
        { model: OrderAuditLog },
        { model: User, attributes: ["id", "name", "email", "role"] },
      ],
      order: [[{ model: OrderAuditLog, as: "auditLogs" }, "createdAt", "DESC"]],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const updatedOrder = await OrderService.recalculateOrderStatusAndTotals(order.id);

    return res.status(200).json({
      success: true,
      data: updatedOrder,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch order details",
    });
  }
};

export const updateOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { customerName, dueDate, orderDate, notes, items, additionalCharges } = req.body;

    const order = await Order.findOne({
      where: { id, userId },
      include: [Payment],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if order already has payments
    if (order.payments && order.payments.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Order items cannot be updated after payments have been recorded. This order is locked.",
      });
    }

    if (customerName) order.customerName = customerName;
    if (dueDate) order.dueDate = dueDate;
    if (orderDate) order.orderDate = orderDate;
    if (notes !== undefined) order.notes = notes;

    await order.save();

    if (items && Array.isArray(items)) {
      await OrderItem.destroy({ where: { orderId: order.id } });
      for (const item of items) {
        const totalPrice = Number((item.quantity * item.unitPrice).toFixed(2));
        await OrderItem.create({
          orderId: order.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice,
        });
      }
    }

    if (additionalCharges && Array.isArray(additionalCharges)) {
      await OrderAdditionalCharge.destroy({ where: { orderId: order.id } });
      for (const charge of additionalCharges) {
        if (charge.title && typeof charge.value === "number") {
          await OrderAdditionalCharge.create({
            orderId: order.id,
            title: charge.title,
            chargeType: charge.chargeType === "percentage" ? "percentage" : "fixed",
            value: charge.value,
            amount: 0,
            isDeduction: Boolean(charge.isDeduction),
          });
        }
      }
    }

    const updatedOrder = await OrderService.recalculateOrderStatusAndTotals(order.id);

    return res.status(200).json({
      success: true,
      message: "Order updated successfully",
      data: updatedOrder,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update order",
    });
  }
};

export const deleteOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const order = await Order.findOne({ where: { id, userId } });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    await order.destroy();

    return res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete order",
    });
  }
};

export const bulkDeleteOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { orderIds } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No order IDs provided for deletion.",
      });
    }

    const whereClause: any = { id: { [Op.in]: orderIds } };
    if (userRole !== "admin") {
      whereClause.userId = userId;
    }

    const count = await Order.destroy({ where: whereClause });

    return res.status(200).json({
      success: true,
      message: `Successfully deleted ${count} order(s).`,
      deletedCount: count,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to bulk delete orders",
    });
  }
};
