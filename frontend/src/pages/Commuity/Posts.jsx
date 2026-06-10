import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  ChevronDown,
  Edit3,
  Hash,
  Image as ImageIcon,
  MessageCircle,
  MoreVertical,
  Reply,
  Search,
  Send,
  Share2,
  ThumbsUp,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";

const currentUser = {
  name: "Mohamed Ahmed",
  avatar:
    "https://ui-avatars.com/api/?name=Mohamed+Ahmed&background=0A2647&color=fff&bold=true",
};

const initialPosts = [
  {
    id: 1,
    author: "John Doe",
    role: "Student",
    time: "20 min ago",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    title: "Looking for a roommate in Nasr City",
    topic: "Roommate",
    content:
      "Hey guys! I am looking for a roommate to share a 2-bedroom apartment in Nasr City near Al-Ahly Club. The apartment is fully furnished and the rent is 2000 EGP per person.",
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80",
    likes: 12,
    comments: 2,
    shares: 4,
    createdAt: 3,
    replies: [
      {
        id: 101,
        author: "Ralph Edwards",
        time: "2 hrs ago",
        avatar: "https://randomuser.me/api/portraits/men/5.jpg",
        text: "Is it close to the metro station?",
        replies: [
          {
            id: 1001,
            author: currentUser.name,
            time: "1 hr ago",
            avatar: currentUser.avatar,
            text: "It is around 8 minutes by bus.",
          },
        ],
      },
      {
        id: 102,
        author: "Albert Flores",
        time: "1 hr ago",
        avatar: "https://randomuser.me/api/portraits/men/12.jpg",
        text: "I sent you a message, please check.",
        replies: [],
      },
    ],
  },
  {
    id: 2,
    author: "Sarah Miller",
    role: "Admin",
    time: "Yesterday",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    title: "Tips for exam preparation",
    topic: "Study",
    content:
      "Finals are getting close, so start early, stay hydrated, and try group revision. A quiet home setup makes a huge difference.",
    image: "",
    likes: 45,
    comments: 0,
    shares: 11,
    createdAt: 2,
    replies: [],
  },
];

const topicOptions = ["Housing", "Roommate", "Study", "Question"];
const filterTabs = ["All", ...topicOptions];
const sortOptions = ["Latest", "Most Popular", "Most Liked", "Most Commented"];
const trendingTopics = ["#Housing", "#Roommate", "#Study", "#Question"];
const MAX_CHARS = 500;
const PAGE_SIZE = 6;

const Posts = () => {
  const [posts, setPosts] = useState(initialPosts);
  const [postText, setPostText] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [postTopic, setPostTopic] = useState(topicOptions[0]);
  const [postImage, setPostImage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeSort, setActiveSort] = useState("Latest");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [likedPosts, setLikedPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [commentInputs, setCommentInputs] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  const [openReplyId, setOpenReplyId] = useState(null);
  const [openPostMenuId, setOpenPostMenuId] = useState(null);
  const [notice, setNotice] = useState("");
  const [openComments, setOpenComments] = useState(
    initialPosts.reduce((acc, post) => ({ ...acc, [post.id]: true }), {}),
  );
  const [previewImage, setPreviewImage] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editData, setEditData] = useState({
    title: "",
    content: "",
    topic: topicOptions[0],
  });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const imageInputRef = useRef(null);
  const sortRef = useRef(null);
  const menuRef = useRef(null);

  const showNotice = useCallback((text) => {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 1800);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }

      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenPostMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (postImage && postImage.startsWith("blob:")) {
        URL.revokeObjectURL(postImage);
      }
    };
  }, [postImage]);

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const matches = posts.filter((post) => {
      const repliesText = post.replies
        .map((comment) => {
          const nestedReplies = (comment.replies || [])
            .map((reply) => reply.text)
            .join(" ");

          return `${comment.text} ${nestedReplies}`;
        })
        .join(" ");

      const matchesTab = activeFilter === "All" || post.topic === activeFilter;

      const matchesSearch =
        !query ||
        post.author.toLowerCase().includes(query) ||
        post.topic.toLowerCase().includes(query) ||
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        repliesText.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });

    return [...matches].sort((firstPost, secondPost) => {
      if (activeSort === "Most Liked") return secondPost.likes - firstPost.likes;
      if (activeSort === "Most Commented") {
        return secondPost.comments - firstPost.comments;
      }
      if (activeSort === "Most Popular") {
        return (
          secondPost.likes +
          secondPost.comments +
          secondPost.shares -
          (firstPost.likes + firstPost.comments + firstPost.shares)
        );
      }

      return secondPost.createdAt - firstPost.createdAt;
    });
  }, [activeFilter, activeSort, posts, searchQuery]);

  const effectiveVisibleCount = useMemo(
    () => Math.min(visibleCount, filteredPosts.length || PAGE_SIZE),
    [filteredPosts.length, visibleCount],
  );

  const visiblePosts = useMemo(
    () => filteredPosts.slice(0, effectiveVisibleCount),
    [effectiveVisibleCount, filteredPosts],
  );

  const savedPostItems = useMemo(
    () => posts.filter((post) => savedPosts.includes(post.id)).slice(0, 5),
    [posts, savedPosts],
  );

  const handleImageUpload = useCallback(
    (event) => {
      const file = event.target.files?.[0];

      if (!file) return;

      if (postImage && postImage.startsWith("blob:")) {
        URL.revokeObjectURL(postImage);
      }

      setPostImage(URL.createObjectURL(file));
      event.target.value = "";
    },
    [postImage],
  );

  const handleRemovePostImage = useCallback(() => {
    if (postImage && postImage.startsWith("blob:")) {
      URL.revokeObjectURL(postImage);
    }

    setPostImage("");
  }, [postImage]);

  const handleCreatePost = useCallback(() => {
    const trimmedText = postText.trim();

    if (!trimmedText) return;

    setPosts((currentPosts) => [
      {
        id: Date.now(),
        author: currentUser.name,
        role: "Student",
        time: "Just now",
        avatar: currentUser.avatar,
        title: postTitle.trim() || postTopic,
        topic: postTopic,
        content: trimmedText,
        image: postImage,
        likes: 0,
        comments: 0,
        shares: 0,
        createdAt: Date.now(),
        replies: [],
      },
      ...currentPosts,
    ]);

    setPostText("");
    setPostTitle("");
    setPostTopic(topicOptions[0]);
    setPostImage("");
    showNotice("Post published");
  }, [postImage, postText, postTitle, postTopic, showNotice]);

  const handleToggleLike = useCallback((postId) => {
    setLikedPosts((currentLikes) =>
      currentLikes.includes(postId)
        ? currentLikes.filter((id) => id !== postId)
        : [...currentLikes, postId],
    );
  }, []);

  const handleToggleSave = useCallback(
    (postId) => {
      setSavedPosts((currentSaved) => {
        const isSaved = currentSaved.includes(postId);
        showNotice(isSaved ? "Post removed from saved" : "Post saved");

        return isSaved
          ? currentSaved.filter((id) => id !== postId)
          : [...currentSaved, postId];
      });
    },
    [showNotice],
  );

  const handleSharePost = useCallback(
    async (post) => {
      const shareText = `${post.title}\n\n${post.content}`;
      const shareUrl = `${window.location.origin}/community?post=${post.id}`;

      try {
        if (navigator.share) {
          await navigator.share({
            title: post.title,
            text: shareText,
            url: shareUrl,
          });
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareUrl);
          showNotice("Post link copied");
        } else {
          showNotice("Sharing is not supported");
        }

        setPosts((currentPosts) =>
          currentPosts.map((item) =>
            item.id === post.id ? { ...item, shares: item.shares + 1 } : item,
          ),
        );
      } catch {
        showNotice("Share cancelled");
      }
    },
    [showNotice],
  );

  const handleAddComment = useCallback(
    (postId) => {
      const text = (commentInputs[postId] || "").trim();

      if (!text) return;

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: post.comments + 1,
                replies: [
                  ...post.replies,
                  {
                    id: Date.now(),
                    author: currentUser.name,
                    time: "Just now",
                    avatar: currentUser.avatar,
                    text,
                    replies: [],
                  },
                ],
              }
            : post,
        ),
      );

      setCommentInputs((currentInputs) => ({ ...currentInputs, [postId]: "" }));
      setOpenComments((currentOpen) => ({ ...currentOpen, [postId]: true }));
    },
    [commentInputs],
  );

  const handleAddReply = useCallback(
    (postId, commentId) => {
      const key = `${postId}-${commentId}`;
      const text = (replyInputs[key] || "").trim();

      if (!text) return;

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: post.comments + 1,
                replies: post.replies.map((comment) =>
                  comment.id === commentId
                    ? {
                        ...comment,
                        replies: [
                          ...(comment.replies || []),
                          {
                            id: Date.now(),
                            author: currentUser.name,
                            time: "Just now",
                            avatar: currentUser.avatar,
                            text,
                          },
                        ],
                      }
                    : comment,
                ),
              }
            : post,
        ),
      );

      setReplyInputs((currentInputs) => ({ ...currentInputs, [key]: "" }));
      setOpenReplyId(null);
    },
    [replyInputs],
  );

  const handleStartEdit = useCallback((post) => {
    setEditingPostId(post.id);
    setEditData({
      title: post.title,
      content: post.content,
      topic: post.topic,
    });
    setOpenPostMenuId(null);
  }, []);

  const handleSaveEdit = useCallback(() => {
    const trimmedContent = editData.content.trim();

    if (!trimmedContent) return;

    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === editingPostId
          ? {
              ...post,
              title: editData.title.trim() || editData.topic,
              content: trimmedContent,
              topic: editData.topic,
              time: "Edited just now",
            }
          : post,
      ),
    );

    setEditingPostId(null);
    showNotice("Post updated");
  }, [editData, editingPostId, showNotice]);

  const handleDeletePost = useCallback(
    (postId) => {
      const confirmed = window.confirm("Delete this post?");
      if (!confirmed) return;

      setPosts((currentPosts) => currentPosts.filter((post) => post.id !== postId));
      setSavedPosts((currentSaved) => currentSaved.filter((id) => id !== postId));
      setLikedPosts((currentLikes) => currentLikes.filter((id) => id !== postId));
      setOpenPostMenuId(null);
      showNotice("Post deleted");
    },
    [showNotice],
  );

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setActiveFilter("All");
    setActiveSort("Latest");
  }, []);

  return (
    <div className="relative mx-auto grid max-w-6xl gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {notice && (
        <div className="fixed right-5 top-24 z-50 rounded-full bg-[#091E42] px-4 py-2 text-xs font-bold text-white shadow-lg">
          {notice}
        </div>
      )}

      <section className="min-w-0 space-y-5">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px]">
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

            <div className="relative" ref={sortRef}>
              <button
                type="button"
                onClick={() => setIsSortOpen((current) => !current)}
                className="flex h-11 w-full items-center justify-between rounded-xl border border-gray-100 bg-white px-4 text-sm font-black text-[#091E42] transition hover:border-[#155BC2]/40"
              >
                {activeSort}
                <ChevronDown
                  className={`h-4 w-4 transition ${isSortOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isSortOpen && (
                <div className="absolute right-0 top-full z-30 mt-2 w-full rounded-xl border border-gray-100 bg-white p-1 shadow-xl">
                  {sortOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setActiveSort(option);
                        setIsSortOpen(false);
                      }}
                      className={`w-full rounded-lg px-3 py-2 text-left text-xs font-black transition ${
                        activeSort === option
                          ? "bg-blue-50 text-[#155BC2]"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="scrollbar-hide mt-3 flex gap-2 overflow-x-auto pb-1">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveFilter(tab)}
                className={`h-9 shrink-0 rounded-full px-4 text-xs font-black transition ${
                  activeFilter === tab
                    ? "bg-[#155BC2] text-white shadow-sm"
                    : "border border-gray-100 bg-white text-gray-500 hover:border-[#155BC2]/30 hover:text-[#155BC2]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex gap-3">
            <img
              src={currentUser.avatar}
              className="h-12 w-12 rounded-full border border-gray-100 shadow-sm"
              alt={currentUser.name}
            />

            <div className="min-w-0 flex-1">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
                <input
                  type="text"
                  value={postTitle}
                  onChange={(event) => setPostTitle(event.target.value)}
                  placeholder="Post title or quick summary"
                  className="h-11 rounded-xl border border-gray-100 bg-[#F8FAFC] px-4 text-sm font-bold text-[#091E42] outline-none transition focus:border-[#155BC2] focus:bg-white focus:ring-4 focus:ring-blue-50"
                />

                <label className="flex h-11 items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 text-xs font-black text-gray-600">
                  <Hash className="h-4 w-4 text-[#155BC2]" />
                  <select
                    value={postTopic}
                    onChange={(event) => setPostTopic(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-xs font-black outline-none"
                  >
                    {topicOptions.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <textarea
                value={postText}
                onChange={(event) => setPostText(event.target.value)}
                rows={4}
                maxLength={MAX_CHARS}
                placeholder="Share a housing lead, roommate request, study tip, or campus question with the community..."
                className="mt-3 w-full resize-none rounded-2xl border border-transparent bg-[#F8FAFC] p-4 text-sm leading-6 text-gray-700 outline-none transition focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />

              {postImage && (
                <div className="relative mt-3 overflow-hidden rounded-2xl border border-gray-100">
                  <img
                    src={postImage}
                    alt="Post preview"
                    className="max-h-72 w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={handleRemovePostImage}
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
                    className="flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-black text-gray-500 transition hover:bg-gray-100 hover:text-[#155BC2]"
                  >
                    <ImageIcon className="h-4 w-4 text-green-500" />
                    Upload image
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span
                    className={`text-xs font-black ${
                      postText.length > MAX_CHARS * 0.85
                        ? "text-[#F59E0B]"
                        : "text-gray-400"
                    }`}
                  >
                    {MAX_CHARS - postText.length} left
                  </span>

                  <button
                    type="button"
                    onClick={handleCreatePost}
                    disabled={!postText.trim()}
                    className="h-10 rounded-xl bg-[#155BC2] px-6 text-sm font-black text-white shadow-sm transition hover:bg-[#0f4aa0] disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center shadow-sm">
            <Search className="mx-auto h-10 w-10 text-gray-300" />
            <h3 className="mt-4 text-lg font-black text-[#091E42]">
              No posts found
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Try another keyword, topic, or create the first post for this filter.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-xl border border-gray-200 bg-white px-5 py-2 text-sm font-black text-gray-600 transition hover:border-[#155BC2]/30 hover:text-[#155BC2]"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          visiblePosts.map((post) => {
            const isLiked = likedPosts.includes(post.id);
            const isSaved = savedPosts.includes(post.id);
            const likesCount = post.likes + (isLiked ? 1 : 0);
            const commentsOpen = openComments[post.id];
            const isOwnPost = post.author === currentUser.name;
            const isEditing = editingPostId === post.id;

            return (
              <article
                key={post.id}
                className="relative rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition duration-300 hover:border-blue-100 hover:shadow-md sm:p-5"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <img
                      src={post.avatar}
                      className="h-12 w-12 rounded-full border border-gray-100 object-cover"
                      alt={post.author}
                    />

                    <div className="min-w-0">
                      <h4 className="truncate text-base font-black text-[#091E42]">
                        {post.author}
                      </h4>

                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-gray-400">
                          {post.time}
                        </span>

                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-[#155BC2]">
                          #{post.topic}
                        </span>

                        {post.role === "Admin" && (
                          <span className="rounded-full bg-[#091E42] px-2.5 py-1 text-[10px] font-black text-white">
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="relative" ref={openPostMenuId === post.id ? menuRef : null}>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenPostMenuId((current) =>
                          current === post.id ? null : post.id,
                        )
                      }
                      className="rounded-full p-2 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600"
                      aria-label="More post actions"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>

                    {openPostMenuId === post.id && (
                      <div className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-gray-100 bg-white p-2 text-sm font-bold text-gray-600 shadow-xl">
                        {isOwnPost && (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(post)}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition hover:bg-gray-50"
                          >
                            <Edit3 className="h-4 w-4" />
                            Edit post
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            handleToggleSave(post.id);
                            setOpenPostMenuId(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition hover:bg-gray-50"
                        >
                          <Bookmark className="h-4 w-4" />
                          {isSaved ? "Unsave post" : "Save post"}
                        </button>

                        {isOwnPost ? (
                          <button
                            type="button"
                            onClick={() => handleDeletePost(post.id)}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-red-500 transition hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete post
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              showNotice("Post reported");
                              setOpenPostMenuId(null);
                            }}
                            className="w-full rounded-lg px-3 py-2 text-left transition hover:bg-gray-50"
                          >
                            Report post
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      value={editData.title}
                      onChange={(event) =>
                        setEditData((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-xl border border-gray-100 bg-[#F8FAFC] px-4 text-sm font-bold outline-none focus:border-[#155BC2]"
                    />

                    <select
                      value={editData.topic}
                      onChange={(event) =>
                        setEditData((current) => ({
                          ...current,
                          topic: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-xl border border-gray-100 bg-white px-4 text-sm font-bold outline-none focus:border-[#155BC2]"
                    >
                      {topicOptions.map((topic) => (
                        <option key={topic} value={topic}>
                          {topic}
                        </option>
                      ))}
                    </select>

                    <textarea
                      value={editData.content}
                      onChange={(event) =>
                        setEditData((current) => ({
                          ...current,
                          content: event.target.value,
                        }))
                      }
                      rows={4}
                      className="w-full resize-none rounded-xl border border-gray-100 bg-[#F8FAFC] p-4 text-sm outline-none focus:border-[#155BC2]"
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingPostId(null)}
                        className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-black text-gray-600"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        disabled={!editData.content.trim()}
                        className="rounded-xl bg-[#155BC2] px-4 py-2 text-sm font-black text-white disabled:bg-gray-300"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="mb-2 text-xl font-black leading-tight text-[#091E42]">
                      {post.title}
                    </h3>

                    <p className="mb-4 text-sm leading-6 text-gray-600">
                      {post.content}
                    </p>

                    {post.image && (
                      <button
                        type="button"
                        onClick={() => setPreviewImage(post.image)}
                        className="mb-4 block w-full overflow-hidden rounded-2xl border border-gray-100 bg-gray-100 text-left"
                      >
                        <img
                          src={post.image}
                          alt={post.title}
                          className="max-h-[420px] w-full object-cover transition duration-500 hover:scale-[1.02]"
                          loading="lazy"
                        />
                      </button>
                    )}

                    <div className="mb-3 flex flex-wrap items-center gap-3 text-xs font-bold text-gray-400">
                      <span>{likesCount} likes</span>
                      <span>{post.comments} comments</span>
                      <span>{post.shares} shares</span>
                      {isSaved && <span className="text-[#F59E0B]">Saved</span>}
                    </div>

                    <div className="mb-4 grid grid-cols-2 gap-2 border-y border-gray-100 py-3 sm:grid-cols-4">
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
                        onClick={() =>
                          setOpenComments((currentOpen) => ({
                            ...currentOpen,
                            [post.id]: !commentsOpen,
                          }))
                        }
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
                  </>
                )}

                {!isEditing && commentsOpen && (
                  <div className="space-y-4 rounded-2xl bg-[#F8FAFC] p-3 sm:p-4">
                    {post.replies.length > 0 ? (
                      post.replies.map((comment) => {
                        const replyKey = `${post.id}-${comment.id}`;

                        return (
                          <div key={comment.id} className="space-y-3">
                            <div className="flex gap-3">
                              <img
                                src={comment.avatar}
                                className="h-9 w-9 rounded-full border border-white object-cover shadow-sm"
                                alt={comment.author}
                              />

                              <div className="min-w-0 flex-1">
                                <div className="rounded-2xl rounded-tl-none border border-gray-100 bg-white p-3 shadow-sm">
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

                                <div className="mt-2 flex items-center gap-3 pl-2 text-[11px] font-black text-gray-400">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenReplyId((current) =>
                                        current === replyKey ? null : replyKey,
                                      )
                                    }
                                    className="flex items-center gap-1 transition hover:text-[#155BC2]"
                                  >
                                    <Reply className="h-3 w-3" />
                                    Reply
                                  </button>

                                  <span>{comment.replies?.length || 0} replies</span>
                                </div>

                                {comment.replies?.map((reply) => (
                                  <div key={reply.id} className="mt-3 flex gap-2 pl-4">
                                    <img
                                      src={reply.avatar}
                                      className="h-7 w-7 rounded-full object-cover"
                                      alt={reply.author}
                                    />

                                    <div className="flex-1 rounded-2xl border border-gray-100 bg-white p-3 text-xs shadow-sm">
                                      <div className="mb-1 flex justify-between gap-2">
                                        <span className="font-black text-[#091E42]">
                                          {reply.author}
                                        </span>

                                        <span className="text-[10px] text-gray-400">
                                          {reply.time}
                                        </span>
                                      </div>

                                      <p className="leading-relaxed text-gray-600">
                                        {reply.text}
                                      </p>
                                    </div>
                                  </div>
                                ))}

                                {openReplyId === replyKey && (
                                  <div className="mt-3 flex gap-2 pl-4">
                                    <input
                                      type="text"
                                      value={replyInputs[replyKey] || ""}
                                      onChange={(event) =>
                                        setReplyInputs((currentInputs) => ({
                                          ...currentInputs,
                                          [replyKey]: event.target.value,
                                        }))
                                      }
                                      onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                          handleAddReply(post.id, comment.id);
                                        }
                                      }}
                                      placeholder="Write a reply..."
                                      className="h-9 min-w-0 flex-1 rounded-full border border-gray-200 bg-white px-4 text-xs outline-none transition focus:border-[#155BC2] focus:ring-4 focus:ring-blue-50"
                                    />

                                    <button
                                      type="button"
                                      onClick={() => handleAddReply(post.id, comment.id)}
                                      className="grid h-9 w-9 place-items-center rounded-full bg-[#155BC2] text-white transition hover:bg-[#0f4aa0]"
                                      aria-label="Send reply"
                                    >
                                      <Send className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-center text-xs italic text-gray-400">
                        No comments yet. Be the first to say something.
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
                            if (event.key === "Enter") {
                              handleAddComment(post.id);
                            }
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
                )}
              </article>
            );
          })
        )}

        {visibleCount < filteredPosts.length && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
              className="rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-black text-[#091E42] shadow-sm transition hover:border-[#155BC2]/30 hover:text-[#155BC2]"
            >
              Load More
            </button>
          </div>
        )}
      </section>

      <aside className="space-y-4 xl:sticky xl:top-5 xl:self-start">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-black text-[#091E42]">
            <TrendingUp className="h-4 w-4 text-[#F59E0B]" />
            Trending Topics
          </h3>

          <div className="scrollbar-hide mt-3 flex gap-2 overflow-x-auto xl:flex-wrap xl:overflow-visible">
            {trendingTopics.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => {
                  const cleanTopic = topic.replace("#", "");
                  setSearchQuery("");
                  setActiveFilter(cleanTopic);
                }}
                className="shrink-0 rounded-full bg-[#F8FAFC] px-3 py-2 text-xs font-black text-gray-600 transition hover:bg-blue-50 hover:text-[#155BC2]"
              >
                {topic}
              </button>
            ))}
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
                  onClick={() => {
                    setSearchQuery(post.title);
                    setActiveFilter("All");
                  }}
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
