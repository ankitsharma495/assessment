import React, { useState } from "react";
import { authAPI } from "../api";
import { User } from "../types";
import { X, Lock, Mail, User as UserIcon, ShieldCheck } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: "login" | "signup";
  onClose: () => void;
  onSuccess: (user: User, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = "login",
  onClose,
  onSuccess,
}) => {
  const [isLoginMode, setIsLoginMode] = useState(initialMode === "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    setIsLoginMode(initialMode === "login");
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLoginMode) {
        const res = await authAPI.login({ email, password });
        onSuccess(res.data.user, res.data.token);
        onClose();
      } else {
        const res = await authAPI.signup({ name, email, password, role });
        onSuccess(res.data.user, res.data.token);
        onClose();
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Authentication failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "440px", padding: "0", overflow: "hidden" }}>
        {/* Modal Top Header */}
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
              {isLoginMode ? "Sign In to CrossVal" : "Create CrossVal Account"}
            </h2>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>
              {isLoginMode ? "Enter your merchant or admin credentials" : "Select role and register your account"}
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} style={{ padding: "24px", background: "#f8fafc" }}>
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

          {!isLoginMode && (
            <>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: "0.78rem", fontWeight: "500", color: "#64748b" }}>
                  Full Name
                </label>
                <div style={{ position: "relative" }}>
                  <UserIcon
                    size={16}
                    style={{ position: "absolute", left: "12px", top: "10px", color: "var(--text-dim)" }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ paddingLeft: "36px", fontSize: "0.85rem" }}
                    required
                  />
                </div>
              </div>

              {/* Role Selection Radio Cards */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: "0.78rem", fontWeight: "500", color: "#64748b" }}>
                  Account Role
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div
                    onClick={() => setRole("user")}
                    style={{
                      border: role === "user" ? "2px solid var(--primary-purple)" : "1px solid var(--border-color)",
                      background: role === "user" ? "#f3e8ff" : "#ffffff",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                    }}
                  >
                    <span style={{ fontSize: "0.825rem", fontWeight: "600", color: role === "user" ? "var(--primary-purple)" : "#1e293b" }}>
                      Merchant User
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Own Orders Only</span>
                  </div>

                  <div
                    onClick={() => setRole("admin")}
                    style={{
                      border: role === "admin" ? "2px solid #7c3aed" : "1px solid var(--border-color)",
                      background: role === "admin" ? "#f3e8ff" : "#ffffff",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                    }}
                  >
                    <span style={{ fontSize: "0.825rem", fontWeight: "600", color: role === "admin" ? "#7c3aed" : "#1e293b", display: "flex", alignItems: "center", gap: "4px" }}>
                      <ShieldCheck size={14} /> Admin
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Global Orders Access</span>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label" style={{ fontSize: "0.78rem", fontWeight: "500", color: "#64748b" }}>
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <Mail
                size={16}
                style={{ position: "absolute", left: "12px", top: "10px", color: "var(--text-dim)" }}
              />
              <input
                type="email"
                className="form-input"
                placeholder="name@crossval.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: "36px", fontSize: "0.85rem" }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: "0.78rem", fontWeight: "500", color: "#64748b" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock
                size={16}
                style={{ position: "absolute", left: "12px", top: "10px", color: "var(--text-dim)" }}
              />
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: "36px", fontSize: "0.85rem" }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-purple"
            style={{ width: "100%", marginTop: "16px", padding: "10px", fontWeight: "500" }}
            disabled={loading}
          >
            {loading ? "Processing..." : isLoginMode ? "Sign In" : "Register Account"}
          </button>
        </form>

        {/* Modal Footer Toggle */}
        <div style={{ textAlign: "center", padding: "14px 24px", background: "#ffffff", borderTop: "1px solid var(--border-color)", fontSize: "0.825rem" }}>
          <span style={{ color: "var(--text-muted)" }}>
            {isLoginMode ? "Don't have an account? " : "Already registered? "}
          </span>
          <button
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setError(null);
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--primary-purple)",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            {isLoginMode ? "Register here" : "Sign in here"}
          </button>
        </div>
      </div>
    </div>
  );
};
