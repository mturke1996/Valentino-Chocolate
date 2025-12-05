import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Plus, Minus, Trash2, ArrowLeft } from "lucide-react";
import { useCartStore } from "../store/cartStore";
import { formatPrice } from "../utils/formatters";
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function CartPage() {
  const navigate = useNavigate();
  const { items, removeFromCart, updateQuantity, getTotal, clearCart } = useCartStore();
  const [deliveryFee, setDeliveryFee] = useState(0);

  useEffect(() => {
    const fetchDeliveryFee = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "general"));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setDeliveryFee(data.deliveryFee || 0);
        }
      } catch (error) {
        console.error("Error fetching delivery fee:", error);
      }
    };
    fetchDeliveryFee();
  }, []);

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center py-20">
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
            className="md-filled-button"
          >
            تصفح المنتجات
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h1 className="md-typescale-display-small text-on-background">
              سلة التسوق
            </h1>
            <Link to="/products" className="md-text-button flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              متابعة التسوق
            </Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-4"
          >
            {items.map((item) => {
              const finalPrice = item.product.discount
                ? item.product.price * (1 - item.product.discount / 100)
                : item.product.price;

              return (
                <motion.div
                  key={item.product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="md-elevated-card p-6 flex gap-6"
                >
                  <Link
                    to={`/product/${item.product.id}`}
                    className="flex-shrink-0"
                  >
                    <img
                      src={item.product.images[0]}
                      alt={item.product.nameAr}
                      className="w-32 h-32 object-cover rounded-m3"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${item.product.id}`}>
                      <h3 className="md-typescale-title-medium text-on-surface hover:text-primary transition-colors mb-2">
                        {item.product.nameAr}
                      </h3>
                    </Link>

                    <div className="flex items-center gap-2 mb-4">
                      <span className="md-typescale-title-medium text-primary">
                        {formatPrice(finalPrice)}
                      </span>
                      {item.product.discount && (
                        <span className="md-typescale-body-small text-on-surface-variant line-through">
                          {formatPrice(item.product.price)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-surface-variant rounded-m3 p-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1)
                          }
                          className="p-1 rounded-full hover:bg-outline-variant transition-colors"
                        >
                          <Minus className="h-4 w-4 text-on-surface" />
                        </motion.button>
                        <span className="md-typescale-body-medium text-on-surface min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1)
                          }
                          className="p-1 rounded-full hover:bg-outline-variant transition-colors"
                        >
                          <Plus className="h-4 w-4 text-on-surface" />
                        </motion.button>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-2 rounded-m3 hover:bg-error-container text-error transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </motion.button>

                      <div className="mr-auto">
                        <span className="md-typescale-title-medium text-primary">
                          {formatPrice(finalPrice * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={clearCart}
              className="w-full md-text-button text-error hover:bg-error-container"
            >
              <Trash2 className="h-4 w-4 ml-2" />
              إفراغ السلة
            </motion.button>
          </motion.div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="md-elevated-card p-6 sticky top-24">
              <h2 className="md-typescale-headline-small text-on-surface mb-6">
                ملخص الطلب
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="md-typescale-body-medium text-on-surface-variant">
                    المجموع الفرعي:
                  </span>
                  <span className="md-typescale-body-medium text-on-surface">
                    {formatPrice(getTotal())}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="md-typescale-body-medium text-on-surface-variant">
                    رسوم التوصيل:
                  </span>
                  <span className="md-typescale-body-medium text-on-surface">
                    {formatPrice(deliveryFee)}
                  </span>
                </div>
                <div className="border-t border-outline-variant pt-4 flex justify-between">
                  <span className="md-typescale-title-medium text-on-surface">
                    الإجمالي:
                  </span>
                  <span className="md-typescale-title-medium text-primary">
                    {formatPrice(getTotal() + deliveryFee)}
                  </span>
                </div>
              </div>

              <Link to="/checkout">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full md-filled-button py-4 shadow-m3-2 hover:shadow-m3-3"
                >
                  إتمام الطلب
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

