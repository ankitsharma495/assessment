import React, { useState } from "react";
import { orderAPI } from "../api";
import { Order } from "../types";
import { X, DollarSign, Calendar, CreditCard, AlertCircle } from "lucide-react";

interface RecordPaymentModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  order,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !order) return null;

  const [amount, setAmount] = useState<string>(
    order.balanceDue > 0 ? order.balanceDue.toString() : "0"
  );
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const numericAmount = parseFloat(amount) || 0;
  const maxAllowed = order.balanceDue;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (numericAmount <= 0) {
      setError("Payment amount must be greater than $0.00.");
      return;
    }

    if (numericAmount > maxAllowed + 0.001) {
      setError(
        `Payment amount of $${numericAmount.toFixed(
          2
        )} exceeds maximum allowed balance due of $${maxAllowed.toFixed(
          2
        )}.`
      );
      return;
    }

    setLoading(true);

    try {
      await orderAPI.recordPayment(order.id, {
        amount: numericAmount,
        paymentDate,
        paymentMethod,
        notes,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to record payment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "520px", padding: "0", overflow: "hidden" }}>
        {/* Minimalist Top Header */}
        <div
          style={{
            padding: "20px 24px",
            background: "#ffffff",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#1e293b" }}>
              Record Payment
            </h2>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px", fontWeight: "400" }}>
              Order #{order.orderNumber} ({order.customerName})
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: "24px", background: "#f8fafc" }}>
          {/* Balance Status Card */}
          <div
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              padding: "14px 16px",
              borderRadius: "8px",
              marginBottom: "20px",
              display: "flex",
              justify: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <span style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: "600" }}>
                Current Remaining Balance
              </span>
              <div style={{ fontSize: "1.3rem", fontWeight: "700", color: "#2563eb", marginTop: "2px" }}>
                ${order.balanceDue.toFixed(2)}
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: "400" }}>
              <div>Total Order: ${order.totalAmount.toFixed(2)}</div>
              <div>Already Paid: ${order.totalPaid.toFixed(2)}</div>
            </div>
          </div>

          {error && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "0.825rem",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" style={{ fontSize: "0.78rem", fontWeight: "500", color: "#64748b" }}>
              Payment Amount ($)
            </label>
            <div style={{ position: "relative" }}>
              <DollarSign
                size={16}
                style={{ position: "absolute", left: "12px", top: "10px", color: "var(--text-dim)" }}
              />
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={maxAllowed}
                className="form-input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ paddingLeft: "36px", fontSize: "1rem", fontWeight: "600" }}
                required
              />
            </div>
            {numericAmount > maxAllowed && (
              <span style={{ fontSize: "0.75rem", color: "#dc2626", marginTop: "4px" }}>
                ⚠️ Warning: Amount exceeds maximum remaining balance of ${maxAllowed.toFixed(2)}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: "0.78rem", fontWeight: "500", color: "#64748b" }}>
              Payment Date
            </label>
            <div style={{ position: "relative" }}>
              <Calendar
                size={16}
                style={{ position: "absolute", left: "12px", top: "10px", color: "var(--text-dim)" }}
              />
              <input
                type="date"
                className="form-input"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                style={{ paddingLeft: "36px", fontSize: "0.85rem" }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: "0.78rem", fontWeight: "500", color: "#64748b" }}>
              Payment Method
            </label>
            <div style={{ position: "relative" }}>
              <CreditCard
                size={16}
                style={{ position: "absolute", left: "12px", top: "10px", color: "var(--text-dim)" }}
              />
              <select
                className="form-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{ paddingLeft: "36px", fontSize: "0.85rem" }}
              >
                <option value="Bank Transfer">Bank Transfer (ACH / Wire)</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / Digital Wallet</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: "0.78rem", fontWeight: "500", color: "#64748b" }}>
              Note / Reference (Optional)
            </label>
            <textarea
              className="form-textarea"
              placeholder="e.g. Transaction Ref #TXN-883921"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ fontSize: "0.825rem", minHeight: "60px" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ fontWeight: "500" }}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-purple"
              disabled={loading || numericAmount > maxAllowed || numericAmount <= 0}
              style={{ fontWeight: "500" }}
            >
              {loading ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
