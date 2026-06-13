import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MessageCircle, Users } from "lucide-react";
import { useCommunity } from "../../context/communityContext.js";

export default function GroupDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const {
    groupsById,
    postsByGroup,
    loadingPostsByGroup,
    ensureGroupDetail,
    ensurePosts,
    joinGroup,
    leaveGroup,
  } = useCommunity();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const group = groupsById[String(id)] || null;
  const posts = postsByGroup[String(id)] || [];
  const loadingPosts = Boolean(loadingPostsByGroup[String(id)]);

  const loadGroup = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const detail = await ensureGroupDetail(id, { force: true });
      if (detail?.isMember) {
        await ensurePosts(id);
      }
    } catch (loadError) {
      setError(loadError.message || "Unable to load this group.");
    } finally {
      setLoading(false);
    }
  }, [ensureGroupDetail, ensurePosts, id]);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  const handleJoinLeave = async () => {
    if (!group) return;
    setSaving(true);
    setError("");

    try {
      if (group.isMember) {
        await leaveGroup(group.id);
      } else {
        await joinGroup(group.id);
        await ensurePosts(group.id, { force: true });
      }
      await ensureGroupDetail(group.id, { force: true });
    } catch (actionError) {
      setError(actionError.message || "Failed to update membership.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] px-4 py-8 text-sm text-slate-500">
        Loading group...
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] px-4 py-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-rose-100 bg-white p-6 text-sm font-semibold text-rose-600 shadow-sm">
          {error || "Group not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#091E42]">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(`/community?tab=groups&group=${id}`)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to groups
          </button>

          <div className="flex flex-wrap gap-2">
            {group.isMember ? (
              <button
                type="button"
                onClick={() => navigate(`/community?tab=messages&group=${group.id}`)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm"
              >
                <MessageCircle className="h-4 w-4" />
                Open chat
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleJoinLeave}
              disabled={saving}
              className={`rounded-2xl px-4 py-3 text-sm font-black text-white shadow-sm disabled:cursor-not-allowed disabled:bg-slate-300 ${
                group.isMember ? "bg-rose-600" : "bg-[#155BC2]"
              }`}
            >
              {group.isMember ? "Leave group" : "Join group"}
            </button>
          </div>
        </div>

        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
          <img
            src={group.coverImage}
            alt={group.name}
            className="h-64 w-full object-cover"
          />
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-black text-[#091E42]">{group.name}</h1>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#155BC2]">
                {group.categoryLabel}
              </span>
            </div>

            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <Users className="h-4 w-4 text-blue-600" />
              {group.memberCount} member(s)
              <span>·</span>
              {group.latestActivityLabel}
            </p>

            <div className="mt-5 rounded-3xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-sm leading-7 text-slate-600">
                {group.description || "This group has no description yet."}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-[#091E42]">Recent Posts</h2>
              <p className="mt-1 text-sm text-slate-500">
                Posts are visible after joining this group.
              </p>
            </div>
            {group.isMember ? (
              <button
                type="button"
                onClick={() => navigate(`/community?tab=posts&group=${group.id}`)}
                className="text-sm font-black text-[#155BC2]"
              >
                Open feed
              </button>
            ) : null}
          </div>

          <div className="mt-5 space-y-4">
            {!group.isMember ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                Join this group to view its posts and group chat.
              </div>
            ) : loadingPosts ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-500">
                Loading recent posts...
              </div>
            ) : posts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                No posts yet in this group.
              </div>
            ) : (
              posts.slice(0, 5).map((post) => (
                <article
                  key={post.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={post.authorAvatar}
                      alt={post.authorName}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-black text-[#091E42]">{post.authorName}</p>
                      <p className="text-xs font-semibold text-slate-400">
                        {post.createdAtLabel}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {post.content}
                  </p>
                  {post.image ? (
                    <img
                      src={post.image}
                      alt="Post"
                      className="mt-4 h-52 w-full rounded-2xl object-cover"
                    />
                  ) : null}
                </article>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
