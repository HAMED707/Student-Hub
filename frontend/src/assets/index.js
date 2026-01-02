// src/assets/index.js

// 1. استيراد اللوجو الحقيقي من ملفاتك
// ⚠️ تأكد أن اسم الملف هنا يطابق اسم الملف في المجلد تماماً (حتى حالة الأحرف)
import logoFull from './brand/logo.svg'; 
// إذا كان لديك أيقونة صغيرة، استوردها أيضاً، وإلا استخدم نفس اللوجو
import logoIcon from './brand/logo.svg'; 


// 2. صور المستخدمين (سنبقيها روابط مؤقتة حالياً حتى تجهز صوراً حقيقية)
export const defaultAvatar = "https://ui-avatars.com/api/?name=Salah+User&background=0A2647&color=fff&rounded=true";

// 3. صور العقارات
export const propertyPlaceholder = "https://placehold.co/600x400/e2e8f0/1e293b?text=Room+Image";

// 4. البانر
export const homeBanner = "https://placehold.co/1200x400/0A2647/ffffff?text=Find+Your+Dream+Home";

// تصدير الكل
export {
  logoFull,
  logoIcon
};