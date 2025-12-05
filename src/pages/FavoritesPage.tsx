import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useFavoritesStore } from "../store/favoritesStore";
import ProductCard from "../components/ProductCard";

export default function FavoritesPage() {
  const { items, clearFavorites } = useFavoritesStore();

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-6 bg-surface-variant rounded-full flex items-center justify-center">
            <Heart className="h-16 w-16 text-outline" />
          </div>
          <h2 className="md-typescale-headline-large text-on-surface mb-4">
            قائمة المفضلة فارغة
          </h2>
          <p className="md-typescale-body-medium text-on-surface-variant mb-6">
            أضف منتجات إلى قائمة المفضلة لتسهيل الوصول إليها لاحقاً
          </p>
          <Link to="/products">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="md-filled-button py-4 shadow-m3-2 hover:shadow-m3-3"
            >
              تصفح المنتجات
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="md-typescale-display-small text-on-background mb-2">
              قائمة المفضلة
            </h1>
            <p className="md-typescale-body-large text-on-surface-variant">
              {items.length} {items.length === 1 ? "منتج" : "منتج"} في المفضلة
            </p>
          </div>
          {items.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearFavorites}
              className="md-text-button text-error hover:bg-error-container"
            >
              إفراغ القائمة
            </motion.button>
          )}
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}


