// Product Types
export interface Product {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: number;
  images: string[]; // Multiple images support
  category: string;
  featured: boolean;
  inStock: boolean;
  weight?: string; // e.g., "100g", "250g", "1kg"
  ingredients?: string[];
  ingredientsAr?: string[];
  allergens?: string[];
  allergensAr?: string[];
  nutritionFacts?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sugar: number;
  };
  discount?: number; // Percentage
  tags?: string[];
  rating?: number;
  reviewCount?: number;
  createdAt: any;
  updatedAt: any;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  image?: string;
  order: number;
  productsCount?: number;
  createdAt: any;
}

// Order Types
export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'out-for-delivery' | 'delivered' | 'cancelled';
  paymentMethod: 'cash' | 'card' | 'online';
  paymentStatus: 'pending' | 'paid' | 'failed';
  notes?: string;
  createdAt: any;
  updatedAt: any;
  deliveredAt?: any;
  userId?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productNameAr: string;
  productImage: string;
  quantity: number;
  price: number;
  subtotal: number;
}

// Cart Types
export interface CartItem {
  product: Product;
  quantity: number;
}

// Review Types
export interface Review {
  id: string;
  productId: string;
  userId?: string;
  userName: string;
  userEmail?: string;
  rating: number;
  comment: string;
  images?: string[];
  verified: boolean;
  helpful: number;
  createdAt: any;
}

// Message Types
export interface Message {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  subject?: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  reply?: string;
  createdAt: any;
  repliedAt?: any;
}

// Settings Types
export interface SiteSettings {
  id: string;
  siteName: string;
  siteNameAr: string;
  siteDescription: string;
  siteDescriptionAr: string;
  logo?: string;
  heroImages: string[]; // Multiple hero images with carousel
  heroTitle: string;
  heroTitleAr: string;
  heroSubtitle: string;
  heroSubtitleAr: string;
  phone: string;
  email: string;
  address: string;
  addressAr: string;
  whatsapp?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  deliveryFee: number;
  freeDeliveryMinimum?: number;
  taxRate?: number;
  currency: string;
  currencyAr: string;
  openingHours?: string;
  openingHoursAr?: string;
  aboutUs?: string;
  aboutUsAr?: string;
  privacyPolicy?: string;
  privacyPolicyAr?: string;
  termsAndConditions?: string;
  termsAndConditionsAr?: string;
  updatedAt: any;
}

// Admin Types
export interface Admin {
  id: string;
  email: string;
  displayName: string;
  role: 'super-admin' | 'admin';
  createdAt: any;
}

// Statistics Types
export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  pendingOrders: number;
  todayOrders: number;
  todayRevenue: number;
  monthlyRevenue: number;
  popularProducts: Array<{
    id: string;
    name: string;
    nameAr: string;
    sales: number;
    revenue: number;
  }>;
  recentOrders: Order[];
}

// Image Upload Response
export interface ImageUploadResponse {
  success: boolean;
  url: string;
  message?: string;
}

