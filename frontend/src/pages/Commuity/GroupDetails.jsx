import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  Check,
  Clock,
  MessageCircle,
  Share2,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { loadGroups, saveGroups } from "./groupData.js";
import { fetchGroupDetail } from "../../api/community.js";

const formatMembers = (members) =>
  members >= 1000 ? `${(members / 1000).toFixed(1)}k` : members;

const GroupDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const groupId = Number(id);

  const [groups, setGroups] = useState(() => loadGroups());
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const group = useMemo(
    () => groups.find((item) => item.id === groupId),
    [groups, groupId],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => setIsLoading(false), 240);
    return () => window.clearTimeout(timeout);
  }, [groupId]);

  useEffect(() => {
    fetchGroupDetail(groupId)
      .then((data) => {
        if (!data) return;
        setGroups((current) =>
          current.map((item) =>
            item.id === groupId
              ? {
                  ...item,
                  name: data.name,
                  desc: data.description,
                  category: data.category,
                  image: data.cover_image || item.image,
                  members: data.member_count,
                  isMyGroup: data.is_member,
                }
              : item,
          ),
        );
      })
      .catch(() => {});
  }, [groupId]);

  useEffect(() => {
    saveGroups(groups);
  }, [groups]);

  const showNotice = useCallback((text) => {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 2200);
  }, []);

  const handleJoinGroup = useCallback(() => {
    if (!group) return;

    setGroups((currentGroups) =>
      currentGroups.map((item) =>
        item.id === group.id
          ? {
              ...item,
              isMyGroup: true,
              members: item.members + 1,
              unread: 1,
              lastActivity: "Just now",
              latestActivity: `${item.lastActiveMember} joined the discussion`,
            }
          : item,
      ),
    );

    showNotice(`${group.name} joined`);
  }, [group, showNotice]);

  const handleLeaveGroup = useCallback(() => {
    if (!group) return;

    if (!window.confirm(`Leave ${group.name}?`)) {
      return;
    }

    setGroups((currentGroups) =>
      currentGroups.map((item) =>
        item.id === group.id
          ? {
              ...item,
              isMyGroup: false,
              unread: 0,
              members: Math.max(item.members - 1, 1),
              lastActivity: "Left recently",
            }
          : item,
      ),
    );

    showNotice(`${group.name} left`);
  }, [group, showNotice]);

  const openGroupChat = useCallback(() => {
    if (!group) return;
    showNotice(`Opening ${group.name} chat`);
  }, [group, showNotice]);

  const copyLink = useCallback(async () => {
    if (!group) return;
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/community/groups/${group.id}`,
      );
      showNotice("Group link copied");
    } catch {
      showNotice("Unable to copy link");
    }
  }, [group, showNotice]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <div className="space-y-4">
          <div className="h-12 w-32 animate-pulse rounded-full bg-gray-200" />
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
              <div className="space-y-4">
                <div className="h-56 animate-pulse rounded-3xl bg-gray-200" />
                <div className="space-y-3">
                  <div className="h-6 w-1/3 animate-pulse rounded-full bg-gray-200" />
                  <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-24 animate-pulse rounded-3xl bg-gray-200"
                    />
                  ))}
                </div>
                <div className="h-32 animate-pulse rounded-3xl bg-gray-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="mx-auto max-w-4xl p-4 sm:p-6">
        <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#155BC2]">
            Group not found
          </p>
          <h1 className="mt-4 text-3xl font-black text-[#091E42]">
            This group does not exist.
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            The group link may be invalid or the group has been removed.
          </p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#155BC2] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#0f4aa0]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {notice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-4 top-24 z-50 rounded-full bg-[#091E42] px-4 py-2 text-xs font-bold text-white shadow-lg"
        >
          {notice}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-[#091E42] transition hover:border-[#155BC2]/30 hover:text-[#155BC2]"
          aria-label="Back to community groups"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to groups
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-[#091E42] transition hover:border-[#155BC2]/30 hover:text-[#155BC2]"
          >
            <Share2 className="h-4 w-4" />
            Copy link
          </button>
          <button
            type="button"
            onClick={openGroupChat}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#155BC2] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[#0f4aa0]"
          >
            <MessageCircle className="h-4 w-4" />
            Open chat
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="relative h-72 sm:h-96">
          <img
            src={group.image}
            alt={group.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#091E42]/75 to-transparent" />
          <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-[#155BC2] shadow-sm">
            {group.category}
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-sm font-bold text-white/70">
              {group.city} · {group.university}
            </p>
            <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">
              {group.name}
            </h1>
          </div>
        </div>

        <div className="grid gap-6 px-5 py-6 md:grid-cols-[minmax(0,1fr)_320px] md:px-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-gray-600">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#F8FAFC] px-3 py-2 text-[#155BC2]">
                <Users className="h-4 w-4" />
                {formatMembers(group.members)} members
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#F8FAFC] px-3 py-2 text-[#155BC2]">
                <Activity className="h-4 w-4" />
                {group.activeToday} active today
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#F8FAFC] px-3 py-2 text-[#155BC2]">
                <TrendingUp className="h-4 w-4" />
                {group.weeklyPosts} posts weekly
              </span>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-[#F8FAFC] p-5">
              <p className="text-sm font-black text-[#091E42]">
                About this group
              </p>
              <p className="mt-3 text-sm leading-7 text-gray-600">
                {group.desc}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400">
                  Latest activity
                </p>
                <p className="mt-3 text-sm font-black text-[#091E42]">
                  {group.latestActivity}
                </p>
              </div>
              <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400">
                  Last post
                </p>
                <p className="mt-3 text-sm font-black text-[#091E42]">
                  {group.lastPostTime}
                </p>
              </div>
              <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400">
                  Last active
                </p>
                <p className="mt-3 text-sm font-black text-[#091E42]">
                  {group.lastActiveMember}
                </p>
              </div>
            </div>
          </div>

          <aside className="space-y-4 rounded-3xl border border-gray-100 bg-[#F8FAFC] p-5">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400">
                Group actions
              </p>
              <div className="flex flex-wrap gap-3">
                {group.isMyGroup ? (
                  <button
                    type="button"
                    onClick={handleLeaveGroup}
                    className="inline-flex min-w-[10rem] items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#091E42] shadow-sm transition hover:bg-gray-50"
                  >
                    <X className="h-4 w-4" />
                    Leave group
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleJoinGroup}
                    className="inline-flex min-w-[10rem] items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-600"
                  >
                    <Check className="h-4 w-4" />
                    Join group
                  </button>
                )}
                <button
                  type="button"
                  onClick={openGroupChat}
                  className="inline-flex min-w-[10rem] items-center justify-center gap-2 rounded-2xl bg-[#155BC2] px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#0f4aa0]"
                >
                  <MessageCircle className="h-4 w-4" />
                  Open chat
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-600">
              <p className="font-black text-[#091E42]">Community highlights</p>
              <p className="mt-2">
                {group.recentPostsCount} recent posts · {group.lastActivity}
              </p>
            </div>
          </aside>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#155BC2]">
              Recent activity feed
            </p>
            <h2 className="mt-2 text-xl font-black text-[#091E42]">
              What’s happening in the group
            </h2>
          </div>
          <p className="text-sm text-gray-500">
            {group.activityFeed.length} recent updates
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {group.activityFeed.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border border-gray-100 bg-[#F8FAFC] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-black text-[#091E42]">{item.user}</p>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-400">
                  {item.time}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {item.action}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GroupDetails;
