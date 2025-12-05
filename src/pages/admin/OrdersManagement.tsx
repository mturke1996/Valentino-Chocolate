import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
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
  Trash2,
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
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

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

  const handleDeleteOrder = async (orderId: string) => {
    if (!showDeleteConfirm || showDeleteConfirm !== orderId) {
      setShowDeleteConfirm(orderId);
      return;
    }

    setDeletingOrderId(orderId);
    try {
      await deleteDoc(doc(db, "orders", orderId));
      toast.success("تم حذف الطلب بنجاح");
      setShowDeleteConfirm(null);
      fetchOrders();
    } catch (error: any) {
      console.error("Error deleting order:", error);
      toast.error(error?.message || "حدث خطأ أثناء حذف الطلب");
    } finally {
      setDeletingOrderId(null);
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
    <div className="space-y-2.5 pb-4 w-full max-w-full overflow-x-hidden px-1 sm:px-2">
      {/* Header */}
      <div className="flex flex-col gap-0.5 px-2 sm:px-3">
        <h2 className="text-sm sm:text-base font-bold text-on-background">
          إدارة الطلبات
        </h2>
        <p className="text-[10px] sm:text-xs text-on-surface-variant">
          {filteredOrders.length} من {orders.length} طلب
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-2 px-2 sm:px-3">
        <div className="relative">
          <span className="material-symbols-rounded absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs sm:text-sm pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="ابحث برقم الطلب أو اسم العميل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-7 pl-2 py-2 sm:py-1.5 bg-surface border border-outline-variant rounded-full text-xs focus:outline-none focus:border-blue-500 focus:border-2 transition-all"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1.5 scrollbar-hide -mx-2 px-2">
          {statusOptions.map((option) => {
            const Icon = option.icon;
            const isActive = statusFilter === option.value;
            return (
              <MaterialRipple key={option.value}>
                <button
                  onClick={() => setStatusFilter(option.value)}
                  className={`flex items-center gap-0.5 sm:gap-1 px-2 sm:px-2.5 py-1.5 rounded-full whitespace-nowrap text-[10px] sm:text-xs flex-shrink-0 ${
                    isActive
                      ? "bg-blue-100 text-blue-700 font-medium shadow-sm"
                      : "bg-surface-variant text-on-surface-variant"
                  }`}
                >
                  <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="hidden sm:inline">{option.label}</span>
                  <span className="sm:hidden">{option.shortLabel}</span>
                </button>
              </MaterialRipple>
            );
          })}
        </div>
      </div>

      {/* Orders List - mobile-first cards */}
      <div className="space-y-2 px-1.5 sm:px-3">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8">
            <span className="material-symbols-rounded text-3xl sm:text-4xl text-on-surface-variant mb-2">
              inventory_2
            </span>
            <p className="text-[10px] sm:text-xs text-on-surface-variant">لا توجد طلبات</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface border border-outline-variant rounded-lg overflow-hidden w-full max-w-full shadow-sm"
            >
              <div className="p-2 sm:p-2.5 flex items-center justify-between gap-1.5 sm:gap-2 border-b border-outline-variant/30">
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap mb-0.5 sm:mb-1">
                    <h3 className="text-[11px] sm:text-xs font-semibold text-on-surface truncate">
                      #{order.orderNumber}
                    </h3>
                    <span
                      className={`px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] font-medium rounded-full flex-shrink-0 ${getOrderStatusColor(
                        order.status
                      )}`}
                    >
                      {getOrderStatusText(order.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <p className="text-[9px] sm:text-[10px] text-on-surface-variant truncate">
                      {formatDateTime(order.createdAt)}
                    </p>
                    <p className="text-[11px] sm:text-xs font-semibold text-primary flex-shrink-0">
                      {formatPrice(order.total)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                  <MaterialRipple>
                    <button
                      onClick={() =>
                        setExpandedOrderId(
                          expandedOrderId === order.id ? null : order.id
                        )
                      }
                      className="p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-surface-variant hover:bg-outline-variant transition-colors"
                      aria-expanded={expandedOrderId === order.id}
                      aria-controls={`order-${order.id}-details`}
                    >
                      {expandedOrderId === order.id ? (
                        <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      )}
                    </button>
                  </MaterialRipple>
                </div>
              </div>

              <div
                id={`order-${order.id}-details`}
                className={`${
                  expandedOrderId === order.id ? "block" : "hidden"
                } px-2 sm:px-3 pb-2 sm:pb-3`}
              >
                <div className="bg-surface-variant p-2 rounded-md mb-2">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="material-symbols-rounded text-[11px] sm:text-xs text-on-surface-variant flex-shrink-0">
                        person
                      </span>
                      <span className="text-[11px] sm:text-xs text-on-surface truncate flex-1 min-w-0">
                        {order.customerName}
                      </span>
                    </div>
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="text-[11px] sm:text-xs text-blue-600 truncate flex items-center gap-1 min-w-0"
                    >
                      <span className="material-symbols-rounded text-[10px] sm:text-xs flex-shrink-0">phone</span>
                      <span className="truncate">{order.customerPhone}</span>
                    </a>
                  </div>

                  {order.deliveryType === "delivery" ? (
                    <p className="text-[10px] sm:text-xs text-on-surface-variant mt-1.5 line-clamp-2 break-words">
                      <span className="font-medium">العنوان: </span>
                      {order.customerAddress}
                    </p>
                  ) : (
                    <p className="text-[10px] sm:text-xs text-on-surface-variant mt-1.5">
                      <span className="font-medium">الاستلام: </span>استلام من المتجر
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 mb-2">
                  {order.items &&
                    order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 p-1.5 bg-surface rounded-md w-full min-w-0"
                      >
                        <img
                          src={item.productImage}
                          alt={item.productNameAr}
                          className="w-9 h-9 sm:w-10 sm:h-10 object-cover rounded-md flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <p className="text-[11px] sm:text-xs text-on-surface truncate">
                            {item.productNameAr}
                          </p>
                          <p className="text-[9px] sm:text-[10px] text-on-surface-variant truncate">
                            {item.quantity} × {formatPrice(item.price)}
                          </p>
                        </div>
                        <div className="text-[11px] sm:text-xs text-on-surface font-medium flex-shrink-0">
                          {formatPrice(item.subtotal)}
                        </div>
                      </div>
                    ))}
                </div>

                <div className="flex flex-col gap-1.5 sm:gap-2 w-full">
                  <div className="flex gap-1.5 items-center w-full">
                    <select
                      value={selectedStatuses[order.id] || order.status}
                      onChange={(e) =>
                        setSelectedStatuses((s) => ({
                          ...s,
                          [order.id]: e.target.value,
                        }))
                      }
                      className="flex-1 min-w-0 px-2 py-1.5 sm:py-2 rounded-lg bg-surface-variant text-[11px] sm:text-xs focus:outline-none border border-outline-variant focus:border-blue-500 transition-colors"
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
                        className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-blue-600 text-white text-[11px] sm:text-xs font-medium whitespace-nowrap hover:bg-blue-700 transition-colors min-w-[60px] sm:min-w-[70px]"
                      >
                        تحديث
                      </button>
                    </MaterialRipple>
                  </div>

                  <MaterialRipple>
                    <button
                      onClick={() => handleDeleteOrder(order.id)}
                      disabled={deletingOrderId === order.id}
                      className={`w-full px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-white text-[11px] sm:text-xs font-medium whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
                        showDeleteConfirm === order.id
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-red-500 hover:bg-red-600"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {deletingOrderId === order.id ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                          <span>جاري الحذف...</span>
                        </>
                      ) : showDeleteConfirm === order.id ? (
                        <>
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>تأكيد الحذف</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>حذف الطلب</span>
                        </>
                      )}
                    </button>
                  </MaterialRipple>
                </div>

                {order.notes && (
                  <div className="p-1.5 bg-surface-variant rounded-lg mt-2">
                    <span className="text-[10px] sm:text-xs text-on-surface-variant block mb-1">
                      ملاحظات:
                    </span>
                    <p className="text-[11px] sm:text-xs text-on-surface break-words">{order.notes}</p>
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
