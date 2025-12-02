import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Phone, Mail, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';

export default function Footer() {
  const [settings, setSettings] = useState({
    siteName: 'فالنتينو للشوكولاتة',
    phone: '094-0234000',
    email: 'info@valentino-chocolate.com',
    address: 'نوفليين، طرابلس، ليبيا',
    facebook: 'https://www.facebook.com/share/1BUEmW1e2k/',
    instagram: 'https://www.instagram.com/valentino_libya',
    twitter: '',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setSettings({
            siteName: data.siteNameAr || settings.siteName,
            phone: data.phone || settings.phone,
            email: data.email || settings.email,
            address: data.addressAr || settings.address,
            facebook: data.facebook || '',
            instagram: data.instagram || '',
            twitter: data.twitter || '',
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    fetchSettings();
  }, []);

  const footerLinks = [
    { name: 'الرئيسية', path: '/' },
    { name: 'المنتجات', path: '/products' },
    { name: 'من نحن', path: '/about' },
    { name: 'اتصل بنا', path: '/contact' },
    { name: 'سياسة الخصوصية', path: '/privacy' },
    { name: 'الشروط والأحكام', path: '/terms' },
  ];

  const socialLinks = [
    { icon: Facebook, url: settings.facebook, label: 'فيسبوك' },
    { icon: Instagram, url: settings.instagram, label: 'إنستجرام' },
    { icon: Twitter, url: settings.twitter, label: 'تويتر' },
  ].filter(link => link.url);

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
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center shadow-md">
                <span className="text-4xl">🍫</span>
              </div>
              <h3 className="md-typescale-title-large text-primary font-bold">
                {settings.siteName}
              </h3>
            </div>
            <p className="md-typescale-body-medium text-on-surface-variant">
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
            {socialLinks.length > 0 && (
              <div className="flex gap-2">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.label}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-3 bg-surface-variant rounded-m3 hover:bg-primary-container transition-colors ripple"
                    aria-label={social.label}
                  >
                    <social.icon className="h-5 w-5 text-primary" />
                  </motion.a>
                ))}
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
              © {new Date().getFullYear()} {settings.siteName}. جميع الحقوق محفوظة.
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

