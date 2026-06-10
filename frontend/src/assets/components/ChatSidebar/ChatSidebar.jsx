import React, { useState } from "react";
import { Search } from "lucide-react";

const ChatSidebar = ({ chats, selectedChat, onSelectChat }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredChats = chats.filter((chat) => {
    const matchesSearch = chat.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "online" && chat.active) ||
      (activeFilter === "groups" && chat.isGroup);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-gray-100 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-[#0A2647]">Messages</h2>
            <p className="text-xs font-semibold text-gray-400">
              Recent student chats
            </p>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-600">
            {filteredChats.length}
          </span>
        </div>

        <label className="relative block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search people..."
            className="w-full rounded-2xl border border-transparent bg-gray-50 py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-50"
          />
        </label>

        <div className="mt-4 flex gap-4 text-sm font-bold text-gray-500">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`border-b-2 pb-1 transition-colors ${
              activeFilter === "all" ? "border-[#0A2647] text-[#0A2647]" : "border-transparent hover:text-[#0A2647]"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("online")}
            className={`border-b-2 pb-1 transition-colors ${
              activeFilter === "online" ? "border-[#0A2647] text-[#0A2647]" : "border-transparent hover:text-[#0A2647]"
            }`}
          >
            Online
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("groups")}
            className={`border-b-2 pb-1 transition-colors ${
              activeFilter === "groups" ? "border-[#0A2647] text-[#0A2647]" : "border-transparent hover:text-[#0A2647]"
            }`}
          >
            Groups
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {filteredChats.length === 0 ? (
          <div className="p-6 text-center text-sm font-semibold text-gray-400">
            No chats found.
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isSelected = selectedChat?.id === chat.id;

            return (
              <button
                key={chat.id}
                type="button"
                onClick={() => onSelectChat(chat)}
                className={`mb-2 flex w-full gap-3 rounded-2xl border p-3 text-left transition-all duration-200 ${
                  isSelected
                    ? "border-blue-100 bg-blue-50"
                    : "border-transparent hover:border-gray-100 hover:bg-gray-50"
                }`}
              >
                <span className="relative shrink-0">
                  <img
                    src={chat.avatar}
                    alt={chat.name}
                    className="h-11 w-11 rounded-full border border-gray-100 object-cover"
                  />
                  {chat.active && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="mb-1 flex justify-between gap-2">
                    <span
                      className={`truncate text-sm font-black ${
                        isSelected ? "text-blue-700" : "text-[#0A2647]"
                      }`}
                    >
                      {chat.name}
                    </span>
                    <span className="shrink-0 text-[10px] font-bold text-gray-400">
                      {chat.time}
                    </span>
                  </span>
                  <span
                    className={`block truncate text-xs ${
                      isSelected
                        ? "font-semibold text-blue-600"
                        : "text-gray-500"
                    }`}
                  >
                    {chat.lastMsg}
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
