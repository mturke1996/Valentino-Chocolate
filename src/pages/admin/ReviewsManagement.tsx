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
  getDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { Review, Product } from "../../types";
import { formatDateTime } from "../../utils/formatters";
import {
  Search,
  Star,
  Trash2,
  CheckCircle,
  XCircle,
  Reply,
  Package,
} from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

export default function ReviewsManagement() {
  const [reviews, setReviews] = useState<(Review & { productName?: string; productNameAr?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const reviewsQuery = query(
        collection(db, "reviews"),
        orderBy("createdAt", "desc")
      );
      const reviewsSnapshot = await getDocs(reviewsQuery);
      const reviewsData = await Promise.all(
        reviewsSnapshot.docs.map(async (doc) => {
          const reviewData = {
            id: doc.id,
            ...doc.data(),
          } as Review;
          
          // Fetch product name
          let productName = "";
          let productNameAr = "";
          if (reviewData.productId) {
            try {
              const productDoc = await getDoc(doc(db, "products", reviewData.productId));
              if (productDoc.exists()) {
                const product = productDoc.data() as Product;
                productName = product.name || "";
                productNameAr = product.nameAr || "";
              }
            } catch (err) {
              console.error("Error fetching product:", err);
            }
          }
          
          return {
            ...reviewData,
            productName,
            productNameAr,
          };
        })
      );
      setReviews(reviewsData);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("حدث خطأ أثناء تحميل التقييمات");
    } finally {
      setLoading(false);
    }
  };

  const toggleVerified = async (reviewId: string, verified: boolean) => {
    try {
      await updateDoc(doc(db, "reviews", reviewId), {
        verified: !verified,
      });
      toast.success(verified ? "تم إلغاء التحقق" : "تم التحقق من التقييم");
      fetchReviews();
    } catch (error) {
      toast.error("حدث خطأ أثناء التحديث");
    }
  };

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) {
      toast.error("يرجى إدخال رد");
      return;
    }

    try {
      await updateDoc(doc(db, "reviews", reviewId), {
        reply: replyText,
      });
      toast.success("تم إضافة الرد بنجاح");
      setSelectedReview(null);
      setReplyText("");
      fetchReviews();
    } catch (error) {
      toast.error("حدث خطأ أثناء إضافة الرد");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا التقييم؟")) return;

    try {
      await deleteDoc(doc(db, "reviews", id));
      toast.success("تم حذف التقييم بنجاح");
      fetchReviews();
    } catch (error) {
      toast.error("حدث خطأ أثناء حذف التقييم");
    }
  };

  const filteredReviews = reviews.filter(
    (review) =>
      review.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (review.productNameAr && review.productNameAr.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-outline-variant border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="md-typescale-headline-large text-on-background">
            إدارة التقييمات
          </h2>
          <p className="md-typescale-body-medium text-on-surface-variant">
            {reviews.length} تقييم
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant" />
        <input
          type="text"
          placeholder="ابحث عن تقييم..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pr-12 pl-4 py-3 bg-surface border border-outline rounded-m3 md-typescale-body-medium text-on-surface focus:outline-none focus:border-blue-500 focus:border-2"
        />
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12">
            <Star className="h-16 w-16 text-outline mx-auto mb-4" />
            <p className="md-typescale-body-large text-on-surface-variant">
              لا توجد تقييمات
            </p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="md-elevated-card p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  {/* Product Info */}
                  {review.productNameAr && (
                    <div className="flex items-center gap-2 p-3 bg-primary-container/30 rounded-m3 border-r-4 border-primary">
                      <Package className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <p className="md-typescale-label-small text-on-surface-variant mb-1">
                          تقييم لمنتج:
                        </p>
                        <Link
                          to={`/product/${review.productId}`}
                          className="md-typescale-title-medium text-primary hover:underline"
                        >
                          {review.productNameAr}
                        </Link>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-surface-variant rounded-full flex items-center justify-center">
                      <span className="md-typescale-title-medium text-on-surface">
                        {review.userName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="md-typescale-title-medium text-on-surface">
                          {review.userName}
                        </h3>
                        <span className={`px-2 py-1 rounded-m3-sm md-typescale-label-small ${
                          review.verified
                            ? "bg-primary-container text-primary"
                            : "bg-surface-variant text-on-surface-variant"
                        }`}>
                          {review.verified ? "✓ تم التحقق" : "⏳ في الانتظار"}
                        </span>
                        {review.verified && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <p className="md-typescale-body-small text-on-surface-variant">
                        {formatDateTime(review.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < review.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-outline-variant"
                        }`}
                      />
                    ))}
                    <span className="md-typescale-body-medium text-on-surface-variant mr-2">
                      ({review.rating}/5)
                    </span>
                  </div>

                  <p className="md-typescale-body-medium text-on-surface">
                    {review.comment}
                  </p>

                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {review.images.map((img, index) => (
                        <img
                          key={index}
                          src={img}
                          alt={`صورة ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-m3-sm"
                        />
                      ))}
                    </div>
                  )}

                  {review.reply && (
                    <div className="mt-4 p-4 bg-surface-variant rounded-m3">
                      <div className="flex items-center gap-2 mb-2">
                        <Reply className="h-4 w-4 text-on-surface" />
                        <span className="md-typescale-label-medium text-on-surface">
                          رد الموقع:
                        </span>
                      </div>
                      <p className="md-typescale-body-medium text-on-surface">
                        {review.reply}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {!review.reply && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedReview(review)}
                      className="p-2 rounded-m3 bg-surface-variant text-on-surface hover:opacity-90 transition-opacity"
                    >
                      <Reply className="h-5 w-5" />
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleVerified(review.id, review.verified)}
                    className={`p-2 rounded-m3 transition-colors ${
                      review.verified
                        ? "bg-blue-100 text-blue-700"
                        : "bg-surface-variant text-on-surface-variant hover:bg-outline-variant"
                    }`}
                  >
                    {review.verified ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <XCircle className="h-5 w-5" />
                    )}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDelete(review.id)}
                    className="p-2 rounded-m3 bg-surface-variant text-on-surface hover:bg-outline-variant transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Reply Modal */}
      {selectedReview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedReview(null)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface rounded-m3-lg shadow-m3-5 w-full max-w-2xl p-6"
          >
            <h3 className="md-typescale-headline-small text-on-surface mb-4">
              رد على تقييم من {selectedReview.userName}
            </h3>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 bg-surface border border-outline rounded-m3 focus:outline-none focus:border-blue-500 focus:border-2 mb-4"
              placeholder="اكتب ردك هنا..."
            />
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setSelectedReview(null);
                  setReplyText("");
                }}
                className="md-outlined-button"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleReply(selectedReview.id)}
                className="md-filled-button"
              >
                إضافة الرد
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
