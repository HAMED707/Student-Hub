import React from 'react';
import { MessageCircle, Heart, MoreVertical, Image as ImageIcon, Send, Hash, ThumbsUp } from 'lucide-react';

const postsData = [
  {
    id: 1, author: "John Doe", role: "Student", time: "Aug 19, 2021", avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    title: "Looking for a roommate in Nasr City",
    content: "Hey guys! I'm looking for a roommate to share a 2-bedroom apartment in Nasr City near Al-Ahly Club. The apartment is fully furnished and the rent is 2000 EGP per person. DM me if interested!",
    likes: 12, comments: 5,
    replies: [
        { id: 101, author: "Ralph Edwards", time: "2 hrs ago", avatar: "https://randomuser.me/api/portraits/men/5.jpg", text: "Is it close to the metro station?" },
        { id: 102, author: "Albert Flores", time: "1 hr ago", avatar: "https://randomuser.me/api/portraits/men/12.jpg", text: "I sent you a message, please check." }
    ]
  },
  {
    id: 2, author: "Sarah Miller", role: "Admin", time: "Yesterday", avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    title: "Tips for exams preparation 📚",
    content: "Since finals are approaching, here are some quick tips: 1. Start early. 2. Stay hydrated. 3. Group study helps a lot with revision. Good luck everyone!",
    likes: 45, comments: 12,
    replies: []
  }
];

const Posts = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
       
       {/* --- Create Post Box --- */}
       <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex gap-4">
             <img src="https://ui-avatars.com/api/?name=Me&background=0A2647&color=fff" className="w-10 h-10 rounded-full border border-gray-100 shadow-sm" alt="me" />
             <div className="flex-1">
                <input 
                   type="text" 
                   placeholder="Write your post or question here..." 
                   className="w-full bg-gray-50 p-3.5 rounded-xl text-sm outline-none border border-transparent focus:bg-white focus:border-blue-200 focus:ring-2 focus:ring-blue-50 transition" 
                />
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
                   <div className="flex gap-2">
                      <button className="flex items-center gap-1.5 text-gray-500 text-xs font-bold hover:bg-gray-100 px-3 py-1.5 rounded-lg transition">
                         <ImageIcon className="w-4 h-4 text-green-500"/> Photo
                      </button>
                      <button className="flex items-center gap-1.5 text-gray-500 text-xs font-bold hover:bg-gray-100 px-3 py-1.5 rounded-lg transition">
                         <Hash className="w-4 h-4 text-blue-500"/> Topic
                      </button>
                   </div>
                   <button className="bg-blue-600 text-white px-6 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-sm active:scale-95">
                      Post
                   </button>
                </div>
             </div>
          </div>
       </div>
  
       {/* --- Posts Feed --- */}
       {postsData.map(post => (
          <div key={post.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition duration-300">
             
             {/* Post Header */}
             <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                   <img src={post.avatar} className="w-10 h-10 rounded-full border border-gray-100" alt="author" />
                   <div>
                      <h4 className="font-bold text-[#091E42] text-sm hover:underline cursor-pointer">{post.author}</h4>
                      <div className="flex items-center gap-2">
                         <span className="text-gray-400 text-xs">{post.time}</span>
                         {post.role === "Admin" && <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-bold">Admin</span>}
                      </div>
                   </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-50 rounded-full transition">
                   <MoreVertical className="w-5 h-5"/>
                </button>
             </div>
             
             {/* Post Content */}
             <h3 className="font-bold text-lg text-gray-900 mb-2 leading-tight">{post.title}</h3>
             <p className="text-gray-600 text-sm leading-relaxed mb-6">{post.content}</p>
             
             {/* Actions */}
             <div className="flex gap-6 border-t border-gray-100 pt-4 mb-4">
                <button className="flex items-center gap-2 text-gray-500 text-sm font-bold hover:text-blue-600 transition group">
                   <ThumbsUp className="w-4 h-4 group-hover:scale-110 transition" /> {post.likes} Likes
                </button>
                <button className="flex items-center gap-2 text-gray-500 text-sm font-bold hover:text-blue-600 transition group">
                   <MessageCircle className="w-4 h-4 group-hover:scale-110 transition" /> {post.comments} Comments
                </button>
             </div>
  
             {/* Comments Section */}
             <div className="bg-gray-50 p-4 rounded-xl space-y-5">
                {post.replies.length > 0 ? post.replies.map(reply => (
                   <div key={reply.id} className="flex gap-3 animate-in fade-in">
                      <img src={reply.avatar} className="w-8 h-8 rounded-full border border-white shadow-sm" alt="reply" />
                      <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex-1">
                         <div className="flex justify-between items-baseline mb-1">
                            <span className="font-bold text-xs text-[#091E42]">{reply.author}</span>
                            <span className="text-[10px] text-gray-400">{reply.time}</span>
                         </div>
                         <p className="text-gray-700 text-xs leading-relaxed">{reply.text}</p>
                      </div>
                   </div>
                )) : (
                   <p className="text-xs text-center text-gray-400 italic">No comments yet. Be the first to say something!</p>
                )}
                
                {/* Add Comment Input */}
                <div className="flex gap-3 pt-2">
                   <img src="https://ui-avatars.com/api/?name=Me&background=0A2647&color=fff" className="w-8 h-8 rounded-full border border-gray-200" alt="me" />
                   <div className="flex-1 relative">
                      <input 
                         type="text" 
                         placeholder="Write a comment..." 
                         className="w-full bg-white border border-gray-200 rounded-full py-2 pl-4 pr-10 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition shadow-sm" 
                      />
                      <button className="absolute right-1 top-1 bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 transition shadow-sm">
                         <Send className="w-3 h-3"/>
                      </button>
                   </div>
                </div>
             </div>
          </div>
       ))}
    </div>
  );
};

export default Posts;