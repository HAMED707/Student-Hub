import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  GraduationCap,
  MessageCircle,
  Plus,
  Users,
  X,
} from "lucide-react";
import Navbar from "../../assets/components/Navbar/Navbar.jsx";
import { useCommunity } from "../../context/communityContext.js";
import { getStoredUser } from "../../utils/auth.js";
import { withApiUrl } from "../../api/client.js";
import { formatCommunityRelative } from "../../utils/community.js";
import { fetchComments, createComment, votePost } from "../../api/community.js";
import { fetchMyRoommateProfile } from "../../api/roommates.js";
import Messages from "./Messages.jsx";

// ─── helpers ─────────────────────────────────────────────────────────────────

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function avatarUrl(user) {
  if (!user) return "";
  if (user.avatarUrl) return withApiUrl(user.avatarUrl);
  if (user.profile_picture) return withApiUrl(user.profile_picture);
  return "";
}

// ─── UserAvatar ──────────────────────────────────────────────────────────────

function UserAvatar({ name = "", src = "", size = 32 }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        style={{ width: size, height: size }}
        className="rounded-full object-cover flex-shrink-0"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className="rounded-full bg-[#155BC2] text-white flex items-center justify-center font-bold flex-shrink-0 select-none"
    >
      {initials(name) || "?"}
    </div>
  );
}

// ─── VoteRail ────────────────────────────────────────────────────────────────

function VoteRail({ score, userVote, onVote, disabled }) {
  const scoreColor =
    score > 0
      ? "text-emerald-600"
      : score < 0
        ? "text-rose-500"
        : "text-slate-400";

  return (
    <div className="flex flex-col items-center gap-0.5 pt-0.5 pr-3 select-none flex-shrink-0" style={{ minWidth: 36 }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onVote(1)}
        aria-label="Upvote"
        className={`rounded p-0.5 transition-colors ${
          userVote === 1
            ? "bg-emerald-100 text-emerald-600"
            : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
        } disabled:opacity-40`}
      >
        <ChevronUp size={20} />
      </button>
      <span className={`text-xs font-bold tabular-nums ${scoreColor}`} style={{ minWidth: 20, textAlign: "center" }}>
        {score}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onVote(-1)}
        aria-label="Downvote"
        className={`rounded p-0.5 transition-colors ${
          userVote === -1
            ? "bg-rose-100 text-rose-500"
            : "text-slate-400 hover:text-rose-500 hover:bg-rose-50"
        } disabled:opacity-40`}
      >
        <ChevronDown size={20} />
      </button>
    </div>
  );
}

// ─── CommentThread ────────────────────────────────────────────────────────────

function CommentThread({ postId, commentCount, currentUser }) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localCount, setLocalCount] = useState(commentCount);
  const loaded = useRef(false);

  const load = useCallback(async () => {
    if (loaded.current) return;
    setLoading(true);
    try {
      const data = await fetchComments(postId);
      setComments(Array.isArray(data) ? data : []);
      loaded.current = true;
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const toggle = () => {
    setOpen((v) => {
      if (!v) load();
      return !v;
    });
  };

  const submit = async () => {
    if (!draft.trim() || submitting) return;
    setSubmitting(true);
    try {
      const c = await createComment(postId, draft.trim());
      setComments((prev) => [...prev, c]);
      setLocalCount((n) => n + 1);
      setDraft("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#155BC2] transition-colors"
      >
        <MessageCircle size={14} />
        {localCount === 0 ? "Add a comment" : `${localCount} comment${localCount === 1 ? "" : "s"}`}
      </button>

      {open && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
          {loading && (
            <p className="text-xs text-slate-400">Loading comments…</p>
          )}
          {comments.map((c) => {
            const a = c.author || {};
            const aName = [a.first_name, a.last_name].filter(Boolean).join(" ").trim() || a.username || "Member";
            return (
              <div key={c.id} className="flex gap-2 items-start">
                <UserAvatar name={aName} src={a.profile_picture ? withApiUrl(a.profile_picture) : ""} size={26} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-[#091E42]">{aName}</span>
                    <span className="text-xs text-slate-400">{formatCommunityRelative(c.created_at)}</span>
                  </div>
                  <p className="mt-0.5 break-words text-sm leading-5 text-slate-600">{c.text}</p>
                </div>
              </div>
            );
          })}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <UserAvatar name={currentUser?.name || ""} src={avatarUrl(currentUser)} size={26} />
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder={`Reply as ${currentUser?.name || "you"}…`}
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm outline-none focus:border-[#155BC2]"
              />
            </div>
            <button
              type="button"
              onClick={submit}
              disabled={submitting || !draft.trim()}
              className="w-full rounded-xl bg-[#155BC2] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40 sm:w-auto"
            >
              Reply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PostCard ─────────────────────────────────────────────────────────────────

function PostCard({ post, currentUser, onVote }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-5">
      <div className="flex">
        <VoteRail
          score={post.voteScore}
          userVote={post.userVote}
          onVote={(dir) => onVote(post.id, dir)}
        />

        <div className="flex-1 min-w-0">
          {post.title ? (
            <h3 className="mb-1 break-words text-base font-black leading-snug text-[#091E42]">{post.title}</h3>
          ) : null}

          <div className="mb-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <UserAvatar name={post.authorName} src={post.authorAvatar} size={22} />
            <span className="max-w-full truncate text-xs font-semibold text-slate-500">{post.authorName}</span>
            <span className="text-xs text-slate-400">· {post.createdAtLabel}</span>
          </div>

          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{post.content}</p>

          {post.image ? (
            <img src={post.image} alt="Post" className="mt-3 rounded-2xl w-full object-cover max-h-64" />
          ) : null}

          <CommentThread
            postId={post.id}
            commentCount={post.commentCount}
            currentUser={currentUser}
          />
        </div>
      </div>
    </article>
  );
}

// ─── Composer ─────────────────────────────────────────────────────────────────

function Composer({ group, currentUser, onSubmit }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!body.trim() || saving) return;
    setSaving(true);
    try {
      await onSubmit(title.trim(), body.trim());
      setTitle("");
      setBody("");
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-400 hover:border-[#155BC2] transition-colors shadow-sm text-left"
      >
        <UserAvatar name={currentUser?.name || ""} src={avatarUrl(currentUser)} size={30} />
        Share something with {group?.name}…
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        className="w-full text-base font-bold text-[#091E42] outline-none border-b border-slate-100 pb-2 bg-transparent"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What's on your mind?"
        rows={4}
        className="w-full text-sm text-slate-700 outline-none resize-none bg-transparent leading-6"
      />
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-bold text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={saving || !body.trim()}
          className="text-xs font-bold text-white bg-[#155BC2] px-4 py-2 rounded-xl disabled:opacity-40"
        >
          {saving ? "Posting…" : "Post"}
        </button>
      </div>
    </div>
  );
}

// ─── PostFeed ─────────────────────────────────────────────────────────────────

function PostFeed({ group, currentUser, posts, loading, onVote, onPost }) {
  const sorted = useMemo(
    () => [...posts].sort((a, b) => b.voteScore - a.voteScore || new Date(b.createdAt) - new Date(a.createdAt)),
    [posts],
  );

  return (
    <div className="space-y-4">
      <Composer group={group} currentUser={currentUser} onSubmit={onPost} />

      {loading && (
        <div className="rounded-3xl border border-slate-100 bg-white p-6 text-sm text-slate-400 shadow-sm">
          Loading posts…
        </div>
      )}

      {!loading && sorted.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-slate-400 text-sm">No posts yet — be the first to share something.</p>
        </div>
      )}

      {sorted.map((post) => (
        <PostCard key={post.id} post={post} currentUser={currentUser} onVote={onVote} />
      ))}
    </div>
  );
}

// ─── GroupHeader ──────────────────────────────────────────────────────────────

function GroupHeader({ group, onJoin, onLeave, joining, onOpenChat }) {
  if (!group) return null;
  return (
    <div className="mb-5">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:flex-wrap">
        <div className="min-w-0 max-w-full">
          <div className="flex items-center gap-2">
            {group.categoryValue === "university" && (
              <GraduationCap size={18} className="text-[#155BC2] flex-shrink-0" />
            )}
            <h1 className="break-words text-lg font-black text-[#091E42] sm:truncate sm:text-xl">{group.name}</h1>
          </div>
          {group.description ? (
            <p className="mt-1 break-words text-sm leading-5 text-slate-500">{group.description}</p>
          ) : null}
          <div className="flex items-center gap-1.5 mt-1 text-slate-400">
            <Users size={13} />
            <span className="text-xs">{group.memberCount} member{group.memberCount === 1 ? "" : "s"}</span>
          </div>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto sm:flex-shrink-0">
          {group.isMember && (
            <button
              type="button"
              onClick={onOpenChat}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 sm:flex-none"
            >
              <MessageCircle size={14} />
              Chat
            </button>
          )}
          <button
            type="button"
            onClick={group.isMember ? onLeave : onJoin}
            disabled={joining}
            className={`flex-1 rounded-xl px-4 py-2 text-xs font-bold transition-colors disabled:opacity-40 sm:flex-none ${
              group.isMember
                ? "bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600"
                : "bg-[#155BC2] text-white hover:bg-[#1249a3]"
            }`}
          >
            {joining ? "…" : group.isMember ? "Joined" : "Join group"}
          </button>
        </div>
      </div>
      <hr className="mt-4 border-slate-100" />
    </div>
  );
}

// ─── NewGroupModal ────────────────────────────────────────────────────────────

function NewGroupModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await onCreate(name.trim(), description.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[360px] rounded-3xl bg-white p-4 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-[#091E42] text-lg">New group</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <label className="block mb-3">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Name</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#155BC2]"
          />
        </label>

        <label className="block mb-4">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Description</span>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none resize-none focus:border-[#155BC2]"
          />
        </label>

        <button
          type="button"
          onClick={submit}
          disabled={saving || !name.trim()}
          className="w-full text-sm font-black text-white bg-[#155BC2] rounded-xl py-2.5 disabled:opacity-40"
        >
          {saving ? "Creating…" : "Create group"}
        </button>
      </div>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ groups, selectedId, onSelect, onNewGroup }) {
  const university = groups.filter((g) => g.categoryValue === "university");
  const other      = groups.filter((g) => g.categoryValue !== "university");

  const renderGroup = (g) => (
    <button
      key={g.id}
      type="button"
      onClick={() => onSelect(g.id)}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-left transition-colors ${
        g.id === selectedId
          ? "bg-[#155BC2]/10 text-[#155BC2]"
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {g.categoryValue === "university" ? (
        <GraduationCap size={14} className="flex-shrink-0 opacity-70" />
      ) : (
        <span className="w-2 h-2 rounded-full bg-[#155BC2] opacity-50 flex-shrink-0" />
      )}
      <span className="flex-1 truncate text-sm font-semibold">{g.name}</span>
      <span className="text-xs text-slate-400 tabular-nums">{g.memberCount}</span>
      {g.isMember && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" title="Joined" />
      )}
    </button>
  );

  return (
    <aside className="hidden w-60 flex-shrink-0 flex-col overflow-hidden border-r border-slate-100 bg-white lg:flex">
      <div className="px-4 py-4 border-b border-slate-100">
        <p className="text-xs font-black uppercase tracking-widest text-[#155BC2]">Community</p>
        <h2 className="mt-0.5 text-lg font-black text-[#091E42]">Groups</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {university.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400 px-3 mb-1">
              University
            </p>
            <div className="space-y-0.5">
              {university.map(renderGroup)}
            </div>
          </div>
        )}

        {other.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400 px-3 mb-1">
              Interest groups
            </p>
            <div className="space-y-0.5">
              {other.map(renderGroup)}
            </div>
          </div>
        )}

        {groups.length === 0 && (
          <p className="text-xs text-slate-400 px-3">No groups yet.</p>
        )}
      </div>

      <div className="p-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onNewGroup}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-bold text-[#155BC2] hover:bg-[#155BC2]/10 transition-colors"
        >
          <Plus size={15} />
          New group
        </button>
      </div>
    </aside>
  );
}

// ─── Community (main page) ────────────────────────────────────────────────────

export default function Community() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedGroupId = searchParams.get("group") || "";
  const viewMode        = searchParams.get("view") || "feed"; // "feed" | "chat"

  const {
    catalogGroups,
    joinedGroups,
    postsByGroup,
    loadingCatalog,
    loadingPostsByGroup,
    ensureCatalog,
    ensurePosts,
    joinGroup,
    leaveGroup,
    createGroup,
    createPost,
  } = useCommunity();

  const currentUser = useMemo(() => getStoredUser(), []);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [joining, setJoining] = useState(false);
  const [posts, setPosts] = useState([]);
  const [userUniversity, setUserUniversity] = useState("");
  const autoJoinedRef = useRef(false);

  // Fetch roommate profile once to get university for auto-join
  useEffect(() => {
    fetchMyRoommateProfile()
      .then((data) => { if (data?.university) setUserUniversity(data.university); })
      .catch(() => {});
  }, []);

  // Merge catalog + joined so the sidebar always shows both
  const allGroups = useMemo(() => {
    const seen = new Set();
    return [...catalogGroups, ...joinedGroups].filter((g) => {
      if (seen.has(g.id)) return false;
      seen.add(g.id);
      return true;
    });
  }, [catalogGroups, joinedGroups]);

  const selectedGroup = useMemo(
    () => allGroups.find((g) => g.id === selectedGroupId) || null,
    [allGroups, selectedGroupId],
  );

  const setGroup = useCallback((id, view = "feed") => {
    setSearchParams({ group: String(id), view }, { replace: true });
  }, [setSearchParams]);

  // Load all groups on mount
  useEffect(() => {
    ensureCatalog();
  }, [ensureCatalog]);

  // Auto-select first group if none selected
  useEffect(() => {
    if (!selectedGroupId && allGroups.length > 0) {
      setGroup(allGroups[0].id);
    }
  }, [allGroups, selectedGroupId, setGroup]);

  // Auto-join user's university group once
  useEffect(() => {
    if (autoJoinedRef.current || !userUniversity || allGroups.length === 0) return;

    const uniGroup = allGroups.find(
      (g) =>
        g.categoryValue === "university" &&
        g.name.toLowerCase() === userUniversity.toLowerCase(),
    );
    if (!uniGroup) return;

    autoJoinedRef.current = true;
    if (!uniGroup.isMember) {
      joinGroup(uniGroup.id).catch(() => {});
    }
  }, [allGroups, userUniversity, joinGroup]);

  // Load posts when group changes
  useEffect(() => {
    if (!selectedGroupId) return;

    const cached = postsByGroup[selectedGroupId];
    if (cached) setPosts(cached);

    if (selectedGroup?.isMember) {
      ensurePosts(selectedGroupId)
        .then((p) => setPosts(p || []))
        .catch(() => {});
    }
  }, [selectedGroupId, selectedGroup?.isMember, ensurePosts, postsByGroup]);

  // Keep local posts in sync with context cache
  useEffect(() => {
    const cached = postsByGroup[selectedGroupId];
    if (cached) setPosts(cached);
  }, [postsByGroup, selectedGroupId]);

  const handleJoin = useCallback(async () => {
    if (!selectedGroupId) return;
    setJoining(true);
    try { await joinGroup(selectedGroupId); } finally { setJoining(false); }
  }, [joinGroup, selectedGroupId]);

  const handleLeave = useCallback(async () => {
    if (!selectedGroupId) return;
    setJoining(true);
    try { await leaveGroup(selectedGroupId); } finally { setJoining(false); }
  }, [leaveGroup, selectedGroupId]);

  const handlePost = useCallback(async (title, content) => {
    if (!selectedGroupId) return;
    await createPost({ groupId: selectedGroupId, title, content });
  }, [createPost, selectedGroupId]);

  const handleVote = useCallback(async (postId, direction) => {
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const wasVoted = p.userVote === direction;
        const prevVote = p.userVote;
        const nextVote = wasVoted ? 0 : direction;
        const scoreDelta = nextVote - prevVote;
        return { ...p, userVote: nextVote, voteScore: p.voteScore + scoreDelta };
      }),
    );
    try {
      const result = await votePost(postId, direction);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, voteScore: result.score, userVote: result.user_vote } : p,
        ),
      );
    } catch {
      // Revert on failure by re-fetching
      if (selectedGroupId) {
        ensurePosts(selectedGroupId, { force: true })
          .then((p) => setPosts(p || []))
          .catch(() => {});
      }
    }
  }, [ensurePosts, selectedGroupId]);

  const handleNewGroup = useCallback(async (name, description) => {
    const created = await createGroup({ name, description, category: "other" });
    if (created?.id) setGroup(created.id);
  }, [createGroup, setGroup]);

  const isFeedLoading = Boolean(loadingCatalog || loadingPostsByGroup[selectedGroupId]);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-slate-50 font-sans text-[#091E42]">
      <Navbar activePage="/community" />

      <div className="flex min-h-0 flex-1 flex-col overflow-visible lg:flex-row lg:overflow-hidden">
        <Sidebar
          groups={allGroups}
          selectedId={selectedGroupId}
          onSelect={(id) => setGroup(id, "feed")}
          onNewGroup={() => setShowNewGroup(true)}
        />

        <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-slate-200 bg-white/95 px-3 py-3 backdrop-blur lg:hidden">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Select community group</span>
            <select
              value={selectedGroupId}
              onChange={(event) => setGroup(event.target.value, "feed")}
              className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-[#091E42] outline-none focus:border-[#155BC2]"
            >
              {allGroups.length === 0 ? <option value="">No groups yet</option> : null}
              {allGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.memberCount})
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => setShowNewGroup(true)}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#155BC2] text-white"
            aria-label="Create a new group"
          >
            <Plus size={18} />
          </button>
        </div>

        <main className="mx-auto w-full min-w-0 max-w-5xl flex-1 p-3 sm:p-5 lg:overflow-y-auto lg:p-6">
          {selectedGroup ? (
            <>
              <GroupHeader
                group={selectedGroup}
                onJoin={handleJoin}
                onLeave={handleLeave}
                joining={joining}
                onOpenChat={() => setGroup(selectedGroupId, "chat")}
              />

              {viewMode === "chat" ? (
                <div className="h-[65dvh] min-h-[420px] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm sm:rounded-3xl lg:h-[calc(100vh-280px)]">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-2 sm:px-4">
                    <span className="text-sm font-bold text-slate-600">Group Chat</span>
                    <button
                      type="button"
                      onClick={() => setGroup(selectedGroupId, "feed")}
                      className="text-xs font-bold text-[#155BC2] hover:underline"
                    >
                      ← Back to feed
                    </button>
                  </div>
                  <Messages
                    selectedGroupId={selectedGroupId}
                    onSelectGroup={(id) => setGroup(id, "chat")}
                  />
                </div>
              ) : selectedGroup.isMember ? (
                <PostFeed
                  group={selectedGroup}
                  currentUser={currentUser}
                  posts={posts}
                  loading={isFeedLoading}
                  onVote={handleVote}
                  onPost={handlePost}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center shadow-sm sm:rounded-3xl sm:p-10">
                  <GraduationCap size={32} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500 font-semibold mb-4">
                    Join this group to see posts and join the conversation.
                  </p>
                  <button
                    type="button"
                    onClick={handleJoin}
                    disabled={joining}
                    className="text-sm font-black text-white bg-[#155BC2] rounded-2xl px-6 py-2.5 disabled:opacity-40"
                  >
                    {joining ? "Joining…" : "Join group"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-400 text-sm">Select a group from the sidebar.</p>
            </div>
          )}
        </main>
      </div>

      {showNewGroup && (
        <NewGroupModal
          onClose={() => setShowNewGroup(false)}
          onCreate={handleNewGroup}
        />
      )}
    </div>
  );
}
