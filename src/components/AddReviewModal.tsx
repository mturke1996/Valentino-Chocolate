import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Upload } from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { Product } from "../types";
import toast from "react-hot-toast";
import { uploadMultipleToImgBB } from "../utils/imgbbUpload";
import { notifyNewReview } from "../utils/telegramNotifications";

interface AddReviewModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddReviewModal({
  product,
  isOpen,
  onClose,
  onSuccess,
}: AddReviewModalProps) {
  const [formData, setFormData] = useState({
    userName: "",
    userEmail: "",
    rating: 5,
    comment: "",
    images: [] as string[],
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    setUploading(true);
    const files = Array.from(e.target.files);
    try {
      const uploadedUrls = await uploadMultipleToImgBB(files);
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
      toast.success("تم رفع الصور بنجاح");
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("فشل رفع الصور");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.userName.trim() || !formData.comment.trim()) {
      toast.error("يرجى إدخال الاسم والتعليق");
      return;
    }

    setSubmitting(true);

    try {
      const reviewData = {
        productId: product.id,
        userName: formData.userName,
        userEmail: formData.userEmail || "",
        rating: formData.rating,
        comment: formData.comment,
        images: formData.images,
        verified: false,
        helpful: 0,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "reviews"), reviewData);

      // Send Telegram notification
      await notifyNewReview(
        product.nameAr,
        formData.rating,
        formData.comment
      );

      toast.success("تم إضافة التقييم بنجاح! سيتم مراجعته قريباً.");
      setFormData({
        userName: "",
        userEmail: "",
        rating: 5,
        comment: "",
        images: [],
      });
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("حدث خطأ أثناء إضافة التقييم");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-surface rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-primary/10 to-primary-container/10 backdrop-blur-sm border-b border-outline-variant p-6 flex items-center justify-between">
            <div>
              <h3 className="md-typescale-headline-small text-on-surface font-bold">
                إضافة تقييم
              </h3>
              <p className="md-typescale-body-small text-on-surface-variant mt-1">
                {product.nameAr}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-surface-variant transition-colors"
            >
              <X className="h-6 w-6 text-on-surface" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Rating */}
            <div>
              <label className="block mb-3 md-typescale-label-large text-on-surface">
                التقييم *
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-8 w-8 transition-all ${
                        star <= formData.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-outline-variant"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block mb-2 md-typescale-label-large text-on-surface">
                الاسم *
              </label>
              <input
                type="text"
                value={formData.userName}
                onChange={(e) =>
                  setFormData({ ...formData, userName: e.target.value })
                }
                required
                className="w-full px-4 py-3 bg-surface border border-outline rounded-xl focus:outline-none focus:border-primary focus:border-2"
                placeholder="أدخل اسمك"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block mb-2 md-typescale-label-large text-on-surface">
                البريد الإلكتروني (اختياري)
              </label>
              <input
                type="email"
                value={formData.userEmail}
                onChange={(e) =>
                  setFormData({ ...formData, userEmail: e.target.value })
                }
                className="w-full px-4 py-3 bg-surface border border-outline rounded-xl focus:outline-none focus:border-primary focus:border-2"
                placeholder="example@email.com"
              />
            </div>

            {/* Comment */}
            <div>
              <label className="block mb-2 md-typescale-label-large text-on-surface">
                التعليق *
              </label>
              <textarea
                value={formData.comment}
                onChange={(e) =>
                  setFormData({ ...formData, comment: e.target.value })
                }
                required
                rows={5}
                className="w-full px-4 py-3 bg-surface border border-outline rounded-xl focus:outline-none focus:border-primary focus:border-2 resize-none"
                placeholder="اكتب تعليقك هنا..."
              />
            </div>

            {/* Images */}
            <div>
              <label className="block mb-2 md-typescale-label-large text-on-surface">
                الصور (اختياري)
              </label>
              <div className="flex items-center gap-4">
                <label
                  htmlFor="review-images"
                  className={`md-outlined-button flex items-center gap-2 cursor-pointer ${
                    uploading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {uploading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                  ) : (
                    <Upload className="h-5 w-5" />
                  )}
                  رفع صور
                </label>
                <input
                  id="review-images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </div>

              {/* Image Preview */}
              {formData.images.length > 0 && (
                <div className="flex flex-wrap gap-4 mt-4">
                  {formData.images.map((image, index) => (
                    <div
                      key={index}
                      className="relative w-24 h-24 rounded-xl overflow-hidden shadow-lg"
                    >
                      <img
                        src={image}
                        alt={`Review ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-error text-error-on rounded-full p-1 text-xs"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-4 pt-4 border-t border-outline-variant">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="md-text-button"
              >
                إلغاء
              </motion.button>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={submitting || uploading}
                className="md-filled-button"
              >
                {submitting ? "جاري الإرسال..." : "إضافة التقييم"}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

