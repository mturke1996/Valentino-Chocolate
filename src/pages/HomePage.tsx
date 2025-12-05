import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { Product, Category, Review } from "../types";
import Hero from "../components/Hero";
import ProductCard from "../components/ProductCard";
import { formatDateTime } from "../utils/formatters";
import { notifyNewMessage } from "../utils/telegramNotifications";
import toast from "react-hot-toast";
import MaterialRipple from "../components/MaterialRipple";
import AddReviewModal from "../components/AddReviewModal";

export default function HomePage() {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<(Review & { productName?: string; productNameAr?: string })[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [socialSettings, setSocialSettings] = useState({
    facebook: "",
    instagram: "",
    twitter: "",
    youtube: "",
    tiktok: "",
    linkedin: "",
    whatsapp: "",
  });
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submittingMessage, setSubmittingMessage] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProductForReview, setSelectedProductForReview] =
    useState<Product | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch All Products
        const productsQuery = query(
          collection(db, "products"),
          where("inStock", "==", true),
          orderBy("createdAt", "desc"),
          limit(12)
        );
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];

        setFeaturedProducts(productsData);

        // Fetch Categories
        const categoriesQuery = query(
          collection(db, "categories"),
          orderBy("order", "asc"),
          limit(6)
        );
        const categoriesSnapshot = await getDocs(categoriesQuery);
        const categoriesData = categoriesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Category[];
        setCategories(categoriesData);

        // Fetch Reviews - Fetch all and sort client-side to avoid index requirement
        try {
          console.log("Fetching reviews...");
          const reviewsQuery = query(collection(db, "reviews"));
          const reviewsSnapshot = await getDocs(reviewsQuery);
          const allReviewsData = reviewsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Review[];
          
          console.log(`Total reviews fetched: ${allReviewsData.length}`);
          
          // Fetch product names for each review
          const allReviews = await Promise.all(
            allReviewsData.map(async (review) => {
              let productName = "";
              let productNameAr = "";
              if (review.productId) {
                try {
                  const productDoc = await getDoc(doc(db, "products", review.productId));
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
                ...review,
                productName,
                productNameAr,
              };
            })
          );
          
          // Sort by createdAt client-side (newest first)
          const sortedReviews = allReviews.sort((a, b) => {
            try {
              const aTime = a.createdAt?.toDate?.()?.getTime() || 
                           (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0) ||
                           (typeof a.createdAt === 'number' ? a.createdAt : 0);
              const bTime = b.createdAt?.toDate?.()?.getTime() || 
                           (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0) ||
                           (typeof b.createdAt === 'number' ? b.createdAt : 0);
              return bTime - aTime;
            } catch (e) {
              return 0;
            }
          });
          
          // Filter verified reviews and take first 6
          const verifiedReviews = sortedReviews
            .filter((review) => {
              // Check if verified is explicitly true
              return review.verified === true;
            })
            .slice(0, 6);
          
          console.log(`Verified reviews: ${verifiedReviews.length}`, verifiedReviews);
          
          if (verifiedReviews.length > 0) {
            setReviews(verifiedReviews);
          } else {
            console.warn("No verified reviews found. Showing all reviews instead.");
            // If no verified reviews, show all reviews (first 6)
            setReviews(sortedReviews.slice(0, 6));
          }
        } catch (error: any) {
          console.error("Error fetching reviews:", error);
          setReviews([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();

    // Fetch social media settings
    const fetchSocialSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "general"));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setSocialSettings({
            facebook: data.facebook || "",
            instagram: data.instagram || "",
            twitter: data.twitter || "",
            youtube: data.youtube || "",
            tiktok: data.tiktok || "",
            linkedin: data.linkedin || "",
            whatsapp: data.whatsapp || "",
          });
        }
      } catch (error) {
        console.error("Error fetching social settings:", error);
      }
    };

    fetchSocialSettings();
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingMessage(true);

    try {
      const messageData = {
        name: contactForm.name,
        email: contactForm.email || "",
        phone: contactForm.phone || "",
        message: contactForm.message,
        status: "new" as const,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "messages"), messageData);

      // Send Telegram notification
      await notifyNewMessage({ id: docRef.id, ...messageData } as any);

      toast.success("تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.");
      setContactForm({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("حدث خطأ أثناء إرسال الرسالة");
    } finally {
      setSubmittingMessage(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Hero />

      {/* About Section */}
      <section className="py-32 bg-gradient-to-b from-white to-primary-container/5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-block mb-8"
            >
              <span className="text-6xl">🍫</span>
            </motion.div>
            <h2
              className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-primary mb-8 tracking-tight"
              style={{ fontFamily: "Cairo, Tajawal, sans-serif" }}
            >
              من نحن
            </h2>
            <div className="w-32 h-1.5 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-12"></div>

            <div className="space-y-8 mb-16">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-xl md:text-2xl text-on-surface-variant leading-relaxed font-light"
                style={{ fontFamily: "Cairo, Tajawal, sans-serif" }}
              >
                نحن وجهتك المثالية للحصول على أجود أنواع الشوكولاتة الفاخرة في
                ليبيا. نقدم مجموعة متنوعة من الشوكولاتة المستوردة والمحلية بأعلى
                معايير الجودة.
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="text-xl md:text-2xl text-on-surface-variant leading-relaxed font-light"
                style={{ fontFamily: "Cairo, Tajawal, sans-serif" }}
              >
                نسعى دائماً لإسعاد عملائنا بتقديم منتجات استثنائية وخدمة مميزة،
                ونحرص على أن تكون تجربة التسوق لدينا فريدة ومميزة.
              </motion.p>
            </div>

            {/* Social Media Icons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="flex justify-center items-center gap-8 flex-wrap"
            >
              {socialSettings.facebook && (
                <motion.a
                  href={socialSettings.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.15, y: -8, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="group flex flex-col items-center gap-3 text-primary transition-all"
                  style={{ fontFamily: "Cairo, Tajawal, sans-serif" }}
                >
                  <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:shadow-blue-600/50 transition-all duration-300 transform group-hover:rotate-12">
                    <svg
                      className="w-10 h-10 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </div>
                  <span className="text-lg font-bold group-hover:text-primary-container transition-colors">
                    فيسبوك
                  </span>
                </motion.a>
              )}

              {socialSettings.instagram && (
                <motion.a
                  href={socialSettings.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.15, y: -8, rotate: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="group flex flex-col items-center gap-3 text-primary transition-all"
                  style={{ fontFamily: "Cairo, Tajawal, sans-serif" }}
                >
                  <div className="w-20 h-20 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:shadow-pink-500/50 transition-all duration-300 transform group-hover:rotate-12">
                    <svg
                      className="w-10 h-10 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </div>
                  <span className="text-lg font-bold group-hover:text-primary-container transition-colors">
                    إنستجرام
                  </span>
                </motion.a>
              )}

              {socialSettings.whatsapp && (
                <motion.a
                  href={socialSettings.whatsapp.startsWith('http') ? socialSettings.whatsapp : `https://wa.me/${socialSettings.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.15, y: -8, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="group flex flex-col items-center gap-3 text-primary transition-all"
                  style={{ fontFamily: "Cairo, Tajawal, sans-serif" }}
                >
                  <div className="w-20 h-20 bg-green-500 rounded-2xl flex items-center justify-center shadow-2xl group-hover:shadow-green-500/50 transition-all duration-300 transform group-hover:rotate-12">
                    <svg
                      className="w-10 h-10 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                  </div>
                  <span className="text-lg font-bold group-hover:text-primary-container transition-colors">
                    واتساب
                  </span>
                </motion.a>
              )}

              {socialSettings.twitter && (
                <motion.a
                  href={socialSettings.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.15, y: -8, rotate: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="group flex flex-col items-center gap-3 text-primary transition-all"
                  style={{ fontFamily: "Cairo, Tajawal, sans-serif" }}
                >
                  <div className="w-20 h-20 bg-blue-400 rounded-2xl flex items-center justify-center shadow-2xl group-hover:shadow-blue-400/50 transition-all duration-300 transform group-hover:rotate-12">
                    <svg
                      className="w-10 h-10 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                  </div>
                  <span className="text-lg font-bold group-hover:text-primary-container transition-colors">
                    تويتر
                  </span>
                </motion.a>
              )}

              {socialSettings.youtube && (
                <motion.a
                  href={socialSettings.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.15, y: -8, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="group flex flex-col items-center gap-3 text-primary transition-all"
                  style={{ fontFamily: "Cairo, Tajawal, sans-serif" }}
                >
                  <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:shadow-red-600/50 transition-all duration-300 transform group-hover:rotate-12">
                    <svg
                      className="w-10 h-10 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </div>
                  <span className="text-lg font-bold group-hover:text-primary-container transition-colors">
                    يوتيوب
                  </span>
                </motion.a>
              )}

              {socialSettings.tiktok && (
                <motion.a
                  href={socialSettings.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.15, y: -8, rotate: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="group flex flex-col items-center gap-3 text-primary transition-all"
                  style={{ fontFamily: "Cairo, Tajawal, sans-serif" }}
                >
                  <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center shadow-2xl group-hover:shadow-black/50 transition-all duration-300 transform group-hover:rotate-12">
                    <svg
                      className="w-10 h-10 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.1 6.1 0 0 0-1-.05A6.34 6.34 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                    </svg>
                  </div>
                  <span className="text-lg font-bold group-hover:text-primary-container transition-colors">
                    تيك توك
                  </span>
                </motion.a>
              )}

              {socialSettings.linkedin && (
                <motion.a
                  href={socialSettings.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.15, y: -8, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="group flex flex-col items-center gap-3 text-primary transition-all"
                  style={{ fontFamily: "Cairo, Tajawal, sans-serif" }}
                >
                  <div className="w-20 h-20 bg-blue-700 rounded-2xl flex items-center justify-center shadow-2xl group-hover:shadow-blue-700/50 transition-all duration-300 transform group-hover:rotate-12">
                    <svg
                      className="w-10 h-10 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </div>
                  <span className="text-lg font-bold group-hover:text-primary-container transition-colors">
                    لينكد إن
                  </span>
                </motion.a>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Categories Section - Compact & Scrollable */}
      {categories.length > 0 && (
        <section className="py-8 sm:py-12 bg-gradient-to-b from-white via-surface-variant/20 to-white relative overflow-hidden">
          {/* Background Decoration */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="absolute top-10 right-10 w-64 h-64 bg-primary rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 left-10 w-80 h-80 bg-secondary rounded-full blur-3xl"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-6"
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-on-background mb-2">
                تصفح حسب الفئة
              </h2>
              <p className="text-sm sm:text-base text-on-surface-variant">
                اكتشف مجموعتنا المتنوعة من الشوكولاتة الفاخرة
              </p>
            </motion.div>

            {/* Scrollable Categories - Compact Design */}
            <div className="relative mb-6">
              {/* Gradient Overlays for Scroll Indication */}
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
              <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>

              <div className="overflow-x-auto scrollbar-hide pb-3 -mx-4 px-4 scroll-smooth">
                <div className="flex gap-2.5 min-w-max">
                  {categories.map((category, index) => (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        delay: index * 0.05,
                        type: "spring",
                        stiffness: 200,
                      }}
                      whileHover={{ scale: 1.08, y: -6 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link to={`/products?category=${category.id}`}>
                        <MaterialRipple>
                          <div className="flex flex-col items-center gap-1.5 px-3 py-2.5 bg-surface border border-outline-variant/50 rounded-xl min-w-[80px] sm:min-w-[90px] hover:bg-primary-container hover:border-primary hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden">
                            {/* Hover Effect Background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary-container/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            {/* Icon/Image */}
                            <div className="relative z-10 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-primary-container/20 group-hover:bg-primary-container flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                              {category.image ? (
                                <img
                                  src={category.image}
                                  alt={category.nameAr}
                                  className="w-8 h-8 sm:w-9 sm:h-9 object-cover rounded-full"
                                />
                              ) : (
                                <span className="material-symbols-rounded text-primary text-xl sm:text-2xl group-hover:text-on-primary-container transition-colors">
                                  category
                                </span>
                              )}
                            </div>

                            {/* Name */}
                            <h3 className="relative z-10 text-xs sm:text-sm text-on-surface text-center font-medium line-clamp-1 group-hover:text-on-primary-container transition-colors">
                              {category.nameAr}
                            </h3>

                            {/* Products Count Badge */}
                            {category.productsCount && (
                              <span className="relative z-10 px-1.5 py-0.5 bg-surface-variant group-hover:bg-on-primary-container/20 text-on-surface-variant group-hover:text-on-primary-container text-[10px] rounded-full transition-colors">
                                {category.productsCount}
                              </span>
                            )}
                          </div>
                        </MaterialRipple>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Search Bar - Enhanced */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="max-w-2xl mx-auto"
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    navigate(
                      `/products?search=${encodeURIComponent(
                        searchQuery.trim()
                      )}`
                    );
                  }
                }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-surface border-2 border-outline-variant rounded-full overflow-hidden shadow-sm hover:shadow-md transition-all group-hover:border-primary">
                  <span className="material-symbols-rounded absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl pointer-events-none group-hover:text-primary transition-colors">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="ابحث عن منتج، فئة، أو وصف..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-12 pl-4 py-3 sm:py-3.5 bg-transparent text-sm sm:text-base text-on-surface focus:outline-none placeholder:text-on-surface-variant"
                    style={{
                      borderRadius: "var(--md-sys-shape-corner-extra-large)",
                    }}
                  />
                  {searchQuery && (
                    <MaterialRipple>
                      <button
                        type="submit"
                        className="absolute left-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary text-on-primary rounded-full text-xs sm:text-sm font-medium transition-all hover:shadow-lg hover:scale-105 active:scale-95"
                        style={{
                          borderRadius:
                            "var(--md-sys-shape-corner-extra-large)",
                        }}
                      >
                        بحث
                      </button>
                    </MaterialRipple>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        </section>
      )}

      {/* All Products */}
      <section id="products" className="py-16 bg-white scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="md-typescale-display-small text-on-background mb-4">
              منتجاتنا
            </h2>
            <p className="md-typescale-body-large text-on-surface-variant max-w-2xl mx-auto">
              اكتشف مجموعتنا المميزة من الشوكولاتة الفاخرة
            </p>
          </motion.div>

          {featuredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mt-12"
              >
                  <Link to="/products">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="md-filled-button px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base"
                    style={{ minHeight: '48px' }}
                  >
                    <span className="flex items-center gap-2">
                      <span>عرض جميع المنتجات</span>
                      <span className="material-symbols-rounded text-lg sm:text-xl">
                        arrow_back
                      </span>
                    </span>
                  </motion.button>
                </Link>
              </motion.div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="mb-4">
                <span className="text-6xl">📦</span>
              </div>
              <h3 className="md-typescale-headline-medium text-on-surface mb-2">
                لا توجد منتجات حالياً
              </h3>
              <p className="md-typescale-body-medium text-on-surface-variant">
                يرجى إضافة منتجات من لوحة التحكم
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Reviews Section - Always show */}
      <section className="py-24 bg-primary-container/10" id="reviews">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2
              className="text-4xl md:text-5xl font-bold text-primary mb-6"
              style={{ fontFamily: "Cairo, Tajawal, sans-serif" }}
            >
              آراء عملائنا
            </h2>
            <div className="w-32 h-1 bg-primary mx-auto mb-6"></div>
            <p
              className="text-lg md:text-xl text-on-surface-variant mb-6"
              style={{ fontFamily: "Cairo, Tajawal, sans-serif" }}
            >
              ماذا يقول عملاؤنا عن منتجاتنا وخدماتنا
            </p>
            {/* Add Review Button */}
            {featuredProducts.length > 0 && (
              <MaterialRipple>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedProductForReview(featuredProducts[0]);
                    setShowReviewModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all text-sm sm:text-base transform hover:scale-105 active:scale-95"
                  style={{
                    borderRadius: "var(--md-sys-shape-corner-extra-large)",
                    minHeight: '48px'
                  }}
                >
                  <span className="material-symbols-rounded text-xl sm:text-2xl">rate_review</span>
                  <span>أضف تقييمك</span>
                </motion.button>
              </MaterialRipple>
            )}
          </motion.div>

          {reviews && reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {reviews.map((review, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-outline-variant/20"
                  style={{ fontFamily: "Cairo, Tajawal, sans-serif" }}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-primary to-primary-container rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg flex-shrink-0">
                      {review.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg sm:text-xl text-primary mb-1 truncate">
                        {review.userName}
                      </h3>
                      <p className="text-xs sm:text-sm text-on-surface-variant">
                        {review.createdAt && formatDateTime(review.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Product Review Info */}
                  {review.productId && (review.productName || review.productNameAr) ? (
                    <div className="mb-3 p-3 bg-primary-container/10 rounded-lg border-r-4 border-primary">
                      <p className="text-xs sm:text-sm text-on-surface-variant mb-1">
                        تم تقييم منتج:
                      </p>
                      <p className="text-sm sm:text-base font-semibold text-primary">
                        {review.productNameAr || review.productName}
                      </p>
                    </div>
                  ) : (
                    <div className="mb-3 p-3 bg-surface-variant/20 rounded-lg border-r-4 border-surface-variant">
                      <p className="text-xs sm:text-sm text-on-surface-variant">
                        تقييم عام للموقع
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors ${
                            i < review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "fill-gray-300 text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm sm:text-base font-semibold text-on-surface">
                      {review.rating ? review.rating.toFixed(1) : "0.0"}
                    </span>
                  </div>
                  
                  <p className="text-on-surface-variant leading-relaxed text-base sm:text-lg mb-6 line-clamp-4">
                    {review.comment}
                  </p>

                  {/* Reply from Store */}
                  {(review as any).reply && (
                    <div className="bg-primary-container/20 p-5 rounded-xl border-r-4 border-primary">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            ف
                          </span>
                        </div>
                        <span className="font-bold text-primary">الموقع</span>
                      </div>
                      <p className="text-on-surface-variant leading-relaxed text-base pr-4">
                        {(review as any).reply}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="mb-4">
                <span className="text-6xl">⭐</span>
              </div>
              <h3 className="md-typescale-headline-medium text-on-surface mb-2">
                لا توجد تقييمات حالياً
              </h3>
              <p className="md-typescale-body-medium text-on-surface-variant">
                كن أول من يقيم منتجاتنا!
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4">
              تواصل معنا
            </h2>
            <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
            <p className="text-lg text-on-surface-variant">
              نحن هنا للإجابة على جميع استفساراتكم
            </p>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto bg-gradient-to-br from-surface via-surface-variant/30 to-surface p-8 sm:p-10 rounded-2xl shadow-2xl border border-outline-variant/50"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-container rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="material-symbols-rounded text-primary-on text-3xl">
                  mail
                </span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-primary mb-2">
                أرسل رسالة
              </h3>
              <p className="text-on-surface-variant">
                سنرد عليك في أقرب وقت ممكن
              </p>
            </div>
            <form onSubmit={handleContactSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">
                    الاسم *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, name: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant focus:border-primary focus:outline-none transition-all bg-surface"
                    placeholder="أدخل اسمك"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    value={contactForm.phone}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant focus:border-primary focus:outline-none transition-all bg-surface"
                    placeholder="094-0000000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, email: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant focus:border-primary focus:outline-none transition-all bg-surface"
                  placeholder="example@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">
                  الرسالة *
                </label>
                <textarea
                  rows={5}
                  required
                  value={contactForm.message}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, message: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant focus:border-primary focus:outline-none transition-all resize-none bg-surface"
                  placeholder="اكتب رسالتك هنا..."
                ></textarea>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submittingMessage}
                className="w-full bg-gradient-to-r from-primary to-primary-container hover:from-primary-container hover:to-primary text-white py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ minHeight: '48px' }}
              >
                {submittingMessage ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>جاري الإرسال...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-rounded">send</span>
                    <span>إرسال الرسالة</span>
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Add Review Modal */}
      {selectedProductForReview && (
        <AddReviewModal
          product={selectedProductForReview}
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedProductForReview(null);
          }}
          onSuccess={() => {
            // Refresh reviews after adding new one
            const fetchReviews = async () => {
              try {
                const reviewsQuery = query(collection(db, "reviews"));
                const reviewsSnapshot = await getDocs(reviewsQuery);
                const allReviewsData = reviewsSnapshot.docs.map((doc) => ({
                  id: doc.id,
                  ...doc.data(),
                })) as Review[];
                
                // Fetch product names for each review
                const allReviews = await Promise.all(
                  allReviewsData.map(async (review) => {
                    let productName = "";
                    let productNameAr = "";
                    if (review.productId) {
                      try {
                        const productDoc = await getDoc(doc(db, "products", review.productId));
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
                      ...review,
                      productName,
                      productNameAr,
                    };
                  })
                );
                
                const sortedReviews = allReviews.sort((a, b) => {
                  try {
                    const aTime = a.createdAt?.toDate?.()?.getTime() || 
                                 (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0) ||
                                 (typeof a.createdAt === 'number' ? a.createdAt : 0);
                    const bTime = b.createdAt?.toDate?.()?.getTime() || 
                                 (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0) ||
                                 (typeof b.createdAt === 'number' ? b.createdAt : 0);
                    return bTime - aTime;
                  } catch (e) {
                    return 0;
                  }
                });
                
                const verifiedReviews = sortedReviews
                  .filter((review) => review.verified === true)
                  .slice(0, 6);
                
                if (verifiedReviews.length > 0) {
                  setReviews(verifiedReviews);
                } else {
                  setReviews(sortedReviews.slice(0, 6));
                }
              } catch (error) {
                console.error("Error fetching reviews:", error);
              }
            };
            fetchReviews();
          }}
        />
      )}
    </div>
  );
}
