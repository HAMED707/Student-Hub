import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronRight, Check, AlertCircle } from 'lucide-react';

// ==========================================
// 1. المكونات الفرعية (يجب أن تكون خارج المكون الرئيسي)
// ==========================================

// مكون حقل إدخال موحد
const InputField = ({ label, name, type = "text", placeholder, value, onChange, maxLength, error }) => (
    <div className="flex flex-col gap-2 w-full">
        <label className="text-sm font-bold text-gray-700">{label}</label>
        <div className="relative">
            <input 
                type={type} 
                name={name} 
                value={value} 
                onChange={onChange} 
                placeholder={placeholder} 
                maxLength={maxLength}
                className={`w-full h-12 px-4 border rounded-lg outline-none transition text-gray-700 placeholder-gray-400
                    ${error ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:border-[#1A56DB] focus:ring-1 focus:ring-[#1A56DB]'}`} 
            />
            {error && (
                <div className="flex items-center gap-1 mt-1 text-red-500 text-xs animate-fadeIn">
                    <AlertCircle className="w-3 h-3" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    </div>
);

// مكون قائمة منسدلة موحد
const SelectField = ({ label, name, value, onChange, options, placeholder, disabled = false, error }) => (
    <div className="flex flex-col gap-2 w-full">
        <label className="text-sm font-bold text-gray-700">{label}</label>
        <div className="relative w-full">
            <select 
                name={name} 
                value={value} 
                onChange={onChange} 
                disabled={disabled}
                className={`w-full h-12 px-4 border rounded-lg appearance-none outline-none cursor-pointer transition 
                    ${disabled ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700'}
                    ${error ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#1A56DB]'}`}
            >
                <option value="">{placeholder}</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
        </div>
        {error && (
            <div className="flex items-center gap-1 mt-1 text-red-500 text-xs animate-fadeIn">
                <AlertCircle className="w-3 h-3" />
                <span>{error}</span>
            </div>
        )}
    </div>
);

// ==========================================
// بيانات القوائم
// ==========================================
const egyptData = {
    "Cairo": ["Nasr City", "Maadi", "Heliopolis", "New Cairo"],
    "Giza": ["6th of October", "Dokki", "Mohandessin"],
    "Alexandria": ["Smouha", "Miami"],
};

const universities = ["Cairo University", "Ain Shams University", "EELU", "AUC", "GUC"];
const majors = ["Computer Science", "Engineering", "Business", "Medicine", "Pharmacy"];
const academicYears = ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Graduated"];

// ==========================================
// 2. المكون الرئيسي
// ==========================================
const StudentRegister = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', gender: '', phone: '', dob: '', nationalId: '', governorate: '', city: '',
        university: '', academicYear: '', major: '',
        email: '', password: '', confirmPassword: ''
    });

    const [errors, setErrors] = useState({});
    const [availableCities, setAvailableCities] = useState([]);
    const [submitError, setSubmitError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }

        if (name === 'governorate') {
            setAvailableCities(egyptData[value] || []);
            setFormData(prev => ({ ...prev, governorate: value, city: '' }));
        }
    };

    const validateStep = (step) => {
        let newErrors = {};
        let isValid = true;

        if (step === 1) {
            if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
            if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
            if (!formData.gender) newErrors.gender = "Gender is required";
            if (!formData.phone) newErrors.phone = "Phone is required";
            if (!formData.dob) newErrors.dob = "Date of birth is required";
            if (!formData.nationalId) newErrors.nationalId = "National ID is required";
            else if (!/^\d{14}$/.test(formData.nationalId)) newErrors.nationalId = "Must be exactly 14 digits";
            if (!formData.governorate) newErrors.governorate = "Governorate is required";
            if (!formData.city) newErrors.city = "City is required";
        }

        if (step === 2) {
            if (!formData.university) newErrors.university = "University is required";
            if (!formData.academicYear) newErrors.academicYear = "Academic Year is required";
            if (!formData.major) newErrors.major = "Major is required";
        }

        if (step === 3) {
            if (!formData.email.trim()) newErrors.email = "Email is required";
            else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email";
            
            if (!formData.password) newErrors.password = "Password is required";
            else if (formData.password.length < 6) newErrors.password = "Min 6 characters";

            if (formData.confirmPassword !== formData.password) newErrors.confirmPassword = "Passwords do not match";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            isValid = false;
        }

        return isValid;
    };

    const handleNext = () => { 
        if (!validateStep(currentStep)) return;
        if (currentStep < 3) {
            setCurrentStep(prev => prev + 1);
            return;
        }
        setSubmitError('');
        setIsSubmitting(true);
        // No backend for now: save user locally and redirect
        const user = {
            username: formData.email,
            password: formData.password,
            ...formData,
        };
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('role', 'student');
        setIsSubmitting(false);
        navigate('/home');
    };

    const handleBack = () => { 
        setErrors({}); 
        if (currentStep > 1) setCurrentStep(prev => prev - 1); 
    };

    return (
        <div className="flex h-screen w-full bg-white overflow-hidden font-sans">
            
            {/* الجزء الأيسر: النموذج */}
            <div className="w-full lg:w-[60%] flex flex-col h-full relative">
                
                {/* زر العودة العلوي */}
                <div className="px-12 md:px-20 pt-8 shrink-0">
                     <button 
                        onClick={() => navigate(-1)}
                        className={`text-gray-500 hover:text-[#1A56DB] transition-colors ${currentStep === 1 ? 'block' : 'invisible'}`}
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                </div>

                {/* المحتوى في المنتصف (justify-center) */}
                <div className="flex-1 flex flex-col justify-center px-12 md:px-20 overflow-y-auto custom-scrollbar">
                    <div className="w-full max-w-4xl mx-auto">
                        
                        {/* Step 1 */}
                        {currentStep === 1 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                                <InputField label="First name" name="firstName" placeholder="Enter First name" value={formData.firstName} onChange={handleChange} error={errors.firstName} />
                                <InputField label="Last name" name="lastName" placeholder="Enter Last name" value={formData.lastName} onChange={handleChange} error={errors.lastName} />
                                <SelectField label="Gender" name="gender" placeholder="Enter the Gender" value={formData.gender} onChange={handleChange} options={["Male", "Female"]} error={errors.gender} />
                                <InputField label="Phone" name="phone" placeholder="Enter the Phone" value={formData.phone} onChange={handleChange} error={errors.phone} />
                                <InputField label="Date of birth" name="dob" type="date" value={formData.dob} onChange={handleChange} error={errors.dob} />
                                <InputField label="National ID" name="nationalId" placeholder="Enter 14 Digits ID" value={formData.nationalId} onChange={handleChange} maxLength={14} error={errors.nationalId} />
                                <SelectField label="Governorate" name="governorate" placeholder="Enter the Governorate" value={formData.governorate} onChange={handleChange} options={Object.keys(egyptData)} error={errors.governorate} />
                                <SelectField label="City" name="city" placeholder="Enter the City" value={formData.city} onChange={handleChange} options={availableCities} disabled={!formData.governorate} error={errors.city} />
                            </div>
                        )}

                        {/* Step 2 */}
                        {currentStep === 2 && (
                            <div className="flex flex-col gap-6 animate-fadeIn">
                                <SelectField label="University" name="university" placeholder="Choose your university" value={formData.university} onChange={handleChange} options={universities} error={errors.university} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <SelectField label="Academic Year" name="academicYear" placeholder="Year 1-5" value={formData.academicYear} onChange={handleChange} options={academicYears} error={errors.academicYear} />
                                    <SelectField label="Major / Department" name="major" placeholder="Choose your Major" value={formData.major} onChange={handleChange} options={majors} error={errors.major} />
                                </div>
                            </div>
                        )}

                        {/* Step 3 (Passwords Working Now) */}
                        {currentStep === 3 && (
                            <div className="flex flex-col gap-6 animate-fadeIn">
                                <InputField label="Email" name="email" type="email" placeholder="Enter the Email" value={formData.email} onChange={handleChange} error={errors.email} />
                                <InputField label="Password" name="password" type="password" placeholder="Enter the Password" value={formData.password} onChange={handleChange} error={errors.password} />
                                <InputField label="Confirm password" name="confirmPassword" type="password" placeholder="Enter the Confirm password" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />
                            </div>
                        )}

                        {submitError && currentStep === 3 && (
                            <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{submitError}</span>
                            </div>
                        )}

                        {/* الأزرار (قريبة من الحقول) */}
                        <div className="flex justify-between items-center mt-10 mb-2 w-full">
                            <button 
                                onClick={handleBack}
                                disabled={isSubmitting}
                                className={`flex items-center gap-2 bg-gray-100 text-gray-700 border border-gray-300 px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition disabled:opacity-50 ${currentStep === 1 ? 'invisible' : 'visible'}`}
                            >
                                <ArrowLeft className="w-5 h-5" /> Back
                            </button>

                            <button 
                                onClick={handleNext}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 bg-[#1A56DB] text-white px-10 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-md hover:shadow-lg transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {currentStep === 3 ? (isSubmitting ? "Creating…" : "Create Account") : "NEXT"} <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer: شريط التقدم فقط */}
                <div className="px-12 md:px-20 pb-8 pt-2 bg-white shrink-0">
                    <div className="flex items-center justify-center w-full">
                        <div className="flex items-center w-full max-w-lg relative">
                            {/* Steps Indicators (Same as before) */}
                            <div className="flex flex-col items-center relative z-10">
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 ${currentStep > 1 ? 'bg-[#1A56DB]' : 'border-2 border-[#1A56DB] bg-white'}`}>
                                    {currentStep > 1 ? <Check className="w-3 h-3 text-white" /> : <div className="w-2 h-2 rounded-full bg-[#1A56DB]"></div>}
                                </div>
                                <span className="absolute -bottom-6 text-[10px] font-bold text-[#1A56DB] whitespace-nowrap">Basic Information</span>
                            </div>
                            <div className={`h-[1px] flex-1 mx-2 transition-all duration-500 ${currentStep > 1 ? 'bg-[#1A56DB]' : 'bg-gray-300'}`}></div>

                            <div className="flex flex-col items-center relative z-10">
                                <div className={`w-3 h-3 rounded-full flex items-center justify-center transition-all duration-300 ${currentStep > 2 ? 'bg-[#1A56DB]' : (currentStep === 2 ? 'w-4 h-4 border-2 border-[#1A56DB] bg-white' : 'bg-gray-300')}`}>
                                    {currentStep > 2 ? <Check className="w-2 h-2 text-white" /> : (currentStep === 2 && <div className="w-2 h-2 rounded-full bg-[#1A56DB]"></div>)}
                                </div>
                                <span className={`absolute -bottom-6 text-[10px] font-bold whitespace-nowrap transition-colors ${currentStep >= 2 ? 'text-[#1A56DB]' : 'text-gray-400'}`}>Academic Information</span>
                            </div>
                            <div className={`h-[1px] flex-1 mx-2 transition-all duration-500 ${currentStep > 2 ? 'bg-[#1A56DB]' : 'bg-gray-300'}`}></div>

                            <div className="flex flex-col items-center relative z-10">
                                <div className={`w-3 h-3 rounded-full flex items-center justify-center transition-all duration-300 ${currentStep === 3 ? 'w-4 h-4 border-2 border-[#1A56DB] bg-white' : 'bg-gray-300'}`}>
                                    {currentStep === 3 && <div className="w-2 h-2 rounded-full bg-[#1A56DB]"></div>}
                                </div>
                                <span className={`absolute -bottom-6 text-[10px] font-bold whitespace-nowrap transition-colors ${currentStep === 3 ? 'text-[#1A56DB]' : 'text-gray-400'}`}>Password</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* الجزء الأيمن: الصورة */}
            <div className="hidden lg:flex w-[40%] bg-[#3245FF] relative items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <svg viewBox="0 0 500 500" className="w-full h-full"><path d="M0,100 C150,200 350,0 500,100 L500,500 L0,500 Z" fill="white" /></svg>
                </div>
                <div className="relative z-10 w-[80%] h-[75%]">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-md rounded-[45px] border border-white/20"></div>
                    <div className="absolute top-12 left-10 z-30 max-w-[250px]">
                        <h2 className="text-2xl font-bold text-white mb-4">Create Student Account</h2>
                        <p className="text-sm text-blue-100/80 leading-relaxed">Provide your details to find housing, match with roommates, and access student services.</p>
                    </div>
                    <div className="relative w-full h-full overflow-hidden rounded-[45px]">
                        <img src="https://picsum.photos/seed/student-register/1500/900" alt="Student" className="w-full h-full object-cover object-top opacity-90" />
                    </div>
                    <div className="absolute -left-8 bottom-24 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl z-40">
                        <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-white">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M13,10V3L4,14H11V21L20,10H13Z" /></svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentRegister;