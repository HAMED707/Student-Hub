import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, Eye, EyeOff, Lock, AlertCircle, Home, Users, ShieldCheck, GraduationCap, Building2 } from 'lucide-react';
import GoogleSignInButton from "../../../assets/components/Auth/GoogleSignInButton.jsx";
import { loginUser, loginWithGoogle } from "../../../api/accounts.js";
import { getApiErrorMessage, getDefaultRouteForRole } from "../../../utils/auth.js";
import logoSvg from '../../../assets/brand/icons/logo.svg';

function FeaturePill({ icon, text }) {
    return (
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
            <span className="text-white/70 shrink-0">{icon}</span>
            <span className="text-white text-sm font-medium">{text}</span>
        </div>
    );
}

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [selectedRole, setSelectedRole] = useState(null);
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

        if (!selectedRole) {
            newErrors.role = "Please select your account type.";
        }
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

            const actualRole = data.user?.role;
            if (actualRole && actualRole !== 'pending' && actualRole !== selectedRole) {
                const correct = actualRole === 'student' ? 'Student' : 'Landlord';
                setFormError(`This account is registered as a ${correct}. Please select ${correct} and try again.`);
                return;
            }

            const destination =
                location.state?.from?.pathname ||
                getDefaultRouteForRole(actualRole);
            navigate(destination, { replace: true });
        } catch (error) {
            setFormError(getApiErrorMessage(error, "Login failed"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleLogin = async (credential) => {
        try {
            setIsSubmitting(true);
            setFormError('');
            const data = await loginWithGoogle(credential);
            navigate(getDefaultRouteForRole(data.user?.role), { replace: true });
        } catch (error) {
            setFormError(getApiErrorMessage(error, "Google login failed"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-white overflow-hidden font-sans">
            
            {/* ================= اليسار: النموذج ================= */}
            <div className="w-full lg:w-[60%] flex flex-col justify-center px-12 md:px-24 relative h-full">
                
                <div className="w-full max-w-md mx-auto">
                    <div className="mb-8 text-center lg:text-left">
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Login</h1>
                        <p className="text-gray-500 text-sm">
                            {selectedRole === 'student'
                                ? 'Find your perfect room and ideal roommate.'
                                : selectedRole === 'landlord'
                                ? 'Manage your properties and connect with students.'
                                : 'Select your account type to continue.'}
                        </p>
                    </div>

                    {/* Role Selector */}
                    <div className="flex gap-3 mb-2">
                        {[
                            { role: 'student', label: 'Student', Icon: GraduationCap },
                            { role: 'landlord', label: 'Landlord', Icon: Building2 },
                        ].map(({ role, label, Icon }) => (
                            <button
                                key={role}
                                type="button"
                                onClick={() => {
                                    setSelectedRole(role);
                                    setErrors((prev) => ({ ...prev, role: '' }));
                                    setFormError('');
                                }}
                                className={`flex-1 h-16 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all
                                    ${selectedRole === role
                                        ? 'border-[#1A56DB] bg-[#EEF4FF] text-[#1A56DB]'
                                        : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-xs font-semibold">{label}</span>
                            </button>
                        ))}
                    </div>
                    {errors.role && (
                        <div className="flex items-center gap-1 text-red-500 text-xs mb-1 ml-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>{errors.role}</span>
                        </div>
                    )}

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
                        <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-semibold uppercase tracking-wider">Or continue with</span>
                        <div className="flex-grow border-t border-gray-200"></div>
                    </div>

                    <GoogleSignInButton onCredential={handleGoogleLogin} text="Continue with Google" />
                </div>
            </div>

            {/* ================= اليمين: اللوجو ================= */}
            <div className="hidden lg:flex w-[40%] bg-[#3245FF] relative items-center justify-center overflow-hidden">
                {/* Background decorations */}
                <div className="absolute inset-0 opacity-10">
                    <svg viewBox="0 0 500 500" className="w-full h-full">
                        <path d="M0,100 C150,200 350,0 500,100 L500,500 L0,500 Z" fill="white" />
                    </svg>
                </div>
                <div className="absolute -top-32 -right-32 w-72 h-72 rounded-full bg-white/5 z-0" />
                <div className="absolute -bottom-28 -left-28 w-56 h-56 rounded-full bg-white/5 z-0" />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center text-center px-10 w-full">
                    <div className="bg-white rounded-2xl px-8 py-5 mb-6 shadow-xl w-[85%] max-w-sm flex items-center justify-center">
                        <img src={logoSvg} alt="Student Hub" className="w-full" />
                    </div>

                    <div className="w-12 h-0.5 bg-white/30 mb-6" />

                    <p className="text-white/80 text-sm leading-relaxed mb-8 max-w-[260px]">
                        Your platform for finding the perfect room and the ideal roommate.
                    </p>

                    <div className="flex flex-col gap-3 w-full max-w-[280px]">
                        <FeaturePill icon={<Home className="w-4 h-4" />} text="Browse verified listings" />
                        <FeaturePill icon={<Users className="w-4 h-4" />} text="AI-powered roommate matching" />
                        <FeaturePill icon={<ShieldCheck className="w-4 h-4" />} text="Verified students & landlords" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
