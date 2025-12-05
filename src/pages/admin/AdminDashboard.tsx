import { useState, useEffect } from "react";
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
  MessageSquare,
  Star,
} from "lucide-react";
import toast from "react-hot-toast";
import MaterialRipple from "../../components/MaterialRipple";

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // Track screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

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
    { icon: FolderOpen, label: "الفئات", path: "/admin/categories" },
    { icon: Package, label: "المنتجات", path: "/admin/products" },
    { icon: ShoppingBag, label: "الطلبات", path: "/admin/orders" },
    { icon: Star, label: "التقييمات", path: "/admin/reviews" },
    { icon: MessageSquare, label: "الرسائل", path: "/admin/messages" },
    { icon: MessageSquare, label: "Telegram", path: "/admin/telegram", iconName: "send" },
    { icon: Settings, label: "الإعدادات", path: "/admin/settings" },
  ];

  return (
    <div className="min-h-screen bg-background flex" style={{ fontFamily: "'Tajawal', 'Cairo', sans-serif" }}>
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {(sidebarOpen || !isMobile) && (
          <>
            {/* Mobile Overlay */}
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                transition={{ duration: 0.2 }}
              />
            )}

            {/* Sidebar Panel - Material You Design */}
            <motion.aside
              initial={isMobile ? { x: "100%" } : { x: 0 }}
              animate={{ x: 0 }}
              exit={isMobile ? { x: "100%" } : { x: 0 }}
              transition={{ 
                type: "spring", 
                damping: 30, 
                stiffness: 300,
                duration: 0.3
              }}
              className="fixed right-0 top-0 h-full w-80 bg-surface z-50 lg:static lg:z-auto flex flex-col border-l border-outline-variant/30 shadow-lg lg:shadow-none"
              style={{
                boxShadow: !isMobile ? 'none' : 'var(--md-sys-elevation-3)'
              }}
            >
              {/* Header - Material You */}
              <div className="p-6 border-b border-outline-variant/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-100"
                      style={{
                        color: '#1e40af'
                      }}
                    >
                      <span className="material-symbols-rounded text-2xl">
                        dashboard
                      </span>
                    </div>
                    <div>
                      <h2 className="md-typescale-title-large text-on-surface font-semibold">
                        لوحة التحكم
                      </h2>
                      <p className="md-typescale-body-small text-on-surface-variant truncate max-w-[160px]">
                        {user?.email || "مرحباً بك"}
                      </p>
                    </div>
                  </div>
                  <MaterialRipple>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="lg:hidden p-2 rounded-full hover:bg-surface-variant transition-colors"
                      aria-label="إغلاق القائمة"
                    >
                      <span className="material-symbols-rounded text-on-surface">close</span>
                    </button>
                  </MaterialRipple>
                </div>
              </div>

              {/* Navigation - Material You */}
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <MaterialRipple key={item.path}>
                      <Link
                        to={item.path}
                        onClick={() =>
                          isMobile && setSidebarOpen(false)
                        }
                        className={`group flex items-center gap-3 px-4 py-3 rounded-full transition-all relative ${
                          isActive
                            ? "bg-blue-100 text-blue-700"
                            : "text-on-surface-variant hover:bg-surface-variant"
                        }`}
                        style={{
                          borderRadius: 'var(--md-sys-shape-corner-extra-large)',
                          transition: 'background-color 200ms cubic-bezier(0.2, 0, 0, 1), color 200ms cubic-bezier(0.2, 0, 0, 1)'
                        }}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeNavItem"
                            className="absolute inset-0 rounded-full bg-blue-100"
                            transition={{ 
                              type: "spring", 
                              bounce: 0.15, 
                              duration: 0.4 
                            }}
                          />
                        )}
                        <span 
                          className="material-symbols-rounded text-xl relative z-10"
                          style={{
                            color: isActive ? '#1e40af' : 'var(--md-sys-color-on-surface-variant)'
                          }}
                        >
                          {item.path === '/admin' ? 'dashboard' :
                           item.path === '/admin/products' ? 'inventory_2' :
                           item.path === '/admin/categories' ? 'category' :
                           item.path === '/admin/orders' ? 'shopping_bag' :
                           item.path === '/admin/reviews' ? 'star' :
                           item.path === '/admin/messages' ? 'mail' :
                           item.path === '/admin/telegram' ? 'send' :
                           'settings'}
                        </span>
                        <span 
                          className={`md-typescale-label-large relative z-10 font-medium ${
                            isActive ? "text-blue-700" : ""
                          }`}
                        >
                          {item.label}
                        </span>
                      </Link>
                    </MaterialRipple>
                  );
                })}
              </nav>

              {/* Footer - Material You */}
              <div className="p-4 border-t border-outline-variant/30">
                <MaterialRipple>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-full transition-all"
                    style={{
                      backgroundColor: 'var(--md-sys-color-error-container)',
                      color: 'var(--md-sys-color-on-error-container)',
                      borderRadius: 'var(--md-sys-shape-corner-extra-large)'
                    }}
                  >
                    <span className="material-symbols-rounded text-xl">logout</span>
                    <span className="md-typescale-label-large font-medium">تسجيل الخروج</span>
                  </button>
                </MaterialRipple>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar - Material You App Bar */}
        <header 
          className="sticky top-0 z-30 border-b border-outline-variant/30"
          style={{
            backgroundColor: 'rgba(255, 251, 254, 0.8)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: 'var(--md-sys-elevation-1)'
          }}
        >
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <MaterialRipple>
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden p-2 rounded-full hover:bg-surface-variant transition-colors"
                    aria-label="القائمة"
                  >
                    <span className="material-symbols-rounded text-on-surface text-2xl">menu</span>
                  </button>
                </MaterialRipple>
                <div className="min-w-0 flex-1">
                  <h1 className="md-typescale-headline-small text-on-surface font-semibold truncate">
                    {menuItems.find((item) => item.path === location.pathname)
                      ?.label || "لوحة التحكم"}
                  </h1>
                  <p className="md-typescale-body-small text-on-surface-variant hidden sm:block">
                    إدارة متجرك بسهولة
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MaterialRipple>
                  <Link 
                    to="/" 
                    target="_blank"
                    className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full transition-colors hover:bg-surface-variant"
                    style={{
                      borderRadius: 'var(--md-sys-shape-corner-extra-large)'
                    }}
                  >
                    <span className="material-symbols-rounded text-on-surface-variant text-xl">open_in_new</span>
                    <span className="md-typescale-label-large text-on-surface-variant">عرض الموقع</span>
                  </Link>
                </MaterialRipple>

                <div className="flex items-center gap-3">
                  <div className="text-left hidden md:block">
                    <p className="md-typescale-label-large text-on-surface font-medium">
                      {user?.email?.split("@")[0] || "المدير"}
                    </p>
                    <p className="md-typescale-label-small text-on-surface-variant">
                      مدير النظام
                    </p>
                  </div>
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100"
                    style={{
                      color: '#1e40af'
                    }}
                  >
                    <span className="material-symbols-rounded text-xl">person</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content - Material You */}
        <main 
          className="flex-1 overflow-y-auto"
          style={{
            backgroundColor: 'var(--md-sys-color-background)'
          }}
        >
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
