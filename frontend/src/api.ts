import axios from "axios";
import { Order, OrderStatus } from "./types";

const API_BASE_URL = "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  signup: async (data: { name: string; email: string; password: string; role?: "admin" | "user" }) => {
    const res = await api.post("/auth/signup", data);
    return res.data;
  },
  login: async (data: { email: string; password: string }) => {
    const res = await api.post("/auth/login", data);
    return res.data;
  },
  me: async () => {
    const res = await api.get("/auth/me");
    return res.data;
  },
};

export const orderAPI = {
  createOrder: async (data: {
    customerName: string;
    dueDate: string;
    orderDate?: string;
    notes?: string;
    items: Array<{ description: string; quantity: number; unitPrice: number }>;
    additionalCharges?: Array<{
      title: string;
      chargeType: "fixed" | "percentage";
      value: number;
      isDeduction: boolean;
    }>;
  }) => {
    const res = await api.post("/orders", data);
    return res.data;
  },
  getOrders: async (params?: { status?: OrderStatus; search?: string }) => {
    const res = await api.get("/orders", { params });
    return res.data;
  },
  getOrderById: async (id: number) => {
    const res = await api.get(`/orders/${id}`);
    return res.data;
  },
  recordPayment: async (
    orderId: number,
    data: {
      amount: number;
      paymentDate: string;
      paymentMethod?: string;
      notes?: string;
    }
  ) => {
    const res = await api.post(`/orders/${orderId}/payments`, data);
    return res.data;
  },
  issueCreditNote: async (
    orderId: number,
    data: {
      amount: number;
      reason: string;
      issueDate?: string;
    }
  ) => {
    const res = await api.post(`/orders/${orderId}/credit-notes`, data);
    return res.data;
  },
  deletePayment: async (orderId: number, paymentId: number) => {
    const res = await api.delete(`/orders/${orderId}/payments/${paymentId}`);
    return res.data;
  },
  bulkDeleteOrders: async (orderIds: number[]) => {
    const res = await api.post("/orders/bulk-delete", { orderIds });
    return res.data;
  },
};

export default api;
