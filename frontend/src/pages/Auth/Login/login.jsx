import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Eye, EyeOff, Lock, AlertCircle } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errors[name]) setErrors({ ...errors, [name]: '' });
        setServerError('');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setServerError('');
        
        // 1. التحقق من المدخلات (Validation)
        let newErrors = {};
        const arabicRegex = /[\u0600-\u06FF]/;

        if (!formData.username.trim()) newErrors.username = "Username is required";
        else if (arabicRegex.test(formData.username)) newErrors.username = "English characters only";

        if (!formData.password) newErrors.password = "Password is required";
        else if (arabicRegex.test(formData.password)) newErrors.password = "English characters only";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // 2. الاتصال بالسيرفر والربط (Backend & Linking)
        try {
            // أ) البحث في جدول الطلاب
            const resStudent = await fetch(`http://localhost:3001/students?username=${formData.username}&password=${formData.password}`);
            const students = await resStudent.json();

            if (students.length > 0) {
                // ✅ نجاح الدخول كطالب
                console.log("Logged in as Student");
                localStorage.setItem('user', JSON.stringify(students[0])); // حفظ البيانات
                localStorage.setItem('role', 'student'); 
                navigate('/student-dashboard'); // ⬅️ التوجيه لصفحة الطالب
                return;
            }

            // ب) البحث في جدول الملاك
            const resLandlord = await fetch(`http://localhost:3001/landlords?username=${formData.username}&password=${formData.password}`);
            const landlords = await resLandlord.json();

            if (landlords.length > 0) {
                // ✅ نجاح الدخول كمالك
                console.log("Logged in as Landlord");
                localStorage.setItem('user', JSON.stringify(landlords[0])); // حفظ البيانات
                localStorage.setItem('role', 'landlord');
                navigate('/landlord-dashboard'); // ⬅️ التوجيه لصفحة المالك
                return;
            }

            // ج) فشل الدخول
            setServerError("Invalid Username or Password");

        } catch (error) {
            console.error("Login Error:", error);
            setServerError("Connection error. Make sure json-server is running.");
        }
    };

    return (
        <div className="flex h-screen w-full bg-white overflow-hidden font-sans">
            <div className="w-full lg:w-[60%] flex flex-col justify-center px-12 md:px-24 relative h-full">
                <div className="w-full max-w-md mx-auto">
                    <div className="mb-10 text-center lg:text-left">
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Login</h1>
                        <p className="text-gray-500 text-sm">How can I find my ideal room or roommate?</p>
                    </div>

                    <form onSubmit={handleLogin} className="flex flex-col gap-5">
                        
                        {serverError && (
                            <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center border border-red-200 animate-fadeIn">
                                {serverError}
                            </div>
                        )}

                        <div className="flex flex-col gap-1">
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"><User className="w-5 h-5" /></div>
                                <input 
                                    type="text" name="username" placeholder="Username" 
                                    value={formData.username} onChange={handleChange} dir="ltr"
                                    className={`w-full h-12 pl-12 pr-4 border rounded-xl outline-none transition text-gray-700 ${errors.username ? 'border-red-500' : 'border-gray-300 focus:border-[#1A56DB]'}`}
                                />
                            </div>
                            {errors.username && <span className="text-red-500 text-xs ml-1 flex gap-1"><AlertCircle className="w-3 h-3"/>{errors.username}</span>}
                        </div>

                        <div className="flex flex-col gap-1">
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"><Lock className="w-5 h-5" /></div>
                                <input 
                                    type={showPassword ? "text" : "password"} name="password" placeholder="Password" 
                                    value={formData.password} onChange={handleChange} dir="ltr"
                                    className={`w-full h-12 pl-12 pr-12 border rounded-xl outline-none transition text-gray-700 ${errors.password ? 'border-red-500' : 'border-gray-300 focus:border-[#1A56DB]'}`}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#1A56DB]">
                                    {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && <span className="text-red-500 text-xs ml-1 flex gap-1"><AlertCircle className="w-3 h-3"/>{errors.password}</span>}
                        </div>

                        <div className="flex justify-between items-center text-sm">
                            <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#1A56DB]" /> Remember me
                            </label>
                            <button type="button" onClick={() => navigate('/forgot-password')} className="text-[#1A56DB] font-semibold hover:underline">Forgot Password?</button>
                        </div>

                        <button type="submit" className="w-full h-12 bg-[#1A56DB] text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-md active:scale-95">
                            Login
                        </button>
                    </form>

                    <div className="relative flex py-6 items-center">
                        <div className="flex-grow border-t border-gray-200"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-semibold uppercase">Login with Others</span>
                        <div className="flex-grow border-t border-gray-200"></div>
                    </div>
                    <div className="flex flex-col gap-3">
                        <button className="flex items-center justify-center gap-3 w-full h-12 bg-[#1877F2] text-white font-semibold rounded-xl hover:bg-[#166fe5] transition shadow-sm">Log In with Facebook</button>
                        <button className="flex items-center justify-center gap-3 w-full h-12 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition shadow-sm">Log In with Google</button>
                    </div>
                </div>
            </div>

            <div className="hidden lg:flex w-[40%] bg-[#3245FF] relative items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-20"><svg viewBox="0 0 500 500" className="w-full h-full"><path d="M0,100 C150,200 350,0 500,100 L500,500 L0,500 Z" fill="white" /></svg></div>
                <div className="relative z-10 w-[80%] h-[75%]">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-md rounded-[45px] border border-white/20"></div>
                    <div className="absolute top-12 left-10 z-30 max-w-[280px]">
                        <h2 className="text-2xl font-bold text-white mb-4 leading-relaxed">"Find your next room or roommate - <br/> Login to get started!"</h2>
                    </div>
                    <div className="relative w-full h-full overflow-hidden rounded-[45px] flex items-end justify-center">
                        <img src="https://picsum.photos/seed/login-side/1200/800" alt="Login" className="w-[90%] h-[85%] object-cover object-top rounded-t-[30px]" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;