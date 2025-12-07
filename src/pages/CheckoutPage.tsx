import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useCartStore } from "../store/cartStore";
import { formatPrice } from "../utils/formatters";
import { notifyNewOrder } from "../utils/telegramNotifications";
import { ShoppingBag, Truck, CreditCard, CheckCircle, Tag, X } from "lucide-react";
import toast from "react-hot-toast";
import { SiteSettings, DiscountCode, Order } from "../types";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<Partial<SiteSettings>>({});
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [discountError, setDiscountError] = useState("");
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    deliveryType: "delivery" as "pickup" | "delivery",
    paymentMethod: "cash" as "cash" | "card" | "online",
    notes: "",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "general"));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setSettings(data);
          setDeliveryFee(data.deliveryFee || 0);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, []);

  const subtotal = getTotal();
  const discountAmount = appliedDiscount
    ? appliedDiscount.discountType === "percentage"
      ? Math.min(
          (subtotal * appliedDiscount.discountValue) / 100,
          appliedDiscount.maxDiscount || Infinity
        )
      : appliedDiscount.discountValue
    : 0;
  const delivery = formData.deliveryType === "delivery" ? deliveryFee : 0;
  const total = subtotal - discountAmount + delivery;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleApplyDiscount = () => {
    setDiscountError("");
    if (!discountCode.trim()) {
      setDiscountError("يرجى إدخال كود الخصم");
      return;
    }

    const codes = settings.discountCodes || [];
    const code = codes.find(
      (c) => c.code.toUpperCase() === discountCode.toUpperCase() && c.active
    );

    if (!code) {
      setDiscountError("كود الخصم غير صحيح أو غير نشط");
      return;
    }

    const now = new Date();
    const validFrom = code.validFrom?.toDate ? code.validFrom.toDate() : new Date(code.validFrom);
    const validUntil = code.validUntil?.toDate ? code.validUntil.toDate() : new Date(code.validUntil);

    if (now < validFrom || now > validUntil) {
      setDiscountError("كود الخصم منتهي الصلاحية");
      return;
    }

    if ((code.minPurchase ?? 0) > 0 && subtotal < (code.minPurchase ?? 0)) {
      setDiscountError(`الحد الأدنى للشراء: ${code.minPurchase} د.ل`);
      return;
    }

    if ((code.usageLimit ?? 0) > 0 && (code.usedCount || 0) >= (code.usageLimit ?? 0)) {
      setDiscountError("تم استخدام كود الخصم بالكامل");
      return;
    }

    setAppliedDiscount(code);
    toast.success("تم تطبيق كود الخصم بنجاح");
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode("");
    setDiscountError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error("السلة فارغة");
      return;
    }

    // Validate required fields
    if (!formData.customerName.trim()) {
      toast.error("يرجى إدخال الاسم الكامل");
      return;
    }

    if (!formData.customerPhone.trim()) {
      toast.error("يرجى إدخال رقم الهاتف");
      return;
    }

    if (formData.deliveryType === "delivery" && !formData.customerAddress.trim()) {
      toast.error("يرجى إدخال العنوان");
      return;
    }

    setLoading(true);

    try {
      const orderNumber = `ORD-${Date.now()}`;
      const orderData = {
        orderNumber,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail || "",
        customerAddress:
          formData.deliveryType === "delivery"
            ? formData.customerAddress
            : "استلام من المتجر",
        deliveryType: formData.deliveryType,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes || "",
        items: items.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          productNameAr: item.product.nameAr,
          productImage: item.product.images[0],
          quantity: item.quantity,
          price: item.product.discount
            ? item.product.price * (1 - item.product.discount / 100)
            : item.product.price,
          subtotal:
            (item.product.discount
              ? item.product.price * (1 - item.product.discount / 100)
              : item.product.price) * item.quantity,
        })),
        subtotal,
        deliveryFee: delivery,
        discount: discountAmount,
        total,
        status: "pending",
        paymentStatus: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "orders"), orderData);

      // Send Telegram notification
      const orderForNotification: Order = {
        id: docRef.id,
        orderNumber: orderData.orderNumber,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        customerEmail: orderData.customerEmail,
        customerAddress: orderData.customerAddress,
        items: orderData.items,
        subtotal: orderData.subtotal,
        deliveryFee: orderData.deliveryFee,
        discount: orderData.discount,
        total: orderData.total,
        status: "pending" as const,
        deliveryType: orderData.deliveryType,
        paymentMethod: orderData.paymentMethod,
        paymentStatus: "pending" as const,
        notes: orderData.notes,
        createdAt: orderData.createdAt,
        updatedAt: orderData.updatedAt,
      };

      // Send notification and log result
      notifyNewOrder(orderForNotification)
        .then((success) => {
          if (success) {
            console.log("[Checkout] Telegram notification sent successfully");
            toast.success("تم إرسال إشعار الطلب إلى Telegram", { duration: 3000 });
          } else {
            console.warn("[Checkout] Telegram notification failed - check bot configuration");
            // Don't show error to user as order was created successfully
            // Admin can check console logs for details
          }
        })
        .catch((err) => {
          console.error("[Checkout] Telegram notification error:", err);
          // Don't show error to user as order was created successfully
        });

      clearCart();
      
      // Show success message
      toast.success("تم إرسال طلبك بنجاح! رقم الطلب: " + orderNumber, {
        duration: 4000,
        position: 'top-center',
      });
      
      // Navigate to home after a short delay to show success message
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 2000);
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast.error(error?.message || "حدث خطأ أثناء إنشاء الطلب. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-6 bg-surface-variant rounded-full flex items-center justify-center">
            <ShoppingBag className="h-16 w-16 text-outline" />
          </div>
          <h2 className="md-typescale-headline-large text-on-surface mb-4">
            السلة فارغة
          </h2>
          <p className="md-typescale-body-medium text-on-surface-variant mb-6">
            أضف منتجات إلى سلتك قبل إتمام الطلب
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/products")}
            className="md-filled-button py-4 shadow-m3-2 hover:shadow-m3-3"
          >
            تصفح المنتجات
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="md-typescale-display-small text-on-background mb-2">
            إتمام الطلب
          </h1>
          <p className="md-typescale-body-large text-on-surface-variant">
            أكمل بياناتك لإتمام عملية الشراء
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Info */}
              <div className="md-elevated-card p-6 space-y-4">
                <h3 className="md-typescale-title-large text-on-surface mb-4 flex items-center gap-2">
                  <span className="material-symbols-rounded text-primary">
                    person
                  </span>
                  بيانات العميل
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="md-typescale-label-large text-on-surface block mb-2">
                      الاسم الكامل *
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-surface border border-outline rounded-m3 md-typescale-body-medium text-on-surface focus:outline-none focus:border-primary focus:border-2"
                      placeholder="أحمد محمد"
                    />
                  </div>

                  <div>
                    <label className="md-typescale-label-large text-on-surface block mb-2">
                      رقم الهاتف *
                    </label>
                    <input
                      type="tel"
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-surface border border-outline rounded-m3 md-typescale-body-medium text-on-surface focus:outline-none focus:border-primary focus:border-2"
                      placeholder="01XXXXXXXXX"
                    />
                  </div>
                </div>

                <div>
                  <label className="md-typescale-label-large text-on-surface block mb-2">
                    البريد الإلكتروني (اختياري)
                  </label>
                  <input
                    type="email"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-surface border border-outline rounded-m3 md-typescale-body-medium text-on-surface focus:outline-none focus:border-primary focus:border-2"
                    placeholder="ahmed@example.com"
                  />
                </div>
              </div>

              {/* Delivery Type */}
              <div className="md-elevated-card p-6 space-y-4">
                <h3 className="md-typescale-title-large text-on-surface mb-4 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  طريقة الاستلام
                </h3>

                <div className="space-y-3">
                  {[
                    {
                      value: "delivery",
                      label: "توصيل إلى العنوان",
                      icon: "🚚",
                      desc: `رسوم التوصيل: ${deliveryFee} د.ل`,
                    },
                    {
                      value: "pickup",
                      label: "استلام من المتجر",
                      icon: "🏪",
                      desc: "بدون رسوم توصيل",
                    },
                  ].map((method) => (
                    <label
                      key={method.value}
                      className={`flex items-start gap-3 p-4 rounded-m3 cursor-pointer transition-all ${
                        formData.deliveryType === method.value
                          ? "bg-primary text-primary-on shadow-m3-2"
                          : "bg-surface border-2 border-outline hover:border-primary/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="deliveryType"
                        value={method.value}
                        checked={formData.deliveryType === method.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <span className="text-2xl">{method.icon}</span>
                      <div className="flex-1">
                        <span className={`md-typescale-body-large block ${
                          formData.deliveryType === method.value ? "text-primary-on font-semibold" : "text-on-surface"
                        }`}>
                          {method.label}
                        </span>
                        <span className={`md-typescale-body-small ${
                          formData.deliveryType === method.value ? "text-primary-on/80" : "text-on-surface-variant"
                        }`}>
                          {method.desc}
                        </span>
                      </div>
                      {formData.deliveryType === method.value && (
                        <CheckCircle className="h-5 w-5 text-primary-on" />
                      )}
                    </label>
                  ))}
                </div>

                {formData.deliveryType === "delivery" && (
                  <div className="mt-4">
                    <label className="md-typescale-label-large text-on-surface block mb-2">
                      العنوان بالتفصيل *
                    </label>
                    <textarea
                      name="customerAddress"
                      value={formData.customerAddress}
                      onChange={handleChange}
                      required
                      rows={3}
                      className="w-full px-4 py-3 bg-surface border border-outline rounded-m3 md-typescale-body-medium text-on-surface focus:outline-none focus:border-primary focus:border-2"
                      placeholder="الشارع، المنطقة، المدينة، الرمز البريدي"
                    />
                  </div>
                )}
              </div>

              {/* Discount Code */}
              <div className="md-elevated-card p-6 space-y-4">
                <h3 className="md-typescale-title-large text-on-surface mb-4 flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  كود الخصم
                </h3>

                {appliedDiscount ? (
                  <div className="p-4 bg-primary-container rounded-m3 flex items-center justify-between">
                    <div>
                      <span className="md-typescale-title-medium text-primary font-bold">
                        {appliedDiscount.code}
                      </span>
                      <span className="md-typescale-body-medium text-on-surface-variant mr-2">
                        - {appliedDiscount.discountType === "percentage" 
                          ? `${appliedDiscount.discountValue}%` 
                          : `${appliedDiscount.discountValue} د.ل`}
                      </span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleRemoveDiscount}
                      className="p-1 text-error hover:bg-error-container rounded-full transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </motion.button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(e) => {
                        setDiscountCode(e.target.value.toUpperCase());
                        setDiscountError("");
                      }}
                      placeholder="أدخل كود الخصم"
                      className="flex-1 px-4 py-3 bg-surface border border-outline rounded-m3 md-typescale-body-medium text-on-surface focus:outline-none focus:border-primary focus:border-2"
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleApplyDiscount}
                      className="md-filled-button px-6 py-3 shadow-m3-2 hover:shadow-m3-3"
                    >
                      تطبيق
                    </motion.button>
                  </div>
                )}
                {discountError && (
                  <p className="md-typescale-body-small text-error">{discountError}</p>
                )}

                {formData.deliveryType === "pickup" && (
                  <div className="mt-4 p-4 bg-surface-variant rounded-m3">
                    <p className="md-typescale-body-medium text-on-surface-variant">
                      📍 عنوان المتجر: نوفليين، طرابلس، ليبيا
                    </p>
                    <p className="md-typescale-body-small text-on-surface-variant mt-2">
                      سيتم إشعارك عند جاهزية الطلب للاستلام
                    </p>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="md-elevated-card p-6 space-y-4">
                <h3 className="md-typescale-title-large text-on-surface mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  طريقة الدفع
                </h3>

                <div className="space-y-3">
                  {[
                    { value: "cash", label: "الدفع عند الاستلام", icon: "💵" },
                    { value: "card", label: "بطاقة ائتمان", icon: "💳" },
                    { value: "online", label: "الدفع الإلكتروني", icon: "📱" },
                  ].map((method) => (
                    <label
                      key={method.value}
                      className={`flex items-center gap-3 p-4 rounded-m3 cursor-pointer transition-all ${
                        formData.paymentMethod === method.value
                          ? "bg-primary text-primary-on shadow-m3-2"
                          : "bg-surface border-2 border-outline hover:border-primary/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.value}
                        checked={formData.paymentMethod === method.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <span className="text-2xl">{method.icon}</span>
                      <span className={`md-typescale-body-large ${
                        formData.paymentMethod === method.value ? "text-primary-on font-semibold" : "text-on-surface"
                      }`}>
                        {method.label}
                      </span>
                      {formData.paymentMethod === method.value && (
                        <CheckCircle className="h-5 w-5 text-primary-on mr-auto" />
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="md-elevated-card p-6 space-y-4">
                <h3 className="md-typescale-title-large text-on-surface mb-4">
                  ملاحظات إضافية (اختياري)
                </h3>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-surface border border-outline rounded-m3 md-typescale-body-medium text-on-surface focus:outline-none focus:border-primary focus:border-2"
                  placeholder="أي ملاحظات خاصة بالطلب..."
                />
              </div>
            </form>
          </motion.div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="md-elevated-card p-6 sticky top-24 space-y-6">
              <h3 className="md-typescale-title-large text-on-surface">
                ملخص الطلب
              </h3>

              {/* Items */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-3">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.nameAr}
                      className="w-16 h-16 object-cover rounded-m3-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="md-typescale-body-medium text-on-surface truncate">
                        {item.product.nameAr}
                      </p>
                      <p className="md-typescale-body-small text-on-surface-variant">
                        x{item.quantity}
                      </p>
                    </div>
                    <p className="md-typescale-body-medium text-primary">
                      {formatPrice(
                        (item.product.discount
                          ? item.product.price *
                            (1 - item.product.discount / 100)
                          : item.product.price) * item.quantity
                      )}
                    </p>
                  </div>
                ))}
              </div>

              {/* Pricing */}
              <div className="space-y-2 pt-4 border-t border-outline-variant">
                <div className="flex justify-between md-typescale-body-medium text-on-surface">
                  <span>المجموع الفرعي:</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {appliedDiscount && (
                  <div className="flex justify-between md-typescale-body-medium text-on-surface">
                    <span className="text-primary">الخصم ({appliedDiscount.code}):</span>
                    <span className="text-primary">-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                {formData.deliveryType === "delivery" && (
                  <div className="flex justify-between md-typescale-body-medium text-on-surface">
                    <span>رسوم التوصيل:</span>
                    <span>{formatPrice(deliveryFee)}</span>
                  </div>
                )}
                <div className="flex justify-between md-typescale-title-large text-primary pt-2 border-t border-outline-variant">
                  <span>الإجمالي:</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={loading}
                className="w-full md-filled-button py-4 shadow-m3-2 hover:shadow-m3-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-5 w-5 border-2 border-primary-on border-t-transparent"></span>
                    <span>جاري معالجة الطلب...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>تأكيد الطلب</span>
                  </span>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
