import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { useAuthStore } from "../../store/authStore";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  FolderOpen,
  Settings,
  LogOut,
  Menu,
  X,
  MessageSquare,
  Star,
} from "lucide-react";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      logout();
      toast.success("تم تسجيل الخروج بنجاح");
      navigate("/");
    } catch (error) {
      toast.error("حدث خطأ أثناء تسجيل الخروج");
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "الرئيسية", path: "/admin" },
    { icon: Package, label: "المنتجات", path: "/admin/products" },
    { icon: FolderOpen, label: "الفئات", path: "/admin/categories" },
    { icon: ShoppingBag, label: "الطلبات", path: "/admin/orders" },
    { icon: Star, label: "التقييمات", path: "/admin/reviews" },
    { icon: MessageSquare, label: "الرسائل", path: "/admin/messages" },
    { icon: Settings, label: "الإعدادات", path: "/admin/settings" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Mobile Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />

            {/* Sidebar Panel */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed right-0 top-0 h-full w-72 bg-surface shadow-m3-5 z-50 lg:static lg:shadow-m3-2 flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-outline-variant">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-m3 flex items-center justify-center">
                      <span className="material-symbols-rounded text-primary-on text-2xl">
                        admin_panel_settings
                      </span>
                    </div>
                    <div>
                      <h2 className="md-typescale-title-medium text-on-surface">
                        لوحة التحكم
                      </h2>
                      <p className="md-typescale-body-small text-on-surface-variant">
                        مرحباً بك
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="lg:hidden p-2 rounded-full hover:bg-surface-variant"
                  >
                    <X className="h-5 w-5 text-on-surface" />
                  </button>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() =>
                        window.innerWidth < 1024 && setSidebarOpen(false)
                      }
                      className={`flex items-center gap-3 px-4 py-3 rounded-m3 transition-all ripple ${
                        isActive
                          ? "bg-secondary-container text-secondary-on-container shadow-m3-1"
                          : "text-on-surface hover:bg-surface-variant"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="md-typescale-label-large">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </nav>

              {/* Footer */}
              <div className="p-4 border-t border-outline-variant">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-m3 bg-error-container text-error hover:bg-error hover:text-error-on transition-all ripple"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="md-typescale-label-large">تسجيل الخروج</span>
                </motion.button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="bg-surface border-b border-outline-variant p-4 sticky top-0 z-30 shadow-m3-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-full hover:bg-surface-variant ripple"
              >
                <Menu className="h-6 w-6 text-on-surface" />
              </motion.button>
              <h1 className="md-typescale-headline-small text-on-surface">
                {menuItems.find((item) => item.path === location.pathname)
                  ?.label || "لوحة التحكم"}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <Link to="/" target="_blank">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="md-outlined-button"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-rounded text-sm">
                      open_in_new
                    </span>
                    <span>عرض الموقع</span>
                  </span>
                </motion.button>
              </Link>

              <div className="flex items-center gap-3">
                <div className="text-left">
                  <p className="md-typescale-label-large text-on-surface">
                    {user?.email}
                  </p>
                  <p className="md-typescale-label-small text-on-surface-variant">
                    مدير
                  </p>
                </div>
                <div className="w-10 h-10 bg-primary-container rounded-full flex items-center justify-center">
                  <span className="material-symbols-rounded text-primary text-xl">
                    person
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
