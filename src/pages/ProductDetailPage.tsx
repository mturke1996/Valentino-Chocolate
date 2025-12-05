import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { Product } from "../types";
import { formatPrice } from "../utils/formatters";
import { useCartStore } from "../store/cartStore";
import { useFavoritesStore } from "../store/favoritesStore";
import {
  ShoppingCart,
  Heart,
  Share2,
  Star,
  Truck,
  Shield,
  ChevronLeft,
  ChevronRight,
  X,
  MessageSquare,
} from "lucide-react";
import ProductCard from "../components/ProductCard";
import AddReviewModal from "../components/AddReviewModal";
import toast from "react-hot-toast";

/**
 * صفحة تفاصيل المنتج
 *
 * مقاسات الصور الموصى بها:
 * - الصورة الرئيسية: 800x800 بكسل (مربع)
 * - صور إضافية: 800x800 بكسل (مربع)
 * - حجم الملف: أقل من 300KB لكل صورة
 * - الصيغة المفضلة: WebP أو JPG
 *
 * يمكن رفع عدة صور لكل منتج من لوحة التحكم
 */

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [productRating, setProductRating] = useState<number | null>(null);
  const [productReviewCount, setProductReviewCount] = useState<number>(0);
  const addToCart = useCartStore((state) => state.addToCart);
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavoritesStore();

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [id]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        // Fetch Product
        const productDoc = await getDoc(doc(db, "products", id));
        if (productDoc.exists()) {
          const productData = {
            id: productDoc.id,
            ...productDoc.data(),
          } as Product;
          setProduct(productData);
          setProductRating(productData.rating ?? null);
          setProductReviewCount(productData.reviewCount ?? 0);

          // Fetch Reviews to calculate rating
          try {
            const reviewsQuery = query(
              collection(db, "reviews"),
              where("productId", "==", id),
              where("verified", "==", true)
            );
            const reviewsSnapshot = await getDocs(reviewsQuery);
            const reviewsData = reviewsSnapshot.docs.map((d) => d.data());
            if (reviewsData.length > 0) {
              const ratings = reviewsData.map((r: any) => r.rating || 0);
              const avg = ratings.reduce((s, v) => s + v, 0) / ratings.length;
              setProductRating(avg);
              setProductReviewCount(reviewsData.length);
            }
          } catch (reviewError: any) {
            // Fallback: fetch all reviews and filter client-side
            try {
              const reviewsQuery = query(
                collection(db, "reviews"),
                where("productId", "==", id)
              );
              const reviewsSnapshot = await getDocs(reviewsQuery);
              const allReviews = reviewsSnapshot.docs.map((d) => d.data());
              const verifiedReviews = allReviews.filter((r: any) => r.verified === true);
              if (verifiedReviews.length > 0) {
                const ratings = verifiedReviews.map((r: any) => r.rating || 0);
                const avg = ratings.reduce((s, v) => s + v, 0) / ratings.length;
                setProductRating(avg);
                setProductReviewCount(verifiedReviews.length);
              }
            } catch (err) {
              console.error("Error fetching reviews:", err);
            }
          }

          // Fetch Related Products
          const relatedQuery = query(
            collection(db, "products"),
            where("category", "==", productData.category),
            where("inStock", "==", true),
            limit(4)
          );
          const relatedSnapshot = await getDocs(relatedQuery);
          const relatedData = relatedSnapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() } as Product))
            .filter((p) => p.id !== id);
          setRelatedProducts(relatedData);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="md-typescale-headline-large text-on-surface mb-4">
            المنتج غير موجود
          </h2>
          <Link to="/products">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="md-filled-button"
            >
              العودة للمنتجات
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }

  const finalPrice = product.discount
    ? product.price * (1 - product.discount / 100)
    : product.price;

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.nameAr,
        text: product.descriptionAr,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("تم نسخ الرابط");
    }
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setSelectedImage(
      (prev) => (prev - 1 + product.images.length) % product.images.length
    );
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 md-typescale-body-small text-on-surface-variant">
          <Link to="/" className="hover:text-primary">
            الرئيسية
          </Link>
          <span>/</span>
          <Link to="/products" className="hover:text-primary">
            المنتجات
          </Link>
          <span>/</span>
          <span className="text-on-surface">{product.nameAr}</span>
        </nav>

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Images Gallery */}
          <div className="space-y-4">
            {/* Main Image with Carousel */}
            <div className="relative aspect-square rounded-m3 overflow-hidden bg-surface-variant md-elevated-card group">
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImage}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  src={product.images[selectedImage]}
                  alt={product.nameAr}
                  className="w-full h-full object-cover cursor-zoom-in transition-transform duration-300 group-hover:scale-105"
                  onClick={() => setLightboxOpen(true)}
                />
              </AnimatePresence>

              {/* Navigation Arrows - Show on hover */}
              {product.images.length > 1 && (
                <>
                  <motion.button
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1, scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImage();
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-primary/90 backdrop-blur-md rounded-full shadow-m3-3 text-primary-on opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 ripple"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </motion.button>
                  <motion.button
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1, scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-primary/90 backdrop-blur-md rounded-full shadow-m3-3 text-primary-on opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 ripple"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </motion.button>

                  {/* Image Counter */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full md-typescale-label-small text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {selectedImage + 1} / {product.images.length}
                  </div>
                </>
              )}

              {/* Badges */}
              <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                {product.discount && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-error text-error-on px-3 py-1 rounded-m3-sm md-typescale-label-small shadow-m3-2"
                  >
                    خصم {product.discount}%
                  </motion.div>
                )}
                {product.featured && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-secondary text-secondary-on px-3 py-1 rounded-m3-sm md-typescale-label-small shadow-m3-2"
                  >
                    مميز
                  </motion.div>
                )}
              </div>
            </div>

            {/* Thumbnails Carousel */}
            {product.images.length > 1 && (
              <div className="relative">
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {product.images.map((image, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.05, y: -4 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 aspect-square w-20 rounded-m3-sm overflow-hidden border-2 transition-all duration-300 ${
                        selectedImage === index
                          ? "border-primary ring-2 ring-primary/50 shadow-m3-2 scale-105"
                          : "border-outline-variant hover:border-primary/50 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.nameAr} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {selectedImage === index && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute inset-0 bg-primary/20"
                        />
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Title & Category */}
            <div>
              {product.category && 
               product.category !== product.id && 
               product.category !== "0" && 
               !product.category.includes(product.id) && (
                <span className="md-typescale-label-large text-primary">
                  {product.category}
                </span>
              )}
              <h1 className="md-typescale-display-small text-on-background mt-2">
                {product.nameAr}
              </h1>
            </div>

            {/* Rating */}
            {(productRating !== null && productRating > 0) && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(productRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : i < productRating
                          ? "fill-yellow-400/50 text-yellow-400/50"
                          : "fill-gray-300 text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="md-typescale-body-medium text-on-surface-variant">
                  {productRating.toFixed(1)}
                  {productReviewCount > 0 && (
                    <> ({productReviewCount} {productReviewCount === 1 ? 'تقييم' : 'تقييم'})</>
                  )}
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="md-typescale-display-medium text-primary">
                {formatPrice(finalPrice)}
              </span>
              {product.discount && (
                <span className="md-typescale-title-large text-on-surface-variant line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="md-filled-card p-4">
              <p className="md-typescale-body-large text-on-surface">
                {product.descriptionAr}
              </p>
            </div>

            {/* Additional Info */}
            {product.weight && (
              <div className="flex items-center gap-2 text-on-surface">
                <span className="material-symbols-rounded text-primary">
                  scale
                </span>
                <span className="md-typescale-body-medium">
                  الوزن: {product.weight}
                </span>
              </div>
            )}

            {/* Stock Status */}
            <div
              className={`flex items-center gap-2 ${
                product.inStock ? "text-primary" : "text-error"
              }`}
            >
              <span className="material-symbols-rounded">
                {product.inStock ? "check_circle" : "cancel"}
              </span>
              <span className="md-typescale-body-medium">
                {product.inStock ? "متوفر في المخزون" : "نفذت الكمية"}
              </span>
            </div>

            {/* Quantity & Add to Cart */}
            {product.inStock && (
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2 bg-surface-variant rounded-m3 p-1">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 rounded-m3-sm hover:bg-outline-variant ripple"
                  >
                    <span className="material-symbols-rounded">remove</span>
                  </motion.button>
                  <span className="md-typescale-title-medium text-on-surface min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 rounded-m3-sm hover:bg-outline-variant ripple"
                  >
                    <span className="material-symbols-rounded">add</span>
                  </motion.button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddToCart}
                  className="flex-1 md-filled-button py-4 shadow-m3-2 hover:shadow-m3-3"
                >
                  <span className="flex items-center justify-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    <span>أضف إلى السلة</span>
                  </span>
                </motion.button>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setReviewModalOpen(true)}
                className="flex-1 md-outlined-button min-w-[140px]"
              >
                <MessageSquare className="h-5 w-5 ml-2" />
                أضف تقييم
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (isFavorite(product.id)) {
                    removeFromFavorites(product.id);
                  } else {
                    addToFavorites(product);
                  }
                }}
                className={`md-outlined-button ${
                  isFavorite(product.id) ? "bg-primary-container text-primary border-primary" : ""
                }`}
              >
                <Heart
                  className={`h-5 w-5 ml-2 ${
                    isFavorite(product.id) ? "fill-primary text-primary" : ""
                  }`}
                />
                {isFavorite(product.id) ? "إزالة من المفضلة" : "إضافة للمفضلة"}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShare}
                className="md-outlined-button"
              >
                <Share2 className="h-5 w-5 ml-2" />
                مشاركة
              </motion.button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4">
              <div className="md-filled-card p-4 flex items-center gap-3">
                <Truck className="h-6 w-6 text-primary flex-shrink-0" />
                <div>
                  <p className="md-typescale-title-small text-on-surface">
                    توصيل سريع
                  </p>
                  <p className="md-typescale-body-small text-on-surface-variant">
                    خلال 24 ساعة
                  </p>
                </div>
              </div>
              <div className="md-filled-card p-4 flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary flex-shrink-0" />
                <div>
                  <p className="md-typescale-title-small text-on-surface">
                    دفع آمن
                  </p>
                  <p className="md-typescale-body-small text-on-surface-variant">
                    100% محمي
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="md-typescale-headline-large text-on-background mb-6">
              منتجات ذات صلة
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </section>
        )}

        {/* Lightbox */}
        <AnimatePresence>
          {lightboxOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLightboxOpen(false)}
              className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setLightboxOpen(false)}
                className="absolute top-4 left-4 p-2 bg-surface/20 backdrop-blur-sm rounded-full text-surface hover:bg-surface/30"
              >
                <X className="h-6 w-6" />
              </motion.button>
              <motion.img
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                src={product.images[selectedImage]}
                alt={product.nameAr}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Review Modal */}
        {product && (
          <AddReviewModal
            product={product}
            isOpen={reviewModalOpen}
            onClose={() => setReviewModalOpen(false)}
            onSuccess={() => {
              // Refresh product data if needed
            }}
          />
        )}
      </div>
    </div>
  );
}
