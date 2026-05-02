import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Briefcase, ArrowLeft } from 'lucide-react';

const JoinPage = () => {
    const navigate = useNavigate();

    return (
        <div className="flex h-screen w-full bg-white overflow-hidden font-sans">
            
            {/* الجزء الأيسر: خيارات التسجيل */}
            <div className="w-full lg:w-[50%] flex flex-col justify-center px-12 md:px-24 relative bg-white">
                
                {/* زر العودة */}
                <button 
                    onClick={() => navigate(-1)}
                    className="absolute top-8 left-10 text-blue-600 hover:scale-110 transition-transform"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>

                <div className="max-w-md mx-auto">
                    <h1 className="text-3xl font-extrabold text-black mb-2">Join Us!</h1>
                    <p className="text-gray-400 text-sm mb-10">
                        To begin this journey, tell us what type of account you'd like to open.
                    </p>

                    <div className="space-y-4">
                        {/* بطاقة طالب */}
                        <div 
                            onClick={() => navigate('/student-setup')} 
                            className="flex items-center gap-4 p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-500 cursor-pointer transition-all group"
                        >
                            <div className="text-blue-600 group-hover:scale-110 transition-transform">
                                <GraduationCap className="w-7 h-7" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-black">Student Account</h2>
                                <p className="text-xs text-gray-400">Personal account to find and manage your housing.</p>
                            </div>
                        </div>

                        {/* ✅ بطاقة صاحب عقار (تم التصحيح هنا) */}
                        <div 
                            onClick={() => navigate('/register/landlord')} 
                            className="flex items-center gap-4 p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-500 cursor-pointer transition-all group"
                        >
                            <div className="text-blue-600 group-hover:scale-110 transition-transform">
                                <Briefcase className="w-7 h-7" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-black">Landlord Account</h2>
                                <p className="text-xs text-gray-400">Owner account to list and manage your properties.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-center text-gray-400 text-sm">
                        Already have an account? 
                        <button onClick={() => navigate('/login')} className="text-blue-600 font-bold ml-1 hover:underline">
                            Sign In
                        </button>
                    </div>
                </div>
            </div>

            {/* الجزء الأيمن: الخلفية */}
            <div className="hidden lg:flex w-[50%] bg-[#3245FF] relative items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <svg viewBox="0 0 500 500" preserveAspectRatio="none" className="w-full h-full">
                        <path d="M0,100 C150,200 350,0 500,100 L500,500 L0,500 Z" fill="white" />
                    </svg>
                </div>
                <div className="relative z-10 w-[70%] h-[70%]">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-md rounded-[50px] border border-white/20"></div>
                    <div className="relative w-full h-full p-4 overflow-hidden rounded-[50px]">
                        <img 
                            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1200&auto=format&fit=crop" 
                            alt="Welcome" 
                            className="w-full h-full object-cover rounded-[40px]"
                        />
                    </div>
                    <div className="absolute -left-8 bottom-20 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl z-20">
                        <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-white">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M13,10V3L4,14H11V21L20,10H13Z" /></svg>
                        </div>
                    </div>
                </div>
            </div>
            
        </div>
    );
};

export default JoinPage;