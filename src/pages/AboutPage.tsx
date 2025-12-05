import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

export default function AboutPage() {
  const [settings, setSettings] = useState({
    siteNameAr: "فالنتينو للشوكولاتة",
    aboutUsAr: "",
    phone: "094-0234000",
    email: "info@valentino-chocolate.com",
    addressAr: "نوفليين، طرابلس، ليبيا",
    facebook: "",
    instagram: "",
    twitter: "",
    youtube: "",
    tiktok: "",
    linkedin: "",
    whatsapp: "",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "general"));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setSettings({
            siteNameAr: data.siteNameAr || settings.siteNameAr,
            aboutUsAr: data.aboutUsAr || "",
            phone: data.phone || settings.phone,
            email: data.email || settings.email,
            addressAr: data.addressAr || settings.addressAr,
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
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, []);

  const socialLinks = [
    { icon: Facebook, url: settings.facebook, label: "فيسبوك", color: "bg-blue-600" },
    { icon: Instagram, url: settings.instagram, label: "إنستجرام", color: "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600" },
    { icon: Twitter, url: settings.twitter, label: "تويتر", color: "bg-blue-400" },
    { icon: Youtube, url: settings.youtube, label: "يوتيوب", color: "bg-red-600" },
    { icon: Linkedin, url: settings.linkedin, label: "لينكد إن", color: "bg-blue-700" },
  ].filter((link) => link.url);

  const whatsappUrl = settings.whatsapp 
    ? settings.whatsapp.startsWith('http') 
      ? settings.whatsapp 
      : `https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`
    : null;

  return (
    <div className="min-h-screen py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="flex justify-center mb-8">
            <img
              src="/LOGO TRANS@4x.png"
              alt="Valentino Chocolate Logo"
              className="h-24 md:h-32 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/LOGO SVG.svg";
              }}
            />
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-primary mb-8 tracking-tight">
            من نحن
          </h1>
          <div className="w-32 h-1.5 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto"></div>
        </motion.div>

        <div className="space-y-12">
          {/* About Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="md-elevated-card p-8"
          >
            {settings.aboutUsAr ? (
              <div className="prose prose-lg max-w-none">
                <p className="text-xl md:text-2xl text-on-surface-variant leading-relaxed whitespace-pre-line">
                  {settings.aboutUsAr}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-xl md:text-2xl text-on-surface-variant leading-relaxed">
                  نحن وجهتك المثالية للحصول على أجود أنواع الشوكولاتة الفاخرة في
                  ليبيا. نقدم مجموعة متنوعة من الشوكولاتة المستوردة والمحلية بأعلى
                  معايير الجودة.
                </p>
                <p className="text-xl md:text-2xl text-on-surface-variant leading-relaxed">
                  نسعى دائماً لإسعاد عملائنا بتقديم منتجات استثنائية وخدمة مميزة،
                  ونحرص على أن تكون تجربة التسوق لدينا فريدة ومميزة.
                </p>
              </div>
            )}
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="md-elevated-card p-8"
          >
            <h2 className="md-typescale-headline-medium text-on-surface mb-6">
              معلومات التواصل
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary rounded-m3">
                  <Phone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="md-typescale-label-medium text-on-surface-variant">
                    الهاتف
                  </p>
                  <a
                    href={`tel:${settings.phone}`}
                    className="md-typescale-title-medium text-primary hover:underline"
                    dir="ltr"
                  >
                    {settings.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary rounded-m3">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="md-typescale-label-medium text-on-surface-variant">
                    البريد الإلكتروني
                  </p>
                  <a
                    href={`mailto:${settings.email}`}
                    className="md-typescale-title-medium text-primary hover:underline"
                  >
                    {settings.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary rounded-m3">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="md-typescale-label-medium text-on-surface-variant">
                    العنوان
                  </p>
                  <p className="md-typescale-title-medium text-on-surface">
                    {settings.addressAr}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Social Media */}
          {(socialLinks.length > 0 || whatsappUrl) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <h2 className="md-typescale-headline-medium text-on-surface mb-8">
                تابعنا على وسائل التواصل الاجتماعي
              </h2>
              <div className="flex justify-center items-center gap-6 flex-wrap">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.label}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.15, y: -8, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-4 ${social.color} rounded-2xl shadow-2xl hover:shadow-lg transition-all`}
                    aria-label={social.label}
                  >
                    <social.icon className="h-8 w-8 text-white" />
                  </motion.a>
                ))}
                {whatsappUrl && (
                  <motion.a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.15, y: -8, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-4 bg-green-500 rounded-2xl shadow-2xl hover:shadow-lg transition-all"
                    aria-label="واتساب"
                  >
                    <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                  </motion.a>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

