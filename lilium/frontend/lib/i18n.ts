import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Auth
      "login": "Login",
      "register": "Register",
      "email": "Email",
      "password": "Password",
      "confirmPassword": "Confirm Password",
      "forgotPassword": "Forgot Password?",
      "rememberMe": "Remember Me",
      "signIn": "Sign In",
      "signUp": "Sign Up",
      "logout": "Logout",
      "or": "Or",
      "continueWith": "Continue with",

      // Roles
      "superAdmin": "Super Admin",
      "locationAdmin": "Location Admin",
      "shopOwner": "Shop Owner",

      // Common
      "welcome": "Welcome",
      "dashboard": "Dashboard",
      "products": "Products",
      "orders": "Orders",
      "users": "Users",
      "settings": "Settings",
      "profile": "Profile",
      "language": "Language",
      "arabic": "Arabic",
      "english": "English",

      // Messages
      "loginSuccess": "Login successful",
      "loginError": "Invalid email or password",
      "registerSuccess": "Registration successful",
      "registerError": "Registration failed",
      "emailRequired": "Email is required",
      "passwordRequired": "Password is required",
      "passwordMin": "Password must be at least 8 characters",
      "passwordMismatch": "Passwords do not match",
      "invalidEmail": "Invalid email address",
    }
  },
  ar: {
    translation: {
      // Auth
      "login": "تسجيل الدخول",
      "register": "التسجيل",
      "email": "البريد الإلكتروني",
      "password": "كلمة المرور",
      "confirmPassword": "تأكيد كلمة المرور",
      "forgotPassword": "هل نسيت كلمة المرور؟",
      "rememberMe": "تذكرني",
      "signIn": "تسجيل الدخول",
      "signUp": "إنشاء حساب",
      "logout": "تسجيل الخروج",
      "or": "أو",
      "continueWith": "المتابعة باستخدام",

      // Roles
      "superAdmin": "المدير العام",
      "locationAdmin": "مدير الموقع",
      "shopOwner": "صاحب المتجر",

      // Common
      "welcome": "مرحباً",
      "dashboard": "لوحة التحكم",
      "products": "المنتجات",
      "orders": "الطلبات",
      "users": "المستخدمون",
      "settings": "الإعدادات",
      "profile": "الملف الشخصي",
      "language": "اللغة",
      "arabic": "العربية",
      "english": "الإنجليزية",

      // Messages
      "loginSuccess": "تم تسجيل الدخول بنجاح",
      "loginError": "البريد الإلكتروني أو كلمة المرور غير صحيحة",
      "registerSuccess": "تم التسجيل بنجاح",
      "registerError": "فشل التسجيل",
      "emailRequired": "البريد الإلكتروني مطلوب",
      "passwordRequired": "كلمة المرور مطلوبة",
      "passwordMin": "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
      "passwordMismatch": "كلمات المرور غير متطابقة",
      "invalidEmail": "البريد الإلكتروني غير صالح",
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'cookie', 'navigator'],
      caches: ['localStorage', 'cookie'],
    }
  });

export default i18n;