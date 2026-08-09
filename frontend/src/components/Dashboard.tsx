import React, { useState } from "react";
import { Order, OrderStatus, User } from "../types";
import { OrderList } from "./OrderList";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Package,
  MoreVertical,
  Search,
  Filter,
  X,
  BarChart3,
} from "lucide-react";

interface DashboardProps {
  user: User | null;
  orders: Order[];
  currentFilter: OrderStatus | "ALL";
  onFilterChange: (status: OrderStatus | "ALL") => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectOrder: (order: Order) => void;
  onRecordPayment: (order: Order) => void;
  onRefreshOrders?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  orders,
  currentFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  onSelectOrder,
  onRecordPayment,
  onRefreshOrders,
}) => {
  const [showBanner, setShowBanner] = useState(true);

  // Aggregate Metrics
  const totalVolume = orders.reduce((acc, o) => acc + o.totalAmount, 0);
  const totalOrdersCount = orders.length;
  const uniqueCustomersCount = new Set(orders.map((o) => o.customerName)).size;
  const fulfilledPaidCount = orders.filter((o) => o.status === "paid").length;

  return (
    <div>
      {/* Top Banner Alert */}
      {showBanner && (
        <div className="banner-alert">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>🎉 Your CrossVal store is active, share your store url with friends and customers!</span>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* KPI Metrics Cards Grid */}
      <div className="metrics-grid">
        {/* Card 1: Total Volume */}
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-title-group">
              <BarChart3 size={16} />
              <span>Total Volume</span>
            </div>
            <MoreVertical size={16} style={{ color: "var(--text-dim)", cursor: "pointer" }} />
          </div>
          <div className="metric-value">
            ${totalVolume.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="metric-trend up">
            +12% <span style={{ color: "var(--text-muted)", fontWeight: "400" }}>from last week</span>
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-title-group">
              <ShoppingBag size={16} />
              <span>Total Orders</span>
            </div>
            <MoreVertical size={16} style={{ color: "var(--text-dim)", cursor: "pointer" }} />
          </div>
          <div className="metric-value">{totalOrdersCount.toLocaleString()}</div>
          <div className="metric-trend down">
            -0.2% <span style={{ color: "var(--text-muted)", fontWeight: "400" }}>from last week</span>
          </div>
        </div>

        {/* Card 3: Customers */}
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-title-group">
              <Users size={16} />
              <span>Customers</span>
            </div>
            <MoreVertical size={16} style={{ color: "var(--text-dim)", cursor: "pointer" }} />
          </div>
          <div className="metric-value">{uniqueCustomersCount}</div>
          <div className="metric-trend down">
            -0.2% <span style={{ color: "var(--text-muted)", fontWeight: "400" }}>from last week</span>
          </div>
        </div>

        {/* Card 4: Fulfilled / Paid Orders */}
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-title-group">
              <Package size={16} />
              <span>Fulfilled / Paid</span>
            </div>
            <MoreVertical size={16} style={{ color: "var(--text-dim)", cursor: "pointer" }} />
          </div>
          <div className="metric-value">{fulfilledPaidCount}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>-</div>
        </div>
      </div>

      {/* Control Strip & Tab Bar */}
      <div className="control-strip">
        <div className="tab-group">
          <button
            className={`tab-item ${currentFilter === "ALL" ? "active" : ""}`}
            onClick={() => onFilterChange("ALL")}
          >
            All Orders
          </button>
          <button
            className={`tab-item ${currentFilter === "pending" ? "active" : ""}`}
            onClick={() => onFilterChange("pending")}
          >
            Pending
          </button>
          <button
            className={`tab-item ${currentFilter === "partially_paid" ? "active" : ""}`}
            onClick={() => onFilterChange("partially_paid")}
          >
            Partially Paid
          </button>
          <button
            className={`tab-item ${currentFilter === "paid" ? "active" : ""}`}
            onClick={() => onFilterChange("paid")}
          >
            Successful
          </button>
          <button
            className={`tab-item ${currentFilter === "overdue" ? "active" : ""}`}
            onClick={() => onFilterChange("overdue")}
          >
            Overdue
          </button>
        </div>

        <div className="action-tools">
          <div className="search-box">
            <Search
              size={15}
              style={{ position: "absolute", left: "10px", top: "10px", color: "var(--text-dim)" }}
            />
            <input
              type="text"
              className="search-input"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <button className="icon-btn" style={{ borderRadius: "8px", width: "34px", height: "34px" }}>
            <Filter size={16} />
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <OrderList
        currentUser={user}
        orders={orders}
        onSelectOrder={onSelectOrder}
        onRecordPayment={onRecordPayment}
        onRefreshOrders={onRefreshOrders}
      />
    </div>
  );
};
