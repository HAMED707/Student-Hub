import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  Hash,
  Image as ImageIcon,
  MessageCircle,
  Search,
  Send,
  Share2,
  ThumbsUp,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import {
  createPost,
  fetchMyGroups,
  fetchPosts,
} from "../../api/community.js";
import { fetchMyProfile } from "../../api/accounts.js";
import { withApiUrl } from "../../api/client.js";

const MAX_CHARS = 500;

const formatRelativeDate = (value) => {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  const diffMs = date.getTime() - Date.now();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffDays) < 1) {
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (Math.abs(diffHours) < 1) {
      return formatter.format(
        Math.round(diffMs / (1000 * 60)) || -1,
        "minute",
      );
    }
    return formatter.format(diffHours, "hour");
  }

  if (Math.abs(diffDays) < 30) return formatter.format(diffDays, "day");
  return formatter.format(Math.round(diffDays / 30), "month");
};

const normalizeCategory = (value) =>
  String(value || "group")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const buildAvatar = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "User",
  )}&background=0A2647&color=fff&bold=true`;

const Posts = () => {
  const [currentUser, setCurrentUser] = useState({
    name: "Community Member",
    avatar: buildAvatar("Community Member"),
  });
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [postText, setPostText] = useState("");
  const [postImage, setPostImage] = useState(null);
  const [likedPosts, setLikedPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [commentInputs, setCommentInputs] = useState({});
  const [commentsByPost, setCommentsByPost] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    const timeout = notice
      ? window.setTimeout(() => setNotice(""), 1800)
      : undefined;
    return () => {
      if (timeout) window.clearTimeout(timeout);
    };
  }, [notice]);

  useEffect(() => {
    return () => {
      if (postImage?.preview?.startsWith("blob:")) {
        URL.revokeObjectURL(postImage.preview);
      }
    };
  }, [postImage]);

  useEffect(() => {
    const loadGroups = async () => {
      setLoading(true);
      setError("");

      try {
        const [profile, joinedGroups] = await Promise.all([
          fetchMyProfile(),
          fetchMyGroups(),
        ]);

        const fullName =
          [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
          profile?.username ||
          "Community Member";

        setCurrentUser({
          name: fullName,
          avatar: profile?.profile_picture
            ? withApiUrl(profile.profile_picture)
            : buildAvatar(fullName),
        });
        setGroups(joinedGroups || []);
        if ((joinedGroups || []).length > 0) {
          setSelectedGroupId(String(joinedGroups[0].id));
        }
      } catch (loadError) {
        setError(loadError.message || "Unable to load your groups.");
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, []);

  useEffect(() => {
    const loadPosts = async () => {
      if (!selectedGroupId) {
        setPosts([]);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const group = groups.find((item) => String(item.id) === String(selectedGroupId));
        const response = await fetchPosts(selectedGroupId);
        const normalizedPosts = (response || []).map((post) => {
          const authorName =
            [post.author?.first_name, post.author?.last_name]
              .filter(Boolean)
              .join(" ") || `Member #${post.author?.id || post.id}`;

          return {
            id: post.id,
            title:
              post.content.length > 70
                ? `${post.content.slice(0, 70)}...`
                : post.content,
            content: post.content,
            topic: normalizeCategory(group?.category),
            author: authorName,
            avatar: buildAvatar(authorName),
            time: formatRelativeDate(post.created_at),
            image: post.image ? withApiUrl(post.image) : "",
            createdAt: new Date(post.created_at).getTime() || Date.now(),
          };
        });

        setPosts(normalizedPosts);
      } catch (loadError) {
        setPosts([]);
        setError(loadError.message || "Unable to load group posts.");
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [groups, selectedGroupId]);

  const selectedGroup = useMemo(
    () => groups.find((group) => String(group.id) === String(selectedGroupId)) || null,
    [groups, selectedGroupId],
  );

  const trendingTopics = useMemo(
    () =>
      [...new Set(groups.map((group) => `#${normalizeCategory(group.category)}`))].slice(
        0,
        5,
      ),
    [groups],
  );

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return posts.filter((post) => {
      const localComments = commentsByPost[post.id] || [];
      const localCommentText = localComments.map((comment) => comment.text).join(" ");

      return (
        !query ||
        post.author.toLowerCase().includes(query) ||
        post.topic.toLowerCase().includes(query) ||
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        localCommentText.toLowerCase().includes(query)
      );
    });
  }, [commentsByPost, posts, searchQuery]);

  const savedPostItems = useMemo(
    () => posts.filter((post) => savedPosts.includes(post.id)).slice(0, 5),
    [posts, savedPosts],
  );

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (postImage?.preview?.startsWith("blob:")) {
      URL.revokeObjectURL(postImage.preview);
    }

    setPostImage({
      file,
      preview: URL.createObjectURL(file),
    });
    event.target.value = "";
  };

  const handleCreatePost = async () => {
    const trimmedText = postText.trim();
    if (!trimmedText || !selectedGroupId) return;

    try {
      const createdPost = await createPost({
        group: selectedGroupId,
        content: trimmedText,
        image: postImage?.file,
      });

      const freshPost = {
        id: createdPost.id,
        title:
          createdPost.content.length > 70
            ? `${createdPost.content.slice(0, 70)}...`
            : createdPost.content,
        content: createdPost.content,
        topic: normalizeCategory(selectedGroup?.category),
        author: currentUser.name,
        avatar: currentUser.avatar,
        time: "Just now",
        image: createdPost.image ? withApiUrl(createdPost.image) : "",
        createdAt: Date.now(),
      };

      setPosts((currentPosts) => [freshPost, ...currentPosts]);
      setPostText("");
      if (postImage?.preview?.startsWith("blob:")) {
        URL.revokeObjectURL(postImage.preview);
      }
      setPostImage(null);
      setNotice("Post published");
    } catch (createError) {
      setNotice(createError.message || "Unable to publish post");
    }
  };

  const handleToggleLike = (postId) => {
    setLikedPosts((currentLikes) =>
      currentLikes.includes(postId)
        ? currentLikes.filter((id) => id !== postId)
        : [...currentLikes, postId],
    );
  };

  const handleToggleSave = (postId) => {
    setSavedPosts((currentSaved) =>
      currentSaved.includes(postId)
        ? currentSaved.filter((id) => id !== postId)
        : [...currentSaved, postId],
    );
  };

  const handleSharePost = async (post) => {
    const shareText = `${post.title}\n\n${post.content}`;
    const shareUrl = `${window.location.origin}/community?group=${selectedGroupId}&post=${post.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: shareText,
          url: shareUrl,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      }
      setNotice("Post link shared");
    } catch {
      setNotice("Share cancelled");
    }
  };

  const handleAddComment = (postId) => {
    const text = (commentInputs[postId] || "").trim();
    if (!text) return;

    setCommentsByPost((currentComments) => ({
      ...currentComments,
      [postId]: [
        ...(currentComments[postId] || []),
        {
          id: Date.now(),
          author: currentUser.name,
          avatar: currentUser.avatar,
          text,
          time: "Just now",
        },
      ],
    }));
    setCommentInputs((currentInputs) => ({ ...currentInputs, [postId]: "" }));
  };

  return (
    <div className="relative mx-auto grid max-w-6xl gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
      {notice && (
        <div className="fixed right-5 top-24 z-50 rounded-full bg-[#091E42] px-4 py-2 text-xs font-bold text-white shadow-lg">
          {notice}
        </div>
      )}

      <section className="min-w-0 space-y-5">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
            <label className="relative block">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search posts by author, keyword, topic, or comments..."
                className="h-11 w-full rounded-xl border border-gray-100 bg-[#F8FAFC] pl-11 pr-4 text-sm font-semibold text-[#091E42] outline-none transition focus:border-[#155BC2] focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </label>

            <label className="flex h-11 items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 text-xs font-black text-gray-600">
              <Users className="h-4 w-4 text-[#155BC2]" />
              <select
                value={selectedGroupId}
                onChange={(event) => setSelectedGroupId(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-xs font-black outline-none"
              >
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedGroup && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-[#155BC2]">
                {selectedGroup.name}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1">
                #{normalizeCategory(selectedGroup.category)}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1">
                {selectedGroup.member_count} members
              </span>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex gap-3">
            <img
              src={currentUser.avatar}
              className="h-12 w-12 rounded-full border border-gray-100 shadow-sm"
              alt={currentUser.name}
            />

            <div className="min-w-0 flex-1">
              <div className="rounded-xl border border-gray-100 bg-[#F8FAFC] px-4 py-3 text-xs font-black text-slate-500">
                Posting to {selectedGroup?.name || "your selected group"}
              </div>

              <textarea
                value={postText}
                onChange={(event) => setPostText(event.target.value)}
                rows={4}
                maxLength={MAX_CHARS}
                placeholder="Share a housing lead, roommate request, study tip, or campus question with your group..."
                className="mt-3 w-full resize-none rounded-2xl border border-transparent bg-[#F8FAFC] p-4 text-sm leading-6 text-gray-700 outline-none transition focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />

              {postImage?.preview && (
                <div className="relative mt-3 overflow-hidden rounded-2xl border border-gray-100">
                  <img
                    src={postImage.preview}
                    alt="Post preview"
                    className="max-h-72 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (postImage.preview.startsWith("blob:")) {
                        URL.revokeObjectURL(postImage.preview);
                      }
                      setPostImage(null);
                    }}
                    className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/95 text-gray-600 shadow-sm transition hover:text-red-500"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="mt-3 flex flex-col gap-3 border-t border-gray-50 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 text-xs font-black text-gray-600 transition hover:border-[#155BC2]/30 hover:text-[#155BC2]"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Add image
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400">
                    {postText.length}/{MAX_CHARS}
                  </span>
                  <button
                    type="button"
                    onClick={handleCreatePost}
                    disabled={!postText.trim() || !selectedGroupId}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#155BC2] px-4 text-xs font-black text-white transition hover:bg-[#0f4aa0] disabled:bg-slate-300"
                  >
                    <Send className="h-4 w-4" />
                    Publish
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm font-bold text-slate-400 shadow-sm">
            Loading group feed...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-10 text-center text-sm font-bold text-rose-500 shadow-sm">
            {error}
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center shadow-sm">
            <h3 className="text-lg font-black text-[#091E42]">Join a group first</h3>
            <p className="mt-2 text-sm text-slate-500">
              The backend community feed is group-based, so your joined groups will unlock the real posts feed here.
            </p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center shadow-sm">
            <h3 className="text-lg font-black text-[#091E42]">No posts yet</h3>
            <p className="mt-2 text-sm text-slate-500">
              Be the first to post in {selectedGroup?.name || "this group"}.
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const comments = commentsByPost[post.id] || [];
            const isLiked = likedPosts.includes(post.id);
            const isSaved = savedPosts.includes(post.id);

            return (
              <article
                key={post.id}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={post.avatar}
                    className="h-11 w-11 rounded-full border border-gray-100 object-cover"
                    alt={post.author}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-black text-[#091E42]">
                        {post.author}
                      </h3>
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-[#155BC2]">
                        {post.topic}
                      </span>
                      <span className="text-[11px] font-bold text-gray-400">
                        {post.time}
                      </span>
                    </div>

                    <h4 className="mt-3 text-xl font-black leading-tight text-[#091E42]">
                      {post.title}
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      {post.content}
                    </p>

                    {post.image && (
                      <button
                        type="button"
                        onClick={() => setPreviewImage(post.image)}
                        className="mt-4 block w-full overflow-hidden rounded-2xl border border-gray-100 bg-gray-100 text-left"
                      >
                        <img
                          src={post.image}
                          alt={post.title}
                          className="max-h-[420px] w-full object-cover transition duration-500 hover:scale-[1.02]"
                          loading="lazy"
                        />
                      </button>
                    )}

                    <div className="mt-4 mb-4 grid grid-cols-2 gap-2 border-y border-gray-100 py-3 sm:grid-cols-4">
                      <button
                        type="button"
                        onClick={() => handleToggleLike(post.id)}
                        className={`flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-black transition ${
                          isLiked
                            ? "bg-blue-50 text-[#155BC2]"
                            : "text-gray-500 hover:bg-gray-50 hover:text-[#155BC2]"
                        }`}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        Like
                      </button>

                      <button
                        type="button"
                        className="flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-black text-gray-500 transition hover:bg-gray-50 hover:text-[#155BC2]"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Comment
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSharePost(post)}
                        className="flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-black text-gray-500 transition hover:bg-gray-50 hover:text-[#155BC2]"
                      >
                        <Share2 className="h-4 w-4" />
                        Share
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleSave(post.id)}
                        className={`flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-black transition ${
                          isSaved
                            ? "bg-amber-50 text-[#F59E0B]"
                            : "text-gray-500 hover:bg-gray-50 hover:text-[#F59E0B]"
                        }`}
                      >
                        <Bookmark
                          className={`h-4 w-4 ${isSaved ? "fill-[#F59E0B]" : ""}`}
                        />
                        Save
                      </button>
                    </div>

                    <div className="space-y-4 rounded-2xl bg-[#F8FAFC] p-3 sm:p-4">
                      {comments.length > 0 ? (
                        comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <img
                              src={comment.avatar}
                              className="h-9 w-9 rounded-full border border-white object-cover shadow-sm"
                              alt={comment.author}
                            />

                            <div className="min-w-0 flex-1 rounded-2xl rounded-tl-none border border-gray-100 bg-white p-3 shadow-sm">
                              <div className="mb-1 flex justify-between gap-3">
                                <span className="text-xs font-black text-[#091E42]">
                                  {comment.author}
                                </span>
                                <span className="shrink-0 text-[10px] text-gray-400">
                                  {comment.time}
                                </span>
                              </div>

                              <p className="text-xs leading-relaxed text-gray-700">
                                {comment.text}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-xs italic text-gray-400">
                          No comments yet. Local comments stay on this device for now.
                        </p>
                      )}

                      <div className="flex gap-3 pt-2">
                        <img
                          src={currentUser.avatar}
                          className="h-9 w-9 rounded-full border border-gray-200"
                          alt={currentUser.name}
                        />

                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={commentInputs[post.id] || ""}
                            onChange={(event) =>
                              setCommentInputs((currentInputs) => ({
                                ...currentInputs,
                                [post.id]: event.target.value,
                              }))
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter") handleAddComment(post.id);
                            }}
                            placeholder="Write a comment..."
                            className="h-10 w-full rounded-full border border-gray-200 bg-white py-2 pl-4 pr-11 text-xs outline-none transition focus:border-[#155BC2] focus:ring-4 focus:ring-blue-50"
                          />

                          <button
                            type="button"
                            onClick={() => handleAddComment(post.id)}
                            className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-full bg-[#155BC2] text-white shadow-sm transition hover:bg-[#0f4aa0]"
                            aria-label="Send comment"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>

      <aside className="space-y-4 xl:sticky xl:top-5 xl:self-start">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-black text-[#091E42]">
            <TrendingUp className="h-4 w-4 text-[#F59E0B]" />
            Trending Topics
          </h3>

          <div className="mt-3 flex flex-wrap gap-2">
            {trendingTopics.length > 0 ? (
              trendingTopics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setSearchQuery(topic.replace("#", ""))}
                  className="rounded-full bg-[#F8FAFC] px-3 py-2 text-xs font-black text-gray-600 transition hover:bg-blue-50 hover:text-[#155BC2]"
                >
                  {topic}
                </button>
              ))
            ) : (
              <p className="text-sm leading-6 text-gray-500">
                Join groups to unlock trending topics.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-black text-[#091E42]">
            <Bookmark className="h-4 w-4 text-[#F59E0B]" />
            Saved Posts
          </h3>

          {savedPostItems.length > 0 ? (
            <div className="mt-3 space-y-3">
              {savedPostItems.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => setSearchQuery(post.title)}
                  className="w-full rounded-xl border border-gray-100 bg-[#F8FAFC] p-3 text-left transition hover:border-[#155BC2]/30 hover:bg-blue-50"
                >
                  <p className="line-clamp-1 text-xs font-black text-[#091E42]">
                    {post.title}
                  </p>
                  <p className="mt-1 text-[11px] font-bold text-gray-400">
                    {post.author} · #{post.topic}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Saved posts will appear here.
            </p>
          )}
        </div>
      </aside>

      {previewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close image preview"
          >
            <X className="h-5 w-5" />
          </button>

          <img
            src={previewImage}
            alt="Post preview"
            className="max-h-full max-w-full rounded-2xl object-contain"
          />
        </div>
      )}
    </div>
  );
};

export default Posts;
