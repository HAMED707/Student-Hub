import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../assets/components/Navbar/Navbar.jsx";
import {
  Settings,
  Edit3,
  UploadCloud,
  AlertCircle,
  ShieldCheck,
  Star,
  MessageCircle,
  MoreHorizontal,
  MapPin,
  Trash2,
  Flag,
  UserCheck,
  UserX,
} from "lucide-react";
import { fetchMyProfile, updateMyProfile } from "../../api/accounts.js";
import {
  fetchMyRoommateProfile,
  fetchUserReviews,
} from "../../api/roommates.js";
import { withApiUrl } from "../../api/client.js";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop";
const FALLBACK_AVATAR =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80";

const formatValue = (value, fallback = "Not set") => {
  if (Array.isArray(value)) return value.length ? value.join(", ") : fallback;
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatBudget = (studentProfile) => {
  const min = studentProfile?.budget_min;
  const max = studentProfile?.budget_max;
  if (min && max) return `${min}-${max} EGP`;
  if (min) return `From ${min} EGP`;
  if (max) return `Up to ${max} EGP`;
  return "Not set";
};

const formatDateLabel = (value) => {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  const diffMs = date.getTime() - Date.now();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffDays) < 1) {
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (Math.abs(diffHours) < 1) {
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      return formatter.format(diffMinutes || -1, "minute");
    }
    return formatter.format(diffHours, "hour");
  }

  if (Math.abs(diffDays) < 30) return formatter.format(diffDays, "day");
  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) return formatter.format(diffMonths, "month");
  return formatter.format(Math.round(diffMonths / 12), "year");
};

const buildCompletionTips = (profile) => {
  const student = profile?.student_profile || {};
  const tips = [
    {
      label: profile?.first_name && profile?.city ? "Basic Info Added" : "Add your basic info",
      done: Boolean(profile?.first_name && profile?.city),
    },
    {
      label: student?.smoking_preference
        ? "Smoking Preference Added"
        : "Add Smoking Preference (+10%)",
      done: Boolean(student?.smoking_preference),
    },
    {
      label: student?.languages?.length
        ? "Languages Added"
        : "Add Languages (+5%)",
      done: Boolean(student?.languages?.length),
    },
  ];

  return tips;
};

const buildProfileData = ({ profile, roommateProfile, reviews }) => {
  const student = profile?.student_profile || {};
  const fullName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    profile?.username ||
    "Student";
  const cover = FALLBACK_COVER;
  const avatar = profile?.profile_picture
    ? withApiUrl(profile.profile_picture)
    : FALLBACK_AVATAR;
  const ratingAverage = reviews.length
    ? (
        reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
        reviews.length
      ).toFixed(1)
    : "0.0";

  return {
    name: fullName,
    email: profile?.email || "No email added",
    avatar,
    cover,
    status: student?.is_looking_for_room
      ? "Looking for a roommate"
      : "Not looking",
    profileCompleteness: Number(student?.profile_strength || 0),
    rating: { average: ratingAverage, totalReviews: reviews.length },
    basicInfo: [
      { label: "Full Name", value: fullName },
      { label: "Location", value: profile?.city || "Not set" },
      { label: "University", value: student?.university || "Not set" },
      {
        label: "Faculty / Major",
        value: student?.faculty || "Not set",
      },
      {
        label: "Academic Year",
        value: formatValue(student?.year_of_study),
      },
    ],
    interests: [
      { label: "Sleeping Time", value: formatValue(student?.sleeping_time) },
      {
        label: "Study Environment",
        value: formatValue(student?.study_environment),
      },
      {
        label: "Music Preference",
        value: formatValue(student?.music_preference),
      },
      { label: "Guests Policy", value: formatValue(student?.guests_policy) },
      { label: "Personality Type", value: formatValue(student?.personality) },
      { label: "Cleanliness Level", value: formatValue(student?.cleanliness) },
      {
        label: "Room Type",
        value: formatValue(student?.room_type_preference),
      },
      { label: "Smoking Status", value: formatValue(student?.smoking) },
      { label: "Budget Range", value: formatBudget(student) },
    ],
    personalPreferences: [
      { label: "Budget Range", value: formatBudget(student) },
      {
        label: "Preferred Room Type",
        value: formatValue(student?.preferred_room_type),
      },
      {
        label: "Smoking Preference",
        value: formatValue(student?.smoking_preference),
      },
      {
        label: "Sleeping Schedule",
        value: formatValue(student?.sleep_schedule_pref),
      },
      {
        label: "Cleanliness Level",
        value: formatValue(student?.cleanliness_pref),
      },
      {
        label: "Personality Type",
        value: formatValue(student?.personality_pref),
      },
    ],
    reviews: reviews.map((review) => ({
      id: review.id,
      author: review.reviewer_username || "Anonymous",
      role: formatValue(review.reviewer_role, "Reviewer"),
      score: Number(review.rating || 0),
      date: formatDateLabel(review.created_at),
      text: review.comment || "No written feedback provided.",
      avatar: review.reviewer_picture
        ? withApiUrl(review.reviewer_picture)
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(
            review.reviewer_username || "User",
          )}&background=E2E8F0&color=0F172A`,
    })),
    verification: [
      {
        label: "Account Verification",
        status: profile?.is_verified ? "Verified" : "Pending",
        isVerified: Boolean(profile?.is_verified),
      },
      {
        label: "Top Rated Badge",
        status: profile?.is_top_rated ? "Active" : "Locked",
        isVerified: Boolean(profile?.is_top_rated),
      },
      {
        label: "Quick Responder Badge",
        status: profile?.is_quick_responder ? "Active" : "Locked",
        isVerified: Boolean(profile?.is_quick_responder),
      },
    ],
    completionTips: buildCompletionTips(profile),
    bio: student?.bio || roommateProfile?.bio || "",
  };
};

const InfoField = ({ label, value }) => (
  <div className="flex flex-col mb-4 group">
    <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1.5 ml-1 group-hover:text-blue-600 transition-colors">
      {label}
    </label>
    <div className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 bg-white shadow-sm hover:border-gray-300 hover:shadow transition-all duration-200 w-full break-words">
      {value}
    </div>
  </div>
);

const SectionCard = ({ title, actionLabel, onAction, children }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 hover:shadow-md transition-shadow duration-300">
    <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-5">
      <h3 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h3>
      {actionLabel && (
        <button
          onClick={onAction}
          className="text-sm font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100/70 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
        >
          <Edit3 className="w-3.5 h-3.5" /> {actionLabel}
        </button>
      )}
    </div>
    {children}
  </div>
);

const ReplyBox = ({ onSubmit, onCancel }) => {
  const [text, setText] = useState("");

  return (
    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 shadow-inner mt-2 animate-fadeIn">
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={3}
        className="w-full p-2.5 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
        placeholder="Write a professional reply..."
      />
      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-gray-500 hover:text-gray-700 font-medium rounded-lg text-xs transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            if (text.trim()) {
              onSubmit(text);
              setText("");
            }
          }}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-colors"
        >
          Send Reply
        </button>
      </div>
    </div>
  );
};

const MyProfile = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [cover, setCover] = useState(FALLBACK_COVER);
  const [avatar, setAvatar] = useState(FALLBACK_AVATAR);
  const [status, setStatus] = useState("Not looking");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const coverInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const docInputRef = useRef(null);

  const [openReplyFor, setOpenReplyFor] = useState(null);
  const [activeOptionsFor, setActiveOptionsFor] = useState(null);
  const [replies, setReplies] = useState({});
  const [docs, setDocs] = useState([]);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    return () => {
      if (cover.startsWith("blob:")) URL.revokeObjectURL(cover);
      if (avatar.startsWith("blob:")) URL.revokeObjectURL(avatar);
      docs.forEach((doc) => {
        if (doc.url.startsWith("blob:")) URL.revokeObjectURL(doc.url);
      });
    };
  }, [cover, avatar, docs]);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const profile = await fetchMyProfile();
        const [roommateResult, reviewsResult] = await Promise.allSettled([
          fetchMyRoommateProfile(),
          fetchUserReviews(profile.id),
        ]);

        const roommateProfile =
          roommateResult.status === "fulfilled" ? roommateResult.value : null;
        const reviews = reviewsResult.status === "fulfilled" ? reviewsResult.value : [];
        const nextProfileData = buildProfileData({
          profile,
          roommateProfile,
          reviews,
        });

        setProfileData(nextProfileData);
        setCover((currentCover) =>
          currentCover.startsWith("blob:") ? currentCover : nextProfileData.cover,
        );
        setAvatar((currentAvatar) =>
          currentAvatar.startsWith("blob:") ? currentAvatar : nextProfileData.avatar,
        );
        setStatus(nextProfileData.status);
      } catch (loadError) {
        setError(loadError.message || "Unable to load your profile right now.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const displayedReviews = useMemo(() => {
    if (!profileData) return [];
    return showAllReviews
      ? profileData.reviews
      : profileData.reviews.slice(0, 2);
  }, [profileData, showAllReviews]);

  const handleFileUpload = (event, setImageState) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const newUrl = URL.createObjectURL(file);
    setImageState((previousUrl) => {
      if (previousUrl.startsWith("blob:")) URL.revokeObjectURL(previousUrl);
      return newUrl;
    });
  };

  const handleDocUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setDocs((currentDocs) => [
      ...currentDocs,
      { name: file.name, url: URL.createObjectURL(file) },
    ]);
  };

  const handleReplySubmit = (reviewId, text) => {
    if (!text.trim()) return;
    setReplies((currentReplies) => ({
      ...currentReplies,
      [reviewId]: [
        ...(currentReplies[reviewId] || []),
        { author: "You", text, date: "Just now" },
      ],
    }));
    setOpenReplyFor(null);
  };

  const handleStatusChange = async (nextStatus) => {
    const previousStatus = status;
    setStatus(nextStatus);

    try {
      await updateMyProfile({
        student_profile: {
          is_looking_for_room: nextStatus === "Looking for a roommate",
        },
      });
      setProfileData((currentProfileData) =>
        currentProfileData
          ? { ...currentProfileData, status: nextStatus }
          : currentProfileData,
      );
    } catch {
      setStatus(previousStatus);
    }
  };

  const showPosition = () => {
    if (!navigator?.geolocation) {
      window.alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        window.alert(
          `Your Verified Coordinates:\nLatitude: ${position.coords.latitude}\nLongitude: ${position.coords.longitude}`,
        ),
      () =>
        window.alert(
          "Unable to fetch location. Please check browser permissions.",
        ),
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7f9] font-sans pb-20">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-12 text-center text-slate-500 font-semibold">
          Loading your profile...
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-[#f4f7f9] font-sans pb-20">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-black text-slate-900">Profile unavailable</h1>
            <p className="mt-3 text-sm text-slate-500">
              {error || "We could not load your profile right now."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f9] font-sans pb-20 antialiased selection:bg-blue-500 selection:text-white">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
          <div className="h-52 w-full relative bg-gray-900 group">
            <img
              src={cover}
              alt="Cover"
              className="w-full h-full object-cover opacity-85 group-hover:opacity-75 transition-opacity duration-300"
            />

            <div className="absolute top-4 right-4 z-20">
              <button
                onClick={() => coverInputRef.current?.click()}
                className="bg-black/40 hover:bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-2 border border-white/10"
              >
                <UploadCloud className="w-4 h-4" /> Change Cover
              </button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={(event) => handleFileUpload(event, setCover)}
                className="hidden"
              />
            </div>

            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur shadow-lg px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-gray-100 z-20">
              <span
                className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                  status === "Looking for a roommate" ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-gray-500 text-xs font-semibold">Status:</span>
              <select
                value={status}
                onChange={(event) => handleStatusChange(event.target.value)}
                className="bg-transparent outline-none text-xs font-bold text-gray-800 cursor-pointer pr-1"
              >
                <option value="Looking for a roommate">Looking for a roommate</option>
                <option value="Not looking">Not looking</option>
              </select>
            </div>
          </div>

          <div className="px-6 md:px-10 pt-4 pb-8">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-5">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left w-full md:w-auto">
                <div className="relative group cursor-pointer shrink-0 -mt-20 z-10">
                  <img
                    src={avatar}
                    alt="Avatar"
                    className="w-28 h-28 md:w-32 md:h-32 rounded-full border-[5px] border-white shadow-xl object-cover bg-white"
                  />
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleFileUpload(event, setAvatar)}
                    className="hidden"
                  />
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 border-[5px] border-transparent"
                  >
                    <UploadCloud className="w-6 h-6 text-white" />
                  </button>
                </div>

                <div className="flex-1 min-w-0 pt-2">
                  <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                    {profileData.name}
                  </h1>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1.5">
                    <div
                      onClick={() =>
                        document
                          .getElementById("reviews")
                          ?.scrollIntoView({ behavior: "smooth" })
                      }
                      className="flex items-center text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md cursor-pointer hover:bg-amber-100 transition-colors"
                    >
                      <Star className="w-3.5 h-3.5 fill-current mr-1" />
                      <span className="text-xs font-bold">{profileData.rating.average}</span>
                    </div>
                    <span
                      onClick={() =>
                        document
                          .getElementById("reviews")
                          ?.scrollIntoView({ behavior: "smooth" })
                      }
                      className="text-xs font-semibold text-gray-500 cursor-pointer hover:underline"
                    >
                      ({profileData.rating.totalReviews} Reviews)
                    </span>
                    <span className="text-gray-300 hidden sm:inline">•</span>
                    <p className="text-xs font-medium text-gray-400 break-all">
                      {profileData.email}
                    </p>
                  </div>

                  {profileData.bio && (
                    <p className="mt-3 max-w-2xl text-sm text-slate-500 leading-6">
                      {profileData.bio}
                    </p>
                  )}

                  <div className="mt-3 flex justify-center sm:justify-start">
                    {status === "Looking for a roommate" ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-100 text-green-700 rounded-xl text-xs font-bold animate-fadeIn">
                        <UserCheck className="w-4 h-4" /> Active: You will be suggested in roommate matching.
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-500 rounded-xl text-xs font-bold animate-fadeIn">
                        <UserX className="w-4 h-4" /> Invisible: Hidden from roommate matching suggestions.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 w-full md:w-auto shrink-0 mt-2 md:mt-0">
                <button
                  onClick={() => navigate("/edit-profile")}
                  className="flex-1 md:flex-none bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4" /> Edit Profile
                </button>
                <button
                  onClick={() => navigate("/settings")}
                  className="bg-white border border-gray-200 text-gray-600 p-2.5 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm flex items-center justify-center"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-2">
            <SectionCard
              title="Basic Information"
              actionLabel="Edit"
              onAction={() => navigate("/edit-profile")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                {profileData.basicInfo.map((info, index) => {
                  if (info.label === "Location") {
                    return (
                      <div key={index} className="relative group">
                        <InfoField label={info.label} value={info.value} />
                        <button
                          onClick={showPosition}
                          className="absolute right-3 top-7 text-xs bg-blue-50 border border-blue-100 hover:bg-blue-100 text-blue-600 px-2.5 py-1 rounded-lg transition-colors font-bold flex items-center gap-1"
                        >
                          <MapPin className="w-3 h-3" /> Pin GPS
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={index}
                      className={info.label === "University" ? "md:col-span-2" : ""}
                    >
                      <InfoField label={info.label} value={info.value} />
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard
              title="Interests & Lifestyle"
              actionLabel="Edit"
              onAction={() => navigate("/edit-profile")}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4">
                {profileData.interests.map((item, index) => (
                  <InfoField key={index} label={item.label} value={item.value} />
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Personal Preferences"
              actionLabel="Edit"
              onAction={() => navigate("/edit-profile")}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4">
                {profileData.personalPreferences.map((item, index) => (
                  <InfoField key={index} label={item.label} value={item.value} />
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Your Reviews & Ratings">
              <div id="reviews" className="space-y-4 scroll-mt-6">
                {displayedReviews.length > 0 ? (
                  displayedReviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-5 rounded-2xl border border-gray-100 bg-gray-50/40 hover:bg-white hover:shadow-md hover:border-gray-200/60 transition-all duration-200 animate-fadeIn"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={review.avatar}
                            alt={review.author}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
                          />
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">
                              {review.author}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md tracking-wide uppercase">
                                {review.role}
                              </span>
                              <span className="text-xs text-gray-400">
                                {review.date}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, index) => (
                            <Star
                              key={index}
                              className={`w-3.5 h-3.5 ${
                                index < review.score
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-gray-200 fill-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 leading-relaxed pl-1 italic">
                        "{review.text}"
                      </p>

                      <div className="flex items-center gap-3 border-t border-gray-100 pt-3 mt-3 relative">
                        <button
                          onClick={() =>
                            setOpenReplyFor(
                              openReplyFor === review.id ? null : review.id,
                            )
                          }
                          className={`text-xs font-bold flex items-center gap-1.5 transition-colors ${
                            openReplyFor === review.id
                              ? "text-blue-600"
                              : "text-gray-400 hover:text-blue-600"
                          }`}
                        >
                          <MessageCircle className="w-4 h-4" /> Reply
                        </button>

                        <div className="ml-auto relative">
                          <button
                            onClick={() =>
                              setActiveOptionsFor(
                                activeOptionsFor === review.id ? null : review.id,
                              )
                            }
                            className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {activeOptionsFor === review.id && (
                            <div className="absolute right-0 bottom-7 bg-white border border-gray-100 shadow-xl rounded-xl py-1.5 w-32 z-50">
                              <button
                                onClick={() => {
                                  window.alert("Reported");
                                  setActiveOptionsFor(null);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 font-semibold flex items-center gap-2"
                              >
                                <Flag className="w-3.5 h-3.5" /> Report review
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {openReplyFor === review.id && (
                        <ReplyBox
                          onSubmit={(text) => handleReplySubmit(review.id, text)}
                          onCancel={() => setOpenReplyFor(null)}
                        />
                      )}

                      {replies[review.id]?.map((reply, index) => (
                        <div
                          key={index}
                          className="mt-3 ml-6 p-3.5 bg-blue-50/40 rounded-xl border border-blue-100/60 relative before:content-[''] before:absolute before:left-[-14px] before:top-4 before:w-3 before:h-[2px] before:bg-blue-200"
                        >
                          <div className="text-[11px] text-blue-800 font-extrabold flex items-center gap-1.5">
                            <span>{reply.author}</span>
                            <span className="text-blue-300 font-normal">·</span>
                            <span className="text-gray-400 font-normal">
                              {reply.date}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700 mt-1 pl-0.5">
                            {reply.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-400">
                    No reviews yet.
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setShowAllReviews(!showAllReviews);
                  if (showAllReviews) {
                    document
                      .getElementById("reviews")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="w-full mt-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl text-sm hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all"
              >
                {showAllReviews
                  ? "Show Less Reviews"
                  : `View All ${profileData.rating.totalReviews} Reviews`}
              </button>
            </SectionCard>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-1 tracking-tight">
                Profile Completeness
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                Complete your account to stand out to potential roommates.
              </p>

              <div className="flex items-end gap-2 mb-2">
                <span className="text-3xl font-black text-blue-600 tracking-tight">
                  {profileData.profileCompleteness}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 mb-4 overflow-hidden">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${profileData.profileCompleteness}%` }}
                />
              </div>

              <ul className="text-xs space-y-2.5 text-gray-600 font-medium">
                {profileData.completionTips.map((tip, index) => (
                  <li
                    key={index}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${
                      tip.done
                        ? "text-green-600 bg-green-50"
                        : "text-amber-600 bg-amber-50"
                    }`}
                  >
                    {tip.done ? (
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    {tip.label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="border-b border-gray-100 pb-3 mb-4 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                  Verification
                </h3>
              </div>

              <div className="space-y-2.5 mb-4">
                {profileData.verification.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100/70 hover:border-gray-200 transition-colors"
                  >
                    <span className="text-xs font-bold text-gray-700">
                      {item.label}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border tracking-wide uppercase ${
                        item.isVerified
                          ? "text-green-700 bg-green-50 border-green-200"
                          : "text-amber-700 bg-amber-50 border-amber-200"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>

              <div>
                <input
                  ref={docInputRef}
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleDocUpload}
                  className="hidden"
                />
                <button
                  onClick={() => docInputRef.current?.click()}
                  className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-xs transition-colors shadow-md flex justify-center items-center gap-2"
                >
                  <UploadCloud className="w-4 h-4" /> Upload New Documents
                </button>

                {docs.length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200/60 space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">
                      Uploaded files:
                    </span>
                    {docs.map((doc, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100 text-xs shadow-sm"
                      >
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline font-semibold max-w-[80%] truncate block"
                        >
                          {doc.name}
                        </a>
                        <button
                          onClick={() => {
                            if (doc.url.startsWith("blob:")) URL.revokeObjectURL(doc.url);
                            setDocs((currentDocs) =>
                              currentDocs.filter((_, itemIndex) => itemIndex !== index),
                            );
                          }}
                          className="text-gray-400 hover:text-red-600 p-1 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
