import React from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  HelpCircle,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { User } from "../types";

interface SidebarProps {
  user: User | null;
  activeTab: "dashboard" | "orders";
  onSelectTab: (tab: "dashboard" | "orders") => void;
  onLogout: () => void;
  onOpenAuth: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeTab,
  onSelectTab,
  onLogout,
  onOpenAuth,
}) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        {/* CrossVal Brand */}
        <div className="sidebar-brand">
          <div
            style={{
              width: "34px",
              height: "34px",
              background: "linear-gradient(135deg, var(--primary-purple) 0%, #6366f1 100%)",
              borderRadius: "9px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontWeight: "800",
              fontSize: "1.15rem",
              boxShadow: "0 2px 8px rgba(124, 58, 237, 0.25)",
            }}
          >
            C
          </div>
          <span style={{ fontSize: "1.25rem", fontWeight: "800", color: "#1e293b", letterSpacing: "-0.02em" }}>
            CrossVal
          </span>
        </div>

        {/* Store Switcher Card */}
        <div className="store-switcher">
          <div>
            <div className="store-name">
              {user ? `${user.name}'s CrossVal` : "CrossVal Commerce Store"}
            </div>
            <div className="store-id">#CV-12345678</div>
          </div>
          <ChevronDown size={16} style={{ color: "var(--text-muted)" }} />
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => onSelectTab("dashboard")}
            style={{ border: "none", background: "none", width: "100%", textAlign: "left" }}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          <button
            className={`nav-item ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => onSelectTab("orders")}
            style={{ border: "none", background: "none", width: "100%", textAlign: "left" }}
          >
            <ShoppingBag size={18} />
            <span>Orders</span>
          </button>
        </nav>
      </div>

      <div className="sidebar-bottom">
        <button
          className="nav-item"
          style={{ border: "none", background: "none", width: "100%", textAlign: "left" }}
          onClick={() => alert("CrossVal Support: Help Center & API Documentation")}
        >
          <HelpCircle size={18} />
          <span>Support</span>
        </button>

        {user ? (
          <button
            className="nav-item logout"
            onClick={onLogout}
            style={{ width: "100%", border: "none", background: "none", textAlign: "left" }}
          >
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        ) : (
          <button
            className="nav-item"
            onClick={onOpenAuth}
            style={{
              width: "100%",
              border: "none",
              background: "none",
              textAlign: "left",
              color: "var(--primary-purple)",
              fontWeight: "700",
            }}
          >
            <LogOut size={18} />
            <span>Sign in</span>
          </button>
        )}
      </div>
    </aside>
  );
};
