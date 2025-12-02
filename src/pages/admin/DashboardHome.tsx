import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { DashboardStats, Order } from '../../types';
import { formatPrice, formatDateTime, getOrderStatusText, getOrderStatusColor } from '../../utils/formatters';
import { TrendingUp, Package, DollarSign, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardHome() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    todayOrders: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
    popularProducts: [],
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch Products Count
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const totalProducts = productsSnapshot.size;

        // Fetch Orders
        const ordersSnapshot = await getDocs(collection(db, 'orders'));
        const orders = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];

        // Calculate stats
        const totalOrders = orders.length;
        const totalRevenue = orders
          .filter(order => order.status === 'delivered')
          .reduce((sum, order) => sum + order.total, 0);

        const pendingOrders = orders.filter(order => order.status === 'pending').length;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = orders.filter(order => {
          const orderDate = order.createdAt.toDate();
          return orderDate >= today;
        });
        const todayOrdersCount = todayOrders.length;
        const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);

        // Fetch Recent Orders
        const recentOrdersQuery = query(
          collection(db, 'orders'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentOrdersSnapshot = await getDocs(recentOrdersQuery);
        const recentOrders = recentOrdersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];

        setStats({
          totalOrders,
          totalRevenue,
          totalProducts,
          totalCustomers: orders.length, // Simplified
          pendingOrders,
          todayOrders: todayOrdersCount,
          todayRevenue,
          monthlyRevenue: totalRevenue, // Simplified
          popularProducts: [],
          recentOrders,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      label: 'إجمالي الطلبات',
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: 'primary',
      change: '+12%',
    },
    {
      label: 'إجمالي الإيرادات',
      value: formatPrice(stats.totalRevenue),
      icon: DollarSign,
      color: 'secondary',
      change: '+8%',
    },
    {
      label: 'المنتجات',
      value: stats.totalProducts,
      icon: Package,
      color: 'tertiary',
      change: '+3',
    },
    {
      label: 'الطلبات المعلقة',
      value: stats.pendingOrders,
      icon: TrendingUp,
      color: 'error',
      change: '-2',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="md-typescale-display-small text-on-background mb-2">
          مرحباً بك في لوحة التحكم
        </h2>
        <p className="md-typescale-body-large text-on-surface-variant">
          إليك نظرة عامة على نشاط متجرك
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4 }}
            className="md-elevated-card p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 bg-${stat.color}-container rounded-m3`}>
                <stat.icon className={`h-6 w-6 text-${stat.color}`} />
              </div>
              <span className="md-typescale-label-small text-green-600 bg-green-100 px-2 py-1 rounded-m3-sm">
                {stat.change}
              </span>
            </div>
            <h3 className="md-typescale-headline-medium text-on-surface mb-1">
              {stat.value}
            </h3>
            <p className="md-typescale-body-small text-on-surface-variant">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="md-elevated-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="md-typescale-headline-small text-on-surface">
            آخر الطلبات
          </h3>
          <Link to="/admin/orders">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="md-text-button"
            >
              عرض الكل
            </motion.button>
          </Link>
        </div>

        {stats.recentOrders.length === 0 ? (
          <p className="text-center py-8 md-typescale-body-medium text-on-surface-variant">
            لا توجد طلبات حالياً
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="text-right py-3 md-typescale-label-large text-on-surface">
                    رقم الطلب
                  </th>
                  <th className="text-right py-3 md-typescale-label-large text-on-surface">
                    العميل
                  </th>
                  <th className="text-right py-3 md-typescale-label-large text-on-surface">
                    المبلغ
                  </th>
                  <th className="text-right py-3 md-typescale-label-large text-on-surface">
                    الحالة
                  </th>
                  <th className="text-right py-3 md-typescale-label-large text-on-surface">
                    التاريخ
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-outline-variant hover:bg-surface-variant">
                    <td className="py-4 md-typescale-body-medium text-primary">
                      #{order.orderNumber}
                    </td>
                    <td className="py-4 md-typescale-body-medium text-on-surface">
                      {order.customerName}
                    </td>
                    <td className="py-4 md-typescale-body-medium text-on-surface">
                      {formatPrice(order.total)}
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-m3-sm md-typescale-label-small ${getOrderStatusColor(order.status)}`}>
                        {getOrderStatusText(order.status)}
                      </span>
                    </td>
                    <td className="py-4 md-typescale-body-small text-on-surface-variant">
                      {formatDateTime(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="md-typescale-headline-small text-on-surface mb-4">
          إجراءات سريعة
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'إضافة منتج', icon: 'add_circle', path: '/admin/products', color: 'primary' },
            { label: 'إدارة الطلبات', icon: 'shopping_cart', path: '/admin/orders', color: 'secondary' },
            { label: 'الإعدادات', icon: 'settings', path: '/admin/settings', color: 'tertiary' },
            { label: 'التقارير', icon: 'analytics', path: '/admin/reports', color: 'primary' },
          ].map((action, index) => (
            <Link key={index} to={action.path}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full md-filled-card p-4 flex items-center gap-3 hover:shadow-m3-2 transition-all ripple"
              >
                <span className={`material-symbols-rounded text-${action.color}`}>
                  {action.icon}
                </span>
                <span className="md-typescale-label-large text-on-surface">
                  {action.label}
                </span>
              </motion.button>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

