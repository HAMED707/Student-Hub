import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronRight, Check, AlertCircle, Upload } from 'lucide-react';

// === المكونات الفرعية (خارج المكون الرئيسي) ===

const InputField = ({ label, name, type = "text", placeholder, value, onChange, maxLength, error }) => (
    <div className="flex flex-col gap-2 w-full">
        <label className="text-sm font-bold text-gray-700">{label}</label>
        <div className="relative">
            <input 
                type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} maxLength={maxLength}
                className={`w-full h-12 px-4 border rounded-lg outline-none transition text-gray-700 placeholder-gray-400
                    ${error ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#1A56DB] focus:ring-1 focus:ring-[#1A56DB]'}`} 
            />
            {error && <div className="flex items-center gap-1 mt-1 text-red-500 text-xs animate-fadeIn"><AlertCircle className="w-3 h-3" /> <span>{error}</span></div>}
        </div>
    </div>
);

const SelectField = ({ label, name, value, onChange, options, placeholder, disabled = false, error }) => (
    <div className="flex flex-col gap-2 w-full">
        <label className="text-sm font-bold text-gray-700">{label}</label>
        <div className="relative w-full">
            <select 
                name={name} value={value} onChange={onChange} disabled={disabled}
                className={`w-full h-12 px-4 border rounded-lg appearance-none outline-none cursor-pointer transition 
                    ${disabled ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700'}
                    ${error ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#1A56DB]'}`}
            >
                <option value="">{placeholder}</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
        </div>
        {error && <div className="flex items-center gap-1 mt-1 text-red-500 text-xs"><AlertCircle className="w-3 h-3" /> <span>{error}</span></div>}
    </div>
);

const FileField = ({ label, name, onChange, error, fileName }) => (
    <div className="flex flex-col gap-2 w-full">
        <label className="text-sm font-bold text-gray-700">{label}</label>
        <div className="relative">
            <label className={`flex items-center justify-between w-full h-14 px-4 border rounded-lg cursor-pointer transition bg-white
                ${error ? 'border-red-500' : 'border-gray-300 hover:border-[#1A56DB]'}`}>
                <span className={`text-sm ${fileName ? 'text-gray-800' : 'text-gray-400'}`}>
                    {fileName || "Choose File"}
                </span>
                <div className="bg-[#1A56DB] text-white text-xs px-4 py-2 rounded-md font-bold">Upload</div>
                <input type="file" name={name} onChange={onChange} className="hidden" accept="image/*,.pdf" />
            </label>
            {error && <div className="flex items-center gap-1 mt-1 text-red-500 text-xs"><AlertCircle className="w-3 h-3" /> <span>{error}</span></div>}
        </div>
    </div>
);

// === المكون الرئيسي ===

const egyptData = { "Cairo": ["Nasr City", "Maadi"], "Giza": ["Dokki", "Haram"], "Alexandria": ["Smouha"] };

const LandlordRegister = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', gender: '', phone: '', dob: '', nationalId: '', governorate: '', city: '',
        idFront: null, profilePhoto: null,
        email: '', password: '', confirmPassword: ''
    });

    const [fileNames, setFileNames] = useState({ idFront: '', profilePhoto: '' });
    const [errors, setErrors] = useState({});
    const [availableCities, setAvailableCities] = useState([]);
    const [submitError, setSubmitError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (files) {
            if (files[0]) {
                setFormData(prev => ({ ...prev, [name]: files[0] }));
                setFileNames(prev => ({ ...prev, [name]: files[0].name }));
                if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
            if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
            if (name === 'governorate') {
                setAvailableCities(egyptData[value] || []);
                setFormData(prev => ({ ...prev, governorate: value, city: '' }));
            }
        }
    };

    const validateStep = (step) => {
        let newErrors = {};
        let isValid = true;
        if (step === 1) {
            if (!formData.firstName.trim()) newErrors.firstName = "Required";
            if (!formData.lastName.trim()) newErrors.lastName = "Required";
            if (!formData.gender) newErrors.gender = "Required";
            if (!formData.phone) newErrors.phone = "Required";
            if (!formData.dob) newErrors.dob = "Required";
            if (!formData.nationalId) newErrors.nationalId = "Required";
            else if (!/^\d{14}$/.test(formData.nationalId)) newErrors.nationalId = "Must be 14 digits";
            if (!formData.governorate) newErrors.governorate = "Required";
            if (!formData.city) newErrors.city = "Required";
        }
        if (step === 2) {
            if (!formData.idFront) newErrors.idFront = "ID (Front) is required";
            if (!formData.profilePhoto) newErrors.profilePhoto = "Profile photo is required";
        }
        if (step === 3) {
            if (!formData.email.trim()) newErrors.email = "Required";
            else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid Email";
            if (!formData.password) newErrors.password = "Required";
            else if (formData.password.length < 6) newErrors.password = "Min 6 chars";
            if (formData.confirmPassword !== formData.password) newErrors.confirmPassword = "Passwords mismatch";
        }
        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); isValid = false; }
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
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            gender: formData.gender,
            phone: formData.phone,
            dob: formData.dob,
            nationalId: formData.nationalId,
            governorate: formData.governorate,
            city: formData.city,
        };
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('role', 'landlord');
        setIsSubmitting(false);
        navigate('/home');
    };
    const handleBack = () => { setErrors({}); if (currentStep > 1) setCurrentStep(prev => prev - 1); };

    return (
        <div className="flex h-screen w-full bg-white overflow-hidden font-sans">
            <div className="w-full lg:w-[60%] flex flex-col h-full relative">
                
                {/* Header: زر العودة */}
                <div className="px-12 md:px-20 pt-8 shrink-0">
                     <button onClick={() => navigate(-1)} className={`text-gray-500 hover:text-[#1A56DB] transition-colors ${currentStep === 1 ? 'block' : 'invisible'}`}><ArrowLeft className="w-6 h-6" /></button>
                </div>

                {/* Body: المحتوى */}
                <div className="flex-1 flex flex-col justify-center px-12 md:px-20 overflow-y-auto custom-scrollbar">
                    <div className="w-full max-w-4xl mx-auto">
                        {currentStep === 1 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                                <InputField label="First name" name="firstName" placeholder="Enter First name" value={formData.firstName} onChange={handleChange} error={errors.firstName} />
                                <InputField label="Last name" name="lastName" placeholder="Enter Last name" value={formData.lastName} onChange={handleChange} error={errors.lastName} />
                                <SelectField label="Gender" name="gender" placeholder="Select Gender" value={formData.gender} onChange={handleChange} options={["Male", "Female"]} error={errors.gender} />
                                <InputField label="Phone" name="phone" placeholder="Enter Phone" value={formData.phone} onChange={handleChange} error={errors.phone} />
                                <InputField label="Date of birth" name="dob" type="date" value={formData.dob} onChange={handleChange} error={errors.dob} />
                                <InputField label="National ID" name="nationalId" placeholder="14 Digits ID" value={formData.nationalId} onChange={handleChange} maxLength={14} error={errors.nationalId} />
                                <SelectField label="Governorate" name="governorate" placeholder="Select" value={formData.governorate} onChange={handleChange} options={Object.keys(egyptData)} error={errors.governorate} />
                                <SelectField label="City" name="city" placeholder="Select" value={formData.city} onChange={handleChange} options={availableCities} disabled={!formData.governorate} error={errors.city} />
                            </div>
                        )}
                        {currentStep === 2 && (
                            <div className="flex flex-col gap-8 animate-fadeIn">
                                <FileField label="Upload ID (Front)" name="idFront" onChange={handleChange} error={errors.idFront} fileName={fileNames.idFront} />
                                <FileField label="Upload Profile Photos" name="profilePhoto" onChange={handleChange} error={errors.profilePhoto} fileName={fileNames.profilePhoto} />
                            </div>
                        )}
                        {currentStep === 3 && (
                            <div className="flex flex-col gap-6 animate-fadeIn">
                                <InputField label="Email" name="email" type="email" placeholder="Enter Email" value={formData.email} onChange={handleChange} error={errors.email} />
                                <InputField label="Password" name="password" type="password" placeholder="Enter Password" value={formData.password} onChange={handleChange} error={errors.password} />
                                <InputField label="Confirm password" name="confirmPassword" type="password" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />
                            </div>
                        )}
                        
                        {submitError && currentStep === 3 && (
                            <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{submitError}</span>
                            </div>
                        )}

                        {/* الأزرار */}
                        <div className="flex justify-between items-center mt-10 mb-2 w-full">
                            <button onClick={handleBack} disabled={isSubmitting} className={`flex items-center gap-2 bg-gray-100 text-gray-700 border border-gray-300 px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition disabled:opacity-50 ${currentStep === 1 ? 'invisible' : 'visible'}`}><ArrowLeft className="w-5 h-5" /> Back</button>
                            <button onClick={handleNext} disabled={isSubmitting} className="flex items-center gap-2 bg-[#1A56DB] text-white px-10 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-md hover:shadow-lg transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">{currentStep === 3 ? (isSubmitting ? "Creating…" : "Create Account") : "NEXT"} <ChevronRight className="w-5 h-5" /></button>
                        </div>
                    </div>
                </div>

                {/* Footer: شريط التقدم */}
                <div className="px-12 md:px-20 pb-8 pt-2 bg-white shrink-0">
                    <div className="flex items-center justify-center w-full mt-2">
                        <div className="flex items-center w-full max-w-lg relative">
                            <div className="flex flex-col items-center relative z-10">
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 ${currentStep > 1 ? 'bg-[#1A56DB]' : 'border-2 border-[#1A56DB] bg-white'}`}>{currentStep > 1 ? <Check className="w-3 h-3 text-white" /> : <div className="w-2 h-2 rounded-full bg-[#1A56DB]"></div>}</div>
                                <span className="absolute -bottom-6 text-[10px] font-bold text-[#1A56DB]">Basic Information</span>
                            </div>
                            <div className={`h-[1px] flex-1 mx-2 ${currentStep > 1 ? 'bg-[#1A56DB]' : 'bg-gray-300'}`}></div>
                            <div className="flex flex-col items-center relative z-10">
                                <div className={`w-3 h-3 rounded-full flex items-center justify-center transition-all duration-300 ${currentStep > 2 ? 'bg-[#1A56DB]' : (currentStep === 2 ? 'w-4 h-4 border-2 border-[#1A56DB] bg-white' : 'bg-gray-300')}`}>{currentStep > 2 ? <Check className="w-2 h-2 text-white" /> : (currentStep === 2 && <div className="w-2 h-2 rounded-full bg-[#1A56DB]"></div>)}</div>
                                <span className={`absolute -bottom-6 text-[10px] font-bold ${currentStep >= 2 ? 'text-[#1A56DB]' : 'text-gray-400'}`}>Documents</span>
                            </div>
                            <div className={`h-[1px] flex-1 mx-2 ${currentStep > 2 ? 'bg-[#1A56DB]' : 'bg-gray-300'}`}></div>
                            <div className="flex flex-col items-center relative z-10">
                                <div className={`w-3 h-3 rounded-full flex items-center justify-center transition-all duration-300 ${currentStep === 3 ? 'w-4 h-4 border-2 border-[#1A56DB] bg-white' : 'bg-gray-300'}`}>{currentStep === 3 && <div className="w-2 h-2 rounded-full bg-[#1A56DB]"></div>}</div>
                                <span className={`absolute -bottom-6 text-[10px] font-bold ${currentStep === 3 ? 'text-[#1A56DB]' : 'text-gray-400'}`}>Password</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* اليمين: صورة المالك */}
            <div className="hidden lg:flex w-[40%] bg-[#3245FF] relative items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-20"><svg viewBox="0 0 500 500" className="w-full h-full"><path d="M0,100 C150,200 350,0 500,100 L500,500 L0,500 Z" fill="white" /></svg></div>
                <div className="relative z-10 w-[80%] h-[75%]">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-md rounded-[45px] border border-white/20"></div>
                    <div className="absolute top-12 left-10 z-30 max-w-[250px]">
                        <h2 className="text-2xl font-bold text-white mb-4">Create Landlord Account</h2>
                        <p className="text-sm text-blue-100/80 leading-relaxed">Provide your details to list and manage your properties.</p>
                    </div>
                    <div className="relative w-full h-full overflow-hidden rounded-[45px]">
                        <img src="https://picsum.photos/seed/landlord-register/1200/900" alt="Landlord" className="w-full h-full object-cover object-top opacity-90" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandlordRegister;