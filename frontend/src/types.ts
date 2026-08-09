export interface User {
  id: number;
  name: string;
  email: string;
  role?: "admin" | "user";
}

export interface OrderItem {
  id?: number;
  orderId?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
}

export interface OrderAdditionalCharge {
  id?: number;
  orderId?: number;
  title: string;
  chargeType: "fixed" | "percentage";
  value: number;
  amount?: number;
  isDeduction: boolean;
}

export interface Payment {
  id: number;
  paymentNumber: string;
  orderId: number;
  amount: number;
  paymentDate: string;
  paymentMethod?: string;
  notes?: string;
  recordedByUserId: number;
  createdAt: string;
}

export interface CreditNote {
  id: number;
  creditNoteNumber: string;
  orderId: number;
  amount: number;
  reason: string;
  issueDate: string;
  status: "Issued" | "Applied" | "Void";
  createdByUserId: number;
  createdAt: string;
}

export interface OrderAuditLog {
  id: number;
  orderId: number;
  action: string;
  previousStatus?: string;
  newStatus?: string;
  description: string;
  performedByUserId?: number;
  performedByName?: string;
  createdAt: string;
}

export type OrderStatus = "pending" | "partially_paid" | "paid" | "overdue";

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  customerName: string;
  orderDate: string;
  dueDate: string;
  subtotal: number;
  totalAmount: number;
  totalPaid: number;
  totalCreditNotes: number;
  balanceDue: number;
  status: OrderStatus;
  notes?: string;
  items: OrderItem[];
  additionalCharges?: OrderAdditionalCharge[];
  payments?: Payment[];
  creditNotes?: CreditNote[];
  auditLogs?: OrderAuditLog[];
  user?: User;
  createdAt: string;
  updatedAt: string;
}
