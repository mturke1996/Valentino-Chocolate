import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ShoppingCart, Heart, Eye } from "lucide-react";
import { Product } from "../types";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { formatPrice } from "../utils/formatters";
import { useCartStore } from "../store/cartStore";
import { Link } from "react-router-dom";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addToCart = useCartStore((state) => state.addToCart);

  const finalPrice = product.discount
    ? product.price * (1 - product.discount / 100)
    : product.price;

  const [localRating, setLocalRating] = useState<number | null>(
    product.rating ?? null
  );
  const [localReviewCount, setLocalReviewCount] = useState<number>(
    product.reviewCount || 0
  );

  useEffect(() => {
    let mounted = true;
    const fetchRating = async () => {
      try {
        const q = query(
          collection(db, "reviews"),
          where("productId", "==", product.id),
          where("verified", "==", true)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => d.data());
        if (!mounted) return;
        if (data.length === 0) return;
        const ratings = data.map((r: any) => r.rating || 0);
        const avg = ratings.reduce((s, v) => s + v, 0) / ratings.length;
        setLocalRating(avg);
        setLocalReviewCount(ratings.length);
      } catch (err) {
        // ignore
      }
    };

    if (localRating === null) fetchRating();

    return () => {
      mounted = false;
    };
  }, [product.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      className="md-elevated-card overflow-hidden group"
    >
      {/* Product Image */}
      <Link to={`/product/${product.id}`} className="relative block">
        <div className="relative aspect-square overflow-hidden bg-surface-variant">
          <motion.img
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
            src={product.images[0]}
            alt={product.nameAr}
            className="w-full h-full object-cover"
            loading="lazy"
          />

          {/* Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {product.discount && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-error text-error-on px-3 py-1 rounded-m3-sm md-typescale-label-small shadow-m3-2"
              >
                خصم {product.discount}%
              </motion.div>
            )}
            {product.featured && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-secondary text-secondary-on px-3 py-1 rounded-m3-sm md-typescale-label-small shadow-m3-2"
              >
                مميز
              </motion.div>
            )}
            {!product.inStock && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-outline text-surface px-3 py-1 rounded-m3-sm md-typescale-label-small shadow-m3-2"
              >
                نفذت الكمية
              </motion.div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 bg-surface rounded-full shadow-m3-2 hover:shadow-m3-3 ripple"
              aria-label="إضافة للمفضلة"
            >
              <Heart className="h-4 w-4 text-error" />
            </motion.button>
            <Link to={`/product/${product.id}`}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 bg-surface rounded-full shadow-m3-2 hover:shadow-m3-3 ripple"
                aria-label="عرض التفاصيل"
              >
                <Eye className="h-4 w-4 text-primary" />
              </motion.button>
            </Link>
          </div>
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-4 space-y-3">
        {/* Category */}
        <div className="flex items-center justify-between">
          <span className="md-typescale-label-small text-on-surface-variant">
            {product.category}
          </span>
          {(localRating ?? product.rating) && (
            <div className="flex items-center gap-1">
              <span className="material-symbols-rounded text-yellow-500 text-sm">
                star
              </span>
              <span className="md-typescale-label-small text-on-surface-variant">
                {(localRating ?? product.rating)!.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Product Name */}
        <Link to={`/product/${product.id}`}>
          <h3 className="md-typescale-title-medium text-on-surface hover:text-primary transition-colors line-clamp-2">
            {product.nameAr}
          </h3>
        </Link>

        {/* Description */}
        <p className="md-typescale-body-small text-on-surface-variant line-clamp-2">
          {product.descriptionAr}
        </p>

        {/* Weight */}
        {product.weight && (
          <div className="flex items-center gap-1 text-on-surface-variant">
            <span className="material-symbols-rounded text-sm">scale</span>
            <span className="md-typescale-label-small">{product.weight}</span>
          </div>
        )}

        {/* Price & Add to Cart */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex flex-col">
            {product.discount ? (
              <>
                <span className="md-typescale-title-large text-primary">
                  {formatPrice(finalPrice)}
                </span>
                <span className="md-typescale-body-small text-on-surface-variant line-through">
                  {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span className="md-typescale-title-large text-primary">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => product.inStock && addToCart(product)}
            disabled={!product.inStock}
            className={`p-3 rounded-m3 shadow-m3-1 hover:shadow-m3-2 ripple ${
              product.inStock
                ? "bg-primary text-primary-on"
                : "bg-surface-variant text-on-surface-variant cursor-not-allowed"
            }`}
            aria-label="أضف إلى السلة"
          >
            <ShoppingCart className="h-5 w-5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
