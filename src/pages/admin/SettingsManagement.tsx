import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { SiteSettings, DiscountCode } from "../../types";
import { Settings, Save, MessageSquare, Plus, Trash2, Tag } from "lucide-react";
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
    twitter: "",
    youtube: "",
    tiktok: "",
    linkedin: "",
    deliveryFee: 50,
    currency: "LYD",
    currencyAr: "د.ل",
    discountCodes: [],
  });
  
  const [newDiscountCode, setNewDiscountCode] = useState<Partial<DiscountCode>>({
    code: "",
    discountType: "percentage",
    discountValue: 0,
    minPurchase: 0,
    maxDiscount: 0,
    validFrom: new Date(),
    validUntil: new Date(),
    active: true,
    usageLimit: 0,
    usedCount: 0,
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
              className="w-full px-4 py-2 bg-surface border border-outline rounded-m3 focus:outline-none focus:border-blue-500 focus:border-2"
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
              className="w-full px-4 py-2 bg-surface border border-outline rounded-m3 focus:outline-none focus:border-blue-500 focus:border-2"
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
              placeholder="+218XXXXXXXXX أو رابط واتساب"
              className="w-full px-4 py-2 bg-surface border border-outline rounded-m3 focus:outline-none focus:border-outline focus:border-2"
            />
          </div>

          <div>
            <label className="block mb-2 md-typescale-label-large text-on-surface">
              تويتر
            </label>
            <input
              type="url"
              name="twitter"
              value={settings.twitter || ""}
              onChange={handleChange}
              placeholder="https://twitter.com/..."
              className="w-full px-4 py-2 bg-surface border border-outline rounded-m3 focus:outline-none focus:border-outline focus:border-2"
            />
          </div>

          <div>
            <label className="block mb-2 md-typescale-label-large text-on-surface">
              يوتيوب
            </label>
            <input
              type="url"
              name="youtube"
              value={settings.youtube || ""}
              onChange={handleChange}
              placeholder="https://youtube.com/..."
              className="w-full px-4 py-2 bg-surface border border-outline rounded-m3 focus:outline-none focus:border-outline focus:border-2"
            />
          </div>

          <div>
            <label className="block mb-2 md-typescale-label-large text-on-surface">
              تيك توك
            </label>
            <input
              type="url"
              name="tiktok"
              value={settings.tiktok || ""}
              onChange={handleChange}
              placeholder="https://tiktok.com/@..."
              className="w-full px-4 py-2 bg-surface border border-outline rounded-m3 focus:outline-none focus:border-outline focus:border-2"
            />
          </div>

          <div>
            <label className="block mb-2 md-typescale-label-large text-on-surface">
              لينكد إن
            </label>
            <input
              type="url"
              name="linkedin"
              value={settings.linkedin || ""}
              onChange={handleChange}
              placeholder="https://linkedin.com/..."
              className="w-full px-4 py-2 bg-surface border border-outline rounded-m3 focus:outline-none focus:border-outline focus:border-2"
            />
          </div>
        </motion.div>

        {/* Discount Codes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="md-elevated-card p-6 space-y-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <Tag className="h-6 w-6 text-on-surface-variant" />
            <h3 className="md-typescale-headline-small text-on-surface">
              أكواد الخصم
            </h3>
          </div>

          {/* Add New Discount Code */}
          <div className="p-4 bg-surface-variant rounded-m3 space-y-4 mb-4">
            <h4 className="md-typescale-title-medium text-on-surface mb-3">
              إضافة كود خصم جديد
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 md-typescale-label-medium text-on-surface">
                  الكود *
                </label>
                <input
                  type="text"
                  value={newDiscountCode.code || ""}
                  onChange={(e) => setNewDiscountCode({ ...newDiscountCode, code: e.target.value.toUpperCase() })}
                  placeholder="SUMMER2024"
                  className="w-full px-4 py-2 bg-surface border border-outline rounded-m3 focus:outline-none focus:border-primary focus:border-2"
                />
              </div>

              <div>
                <label className="block mb-2 md-typescale-label-medium text-on-surface">
                  نوع الخصم *
                </label>
                <select
                  value={newDiscountCode.discountType || "percentage"}
                  onChange={(e) => setNewDiscountCode({ ...newDiscountCode, discountType: e.target.value as "percentage" | "fixed" })}
                  className="w-full px-4 py-2 bg-surface border border-outline rounded-m3 focus:outline-none focus:border-primary focus:border-2"
                >
                  <option value="percentage">نسبة مئوية (%)</option>
                  <option value="fixed">مبلغ ثابت (د.ل)</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 md-typescale-label-medium text-on-surface">
                  قيمة الخصم *
                </label>
                <input
                  type="number"
                  value={newDiscountCode.discountValue || 0}
                  onChange={(e) => setNewDiscountCode({ ...newDiscountCode, discountValue: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 bg-surface border border-outline rounded-m3 focus:outline-none focus:border-primary focus:border-2"
                />
              </div>

              <div>
                <label className="block mb-2 md-typescale-label-medium text-on-surface">
                  الحد الأدنى للشراء (د.ل)
                </label>
                <input
                  type="number"
                  value={newDiscountCode.minPurchase || 0}
                  onChange={(e) => setNewDiscountCode({ ...newDiscountCode, minPurchase: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 bg-surface border border-outline rounded-m3 focus:outline-none focus:border-primary focus:border-2"
                />
              </div>

              {newDiscountCode.discountType === "percentage" && (
                <div>
                  <label className="block mb-2 md-typescale-label-medium text-on-surface">
                    الحد الأقصى للخصم (د.ل)
                  </label>
                  <input
                    type="number"
                    value={newDiscountCode.maxDiscount || 0}
                    onChange={(e) => setNewDiscountCode({ ...newDiscountCode, maxDiscount: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 bg-surface border border-outline rounded-m3 focus:outline-none focus:border-primary focus:border-2"
                  />
                </div>
              )}

              <div>
                <label className="block mb-2 md-typescale-label-medium text-on-surface">
                  عدد مرات الاستخدام
                </label>
                <input
                  type="number"
                  value={newDiscountCode.usageLimit || 0}
                  onChange={(e) => setNewDiscountCode({ ...newDiscountCode, usageLimit: parseInt(e.target.value) || 0 })}
                  min="0"
                  className="w-full px-4 py-2 bg-surface border border-outline rounded-m3 focus:outline-none focus:border-primary focus:border-2"
                  placeholder="0 = غير محدود"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (!newDiscountCode.code) {
                  toast.error("يرجى إدخال كود الخصم");
                  return;
                }
                if (newDiscountCode.discountValue === 0) {
                  toast.error("يرجى إدخال قيمة الخصم");
                  return;
                }
                
                const code: DiscountCode = {
                  id: Date.now().toString(),
                  code: newDiscountCode.code,
                  discountType: newDiscountCode.discountType || "percentage",
                  discountValue: newDiscountCode.discountValue || 0,
                  minPurchase: newDiscountCode.minPurchase || 0,
                  maxDiscount: newDiscountCode.maxDiscount || 0,
                  validFrom: newDiscountCode.validFrom || new Date(),
                  validUntil: newDiscountCode.validUntil || new Date(),
                  active: true,
                  usageLimit: newDiscountCode.usageLimit || 0,
                  usedCount: 0,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                };

                const codes = settings.discountCodes || [];
                setSettings({ ...settings, discountCodes: [...codes, code] });
                setNewDiscountCode({
                  code: "",
                  discountType: "percentage",
                  discountValue: 0,
                  minPurchase: 0,
                  maxDiscount: 0,
                  validFrom: new Date(),
                  validUntil: new Date(),
                  active: true,
                  usageLimit: 0,
                  usedCount: 0,
                });
                toast.success("تم إضافة كود الخصم");
              }}
              className="w-full md-filled-button py-2 flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              إضافة كود خصم
            </motion.button>
          </div>

          {/* Existing Discount Codes */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(settings.discountCodes || []).map((code) => (
              <div
                key={code.id}
                className="p-3 bg-surface border border-outline rounded-m3 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="md-typescale-title-medium text-on-surface font-bold">
                      {code.code}
                    </span>
                    {code.active ? (
                      <span className="px-2 py-0.5 bg-primary-container text-primary rounded text-xs">
                        نشط
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-error-container text-error rounded text-xs">
                        غير نشط
                      </span>
                    )}
                  </div>
                  <div className="md-typescale-body-small text-on-surface-variant">
                    {code.discountType === "percentage"
                      ? `${code.discountValue}%`
                      : `${code.discountValue} د.ل`}
                    {code.minPurchase > 0 && ` - الحد الأدنى: ${code.minPurchase} د.ل`}
                    {code.usageLimit > 0 && ` - الاستخدام: ${code.usedCount || 0}/${code.usageLimit}`}
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    const codes = (settings.discountCodes || []).filter((c) => c.id !== code.id);
                    setSettings({ ...settings, discountCodes: codes });
                    toast.success("تم حذف كود الخصم");
                  }}
                  className="p-2 text-error hover:bg-error-container rounded-m3 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </motion.button>
              </div>
            ))}
            {(!settings.discountCodes || settings.discountCodes.length === 0) && (
              <p className="text-center py-4 md-typescale-body-medium text-on-surface-variant">
                لا توجد أكواد خصم
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
