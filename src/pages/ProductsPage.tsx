import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, Category } from '../types';
import ProductCard from '../components/ProductCard';
import { Filter, Grid, List, Search } from 'lucide-react';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get('category') || 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<string>('newest');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Categories
        const categoriesQuery = query(
          collection(db, 'categories'),
          orderBy('order', 'asc')
        );
        const categoriesSnapshot = await getDocs(categoriesQuery);
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Category[];
        setCategories(categoriesData);

        // Fetch Products
        let productsQuery;
        if (selectedCategory !== 'all') {
          productsQuery = query(
            collection(db, 'products'),
            where('category', '==', selectedCategory),
            orderBy('createdAt', 'desc')
          );
        } else {
          productsQuery = query(
            collection(db, 'products'),
            orderBy('createdAt', 'desc')
          );
        }

        const productsSnapshot = await getDocs(productsQuery);
        let productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];

        // Apply sorting
        productsData = sortProducts(productsData, sortBy);

        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory, sortBy]);

  const sortProducts = (products: Product[], sortBy: string) => {
    switch (sortBy) {
      case 'price-low':
        return [...products].sort((a, b) => a.price - b.price);
      case 'price-high':
        return [...products].sort((a, b) => b.price - a.price);
      case 'name':
        return [...products].sort((a, b) => a.nameAr.localeCompare(b.nameAr, 'ar'));
      case 'rating':
        return [...products].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      default: // newest
        return products;
    }
  };

  const filteredProducts = products.filter(product =>
    product.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.descriptionAr.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (categoryId === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', categoryId);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="md-typescale-display-small text-on-background mb-2">
            جميع المنتجات
          </h1>
          <p className="md-typescale-body-large text-on-surface-variant">
            اكتشف مجموعتنا الكاملة من الشوكولاتة الفاخرة
          </p>
        </motion.div>

        {/* Filters & Controls */}
        <div className="mb-8 space-y-4">
          {/* Search & View Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant" />
              <input
                type="text"
                placeholder="ابحث عن منتج..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-12 pl-4 py-3 bg-surface border border-outline rounded-m3 md-typescale-body-medium text-on-surface focus:outline-none focus:border-primary focus:border-2"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 bg-surface border border-outline rounded-m3 md-typescale-body-medium text-on-surface focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="newest">الأحدث</option>
              <option value="price-low">السعر: من الأقل للأعلى</option>
              <option value="price-high">السعر: من الأعلى للأقل</option>
              <option value="name">الاسم: أ-ي</option>
              <option value="rating">الأعلى تقييماً</option>
            </select>

            {/* View Mode */}
            <div className="flex gap-2 bg-surface-variant rounded-m3 p-1">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-m3-sm transition-colors ripple ${
                  viewMode === 'grid'
                    ? 'bg-primary text-primary-on'
                    : 'text-on-surface-variant'
                }`}
              >
                <Grid className="h-5 w-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-m3-sm transition-colors ripple ${
                  viewMode === 'list'
                    ? 'bg-primary text-primary-on'
                    : 'text-on-surface-variant'
                }`}
              >
                <List className="h-5 w-5" />
              </motion.button>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCategoryChange('all')}
              className={`px-4 py-2 rounded-m3 md-typescale-label-large transition-all ripple ${
                selectedCategory === 'all'
                  ? 'bg-primary text-primary-on shadow-m3-1'
                  : 'bg-surface-variant text-on-surface-variant hover:bg-outline-variant'
              }`}
            >
              الكل
            </motion.button>
            {categories.map((category) => (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCategoryChange(category.id)}
                className={`px-4 py-2 rounded-m3 md-typescale-label-large transition-all ripple ${
                  selectedCategory === category.id
                    ? 'bg-primary text-primary-on shadow-m3-1'
                    : 'bg-surface-variant text-on-surface-variant hover:bg-outline-variant'
                }`}
              >
                {category.nameAr}
                {category.productsCount && (
                  <span className="mr-1 opacity-70">({category.productsCount})</span>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Products Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6"
        >
          <p className="md-typescale-body-medium text-on-surface-variant">
            عرض {filteredProducts.length} منتج
          </p>
        </motion.div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-32 h-32 mx-auto mb-6 bg-surface-variant rounded-full flex items-center justify-center">
              <span className="material-symbols-rounded text-6xl text-outline">
                search_off
              </span>
            </div>
            <h3 className="md-typescale-headline-medium text-on-surface mb-2">
              لم نجد أي منتجات
            </h3>
            <p className="md-typescale-body-medium text-on-surface-variant">
              جرب تغيير معايير البحث أو الفلترة
            </p>
          </motion.div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }
          >
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

