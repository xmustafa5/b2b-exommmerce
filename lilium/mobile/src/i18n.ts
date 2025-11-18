import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Auth
      signIn: 'Sign In',
      email: 'Email',
      password: 'Password',
      loginError: 'Login failed. Please check your credentials.',
      emailRequired: 'Email and password are required',

      // Home
      home: 'Home',
      searchProducts: 'Search products...',

      // Common
      loading: 'Loading...',
      error: 'Error',
      retry: 'Retry',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',

      // Products
      products: 'Products',
      price: 'Price',
      stock: 'Stock',
      addToCart: 'Add to Cart',
      outOfStock: 'Out of Stock',

      // Cart
      cart: 'Cart',
      checkout: 'Checkout',
      total: 'Total',
      subtotal: 'Subtotal',
      deliveryFee: 'Delivery Fee',
      discount: 'Discount',

      // Orders
      orders: 'My Orders',
      orderDetails: 'Order Details',
      orderStatus: 'Status',
    },
  },
  ar: {
    translation: {
      // Auth
      signIn: 'تسجيل الدخول',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      loginError: 'فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد.',
      emailRequired: 'البريد الإلكتروني وكلمة المرور مطلوبان',

      // Home
      home: 'الرئيسية',
      searchProducts: 'البحث عن المنتجات...',

      // Common
      loading: 'جاري التحميل...',
      error: 'خطأ',
      retry: 'إعادة المحاولة',
      cancel: 'إلغاء',
      save: 'حفظ',
      delete: 'حذف',
      edit: 'تعديل',
      add: 'إضافة',

      // Products
      products: 'المنتجات',
      price: 'السعر',
      stock: 'المخزون',
      addToCart: 'أضف إلى السلة',
      outOfStock: 'نفذ من المخزون',

      // Cart
      cart: 'السلة',
      checkout: 'الدفع',
      total: 'المجموع',
      subtotal: 'المجموع الفرعي',
      deliveryFee: 'رسوم التوصيل',
      discount: 'الخصم',

      // Orders
      orders: 'طلباتي',
      orderDetails: 'تفاصيل الطلب',
      orderStatus: 'الحالة',
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
