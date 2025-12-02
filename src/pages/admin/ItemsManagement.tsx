import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'firebase/firestore';
import { db } from '../../firebase';
import { Product, Category } from '../../types';
import { formatPrice, formatDateTime } from '../../utils/formatters';
import { uploadMultipleToImgBB } from '../../utils/imgbbUpload';
import { Plus, Edit, Trash2, Search, Image as ImageIcon, X } from 'lucide-react';
import toast from 'react-hot-toast';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    price: '',
    category: '',
    weight: '',
    images: [] as string[],
    featured: false,
    inStock: true,
    discount: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch Products
      const productsQuery = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const productsSnapshot = await getDocs(productsQuery);
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];
      setProducts(productsData);

      // Fetch Categories
      const categoriesSnapshot = await getDocs(collection(db, 'categories'));
      const categoriesData = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[];
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingImages(true);
    try {
      const urls = await uploadMultipleToImgBB(files);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...urls],
      }));
      toast.success(`تم رفع ${urls.length} صورة بنجاح`);
    } catch (error) {
      toast.error('حدث خطأ أثناء رفع الصور');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.images.length === 0) {
      toast.error('يرجى رفع صورة واحدة على الأقل');
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
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        toast.success('تم تحديث المنتج بنجاح');
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: serverTimestamp(),
          rating: 0,
          reviewCount: 0,
        });
        toast.success('تم إضافة المنتج بنجاح');
      }

      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('حدث خطأ أثناء حفظ المنتج');
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
      weight: product.weight || '',
      images: product.images,
      featured: product.featured,
      inStock: product.inStock,
      discount: product.discount ? product.discount.toString() : '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;

    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('تم حذف المنتج بنجاح');
      fetchData();
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف المنتج');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      nameAr: '',
      description: '',
      descriptionAr: '',
      price: '',
      category: '',
      weight: '',
      images: [],
      featured: false,
      inStock: true,
      discount: '',
    });
    setEditingProduct(null);
    setShowModal(false);
  };

  const filteredProducts = products.filter(product =>
    product.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
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
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="md-filled-button"
        >
          <Plus className="h-5 w-5 ml-2" />
          إضافة منتج جديد
        </motion.button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant" />
        <input
          type="text"
          placeholder="ابحث عن منتج..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pr-12 pl-4 py-3 bg-surface border border-outline rounded-m3 md-typescale-body-medium text-on-surface focus:outline-none focus:border-primary focus:border-2"
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
                  className="flex-1 bg-primary text-primary-on py-2 rounded-m3 md-typescale-label-medium ripple"
                >
                  <Edit className="h-4 w-4 inline ml-1" />
                  تعديل
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDelete(product.id)}
                  className="flex-1 bg-error text-error-on py-2 rounded-m3 md-typescale-label-medium ripple"
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
                <span className="md-typescale-title-medium text-primary">
                  {formatPrice(product.price)}
                </span>
                <span className={`px-2 py-1 rounded-m3-sm md-typescale-label-small ${
                  product.inStock
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {product.inStock ? 'متوفر' : 'نفذ'}
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
                  {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
                </h3>
                <button onClick={resetForm} className="p-2 rounded-full hover:bg-surface-variant">
                  <X className="h-6 w-6 text-on-surface" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Rest of the form - continuing in next message due to length */}
                <p className="text-center text-on-surface-variant">Form implementation continues...</p>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

