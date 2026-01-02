import React from 'react';
import { Search } from 'lucide-react';

const ChatSidebar = ({ chats, selectedChat, onSelectChat }) => {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header & Search */}
      <div className="p-4 border-b border-gray-100">
         <h2 className="font-bold text-lg text-[#091E42] mb-3">Messages</h2>
         
         <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search people..." 
              className="w-full bg-gray-50 pl-9 pr-4 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-200 transition border border-transparent focus:border-blue-200" 
            />
         </div>

         {/* Filter Tabs */}
         <div className="flex gap-4 mt-4 text-sm font-bold text-gray-500">
            <button className="text-[#091E42] border-b-2 border-[#091E42] pb-1 transition-colors">All</button>
            <button className="hover:text-[#091E42] transition-colors">Friends</button>
            <button className="hover:text-[#091E42] transition-colors">Groups</button>
         </div>
      </div>
      
      {/* Chats List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
         {chats.map(chat => (
            <div 
               key={chat.id} 
               onClick={() => onSelectChat(chat)}
               className={`flex gap-3 p-4 cursor-pointer transition-all duration-200 border-l-4 
               ${selectedChat?.id === chat.id 
                  ? 'bg-blue-50 border-blue-600' 
                  : 'border-transparent hover:bg-gray-50'}`}
            >
               <div className="relative">
                 <img src={chat.avatar} alt={chat.name} className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                 {chat.active && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>}
               </div>
               
               <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1">
                     <h4 className={`font-bold text-sm ${selectedChat?.id === chat.id ? 'text-blue-700' : 'text-[#091E42]'}`}>
                        {chat.name}
                     </h4>
                     <span className="text-[10px] text-gray-400">{chat.time}</span>
                  </div>
                  <p className={`text-xs truncate ${selectedChat?.id === chat.id ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                     {chat.lastMsg}
                  </p>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
};

export default ChatSidebar;