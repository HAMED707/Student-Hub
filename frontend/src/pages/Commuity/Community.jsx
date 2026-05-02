import React, { useState } from 'react';
import Navbar from "../../assets/components/Navbar/Navbar.jsx"; 
import { Search } from 'lucide-react';

// استيراد المكونات والصفحات
import ChatSidebar from '../../assets/components/ChatSidebar/ChatSidebar.jsx'; // الشريط الجانبي
import Groups from './Groups.jsx';
import Posts from './Posts.jsx';
import Messages from './Messages.jsx';

// بيانات المحادثات (نرفعها هنا لتكون مشتركة)
const chatsData = [
  { id: 1, name: "Suzana Colin", lastMsg: "next time you'll be awake...", time: "Dec 15", avatar: "https://randomuser.me/api/portraits/women/65.jpg", active: true },
  { id: 2, name: "Christina Ker", lastMsg: "Thanks for the recommendation!", time: "Dec 15", avatar: "https://randomuser.me/api/portraits/women/33.jpg", active: false },
  { id: 3, name: "Hazem", lastMsg: "See you tomorrow!", time: "Dec 15", avatar: "https://randomuser.me/api/portraits/men/22.jpg", active: false },
];

const Community = () => {
  const [activeTab, setActiveTab] = useState("groups"); // 'groups' | 'posts' | 'messages'
  const [selectedChat, setSelectedChat] = useState(chatsData[0]);

  // دالة عند الضغط على محادثة في السايد بار
  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    setActiveTab("messages"); // نقل المستخدم لتبويب الرسائل تلقائياً
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans pb-20 overflow-hidden">
      <Navbar activePage="/community" />

      <div className="container mx-auto px-4 md:px-8 py-6 h-[calc(100vh-100px)]">
        
        {/* ================= تخطيط الصفحة (Layout) ================= */}
        <div className="flex h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
           
           {/* 1. الشريط الجانبي (ثابت في كل الصفحات) */}
           <div className="w-80 border-r border-gray-100 flex-shrink-0 bg-white">
              <ChatSidebar 
                 chats={chatsData} 
                 selectedChat={selectedChat} 
                 onSelectChat={handleChatSelect} 
              />
           </div>

           {/* 2. المحتوى الرئيسي (متغير حسب التبويب) */}
           <div className="flex-1 flex flex-col min-w-0 bg-[#FAFAFA]">
              
              {/* Header & Tabs (يظهر فوق المحتوى) */}
              <div className="bg-white border-b border-gray-100 p-4">
                 <div className="flex justify-between items-center max-w-3xl mx-auto">
                    <div className="relative w-64">
                       <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                       <input type="text" placeholder="Search..." className="w-full bg-gray-50 pl-9 pr-4 py-2 rounded-full text-sm outline-none focus:ring-1 focus:ring-blue-200" />
                    </div>
                    <div className="flex gap-2">
                       {['groups', 'posts', 'messages'].map((tab) => (
                          <button 
                             key={tab}
                             onClick={() => setActiveTab(tab)}
                             className={`px-4 py-1.5 rounded-full font-bold text-xs capitalize transition
                                ${activeTab === tab ? 'bg-[#0A2647] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                             {tab}
                          </button>
                       ))}
                    </div>
                 </div>
              </div>

              {/* منطقة العرض (Scrollable Area) */}
              <div className="flex-1 overflow-y-auto p-6">
                 {activeTab === 'groups' && <Groups />}
                 {activeTab === 'posts' && <Posts />}
                 {activeTab === 'messages' && (
                    <Messages selectedChat={selectedChat} />
                 )}
              </div>

           </div>
        </div>

      </div>
    </div>
  );
};

export default Community;