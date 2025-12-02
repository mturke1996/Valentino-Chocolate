import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { useAuthStore } from '../../store/authStore';
import { LogIn, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser, setIsAdmin } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if user is admin
      const adminDoc = await getDoc(doc(db, 'admins', user.uid));
      
      if (adminDoc.exists()) {
        setUser(user);
        setIsAdmin(true);
        toast.success('تم تسجيل الدخول بنجاح');
        navigate('/admin');
      } else {
        await auth.signOut();
        toast.error('ليس لديك صلاحيات الوصول');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        toast.error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else {
        toast.error('حدث خطأ أثناء تسجيل الدخول');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-variant py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-m3 shadow-m3-3 mb-4"
          >
            <span className="material-symbols-rounded text-primary-on text-4xl">
              admin_panel_settings
            </span>
          </motion.div>
          <h2 className="md-typescale-display-small text-on-background mb-2">
            لوحة التحكم
          </h2>
          <p className="md-typescale-body-large text-on-surface-variant">
            سجل دخولك للوصول إلى لوحة التحكم
          </p>
        </div>

        {/* Login Form */}
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleLogin}
          className="md-elevated-card p-8 space-y-6"
        >
          {/* Email Field */}
          <div className="space-y-2">
            <label className="md-typescale-label-large text-on-surface block">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pr-12 pl-4 py-3 bg-surface border border-outline rounded-m3 md-typescale-body-medium text-on-surface focus:outline-none focus:border-primary focus:border-2"
                placeholder="admin@example.com"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="md-typescale-label-large text-on-surface block">
              كلمة المرور
            </label>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pr-12 pl-4 py-3 bg-surface border border-outline rounded-m3 md-typescale-body-medium text-on-surface focus:outline-none focus:border-primary focus:border-2"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full md-filled-button py-4 shadow-m3-2 hover:shadow-m3-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-5 w-5 border-2 border-primary-on border-t-transparent"></span>
                <span>جاري تسجيل الدخول...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <LogIn className="h-5 w-5" />
                <span>تسجيل الدخول</span>
              </span>
            )}
          </motion.button>
        </motion.form>

        {/* Back to Home */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-center"
        >
          <a
            href="/"
            className="md-typescale-body-medium text-primary hover:text-primary-container transition-colors inline-flex items-center gap-1"
          >
            <span className="material-symbols-rounded text-sm">arrow_forward</span>
            <span>العودة للصفحة الرئيسية</span>
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}

