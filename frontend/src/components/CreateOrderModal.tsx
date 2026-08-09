import React, { useState } from "react";
import { orderAPI } from "../api";
import { X, Plus, Trash2, Calculator } from "lucide-react";

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface AdditionalChargeInput {
  title: string;
  chargeType: "fixed" | "percentage";
  value: number;
  isDeduction: boolean;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [customerName, setCustomerName] = useState("");
  const [orderDate, setOrderDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<ItemInput[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);

  const [additionalCharges, setAdditionalCharges] = useState<
    AdditionalChargeInput[]
  >([]);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof ItemInput,
    val: string | number
  ) => {
    const nextItems = [...items];
    nextItems[index] = { ...nextItems[index], [field]: val };
    setItems(nextItems);
  };

  const handleAddCharge = () => {
    setAdditionalCharges([
      ...additionalCharges,
      { title: "", chargeType: "fixed", value: 0, isDeduction: false },
    ]);
  };

  const handleRemoveCharge = (index: number) => {
    setAdditionalCharges(additionalCharges.filter((_, i) => i !== index));
  };

  const handleChargeChange = (
    index: number,
    field: keyof AdditionalChargeInput,
    val: any
  ) => {
    const next = [...additionalCharges];
    next[index] = { ...next[index], [field]: val };
    setAdditionalCharges(next);
  };

  // Calculations
  const subtotal = items.reduce(
    (acc, curr) => acc + (Number(curr.quantity) || 0) * (Number(curr.unitPrice) || 0),
    0
  );

  let additionsTotal = 0;
  let deductionsTotal = 0;

  additionalCharges.forEach((ch) => {
    const val = Number(ch.value) || 0;
    let amt = 0;
    if (ch.chargeType === "percentage") {
      amt = (val / 100) * subtotal;
    } else {
      amt = val;
    }
    if (ch.isDeduction) {
      deductionsTotal += amt;
    } else {
      additionsTotal += amt;
    }
  });

  const finalTotal = Math.max(0, subtotal + additionsTotal - deductionsTotal);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) {
      setError("Customer name is required.");
      return;
    }

    if (!items.length || items.some((i) => !i.description.trim())) {
      setError("All line items must have a valid description.");
      return;
    }

    setLoading(true);

    try {
      await orderAPI.createOrder({
        customerName,
        orderDate,
        dueDate,
        notes,
        items: items.map((i) => ({
          description: i.description,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
        })),
        additionalCharges: additionalCharges.map((ch) => ({
          title: ch.title,
          chargeType: ch.chargeType,
          value: Number(ch.value),
          isDeduction: ch.isDeduction,
        })),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to create order. Check inputs."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "820px", padding: "0", overflow: "hidden" }}>
        {/* Minimalist Top Header */}
        <div
          style={{
            padding: "20px 28px",
            background: "#ffffff",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "var(--primary-purple-light)",
                color: "var(--primary-purple)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Calculator size={18} />
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#1e293b" }}>
              Create New Order
            </h2>
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

        {/* Form Body Container */}
        <form onSubmit={handleSubmit} style={{ padding: "24px 28px", background: "#f8fafc", maxHeight: "82vh", overflowY: "auto" }}>
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
                fontWeight: "500",
              }}
            >
              {error}
            </div>
          )}

          {/* Top Info Inputs Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "20px" }}>
            <div className="form-group" style={{ marginBottom: "0" }}>
              <label className="form-label" style={{ fontSize: "0.78rem", fontWeight: "500", color: "#64748b" }}>
                Customer Name
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Acme Corporation"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                style={{ fontSize: "0.85rem", fontWeight: "400" }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "0" }}>
              <label className="form-label" style={{ fontSize: "0.78rem", fontWeight: "500", color: "#64748b" }}>
                Order Creation Date
              </label>
              <input
                type="date"
                className="form-input"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                required
                style={{ fontSize: "0.85rem", fontWeight: "400" }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "0" }}>
              <label className="form-label" style={{ fontSize: "0.78rem", fontWeight: "500", color: "#64748b" }}>
                Payment Due Date
              </label>
              <input
                type="date"
                className="form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                style={{ fontSize: "0.85rem", fontWeight: "400" }}
              />
            </div>
          </div>

          {/* Line Items Card Section */}
          <div className="table-card" style={{ padding: "16px", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>
                Line Items ({items.length})
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddItem}
                style={{ fontWeight: "500", padding: "4px 10px" }}
              >
                <Plus size={13} /> Add Item
              </button>
            </div>

            {items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2.2fr 1fr 1.2fr 1fr auto",
                  gap: "10px",
                  alignItems: "center",
                  marginBottom: "8px",
                  background: "#ffffff",
                  border: "1px solid var(--border-color)",
                  padding: "8px 12px",
                  borderRadius: "8px",
                }}
              >
                <input
                  type="text"
                  className="form-input"
                  placeholder="Item Description"
                  value={item.description}
                  onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                  required
                  style={{ fontSize: "0.825rem", fontWeight: "400" }}
                />
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) =>
                    handleItemChange(idx, "quantity", parseInt(e.target.value) || 1)
                  }
                  required
                  style={{ fontSize: "0.825rem", fontWeight: "400", textAlign: "center" }}
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-input"
                  placeholder="Unit Price ($)"
                  value={item.unitPrice}
                  onChange={(e) =>
                    handleItemChange(idx, "unitPrice", parseFloat(e.target.value) || 0)
                  }
                  required
                  style={{ fontSize: "0.825rem", fontWeight: "400", textAlign: "right" }}
                />
                <div style={{ fontSize: "0.85rem", fontWeight: "600", textAlign: "right", color: "#1e293b" }}>
                  ${((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  style={{
                    background: "none",
                    border: "none",
                    color: items.length === 1 ? "#94a3b8" : "#dc2626",
                    cursor: items.length === 1 ? "not-allowed" : "pointer",
                    padding: "2px",
                  }}
                  disabled={items.length === 1}
                  title="Remove Item"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Order-level Additional Charges Section */}
          <div className="table-card" style={{ padding: "16px", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div>
                <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>
                  Order-Level Additional Charges & Discounts
                </span>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "400" }}>
                  Freight fees, GST/taxes, or discounts applied to order
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddCharge}
                style={{ fontWeight: "500", padding: "4px 10px" }}
              >
                <Plus size={13} /> Add Charge
              </button>
            </div>

            {additionalCharges.map((ch, idx) => (
              <div
                key={idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1.2fr auto",
                  gap: "10px",
                  alignItems: "center",
                  marginBottom: "8px",
                  background: "#ffffff",
                  border: "1px solid var(--border-color)",
                  padding: "8px 12px",
                  borderRadius: "8px",
                }}
              >
                <input
                  type="text"
                  className="form-input"
                  placeholder="Charge Name (Freight, Tax, Discount)"
                  value={ch.title}
                  onChange={(e) => handleChargeChange(idx, "title", e.target.value)}
                  required
                  style={{ fontSize: "0.825rem", fontWeight: "400" }}
                />
                <select
                  className="form-select"
                  value={ch.chargeType}
                  onChange={(e) => handleChargeChange(idx, "chargeType", e.target.value)}
                  style={{ fontSize: "0.825rem", fontWeight: "400" }}
                >
                  <option value="fixed">Fixed ($)</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="Value"
                  value={ch.value}
                  onChange={(e) => handleChargeChange(idx, "value", parseFloat(e.target.value) || 0)}
                  required
                  style={{ fontSize: "0.825rem", fontWeight: "400", textAlign: "right" }}
                />
                <select
                  className="form-select"
                  value={ch.isDeduction ? "discount" : "charge"}
                  onChange={(e) => handleChargeChange(idx, "isDeduction", e.target.value === "discount")}
                  style={{ fontSize: "0.825rem", fontWeight: "400" }}
                >
                  <option value="charge">+ Addition (Tax/Freight)</option>
                  <option value="discount">- Deduction (Discount)</option>
                </select>
                <button
                  type="button"
                  onClick={() => handleRemoveCharge(idx)}
                  style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", padding: "2px" }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Notes Input */}
          <div className="form-group" style={{ marginBottom: "20px" }}>
            <label className="form-label" style={{ fontSize: "0.78rem", fontWeight: "500", color: "#64748b" }}>
              Notes / Payment Terms (Optional)
            </label>
            <textarea
              className="form-textarea"
              placeholder="Add payment terms or notes for the customer..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ fontSize: "0.825rem", minHeight: "64px" }}
            />
          </div>

          {/* Totals Summary Panel */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid var(--border-color)",
              borderRadius: "10px",
              padding: "14px 18px",
              marginBottom: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.825rem", color: "var(--text-muted)" }}>
              <span>Subtotal (Items Total):</span>
              <span style={{ fontWeight: "500" }}>${subtotal.toFixed(2)}</span>
            </div>
            {additionsTotal > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.825rem", color: "#2563eb" }}>
                <span>Additional Charges (Taxes/Freight):</span>
                <span style={{ fontWeight: "500" }}>+${additionsTotal.toFixed(2)}</span>
              </div>
            )}
            {deductionsTotal > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.825rem", color: "#dc2626" }}>
                <span>Discounts:</span>
                <span style={{ fontWeight: "500" }}>-${deductionsTotal.toFixed(2)}</span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.95rem",
                fontWeight: "600",
                color: "#1e293b",
                borderTop: "1px solid var(--border-color)",
                paddingTop: "8px",
                marginTop: "4px",
              }}
            >
              <span>Order Total Amount:</span>
              <span style={{ color: "var(--primary-purple)", fontWeight: "700" }}>${finalTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ fontWeight: "500" }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-purple" disabled={loading} style={{ fontWeight: "500" }}>
              {loading ? "Creating Order..." : "Create Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
