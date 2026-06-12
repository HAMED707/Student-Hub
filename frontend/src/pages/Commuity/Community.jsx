import React, { useState } from "react";
import Navbar from "../../assets/components/Navbar/Navbar.jsx";
import Groups from "./Groups.jsx";
import Posts from "./Posts.jsx";
import Messages from "./Messages.jsx";

const tabs = [
  { id: "posts", label: "Feed" },
  { id: "groups", label: "Groups" },
  { id: "messages", label: "Messages" },
];

const Community = () => {
  const [activeTab, setActiveTab] = useState("posts");

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
          className="grid min-h-0 flex-1 gap-4 md:grid-cols-1"
        >
          <section className="min-h-0 overflow-hidden rounded-3xl border border-gray-100 bg-[#FAFAFA] shadow-sm">
            <div className="h-full overflow-y-auto p-4 md:p-6">
              {activeTab === "posts" && <Posts />}
              {activeTab === "groups" && <Groups />}
              {activeTab === "messages" && <Messages />}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
};

export default Community;
