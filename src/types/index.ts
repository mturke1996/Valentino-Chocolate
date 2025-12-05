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
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "out-for-delivery"
    | "delivered"
    | "cancelled";
  deliveryType: "pickup" | "delivery"; // استلام من المتجر أو توصيل
  paymentMethod: "cash" | "card" | "online";
  paymentStatus: "pending" | "paid" | "failed";
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
  reply?: string; // رد الموقع على التقييم
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
  status: "new" | "read" | "replied";
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
  youtube?: string;
  tiktok?: string;
  linkedin?: string;
  deliveryFee: number;
  freeDeliveryMinimum?: number;
  taxRate?: number;
  currency: string;
  currencyAr: string;
  discountCodes?: DiscountCode[];
  openingHours?: string;
  openingHoursAr?: string;
  aboutUs?: string;
  aboutUsAr?: string;
  privacyPolicy?: string;
  privacyPolicyAr?: string;
  termsAndConditions?: string;
  termsAndConditionsAr?: string;
  // Telegram Bot Settings
  telegramBotToken?: string;
  telegramEnabled?: boolean;
  telegramChats?: TelegramChat[];
  updatedAt: any;
}

// Telegram Chat with Permissions
export interface TelegramChat {
  id: string;
  chatId: string;
  name?: string;
  enabled: boolean;
  permissions: {
    orders: boolean; // استلام إشعارات الطلبات
    orderStatus: boolean; // استلام تحديثات حالة الطلب
    messages: boolean; // استلام الرسائل من التواصل معنا
    reviews: boolean; // استلام التقييمات
    contact: boolean; // استلام رسائل التواصل
  };
  createdAt: any;
  updatedAt: any;
}

// Admin Types
export interface Admin {
  id: string;
  email: string;
  displayName: string;
  role: "super-admin" | "admin";
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

// Job Application Types
export interface JobApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  experience?: string;
  cv?: string; // URL to CV file
  coverLetter?: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  notes?: string;
  createdAt: any;
}

// Offer/Promotion Types
export interface Offer {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  image?: string;
  discount?: number; // Percentage
  validFrom: any;
  validUntil: any;
  active: boolean;
  products?: string[]; // Product IDs (if specific to products)
  createdAt: any;
  updatedAt: any;
}

// Discount Code Types
export interface DiscountCode {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed'; // نسبة مئوية أو مبلغ ثابت
  discountValue: number; // قيمة الخصم
  minPurchase?: number; // الحد الأدنى للشراء
  maxDiscount?: number; // الحد الأقصى للخصم (للنسبة المئوية)
  validFrom: any;
  validUntil: any;
  active: boolean;
  usageLimit?: number; // عدد مرات الاستخدام
  usedCount?: number; // عدد مرات الاستخدام الحالية
  createdAt: any;
  updatedAt: any;
}
