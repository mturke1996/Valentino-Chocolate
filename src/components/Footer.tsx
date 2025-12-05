import { Link } from "react-router-dom";
import {
  Facebook,
  Instagram,
  Twitter,
  Phone,
  Mail,
  MapPin,
  Youtube,
  Linkedin,
} from "lucide-react";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { motion } from "framer-motion";

export default function Footer() {
  const [settings, setSettings] = useState({
    siteName: "فالنتينو للشوكولاتة",
    phone: "094-0234000",
    email: "info@valentino-chocolate.com",
    address: "نوفليين، طرابلس، ليبيا",
    facebook: "https://www.facebook.com/share/1BUEmW1e2k/",
    instagram: "https://www.instagram.com/valentino_libya",
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
            siteName: data.siteNameAr || "",
            phone: data.phone || settings.phone,
            email: data.email || settings.email,
            address: data.addressAr || settings.address,
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

  const footerLinks = [
    { name: "الرئيسية", path: "/" },
    { name: "المنتجات", path: "/products" },
    { name: "من نحن", path: "/about" },
    { name: "اتصل بنا", path: "/contact" },
    { name: "سياسة الخصوصية", path: "/privacy" },
    { name: "الشروط والأحكام", path: "/terms" },
  ];

  const socialLinks = [
    { icon: Facebook, url: settings.facebook, label: "فيسبوك", color: "bg-blue-600" },
    { icon: Instagram, url: settings.instagram, label: "إنستجرام", color: "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600" },
    { icon: Twitter, url: settings.twitter, label: "تويتر", color: "bg-blue-400" },
    { icon: Youtube, url: settings.youtube, label: "يوتيوب", color: "bg-red-600" },
    { icon: Linkedin, url: settings.linkedin, label: "لينكد إن", color: "bg-blue-700" },
  ].filter((link) => link.url);

  // WhatsApp link
  const whatsappUrl = settings.whatsapp 
    ? settings.whatsapp.startsWith('http') 
      ? settings.whatsapp 
      : `https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`
    : null;

  return (
    <footer className="bg-surface border-t border-outline-variant mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand & Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className="flex items-center justify-center md:justify-start">
              <img
                src="/LOGO TRANS@4x.png"
                alt="Logo"
                className="h-20 w-auto object-contain"
                onError={(e) => {
                  // Fallback to SVG if PNG fails
                  (e.target as HTMLImageElement).src = "/LOGO SVG.svg";
                }}
              />
              </div>
            <p className="md-typescale-body-medium text-on-surface-variant text-center md:text-right">
              نقدم لكم أجود أنواع الشوكولاتة المستوردة والمحلية بأفضل الأسعار.
              تمتع بتجربة تسوق فريدة واستمتع بطعم الشوكولاتة الفاخرة.
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <h4 className="md-typescale-title-medium text-on-surface">
              روابط سريعة
            </h4>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="md-typescale-body-medium text-on-surface-variant hover:text-primary transition-colors inline-block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h4 className="md-typescale-title-medium text-on-surface">
              معلومات التواصل
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="p-2 bg-surface-variant rounded-m3-sm">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <a
                  href={`tel:${settings.phone}`}
                  className="md-typescale-body-medium text-on-surface-variant hover:text-primary transition-colors"
                  dir="ltr"
                >
                  {settings.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <div className="p-2 bg-surface-variant rounded-m3-sm">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <a
                  href={`mailto:${settings.email}`}
                  className="md-typescale-body-medium text-on-surface-variant hover:text-primary transition-colors"
                >
                  {settings.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <div className="p-2 bg-surface-variant rounded-m3-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <span className="md-typescale-body-medium text-on-surface-variant">
                  {settings.address}
                </span>
              </li>
            </ul>
          </motion.div>

          {/* Newsletter & Social */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <h4 className="md-typescale-title-medium text-on-surface">
              تابعنا
            </h4>
            <p className="md-typescale-body-medium text-on-surface-variant">
              ابقَ على اطلاع بآخر العروض والمنتجات الجديدة
            </p>
            
            {/* Social Links */}
            {(socialLinks.length > 0 || whatsappUrl) && (
              <div className="flex gap-2 flex-wrap">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.label}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.9 }}
                    className={`p-3 ${social.color} rounded-m3 hover:shadow-lg transition-all ripple`}
                    aria-label={social.label}
                  >
                    <social.icon className="h-5 w-5 text-white" />
                  </motion.a>
                ))}
                {whatsappUrl && (
                  <motion.a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-3 bg-green-500 rounded-m3 hover:shadow-lg transition-all ripple"
                    aria-label="واتساب"
                  >
                    <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                  </motion.a>
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 pt-8 border-t border-outline-variant"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="md-typescale-body-small text-on-surface-variant text-center md:text-right">
              © {new Date().getFullYear()} جميع الحقوق محفوظة.
            </p>
            <div className="flex items-center gap-2 md-typescale-body-small text-on-surface-variant">
              <span>صُنع بـ</span>
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-error"
              >
                ❤️
              </motion.span>
              <span>في ليبيا</span>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
