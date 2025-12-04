import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { SiteSettings } from "../../types";
import { Settings, Save, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Partial<SiteSettings>>({
    siteName: "Valentino Chocolate",
    siteNameAr: "",
    phone: "094-0234000",
    email: "info@valentino-chocolate.com",
    address: "نوفليين، طرابلس، ليبيا",
    addressAr: "نوفليين، طرابلس، ليبيا",
    facebook: "https://www.facebook.com/share/1BUEmW1e2k/",
    instagram: "https://www.instagram.com/valentino_libya",
    whatsapp: "",
    deliveryFee: 50,
    currency: "LYD",
    currencyAr: "د.ل",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, "settings", "general"));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("حدث خطأ أثناء تحميل الإعدادات");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(
        doc(db, "settings", "general"),
        {
          ...settings,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      toast.success("تم حفظ الإعدادات بنجاح");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("حدث خطأ أثناء حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setSettings({
      ...settings,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
          ? parseFloat(value) || 0
          : value,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-on-surface border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="md-typescale-headline-large text-on-background">
            الإعدادات
          </h2>
          <p className="md-typescale-body-medium text-on-surface-variant">
            إدارة إعدادات الموقع والبوت
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 py-3 px-4 bg-surface-variant text-on-surface rounded-m3 shadow-m3-2 disabled:opacity-50"
        >
          <Save className="h-5 w-5 text-on-surface" />
          {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md-elevated-card p-6 space-y-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-6 w-6 text-on-surface-variant" />
            <h3 className="md-typescale-headline-small text-on-surface">
              الإعدادات العامة
            </h3>
          </div>

          <div>
            <label className="block mb-2 md-typescale-label-large text-on-surface">
              اسم الموقع (عربي) *
            </label>
            <input
              type="text"
              name="siteNameAr"
              value={settings.siteNameAr || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-surface border border-outline rounded-m3 focus:outline-none focus:border-outline focus:border-2"
            />
          </div>

          <div>
            <label className="block mb-2 md-typescale-label-large text-on-surface">
              اسم الموقع (إنجليزي)
            </label>
            <input
              type="text"
              name="siteName"
              value={settings.siteName || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-surface border border-outline rounded-m3 focus:outline-none focus:border-outline focus:border-2"
            />
          </div>

          <div>
            <label className="block mb-2 md-typescale-label-large text-on-surface">
              الهاتف *
            </label>
            <input
              type="tel"
              name="phone"
              value={settings.phone || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-surface border border-outline rounded-m3 focus:outline-none focus:border-outline focus:border-2"
            />
          </div>

          <div>
            <label className="block mb-2 md-typescale-label-large text-on-surface">
              البريد الإلكتروني *
            </label>
            <input
              type="email"
              name="email"
              value={settings.email || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-surface border border-outline rounded-m3 focus:outline-none focus:border-outline focus:border-2"
            />
          </div>

          <div>
            <label className="block mb-2 md-typescale-label-large text-on-surface">
              العنوان (عربي) *
            </label>
            <textarea
              name="addressAr"
              value={settings.addressAr || ""}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2 bg-surface border border-outline rounded-m3 focus:outline-none focus:border-primary focus:border-2"
            />
          </div>

          <div>
            <label className="block mb-2 md-typescale-label-large text-on-surface">
              رسوم التوصيل (د.ل) *
            </label>
            <input
              type="number"
              name="deliveryFee"
              value={settings.deliveryFee || 0}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full px-4 py-2 bg-surface border border-outline rounded-m3 focus:outline-none focus:border-primary focus:border-2"
            />
          </div>
        </motion.div>

        {/* Social Media */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md-elevated-card p-6 space-y-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-6 w-6 text-on-surface-variant" />
            <h3 className="md-typescale-headline-small text-on-surface">
              وسائل التواصل الاجتماعي
            </h3>
          </div>

          <div>
            <label className="block mb-2 md-typescale-label-large text-on-surface">
              فيسبوك
            </label>
            <input
              type="url"
              name="facebook"
              value={settings.facebook || ""}
              onChange={handleChange}
              placeholder="https://facebook.com/..."
              className="w-full px-4 py-2 bg-surface border border-outline rounded-m3 focus:outline-none focus:border-outline focus:border-2"
            />
          </div>

          <div>
            <label className="block mb-2 md-typescale-label-large text-on-surface">
              إنستجرام
            </label>
            <input
              type="url"
              name="instagram"
              value={settings.instagram || ""}
              onChange={handleChange}
              placeholder="https://instagram.com/..."
              className="w-full px-4 py-2 bg-surface border border-outline rounded-m3 focus:outline-none focus:border-outline focus:border-2"
            />
          </div>

          <div>
            <label className="block mb-2 md-typescale-label-large text-on-surface">
              واتساب
            </label>
            <input
              type="text"
              name="whatsapp"
              value={settings.whatsapp || ""}
              onChange={handleChange}
              placeholder="+218XXXXXXXXX"
              className="w-full px-4 py-2 bg-surface border border-outline rounded-m3 focus:outline-none focus:border-outline focus:border-2"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
