import React from "react";
import { useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../../assets/components/Navbar/Navbar.jsx";
import Groups from "./Groups.jsx";
import Posts from "./Posts.jsx";
import Messages from "./Messages.jsx";

const tabs = [
  { id: "posts", label: "Feed" },
  { id: "groups", label: "Groups" },
  { id: "messages", label: "Group Chat" },
];

export default function Community() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = tabs.some((tab) => tab.id === searchParams.get("tab"))
    ? searchParams.get("tab")
    : "posts";
  const selectedGroupId = searchParams.get("group") || "";

  useEffect(() => {
    if (!location.state?.activeTab && !location.state?.groupId) return;

    const nextParams = new URLSearchParams(searchParams);
    if (location.state?.activeTab) {
      nextParams.set("tab", location.state.activeTab);
    }
    if (location.state?.groupId) {
      nextParams.set("group", String(location.state.groupId));
    }
    setSearchParams(nextParams, { replace: true });
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate, searchParams, setSearchParams]);

  const setCommunityState = (tabId, groupId = selectedGroupId) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", tabId);
    if (groupId) {
      nextParams.set("group", String(groupId));
    } else {
      nextParams.delete("group");
    }
    setSearchParams(nextParams, { replace: true });
  };

  const selectTab = (tabId) => setCommunityState(tabId);

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-[#0A2647]">
      <Navbar activePage="/community" />

      <main className="mx-auto flex max-w-[1500px] flex-col gap-4 px-4 py-5 md:px-8">
        <header className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                Community
              </p>
              <h1 className="mt-1 text-2xl font-black text-[#0A2647] md:text-3xl">
                Student Hub Groups
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Groups, posts, and live community chat now run on the real backend. Direct person-to-person messaging stays in the separate messaging app.
              </p>
            </div>

            <div className="grid grid-cols-3 rounded-2xl border border-gray-100 bg-gray-50 p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => selectTab(tab.id)}
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

        <section className="min-h-0 overflow-hidden rounded-3xl border border-gray-100 bg-[#FAFAFA] shadow-sm">
          <div className="h-full overflow-y-auto p-4 md:p-6">
            {activeTab === "posts" && (
              <Posts
                selectedGroupId={selectedGroupId}
                onSelectGroup={(groupId) => setCommunityState("posts", groupId)}
                onOpenTab={(tabId, groupId) => setCommunityState(tabId, groupId)}
              />
            )}
            {activeTab === "groups" && (
              <Groups
                selectedGroupId={selectedGroupId}
                onOpenTab={(tabId, groupId) => setCommunityState(tabId, groupId)}
              />
            )}
            {activeTab === "messages" && (
              <Messages
                selectedGroupId={selectedGroupId}
                onSelectGroup={(groupId) => setCommunityState("messages", groupId)}
              />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
