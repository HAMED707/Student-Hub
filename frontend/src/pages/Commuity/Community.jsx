import React, { useState } from "react";
import Navbar from "../../assets/components/Navbar/Navbar.jsx";
import ChatSidebar from "../../assets/components/ChatSidebar/ChatSidebar.jsx";
import Groups from "./Groups.jsx";
import Posts from "./Posts.jsx";
import Messages from "./Messages.jsx";

const initialChats = [
  {
    id: 1,
    name: "Suzana Colin",
    lastMsg: "I found a room close to campus.",
    time: "10:45",
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
    active: true,
    messages: [
      { id: 1, from: "them", text: "I found a room close to campus.", time: "10:40" },
      { id: 2, from: "me", text: "Nice. Is it shared or private?", time: "10:42" },
      { id: 3, from: "them", text: "Shared, but the price is really good.", time: "10:45" },
    ],
  },
  {
    id: 2,
    name: "Christina Ker",
    lastMsg: "Thanks for the recommendation!",
    time: "Yesterday",
    avatar: "https://randomuser.me/api/portraits/women/33.jpg",
    active: true,
    messages: [
      { id: 1, from: "them", text: "Thanks for the recommendation!", time: "Yesterday" },
      { id: 2, from: "me", text: "Anytime. Tell me if you visit the apartment.", time: "Yesterday" },
    ],
  },
  {
    id: 3,
    name: "Hazem",
    lastMsg: "See you tomorrow!",
    time: "Mon",
    avatar: "https://randomuser.me/api/portraits/men/22.jpg",
    active: false,
    messages: [
      { id: 1, from: "them", text: "The group viewing is at 5 PM.", time: "Mon" },
      { id: 2, from: "me", text: "Perfect, see you tomorrow!", time: "Mon" },
    ],
  },
];

const tabs = [
  { id: "posts", label: "Feed" },
  { id: "groups", label: "Groups" },
  { id: "messages", label: "Messages" },
];

const Community = () => {
  const [activeTab, setActiveTab] = useState("posts");
  const [chats, setChats] = useState(initialChats);
  const [selectedChatId, setSelectedChatId] = useState(initialChats[0].id);

  const selectedChat = chats.find((chat) => chat.id === selectedChatId) || chats[0];

  const handleChatSelect = (chat) => {
    setSelectedChatId(chat.id);
    setActiveTab("messages");
  };

  const handleSendMessage = (chatId, text) => {
    const trimmedText = text.trim();

    if (!trimmedText) {
      return;
    }

    setChats((currentChats) =>
      currentChats
        .map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                lastMsg: trimmedText,
                time: "Just now",
                messages: [
                  ...(chat.messages || []),
                  {
                    id: Date.now(),
                    from: "me",
                    text: trimmedText,
                    time: "Just now",
                  },
                ],
              }
            : chat,
        )
        .sort((firstChat, secondChat) => {
          if (firstChat.id === chatId) return -1;
          if (secondChat.id === chatId) return 1;
          return 0;
        }),
    );
  };

  const handleOpenGroupChat = (group) => {
    const chatId = `group-${group.id}`;

    setChats((currentChats) => {
      const existingChat = currentChats.find((chat) => chat.id === chatId);

      if (existingChat) {
        return currentChats;
      }

      return [
        {
          id: chatId,
          name: group.name,
          lastMsg: "Welcome to the group chat.",
          time: "Just now",
          avatar: group.image,
          active: true,
          isGroup: true,
          messages: [
            {
              id: Date.now(),
              from: "them",
              text: "Welcome to the group chat.",
              time: "Just now",
            },
          ],
        },
        ...currentChats,
      ];
    });
    setSelectedChatId(chatId);
    setActiveTab("messages");
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-[#0A2647]">
      <Navbar activePage="/community" />

      <main className="mx-auto flex h-auto max-w-[1500px] flex-col gap-4 px-4 py-5 md:h-[calc(100vh-96px)] md:px-8">
        <header className="sticky top-0 z-20 rounded-3xl border border-gray-100 bg-white/95 p-4 shadow-sm backdrop-blur md:static md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                Community
              </p>
              <h1 className="mt-1 text-2xl font-black text-[#0A2647] md:text-3xl">
                Student Hub
              </h1>
            </div>

            <div className="grid grid-cols-3 rounded-2xl border border-gray-100 bg-gray-50 p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-xl px-4 py-2 text-sm font-black transition ${
                    activeTab === tab.id
                      ? "bg-[#0A2647] text-white shadow-sm"
                      : "text-gray-500 hover:bg-white hover:text-[#0A2647]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <section
          className={`grid min-h-0 flex-1 gap-4 ${
            activeTab === "messages" ? "md:grid-cols-[320px_minmax(0,1fr)]" : "md:grid-cols-1"
          }`}
        >
          <aside
            className={`min-h-[520px] overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm ${
              activeTab === "messages" ? "block" : "hidden"
            }`}
          >
            <ChatSidebar
              chats={chats}
              selectedChat={selectedChat}
              onSelectChat={handleChatSelect}
            />
          </aside>

          <section className="min-h-0 overflow-hidden rounded-3xl border border-gray-100 bg-[#FAFAFA] shadow-sm">
            <div className="h-full overflow-y-auto p-4 md:p-6">
              {activeTab === "posts" && <Posts />}
              {activeTab === "groups" && (
                <Groups onOpenGroupChat={handleOpenGroupChat} />
              )}
              {activeTab === "messages" && (
                <Messages
                  selectedChat={selectedChat}
                  onSendMessage={handleSendMessage}
                />
              )}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
};

export default Community;
