import React, { useEffect, useState, useMemo } from "react";
import { User, Order, OrderStatus } from "./types";
import { authAPI, orderAPI } from "./api";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { LandingPage } from "./components/LandingPage";
import { DashboardView } from "./components/DashboardView";
import { Dashboard } from "./components/Dashboard";
import { AuthModal } from "./components/AuthModal";
import { CreateOrderModal } from "./components/CreateOrderModal";
import { OrderDetailModal } from "./components/OrderDetailModal";
import { RecordPaymentModal } from "./components/RecordPaymentModal";
import { CreditNoteModal } from "./components/CreditNoteModal";

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Sidebar navigation tab: "dashboard" vs "orders"
  const [activeTab, setActiveTab] = useState<"dashboard" | "orders">("dashboard");

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal controls
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isCreditNoteOpen, setIsCreditNoteOpen] = useState(false);

  // Check auth on load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      authAPI
        .me()
        .then((res) => {
          setUser(res.data);
          fetchOrders();
        })
        .catch(() => {
          localStorage.removeItem("token");
          setUser(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderAPI.getOrders();
      setOrders(res.data || []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  // Instant 0ms memory filtering for status filter tabs & search input!
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        order.customerName.toLowerCase().includes(q) ||
        order.orderNumber.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, searchQuery]);

  const handleAuthSuccess = (userData: User, token: string) => {
    localStorage.setItem("token", token);
    setUser(userData);
    fetchOrders();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setOrders([]);
  };

  const handleRefreshSelectedOrder = async (orderId: number) => {
    try {
      const res = await orderAPI.getOrderById(orderId);
      setSelectedOrder(res.data);
      fetchOrders();
    } catch (err) {
      console.error("Failed to refresh order:", err);
    }
  };

  const handleDeletePayment = async (paymentId: number) => {
    if (!selectedOrder) return;
    try {
      await orderAPI.deletePayment(selectedOrder.id, paymentId);
      await handleRefreshSelectedOrder(selectedOrder.id);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete payment.");
    }
  };

  // Full Screen Standalone Landing Page for Unauthenticated Visitors
  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
        <LandingPage
          onOpenAuth={(isSignup) => {
            setAuthMode(isSignup ? "signup" : "login");
            setIsAuthOpen(true);
          }}
        />

        <AuthModal
          isOpen={isAuthOpen}
          initialMode={authMode}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  // Full Merchant / Admin Workspace Layout
  return (
    <div className="app-layout">
      {/* Left Navigation Sidebar */}
      <Sidebar
        user={user}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLogout={handleLogout}
        onOpenAuth={() => {
          setAuthMode("login");
          setIsAuthOpen(true);
        }}
      />

      {/* Main Wrapper */}
      <div className="main-wrapper">
        <Header
          user={user}
          onOpenCreateOrder={() => setIsCreateOrderOpen(true)}
          onOpenAuth={() => {
            setAuthMode("login");
            setIsAuthOpen(true);
          }}
        />

        <main className="main-content">
          {activeTab === "dashboard" ? (
            <DashboardView
              orders={orders}
              onSelectOrder={(ord) => {
                setSelectedOrder(ord);
                setIsOrderDetailOpen(true);
              }}
              onNavigateToOrders={() => setActiveTab("orders")}
            />
          ) : (
            <Dashboard
              user={user}
              orders={filteredOrders}
              currentFilter={statusFilter}
              onFilterChange={setStatusFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectOrder={(ord) => {
                setSelectedOrder(ord);
                setIsOrderDetailOpen(true);
              }}
              onRecordPayment={(ord) => {
                setSelectedOrder(ord);
                setIsRecordPaymentOpen(true);
              }}
              onRefreshOrders={fetchOrders}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <CreateOrderModal
        isOpen={isCreateOrderOpen}
        onClose={() => setIsCreateOrderOpen(false)}
        onSuccess={fetchOrders}
      />

      <OrderDetailModal
        order={selectedOrder}
        isOpen={isOrderDetailOpen}
        onClose={() => {
          setIsOrderDetailOpen(false);
          setSelectedOrder(null);
        }}
        onOpenRecordPayment={(ord) => {
          setSelectedOrder(ord);
          setIsRecordPaymentOpen(true);
        }}
        onOpenCreditNote={(ord) => {
          setSelectedOrder(ord);
          setIsCreditNoteOpen(true);
        }}
        onDeletePayment={handleDeletePayment}
      />

      <RecordPaymentModal
        order={selectedOrder}
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        onSuccess={() => {
          if (selectedOrder) handleRefreshSelectedOrder(selectedOrder.id);
          else fetchOrders();
        }}
      />

      <CreditNoteModal
        order={selectedOrder}
        isOpen={isCreditNoteOpen}
        onClose={() => setIsCreditNoteOpen(false)}
        onSuccess={() => {
          if (selectedOrder) handleRefreshSelectedOrder(selectedOrder.id);
          else fetchOrders();
        }}
      />
    </div>
  );
};

export default App;
