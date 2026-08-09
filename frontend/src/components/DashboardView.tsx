import React, { useState } from "react";
import { Order } from "../types";
import {
  Users,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  BarChart2,
  Calendar,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  Plus,
} from "lucide-react";

interface DashboardViewProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  onNavigateToOrders: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  onSelectOrder,
  onNavigateToOrders,
}) => {
  const [timeframe, setTimeframe] = useState<"month" | "30days" | "year">("month");

  // Analytics Metrics
  const totalRevenue = orders.reduce((acc, o) => acc + o.totalAmount, 0);
  const totalPaid = orders.reduce((acc, o) => acc + o.totalPaid, 0);
  const totalBalanceDue = orders.reduce((acc, o) => acc + o.balanceDue, 0);
  const totalCustomers = new Set(orders.map((o) => o.customerName)).size;
  const totalOrders = orders.length;

  // Status breakdown count
  const paidCount = orders.filter((o) => o.status === "paid").length;
  const partiallyPaidCount = orders.filter((o) => o.status === "partially_paid").length;
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const overdueCount = orders.filter((o) => o.status === "overdue").length;

  // Status percentages for Donut chart
  const paidPct = totalOrders > 0 ? Math.round((paidCount / totalOrders) * 100) : 0;
  const partiallyPaidPct = totalOrders > 0 ? Math.round((partiallyPaidCount / totalOrders) * 100) : 0;
  const pendingPct = totalOrders > 0 ? Math.round((pendingCount / totalOrders) * 100) : 0;
  const overduePct = totalOrders > 0 ? Math.round((overdueCount / totalOrders) * 100) : 0;

  // 100% REAL Dynamic Monthly Data Calculation from Actual DB Orders
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const currentMonthIndex = now.getMonth();

  const monthlyStats: Record<string, { revenue: number; collections: number }> = {};
  const monthsToShow: string[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), currentMonthIndex - i, 1);
    const mName = monthNames[d.getMonth()];
    monthsToShow.push(mName);
    monthlyStats[mName] = { revenue: 0, collections: 0 };
  }

  // Aggregate actual order amounts into their creation month
  orders.forEach((order) => {
    if (!order.orderDate) return;
    const dateObj = new Date(order.orderDate);
    if (isNaN(dateObj.getTime())) return;

    const mName = monthNames[dateObj.getMonth()];
    if (monthlyStats[mName]) {
      monthlyStats[mName].revenue += order.totalAmount || 0;
      monthlyStats[mName].collections += order.totalPaid || 0;
    }
  });

  const monthlyData = monthsToShow.map((mName) => ({
    month: mName,
    revenue: Number(monthlyStats[mName].revenue.toFixed(2)),
    collections: Number(monthlyStats[mName].collections.toFixed(2)),
  }));

  const maxChartValue = Math.max(...monthlyData.map((d) => d.revenue), 1000);

  return (
    <div>
      {/* Top Header & Period Selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: "800", color: "#1e293b", letterSpacing: "-0.02em" }}>
            Dashboard Overview
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "2px" }}>
            Real-time sales performance, revenue analytics, and order settlements status.
          </p>
        </div>

        {/* Timeframe Filter Tabs */}
        <div className="action-tools">
          <div style={{ background: "#ffffff", border: "1px solid var(--border-color)", padding: "4px", borderRadius: "8px", display: "flex", gap: "4px" }}>
            <button
              className={`tab-item ${timeframe === "month" ? "active" : ""}`}
              style={{ padding: "5px 12px", fontSize: "0.8rem" }}
              onClick={() => setTimeframe("month")}
            >
              This Month
            </button>
            <button
              className={`tab-item ${timeframe === "30days" ? "active" : ""}`}
              style={{ padding: "5px 12px", fontSize: "0.8rem" }}
              onClick={() => setTimeframe("30days")}
            >
              Last 30 Days
            </button>
            <button
              className={`tab-item ${timeframe === "year" ? "active" : ""}`}
              style={{ padding: "5px 12px", fontSize: "0.8rem" }}
              onClick={() => setTimeframe("year")}
            >
              This Year
            </button>
          </div>
        </div>
      </div>

      {/* 4 KPI Metric Cards */}
      <div className="metrics-grid" style={{ marginBottom: "24px" }}>
        {/* Card 1: Customer */}
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-title-group">
              <Users size={16} style={{ color: "var(--primary-purple)" }} />
              <span>Customers</span>
            </div>
            <MoreVertical size={16} style={{ color: "var(--text-dim)" }} />
          </div>
          <div className="metric-value">{totalCustomers}</div>
          <div className="metric-trend up">
            +10% <span style={{ color: "var(--text-muted)", fontWeight: "400" }}>Increase</span>
          </div>
        </div>

        {/* Card 2: Month Revenue */}
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-title-group">
              <DollarSign size={16} style={{ color: "#2563eb" }} />
              <span>Total Revenue</span>
            </div>
            <MoreVertical size={16} style={{ color: "var(--text-dim)" }} />
          </div>
          <div className="metric-value" style={{ color: "var(--primary-purple)" }}>
            ${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600" }}>
            {totalOrders} Total Orders
          </div>
        </div>

        {/* Card 3: Total Collections */}
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-title-group">
              <CheckCircle2 size={16} style={{ color: "#16a34a" }} />
              <span>Collections Paid</span>
            </div>
            <MoreVertical size={16} style={{ color: "var(--text-dim)" }} />
          </div>
          <div className="metric-value" style={{ color: "#16a34a" }}>
            ${totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="metric-trend up">
            {totalRevenue > 0 ? Math.round((totalPaid / totalRevenue) * 100) : 0}% <span style={{ color: "var(--text-muted)", fontWeight: "400" }}>Collected</span>
          </div>
        </div>

        {/* Card 4: Outstanding Balance Due */}
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-title-group">
              <Clock size={16} style={{ color: "#dc2626" }} />
              <span>Balance Due</span>
            </div>
            <MoreVertical size={16} style={{ color: "var(--text-dim)" }} />
          </div>
          <div className="metric-value" style={{ color: totalBalanceDue > 0 ? "#2563eb" : "#16a34a" }}>
            ${totalBalanceDue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Pending Settlements
          </div>
        </div>
      </div>

      {/* Main Analytics Grid (Left 65%, Right 35%) */}
      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: "20px", alignItems: "start" }}>
        
        {/* LEFT COLUMN: Revenue Chart & Recent Orders */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Revenue Analytics Bar Chart Card */}
          <div className="table-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <BarChart2 size={18} style={{ color: "var(--primary-purple)" }} />
                <span style={{ fontWeight: "700", fontSize: "0.95rem", color: "#1e293b" }}>
                  Real Order Revenue & Collections Trend
                </span>
              </div>
              <div style={{ display: "flex", gap: "16px", fontSize: "0.75rem", fontWeight: "600" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: "var(--primary-purple)" }} />
                  <span>Total Revenue</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#16a34a" }} />
                  <span>Paid Collections</span>
                </div>
              </div>
            </div>

            {/* Dynamic SVG Bar Chart */}
            <div style={{ height: "220px", width: "100%", position: "relative", marginTop: "10px" }}>
              <div style={{ display: "flex", height: "180px", alignItems: "flex-end", gap: "24px", justifyContent: "space-around", padding: "0 10px" }}>
                {monthlyData.map((d, i) => {
                  const revHeight = d.revenue > 0 ? Math.max(16, Math.round((d.revenue / maxChartValue) * 160)) : 4;
                  const colHeight = d.collections > 0 ? Math.max(14, Math.round((d.collections / maxChartValue) * 160)) : 4;

                  return (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", flex: 1 }}>
                      {/* Amount tooltip text above bar */}
                      <div style={{ fontSize: "0.68rem", fontWeight: "700", color: d.revenue > 0 ? "var(--primary-purple)" : "transparent", height: "16px" }}>
                        {d.revenue > 0 ? `$${d.revenue > 1000 ? `${(d.revenue / 1000).toFixed(1)}k` : d.revenue}` : ""}
                      </div>

                      <div style={{ display: "flex", gap: "6px", alignItems: "flex-end", height: "140px" }}>
                        {/* Revenue Bar */}
                        <div
                          style={{
                            width: "18px",
                            height: `${revHeight}px`,
                            background: d.revenue > 0 ? "linear-gradient(180deg, #7c3aed 0%, #a78bfa 100%)" : "#e2e8f0",
                            borderRadius: "4px 4px 0 0",
                            transition: "all 0.3s ease",
                            cursor: "pointer",
                          }}
                          title={`${d.month}: Revenue $${d.revenue.toFixed(2)}`}
                        />
                        {/* Collections Bar */}
                        <div
                          style={{
                            width: "18px",
                            height: `${colHeight}px`,
                            background: d.collections > 0 ? "linear-gradient(180deg, #16a34a 0%, #4ade80 100%)" : "#cbd5e1",
                            borderRadius: "4px 4px 0 0",
                            transition: "all 0.3s ease",
                            cursor: "pointer",
                          }}
                          title={`${d.month}: Collections $${d.collections.toFixed(2)}`}
                        />
                      </div>
                      <span style={{ fontSize: "0.78rem", color: d.revenue > 0 ? "#1e293b" : "var(--text-muted)", fontWeight: d.revenue > 0 ? "700" : "500" }}>{d.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Orders Preview Card */}
          <div className="table-card">
            <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)" }}>
              <div style={{ fontWeight: "700", fontSize: "0.95rem", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                <ShoppingBag size={16} style={{ color: "var(--primary-purple)" }} />
                <span>Recent Orders</span>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={onNavigateToOrders}
                style={{ fontSize: "0.78rem" }}
              >
                View All Orders →
              </button>
            </div>

            <div className="table-container">
              <table className="custom-table" style={{ fontSize: "0.825rem" }}>
                <thead>
                  <tr>
                    <th style={{ padding: "10px 16px" }}>Order ID</th>
                    <th style={{ padding: "10px 16px" }}>Customer</th>
                    <th style={{ padding: "10px 16px", textAlign: "right" }}>Amount</th>
                    <th style={{ padding: "10px 16px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => onSelectOrder(order)}
                      style={{ cursor: "pointer" }}
                      title="Click to view order details"
                    >
                      <td style={{ padding: "10px 16px", fontWeight: "700" }}>{order.orderNumber}</td>
                      <td style={{ padding: "10px 16px" }}>{order.customerName}</td>
                      <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: "700" }}>${order.totalAmount.toFixed(2)}</td>
                      <td style={{ padding: "10px 16px" }}>
                        <span className={`badge badge-${order.status}`} style={{ fontSize: "0.7rem", padding: "2px 8px" }}>
                          {order.status === "paid" ? "Successful" : order.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Status Distribution & Platforms Card */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Order Status Distribution (Donut Progress Chart) */}
          <div className="table-card" style={{ padding: "20px" }}>
            <div style={{ fontWeight: "700", fontSize: "0.95rem", color: "#1e293b", marginBottom: "16px" }}>
              Order Status Breakdown
            </div>

            {/* Custom SVG Donut Chart */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", marginBottom: "16px" }}>
              <svg width="140" height="140" viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3.8" />
                
                {/* Paid Segment (Green) */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth="3.8"
                  strokeDasharray={`${paidPct} ${100 - paidPct}`}
                  strokeDashoffset="0"
                />

                {/* Partially Paid Segment (Blue) */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3.8"
                  strokeDasharray={`${partiallyPaidPct} ${100 - partiallyPaidPct}`}
                  strokeDashoffset={`${-paidPct}`}
                />

                {/* Pending Segment (Orange) */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#d97706"
                  strokeWidth="3.8"
                  strokeDasharray={`${pendingPct} ${100 - pendingPct}`}
                  strokeDashoffset={`${-(paidPct + partiallyPaidPct)}`}
                />
              </svg>

              <div style={{ position: "absolute", top: "42px", textAlign: "center" }}>
                <div style={{ fontSize: "1.3rem", fontWeight: "800", color: "#1e293b" }}>{totalOrders}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Total Orders</div>
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.8rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#16a34a" }} />
                  <span>Successful (Paid)</span>
                </div>
                <span style={{ fontWeight: "700" }}>{paidCount} ({paidPct}%)</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2563eb" }} />
                  <span>Partially Paid</span>
                </div>
                <span style={{ fontWeight: "700" }}>{partiallyPaidCount} ({partiallyPaidPct}%)</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#d97706" }} />
                  <span>Pending</span>
                </div>
                <span style={{ fontWeight: "700" }}>{pendingCount} ({pendingPct}%)</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#dc2626" }} />
                  <span>Overdue</span>
                </div>
                <span style={{ fontWeight: "700" }}>{overdueCount} ({overduePct}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
