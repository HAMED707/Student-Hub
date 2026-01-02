import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Eye, EyeOff, Lock, AlertCircle, CheckCircle } from 'lucide-react';

const PasswordRecovery = () => {
    const navigate = useNavigate();
    
    // === إدارة الحالة (Steps) ===
    // 1: Forgot Password (Email)
    // 2: Verify Code
    // 3: Set New Password
    // 4: Success Message
    const [step, setStep] = useState(1);

    // === تخزين البيانات ===
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
    
    // === حالات واجهة المستخدم ===
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [errors, setErrors] = useState({});

    // === Regex للتحقق ===
    const arabicRegex = /[\u0600-\u06FF]/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const strongPassRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

    // --- منطق الخطوة 1: إرسال الإيميل ---
    const handleEmailSubmit = (e) => {
        e.preventDefault();
        let errs = {};
        if (!email.trim()) errs.email = "Email is required";
        else if (arabicRegex.test(email)) errs.email = "English characters only";
        else if (!emailRegex.test(email)) errs.email = "Invalid email format";

        if (Object.keys(errs).length > 0) return setErrors(errs);
        
        setErrors({});
        console.log("Email Sent to:", email);
        setStep(2); // الانتقال للخطوة التالية
    };

    // --- منطق الخطوة 2: التحقق من الكود ---
    const handleCodeVerify = (e) => {
        e.preventDefault();
        if (code.length < 4) return setErrors({ code: "Enter the full 4-digit code" });
        
        setErrors({});
        console.log("Code Verified:", code);
        setStep(3); // الانتقال للخطوة التالية
    };

    // --- منطق الخطوة 3: تعيين كلمة المرور ---
    const handlePasswordReset = (e) => {
        e.preventDefault();
        let errs = {};
        
        // تحقق كلمة المرور الجديدة
        if (!passwords.newPassword) errs.newPassword = "Password is required";
        else if (arabicRegex.test(passwords.newPassword)) errs.newPassword = "English characters only";
        else if (!strongPassRegex.test(passwords.newPassword)) errs.newPassword = "Min 8 chars, 1 Uppercase & 1 Number";

        // تحقق التطابق
        if (passwords.newPassword !== passwords.confirmPassword) errs.confirmPassword = "Passwords do not match";

        if (Object.keys(errs).length > 0) return setErrors(errs);

        console.log("Password Reset Done");
        setStep(4); // الانتقال لشاشة النجاح
    };

    // --- زر الرجوع ---
    const handleBack = () => {
        setErrors({});
        if (step === 1) navigate('/login'); // لو في أول خطوة ارجع للدخول
        else if (step === 4) navigate('/login');
        else setStep(step - 1); // ارجع خطوة للوراء
    };

    // === تحديد المحتوى الجانبي (الصورة والنصوص) بناءً على الخطوة ===
    const getSideContent = () => {
        switch(step) {
            case 1: return {
                title: "Forgot your password?",
                desc: "Don't worry, happens to all of us. Enter your email below to recover your password.",
                img: "https://img.freepik.com/free-psd/3d-rendering-lock-icon_23-2149557280.jpg"
            };
            case 2: return {
                title: "Verify Code",
                desc: `An authentication code has been sent to ${email}. Check your inbox.`,
                img: "https://img.freepik.com/free-psd/3d-illustration-hand-holding-smartphone-with-secure-shield_23-2149322638.jpg"
            };
            case 3: return {
                title: "Set a password",
                desc: "Your previous password has been reset. Please set a new password for your account.",
                img: "https://img.freepik.com/free-vector/reset-password-concept-illustration_114360-7886.jpg"
            };
            default: return { title: "Success", desc: "You can now login.", img: "" };
        }
    };

    const sideInfo = getSideContent();

    return (
        <div className="flex h-screen w-full bg-white overflow-hidden font-sans">
            
            {/* ====== اليسار: النماذج المتغيرة ====== */}
            <div className="w-full lg:w-[60%] flex flex-col justify-center px-12 md:px-24 relative h-full">
                <div className="w-full max-w-md mx-auto">
                    
                    {/* Header */}
                    {step !== 4 && (
                        <button onClick={handleBack} className="flex items-center gap-2 text-gray-500 hover:text-[#1A56DB] mb-8 transition-colors group">
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
                            {step === 1 ? 'Back to login' : 'Back'}
                        </button>
                    )}

                    {/* Step 4: Success State (Special Layout) */}
                    {step === 4 ? (
                        <div className="text-center animate-fadeIn">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-500 mx-auto mb-6">
                                <CheckCircle className="w-10 h-10" />
                            </div>
                            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Password Reset!</h2>
                            <p className="text-gray-500 mb-8">Your password has been successfully reset. Click below to log in.</p>
                            <button onClick={() => navigate('/login')} className="w-full h-12 bg-[#1A56DB] text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-md">
                                Back to Login
                            </button>
                        </div>
                    ) : (
                        // Steps 1, 2, 3 Form Container
                        <div className="animate-fadeIn">
                            <div className="mb-8">
                                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{sideInfo.title}</h1>
                                <p className="text-gray-500 text-sm">{sideInfo.desc}</p>
                            </div>

                            {/* === STEP 1: EMAIL FORM === */}
                            {step === 1 && (
                                <form onSubmit={handleEmailSubmit} className="flex flex-col gap-6">
                                    <div className="flex flex-col gap-1">
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"><Mail className="w-5 h-5" /></div>
                                            <input 
                                                type="text" 
                                                placeholder="Enter your email" 
                                                value={email}
                                                onChange={(e) => { setEmail(e.target.value); setErrors({}); }}
                                                dir="ltr"
                                                className={`w-full h-12 pl-12 pr-4 border rounded-xl outline-none transition text-gray-700 placeholder-gray-400
                                                    ${errors.email ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:border-[#1A56DB] focus:ring-1 focus:ring-[#1A56DB]'}`}
                                            />
                                        </div>
                                        {errors.email && <span className="text-red-500 text-xs ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.email}</span>}
                                    </div>
                                    <button type="submit" className="w-full h-12 bg-[#1A56DB] text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-md active:scale-95">Send Code</button>
                                </form>
                            )}

                            {/* === STEP 2: VERIFY CODE === */}
                            {step === 2 && (
                                <form onSubmit={handleCodeVerify} className="flex flex-col gap-6">
                                    <div className="flex flex-col gap-1">
                                        <input 
                                            type="text" 
                                            placeholder="Enter 4-digit Code" 
                                            value={code}
                                            maxLength={4}
                                            onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setErrors({}); }}
                                            className={`w-full h-12 px-4 text-center text-lg tracking-[0.5em] font-bold border rounded-xl outline-none transition text-gray-700
                                                ${errors.code ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:border-[#1A56DB] focus:ring-1 focus:ring-[#1A56DB]'}`}
                                        />
                                        {errors.code && <span className="text-red-500 text-xs ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.code}</span>}
                                        <div className="text-right mt-1">
                                            <span className="text-xs text-gray-500">Didn't receive it? </span>
                                            <button type="button" className="text-xs text-[#1A56DB] font-bold hover:underline">Resend</button>
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full h-12 bg-[#1A56DB] text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-md active:scale-95">Verify</button>
                                </form>
                            )}

                            {/* === STEP 3: NEW PASSWORD === */}
                            {step === 3 && (
                                <form onSubmit={handlePasswordReset} className="flex flex-col gap-6">
                                    {/* New Password */}
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"><Lock className="w-5 h-5" /></div>
                                        <input 
                                            type={showPass ? "text" : "password"} 
                                            placeholder="Create Password" 
                                            value={passwords.newPassword}
                                            onChange={(e) => { setPasswords({...passwords, newPassword: e.target.value}); setErrors({...errors, newPassword: ''}); }}
                                            dir="ltr"
                                            className={`w-full h-12 pl-12 pr-12 border rounded-xl outline-none transition text-gray-700
                                                ${errors.newPassword ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:border-[#1A56DB] focus:ring-1 focus:ring-[#1A56DB]'}`}
                                        />
                                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#1A56DB]">
                                            {showPass ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                        </button>
                                        {errors.newPassword && <span className="text-red-500 text-xs ml-1 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.newPassword}</span>}
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"><Lock className="w-5 h-5" /></div>
                                        <input 
                                            type={showConfirm ? "text" : "password"} 
                                            placeholder="Re-enter Password" 
                                            value={passwords.confirmPassword}
                                            onChange={(e) => { setPasswords({...passwords, confirmPassword: e.target.value}); setErrors({...errors, confirmPassword: ''}); }}
                                            dir="ltr"
                                            className={`w-full h-12 pl-12 pr-12 border rounded-xl outline-none transition text-gray-700
                                                ${errors.confirmPassword ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:border-[#1A56DB] focus:ring-1 focus:ring-[#1A56DB]'}`}
                                        />
                                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#1A56DB]">
                                            {showConfirm ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                        </button>
                                        {errors.confirmPassword && <span className="text-red-500 text-xs ml-1 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.confirmPassword}</span>}
                                    </div>

                                    <button type="submit" className="w-full h-12 bg-[#1A56DB] text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-md active:scale-95">Set Password</button>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ====== اليمين: الصورة الجانبية (تتغير ديناميكياً) ====== */}
            {step !== 4 && (
                <div className="hidden lg:flex w-[40%] bg-[#3245FF] relative items-center justify-center overflow-hidden transition-all duration-500">
                    <div className="absolute inset-0 opacity-20"><svg viewBox="0 0 500 500" className="w-full h-full"><path d="M0,100 C150,200 350,0 500,100 L500,500 L0,500 Z" fill="white" /></svg></div>
                    
                    <div className="relative z-10 w-[80%] h-[75%]">
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-md rounded-[45px] border border-white/20"></div>
                        
                        {/* نص عائم فوق الصورة */}
                        <div className="absolute top-12 left-10 z-30 max-w-[280px] animate-fadeIn">
                            <h2 className="text-2xl font-bold text-white mb-4 leading-relaxed">
                                {step === 1 && "Recover Access"}
                                {step === 2 && "Secure Account"}
                                {step === 3 && "Create New Password"}
                            </h2>
                        </div>

                        <div className="relative w-full h-full overflow-hidden rounded-[45px] flex items-center justify-center">
                            {/* الصورة تتغير بناءً على الحالة */}
                            <img 
                                src={sideInfo.img} 
                                alt="Security" 
                                className="w-full h-full object-cover opacity-90 transition-opacity duration-500"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PasswordRecovery;