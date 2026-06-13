import React, { useEffect, useMemo, useState } from "react";
import { ImagePlus, MessageCircle, Plus, Users } from "lucide-react";
import { useCommunity } from "../../context/communityContext.js";

const fieldClassName =
  "mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#155BC2]";

export default function Posts({ selectedGroupId = "", onSelectGroup, onOpenTab }) {
  const {
    joinedGroups: groups,
    postsByGroup,
    ensureJoinedGroups,
    ensurePosts,
    createPost,
  } = useCommunity();

  const [posts, setPosts] = useState([]);
  const [postText, setPostText] = useState("");
  const [postImage, setPostImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const resolvedSelectedGroupId = selectedGroupId || groups[0]?.id || "";

  useEffect(() => {
    const loadGroups = async () => {
      setLoading(true);
      setError("");

      try {
        const joined = await ensureJoinedGroups();
        if (!selectedGroupId && joined[0]?.id) {
          onSelectGroup?.(joined[0].id);
        } else if (
          selectedGroupId &&
          !joined.some((group) => group.id === selectedGroupId) &&
          joined[0]?.id
        ) {
          onSelectGroup?.(joined[0].id);
        }
      } catch (loadError) {
        setError(loadError.message || "Unable to load your groups.");
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, [ensureJoinedGroups, onSelectGroup, selectedGroupId]);

  useEffect(() => {
    if (!resolvedSelectedGroupId) {
      setPosts([]);
      setLoading(false);
      return;
    }

    if (postsByGroup[resolvedSelectedGroupId]) {
      setPosts(postsByGroup[resolvedSelectedGroupId]);
    }

    const loadPosts = async () => {
      setLoading(true);
      setError("");

      try {
        const nextPosts = await ensurePosts(resolvedSelectedGroupId);
        setPosts(nextPosts);
      } catch (loadError) {
        setError(loadError.message || "Unable to load posts.");
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [ensurePosts, postsByGroup, resolvedSelectedGroupId]);

  useEffect(() => {
    if (resolvedSelectedGroupId && postsByGroup[resolvedSelectedGroupId]) {
      setPosts(postsByGroup[resolvedSelectedGroupId]);
    }
  }, [postsByGroup, resolvedSelectedGroupId]);

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === resolvedSelectedGroupId) || null,
    [groups, resolvedSelectedGroupId],
  );

  const handleCreatePost = async () => {
    if (!resolvedSelectedGroupId) {
      setError("Join a group first to create a post.");
      return;
    }
    if (!postText.trim()) {
      setError("Post content is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const created = await createPost({
        groupId: resolvedSelectedGroupId,
        content: postText,
        image: postImage,
      });
      setPostText("");
      setPostImage(null);
      setPosts((current) =>
        current.some((post) => post.id === created.id) ? current : [created, ...current],
      );
    } catch (createError) {
      setError(createError.message || "Failed to create post.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-3xl border border-rose-100 bg-white p-5 text-sm font-semibold text-rose-600 shadow-sm">
          {error}
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <label className="block flex-1">
            <span className="text-sm font-bold text-slate-600">Post to group</span>
            <select
              value={resolvedSelectedGroupId}
              onChange={(event) => onSelectGroup?.(event.target.value)}
              className={fieldClassName}
            >
              {groups.length === 0 ? (
                <option value="">Join a group first</option>
              ) : null}
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>
          {selectedGroup ? (
            <button
              type="button"
              onClick={() => onOpenTab?.("messages", selectedGroup.id)}
              className="inline-flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700"
            >
              <MessageCircle className="h-4 w-4" />
              Open group chat
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenTab?.("groups")}
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#155BC2] px-4 text-sm font-black text-white"
            >
              <Users className="h-4 w-4" />
              Browse groups
            </button>
          )}
        </div>

        <textarea
          rows={5}
          value={postText}
          onChange={(event) => setPostText(event.target.value)}
          placeholder={
            selectedGroup
              ? `Share something with ${selectedGroup.name}...`
              : "Join a group before posting."
          }
          className={`${fieldClassName} mt-4`}
          disabled={!selectedGroup}
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
            <ImagePlus className="h-4 w-4" />
            {postImage ? postImage.name : "Optional image"}
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setPostImage(event.target.files?.[0] || null)}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={handleCreatePost}
            disabled={!selectedGroup || saving}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#155BC2] px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Plus className="h-4 w-4" />
            Publish post
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black text-[#091E42]">Recent Posts</h2>
        <p className="mt-1 text-sm text-slate-500">
          List and create are real. Local-only likes, saves, and comments stay removed until backend support exists.
        </p>

        <div className="mt-5 space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-500">
              Loading posts...
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
              {selectedGroup ? "No posts yet in this group." : "Join a group to see posts."}
            </div>
          ) : (
            posts.map((post) => (
              <article
                key={post.id}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={post.authorAvatar}
                    alt={post.authorName}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-black text-[#091E42]">{post.authorName}</p>
                    <p className="text-xs font-semibold text-slate-400">
                      {post.createdAtLabel}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{post.content}</p>
                {post.image ? (
                  <img
                    src={post.image}
                    alt="Post"
                    className="mt-4 h-64 w-full rounded-2xl object-cover"
                  />
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
