import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Plus, Search, Users } from "lucide-react";
import { useCommunity } from "../../context/communityContext.js";
import { COMMUNITY_CATEGORY_OPTIONS } from "../../utils/community.js";

const fieldClassName =
  "mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#155BC2]";

export default function Groups({ selectedGroupId = "", onOpenTab }) {
  const navigate = useNavigate();
  const {
    catalogGroups: groups,
    loadingCatalog: loading,
    ensureCatalog,
    createGroup,
    joinGroup,
    leaveGroup,
  } = useCommunity();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    category: "housing",
    isPrivate: false,
    coverImage: null,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setError("");
      try {
        await ensureCatalog();
      } catch (loadError) {
        setError(loadError.message || "Unable to load groups.");
      }
    };

    load();
  }, [ensureCatalog]);

  const filteredGroups = useMemo(() => {
    const search = query.trim().toLowerCase();
    return groups.filter((group) => {
      const matchesSearch =
        !search ||
        group.name.toLowerCase().includes(search) ||
        group.description.toLowerCase().includes(search) ||
        group.categoryLabel.toLowerCase().includes(search);
      const matchesCategory =
        category === "all" || group.categoryValue === category;
      return matchesSearch && matchesCategory;
    });
  }, [category, groups, query]);

  const stats = useMemo(
    () => ({
      total: groups.length,
      joined: groups.filter((group) => group.isMember).length,
      unread: groups.reduce((sum, group) => sum + Number(group.unreadCount || 0), 0),
    }),
    [groups],
  );

  const handleJoinLeave = async (group) => {
    setSaving(true);
    setError("");

    try {
      if (group.isMember) {
        await leaveGroup(group.id);
      } else {
        await joinGroup(group.id);
      }
    } catch (actionError) {
      setError(actionError.message || "Failed to update group membership.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!createForm.name.trim()) {
      setError("Group name is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const body = new FormData();
      body.append("name", createForm.name);
      body.append("description", createForm.description);
      body.append("category", createForm.category);
      body.append("is_private", String(createForm.isPrivate));
      if (createForm.coverImage) {
        body.append("cover_image", createForm.coverImage);
      }

      const created = await createGroup(body);
      setShowCreate(false);
      setCreateForm({
        name: "",
        description: "",
        category: "housing",
        isPrivate: false,
        coverImage: null,
      });
      if (created?.id) {
        onOpenTab?.("groups", created.id);
      }
    } catch (createError) {
      setError(createError.message || "Failed to create group.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            Total Groups
          </p>
          <p className="mt-2 text-2xl font-black text-[#091E42]">{stats.total}</p>
        </div>
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            Joined
          </p>
          <p className="mt-2 text-2xl font-black text-[#091E42]">{stats.joined}</p>
        </div>
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            Unread Chat
          </p>
          <p className="mt-2 text-2xl font-black text-[#091E42]">{stats.unread}</p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          <label className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search groups"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-[#F8FAFC] pl-11 pr-4 text-sm outline-none focus:border-[#155BC2] focus:bg-white"
            />
          </label>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-[#155BC2]"
          >
            <option value="all">All categories</option>
            {COMMUNITY_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowCreate((current) => !current)}
            className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#155BC2] px-4 text-sm font-black text-white"
          >
            <Plus className="h-4 w-4" />
            Create group
          </button>
        </div>

        {showCreate ? (
          <div className="mt-5 rounded-3xl border border-slate-100 bg-slate-50 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-bold text-slate-600">Group name</span>
                <input
                  value={createForm.name}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-600">Category</span>
                <select
                  value={createForm.category}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                >
                  {COMMUNITY_CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm font-bold text-slate-600">Description</span>
                <textarea
                  rows={4}
                  value={createForm.description}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                />
              </label>
              <label className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3">
                <span className="text-sm font-bold text-slate-600">Private group</span>
                <input
                  type="checkbox"
                  checked={createForm.isPrivate}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      isPrivate: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-[#155BC2]"
                />
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-bold text-slate-600">
                <Users className="h-4 w-4" />
                {createForm.coverImage ? createForm.coverImage.name : "Optional cover image"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      coverImage: event.target.files?.[0] || null,
                    }))
                  }
                  className="hidden"
                />
              </label>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleCreateGroup}
                disabled={saving}
                className="rounded-2xl bg-[#155BC2] px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Create group
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {error ? (
        <div className="rounded-3xl border border-rose-100 bg-white p-5 text-sm font-semibold text-rose-600 shadow-sm">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-3xl border border-slate-100 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Loading groups...
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
          <h2 className="text-xl font-black text-[#091E42]">No groups found</h2>
          <p className="mt-2 text-sm text-slate-500">
            Try another search or create a new community group.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredGroups.map((group) => (
            <article
              key={group.id}
              className={`overflow-hidden rounded-3xl border bg-white shadow-sm ${
                selectedGroupId === group.id
                  ? "border-blue-200 ring-2 ring-blue-50"
                  : "border-slate-100"
              }`}
            >
              <img
                src={group.coverImage}
                alt={group.name}
                className="h-44 w-full object-cover"
              />
              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black text-[#091E42]">{group.name}</h2>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#155BC2]">
                    {group.categoryLabel}
                  </span>
                  {group.unreadCount ? (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                      {group.unreadCount} unread
                    </span>
                  ) : null}
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  {group.memberCount} member(s) · {group.latestActivityLabel}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {group.description || group.latestPostExcerpt || "No group description yet."}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/community/groups/${group.id}`)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"
                  >
                    <Users className="h-4 w-4" />
                    View group
                  </button>
                  {group.isMember ? (
                    <button
                      type="button"
                      onClick={() => onOpenTab?.("messages", group.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Open chat
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleJoinLeave(group)}
                    disabled={saving}
                    className={`rounded-xl px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300 ${
                      group.isMember ? "bg-rose-600" : "bg-[#155BC2]"
                    }`}
                  >
                    {group.isMember ? "Leave group" : "Join group"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
