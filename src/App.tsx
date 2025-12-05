import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { useAuthStore } from "./store/authStore";
import { Toaster } from "react-hot-toast";

// Layout Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Pages
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import DashboardHome from "./pages/admin/DashboardHome";
import ItemsManagement from "./pages/admin/ItemsManagement";
import CategoriesManagement from "./pages/admin/CategoriesManagement";
import OrdersManagement from "./pages/admin/OrdersManagement";
import ReviewsManagement from "./pages/admin/ReviewsManagement";
import MessagesManagement from "./pages/admin/MessagesManagement";
import SettingsManagement from "./pages/admin/SettingsManagement";
import TelegramManagement from "./pages/admin/TelegramManagement";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const { setUser, setIsAdmin, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);

        // Check if user is admin
        try {
          const adminDoc = await getDoc(doc(db, "admins", user.uid));
          setIsAdmin(adminDoc.exists());
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setIsAdmin, setLoading]);

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "var(--md-sys-color-surface)",
            color: "var(--md-sys-color-on-surface)",
            borderRadius: "var(--md-sys-shape-corner-medium)",
            padding: "16px",
            fontFamily: "Cairo, sans-serif",
          },
          success: {
            iconTheme: {
              primary: "var(--md-sys-color-primary)",
              secondary: "var(--md-sys-color-on-primary)",
            },
          },
          error: {
            iconTheme: {
              primary: "var(--md-sys-color-error)",
              secondary: "var(--md-sys-color-on-error)",
            },
          },
        }}
      />

      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <>
              <Navbar />
              <Outlet />
              <Footer />
            </>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="product/:id" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="products" element={<ItemsManagement />} />
          <Route path="categories" element={<CategoriesManagement />} />
          <Route path="orders" element={<OrdersManagement />} />
          <Route path="reviews" element={<ReviewsManagement />} />
          <Route path="messages" element={<MessagesManagement />} />
          <Route path="settings" element={<SettingsManagement />} />
          <Route path="telegram" element={<TelegramManagement />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
