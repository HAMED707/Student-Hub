import React from 'react';
import { Users, ExternalLink } from 'lucide-react';

const groupsData = [
  { id: 1, name: "EELU Community", members: "1.2k", image: "https://ui-avatars.com/api/?name=EELU&background=1A56DB&color=fff&size=128", desc: "A community for EELU University students to share housing tips, study groups, and events.", isMyGroup: true },
  { id: 2, name: "Cairo University Students", members: "3.5k", image: "https://ui-avatars.com/api/?name=Cairo+Uni&background=0A2647&color=fff&size=128", desc: "Join communities that match your interests - universities, cities, and activities.", isMyGroup: false },
  { id: 3, name: "Ain Shams Hub", members: "900", image: "https://ui-avatars.com/api/?name=Ain+Shams&background=10B981&color=fff&size=128", desc: "Official hub for Ain Shams students looking for roommates.", isMyGroup: false },
  { id: 4, name: "AUC Housing", members: "2.1k", image: "https://ui-avatars.com/api/?name=AUC&background=6366f1&color=fff&size=128", desc: "Premium housing discussion for AUC students.", isMyGroup: false },
];

const Groups = () => {
  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* --- My Groups Section --- */}
      <div className="flex justify-between items-center mb-6">
         <h2 className="text-xl font-bold text-[#091E42]">My Groups</h2>
         <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-sm flex items-center gap-2">
           <span>+</span> Add Group
         </button>
      </div>

      <div className="space-y-4 mb-10">
         {groupsData.filter(g => g.isMyGroup).map(group => (
            <div key={group.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-blue-200 transition group">
               <div className="flex items-center gap-4">
                  <img src={group.image} alt={group.name} className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 group-hover:border-blue-100 transition" />
                  <div>
                     <h3 className="text-lg font-bold text-[#091E42] group-hover:text-blue-600 transition">{group.name}</h3>
                     <p className="text-gray-500 text-sm max-w-xl mt-1 leading-relaxed">{group.desc}</p>
                     <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 font-bold bg-gray-50 inline-flex px-2 py-1 rounded">
                        <Users className="w-3 h-3" /> {group.members} Members
                     </div>
                  </div>
               </div>
               <button className="bg-[#091E42] text-white px-8 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition shadow-md w-full md:w-auto">
                  Chat
               </button>
            </div>
         ))}
      </div>

      {/* --- Explore Section --- */}
      <h2 className="text-xl font-bold text-[#091E42] mb-6 border-t border-gray-100 pt-6">Explore Student Groups</h2>
      <p className="text-gray-500 text-sm mb-6 -mt-4">Join communities that match your interests — universities, cities, and activities.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {groupsData.filter(g => !g.isMyGroup).map(group => (
            <div key={group.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition group flex flex-col">
               {/* Cover Image */}
               <div className="h-36 bg-gray-200 relative overflow-hidden">
                  <img src={`https://picsum.photos/seed/group-${group.id}/800/400`} alt="cover" className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
               </div>
               
               <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                     <h3 className="text-lg font-bold text-[#091E42] group-hover:text-blue-600 transition">{group.name}</h3>
                  </div>
                  
                  <p className="text-gray-500 text-sm mb-6 line-clamp-2 leading-relaxed">{group.desc}</p>
                  
                  <div className="mt-auto flex justify-between items-center pt-4 border-t border-gray-50">
                     <div className="flex -space-x-2">
                        {[1,2,3].map(i => (
                           <img key={i} src={`https://ui-avatars.com/api/?name=M${i}&background=94a3b8&color=fff&size=48`} className="w-6 h-6 rounded-full border-2 border-white" alt="member" />
                        ))}
                        <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-500">
                           +1k
                        </div>
                     </div>
                     <button className="text-blue-600 border border-blue-600 px-5 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-600 hover:text-white transition flex items-center gap-1">
                        Enquire <ExternalLink className="w-3 h-3" />
                     </button>
                  </div>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
};

export default Groups;