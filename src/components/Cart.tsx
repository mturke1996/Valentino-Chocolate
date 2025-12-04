import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { useCartStore } from "../store/cartStore";
import { formatPrice } from "../utils/formatters";
import { Link } from "react-router-dom";

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Cart({ isOpen, onClose }: CartProps) {
  const { items, removeFromCart, updateQuantity, getTotal, clearCart } =
    useCartStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Cart Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-surface shadow-m3-5 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-outline-variant">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-6 w-6 text-primary" />
                <h2 className="md-typescale-headline-small text-on-surface">
                  سلة التسوق
                </h2>
                <span className="px-2 py-1 bg-primary-container text-primary-on-container rounded-m3-sm md-typescale-label-small">
                  {items.length}
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-full hover:bg-surface-variant transition-colors ripple"
              >
                <X className="h-6 w-6 text-on-surface" />
              </motion.button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-36">
              {items.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full text-center"
                >
                  <div className="w-32 h-32 bg-surface-variant rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag className="h-16 w-16 text-outline" />
                  </div>
                  <h3 className="md-typescale-title-large text-on-surface mb-2">
                    السلة فارغة
                  </h3>
                  <p className="md-typescale-body-medium text-on-surface-variant mb-6">
                    ابدأ بإضافة المنتجات إلى سلتك
                  </p>
                  <Link to="/products" onClick={onClose}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="md-filled-button"
                    >
                      تصفح المنتجات
                    </motion.button>
                  </Link>
                </motion.div>
              ) : (
                <>
                  <AnimatePresence mode="popLayout">
                    {items.map((item) => {
                      const finalPrice = item.product.discount
                        ? item.product.price * (1 - item.product.discount / 100)
                        : item.product.price;

                      return (
                        <motion.div
                          key={item.product.id}
                          layout
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -50 }}
                          className="md-elevated-card p-2 flex gap-3"
                        >
                          {/* Product Image */}
                          <Link
                            to={`/product/${item.product.id}`}
                            onClick={onClose}
                            className="flex-shrink-0"
                          >
                            <img
                              src={item.product.images[0]}
                              alt={item.product.nameAr}
                              className="w-14 h-14 object-cover rounded-m3-sm"
                            />
                          </Link>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/product/${item.product.id}`}
                              onClick={onClose}
                            >
                              <h3 className="md-typescale-title-small text-on-surface hover:text-primary transition-colors line-clamp-1">
                                {item.product.nameAr}
                              </h3>
                            </Link>

                            <div className="flex items-center gap-2 mt-1">
                              <span className="md-typescale-title-medium text-primary">
                                {formatPrice(finalPrice)}
                              </span>
                              {item.product.discount && (
                                <span className="md-typescale-body-small text-on-surface-variant line-through">
                                  {formatPrice(item.product.price)}
                                </span>
                              )}
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2 mt-2">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    item.quantity - 1
                                  )
                                }
                                className="p-1 rounded-full bg-surface-variant hover:bg-outline-variant transition-colors ripple"
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
                                  updateQuantity(
                                    item.product.id,
                                    item.quantity + 1
                                  )
                                }
                                className="p-1 rounded-full bg-surface-variant hover:bg-outline-variant transition-colors ripple"
                              >
                                <Plus className="h-4 w-4 text-on-surface" />
                              </motion.button>

                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => removeFromCart(item.product.id)}
                                className="mr-auto p-1 rounded-full hover:bg-error-container text-error transition-colors ripple"
                              >
                                <Trash2 className="h-4 w-4" />
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Clear Cart Button */}
                  {items.length > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={clearCart}
                      className="w-full md-text-button text-error hover:bg-error-container"
                    >
                      <Trash2 className="h-4 w-4 ml-2" />
                      إفراغ السلة
                    </motion.button>
                  )}
                </>
              )}
            </div>

            {/* Footer (fixed inside panel) */}
            {items.length > 0 && (
              <div className="absolute left-0 right-0 bottom-0 p-4 bg-surface-variant border-t border-outline-variant">
                {/* Total */}
                <div className="flex items-center justify-between mb-3">
                  <span className="md-typescale-title-medium text-on-surface">
                    الإجمالي:
                  </span>
                  <span className="md-typescale-headline-small text-primary">
                    {formatPrice(getTotal())}
                  </span>
                </div>

                {/* Checkout Button */}
                <Link to="/checkout" onClick={onClose}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full md-filled-button py-4 shadow-m3-2 hover:shadow-m3-3 text-base"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span>إتمام الطلب</span>
                      <span className="material-symbols-rounded">
                        arrow_back
                      </span>
                    </span>
                  </motion.button>
                </Link>

                {/* Continue Shopping */}
                <Link to="/products" onClick={onClose}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full md-outlined-button mt-2 py-3 text-base"
                  >
                    متابعة التسوق
                  </motion.button>
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
