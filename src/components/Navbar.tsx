import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Menu, X, User, LogOut, Search } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [siteName, setSiteName] = useState('فالنتينو للشوكولاتة');
  const location = useLocation();
  const itemCount = useCartStore((state) => state.getItemCount());
  const { user, isAdmin, logout } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setSiteName(data.siteNameAr || 'فالنتينو للشوكولاتة');
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    fetchSettings();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      logout();
      toast.success('تم تسجيل الخروج بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء تسجيل الخروج');
    }
  };

  const navLinks = [
    { name: 'الرئيسية', path: '/' },
    { name: 'المنتجات', path: '/products' },
    { name: 'من نحن', path: '/about' },
    { name: 'اتصل بنا', path: '/contact' },
  ];

  return (
    <>
      {/* Material Design 3 App Bar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-m3-2'
            : 'bg-white/80 backdrop-blur-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <Link to="/" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="h-12 w-12 bg-primary rounded-full flex items-center justify-center shadow-md"
              >
                <span className="text-2xl">🍫</span>
              </motion.div>
              <div className="flex flex-col">
                <span className="md-typescale-title-large text-primary font-bold">
                  {siteName}
                </span>
                <span className="md-typescale-body-small text-on-surface-variant">
                  شوكولاتة فاخرة
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-m3 md-typescale-label-large transition-all ripple ${
                    location.pathname === link.path
                      ? 'bg-secondary-container text-secondary-on-container'
                      : 'text-on-surface hover:bg-surface-variant'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Search Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-full hover:bg-surface-variant transition-colors ripple"
                aria-label="بحث"
              >
                <Search className="h-5 w-5 text-on-surface" />
              </motion.button>

              {/* Cart Button */}
              <Link to="/cart">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative p-2 rounded-full hover:bg-surface-variant transition-colors ripple"
                  aria-label="السلة"
                >
                  <ShoppingCart className="h-5 w-5 text-on-surface" />
                  {itemCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -left-1 bg-error text-error-on w-5 h-5 rounded-full flex items-center justify-center md-typescale-label-small"
                    >
                      {itemCount}
                    </motion.span>
                  )}
                </motion.button>
              </Link>

              {/* User Menu */}
              {user ? (
                <div className="hidden md:flex items-center gap-2">
                  {isAdmin && (
                    <Link to="/admin">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="md-outlined-button"
                      >
                        لوحة التحكم
                      </motion.button>
                    </Link>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    className="p-2 rounded-full hover:bg-error-container text-error transition-colors ripple"
                    aria-label="تسجيل الخروج"
                  >
                    <LogOut className="h-5 w-5" />
                  </motion.button>
                </div>
              ) : (
                <Link to="/admin/login" className="hidden md:block">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="md-text-button flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    <span>تسجيل الدخول</span>
                  </motion.button>
                </Link>
              )}

              {/* Mobile Menu Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden p-2 rounded-full hover:bg-surface-variant transition-colors ripple"
                aria-label="القائمة"
              >
                {isOpen ? (
                  <X className="h-6 w-6 text-on-surface" />
                ) : (
                  <Menu className="h-6 w-6 text-on-surface" />
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-surface border-t border-outline-variant"
            >
              <div className="px-4 py-4 space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-3 rounded-m3 md-typescale-label-large transition-all ripple ${
                      location.pathname === link.path
                        ? 'bg-secondary-container text-secondary-on-container'
                        : 'text-on-surface hover:bg-surface-variant'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
                
                {user && isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 rounded-m3 md-typescale-label-large text-primary hover:bg-primary-container transition-all ripple"
                  >
                    لوحة التحكم
                  </Link>
                )}
                
                {user ? (
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="w-full text-right px-4 py-3 rounded-m3 md-typescale-label-large text-error hover:bg-error-container transition-all ripple"
                  >
                    تسجيل الخروج
                  </button>
                ) : (
                  <Link
                    to="/admin/login"
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 rounded-m3 md-typescale-label-large text-primary hover:bg-primary-container transition-all ripple"
                  >
                    تسجيل الدخول
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Spacer to prevent content from hiding under fixed navbar */}
      <div className="h-16" />
    </>
  );
}

