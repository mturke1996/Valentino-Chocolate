import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { useAuthStore } from './store/authStore';
import { Toaster } from 'react-hot-toast';

// Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import DashboardHome from './pages/admin/DashboardHome';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { setUser, setIsAdmin, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        
        // Check if user is admin
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        setIsAdmin(adminDoc.exists());
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setIsAdmin, setLoading]);

  return (
    <Router>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--md-sys-color-surface)',
            color: 'var(--md-sys-color-on-surface)',
            borderRadius: 'var(--md-sys-shape-corner-medium)',
            padding: '16px',
            fontFamily: 'Cairo, sans-serif',
          },
          success: {
            iconTheme: {
              primary: 'var(--md-sys-color-primary)',
              secondary: 'var(--md-sys-color-on-primary)',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--md-sys-color-error)',
              secondary: 'var(--md-sys-color-on-error)',
            },
          },
        }}
      />
      
      <Routes>
        {/* Public Routes */}
        <Route
          path="/*"
          element={
            <>
              <Navbar />
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/product/:id" element={<ProductDetailPage />} />
              </Routes>
              <Footer />
            </>
          }
        />

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
          <Route path="products" element={<div>Products Management Coming Soon</div>} />
          <Route path="categories" element={<div>Categories Management Coming Soon</div>} />
          <Route path="orders" element={<div>Orders Management Coming Soon</div>} />
          <Route path="reviews" element={<div>Reviews Management Coming Soon</div>} />
          <Route path="messages" element={<div>Messages Management Coming Soon</div>} />
          <Route path="settings" element={<div>Settings Coming Soon</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

