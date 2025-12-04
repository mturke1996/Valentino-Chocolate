import { format } from "date-fns";
import { ar } from "date-fns/locale";

export const formatPrice = (price: number): string => {
  return `${price.toFixed(2)} د.ل`;
};

export const formatDate = (date: any): string => {
  if (!date) return "";

  const dateObj = date.toDate ? date.toDate() : new Date(date);
  return format(dateObj, "dd MMMM yyyy", { locale: ar });
};

export const formatDateTime = (date: any): string => {
  if (!date) return "";

  const dateObj = date.toDate ? date.toDate() : new Date(date);
  return format(dateObj, "dd MMMM yyyy - hh:mm a", { locale: ar });
};

export const formatOrderNumber = (orderNumber: number): string => {
  return `ORD-${String(orderNumber).padStart(6, "0")}`;
};

export const formatPhone = (phone: string): string => {
  // Format Egyptian phone numbers
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11 && cleaned.startsWith("01")) {
    return cleaned.replace(/(\d{4})(\d{3})(\d{4})/, "$1 $2 $3");
  }
  return phone;
};

export const getOrderStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: "قيد الانتظار",
    confirmed: "تم التأكيد",
    preparing: "قيد التحضير",
    "out-for-delivery": "في الطريق",
    delivered: "تم التوصيل",
    cancelled: "ملغي",
  };
  return statusMap[status] || status;
};

export const getOrderStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    preparing: "bg-purple-100 text-purple-800",
    "out-for-delivery": "bg-indigo-100 text-indigo-800",
    delivered: "bg-primary-container text-primary",
    cancelled: "bg-red-100 text-red-800",
  };
  return colorMap[status] || "bg-gray-100 text-gray-800";
};

export const getPaymentMethodText = (method: string): string => {
  const methodMap: Record<string, string> = {
    cash: "الدفع عند الاستلام",
    card: "بطاقة ائتمان",
    online: "الدفع الإلكتروني",
  };
  return methodMap[method] || method;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};
