import React, { useState } from "react";
import { Order } from "../types";
import {
  X,
  User,
  DollarSign,
  Package,
  Plus,
  FileText,
  Trash2,
  Download,
  CreditCard,
  Truck,
  History,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenRecordPayment: (order: Order) => void;
  onOpenCreditNote: (order: Order) => void;
  onDeletePayment: (paymentId: number) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  onOpenRecordPayment,
  onOpenCreditNote,
  onDeletePayment,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");

  if (!isOpen || !order) return null;

  const isFullyPaid = order.status === "paid";

  // Calculate additions & deductions totals
  let additionsTotal = 0;
  let deductionsTotal = 0;

  if (order.additionalCharges) {
    order.additionalCharges.forEach((ch) => {
      const amt = ch.amount || 0;
      if (ch.isDeduction) deductionsTotal += amt;
      else additionsTotal += amt;
    });
  }

  const handleExportCSV = () => {
    let csvContent = `data:text/csv;charset=utf-8,Order ID,Customer,Order Date,Due Date,Total Amount,Paid,Balance Due,Status\n`;
    csvContent += `"${order.orderNumber}","${order.customerName}","${order.orderDate}","${order.dueDate}",${order.totalAmount},${order.totalPaid},${order.balanceDue},"${order.status}"\n\nLine Items:\nDescription,Quantity,UnitPrice,Total\n`;
    order.items.forEach((item) => {
      csvContent += `"${item.description}",${item.quantity},${item.unitPrice},${item.quantity * item.unitPrice}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Order_${order.orderNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content order-detail-modal" style={{ maxWidth: "1040px" }}>
        {/* Clean Top Header */}
        <div
          style={{
            padding: "20px 28px",
            background: "#ffffff",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          {/* Row 1: Breadcrumb (Left) & Close Button (Right) */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: "500" }}>
              Orders / Order details
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

          {/* Row 2: Title & Status (Left) & Action Buttons (Right) */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2 style={{ fontSize: "1.35rem", fontWeight: "600", color: "#1e293b" }}>
                Order# {order.orderNumber}
              </h2>
              <span className={`badge badge-${order.status}`} style={{ fontSize: "0.72rem", padding: "3px 10px", fontWeight: "600" }}>
                {order.status === "paid" ? "Paid" : order.status.replace("_", " ")}
              </span>
            </div>

            {/* Right Action Buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button className="btn btn-secondary btn-sm" onClick={handleExportCSV} style={{ fontWeight: "500" }}>
                <Download size={13} /> Export
              </button>
              {!isFullyPaid && (
                <>
                  <button className="btn btn-secondary btn-sm" onClick={() => onOpenCreditNote(order)} style={{ fontWeight: "500" }}>
                    <FileText size={13} /> Credit Note
                  </button>
                  <button className="btn btn-purple btn-sm" onClick={() => onOpenRecordPayment(order)} style={{ fontWeight: "500" }}>
                    <Plus size={13} /> Record Payment
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Row 3: Navigation Tabs & Timestamps */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-light)", paddingTop: "10px" }}>
            {/* View Tabs */}
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                className={`tab-item ${activeTab === "overview" ? "active" : ""}`}
                style={{ padding: "6px 12px", fontSize: "0.8rem", fontWeight: "600" }}
                onClick={() => setActiveTab("overview")}
              >
                Order Details
              </button>
              <button
                className={`tab-item ${activeTab === "history" ? "active" : ""}`}
                style={{ padding: "6px 12px", fontSize: "0.8rem", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "6px" }}
                onClick={() => setActiveTab("history")}
              >
                <History size={14} />
                <span>Audit Log & History ({order.auditLogs ? order.auditLogs.length : 0})</span>
              </button>
            </div>

            {/* Timestamps Meta Bar */}
            <div style={{ display: "flex", gap: "20px", fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: "400" }}>
              <span>Placed: <strong style={{ fontWeight: "600", color: "#334155" }}>{order.orderDate}</strong></span>
              <span>Due: <strong style={{ fontWeight: "600", color: order.status === "overdue" ? "#dc2626" : "#334155" }}>{order.dueDate}</strong></span>
              <span>Total Paid: <strong style={{ fontWeight: "600", color: "#16a34a" }}>${order.totalPaid.toFixed(2)}</strong></span>
            </div>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="detail-modal-body" style={{ padding: "24px 28px" }}>
          {activeTab === "overview" ? (
            <>
              {/* Minimalist 3-Card Summary Grid */}
              <div className="detail-info-grid" style={{ gap: "16px", marginBottom: "20px" }}>
                {/* Card 1: Customer Details */}
                <div className="detail-info-card" style={{ padding: "14px 16px" }}>
                  <div className="detail-info-card-header" style={{ marginBottom: "10px", fontSize: "0.72rem", fontWeight: "600", color: "var(--text-muted)" }}>
                    <span>CUSTOMER DETAILS</span>
                    <User size={13} />
                  </div>
                  <div className="detail-info-row" style={{ marginBottom: "6px", fontSize: "0.825rem" }}>
                    <span className="detail-info-label" style={{ fontWeight: "400" }}>Customer Name:</span>
                    <span className="detail-info-value" style={{ fontWeight: "600" }}>{order.customerName}</span>
                  </div>
                  {order.user && (
                    <div className="detail-info-row" style={{ marginBottom: "6px", fontSize: "0.825rem" }}>
                      <span className="detail-info-label" style={{ fontWeight: "400" }}>Created By Merchant:</span>
                      <span className="detail-info-value" style={{ fontWeight: "600", color: "var(--primary-purple)" }}>
                        {order.user.name} ({order.user.email})
                      </span>
                    </div>
                  )}
                  <div className="detail-info-row" style={{ fontSize: "0.825rem" }}>
                    <span className="detail-info-label" style={{ fontWeight: "400" }}>Payment Terms:</span>
                    <span className="detail-info-value" style={{ fontWeight: "500" }}>Due on {order.dueDate}</span>
                  </div>
                </div>

                {/* Card 2: Financial Overview */}
                <div className="detail-info-card" style={{ padding: "14px 16px" }}>
                  <div className="detail-info-card-header" style={{ marginBottom: "10px", fontSize: "0.72rem", fontWeight: "600", color: "var(--text-muted)" }}>
                    <span>FINANCIAL OVERVIEW</span>
                    <DollarSign size={13} />
                  </div>
                  <div className="detail-info-row" style={{ marginBottom: "6px", fontSize: "0.825rem" }}>
                    <span className="detail-info-label" style={{ fontWeight: "400" }}>Total Amount:</span>
                    <span className="detail-info-value" style={{ fontWeight: "600", color: "var(--primary-purple)" }}>
                      ${order.totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="detail-info-row" style={{ fontSize: "0.825rem" }}>
                    <span className="detail-info-label" style={{ fontWeight: "400" }}>Balance Due:</span>
                    <span
                      className="detail-info-value"
                      style={{ fontWeight: "600", color: order.balanceDue > 0 ? "#2563eb" : "#16a34a" }}
                    >
                      ${order.balanceDue.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Card 3: Logistics & Remarks */}
                <div className="detail-info-card" style={{ padding: "14px 16px" }}>
                  <div className="detail-info-card-header" style={{ marginBottom: "10px", fontSize: "0.72rem", fontWeight: "600", color: "var(--text-muted)" }}>
                    <span>LOGISTICS & REMARKS</span>
                    <Truck size={13} />
                  </div>
                  <div className="detail-info-row" style={{ marginBottom: "6px", fontSize: "0.825rem" }}>
                    <span className="detail-info-label" style={{ fontWeight: "400" }}>Delivery Method:</span>
                    <span className="detail-info-value" style={{ fontWeight: "500" }}>Standard Freight</span>
                  </div>
                  <div className="detail-info-row" style={{ fontSize: "0.825rem" }}>
                    <span className="detail-info-label" style={{ fontWeight: "400" }}>Notes:</span>
                    <span className="detail-info-value" style={{ fontWeight: "500" }}>{order.notes || "None"}</span>
                  </div>
                </div>
              </div>

              {/* Minimalist Items Ordered Table Card */}
              <div className="table-card" style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    padding: "12px 20px",
                    fontWeight: "600",
                    fontSize: "0.875rem",
                    borderBottom: "1px solid var(--border-color)",
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#334155",
                  }}
                >
                  <Package size={15} style={{ color: "var(--primary-purple)" }} />
                  <span>Items Ordered ({order.items ? order.items.length : 0})</span>
                </div>

                <div className="table-container">
                  <table className="custom-table" style={{ fontSize: "0.825rem" }}>
                    <thead>
                      <tr>
                        <th style={{ padding: "10px 20px", fontWeight: "600", fontSize: "0.72rem" }}>Items Description</th>
                        <th style={{ padding: "10px 20px", textAlign: "center", fontWeight: "600", fontSize: "0.72rem" }}>Qty</th>
                        <th style={{ padding: "10px 20px", textAlign: "right", fontWeight: "600", fontSize: "0.72rem" }}>Price</th>
                        <th style={{ padding: "10px 20px", textAlign: "right", fontWeight: "600", fontSize: "0.72rem" }}>Line Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items &&
                        order.items.map((item, idx) => (
                          <tr key={idx}>
                            <td style={{ padding: "12px 20px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div
                                  style={{
                                    width: "28px",
                                    height: "28px",
                                    background: "#f8fafc",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "4px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "var(--text-muted)",
                                    flexShrink: 0,
                                  }}
                                >
                                  <Package size={14} />
                                </div>
                                <span style={{ fontWeight: "500", color: "#1e293b" }}>{item.description}</span>
                              </div>
                            </td>
                            <td style={{ padding: "12px 20px", textAlign: "center", fontWeight: "500" }}>{item.quantity}</td>
                            <td style={{ padding: "12px 20px", textAlign: "right", color: "var(--text-muted)" }}>${item.unitPrice.toFixed(2)}</td>
                            <td style={{ padding: "12px 20px", textAlign: "right", fontWeight: "600", color: "#1e293b" }}>
                              ${(item.quantity * item.unitPrice).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Minimalist Financial Breakdown Box */}
                <div style={{ padding: "16px 20px", background: "#f8fafc", borderTop: "1px solid var(--border-color)" }}>
                  <div className="breakdown-summary-box" style={{ margin: "0 0 0 auto", padding: "12px 16px", maxWidth: "300px" }}>
                    <div className="breakdown-row" style={{ fontSize: "0.825rem", color: "var(--text-muted)" }}>
                      <span>Subtotal:</span>
                      <span style={{ fontWeight: "500" }}>${order.subtotal.toFixed(2)}</span>
                    </div>
                    {additionsTotal > 0 && (
                      <div className="breakdown-row" style={{ fontSize: "0.825rem", color: "#2563eb" }}>
                        <span>Taxes & Freight:</span>
                        <span style={{ fontWeight: "500" }}>+${additionsTotal.toFixed(2)}</span>
                      </div>
                    )}
                    {deductionsTotal > 0 && (
                      <div className="breakdown-row" style={{ fontSize: "0.825rem", color: "#dc2626" }}>
                        <span>Discounts:</span>
                        <span style={{ fontWeight: "500" }}>-${deductionsTotal.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="breakdown-row total" style={{ fontSize: "0.95rem", fontWeight: "600" }}>
                      <span>Total Amount:</span>
                      <span style={{ color: "var(--primary-purple)", fontWeight: "700" }}>${order.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payments Received & Credit Notes Section */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {/* Payments Received Card */}
                <div className="table-card" style={{ padding: "16px 20px" }}>
                  <div
                    style={{
                      fontWeight: "600",
                      fontSize: "0.875rem",
                      marginBottom: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      color: "#334155",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <CreditCard size={15} />
                      <span>Payments Received ({order.payments ? order.payments.length : 0})</span>
                    </div>
                    {!isFullyPaid && (
                      <button
                        className="btn btn-purple btn-sm"
                        style={{ fontWeight: "500", padding: "4px 10px" }}
                        onClick={() => onOpenRecordPayment(order)}
                      >
                        <Plus size={13} /> Pay
                      </button>
                    )}
                  </div>

                  {order.payments && order.payments.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {order.payments.map((p) => (
                        <div
                          key={p.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background: "#f0fdf4",
                            border: "1px solid #bbf7d0",
                            padding: "12px 16px",
                            borderRadius: "8px",
                          }}
                        >
                          <div style={{ flex: "1", minWidth: "0" }}>
                            <div style={{ fontWeight: "600", fontSize: "0.825rem", color: "#166534" }}>
                              {p.paymentNumber}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "400", marginTop: "2px" }}>
                              {p.paymentMethod || "Bank Transfer"} • {p.paymentDate}
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "16px", flexShrink: 0 }}>
                            <span style={{ fontWeight: "600", fontSize: "0.9rem", color: "#16a34a" }}>
                              +${p.amount.toFixed(2)}
                            </span>
                            <button
                              className="btn btn-danger btn-sm"
                              style={{ padding: "4px 6px" }}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Delete payment ${p.paymentNumber} of $${p.amount.toFixed(
                                      2
                                    )}? Status will revert accordingly.`
                                  )
                                ) {
                                  onDeletePayment(p.id);
                                }
                              }}
                              title="Delete Payment"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", padding: "12px 0", textAlign: "center", fontWeight: "400" }}>
                      No payments recorded yet.
                    </div>
                  )}
                </div>

                {/* Credit Notes Card */}
                <div className="table-card" style={{ padding: "16px 20px" }}>
                  <div
                    style={{
                      fontWeight: "600",
                      fontSize: "0.875rem",
                      marginBottom: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      color: "#334155",
                    }}
                  >
                    <FileText size={15} />
                    <span>Credit Notes ({order.creditNotes ? order.creditNotes.length : 0})</span>
                  </div>

                  {order.creditNotes && order.creditNotes.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {order.creditNotes.map((cn) => (
                        <div
                          key={cn.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background: "#f3e8ff",
                            border: "1px solid #e9d5ff",
                            padding: "12px 16px",
                            borderRadius: "8px",
                          }}
                        >
                          <div style={{ flex: "1", minWidth: "0" }}>
                            <div style={{ fontWeight: "600", fontSize: "0.825rem", color: "#6b21a8" }}>
                              {cn.creditNoteNumber}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "400", marginTop: "2px" }}>
                              Reason: {cn.reason}
                            </div>
                          </div>
                          <span style={{ fontWeight: "600", fontSize: "0.9rem", color: "#7c3aed", marginLeft: "16px", flexShrink: 0 }}>
                            +${cn.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", padding: "12px 0", textAlign: "center", fontWeight: "400" }}>
                      No credit notes issued.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* AUDIT LOG & HISTORY TAB VIEW */
            <div className="table-card" style={{ padding: "20px 24px" }}>
              <div style={{ fontWeight: "600", fontSize: "0.95rem", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "#1e293b" }}>
                <Clock size={16} className="text-purple-600" />
                <span>Audit Trail & Activity Log</span>
              </div>

              {order.auditLogs && order.auditLogs.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px", position: "relative", paddingLeft: "16px" }}>
                  {/* Vertical Timeline Line */}
                  <div
                    style={{
                      position: "absolute",
                      left: "7px",
                      top: "10px",
                      bottom: "10px",
                      width: "2px",
                      background: "var(--border-color)",
                    }}
                  />

                  {order.auditLogs.map((log) => {
                    const dateFormatted = new Date(log.createdAt).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    });

                    let badgeColor = "#64748b";
                    let badgeBg = "#f1f5f9";

                    if (log.action === "PAYMENT_RECORDED") {
                      badgeColor = "#16a34a";
                      badgeBg = "#f0fdf4";
                    } else if (log.action === "PAYMENT_DELETED") {
                      badgeColor = "#dc2626";
                      badgeBg = "#fef2f2";
                    } else if (log.action === "CREDIT_NOTE_ISSUED") {
                      badgeColor = "#7c3aed";
                      badgeBg = "#f3e8ff";
                    } else if (log.action === "STATUS_CHANGED") {
                      badgeColor = "#2563eb";
                      badgeBg = "#eff6ff";
                    }

                    return (
                      <div
                        key={log.id}
                        style={{
                          position: "relative",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "12px",
                        }}
                      >
                        {/* Bullet Icon */}
                        <div
                          style={{
                            width: "16px",
                            height: "16px",
                            borderRadius: "50%",
                            background: badgeColor,
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.6rem",
                            marginTop: "3px",
                            zIndex: 1,
                          }}
                        />

                        {/* Content Box */}
                        <div
                          style={{
                            flex: 1,
                            background: "#ffffff",
                            border: "1px solid var(--border-color)",
                            borderRadius: "8px",
                            padding: "12px 16px",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                            <span
                              style={{
                                fontSize: "0.72rem",
                                fontWeight: "600",
                                color: badgeColor,
                                background: badgeBg,
                                padding: "2px 8px",
                                borderRadius: "4px",
                                textTransform: "uppercase",
                              }}
                            >
                              {log.action.replace("_", " ")}
                            </span>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              {dateFormatted}
                            </span>
                          </div>

                          <p style={{ fontSize: "0.825rem", color: "#334155", fontWeight: "400", lineHeight: "1.4" }}>
                            {log.description}
                          </p>

                          {log.previousStatus && log.newStatus && log.previousStatus !== log.newStatus && (
                            <div style={{ marginTop: "8px", fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                              <span>Status Transition:</span>
                              <span className={`badge badge-${log.previousStatus}`} style={{ fontSize: "0.68rem", padding: "2px 6px" }}>
                                {log.previousStatus}
                              </span>
                              <span>→</span>
                              <span className={`badge badge-${log.newStatus}`} style={{ fontSize: "0.68rem", padding: "2px 6px" }}>
                                {log.newStatus}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "center", padding: "24px 0" }}>
                  No audit logs recorded for this order yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
