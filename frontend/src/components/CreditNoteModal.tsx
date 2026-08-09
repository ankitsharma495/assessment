import React, { useState } from "react";
import { orderAPI } from "../api";
import { Order } from "../types";
import { X, FileText, AlertCircle } from "lucide-react";

interface CreditNoteModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreditNoteModal: React.FC<CreditNoteModalProps> = ({
  order,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !order) return null;

  const [amount, setAmount] = useState<string>(
    order.balanceDue > 0 ? order.balanceDue.toString() : "0"
  );
  const [reason, setReason] = useState("");
  const [issueDate, setIssueDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const numericAmount = parseFloat(amount) || 0;
  const maxAllowed = order.balanceDue;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (numericAmount <= 0) {
      setError("Credit note amount must be greater than $0.00.");
      return;
    }

    if (numericAmount > maxAllowed + 0.001) {
      setError(
        `Credit note amount of $${numericAmount.toFixed(
          2
        )} exceeds remaining balance due of $${maxAllowed.toFixed(2)}.`
      );
      return;
    }

    if (!reason.trim()) {
      setError("Please specify a reason for issuing this credit note.");
      return;
    }

    setLoading(true);

    try {
      await orderAPI.issueCreditNote(order.id, {
        amount: numericAmount,
        reason,
        issueDate,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to issue credit note. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "480px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "700" }}>Issue Credit Note</h2>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Order #{order.orderNumber} ({order.customerName})
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#fca5a5",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Credit Amount ($)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={maxAllowed}
              className="form-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ fontSize: "1.1rem", fontWeight: "700" }}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Issue Date</label>
            <input
              type="date"
              className="form-input"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Reason / Remark</label>
            <textarea
              className="form-textarea"
              placeholder="e.g. Return of damaged goods, price adjustment"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || numericAmount > maxAllowed || numericAmount <= 0}
            >
              {loading ? "Issuing..." : "Issue Credit Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
