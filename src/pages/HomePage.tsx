import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { Product, Category } from "../types";
import Hero from "../components/Hero";
import ProductCard from "../components/ProductCard";

// منتجات تجريبية مع صور شوكولاتة عالية الجودة
const demoProducts: Product[] = [
  {
    id: "2",
    name: "Dark Chocolate 70%",
    nameAr: "شوكولاتة داكنة 70%",
    description: "Rich dark chocolate with 70% cocoa",
    descriptionAr: "شوكولاتة داكنة غنية بنسبة 70% كاكاو",
    category: "dark",
    price: 55,
    images: [
      "https://images.unsplash.com/photo-1511381939415-e44015466834?w=800&q=80",
    ],
    inStock: true,
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "4",
    name: "Hazelnut Chocolate",
    nameAr: "شوكولاتة بالبندق",
    description: "Premium chocolate filled with natural hazelnut cream",
    descriptionAr: "شوكولاتة فاخرة محشوة بكريمة البندق الطبيعية",
    category: "nuts",
    price: 60,
    images: [
      "https://images.unsplash.com/photo-1548907040-4baa42d10919?w=800&q=80",
    ],
    inStock: true,
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "5",
    name: "Premium White Chocolate",
    nameAr: "شوكولاتة بيضاء فاخرة",
    description: "Smooth creamy white chocolate with wonderful taste",
    descriptionAr: "شوكولاتة بيضاء كريمية ناعمة ذات طعم رائع",
    category: "white",
    price: 50,
    images: [
      "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=800&q=80",
    ],
    inStock: true,
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "6",
    name: "Special Gift Box",
    nameAr: "علبة الهدايا الخاصة",
    description: "Luxury gift box with assorted chocolates",
    descriptionAr: "علبة هدايا فاخرة تحتوي على تشكيلة متنوعة من الشوكولاتة",
    category: "gifts",
    price: 120,
    images: [
      "https://images.unsplash.com/photo-1571506165871-ee72a35bc9d4?w=800&q=80",
    ],
    inStock: true,
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "7",
    name: "Caramel Chocolate",
    nameAr: "شوكولاتة بالكراميل",
    description: "Premium chocolate with golden caramel filling",
    descriptionAr: "شوكولاتة فاخرة بحشوة الكراميل الذهبية",
    category: "filled",
    price: 65,
    images: [
      "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=800&q=80",
    ],
    inStock: true,
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "8",
    name: "Strawberry Chocolate",
    nameAr: "شوكولاتة بالفراولة",
    description: "Milk chocolate with natural strawberry pieces",
    descriptionAr: "شوكولاتة بالحليب مع قطع الفراولة الطبيعية",
    category: "fruity",
    price: 58,
    images: [
      "https://images.unsplash.com/photo-1481391243133-f96216dcb5d2?w=800&q=80",
    ],
    inStock: true,
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] =
    useState<Product[]>(demoProducts);
  const [categories, setCategories] = useState<Category[]>([]);

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

        // استخدام المنتجات التجريبية إذا لم توجد منتجات حقيقية
        if (productsData.length > 0) {
          setFeaturedProducts(productsData);
        } else {
          setFeaturedProducts(demoProducts);
        }

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
      } catch (error) {
        console.error("Error fetching data:", error);
        // استخدام المنتجات التجريبية في حالة حدوث خطأ
        setFeaturedProducts(demoProducts);
      }
    };

    fetchData();
  }, []);

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
                فالنتينو للشوكولاتة هي وجهتك المثالية للحصول على أجود أنواع
                الشوكولاتة الفاخرة في ليبيا. نقدم مجموعة متنوعة من الشوكولاتة
                المستوردة والمحلية بأعلى معايير الجودة.
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
              <motion.a
                href="https://www.facebook.com/share/1BUEmW1e2k/"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.15, y: -8, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="group flex flex-col items-center gap-3 text-primary transition-all"
                style={{ fontFamily: "Cairo, Tajawal, sans-serif" }}
              >
                <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center shadow-2xl group-hover:shadow-primary/50 transition-all duration-300 transform group-hover:rotate-12">
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

              <motion.a
                href="https://www.instagram.com/valentino_libya"
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

              <motion.a
                href="tel:+218940234000"
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
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="md-typescale-display-small text-on-background mb-4">
                تصفح حسب الفئة
              </h2>
              <p className="md-typescale-body-large text-on-surface-variant max-w-2xl mx-auto">
                اكتشف مجموعة واسعة من الشوكولاتة الفاخرة المصنفة حسب نوعها وذوقك
              </p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category, index) => (
                <Link
                  key={category.id}
                  to={`/products?category=${category.id}`}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -8, scale: 1.05 }}
                    className="md-filled-card p-4 text-center ripple"
                  >
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.nameAr}
                        className="w-20 h-20 mx-auto mb-3 object-cover rounded-m3"
                      />
                    ) : (
                      <div className="w-20 h-20 mx-auto mb-3 bg-primary-container rounded-m3 flex items-center justify-center">
                        <span className="material-symbols-rounded text-primary text-4xl">
                          category
                        </span>
                      </div>
                    )}
                    <h3 className="md-typescale-title-small text-on-surface">
                      {category.nameAr}
                    </h3>
                    {category.productsCount && (
                      <p className="md-typescale-label-small text-on-surface-variant mt-1">
                        {category.productsCount} منتج
                      </p>
                    )}
                  </motion.div>
                </Link>
              ))}
            </div>
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
                    className="md-filled-button px-8 py-4"
                  >
                    <span className="flex items-center gap-2">
                      <span>عرض جميع المنتجات</span>
                      <span className="material-symbols-rounded">
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

      {/* Reviews Section */}
      <section className="py-24 bg-primary-container/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2
              className="text-4xl md:text-5xl font-bold text-primary mb-6"
              style={{ fontFamily: "Cairo, Tajawal, sans-serif" }}
            >
              آراء عملائنا
            </h2>
            <div className="w-32 h-1 bg-primary mx-auto mb-6"></div>
            <p
              className="text-lg md:text-xl text-on-surface-variant"
              style={{ fontFamily: "Cairo, Tajawal, sans-serif" }}
            >
              ماذا يقول عملاؤنا عن منتجاتنا وخدماتنا
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "أحمد محمد",
                rating: 5,
                comment:
                  "شوكولاتة رائعة وجودة عالية، التوصيل سريع والخدمة ممتازة. أنصح بشدة!",
                date: "منذ أسبوع",
                reply:
                  "شكراً لك على تقييمك الرائع! نحن سعداء جداً لأنك استمتعت بمنتجاتنا. نتمنى أن نراك مرة أخرى قريباً! 🍫",
              },
              {
                name: "فاطمة علي",
                rating: 5,
                comment:
                  "أفضل شوكولاتة جربتها في ليبيا، الطعم مميز والتغليف أنيق جداً",
                date: "منذ أسبوعين",
                reply:
                  "نشكرك على كلماتك الجميلة! نسعد دائماً بتقديم أفضل تجربة لعملائنا الكرام. نتمنى أن نكون دائماً عند حسن ظنكم! ❤️",
              },
              {
                name: "سارة خالد",
                rating: 5,
                comment:
                  "هدايا رائعة ومناسبة لجميع المناسبات، جودة ممتازة وأسعار مناسبة",
                date: "منذ شهر",
                reply:
                  "شكراً جزيلاً لك! نحن فخورون بأن منتجاتنا تنال إعجابك. نتمنى أن نكون خيارك الأول دائماً! 🌟",
              },
            ].map((review, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all"
                style={{ fontFamily: "Cairo, Tajawal, sans-serif" }}
              >
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {review.name.charAt(0)}
                  </div>
                  <div className="mr-4 flex-1">
                    <h3 className="font-bold text-xl text-primary mb-1">
                      {review.name}
                    </h3>
                    <p className="text-sm text-on-surface-variant">
                      {review.date}
                    </p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-500 text-2xl">
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-on-surface-variant leading-relaxed text-lg mb-6">
                  "{review.comment}"
                </p>

                {/* Reply from Store */}
                {review.reply && (
                  <div className="bg-primary-container/20 p-5 rounded-xl border-r-4 border-primary">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">ف</span>
                      </div>
                      <span className="font-bold text-primary">
                        فالنتينو للشوكولاتة
                      </span>
                    </div>
                    <p className="text-on-surface-variant leading-relaxed text-base pr-4">
                      {review.reply}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
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
            className="max-w-2xl mx-auto bg-primary-container/10 p-10 rounded-2xl shadow-xl"
          >
            <h3 className="text-2xl font-bold text-primary mb-6">أرسل رسالة</h3>
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  الاسم
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-lg border-2 border-outline-variant focus:border-primary focus:outline-none transition-colors"
                  placeholder="أدخل اسمك"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-lg border-2 border-outline-variant focus:border-primary focus:outline-none transition-colors"
                  placeholder="example@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 rounded-lg border-2 border-outline-variant focus:border-primary focus:outline-none transition-colors"
                  placeholder="094-0000000"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  الرسالة
                </label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border-2 border-outline-variant focus:border-primary focus:outline-none transition-colors resize-none"
                  placeholder="اكتب رسالتك هنا..."
                ></textarea>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-primary hover:bg-primary-container text-white py-4 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                إرسال الرسالة
              </motion.button>
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
