import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isAdmin, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="md-typescale-body-medium text-on-surface-variant">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <span className="material-symbols-rounded text-6xl text-error">block</span>
          </div>
          <h2 className="md-typescale-headline-medium text-on-surface mb-4">
            ليس لديك صلاحيات الوصول
          </h2>
          <p className="md-typescale-body-medium text-on-surface-variant mb-6">
            يرجى التأكد من إضافة المستخدم في Firestore collection 'admins'
          </p>
          <p className="md-typescale-body-small text-on-surface-variant mb-6">
            UID: <code className="bg-surface-variant px-2 py-1 rounded">{user.uid}</code>
          </p>
          <button
            onClick={() => {
              window.location.href = '/admin/login';
            }}
            className="md-filled-button"
          >
            العودة لتسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

