import React from 'react';
import { MoreVertical, Image as ImageIcon, Send, Smile, Paperclip, MessageCircle } from 'lucide-react';

const Messages = ({ selectedChat }) => {
  
  if (!selectedChat) {
    return (
       <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
          <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
          <p>Select a chat to start messaging</p>
       </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
       
       {/* Chat Header */}
       <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
             <img src={selectedChat.avatar} alt="user" className="w-10 h-10 rounded-full border border-gray-100" />
             <div>
                <h3 className="font-bold text-[#091E42]">{selectedChat.name}</h3>
                <span className="text-xs text-green-500 font-bold flex items-center gap-1">● Online</span>
             </div>
          </div>
          <button className="p-2 hover:bg-gray-50 rounded-full transition"><MoreVertical className="w-5 h-5 text-gray-400" /></button>
       </div>

       {/* Messages Body */}
       <div className="flex-1 p-6 overflow-y-auto bg-[#FAFAFA] space-y-6">
          {/* Received */}
          <div className="flex gap-3 max-w-[85%]">
             <img src={selectedChat.avatar} className="w-8 h-8 rounded-full mt-1" alt="u" />
             <div>
                <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none text-sm text-gray-700 shadow-sm">
                   {selectedChat.lastMsg}
                </div>
             </div>
          </div>
          {/* Sent */}
          <div className="flex gap-3 max-w-[85%] ml-auto flex-row-reverse">
             <img src="https://ui-avatars.com/api/?name=Me&background=0A2647&color=fff" className="w-8 h-8 rounded-full mt-1" alt="me" />
             <div>
                <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-none text-sm shadow-md">
                   Okay, talk to you later!
                </div>
                <span className="text-[10px] text-gray-400 block text-right mt-1">Just now</span>
             </div>
          </div>
       </div>

       {/* Input Area */}
       <div className="p-4 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-2 bg-gray-50 rounded-full px-4 py-2 border border-gray-200">
             <button className="text-gray-400 hover:text-blue-600"><ImageIcon className="w-5 h-5" /></button>
             <button className="text-gray-400 hover:text-blue-600"><Paperclip className="w-5 h-5" /></button>
             <input type="text" placeholder="Type a message..." className="flex-1 bg-transparent outline-none text-sm text-gray-700" />
             <button className="text-gray-400 hover:text-blue-600"><Smile className="w-5 h-5" /></button>
             <button className="text-blue-600 hover:bg-blue-100 p-1.5 rounded-full"><Send className="w-5 h-5" /></button>
          </div>
       </div>
    </div>
  );
};

export default Messages;