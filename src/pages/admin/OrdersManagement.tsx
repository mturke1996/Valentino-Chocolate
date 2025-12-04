import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "../../firebase";
import { Order } from "../../types";
import {
  formatPrice,
  formatDateTime,
  getOrderStatusText,
  getOrderStatusColor,
} from "../../utils/formatters";
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { notifyOrderStatusChange } from "../../utils/telegramNotifications";
import MaterialRipple from "../../components/MaterialRipple";

export default function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<
    Record<string, string>
  >({});

  const statusOptions: Array<{
    value: string;
    label: string;
    icon: any;
    shortLabel: string;
  }> = [
    { value: "all", label: "الكل", icon: Package, shortLabel: "الكل" },
    {
      value: "pending",
      label: "قيد الانتظار",
      icon: Clock,
      shortLabel: "انتظار",
    },
    {
      value: "confirmed",
      label: "مؤكد",
      icon: CheckCircle,
      shortLabel: "مؤكد",
    },
    {
      value: "preparing",
      label: "قيد التحضير",
      icon: Package,
      shortLabel: "تحضير",
    },
    {
      value: "out-for-delivery",
      label: "في الطريق",
      icon: Truck,
      shortLabel: "طريق",
    },
    {
      value: "delivered",
      label: "تم التوصيل",
      icon: CheckCircle,
      shortLabel: "تم",
    },
    { value: "cancelled", label: "ملغي", icon: XCircle, shortLabel: "ملغي" },
  ];

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let ordersQuery;
      if (statusFilter === "all") {
        ordersQuery = query(
          collection(db, "orders"),
          orderBy("createdAt", "desc")
        );
      } else {
        ordersQuery = query(
          collection(db, "orders"),
          where("status", "==", statusFilter),
          orderBy("createdAt", "desc")
        );
      }

      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersData = ordersSnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Order[];
      setOrders(ordersData);

      // initialize selected statuses map
      const map: Record<string, string> = {};
      ordersData.forEach((o) => (map[o.id] = o.status));
      setSelectedStatuses(map);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      toast.error(error?.message || "حدث خطأ أثناء تحميل الطلبات");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    newStatus: Order["status"]
  ) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus,
        updatedAt: new Date(),
        ...(newStatus === "delivered" && { deliveredAt: new Date() }),
      });

      const order = orders.find((o) => o.id === orderId);
      if (order) {
        await notifyOrderStatusChange(order, newStatus);
      }

      toast.success("تم تحديث حالة الطلب بنجاح");
      fetchOrders();
    } catch (error: any) {
      console.error("Error updating order:", error);
      toast.error(error?.message || "حدث خطأ أثناء تحديث الطلب");
    }
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone?.includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-outline-variant border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex flex-col gap-1 px-2">
        <h2 className="text-base sm:text-lg font-bold text-on-background">
          إدارة الطلبات
        </h2>
        <p className="text-xs text-on-surface-variant">
          {filteredOrders.length} من {orders.length} طلب
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-3 px-2">
        <div className="relative">
          <span className="material-symbols-rounded absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="ابحث برقم الطلب أو اسم العميل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-3 py-2 bg-surface border border-outline-variant rounded-full text-sm focus:outline-none focus:border-primary focus:border-2 transition-all"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {statusOptions.map((option) => {
            const Icon = option.icon;
            const isActive = statusFilter === option.value;
            return (
              <MaterialRipple key={option.value}>
                <button
                  onClick={() => setStatusFilter(option.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full whitespace-nowrap text-sm flex-shrink-0 ${
                    isActive
                      ? "bg-surface-variant text-on-surface font-medium"
                      : "bg-surface-variant text-on-surface-variant"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{option.label}</span>
                  <span className="sm:hidden">{option.shortLabel}</span>
                </button>
              </MaterialRipple>
            );
          })}
        </div>
      </div>

      {/* Orders List - mobile-first cards */}
      <div className="space-y-3 px-2">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-rounded text-5xl text-on-surface-variant mb-2">
              inventory_2
            </span>
            <p className="text-sm text-on-surface-variant">لا توجد طلبات</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface border border-outline-variant rounded-lg overflow-hidden"
            >
              <div className="p-2 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-on-surface truncate">
                      #{order.orderNumber}
                    </h3>
                    <span
                      className={`px-1.5 py-0.5 text-xs font-medium ${getOrderStatusColor(
                        order.status
                      )}`}
                      style={{ borderRadius: 9999 }}
                    >
                      {getOrderStatusText(order.status)}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant truncate">
                    {formatDateTime(order.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-on-surface">
                    {formatPrice(order.total)}
                  </p>
                  <button
                    onClick={() =>
                      setExpandedOrderId(
                        expandedOrderId === order.id ? null : order.id
                      )
                    }
                    className="p-2 rounded-md bg-surface-variant hover:bg-surface transition-colors"
                    aria-expanded={expandedOrderId === order.id}
                    aria-controls={`order-${order.id}-details`}
                  >
                    {expandedOrderId === order.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div
                id={`order-${order.id}-details`}
                className={`${
                  expandedOrderId === order.id ? "block" : "hidden"
                } px-3 pb-3`}
              >
                <div className="bg-surface-variant p-2 rounded-md mb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-rounded text-sm text-on-surface-variant">
                        person
                      </span>
                      <span className="text-sm text-on-surface truncate">
                        {order.customerName}
                      </span>
                    </div>
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="text-sm text-on-surface truncate"
                    >
                      {order.customerPhone}
                    </a>
                  </div>

                  {order.deliveryType === "delivery" ? (
                    <p className="text-sm text-on-surface-variant mt-2 line-clamp-2">
                      <span className="font-medium">العنوان: </span>
                      {order.customerAddress}
                    </p>
                  ) : (
                    <p className="text-sm text-on-surface-variant mt-2">
                      <span className="font-medium">الاستلام: </span>استلام من
                      المتجر
                    </p>
                  )}
                </div>

                <div className="space-y-2 mb-2">
                  {order.items &&
                    order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 bg-surface rounded-md"
                      >
                        <img
                          src={item.productImage}
                          alt={item.productNameAr}
                          className="w-8 h-8 object-cover rounded-md flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-on-surface truncate">
                            {item.productNameAr}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {item.quantity} × {formatPrice(item.price)}
                          </p>
                        </div>
                        <div className="text-sm text-on-surface font-medium">
                          {formatPrice(item.subtotal)}
                        </div>
                      </div>
                    ))}
                </div>

                <div className="flex gap-2 items-center">
                  <select
                    value={selectedStatuses[order.id] || order.status}
                    onChange={(e) =>
                      setSelectedStatuses((s) => ({
                        ...s,
                        [order.id]: e.target.value,
                      }))
                    }
                    className="flex-1 px-3 py-2 rounded-lg bg-surface-variant text-sm focus:outline-none"
                  >
                    {statusOptions
                      .filter((opt) => opt.value !== "all")
                      .map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                  </select>

                  <MaterialRipple>
                    <button
                      onClick={() =>
                        updateOrderStatus(
                          order.id,
                          (selectedStatuses[order.id] as Order["status"]) ||
                            order.status
                        )
                      }
                      className="px-3 py-2 rounded-lg bg-surface-variant text-sm font-medium"
                    >
                      تحديث
                    </button>
                  </MaterialRipple>
                </div>

                {order.notes && (
                  <div className="p-2 bg-surface-variant rounded-lg mt-2">
                    <span className="text-sm text-on-surface-variant block mb-1">
                      ملاحظات:
                    </span>
                    <p className="text-sm text-on-surface">{order.notes}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
