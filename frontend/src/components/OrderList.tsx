import React, { useState, useEffect } from "react";
import { Order, User } from "../types";
import { orderAPI } from "../api";
import { DollarSign, ChevronLeft, ChevronRight, Trash2, FileSpreadsheet, CheckSquare } from "lucide-react";

interface OrderListProps {
  currentUser?: User | null;
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  onRecordPayment: (order: Order) => void;
  onRefreshOrders?: () => void;
}

export const OrderList: React.FC<OrderListProps> = ({
  currentUser,
  orders,
  onSelectOrder,
  onRecordPayment,
  onRefreshOrders,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = currentUser?.role === "admin";

  // Reset page and selections when orders change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedOrderIds([]);
  }, [orders.length]);

  if (!orders || orders.length === 0) {
    return (
      <div
        className="table-card"
        style={{
          textAlign: "center",
          padding: "48px 24px",
          color: "var(--text-muted)",
        }}
      >
        <p style={{ fontSize: "1.05rem", fontWeight: "700", marginBottom: "6px", color: "var(--text-main)" }}>
          No orders found
        </p>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Create a new order to populate your store's dashboard.
        </p>
      </div>
    );
  }

  const totalItems = orders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Ensure current page does not exceed total pages
  const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages));

  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentOrders = orders.slice(startIndex, endIndex);

  // Selection handlers
  const isAllOnPageSelected =
    currentOrders.length > 0 && currentOrders.every((o) => selectedOrderIds.includes(o.id));

  const handleSelectAllOnPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const currentPageIds = currentOrders.map((o) => o.id);
      const combined = Array.from(new Set([...selectedOrderIds, ...currentPageIds]));
      setSelectedOrderIds(combined);
    } else {
      const currentPageIds = new Set(currentOrders.map((o) => o.id));
      setSelectedOrderIds(selectedOrderIds.filter((id) => !currentPageIds.has(id)));
    }
  };

  const handleToggleSelectRow = (id: number, e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk Delete Handler
  const handleBulkDelete = async () => {
    if (selectedOrderIds.length === 0) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedOrderIds.length} selected order(s)? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      await orderAPI.bulkDeleteOrders(selectedOrderIds);
      setSelectedOrderIds([]);
      if (onRefreshOrders) onRefreshOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to bulk delete orders.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Export Selected Orders to Excel / CSV
  const handleExportExcel = () => {
    const targetOrders = selectedOrderIds.length > 0
      ? orders.filter((o) => selectedOrderIds.includes(o.id))
      : orders;

    const headers = [
      "Order Number",
      "Customer Name",
      "Merchant Creator",
      "Order Date",
      "Due Date",
      "Total Amount ($)",
      "Total Paid ($)",
      "Balance Due ($)",
      "Status",
    ];

    const csvRows = [
      headers.join(","),
      ...targetOrders.map((o) =>
        [
          `"${o.orderNumber}"`,
          `"${o.customerName.replace(/"/g, '""')}"`,
          `"${(o.user?.name || "N/A").replace(/"/g, '""')}"`,
          `"${o.orderDate}"`,
          `"${o.dueDate}"`,
          o.totalAmount.toFixed(2),
          o.totalPaid.toFixed(2),
          o.balanceDue.toFixed(2),
          `"${o.status}"`,
        ].join(",")
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `CrossVal_Orders_Export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="table-card">
      {/* Floating Bulk Actions Bar when 1+ orders selected */}
      {selectedOrderIds.length > 0 && (
        <div
          style={{
            background: "#f3e8ff",
            borderBottom: "1px solid #e9d5ff",
            padding: "10px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", fontWeight: "600", color: "#6b21a8" }}>
            <CheckSquare size={16} />
            <span>{selectedOrderIds.length} order(s) selected</span>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleExportExcel}
              style={{ background: "#ffffff", border: "1px solid #d8b4fe", color: "#6b21a8", fontSize: "0.8rem", gap: "6px" }}
            >
              <FileSpreadsheet size={14} /> Export Selected to Excel (.csv)
            </button>

            <button
              className="btn btn-sm"
              onClick={handleBulkDelete}
              disabled={isDeleting}
              style={{ background: "#ef4444", color: "#ffffff", border: "none", fontSize: "0.8rem", gap: "6px" }}
            >
              <Trash2 size={14} /> {isDeleting ? "Deleting..." : `Delete Selected (${selectedOrderIds.length})`}
            </button>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ width: "40px", textAlign: "center" }}>
                <input
                  type="checkbox"
                  checked={isAllOnPageSelected}
                  onChange={handleSelectAllOnPage}
                  style={{ cursor: "pointer", width: "16px", height: "16px" }}
                />
              </th>
              <th>Order ID</th>
              <th>Customer / Items</th>

              {/* Dedicated Merchant Column for Admin View */}
              {isAdmin && (
                <th style={{ color: "var(--primary-purple)" }}>Merchant</th>
              )}

              <th style={{ textAlign: "right" }}>Total Amount</th>
              <th style={{ textAlign: "right" }}>Balance Due</th>
              <th>Date</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentOrders.map((order) => {
              const isPaid = order.status === "paid";
              const isSelected = selectedOrderIds.includes(order.id);
              const firstItemDesc =
                order.items && order.items.length > 0
                  ? order.items[0].description
                  : "Order Items";
              const itemCount = order.items ? order.items.length : 0;

              return (
                <tr
                  key={order.id}
                  onClick={() => onSelectOrder(order)}
                  style={{
                    cursor: "pointer",
                    background: isSelected ? "#faf5ff" : undefined,
                  }}
                  title="Click to view order details"
                >
                  <td
                    style={{ textAlign: "center" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleToggleSelectRow(order.id, e)}
                      style={{ cursor: "pointer", width: "16px", height: "16px" }}
                    />
                  </td>

                  <td style={{ fontWeight: "700", color: "var(--text-main)" }}>
                    {order.orderNumber}
                  </td>

                  <td>
                    <div style={{ fontWeight: "700", color: "var(--text-main)" }}>
                      {order.customerName}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>
                      {firstItemDesc} {itemCount > 1 ? `+${itemCount - 1} more` : ""}
                    </div>
                  </td>

                  {/* Dedicated Merchant Column for Admin View */}
                  {isAdmin && (
                    <td>
                      <div style={{ fontWeight: "600", color: "#1e293b", fontSize: "0.85rem" }}>
                        {order.user?.name || "N/A"}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        {order.user?.email || ""}
                      </div>
                    </td>
                  )}

                  <td style={{ textAlign: "right", fontWeight: "800", color: "var(--text-main)" }}>
                    ${order.totalAmount.toFixed(2)}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontWeight: "800",
                      color: order.balanceDue > 0 ? "#2563eb" : "#16a34a",
                    }}
                  >
                    ${order.balanceDue.toFixed(2)}
                  </td>
                  <td style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    {order.orderDate}
                  </td>
                  <td>
                    <span className={`badge badge-${order.status}`}>
                      {order.status === "paid"
                        ? "Successful"
                        : order.status === "partially_paid"
                        ? "Partially Paid"
                        : order.status.replace("_", " ")}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "6px", justifyContent: "flex-end" }}>
                      {!isPaid && (
                        <button
                          className="btn btn-purple btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRecordPayment(order);
                          }}
                          title="Record Payment"
                        >
                          <DollarSign size={14} /> Pay
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer Control Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          background: "#ffffff",
          borderTop: "1px solid var(--border-color)",
          fontSize: "0.85rem",
          color: "var(--text-muted)",
        }}
      >
        {/* Info Text */}
        <div>
          Showing <strong>{startIndex + 1}</strong> to <strong>{endIndex}</strong> of{" "}
          <strong>{totalItems}</strong> orders
        </div>

        {/* Rows per page & Page numbers */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Items per page dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span>Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                padding: "4px 8px",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                fontSize: "0.825rem",
                color: "var(--text-main)",
                background: "#ffffff",
                cursor: "pointer",
              }}
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>

          {/* Page controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <button
              className="btn btn-secondary btn-sm"
              style={{ padding: "4px 8px" }}
              disabled={validCurrentPage <= 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              <ChevronLeft size={14} /> Previous
            </button>

            {/* Page number buttons */}
            <div style={{ display: "flex", gap: "4px", margin: "0 4px" }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    border: pageNum === validCurrentPage ? "none" : "1px solid var(--border-color)",
                    background: pageNum === validCurrentPage ? "var(--primary-purple)" : "#ffffff",
                    color: pageNum === validCurrentPage ? "#ffffff" : "var(--text-main)",
                    fontWeight: pageNum === validCurrentPage ? "700" : "500",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              className="btn btn-secondary btn-sm"
              style={{ padding: "4px 8px" }}
              disabled={validCurrentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
