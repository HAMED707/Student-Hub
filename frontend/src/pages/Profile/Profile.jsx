import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "../../assets/components/Navbar/Navbar.jsx";
import { 
  Settings, 
  Edit3, 
  UploadCloud, 
  AlertCircle, 
  ShieldCheck, 
  Star, 
  MessageCircle, 
  MoreHorizontal,
  MapPin,
  Trash2,
  Flag,
  UserCheck,
  UserX
} from 'lucide-react';

const myData = {
  name: "Mathew Perry",
  email: "mathewperry@xyz.com",
  avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
  cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop", 
  
  status: "Looking for a roommate",
  profileCompleteness: 85,
  
  rating: {
    average: 4.8,
    totalReviews: 12
  },
  
  basicInfo: [
    { label: "Full Name", value: "Mathew Perry" },
    { label: "Location", value: "Nasr City, Cairo" },
    { label: "University", value: "EELU" },
    { label: "Faculty / Major", value: "Computers and Information Technology" },
    { label: "Academic Year", value: "4th" }
  ],
  
  interests: [
    { label: "Sleeping Time", value: "Normal" },
    { label: "Study Environment", value: "With Music" },
    { label: "Routine", value: "Morning" },
    { label: "Guests Frequency", value: "Sometimes" },
    { label: "Personality Type", value: "Quiet" },
    { label: "Cleanliness Level", value: "Medium" },
    { label: "Room Type", value: "Single , Shared" },
    { label: "Smoking Status", value: "Non-Smoker" },
    { label: "Budget Range", value: "1000-2500 EGP" }
  ],

  personalPreferences: [
    { label: "Budget Range", value: "1000-2000 EGP" },
    { label: "Preferred Room Type", value: "Single / Shared" },
    { label: "Smoking Preference", value: "Non-smoker" },
    { label: "Sleeping Schedule", value: "Early" },
    { label: "Cleanliness Level", value: "Medium" },
    { label: "Personality Type", value: "Quiet" }
  ],

  reviews: [
    {
      id: 1,
      author: "Kim Jhone",
      role: "Landlord",
      score: 5,
      date: "2 weeks ago",
      text: "Mathew is an exceptional tenant. Always pays rent on time and keeps the apartment in perfect condition.",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg"
    },
    {
      id: 2,
      author: "Ruri Kyla",
      role: "Roommate",
      score: 4,
      date: "1 month ago",
      text: "Quiet and clean roommate. We studied together often, and he respects personal space. Highly recommend!",
      avatar: "https://randomuser.me/api/portraits/women/65.jpg"
    },
    {
      id: 3,
      author: "Ahmed Ali",
      role: "Roommate",
      score: 5,
      date: "3 months ago",
      text: "Great experience sharing an apartment with him. Very respectful and organized person.",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg"
    }
  ],

  verification: [
    { label: "National ID", status: "Verified", isVerified: true },
    { label: "Student ID", status: "Pending", isVerified: false },
    { label: "University Email", status: "Verified", isVerified: true }
  ]
};

const InfoField = ({ label, value }) => (
  <div className="flex flex-col mb-4 group">
    <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1.5 ml-1 group-hover:text-blue-600 transition-colors">
      {label}
    </label>
    <div className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 bg-white shadow-sm hover:border-gray-300 hover:shadow transition-all duration-200 w-full break-words">
      {value}
    </div>
  </div>
);

const SectionCard = ({ title, actionLabel, onAction, children }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 hover:shadow-md transition-shadow duration-300">
    <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-5">
      <h3 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h3>
      {actionLabel && (
        <button 
          onClick={onAction} 
          className="text-sm font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100/70 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
        >
          <Edit3 className="w-3.5 h-3.5" /> {actionLabel}
        </button>
      )}
    </div>
    {children}
  </div>
);

const ReplyBox = ({ onSubmit, onCancel }) => {
  const [text, setText] = useState('');
  return (
    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 shadow-inner mt-2 animate-fadeIn">
      <textarea 
        value={text} 
        onChange={(e) => setText(e.target.value)} 
        rows={3} 
        className="w-full p-2.5 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" 
        placeholder="Write a professional reply..."
      />
      <div className="flex justify-end gap-2 mt-2">
        <button onClick={onCancel} className="px-3 py-1.5 text-gray-500 hover:text-gray-700 font-medium rounded-lg text-xs transition-colors">
          Cancel
        </button>
        <button 
          onClick={() => { if(text.trim()) { onSubmit(text); setText(''); } }} 
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-colors"
        >
          Send Reply
        </button>
      </div>
    </div>
  );
};

const MyProfile = () => {
  const navigate = useNavigate();
  const [cover, setCover] = useState(myData.cover);
  const [avatar, setAvatar] = useState(myData.avatar);
  const [status, setStatus] = useState(myData.status);
  
  const coverInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const docInputRef = useRef(null);
  
  const [openReplyFor, setOpenReplyFor] = useState(null);
  const [activeOptionsFor, setActiveOptionsFor] = useState(null);
  const [replies, setReplies] = useState({});
  const [docs, setDocs] = useState([]);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    return () => {
      if (cover.startsWith('blob:')) URL.revokeObjectURL(cover);
      if (avatar.startsWith('blob:')) URL.revokeObjectURL(avatar);
      docs.forEach(d => { if (d.url.startsWith('blob:')) URL.revokeObjectURL(d.url); });
    };
  }, [cover, avatar, docs]);

  const handleFileUpload = (e, setImgState) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const newUrl = URL.createObjectURL(file);
      setImgState((prev) => {
        if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
        return newUrl;
      });
    }
  };

  const handleDocUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setDocs((d) => [...d, { name: file.name, url: URL.createObjectURL(file) }]);
  };

  const handleReplySubmit = (id, text) => {
    if (!text || !text.trim()) return;
    setReplies((r) => ({ 
      ...r, 
      [id]: [...(r[id] || []), { author: 'You (Account Owner)', text, date: 'Just now' }] 
    }));
    setOpenReplyFor(null);
  };

  const showPosition = () => {
    if (navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => alert(`Your Verified Coordinates:\nLatitude: ${pos.coords.latitude}\nLongitude: ${pos.coords.longitude}`),
        () => alert('Unable to fetch location. Please check browser permissions.')
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const displayedReviews = showAllReviews ? myData.reviews : myData.reviews.slice(0, 2);

  return (
    <div className="min-h-screen bg-[#f4f7f9] font-sans pb-20 antialiased selection:bg-blue-500 selection:text-white">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6">
        
        {/* Header Container */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
          {/* Cover Image Wrapper */}
          <div className="h-52 w-full relative bg-gray-900 group">
            <img src={cover} alt="Cover" className="w-full h-full object-cover opacity-85 group-hover:opacity-75 transition-opacity duration-300" />
            
            <div className="absolute top-4 right-4 z-20">
              <button 
                onClick={() => coverInputRef.current?.click()} 
                className="bg-black/40 hover:bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-2 border border-white/10"
              >
                <UploadCloud className="w-4 h-4"/> Change Cover
              </button>
              <input ref={coverInputRef} type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setCover)} className="hidden" />
            </div>

            {/* Status Select Badge */}
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur shadow-lg px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-gray-100 z-20">
              <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${status === "Looking for a roommate" ? "bg-green-500" : "bg-red-500"}`}></span>
              <span className="text-gray-500 text-xs font-semibold">Status:</span>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)} 
                className="bg-transparent outline-none text-xs font-bold text-gray-800 cursor-pointer pr-1"
              >
                <option value="Looking for a roommate">Looking for a roommate</option>
                <option value="Not looking">Not looking</option>
              </select>
            </div>
          </div>

          {/* Profile Details Area (تم إصلاح المسافات بالكامل هنا عبر تنظيم التدفق المباشر) */}
          <div className="px-6 md:px-10 pt-4 pb-8">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-5">
              
              {/* تجميع الصورة والنصوص بجانب بعضها بهيكل انسيابي متزن */}
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left w-full md:w-auto">
                {/* الأفاتار يرتفع للأعلى بمسافة سالبة محددة تمنع الفراغات الكبيرة */}
                <div className="relative group cursor-pointer shrink-0 -mt-20 z-10">
                  <img src={avatar} alt="Avatar" className="w-28 h-28 md:w-32 md:h-32 rounded-full border-[5px] border-white shadow-xl object-cover bg-white" />
                  <input ref={avatarInputRef} type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setAvatar)} className="hidden" />
                  <button 
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 border-[5px] border-transparent"
                  >
                    <UploadCloud className="w-6 h-6 text-white" />
                  </button>
                </div>

                {/* تفاصيل الاسم والبيانات تبدأ من نقطة محاذية ممتازة */}
                <div className="flex-1 min-w-0 pt-2">
                  <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                    {myData.name.split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}
                  </h1>
                  
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1.5">
                    <div onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })} className="flex items-center text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md cursor-pointer hover:bg-amber-100 transition-colors">
                      <Star className="w-3.5 h-3.5 fill-current mr-1" />
                      <span className="text-xs font-bold">{myData.rating.average}</span>
                    </div>
                    <span onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs font-semibold text-gray-500 cursor-pointer hover:underline">
                      ({myData.rating.totalReviews} Reviews)
                    </span>
                    <span className="text-gray-300 hidden sm:inline">•</span>
                    <p className="text-xs font-medium text-gray-400 break-all">{myData.email}</p>
                  </div>

                  {/* إشعار الحالة التفاعلي */}
                  <div className="mt-3 flex justify-center sm:justify-start">
                    {status === "Looking for a roommate" ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-100 text-green-700 rounded-xl text-xs font-bold animate-fadeIn">
                        <UserCheck className="w-4 h-4" /> Active: You will be suggested in the Roommate Matching dashboard.
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-500 rounded-xl text-xs font-bold animate-fadeIn">
                        <UserX className="w-4 h-4" /> Invisible: Hidden from the Roommate Matching recommendation queries.
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* أزرار التحكم الجانبية */}
              <div className="flex gap-3 w-full md:w-auto shrink-0 mt-2 md:mt-0">
                <button onClick={() => navigate('/edit-profile')} className="flex-1 md:flex-none bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 transition-all flex items-center justify-center gap-2">
                  <Edit3 className="w-4 h-4" /> Edit Profile
                </button>
                <button onClick={() => navigate('/settings')} className="bg-white border border-gray-200 text-gray-600 p-2.5 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* باقي أعضاء وعناصر الصفحة */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Column اليسار */}
          <div className="lg:col-span-8 space-y-2">
            
            <SectionCard title="Basic Information" actionLabel="Edit" onAction={() => navigate('/edit-profile')}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                {myData.basicInfo.map((info, idx) => {
                  if (info.label === "Location") {
                    return (
                      <div key={idx} className="relative group">
                        <InfoField label={info.label} value={info.value} />
                        <button 
                          onClick={showPosition} 
                          className="absolute right-3 top-7 text-xs bg-blue-50 border border-blue-100 hover:bg-blue-100 text-blue-600 px-2.5 py-1 rounded-lg transition-colors font-bold flex items-center gap-1"
                        >
                          <MapPin className="w-3 h-3" /> Pin GPS
                        </button>
                      </div>
                    );
                  }
                  return (
                    <div key={idx} className={info.label === "University" ? "md:col-span-2" : ""}>
                      <InfoField label={info.label} value={info.value} />
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard title="Interests & Lifestyle" actionLabel="Edit" onAction={() => navigate('/edit-profile')}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4">
                {myData.interests.map((item, idx) => (
                  <InfoField key={idx} label={item.label} value={item.value} />
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Personal Preferences" actionLabel="Edit" onAction={() => navigate('/edit-profile')}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4">
                {myData.personalPreferences.map((item, idx) => (
                  <InfoField key={idx} label={item.label} value={item.value} />
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Your Reviews & Ratings">
              <div id="reviews" className="space-y-4 scroll-mt-6">
                {displayedReviews.map((review) => (
                  <div key={review.id} className="p-5 rounded-2xl border border-gray-100 bg-gray-50/40 hover:bg-white hover:shadow-md hover:border-gray-200/60 transition-all duration-200 animate-fadeIn">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <img src={review.avatar} alt={review.author} className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100" />
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">{review.author}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md tracking-wide uppercase">{review.role}</span>
                            <span className="text-xs text-gray-400">{review.date}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < review.score ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}`} />
                        ))}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 leading-relaxed pl-1 italic">
                      "{review.text}"
                    </p>
                    
                    <div className="flex items-center gap-3 border-t border-gray-100 pt-3 mt-3 relative">
                      <button 
                        onClick={() => setOpenReplyFor(openReplyFor === review.id ? null : review.id)} 
                        className={`text-xs font-bold flex items-center gap-1.5 transition-colors ${openReplyFor === review.id ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'}`}
                      >
                        <MessageCircle className="w-4 h-4" /> Reply
                      </button>

                      <div className="ml-auto relative">
                        <button 
                          onClick={() => setActiveOptionsFor(activeOptionsFor === review.id ? null : review.id)}
                          className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        
                        {activeOptionsFor === review.id && (
                          <div className="absolute right-0 bottom-7 bg-white border border-gray-100 shadow-xl rounded-xl py-1.5 w-32 z-50">
                            <button onClick={() => { alert('Reported'); setActiveOptionsFor(null); }} className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 font-semibold flex items-center gap-2">
                              <Flag className="w-3.5 h-3.5" /> Report review
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {openReplyFor === review.id && (
                      <ReplyBox 
                        onSubmit={(text) => handleReplySubmit(review.id, text)} 
                        onCancel={() => setOpenReplyFor(null)} 
                      />
                    )}

                    {replies[review.id] && replies[review.id].map((r, idx) => (
                      <div key={idx} className="mt-3 ml-6 p-3.5 bg-blue-50/40 rounded-xl border border-blue-100/60 relative before:content-[''] before:absolute before:left-[-14px] before:top-4 before:w-3 before:h-[2px] before:bg-blue-200">
                        <div className="text-[11px] text-blue-800 font-extrabold flex items-center gap-1.5">
                          <span>{r.author}</span>
                          <span className="text-blue-300 font-normal">·</span>
                          <span className="text-gray-400 font-normal">{r.date}</span>
                        </div>
                        <div className="text-sm text-gray-700 mt-1 pl-0.5">{r.text}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <button 
                onClick={() => {
                  setShowAllReviews(!showAllReviews);
                  if (showAllReviews) {
                    document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }} 
                className="w-full mt-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl text-sm hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all"
              >
                {showAllReviews ? "Show Less Reviews" : `View All ${myData.rating.totalReviews} Reviews`}
              </button>
            </SectionCard>
          </div>

          {/* Column اليمين Widgets */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-1 tracking-tight">Profile Completeness</h3>
              <p className="text-xs text-gray-400 mb-4">Complete your account to stand out to potential roommates.</p>
              
              <div className="flex items-end gap-2 mb-2">
                <span className="text-3xl font-black text-blue-600 tracking-tight">{myData.profileCompleteness}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 mb-4 overflow-hidden">
                <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${myData.profileCompleteness}%` }}></div>
              </div>
              
              <ul className="text-xs space-y-2.5 text-gray-600 font-medium">
                <li className="flex items-center gap-2 text-green-600 bg-green-50 px-2.5 py-1.5 rounded-lg"><ShieldCheck className="w-4 h-4 shrink-0"/> Basic Info Added</li>
                <li className="flex items-center gap-2 text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-lg"><AlertCircle className="w-4 h-4 shrink-0"/> Add Smoking Preference (+10%)</li>
                <li className="flex items-center gap-2 text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg"><AlertCircle className="w-4 h-4 shrink-0"/> Connect LinkedIn (+5%)</li>
              </ul>
            </div>
                
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="border-b border-gray-100 pb-3 mb-4 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">Verification</h3>
              </div>
              
              <div className="space-y-2.5 mb-4">
                {myData.verification.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100/70 hover:border-gray-200 transition-colors">
                    <span className="text-xs font-bold text-gray-700">{item.label}</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border tracking-wide uppercase ${item.isVerified ? 'text-green-700 bg-green-50 border-green-200' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>
                      {item.status}
                    </span>
                  </div>
                ))} 
              </div>

              <div>
                <input ref={docInputRef} type="file" accept=".pdf,image/*" onChange={handleDocUpload} className="hidden" />
                <button onClick={() => docInputRef.current?.click()} className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-xs transition-colors shadow-md flex justify-center items-center gap-2">
                  <UploadCloud className="w-4 h-4" /> Upload New Documents
                </button>
                
                {docs.length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200/60 space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">Uploaded files:</span>
                    {docs.map((d, i) => (
                      <div key={i} className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100 text-xs shadow-sm">
                        <a href={d.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-semibold max-w-[80%] truncate block">
                          {d.name}
                        </a>
                        <button 
                          onClick={() => {
                            if (d.url.startsWith('blob:')) URL.revokeObjectURL(d.url);
                            setDocs(docs.filter((_, index) => index !== i));
                          }}
                          className="text-gray-400 hover:text-red-600 p-1 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;