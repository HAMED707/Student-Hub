import React, { useState } from "react";
import Navbar from "../../assets/components/Navbar/Navbar.jsx";
import { 
  Save, 
  Lock, 
  Shield, 
  Eye, 
  EyeOff, 
  Mail,
  AlertCircle,
  LogOut,
  Globe,
  CheckCircle,
  UploadCloud,
  CreditCard,
  Plus,
  Receipt
} from "lucide-react";


const ToggleSwitch = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
      checked ? "bg-blue-600" : "bg-gray-200"
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        checked ? "translate-x-5" : "translate-x-0"
      }`}
    />
  </button>
);

const Settings = () => {
  // الحالات (States) الأساسية
  const [email, setEmail] = useState("student@example.com");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // حالات الإعدادات والتفضيلات
  const [profileVisible, setProfileVisible] = useState(true);
  const [matchNotifications, setMatchNotifications] = useState(true);
  const [language, setLanguage] = useState("English");
  
  // حالة رسائل الإشعارات الداخلية
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  const showMessage = (msg, type = "success") => {
    setNotification({ show: true, message: msg, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
  };

  
  const saveAccount = () => showMessage("Account settings updated successfully!");
  const savePreferences = () => showMessage("Preferences saved successfully!");

  const changePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return showMessage("Please fill all password fields", "error");
    }
    if (newPassword !== confirmPassword) {
      return showMessage("New passwords do not match", "error");
    }
    if (newPassword.length < 6) {
      return showMessage("Password must be at least 6 characters", "error");
    }
    
    showMessage("Password changed successfully!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="min-h-screen bg-[#f4f7f9] font-sans pb-20">
      <Navbar />

      <div className="w-full px-4 md:px-8 py-6 max-w-5xl mx-auto mt-16 md:mt-6">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Settings</h1>
          <p className="text-gray-500 mt-1.5 text-sm font-medium">
            Manage your account preferences, security, and billing.
          </p>
        </div>

    
        {notification.show && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 font-medium text-sm transition-all animate-fade-in-down ${
            notification.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"
          }`}>
            <AlertCircle className="w-5 h-5" />
            {notification.message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
        
          <div className="lg:col-span-2 space-y-6">
            
            {/* Account Settings */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" /> Email Address
              </h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm"
                />
                <button
                  onClick={saveAccount}
                  className="px-6 py-2.5 bg-[#0A2647] hover:bg-blue-900 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shrink-0"
                >
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
            </div>

            {/* Security / Password */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" /> Security
              </h2>
              
              <div className="space-y-4 max-w-md">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm"
                  />
                </div>
                
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm"
                  />
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={changePassword}
                    className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-2 text-sm shadow-sm hover:shadow-md"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            </div>

            {/* Payment Methods & Billing */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" /> Payment Methods & Billing
                </h2>
                <button className="text-xs font-bold text-blue-600 hover:text-blue-800 px-3 py-1.5 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add Card
                </button>
              </div>
              
              <p className="text-xs text-gray-500 mb-4">Manage your payment methods for housing bookings and deposits.</p>
              
              {/* Saved Card */}
              <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-[#1434CB] rounded flex items-center justify-center text-white font-bold text-[11px] italic shadow-sm">
                    VISA
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Visa ending in 4242</p>
                    <p className="text-[11px] text-gray-500">Expires 12/28</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md uppercase tracking-wide">
                  Default
                </span>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100">
                <button className="text-sm font-semibold text-gray-600 hover:text-[#0A2647] transition-colors flex items-center gap-2">
                  <Receipt className="w-4 h-4" /> View Billing History
                </button>
              </div>
            </div>

          </div>

          <div className="space-y-6">
            
            {/* Preferences (Language Only) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" /> Preferences
              </h2>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Language</span>
                </div>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                >
                  <option value="English">English</option>
                  <option value="Arabic">العربية</option>
                </select>
              </div>
            </div>

            {/* Verification Widget */}
            <div className="bg-gradient-to-br from-[#0A2647] to-blue-900 p-6 rounded-2xl shadow-sm border border-blue-800 text-white">
              <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" /> Identity Verification
              </h2>
              <p className="text-xs text-blue-200 mb-5 leading-relaxed">
                Verified students get 3x more housing matches. Upload your student ID to get the verification badge.
              </p>
              <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2">
                <UploadCloud className="w-4 h-4" /> Upload Student ID
              </button>
            </div>

            {/* Privacy & Notifications */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" /> Privacy & Alerts
              </h2>
              
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-800">Profile Visibility</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">Let others find your profile</div>
                  </div>
                  <ToggleSwitch checked={profileVisible} onChange={setProfileVisible} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-800">Match Alerts</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">Push notifications for matches</div>
                  </div>
                  <ToggleSwitch checked={matchNotifications} onChange={setMatchNotifications} />
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-gray-100">
                <button
                  onClick={savePreferences}
                  className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save Preferences
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
              <h2 className="text-lg font-bold text-red-700 mb-2">Danger Zone</h2>
              <p className="text-xs text-red-600/80 mb-5 leading-relaxed">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button className="w-full px-4 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 shadow-sm">
                <LogOut className="w-4 h-4" /> Delete Account
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;