import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase";
import { Category } from "../../types";
// Icons are now using Material Symbols
import toast from "react-hot-toast";
import MaterialRipple from "../../components/MaterialRipple";

export default function CategoriesManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    nameAr: "",
    order: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const categoriesQuery = query(
        collection(db, "categories"),
        orderBy("order", "asc")
      );
      const categoriesSnapshot = await getDocs(categoriesQuery);
      const categoriesData = categoriesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[];
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("حدث خطأ أثناء تحميل الفئات");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nameAr.trim()) {
      toast.error("يرجى إدخال اسم الفئة بالعربية");
      return;
    }

    try {
      const categoryData = {
        name: formData.name || formData.nameAr,
        nameAr: formData.nameAr,
        order: formData.order || categories.length,
        updatedAt: serverTimestamp(),
      };

      if (editingCategory) {
        await updateDoc(
          doc(db, "categories", editingCategory.id),
          categoryData
        );
        toast.success("تم تحديث الفئة بنجاح");
      } else {
        await addDoc(collection(db, "categories"), {
          ...categoryData,
          createdAt: serverTimestamp(),
          productsCount: 0,
        });
        toast.success("تم إضافة الفئة بنجاح");
      }

      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("حدث خطأ أثناء حفظ الفئة");
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      nameAr: category.nameAr,
      order: category.order,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الفئة؟")) return;

    try {
      await deleteDoc(doc(db, "categories", id));
      toast.success("تم حذف الفئة بنجاح");
      fetchData();
    } catch (error) {
      toast.error("حدث خطأ أثناء حذف الفئة");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      nameAr: "",
      order: categories.length,
    });
    setEditingCategory(null);
    setShowModal(false);
  };

  const filteredCategories = categories.filter(
    (category) =>
      category.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-outline-variant border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="md-typescale-headline-large text-on-background">
            إدارة الفئات
          </h2>
          <p className="md-typescale-body-medium text-on-surface-variant">
            {categories.length} فئة
          </p>
        </div>
        <MaterialRipple>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-full transition-all bg-surface-variant text-on-surface shadow-sm"
            style={{ borderRadius: "var(--md-sys-shape-corner-extra-large)" }}
          >
            <span className="material-symbols-rounded text-xl">add</span>
            <span className="md-typescale-label-large font-medium">
              إضافة فئة
            </span>
          </button>
        </MaterialRipple>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="material-symbols-rounded absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">
          search
        </span>
        <input
          type="text"
          placeholder="ابحث عن فئة..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pr-12 pl-4 py-3 bg-surface border border-outline-variant rounded-full md-typescale-body-medium text-on-surface focus:outline-none focus:border-blue-500 focus:border-2 transition-all"
          style={{ borderRadius: "var(--md-sys-shape-corner-extra-large)" }}
        />
      </div>

      {/* Categories List - Simple List View */}
      <div className="space-y-2">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-rounded text-6xl text-on-surface-variant mb-4">
              category
            </span>
            <p className="md-typescale-body-large text-on-surface-variant">
              لا توجد فئات
            </p>
          </div>
        ) : (
          filteredCategories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-surface border border-outline-variant rounded-full p-4 flex items-center justify-between group hover:bg-surface-variant transition-all"
              style={{ borderRadius: "var(--md-sys-shape-corner-extra-large)" }}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-surface-variant text-on-surface">
                  <span className="material-symbols-rounded text-xl">
                    category
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="md-typescale-title-medium text-on-surface font-medium">
                    {category.nameAr}
                  </h3>
                  {category.name && category.name !== category.nameAr && (
                    <p className="md-typescale-body-small text-on-surface-variant">
                      {category.name}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="md-typescale-body-small">
                    {category.productsCount || 0} منتج
                  </span>
                  <span className="md-typescale-body-small">•</span>
                  <span className="md-typescale-body-small">
                    ترتيب: {category.order}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <MaterialRipple>
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-2 rounded-full hover:bg-surface-variant transition-colors"
                    style={{
                      borderRadius: "var(--md-sys-shape-corner-extra-large)",
                    }}
                  >
                    <span className="material-symbols-rounded text-on-surface-variant">
                      edit
                    </span>
                  </button>
                </MaterialRipple>
                <MaterialRipple>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-2 rounded-full hover:bg-surface-variant transition-colors"
                    style={{
                      borderRadius: "var(--md-sys-shape-corner-extra-large)",
                    }}
                  >
                    <span className="material-symbols-rounded text-on-surface-variant">
                      delete
                    </span>
                  </button>
                </MaterialRipple>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={resetForm}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface rounded-3xl shadow-2xl w-full max-w-md p-6"
              style={{ borderRadius: "var(--md-sys-shape-corner-extra-large)" }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="md-typescale-headline-small text-on-surface font-semibold">
                  {editingCategory ? "تعديل الفئة" : "إضافة فئة جديدة"}
                </h3>
                <MaterialRipple>
                  <button
                    onClick={resetForm}
                    className="p-2 rounded-full hover:bg-surface-variant transition-colors"
                    style={{
                      borderRadius: "var(--md-sys-shape-corner-extra-large)",
                    }}
                  >
                    <span className="material-symbols-rounded text-on-surface">
                      close
                    </span>
                  </button>
                </MaterialRipple>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block mb-2 md-typescale-label-large text-on-surface font-medium">
                    اسم الفئة (عربي) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nameAr}
                    onChange={(e) =>
                      setFormData({ ...formData, nameAr: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-full focus:outline-none focus:border-blue-500 focus:border-2 transition-all"
                    placeholder="مثال: شوكولاتة داكنة"
                    style={{
                      borderRadius: "var(--md-sys-shape-corner-extra-large)",
                    }}
                  />
                </div>

                <div>
                  <label className="block mb-2 md-typescale-label-large text-on-surface font-medium">
                    اسم الفئة (إنجليزي)
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-full focus:outline-none focus:border-blue-500 focus:border-2 transition-all"
                    placeholder="Example: Dark Chocolate"
                    style={{
                      borderRadius: "var(--md-sys-shape-corner-extra-large)",
                    }}
                  />
                </div>

                <div>
                  <label className="block mb-2 md-typescale-label-large text-on-surface font-medium">
                    الترتيب
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        order: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-full focus:outline-none focus:border-blue-500 focus:border-2 transition-all"
                    style={{
                      borderRadius: "var(--md-sys-shape-corner-extra-large)",
                    }}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <MaterialRipple>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-3 rounded-full transition-all"
                      style={{
                        borderRadius: "var(--md-sys-shape-corner-extra-large)",
                        color: "var(--md-sys-color-primary)",
                      }}
                    >
                      <span className="md-typescale-label-large font-medium">
                        إلغاء
                      </span>
                    </button>
                  </MaterialRipple>
                  <MaterialRipple>
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-full transition-all"
                      style={{
                        backgroundColor: "var(--md-sys-color-primary)",
                        color: "var(--md-sys-color-on-primary)",
                        borderRadius: "var(--md-sys-shape-corner-extra-large)",
                        boxShadow: "var(--md-sys-elevation-1)",
                      }}
                    >
                      <span className="md-typescale-label-large font-medium">
                        {editingCategory ? "تحديث" : "إضافة"}
                      </span>
                    </button>
                  </MaterialRipple>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
