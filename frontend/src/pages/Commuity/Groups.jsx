import React, { useCallback, useMemo, useState } from "react";
import {
  Activity,
  Check,
  Clock,
  Filter,
  Image as ImageIcon,
  MessageCircle,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from "lucide-react";

const initialGroups = [
  {
    id: 1,
    name: "EELU Community",
    members: 1200,
    activeToday: 184,
    weeklyPosts: 38,
    unread: 6,
    lastActivity: "12 min ago",
    image:
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80",
    desc: "A community for EELU University students to share housing tips, study groups, and events.",
    city: "Cairo",
    university: "EELU",
    category: "University",
    isMyGroup: true,
    isRecommended: true,
    joinType: "open",
  },
  {
    id: 2,
    name: "Cairo University Students",
    members: 3500,
    activeToday: 520,
    weeklyPosts: 94,
    unread: 0,
    lastActivity: "1 hr ago",
    image:
      "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=900&q=80",
    desc: "Find nearby apartments, ask about landlords, and connect with students around Cairo University.",
    city: "Giza",
    university: "Cairo University",
    category: "Housing",
    isMyGroup: false,
    isRecommended: true,
    joinType: "request",
  },
  {
    id: 3,
    name: "Ain Shams Hub",
    members: 900,
    activeToday: 76,
    weeklyPosts: 22,
    unread: 0,
    lastActivity: "Today",
    image:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80",
    desc: "Official hub for Ain Shams students looking for roommates, study partners, and commute advice.",
    city: "Cairo",
    university: "Ain Shams",
    category: "Study",
    isMyGroup: false,
    isRecommended: false,
    joinType: "open",
  },
  {
    id: 4,
    name: "AUC Housing",
    members: 2100,
    activeToday: 244,
    weeklyPosts: 57,
    unread: 0,
    lastActivity: "30 min ago",
    image:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80",
    desc: "Housing discussions for AUC students, including compounds, shared flats, and transport options.",
    city: "New Cairo",
    university: "AUC",
    category: "Housing",
    isMyGroup: false,
    isRecommended: true,
    joinType: "request",
  },
  {
    id: 5,
    name: "Nasr City Roommates",
    members: 780,
    activeToday: 133,
    weeklyPosts: 41,
    unread: 0,
    lastActivity: "2 hrs ago",
    image:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80",
    desc: "Roommate matching and apartment leads around Nasr City and nearby campuses.",
    city: "Nasr City",
    university: "Multiple Universities",
    category: "Roommates",
    isMyGroup: false,
    isRecommended: true,
    joinType: "open",
  },
  {
    id: 6,
    name: "Student Part-time Jobs",
    members: 1640,
    activeToday: 201,
    weeklyPosts: 72,
    unread: 0,
    lastActivity: "45 min ago",
    image:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80",
    desc: "Part-time jobs, internships, and paid opportunities for students around Cairo.",
    city: "Cairo",
    university: "All Universities",
    category: "Jobs",
    isMyGroup: false,
    isRecommended: false,
    joinType: "open",
  },
];

const memberAvatars = [
  "https://randomuser.me/api/portraits/men/21.jpg",
  "https://randomuser.me/api/portraits/women/24.jpg",
  "https://randomuser.me/api/portraits/men/28.jpg",
];

const categories = ["All", "Housing", "Roommates", "Study", "University", "Events", "Jobs"];

const formatMembers = (members) =>
  members >= 1000 ? `${(members / 1000).toFixed(1)}k` : members;

const emptyGroupForm = {
  name: "",
  desc: "",
  category: "Housing",
  university: "",
  city: "",
  image: "",
};

const StatPill = ({ icon, label, value }) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#155BC2]">
        {React.createElement(icon, { className: "h-5 w-5" })}
      </span>
      <div>
        <p className="text-xl font-black text-[#091E42]">{value}</p>
        <p className="text-xs font-bold text-gray-400">{label}</p>
      </div>
    </div>
  </div>
);

const Groups = ({ onOpenGroupChat }) => {
  const [groups, setGroups] = useState(initialGroups);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("All");
  const [activeCategory, setActiveCategory] = useState("All");
  const [notice, setNotice] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [groupForm, setGroupForm] = useState(emptyGroupForm);

  const cities = useMemo(
    () => ["All", ...new Set(groups.map((group) => group.city))],
    [groups],
  );

  const myGroups = useMemo(
    () => groups.filter((group) => group.isMyGroup),
    [groups],
  );

  const recommendedGroups = useMemo(
    () => groups.filter((group) => !group.isMyGroup && group.isRecommended).slice(0, 3),
    [groups],
  );

  const trendingGroups = useMemo(
    () =>
      [...groups]
        .filter((group) => !group.isMyGroup)
        .sort((firstGroup, secondGroup) => secondGroup.weeklyPosts - firstGroup.weeklyPosts)
        .slice(0, 3),
    [groups],
  );

  const exploreGroups = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return groups.filter((group) => {
      const matchesJoined = !group.isMyGroup;
      const matchesSearch =
        !query ||
        group.name.toLowerCase().includes(query) ||
        group.desc.toLowerCase().includes(query) ||
        group.city.toLowerCase().includes(query) ||
        group.category.toLowerCase().includes(query);
      const matchesCity = selectedCity === "All" || group.city === selectedCity;
      const matchesCategory = activeCategory === "All" || group.category === activeCategory;

      return matchesJoined && matchesSearch && matchesCity && matchesCategory;
    });
  }, [activeCategory, groups, searchTerm, selectedCity]);

  const groupStats = useMemo(
    () => ({
      members: myGroups.reduce((total, group) => total + group.members, 0),
      activeToday: myGroups.reduce((total, group) => total + group.activeToday, 0),
      weeklyPosts: myGroups.reduce((total, group) => total + group.weeklyPosts, 0),
    }),
    [myGroups],
  );

  const showNotice = useCallback((text) => {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 1800);
  }, []);

  const handleJoinGroup = useCallback(
    (groupId) => {
      setGroups((currentGroups) =>
        currentGroups.map((group) =>
          group.id === groupId
            ? { ...group, isMyGroup: true, members: group.members + 1, unread: 1 }
            : group,
        ),
      );

      const joinedGroup = groups.find((group) => group.id === groupId);
      showNotice(
        joinedGroup?.joinType === "request"
          ? "Join request sent"
          : `${joinedGroup?.name || "Group"} joined`,
      );
    },
    [groups, showNotice],
  );

  const handleAddGroup = useCallback(() => {
    setIsCreateOpen(true);
  }, []);

  const handleCreateGroup = useCallback(() => {
    if (!groupForm.name.trim() || !groupForm.desc.trim()) return;

    const nextGroup = {
      id: Date.now(),
      name: groupForm.name.trim(),
      members: 1,
      activeToday: 1,
      weeklyPosts: 0,
      unread: 0,
      lastActivity: "Just now",
      image:
        groupForm.image ||
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
      desc: groupForm.desc.trim(),
      city: groupForm.city.trim() || "Cairo",
      university: groupForm.university.trim() || "All Universities",
      category: groupForm.category,
      isMyGroup: true,
      isRecommended: false,
      joinType: "open",
    };

    setGroups((currentGroups) => [nextGroup, ...currentGroups]);
    setGroupForm(emptyGroupForm);
    setIsCreateOpen(false);
    showNotice("Group created");
  }, [groupForm, showNotice]);

  const handleCoverUpload = useCallback((event) => {
    const file = event.target.files?.[0];

    if (!file) return;
    setGroupForm((currentForm) => ({
      ...currentForm,
      image: URL.createObjectURL(file),
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedCity("All");
    setActiveCategory("All");
  }, []);

  const simulateLoading = useCallback(() => {
    setIsLoading(true);
    window.setTimeout(() => setIsLoading(false), 550);
  }, []);

  const openGroupChat = useCallback(
    (group) => {
      if (onOpenGroupChat) {
        onOpenGroupChat(group);
        return;
      }

      showNotice(`Opening ${group.name} chat`);
    },
    [onOpenGroupChat, showNotice],
  );

  const GroupCard = ({ group, compact = false }) => (
    <article className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md">
      <div className={`relative overflow-hidden bg-gray-200 ${compact ? "h-32" : "h-44"}`}>
        <img
          src={group.image}
          alt={group.name}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#091E42]/75 to-transparent" />
        <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[11px] font-black text-[#155BC2] shadow-sm">
          {group.category}
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="line-clamp-1 text-lg font-black text-white">{group.name}</h3>
          <p className="mt-1 text-xs font-bold text-white/80">
            {group.city} · {group.university}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-2 text-sm leading-6 text-gray-500">{group.desc}</p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-[#F8FAFC] p-2 text-center">
            <p className="text-sm font-black text-[#091E42]">{formatMembers(group.members)}</p>
            <p className="text-[10px] font-bold text-gray-400">Members</p>
          </div>
          <div className="rounded-xl bg-[#F8FAFC] p-2 text-center">
            <p className="text-sm font-black text-[#091E42]">{group.activeToday}</p>
            <p className="text-[10px] font-bold text-gray-400">Active</p>
          </div>
          <div className="rounded-xl bg-[#F8FAFC] p-2 text-center">
            <p className="text-sm font-black text-[#091E42]">{group.weeklyPosts}</p>
            <p className="text-[10px] font-bold text-gray-400">Posts</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-4">
          <div className="flex -space-x-2">
            {memberAvatars.map((avatar) => (
              <img
                key={avatar}
                src={avatar}
                className="h-7 w-7 rounded-full border-2 border-white object-cover"
                alt="member"
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => handleJoinGroup(group.id)}
            className="rounded-xl bg-[#155BC2] px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-[#0f4aa0]"
          >
            {group.joinType === "request" ? "Request To Join" : "Join Group"}
          </button>
        </div>
      </div>
    </article>
  );

  return (
    <div className="relative mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      {notice && (
        <div className="fixed right-5 top-24 z-50 rounded-full bg-[#091E42] px-4 py-2 text-xs font-bold text-white shadow-lg">
          {notice}
        </div>
      )}

      <header className="mb-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#155BC2]">
              Student Communities Hub
            </p>
            <h2 className="mt-1 text-2xl font-black text-[#091E42]">
              Groups for housing, study, and student life
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Discover active student communities, join housing groups, and keep up with campus conversations.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddGroup}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#155BC2] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#0f4aa0] active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Create Group
          </button>
        </div>
      </header>

      <section className="mb-5 grid gap-3 md:grid-cols-3">
        <StatPill icon={Users} label="Members in your groups" value={formatMembers(groupStats.members)} />
        <StatPill icon={Activity} label="Active today" value={groupStats.activeToday} />
        <StatPill icon={MessageCircle} label="Weekly posts" value={groupStats.weeklyPosts} />
      </section>

      <section className="mb-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-xl font-black text-[#091E42]">My Groups</h3>
            <p className="mt-1 text-sm font-medium text-gray-500">
              {myGroups.length} joined group{myGroups.length !== 1 ? "s" : ""}.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {myGroups.map((group) => (
            <article
              key={group.id}
              className="group flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-blue-100 hover:shadow-md sm:flex-row sm:items-center"
            >
              <img
                src={group.image}
                alt={group.name}
                className="h-24 w-full rounded-xl object-cover sm:h-20 sm:w-24"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="truncate text-lg font-black text-[#091E42]">{group.name}</h4>
                  {group.unread > 0 && (
                    <span className="rounded-full bg-[#F59E0B] px-2 py-0.5 text-[10px] font-black text-white">
                      {group.unread} unread
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-1 text-sm text-gray-500">{group.desc}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-gray-400">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {group.lastActivity}
                  </span>
                  <span>{formatMembers(group.members)} members</span>
                  <span>{group.weeklyPosts} posts this week</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openGroupChat(group)}
                className="h-10 rounded-xl bg-[#091E42] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#155BC2] sm:w-auto"
              >
                Chat
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-8 grid gap-5 xl:grid-cols-2">
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#F59E0B]" />
            <h3 className="text-xl font-black text-[#091E42]">Recommended Groups</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            {recommendedGroups.map((group) => (
              <GroupCard key={group.id} group={group} compact />
            ))}
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#F59E0B]" />
            <h3 className="text-xl font-black text-[#091E42]">Trending Groups</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            {trendingGroups.map((group) => (
              <GroupCard key={group.id} group={group} compact />
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-xl font-black text-[#091E42]">Explore Groups</h3>
            <p className="mt-1 text-sm text-gray-500">
              Search by group name, city, description, or category.
            </p>
          </div>

          <button
            type="button"
            onClick={simulateLoading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-100 px-4 text-xs font-black text-gray-500 transition hover:border-[#155BC2]/30 hover:text-[#155BC2]"
          >
            <Filter className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px]">
          <label className="relative block">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search groups, descriptions, cities, categories..."
              className="h-11 w-full rounded-xl border border-gray-100 bg-[#F8FAFC] pl-11 pr-4 text-sm outline-none transition focus:border-[#155BC2] focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
          </label>
          <select
            value={selectedCity}
            onChange={(event) => setSelectedCity(event.target.value)}
            className="h-11 rounded-xl border border-gray-100 bg-white px-3 text-sm font-bold text-gray-600 outline-none transition focus:border-[#155BC2] focus:ring-4 focus:ring-blue-50"
          >
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`h-9 shrink-0 rounded-full px-4 text-xs font-black transition ${
                activeCategory === category
                  ? "bg-[#155BC2] text-white shadow-sm"
                  : "border border-gray-100 bg-white text-gray-500 hover:border-[#155BC2]/30 hover:text-[#155BC2]"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="h-44 animate-pulse bg-gray-200" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
                  <div className="h-10 animate-pulse rounded-xl bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : exploreGroups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-[#F8FAFC] p-10 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white text-[#155BC2] shadow-sm">
              <Users className="h-8 w-8" />
            </div>
            <h4 className="mt-4 text-lg font-black text-[#091E42]">No groups match your filters</h4>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Try clearing filters or create a new group for your university or housing area.
            </p>
            <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
              <button
                type="button"
                onClick={clearFilters}
                className="h-10 rounded-xl border border-gray-200 bg-white px-5 text-sm font-black text-gray-600 transition hover:border-[#155BC2]/30 hover:text-[#155BC2]"
              >
                Clear Filters
              </button>
              <button
                type="button"
                onClick={handleAddGroup}
                className="h-10 rounded-xl bg-[#155BC2] px-5 text-sm font-black text-white transition hover:bg-[#0f4aa0]"
              >
                Create Group
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {exploreGroups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        )}

        {myGroups.length > initialGroups.filter((group) => group.isMyGroup).length && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
            <Check className="h-4 w-4" />
            New group added to My Groups.
          </div>
        )}
      </section>

      {isCreateOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#091E42]/55 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <div>
                <h3 className="text-xl font-black text-[#091E42]">Create Group</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start a focused student community.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-gray-50 text-gray-500 transition hover:bg-gray-100"
                aria-label="Close create group modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 p-5">
              <input
                value={groupForm.name}
                onChange={(event) =>
                  setGroupForm((currentForm) => ({ ...currentForm, name: event.target.value }))
                }
                placeholder="Group Name"
                className="h-11 rounded-xl border border-gray-100 bg-[#F8FAFC] px-4 text-sm outline-none transition focus:border-[#155BC2] focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
              <textarea
                value={groupForm.desc}
                onChange={(event) =>
                  setGroupForm((currentForm) => ({ ...currentForm, desc: event.target.value }))
                }
                rows={4}
                placeholder="Description"
                className="resize-none rounded-xl border border-gray-100 bg-[#F8FAFC] p-4 text-sm outline-none transition focus:border-[#155BC2] focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <select
                  value={groupForm.category}
                  onChange={(event) =>
                    setGroupForm((currentForm) => ({ ...currentForm, category: event.target.value }))
                  }
                  className="h-11 rounded-xl border border-gray-100 bg-white px-3 text-sm font-bold text-gray-600 outline-none focus:border-[#155BC2]"
                >
                  {categories.filter((category) => category !== "All").map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <input
                  value={groupForm.university}
                  onChange={(event) =>
                    setGroupForm((currentForm) => ({ ...currentForm, university: event.target.value }))
                  }
                  placeholder="University"
                  className="h-11 rounded-xl border border-gray-100 bg-[#F8FAFC] px-4 text-sm outline-none focus:border-[#155BC2]"
                />
                <input
                  value={groupForm.city}
                  onChange={(event) =>
                    setGroupForm((currentForm) => ({ ...currentForm, city: event.target.value }))
                  }
                  placeholder="City"
                  className="h-11 rounded-xl border border-gray-100 bg-[#F8FAFC] px-4 text-sm outline-none focus:border-[#155BC2]"
                />
              </div>

              <label className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-[#F8FAFC] p-5 text-center transition hover:border-[#155BC2]/40">
                {groupForm.image ? (
                  <img src={groupForm.image} alt="Cover preview" className="max-h-56 w-full rounded-xl object-cover" />
                ) : (
                  <>
                    <ImageIcon className="h-8 w-8 text-[#155BC2]" />
                    <p className="mt-2 text-sm font-black text-[#091E42]">Upload Cover Image</p>
                    <p className="mt-1 text-xs text-gray-400">PNG or JPG works best</p>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
              </label>
            </div>

            <div className="flex flex-col gap-2 border-t border-gray-100 bg-[#F8FAFC] p-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="h-11 rounded-xl border border-gray-200 bg-white px-5 text-sm font-black text-gray-600 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateGroup}
                disabled={!groupForm.name.trim() || !groupForm.desc.trim()}
                className="h-11 rounded-xl bg-[#155BC2] px-6 text-sm font-black text-white transition hover:bg-[#0f4aa0] disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
