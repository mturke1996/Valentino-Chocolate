import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { notifyContactMessage } from "../utils/telegramNotifications";
import { Phone, Mail, MapPin, Send } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import toast from "react-hot-toast";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState({
    phone: "094-0234000",
    email: "info@valentino-chocolate.com",
    addressAr: "نوفليين، طرابلس، ليبيا",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "general"));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setSettings({
            phone: data.phone || settings.phone,
            email: data.email || settings.email,
            addressAr: data.addressAr || settings.addressAr,
          });
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.message.trim()) {
      toast.error("يرجى إدخال الاسم والرسالة");
      return;
    }

    if (!formData.email.trim() && !formData.phone.trim()) {
      toast.error("يرجى إدخال البريد الإلكتروني أو رقم الهاتف");
      return;
    }

    setSubmitting(true);

    try {
      const messageData = {
        name: formData.name,
        email: formData.email || "",
        phone: formData.phone || "",
        message: formData.message,
        status: "new" as const,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "messages"), messageData);

      // Send Telegram notification
      await notifyContactMessage(
        formData.name,
        formData.email || "",
        formData.phone || "",
        formData.message
      );

      toast.success("تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.");
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("حدث خطأ أثناء إرسال الرسالة");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-6">
            <img
              src="/LOGO TRANS@4x.png"
              alt="Valentino Chocolate Logo"
              className="h-20 md:h-28 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/LOGO SVG.svg";
              }}
            />
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-primary mb-4">
            اتصل بنا
          </h1>
          <p className="text-xl text-on-surface-variant">
            نحن هنا للإجابة على جميع استفساراتك
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="md-elevated-card p-8"
          >
            <h2 className="md-typescale-headline-small text-on-surface mb-6">
              أرسل لنا رسالة
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block mb-2 md-typescale-label-large text-on-surface">
                  الاسم الكامل *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-surface border border-outline rounded-m3 md-typescale-body-medium text-on-surface focus:outline-none focus:border-primary focus:border-2"
                  placeholder="أدخل اسمك الكامل"
                />
              </div>

              <div>
                <label className="block mb-2 md-typescale-label-large text-on-surface">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-surface border border-outline rounded-m3 md-typescale-body-medium text-on-surface focus:outline-none focus:border-primary focus:border-2"
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <label className="block mb-2 md-typescale-label-large text-on-surface">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-surface border border-outline rounded-m3 md-typescale-body-medium text-on-surface focus:outline-none focus:border-primary focus:border-2"
                  placeholder="01XXXXXXXXX"
                />
              </div>

              <div>
                <label className="block mb-2 md-typescale-label-large text-on-surface">
                  الرسالة *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 bg-surface border border-outline rounded-m3 md-typescale-body-medium text-on-surface focus:outline-none focus:border-primary focus:border-2 resize-none"
                  placeholder="اكتب رسالتك هنا..."
                />
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={submitting}
                className="w-full md-filled-button py-4 shadow-m3-2 hover:shadow-m3-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-5 w-5 border-2 border-primary-on border-t-transparent"></span>
                    <span>جاري الإرسال...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Send className="h-5 w-5" />
                    <span>إرسال الرسالة</span>
                  </span>
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="md-elevated-card p-8">
              <h2 className="md-typescale-headline-small text-on-surface mb-6">
                معلومات التواصل
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary rounded-m3 flex-shrink-0">
                    <Phone className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="md-typescale-label-medium text-on-surface-variant mb-1">
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

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary rounded-m3 flex-shrink-0">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="md-typescale-label-medium text-on-surface-variant mb-1">
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
                  <div className="p-3 bg-primary rounded-m3 flex-shrink-0">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="md-typescale-label-medium text-on-surface-variant mb-1">
                      العنوان
                    </p>
                    <p className="md-typescale-title-medium text-on-surface">
                      {settings.addressAr}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="md-elevated-card p-8">
              <h3 className="md-typescale-title-large text-on-surface mb-4">
                ساعات العمل
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="md-typescale-body-medium text-on-surface-variant">
                    الأحد - الخميس:
                  </span>
                  <span className="md-typescale-body-medium text-on-surface">
                    9:00 ص - 10:00 م
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="md-typescale-body-medium text-on-surface-variant">
                    الجمعة - السبت:
                  </span>
                  <span className="md-typescale-body-medium text-on-surface">
                    2:00 م - 10:00 م
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

