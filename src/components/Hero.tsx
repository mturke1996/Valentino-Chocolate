import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Hero Section بتصميم Material Design 3
 * 
 * مقاسات الصور الموصى بها:
 * - للكمبيوتر: 1920x800 بكسل (Landscape)
 * - للموبايل: 800x1200 بكسل (Portrait) أو استخدم نفس الصورة مع object-fit
 * - حجم الملف: أقل من 500KB لكل صورة
 * - الصيغة المفضلة: WebP أو JPG
 * 
 * يمكن رفع الصور من لوحة التحكم في قسم "الإعدادات" -> "إعدادات الصفحة الرئيسية"
 */

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroData, setHeroData] = useState({
    images: [
      "https://images.unsplash.com/photo-1511381939415-e44015466834?w=1920&q=80",
      "https://images.unsplash.com/photo-1548907040-4baa42d10919?w=1920&q=80",
      "https://images.unsplash.com/photo-1481391243133-f96216dcb5d2?w=1920&q=80",
      "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=1920&q=80",
    ],
    title: "شوكولاتة فاخرة",
    subtitle: "استمتع بأجود أنواع الشوكولاتة المستوردة والمحلية",
  });

  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "general"));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setHeroData({
            images:
              data.heroImages && data.heroImages.length > 0
              ? data.heroImages 
              : heroData.images,
            title: data.heroTitleAr || heroData.title,
            subtitle: data.heroSubtitleAr || heroData.subtitle,
          });
        }
      } catch (error) {
        console.error("Error fetching hero data:", error);
      }
    };

    fetchHeroData();
  }, []);

  useEffect(() => {
    if (heroData.images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroData.images.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [heroData.images.length]);

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Image Carousel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-black/30 z-10" />
          <img
            src={heroData.images[currentSlide]}
            alt={`شريحة ${currentSlide + 1}`}
            className="w-full h-full object-cover"
            loading="eager"
          />
        </motion.div>
      </AnimatePresence>

      {/* Indicators (if multiple images) */}
      {heroData.images.length > 1 && (
        <div className="absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 z-20 flex gap-3">
          {heroData.images.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => setCurrentSlide(index)}
              whileHover={{ scale: 1.2 }}
              className={`h-3 rounded-full transition-all ${
                index === currentSlide
                  ? "w-10 bg-white"
                  : "w-3 bg-white/50 hover:bg-white/70"
              }`}
              aria-label={`اذهب إلى الشريحة ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="relative z-20 h-full w-full flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6"
              style={{
                textShadow:
                  "2px 2px 8px rgba(0,0,0,0.7), 0 0 20px rgba(0,0,0,0.5)",
                fontFamily: "Cairo, Tajawal, sans-serif",
              }}
          >
            {heroData.title}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white mb-10 font-light"
              style={{
                textShadow:
                  "1px 1px 6px rgba(0,0,0,0.8), 0 0 15px rgba(0,0,0,0.5)",
                fontFamily: "Cairo, Tajawal, sans-serif",
              }}
          >
            {heroData.subtitle}
          </motion.p>

            {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
              className="flex justify-center"
          >
            <motion.a
                href="#products"
                whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
                className="inline-block bg-primary hover:bg-primary/90 text-white px-12 py-5 rounded-xl text-lg font-semibold shadow-2xl transition-all border-2 border-white/20 backdrop-blur-sm"
            >
                تسوق الآن
            </motion.a>
          </motion.div>
        </motion.div>
        </div>
      </div>
    </section>
  );
}
