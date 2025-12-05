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
import { Product, Category } from "../../types";
import { formatPrice } from "../../utils/formatters";
import { Edit, Trash2, Search, X } from "lucide-react";
import toast from "react-hot-toast";
import { uploadMultipleToImgBB } from "../../utils/imgbbUpload";
import MaterialRipple from "../../components/MaterialRipple";

/**
 * صفحة إدارة المنتجات
 *
 * مقاسات الصور الموصى بها للمنتجات:
 * - المقاس: 800x800 بكسل (مربع)
 * - الحجم: أقل من 300KB لكل صورة
 * - الصيغة: WebP أو JPG
 * - يمكن رفع عدة صور لكل منتج
 */

export default function ItemsManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    nameAr: "",
    description: "",
    descriptionAr: "",
    price: "",
    category: "",
    weight: "",
    images: [] as string[],
    featured: false,
    inStock: true,
    discount: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch Products
      const productsQuery = query(
        collection(db, "products"),
        orderBy("createdAt", "desc")
      );
      const productsSnapshot = await getDocs(productsQuery);
      const productsData = productsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];
      setProducts(productsData);

      // Fetch Categories
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
      console.error("Error fetching data:", error);
      toast.error("حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.images.length === 0) {
      toast.error("يرجى رفع صورة واحدة على الأقل");
      return;
    }

    try {
      const productData = {
        name: formData.name,
        nameAr: formData.nameAr,
        description: formData.description,
        descriptionAr: formData.descriptionAr,
        price: parseFloat(formData.price),
        category: formData.category,
        weight: formData.weight,
        images: formData.images,
        featured: formData.featured,
        inStock: formData.inStock,
        discount: formData.discount ? parseFloat(formData.discount) : 0,
        updatedAt: serverTimestamp(),
      };

      if (editingProduct) {
        await updateDoc(doc(db, "products", editingProduct.id), productData);
        toast.success("تم تحديث المنتج بنجاح");
      } else {
        await addDoc(collection(db, "products"), {
          ...productData,
          createdAt: serverTimestamp(),
          rating: 0,
          reviewCount: 0,
        });
        toast.success("تم إضافة المنتج بنجاح");
      }

      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("حدث خطأ أثناء حفظ المنتج");
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      nameAr: product.nameAr,
      description: product.description,
      descriptionAr: product.descriptionAr,
      price: product.price.toString(),
      category: product.category,
      weight: product.weight || "",
      images: product.images,
      featured: product.featured,
      inStock: product.inStock,
      discount: product.discount ? product.discount.toString() : "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;

    try {
      await deleteDoc(doc(db, "products", id));
      toast.success("تم حذف المنتج بنجاح");
      fetchData();
    } catch (error) {
      toast.error("حدث خطأ أثناء حذف المنتج");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const fileArray = Array.from(files);
      const uploadedUrls = await uploadMultipleToImgBB(fileArray);

      if (uploadedUrls.length > 0) {
        setFormData({
          ...formData,
          images: [...formData.images, ...uploadedUrls],
        });
        toast.success(`تم رفع ${uploadedUrls.length} صورة بنجاح`);
      } else {
        toast.error("فشل رفع الصور");
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("حدث خطأ أثناء رفع الصور");
    } finally {
      setUploadingImages(false);
      // Reset input
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      nameAr: "",
      description: "",
      descriptionAr: "",
      price: "",
      category: "",
      weight: "",
      images: [],
      featured: false,
      inStock: true,
      discount: "",
    });
    setEditingProduct(null);
    setShowModal(false);
  };

  const filteredProducts = products.filter(
    (product) =>
      product.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
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
            إدارة المنتجات
          </h2>
          <p className="md-typescale-body-medium text-on-surface-variant">
            {products.length} منتج
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
              إضافة منتج
            </span>
          </button>
        </MaterialRipple>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant" />
        <input
          type="text"
          placeholder="ابحث عن منتج..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pr-12 pl-4 py-3 bg-surface border border-outline rounded-m3 md-typescale-body-medium text-on-surface focus:outline-none focus:border-outline-variant focus:border-2"
        />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md-elevated-card overflow-hidden group"
          >
            <div className="relative aspect-square bg-surface-variant">
              <img
                src={product.images[0]}
                alt={product.nameAr}
                className="w-full h-full object-cover"
              />
              {product.images.length > 1 && (
                <div className="absolute top-2 right-2 bg-surface/90 backdrop-blur-sm px-2 py-1 rounded-m3-sm md-typescale-label-small">
                  {product.images.length} صور
                </div>
              )}
              <div className="absolute bottom-2 right-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleEdit(product)}
                  className="flex-1 bg-surface-variant text-on-surface py-2 rounded-m3 md-typescale-label-medium ripple"
                >
                  <Edit className="h-4 w-4 inline ml-1" />
                  تعديل
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDelete(product.id)}
                  className="flex-1 bg-surface-variant text-on-surface py-2 rounded-m3 md-typescale-label-medium ripple"
                >
                  <Trash2 className="h-4 w-4 inline ml-1" />
                  حذف
                </motion.button>
              </div>
            </div>
            <div className="p-4 space-y-2">
              <h3 className="md-typescale-title-medium text-on-surface line-clamp-1">
                {product.nameAr}
              </h3>
              <p className="md-typescale-body-small text-on-surface-variant line-clamp-2">
                {product.descriptionAr}
              </p>
              <div className="flex items-center justify-between pt-2">
                <span className="md-typescale-title-medium text-on-surface">
                  {formatPrice(product.price)}
                </span>
                <span
                  className={`px-2 py-1 rounded-m3-sm md-typescale-label-small ${
                    product.inStock
                      ? "bg-blue-100 text-blue-700"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {product.inStock ? "متوفر" : "نفذ"}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={resetForm}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface rounded-m3-lg shadow-m3-5 w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="md-typescale-headline-medium text-on-surface">
                  {editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}
                </h3>
                <button
                  onClick={resetForm}
                  className="p-2 rounded-full hover:bg-surface-variant"
                >
                  <X className="h-6 w-6 text-on-surface" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 md-typescale-label-large text-on-surface">
                      الاسم (عربي) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nameAr}
                      onChange={(e) =>
                        setFormData({ ...formData, nameAr: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-surface border border-outline rounded-m3 focus:outline-none focus:border-outline-variant focus:border-2"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 md-typescale-label-large text-on-surface">
                      الاسم (إنجليزي)
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-surface border border-outline rounded-m3 focus:outline-none focus:border-outline-variant focus:border-2"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 md-typescale-label-large text-on-surface">
                      الوصف (عربي)
                    </label>
                    <textarea
                      value={formData.descriptionAr}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          descriptionAr: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-4 py-2 bg-surface border border-outline rounded-m3 focus:outline-none focus:border-outline-variant focus:border-2"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 md-typescale-label-large text-on-surface">
                      الوصف (إنجليزي)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-4 py-2 bg-surface border border-outline rounded-m3 focus:outline-none focus:border-outline-variant focus:border-2"
                    />
                  </div>
                </div>

                {/* Price & Category */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-2 md-typescale-label-large text-on-surface">
                      السعر (د.ل) *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-surface border border-outline rounded-m3 focus:outline-none focus:border-outline-variant focus:border-2"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 md-typescale-label-large text-on-surface">
                      الفئة *
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-surface border border-outline rounded-m3 focus:outline-none focus:border-outline-variant focus:border-2"
                    >
                      <option value="">اختر الفئة</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 md-typescale-label-large text-on-surface">
                      الوزن
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: 100g"
                      value={formData.weight}
                      onChange={(e) =>
                        setFormData({ ...formData, weight: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-surface border border-outline rounded-m3 focus:outline-none focus:border-blue-500 focus:border-2"
                    />
                  </div>
                </div>

                {/* Discount */}
                <div>
                  <label className="block mb-2 md-typescale-label-large text-on-surface">
                    الخصم (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.discount}
                    onChange={(e) =>
                      setFormData({ ...formData, discount: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-surface border border-outline rounded-m3 focus:outline-none focus:border-primary focus:border-2"
                  />
                </div>

                {/* Images Upload */}
                <div>
                  <label className="block mb-2 md-typescale-label-large text-on-surface">
                    الصور *
                  </label>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <MaterialRipple>
                        <label
                          className="flex items-center gap-2 px-6 py-3 rounded-full cursor-pointer transition-all bg-surface-variant text-on-surface"
                          style={{
                            opacity: uploadingImages ? 0.7 : 1,
                          }}
                        >
                          <span className="material-symbols-rounded text-xl">
                            upload
                          </span>
                          <span className="md-typescale-label-large font-medium">
                            رفع صور
                          </span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={uploadingImages}
                          />
                        </label>
                      </MaterialRipple>
                      {uploadingImages && (
                        <div className="flex items-center gap-2 text-on-surface-variant">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-outline-variant border-t-transparent"></div>
                          <span>جاري الرفع...</span>
                        </div>
                      )}
                    </div>
                    {formData.images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {formData.images.map((img, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={img}
                              alt={`صورة ${index + 1}`}
                              className="w-full aspect-square object-cover rounded-2xl"
                              style={{
                                borderRadius:
                                  "var(--md-sys-shape-corner-large)",
                              }}
                            />
                            <MaterialRipple>
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-surface-variant text-on-surface"
                                style={{
                                  borderRadius:
                                    "var(--md-sys-shape-corner-extra-large)",
                                }}
                              >
                                <span className="material-symbols-rounded text-lg">
                                  close
                                </span>
                              </button>
                            </MaterialRipple>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) =>
                        setFormData({ ...formData, featured: e.target.checked })
                      }
                      className="w-5 h-5 rounded border-outline text-on-surface focus:ring-outline-variant"
                    />
                    <span className="md-typescale-label-large text-on-surface">
                      منتج مميز
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.inStock}
                      onChange={(e) =>
                        setFormData({ ...formData, inStock: e.target.checked })
                      }
                      className="w-5 h-5 rounded border-outline text-on-surface focus:ring-outline-variant"
                    />
                    <span className="md-typescale-label-large text-on-surface">
                      متوفر
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="md-outlined-button"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="md-filled-button"
                    disabled={uploadingImages}
                  >
                    {editingProduct ? "تحديث" : "إضافة"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
