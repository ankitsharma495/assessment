import React from "react";
import {
  ShieldCheck,
  Zap,
  TrendingUp,
  CreditCard,
  FileSpreadsheet,
  History,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  Users,
} from "lucide-react";

interface LandingPageProps {
  onOpenAuth: (isSignup?: boolean) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  return (
    <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "0 24px 60px" }}>
      {/* LANDING TOP NAVBAR */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 0 36px",
          borderBottom: "1px solid rgba(226, 232, 240, 0.7)",
          marginBottom: "36px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              background: "linear-gradient(135deg, var(--primary-purple) 0%, #6366f1 100%)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontWeight: "800",
              fontSize: "1.2rem",
              boxShadow: "0 2px 8px rgba(124, 58, 237, 0.25)",
            }}
          >
            C
          </div>
          <span style={{ fontSize: "1.35rem", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.02em" }}>
            CrossVal
          </span>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            className="btn btn-secondary"
            onClick={() => onOpenAuth(false)}
            style={{ padding: "8px 18px", fontSize: "0.875rem", borderRadius: "8px", background: "#ffffff" }}
          >
            Sign In
          </button>

          <button
            className="btn btn-purple"
            onClick={() => onOpenAuth(true)}
            style={{ padding: "8px 20px", fontSize: "0.875rem", borderRadius: "8px" }}
          >
            Get Started
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <div
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          borderRadius: "20px",
          border: "1px solid var(--border-color)",
          padding: "56px 40px",
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(0,0,0,0.03)",
          position: "relative",
          overflow: "hidden",
          marginBottom: "40px",
        }}
      >
        {/* Top Floating Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#f3e8ff",
            color: "var(--primary-purple)",
            padding: "6px 16px",
            borderRadius: "999px",
            fontSize: "0.825rem",
            fontWeight: "700",
            marginBottom: "20px",
            border: "1px solid #e9d5ff",
          }}
        >
          <Zap size={14} />
          <span>CrossVal B2B Settlements & Revenue Platform</span>
        </div>

        {/* Hero Title */}
        <h1
          style={{
            fontSize: "2.8rem",
            fontWeight: "800",
            color: "#0f172a",
            letterSpacing: "-0.03em",
            lineHeight: "1.2",
            maxWidth: "840px",
            margin: "0 auto 18px",
          }}
        >
          Streamline Orders, Partial Payments & Settlement Analytics
        </h1>

        {/* Hero Subtitle */}
        <p
          style={{
            fontSize: "1.05rem",
            color: "#64748b",
            maxWidth: "680px",
            margin: "0 auto 32px",
            lineHeight: "1.6",
          }}
        >
          Automate line item calculations, derived payment statuses, over-payment protections, timestamped audit logs, and export reports in seconds.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: "flex", justifyContent: "center", gap: "14px", flexWrap: "wrap" }}>
          <button
            className="btn btn-purple"
            onClick={() => onOpenAuth(true)}
            style={{
              padding: "14px 32px",
              fontSize: "0.95rem",
              borderRadius: "10px",
              boxShadow: "0 4px 14px rgba(124, 58, 237, 0.35)",
            }}
          >
            <span>Get Started Free</span>
            <ArrowRight size={18} />
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => onOpenAuth(false)}
            style={{
              padding: "14px 28px",
              fontSize: "0.95rem",
              borderRadius: "10px",
              background: "#ffffff",
              border: "1px solid var(--border-color)",
            }}
          >
            <span>Sign In to Account</span>
          </button>
        </div>

        {/* Proof Bar Badges */}
        <div
          style={{
            display: "flex",
            justify: "center",
            gap: "36px",
            marginTop: "48px",
            paddingTop: "24px",
            borderTop: "1px solid #f1f5f9",
            flexWrap: "wrap",
            fontSize: "0.85rem",
            color: "#475569",
            fontWeight: "600",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle2 size={16} style={{ color: "#16a34a" }} />
            <span>Over-Payment Rejection Protection</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ShieldCheck size={16} style={{ color: "var(--primary-purple)" }} />
            <span>Merchant & Platform Admin RBAC</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <History size={16} style={{ color: "#2563eb" }} />
            <span>Timestamped Audit Logs</span>
          </div>
        </div>
      </div>

      {/* FEATURE HIGHLIGHTS GRID (3 COLUMNS) */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <h2 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0f172a" }}>
            Engineered for Modern B2B Operations
          </h2>
          <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "4px" }}>
            Everything you need to handle partial settlements, derived status transitions, and audit readiness.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
          {/* Card 1 */}
          <div
            className="table-card"
            style={{ padding: "28px", borderRadius: "14px", display: "flex", flexDirection: "column", gap: "14px" }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "#f3e8ff",
                color: "var(--primary-purple)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Layers size={22} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a" }}>
              Smart Order Engine
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: "1.5" }}>
              Create multi-line item orders with auto-computed subtotals, custom freight charges, percentage discounts, and payment terms.
            </p>
          </div>

          {/* Card 2 */}
          <div
            className="table-card"
            style={{ padding: "28px", borderRadius: "14px", display: "flex", flexDirection: "column", gap: "14px" }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "#dbeafe",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CreditCard size={22} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a" }}>
              Partial Payment Allocation
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: "1.5" }}>
              Record multiple payments over time. System automatically derives order status (<code>pending</code> $\rightarrow$ <code>partially_paid</code> $\rightarrow$ <code>paid</code> $\rightarrow$ <code>overdue</code>).
            </p>
          </div>

          {/* Card 3 */}
          <div
            className="table-card"
            style={{ padding: "28px", borderRadius: "14px", display: "flex", flexDirection: "column", gap: "14px" }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "#dcfce7",
                color: "#16a34a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileSpreadsheet size={22} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a" }}>
              Audit Trail & Excel Exports
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: "1.5" }}>
              Track every action with actor timestamps, issue credit note adjustments, and export order reports to Excel (.csv) with a single click.
            </p>
          </div>
        </div>
      </div>

      {/* ROLE-BASED ACCESS CONTROL (RBAC) BANNER */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #311b92 100%)",
          borderRadius: "16px",
          padding: "36px 40px",
          color: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "24px",
          flexWrap: "wrap",
          boxShadow: "0 10px 25px rgba(49, 27, 146, 0.25)",
        }}
      >
        <div style={{ maxWidth: "560px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#a78bfa", fontWeight: "700", fontSize: "0.825rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
            <Users size={16} /> Role-Based Access Control (RBAC)
          </div>
          <h3 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "8px" }}>
            Built for Merchants & Platform Administrators
          </h3>
          <p style={{ fontSize: "0.875rem", color: "#cbd5e1", lineHeight: "1.6" }}>
            Merchant Users manage their store's orders with privacy. Platform Admins get global system oversight to monitor multi-tenant revenue across all merchants.
          </p>
        </div>

        <button
          className="btn"
          onClick={() => onOpenAuth(true)}
          style={{
            background: "#ffffff",
            color: "#311b92",
            fontWeight: "700",
            padding: "14px 28px",
            borderRadius: "10px",
            border: "none",
            fontSize: "0.9rem",
            cursor: "pointer",
          }}
        >
          Register Merchant or Admin →
        </button>
      </div>
    </div>
  );
};
