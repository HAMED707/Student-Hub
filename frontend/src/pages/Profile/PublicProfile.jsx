import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../assets/components/Navbar/Navbar.jsx";
import {
  MapPin,
  Shield,
  Star,
  Globe,
  MessageCircle,
  UserPlus,
  Clock,
  Check,
} from "lucide-react";
import { apiJson, withApiUrl } from "../../api/client.js";
import { createUserReview } from "../../api/reviews.js";
import { fetchRoommateProfile, fetchUserReviews } from "../../api/roommates.js";
import { getApiErrorMessage, getStoredUser } from "../../utils/auth.js";
import { buildDraftChatState } from "../../utils/messaging.js";

const coverImage =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop";
const fallbackAvatar =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80";

const InfoField = ({ label, value }) => (
  <div className="flex flex-col mb-4 group">
    <label className="mb-1.5 ml-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
      {label}
    </label>
    <div className="w-full break-words rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm transition-all duration-200 hover:border-gray-300">
      {value || "Not set"}
    </div>
  </div>
);

const SectionCard = ({ title, children }) => (
  <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md">
    <div className="mb-5 border-b border-gray-100 pb-4">
      <h3 className="text-lg font-bold tracking-tight text-gray-900">{title}</h3>
    </div>
    {children}
  </div>
);

const formatCurrencyRange = (min, max) => {
  if (min == null && max == null) return "Not set";
  if (min != null && max != null) return `${min} - ${max} EGP`;
  return `${min ?? max} EGP`;
};

const formatLabel = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());

export default function PublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [roommateProfile, setRoommateProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    reviewer_role: "classmate",
    comment: "",
  });
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const storedUser = getStoredUser();
  const isOwnProfile = String(storedUser?.id || "") === String(id);
  const canLeaveReview = Boolean(storedUser && !isOwnProfile);
  const currentRole = storedUser?.role || "student";

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const [accountData, roommateData, reviewData] = await Promise.all([
          apiJson(`/api/auth/profile/${id}/`),
          fetchRoommateProfile(id).catch(() => null),
          fetchUserReviews(id).catch(() => []),
        ]);

        if (cancelled) return;
        setProfile(accountData);
        setRoommateProfile(roommateData);
        setReviews(Array.isArray(reviewData) ? reviewData : reviewData?.reviews || []);
      } catch (requestError) {
        if (!cancelled) setError(requestError.message || "Failed to load profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleReviewFieldChange = (field, value) => {
    if (reviewError) setReviewError("");
    if (reviewSuccess) setReviewSuccess("");
    setReviewForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmitReview = async (event) => {
    event.preventDefault();

    if (!canLeaveReview) {
      setReviewError("You must be signed in and viewing someone else's profile.");
      return;
    }

    try {
      setSubmittingReview(true);
      setReviewError("");
      setReviewSuccess("");

      const createdReview = await createUserReview(id, {
        rating: Number(reviewForm.rating),
        reviewer_role: reviewForm.reviewer_role,
        comment: reviewForm.comment.trim(),
      });

      setReviews((current) => [createdReview, ...current]);
      setReviewForm({
        rating: 5,
        reviewer_role: "classmate",
        comment: "",
      });
      setReviewSuccess("Review submitted successfully.");
    } catch (submitError) {
      setReviewError(getApiErrorMessage(submitError, "Failed to submit review"));
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleMessageUser = () => {
    if (!profile?.id || isOwnProfile) return;

    navigate(currentRole === "landlord" ? "/owner/messages" : "/messages", {
      state: buildDraftChatState({
        receiverId: profile.id,
        name:
          [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
          profile.username ||
          "User",
        avatar: profile.profile_picture ? withApiUrl(profile.profile_picture) : fallbackAvatar,
        receiverRole: currentRole === "landlord" ? "Student" : "User",
      }),
    });
  };

  const userData = useMemo(() => {
    const studentProfile = profile?.student_profile || {};
    const name =
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
      profile?.username ||
      "Student";
    const avatar = profile?.profile_picture ? withApiUrl(profile.profile_picture) : fallbackAvatar;
    const location = roommateProfile?.city || profile?.city || "Not set";
    const university = roommateProfile?.university || studentProfile.university || "Not set";

    return {
      name,
      email: profile?.email || "",
      avatar,
      cover: coverImage,
      status: roommateProfile?.is_active ? "Looking for a roommate" : "Not actively looking",
      matchScore: roommateProfile?.match_score ?? 0,
      basicInfo: [
        { label: "Full Name", value: name },
        { label: "Location", value: location },
        { label: "University", value: university },
        { label: "Faculty / Major", value: studentProfile.faculty || "Not set" },
        { label: "Academic Year", value: studentProfile.year_of_study || "Not set" },
      ],
      interests: [
        { label: "Sleeping Time", value: roommateProfile?.sleeping_time || studentProfile.sleeping_time },
        { label: "Study Environment", value: studentProfile.music_preference },
        { label: "Routine", value: studentProfile.lifestyle_tags?.join(", ") },
        { label: "Guests Frequency", value: roommateProfile?.guests_policy || studentProfile.guests_policy },
        { label: "Personality Type", value: roommateProfile?.personality || studentProfile.personality },
        { label: "Cleanliness Level", value: roommateProfile?.cleanliness || studentProfile.cleanliness },
        { label: "Room Type", value: roommateProfile?.room_type_preference || studentProfile.preferred_room_type },
        { label: "Smoking Status", value: roommateProfile?.smoking || studentProfile.smoking },
        { label: "Budget Range", value: formatCurrencyRange(roommateProfile?.budget_min, roommateProfile?.budget_max) },
      ],
      preferences: [
        { label: "Budget Range", value: formatCurrencyRange(studentProfile.budget_min, studentProfile.budget_max) },
        { label: "Preferred Room Type", value: studentProfile.preferred_room_type || roommateProfile?.room_type_preference },
        { label: "Smoking Preference", value: roommateProfile?.smoking_preference || studentProfile.smoking_preference },
        { label: "Sleeping Schedule", value: roommateProfile?.sleep_schedule_pref || studentProfile.sleep_schedule_pref },
        { label: "Cleanliness Level", value: roommateProfile?.cleanliness_pref || studentProfile.cleanliness_pref },
        { label: "Personality Type", value: roommateProfile?.personality_pref || studentProfile.personality_pref },
      ],
      reviews: reviews.map((review) => ({
        id: review.id,
        author: review.reviewer_username || "Anonymous",
        role: formatLabel(review.reviewer_role || "reviewer"),
        text: review.comment || "",
        avatar: review.reviewer_picture ? withApiUrl(review.reviewer_picture) : fallbackAvatar,
      })),
      verification: [
        { label: "Account Status", status: profile?.is_verified ? "Verified" : "Pending" },
        { label: "Roommate Profile", status: roommateProfile?.is_active ? "Active" : "Inactive" },
      ],
    };
  }, [profile, roommateProfile, reviews]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7f9] font-sans antialiased">
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 py-12 text-slate-600">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f4f7f9] font-sans antialiased">
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 py-12 text-rose-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f9] font-sans pb-20 antialiased">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-8 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="relative h-52 w-full bg-gray-900">
            <img src={userData.cover} alt="Cover" className="h-full w-full object-cover opacity-80" />
            <div className="absolute right-4 top-4 flex items-center gap-2 rounded-xl border border-gray-100 bg-white/95 px-4 py-2 text-xs font-bold text-blue-700 backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="font-semibold text-gray-500">Status:</span>
              {userData.status}
            </div>
          </div>

          <div className="px-6 pb-8 pt-4 md:px-10">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div className="flex w-full flex-col gap-5 text-center sm:flex-row sm:items-end sm:text-left md:w-auto">
                <div className="relative z-10 shrink-0 -mt-20">
                  <img
                    src={userData.avatar}
                    alt="Avatar"
                    className="h-28 w-28 rounded-full border-[5px] border-white object-cover bg-white shadow-xl md:h-32 md:w-32"
                  />
                  <div className="absolute bottom-1 right-1 rounded-full border-2 border-white bg-green-500 p-1.5 text-white shadow" title="Verified User">
                    <Shield className="h-4 w-4" />
                  </div>
                </div>

                <div className="flex-1 min-w-0 pt-2">
                  <h1 className="text-2xl font-black tracking-tight text-gray-900 md:text-3xl">
                    {userData.name}
                  </h1>
                  <div className="mt-1.5 flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-gray-500 sm:justify-start">
                    <p className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      {userData.basicInfo[1].value}
                    </p>
                    <span className="hidden text-gray-300 sm:inline">•</span>
                    <p className="flex items-center gap-1 break-all">
                      <Globe className="h-3.5 w-3.5 text-gray-400" />
                      {userData.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-2 flex w-full gap-3 shrink-0 md:mt-0 md:w-auto">
                <button
                  onClick={handleMessageUser}
                  disabled={isOwnProfile}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 disabled:cursor-not-allowed disabled:bg-blue-300 md:flex-none"
                >
                  <MessageCircle className="h-4 w-4" />
                  Message
                </button>
                <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 md:flex-none">
                  <UserPlus className="h-4 w-4" />
                  Invite
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 items-start lg:grid-cols-12">
          <div className="space-y-2 lg:col-span-8">
            <SectionCard title="Basic Information">
              <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
                {userData.basicInfo.map((info) => (
                  <div key={info.label} className={info.label === "University" ? "md:col-span-2" : ""}>
                    <InfoField label={info.label} value={info.value} />
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Interests & Lifestyle">
              <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2 md:grid-cols-3">
                {userData.interests.map((item) => (
                  <InfoField key={item.label} label={item.label} value={item.value} />
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Personal Preferences (What I'm looking for)">
              <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2 md:grid-cols-3">
                {userData.preferences.map((item) => (
                  <InfoField key={item.label} label={item.label} value={item.value} />
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Reviews from Landlords & Students">
              <div className="space-y-4">
                {canLeaveReview && (
                  <form
                    onSubmit={handleSubmitReview}
                    className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-base font-bold text-gray-900">Leave a review</h4>
                        <p className="mt-1 text-sm text-gray-600">
                          Share your experience with this user.
                        </p>
                      </div>
                      <div className="rounded-full bg-white px-4 py-2 text-xs font-bold text-blue-700 shadow-sm">
                        Public feedback
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                          Rating
                        </label>
                        <select
                          value={reviewForm.rating}
                          onChange={(event) =>
                            handleReviewFieldChange("rating", event.target.value)
                          }
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800"
                        >
                          {[5, 4, 3, 2, 1].map((value) => (
                            <option key={value} value={value}>
                              {value} star{value > 1 ? "s" : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                          Relationship
                        </label>
                        <select
                          value={reviewForm.reviewer_role}
                          onChange={(event) =>
                            handleReviewFieldChange("reviewer_role", event.target.value)
                          }
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800"
                        >
                          <option value="classmate">Classmate</option>
                          <option value="roommate">Roommate</option>
                          <option value="neighbor">Neighbor</option>
                          <option value="landlord">Landlord</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                        Comment
                      </label>
                      <textarea
                        value={reviewForm.comment}
                        onChange={(event) =>
                          handleReviewFieldChange("comment", event.target.value)
                        }
                        rows={4}
                        maxLength={600}
                        placeholder="Write a short, honest review."
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800"
                      />
                    </div>

                    {reviewError && (
                      <p className="mt-3 text-sm font-medium text-rose-600">{reviewError}</p>
                    )}
                    {reviewSuccess && (
                      <p className="mt-3 text-sm font-medium text-emerald-600">{reviewSuccess}</p>
                    )}

                    <div className="mt-4 flex justify-end">
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submittingReview ? "Submitting..." : "Submit Review"}
                      </button>
                    </div>
                  </form>
                )}

                {!storedUser && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Sign in to leave a review for this user.
                  </div>
                )}

                {storedUser && isOwnProfile && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    You cannot leave a review on your own profile.
                  </div>
                )}

                {userData.reviews.length ? (
                  userData.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="rounded-2xl border border-gray-100 bg-gray-50/40 p-5 transition-all duration-200 hover:border-gray-200/60 hover:bg-white hover:shadow-md"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={review.avatar}
                            alt={review.author}
                            className="h-10 w-10 rounded-full object-cover ring-2 ring-gray-100"
                          />
                          <div>
                            <h4 className="text-sm font-bold text-gray-900">{review.author}</h4>
                            <span className="mt-0.5 inline-block rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-blue-700">
                              {review.role}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <Star className="h-3.5 w-3.5 fill-current" />
                        </div>
                      </div>
                      <p className="pl-1 text-sm leading-relaxed italic text-gray-600">"{review.text}"</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500">
                    No reviews yet.
                  </div>
                )}
              </div>
            </SectionCard>
          </div>

          <div className="space-y-6 lg:col-span-4">
            <div className="rounded-2xl bg-gradient-to-br from-indigo-900 to-blue-900 p-6 text-white shadow-md">
              <div className="mb-4 flex items-center gap-2 opacity-90">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <h3 className="text-sm font-bold uppercase tracking-wide">Compatibility Match</h3>
              </div>
              <div className="mb-3 flex items-end gap-2">
                <span className="text-4xl font-black tracking-tight">{userData.matchScore}%</span>
                <span className="mb-1 text-xs font-semibold text-blue-200">Great Match!</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-2 rounded-full bg-green-400 transition-all duration-500"
                  style={{ width: `${userData.matchScore}%` }}
                />
              </div>
              <p className="mt-4 text-xs leading-relaxed text-blue-200/80">
                Based on the available roommate profile details, this user looks like a promising match.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 border-b border-gray-100 pb-3">
                <h3 className="flex items-center gap-2 text-lg font-bold tracking-tight text-gray-900">
                  <Shield className="h-5 w-5 text-green-500" />
                  Trust & Verification
                </h3>
              </div>

              <div className="space-y-2.5">
                {userData.verification.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/70 p-3"
                  >
                    <span className="text-xs font-bold text-gray-700">{item.label}</span>
                    <span className="rounded-md border border-green-200 bg-green-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-green-700">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Clock className="h-4 w-4 text-gray-400" />
                Roommate profile synced from backend
              </div>
              <p className="mt-2 text-xs leading-relaxed text-gray-500">
                This page now reads the authenticated backend profile, roommate details, and user reviews instead of static mock data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
