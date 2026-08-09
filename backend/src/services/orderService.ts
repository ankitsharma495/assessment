import { Order, OrderStatus } from "../models/Order";
import { OrderItem } from "../models/OrderItem";
import { OrderAdditionalCharge } from "../models/OrderAdditionalCharge";
import { Payment } from "../models/Payment";
import { CreditNote } from "../models/CreditNote";
import { OrderAuditLog } from "../models/OrderAuditLog";
import { User } from "../models/User";
import { sequelize } from "../config/database";
import { Transaction } from "sequelize";

export interface DerivedOrderCalculations {
  subtotal: number;
  totalAmount: number;
  totalPaid: number;
  totalCreditNotes: number;
  balanceDue: number;
  status: OrderStatus;
}

export class OrderService {
  /**
   * Pure helper method to compute derived status & totals for any order object.
   * Ensures status derivation logic is defined in EXACTLY ONE place.
   */
  static computeDerivedStatus(order: any): DerivedOrderCalculations {
    const items = order.items || [];
    const additionalCharges = order.additionalCharges || [];
    const payments = order.payments || [];
    const creditNotes = order.creditNotes || [];

    let subtotal = 0;
    for (const item of items) {
      subtotal += Number((item.quantity * item.unitPrice).toFixed(2));
    }
    subtotal = Number(subtotal.toFixed(2));

    let additionsTotal = 0;
    let deductionsTotal = 0;
    for (const charge of additionalCharges) {
      let chargeAmount = 0;
      if (charge.chargeType === "percentage") {
        chargeAmount = Number(((charge.value / 100) * subtotal).toFixed(2));
      } else {
        chargeAmount = Number(Number(charge.value).toFixed(2));
      }
      if (charge.isDeduction) {
        deductionsTotal += chargeAmount;
      } else {
        additionsTotal += chargeAmount;
      }
    }
    additionsTotal = Number(additionsTotal.toFixed(2));
    deductionsTotal = Number(deductionsTotal.toFixed(2));

    const totalAmount = Math.max(
      0,
      Number((subtotal + additionsTotal - deductionsTotal).toFixed(2))
    );

    let totalPaid = 0;
    for (const p of payments) {
      totalPaid += Number(p.amount);
    }
    totalPaid = Number(totalPaid.toFixed(2));

    let totalCreditNotes = 0;
    for (const cn of creditNotes) {
      if (cn.status !== "Void") {
        totalCreditNotes += Number(cn.amount);
      }
    }
    totalCreditNotes = Number(totalCreditNotes.toFixed(2));

    const effectivePaid = Number((totalPaid + totalCreditNotes).toFixed(2));
    const balanceDue = Math.max(0, Number((totalAmount - effectivePaid).toFixed(2)));

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

    return {
      subtotal,
      totalAmount,
      totalPaid,
      totalCreditNotes,
      balanceDue,
      status,
    };
  }

  /**
   * Helper to write structured audit logs with timestamps.
   */
  static async logAudit(
    data: {
      orderId: number;
      action: string;
      previousStatus?: string;
      newStatus?: string;
      description: string;
      userId?: number;
    },
    transaction?: Transaction
  ) {
    try {
      await OrderAuditLog.create(
        {
          orderId: data.orderId,
          action: data.action,
          previousStatus: data.previousStatus,
          newStatus: data.newStatus,
          description: data.description,
          performedByUserId: data.userId,
        },
        { transaction }
      );
    } catch (err) {
      console.error("Failed to write audit log:", err);
    }
  }

  /**
   * Recalculates order subtotal, additional charges, total amount, total paid, balance due, and status.
   */
  static async recalculateOrderStatusAndTotals(
    orderId: number,
    transaction?: Transaction
  ): Promise<Order> {
    const order = await Order.findByPk(orderId, {
      include: [
        OrderItem,
        OrderAdditionalCharge,
        Payment,
        CreditNote,
        { model: User, attributes: ["id", "name", "email", "role"] },
      ],
      transaction,
    });

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found.`);
    }

    const calc = this.computeDerivedStatus(order);

    const previousStatus = order.status;
    order.subtotal = calc.subtotal;
    order.totalAmount = calc.totalAmount;
    order.totalPaid = calc.totalPaid;
    order.totalCreditNotes = calc.totalCreditNotes;
    order.balanceDue = calc.balanceDue;
    order.status = calc.status;

    await order.save({ transaction });

    if (previousStatus && previousStatus !== calc.status) {
      await this.logAudit(
        {
          orderId: order.id,
          action: "STATUS_CHANGED",
          previousStatus,
          newStatus: calc.status,
          description: `Order status changed from '${previousStatus}' to '${calc.status}'.`,
        },
        transaction
      );
    }

    return order;
  }

  /**
   * Records a payment against an order with transaction-level row locking for concurrency.
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
    return await sequelize.transaction(async (t) => {
      const order = await Order.findByPk(orderId, {
        include: [OrderItem, OrderAdditionalCharge, Payment, CreditNote],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!order) {
        throw new Error(`Order with ID ${orderId} not found.`);
      }

      const calc = this.computeDerivedStatus(order);
      const currentBalanceDue = calc.balanceDue;
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

      const payment = await Payment.create(
        {
          paymentNumber,
          orderId,
          amount: requestedAmount,
          paymentDate: paymentData.paymentDate,
          paymentMethod: paymentData.paymentMethod || "Bank Transfer",
          notes: paymentData.notes,
          recordedByUserId: userId,
        },
        { transaction: t }
      );

      const updatedOrder = await this.recalculateOrderStatusAndTotals(orderId, t);

      await this.logAudit(
        {
          orderId,
          action: "PAYMENT_RECORDED",
          previousStatus: order.status,
          newStatus: updatedOrder.status,
          description: `Payment ${paymentNumber} of $${requestedAmount.toFixed(
            2
          )} recorded via ${paymentData.paymentMethod || "Bank Transfer"}. Balance due: $${updatedOrder.balanceDue.toFixed(2)}.`,
          userId,
        },
        t
      );

      return { payment, order: updatedOrder };
    });
  }

  /**
   * Issues a credit note against an order with transaction-level row locking.
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
    return await sequelize.transaction(async (t) => {
      const order = await Order.findByPk(orderId, {
        include: [Payment, CreditNote],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!order) {
        throw new Error(`Order with ID ${orderId} not found.`);
      }

      const calc = this.computeDerivedStatus(order);
      const requestedAmount = Number(data.amount.toFixed(2));
      if (requestedAmount <= 0) {
        throw new Error("Credit note amount must be greater than zero.");
      }

      if (requestedAmount > calc.balanceDue + 0.001) {
        throw new Error(
          `Credit note amount of $${requestedAmount.toFixed(
            2
          )} exceeds remaining balance due of $${calc.balanceDue.toFixed(2)}.`
        );
      }

      const creditNoteNumber = `CN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const creditNote = await CreditNote.create(
        {
          creditNoteNumber,
          orderId,
          amount: requestedAmount,
          reason: data.reason,
          issueDate: data.issueDate,
          status: "Applied",
          createdByUserId: userId,
        },
        { transaction: t }
      );

      const updatedOrder = await this.recalculateOrderStatusAndTotals(orderId, t);

      await this.logAudit(
        {
          orderId,
          action: "CREDIT_NOTE_ISSUED",
          previousStatus: order.status,
          newStatus: updatedOrder.status,
          description: `Credit Note ${creditNoteNumber} of $${requestedAmount.toFixed(
            2
          )} issued. Reason: ${data.reason}.`,
          userId,
        },
        t
      );

      return { creditNote, order: updatedOrder };
    });
  }

  /**
   * Deletes a payment record and automatically recalculates order totals & status.
   */
  static async deletePayment(
    paymentId: number,
    orderId: number
  ): Promise<Order> {
    return await sequelize.transaction(async (t) => {
      const payment = await Payment.findOne({
        where: { id: paymentId, orderId },
        include: [{ model: Order }],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!payment) {
        throw new Error(`Payment record with ID ${paymentId} not found.`);
      }

      const paymentNum = payment.paymentNumber;
      const paymentAmt = payment.amount;
      const previousStatus = payment.order ? payment.order.status : undefined;

      await payment.destroy({ transaction: t });

      const updatedOrder = await this.recalculateOrderStatusAndTotals(orderId, t);

      await this.logAudit(
        {
          orderId,
          action: "PAYMENT_DELETED",
          previousStatus,
          newStatus: updatedOrder.status,
          description: `Payment ${paymentNum} of $${paymentAmt.toFixed(
            2
          )} was deleted. Status changed from '${previousStatus || "unknown"}' to '${updatedOrder.status}'.`,
        },
        t
      );

      return updatedOrder;
    });
  }
}
