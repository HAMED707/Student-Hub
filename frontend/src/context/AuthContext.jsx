import { createContext, useContext, useState, useEffect } from "react";

// 1. إنشاء السياق (المخزن)
const AuthContext = createContext();

// 2. مزود البيانات (الذي سيغلف التطبيق كله)
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // في البداية لا يوجد مستخدم

  // دالة تسجيل الدخول (تستدعيها عندما ينجح الاتصال بالباك إند)
  const login = (userData) => {
    setUser(userData);
    // يمكنك هنا حفظ البيانات في localStorage ليبقى مسجلاً
    localStorage.setItem("user", JSON.stringify(userData));
  };

  // دالة تسجيل الخروج
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  // عند تحميل الموقع، نتحقق هل المستخدم مسجل دخول من قبل؟
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse stored user:", error);
      localStorage.removeItem("user");
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. خطاف مخصص لسهولة الاستخدام
export const useAuth = () => useContext(AuthContext);