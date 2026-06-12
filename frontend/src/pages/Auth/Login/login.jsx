import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, Eye, EyeOff, Lock, AlertCircle } from 'lucide-react';
import { loginUser } from "../../../api/accounts.js";
import { getApiErrorMessage, getDefaultRouteForRole } from "../../../utils/auth.js";

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
        if (formError) {
            setFormError('');
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        
        let newErrors = {};
        const identifier = formData.username.trim();

        if (!identifier) {
            newErrors.username = "Username or email is required";
        }

        if (!formData.password) {
            newErrors.password = "Password is required";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            setIsSubmitting(true);
            setFormError('');
            const data = await loginUser({
                username: identifier,
                password: formData.password,
            });
            const destination =
                location.state?.from?.pathname ||
                getDefaultRouteForRole(data.user?.role);

            navigate(destination, { replace: true });
        } catch (error) {
            setFormError(getApiErrorMessage(error, "Login failed"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-white overflow-hidden font-sans">
            
            {/* ================= اليسار: النموذج ================= */}
            <div className="w-full lg:w-[60%] flex flex-col justify-center px-12 md:px-24 relative h-full">
                
                <div className="w-full max-w-md mx-auto">
                    <div className="mb-10 text-center lg:text-left">
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Login</h1>
                        <p className="text-gray-500 text-sm">How can I find my ideal room or roommate?</p>
                    </div>

                    <form onSubmit={handleLogin} className="flex flex-col gap-5">
                        {formError && (
                            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>{formError}</span>
                            </div>
                        )}
                        
                        {/* Username Field */}
                        <div className="flex flex-col gap-1">
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                                    <User className="w-5 h-5" />
                                </div>
                                <input 
                                    type="text" 
                                    name="username"
                                    placeholder="Username or email" 
                                    value={formData.username}
                                    onChange={handleChange}
                                    dir="ltr" // إجبار اتجاه النص لليسار
                                    className={`w-full h-12 pl-12 pr-4 border rounded-xl outline-none transition placeholder-gray-400 text-gray-700
                                        ${errors.username 
                                            ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                                            : 'border-gray-300 focus:border-[#1A56DB] focus:ring-1 focus:ring-[#1A56DB]'
                                        }`}
                                />
                            </div>
                            {/* رسالة الخطأ */}
                            {errors.username && (
                                <div className="flex items-center gap-1 text-red-500 text-xs animate-fadeIn ml-1">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>{errors.username}</span>
                                </div>
                            )}
                        </div>

                        {/* Password Field */}
                        <div className="flex flex-col gap-1">
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    name="password"
                                    placeholder="Password" 
                                    value={formData.password}
                                    onChange={handleChange}
                                    dir="ltr" // إجبار اتجاه النص لليسار
                                    className={`w-full h-12 pl-12 pr-12 border rounded-xl outline-none transition placeholder-gray-400 text-gray-700
                                        ${errors.password 
                                            ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                                            : 'border-gray-300 focus:border-[#1A56DB] focus:ring-1 focus:ring-[#1A56DB]'
                                        }`}
                                />
                                
                                {/* زر إظهار/إخفاء كلمة المرور */}
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#1A56DB] cursor-pointer transition-colors p-1"
                                >
                                    {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                </button>
                            </div>
                            {/* رسالة الخطأ */}
                            {errors.password && (
                                <div className="flex items-center gap-1 text-red-500 text-xs animate-fadeIn ml-1">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>{errors.password}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center text-sm">
                            <label className="flex items-center gap-2 cursor-pointer text-gray-600 select-none hover:text-gray-900 transition">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#1A56DB] focus:ring-[#1A56DB]" />
                                Remember me
                            </label>
                            
                            <button 
                                type="button"
                                onClick={() => navigate('/forgot-password')} 
                                className="text-[#1A56DB] font-semibold hover:underline"
                            >
                                Forgot Password?
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-12 bg-[#1A56DB] text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-md hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isSubmitting ? "Signing In..." : "Login"}
                        </button>

                        <div className="text-center text-sm text-gray-500 mt-2">
                            Don’t have an account? 
                            <button onClick={() => navigate('/join')} className="text-[#1A56DB] font-bold ml-1 hover:underline">
                                Register
                            </button>
                        </div>
                    </form>

                    <div className="relative flex py-6 items-center">
                        <div className="flex-grow border-t border-gray-200"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-semibold uppercase tracking-wider">Login with Others</span>
                        <div className="flex-grow border-t border-gray-200"></div>
                    </div>

                    <div className="flex flex-col gap-3">
                        {/* Facebook Button */}
                        <button className="flex items-center justify-center gap-3 w-full h-12 bg-[#1877F2] text-white font-semibold rounded-xl hover:bg-[#166fe5] transition shadow-sm hover:shadow-md active:scale-[0.98]">
                            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            Log In with Facebook
                        </button>
                        
                        {/* Google Button */}
                        <button className="flex items-center justify-center gap-3 w-full h-12 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition shadow-sm hover:shadow-md active:scale-[0.98]">
                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Log In with Google
                        </button>
                    </div>
                </div>
            </div>

            {/* ================= اليمين: الصورة ================= */}
            <div className="hidden lg:flex w-[40%] bg-[#3245FF] relative items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-20"><svg viewBox="0 0 500 500" className="w-full h-full"><path d="M0,100 C150,200 350,0 500,100 L500,500 L0,500 Z" fill="white" /></svg></div>
                <div className="relative z-10 w-[80%] h-[75%]">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-md rounded-[45px] border border-white/20"></div>
                    <div className="absolute top-12 left-10 z-30 max-w-[280px]">
                        <h2 className="text-2xl font-bold text-white mb-4 leading-relaxed">"Find your next room or roommate - <br/> Login to get started!"</h2>
                    </div>
                    <div className="relative w-full h-full overflow-hidden rounded-[45px] flex items-end justify-center">
                        <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1200&auto=format&fit=crop" alt="Login" className="w-[90%] h-[85%] object-cover object-top rounded-t-[30px]" />
                    </div>
                    <div className="absolute -left-8 bottom-24 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl z-40">
                        <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-white"><svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M13,10V3L4,14H11V21L20,10H13Z" /></svg></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
