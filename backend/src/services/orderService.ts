import { Order, OrderStatus } from "../models/Order";
import { OrderItem } from "../models/OrderItem";
import { OrderAdditionalCharge } from "../models/OrderAdditionalCharge";
import { Payment } from "../models/Payment";
import { CreditNote } from "../models/CreditNote";
import { OrderAuditLog } from "../models/OrderAuditLog";
import { User } from "../models/User";

export class OrderService {
  /**
   * Helper to write structured audit logs with timestamps.
   */
  static async logAudit(data: {
    orderId: number;
    action: string;
    previousStatus?: string;
    newStatus?: string;
    description: string;
    userId?: number;
  }) {
    try {
      await OrderAuditLog.create({
        orderId: data.orderId,
        action: data.action,
        previousStatus: data.previousStatus,
        newStatus: data.newStatus,
        description: data.description,
        performedByUserId: data.userId,
      });
    } catch (err) {
      console.error("Failed to write audit log:", err);
    }
  }

  /**
   * Recalculates order subtotal, additional charges, total amount, total paid, balance due, and status.
   */
  static async recalculateOrderStatusAndTotals(orderId: number): Promise<Order> {
    const order = await Order.findByPk(orderId, {
      include: [
        OrderItem,
        OrderAdditionalCharge,
        Payment,
        CreditNote,
        { model: User, attributes: ["id", "name", "email", "role"] },
      ],
    });

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found.`);
    }

    // 1. Compute Subtotal
    let subtotal = 0;
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        const itemTotal = Number((item.quantity * item.unitPrice).toFixed(2));
        if (item.totalPrice !== itemTotal) {
          item.totalPrice = itemTotal;
          await item.save();
        }
        subtotal += itemTotal;
      }
    }
    subtotal = Number(subtotal.toFixed(2));

    // 2. Compute Additional Charges
    let additionsTotal = 0;
    let deductionsTotal = 0;

    if (order.additionalCharges && order.additionalCharges.length > 0) {
      for (const charge of order.additionalCharges) {
        let chargeAmount = 0;
        if (charge.chargeType === "percentage") {
          chargeAmount = Number(((charge.value / 100) * subtotal).toFixed(2));
        } else {
          chargeAmount = Number(charge.value.toFixed(2));
        }

        if (charge.amount !== chargeAmount) {
          charge.amount = chargeAmount;
          await charge.save();
        }

        if (charge.isDeduction) {
          deductionsTotal += chargeAmount;
        } else {
          additionsTotal += chargeAmount;
        }
      }
    }

    additionsTotal = Number(additionsTotal.toFixed(2));
    deductionsTotal = Number(deductionsTotal.toFixed(2));

    const totalAmount = Math.max(
      0,
      Number((subtotal + additionsTotal - deductionsTotal).toFixed(2))
    );

    // 3. Compute Total Payments
    let totalPaid = 0;
    if (order.payments && order.payments.length > 0) {
      for (const p of order.payments) {
        totalPaid += Number(p.amount);
      }
    }
    totalPaid = Number(totalPaid.toFixed(2));

    // 4. Compute Total Credit Notes
    let totalCreditNotes = 0;
    if (order.creditNotes && order.creditNotes.length > 0) {
      for (const cn of order.creditNotes) {
        if (cn.status !== "Void") {
          totalCreditNotes += Number(cn.amount);
        }
      }
    }
    totalCreditNotes = Number(totalCreditNotes.toFixed(2));

    // 5. Balance Due
    const effectivePaid = Number((totalPaid + totalCreditNotes).toFixed(2));
    const balanceDue = Math.max(0, Number((totalAmount - effectivePaid).toFixed(2)));

    // 6. Derive Order Status
    const todayStr = new Date().toISOString().split("T")[0];
    let status: OrderStatus = "pending";

    if (effectivePaid >= totalAmount && totalAmount > 0) {
      status = "paid";
    } else if (effectivePaid > 0 && effectivePaid < totalAmount) {
      if (order.dueDate && todayStr > order.dueDate) {
        status = "overdue";
      } else {
        status = "partially_paid";
      }
    } else if (effectivePaid === 0) {
      if (order.dueDate && todayStr > order.dueDate) {
        status = "overdue";
      } else {
        status = "pending";
      }
    }

    const previousStatus = order.status;

    order.subtotal = subtotal;
    order.totalAmount = totalAmount;
    order.totalPaid = totalPaid;
    order.totalCreditNotes = totalCreditNotes;
    order.balanceDue = balanceDue;
    order.status = status;

    await order.save();

    if (previousStatus && previousStatus !== status) {
      await this.logAudit({
        orderId: order.id,
        action: "STATUS_CHANGED",
        previousStatus,
        newStatus: status,
        description: `Order status changed from '${previousStatus}' to '${status}'.`,
      });
    }

    return order;
  }

  /**
   * Records a payment against an order with over-payment prevention logic.
   */
  static async recordPayment(
    orderId: number,
    userId: number,
    paymentData: {
      amount: number;
      paymentDate: string;
      paymentMethod?: string;
      notes?: string;
    }
  ): Promise<{ payment: Payment; order: Order }> {
    const order = await Order.findByPk(orderId, {
      include: [OrderItem, OrderAdditionalCharge, Payment, CreditNote],
    });

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found.`);
    }

    const currentBalanceDue = order.balanceDue;
    const requestedAmount = Number(paymentData.amount.toFixed(2));

    if (requestedAmount <= 0) {
      throw new Error("Payment amount must be greater than zero.");
    }

    // Strict validation: Reject over-payment
    if (requestedAmount > currentBalanceDue + 0.001) {
      throw new Error(
        `Payment amount of $${requestedAmount.toFixed(
          2
        )} exceeds remaining balance of $${currentBalanceDue.toFixed(2)}.`
      );
    }

    const paymentNumber = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const payment = await Payment.create({
      paymentNumber,
      orderId,
      amount: requestedAmount,
      paymentDate: paymentData.paymentDate,
      paymentMethod: paymentData.paymentMethod || "Bank Transfer",
      notes: paymentData.notes,
      recordedByUserId: userId,
    });

    const previousStatus = order.status;
    const updatedOrder = await this.recalculateOrderStatusAndTotals(orderId);

    await this.logAudit({
      orderId,
      action: "PAYMENT_RECORDED",
      previousStatus,
      newStatus: updatedOrder.status,
      description: `Payment ${paymentNumber} of $${requestedAmount.toFixed(
        2
      )} recorded via ${paymentData.paymentMethod || "Bank Transfer"}. Balance due: $${updatedOrder.balanceDue.toFixed(2)}.`,
      userId,
    });

    return { payment, order: updatedOrder };
  }

  /**
   * Issues a credit note against an order.
   */
  static async issueCreditNote(
    orderId: number,
    userId: number,
    data: {
      amount: number;
      reason: string;
      issueDate: string;
    }
  ): Promise<{ creditNote: CreditNote; order: Order }> {
    const order = await Order.findByPk(orderId, {
      include: [Payment, CreditNote],
    });

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found.`);
    }

    const requestedAmount = Number(data.amount.toFixed(2));
    if (requestedAmount <= 0) {
      throw new Error("Credit note amount must be greater than zero.");
    }

    if (requestedAmount > order.balanceDue + 0.001) {
      throw new Error(
        `Credit note amount of $${requestedAmount.toFixed(
          2
        )} exceeds remaining balance due of $${order.balanceDue.toFixed(2)}.`
      );
    }

    const creditNoteNumber = `CN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const creditNote = await CreditNote.create({
      creditNoteNumber,
      orderId,
      amount: requestedAmount,
      reason: data.reason,
      issueDate: data.issueDate,
      status: "Applied",
      createdByUserId: userId,
    });

    const previousStatus = order.status;
    const updatedOrder = await this.recalculateOrderStatusAndTotals(orderId);

    await this.logAudit({
      orderId,
      action: "CREDIT_NOTE_ISSUED",
      previousStatus,
      newStatus: updatedOrder.status,
      description: `Credit Note ${creditNoteNumber} of $${requestedAmount.toFixed(
        2
      )} issued. Reason: ${data.reason}.`,
      userId,
    });

    return { creditNote, order: updatedOrder };
  }

  /**
   * Deletes a payment record and automatically recalculates order totals & status.
   */
  static async deletePayment(
    paymentId: number,
    orderId: number
  ): Promise<Order> {
    const payment = await Payment.findOne({
      where: { id: paymentId, orderId },
      include: [{ model: Order }],
    });

    if (!payment) {
      throw new Error(`Payment record with ID ${paymentId} not found.`);
    }

    const paymentNum = payment.paymentNumber;
    const paymentAmt = payment.amount;
    const previousStatus = payment.order ? payment.order.status : undefined;

    await payment.destroy();

    const updatedOrder = await this.recalculateOrderStatusAndTotals(orderId);

    await this.logAudit({
      orderId,
      action: "PAYMENT_DELETED",
      previousStatus,
      newStatus: updatedOrder.status,
      description: `Payment ${paymentNum} of $${paymentAmt.toFixed(
        2
      )} was deleted. Status changed from '${previousStatus || "unknown"}' to '${updatedOrder.status}'.`,
    });

    return updatedOrder;
  }
}
