import React from "react";
import { User } from "../types";
import { Plus, User as UserIcon } from "lucide-react";

interface HeaderProps {
  user: User | null;
  onOpenCreateOrder: () => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenCreateOrder,
  onOpenAuth,
}) => {
  return (
    <header className="top-header">
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <h1 className="page-title">CrossVal Platform</h1>
      </div>

      <div className="header-actions">
        {user ? (
          <>
            <button className="btn btn-purple" onClick={onOpenCreateOrder}>
              <Plus size={16} />
              <span>Create Order</span>
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                paddingLeft: "8px",
                fontSize: "0.85rem",
                fontWeight: "700",
                color: "var(--text-main)",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: user.role === "admin" ? "#fef3c7" : "var(--primary-purple-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: user.role === "admin" ? "#d97706" : "var(--primary-purple)",
                }}
              >
                <UserIcon size={16} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span>{user.name}</span>
                  {user.role === "admin" && (
                    <span
                      style={{
                        fontSize: "0.65rem",
                        padding: "1px 6px",
                        borderRadius: "4px",
                        background: "#7c3aed",
                        color: "#ffffff",
                        fontWeight: "700",
                        letterSpacing: "0.04em",
                      }}
                    >
                      ADMIN
                    </span>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <button className="btn btn-purple" onClick={onOpenAuth}>
            Sign In / Register
          </button>
        )}
      </div>
    </header>
  );
};
