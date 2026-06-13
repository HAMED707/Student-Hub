import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Edit3,
  FileCheck2,
  GraduationCap,
  MapPin,
  Settings,
  Sparkles,
  UserRound,
} from "lucide-react";
import Navbar from "../../assets/components/Navbar/Navbar.jsx";
import {
  fetchMyProfile,
  fetchVerificationDocuments,
} from "../../api/accounts.js";
import { withApiUrl } from "../../api/client.js";
import {
  fetchMyRoommateProfile,
  fetchUserReviews,
} from "../../api/roommates.js";
import {
  DEFAULT_PROFILE_AVATAR,
  formatBudgetRange,
  formatChoiceLabel,
  getDisplayName,
} from "../../utils/profile.js";

const StatCard = ({ label, value, icon }) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
          {label}
        </p>
        <p className="mt-2 text-2xl font-black text-[#091E42]">{value}</p>
      </div>
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
        {icon}
      </div>
    </div>
  </div>
);

const Section = ({ title, children, actionLabel, onAction }) => (
  <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-lg font-black text-[#091E42]">{title}</h2>
      {actionLabel ? (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"
        >
          <Edit3 className="h-4 w-4" />
          {actionLabel}
        </button>
      ) : null}
    </div>
    <div className="mt-5">{children}</div>
  </section>
);

const InfoGrid = ({ items }) => (
  <div className="grid gap-4 md:grid-cols-2">
    {items.map((item) => (
      <div
        key={item.label}
        className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
      >
        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
          {item.label}
        </p>
        <p className="mt-2 text-sm font-semibold text-[#091E42]">{item.value}</p>
      </div>
    ))}
  </div>
);

const formatReviewDate = (value) => {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString();
};

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [roommateProfile, setRoommateProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const account = await fetchMyProfile();
        const [roommateResult, documentResult, reviewResult] = await Promise.allSettled([
          fetchMyRoommateProfile(),
          fetchVerificationDocuments(),
          fetchUserReviews(account.id),
        ]);

        setProfile(account);
        setRoommateProfile(
          roommateResult.status === "fulfilled" ? roommateResult.value : null,
        );
        setDocuments(
          documentResult.status === "fulfilled" && Array.isArray(documentResult.value)
            ? documentResult.value
            : [],
        );
        setReviews(
          reviewResult.status === "fulfilled" && Array.isArray(reviewResult.value)
            ? reviewResult.value
            : [],
        );
      } catch (loadError) {
        setError(loadError.message || "Unable to load your profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const content = useMemo(() => {
    const student = profile?.student_profile || {};
    const roommate = roommateProfile || {};
    const approvedDocs = documents.filter((document) => document.status === "approved").length;
    const pendingDocs = documents.filter((document) => document.status === "pending").length;

    return {
      name: getDisplayName(profile || {}),
      avatar: profile?.profile_picture
        ? withApiUrl(profile.profile_picture)
        : DEFAULT_PROFILE_AVATAR,
      city: profile?.city || roommate.city || "Not set",
      university: student.university || roommate.university || "Not set",
      faculty: student.faculty || "Not set",
      yearOfStudy: formatChoiceLabel(student.year_of_study),
      bio: student.bio || roommate.bio || "Add a short bio from Edit Profile.",
      isLooking: student.is_looking_for_room || roommate.is_active,
      budget: formatBudgetRange(roommate.budget_min || student.budget_min, roommate.budget_max || student.budget_max),
      stats: {
        profileStrength: `${student.profile_strength || 0}%`,
        approvedDocs,
        pendingDocs,
        reviews: reviews.length,
      },
      studyInfo: [
        { label: "Email", value: profile?.email || "Not set" },
        { label: "Phone", value: profile?.phone_number || "Not set" },
        { label: "City", value: profile?.city || "Not set" },
        { label: "University", value: student.university || roommate.university || "Not set" },
        { label: "Faculty", value: student.faculty || "Not set" },
        { label: "Year of study", value: formatChoiceLabel(student.year_of_study) },
      ],
      roommateInfo: [
        { label: "Looking for roommate", value: student.is_looking_for_room || roommate.is_active ? "Yes" : "No" },
        { label: "Budget range", value: formatBudgetRange(roommate.budget_min || student.budget_min, roommate.budget_max || student.budget_max) },
        { label: "Sleep schedule", value: formatChoiceLabel(roommate.sleeping_time || student.sleeping_time) },
        { label: "Cleanliness", value: formatChoiceLabel(roommate.cleanliness || student.cleanliness) },
        { label: "Personality", value: formatChoiceLabel(roommate.personality || student.personality) },
        { label: "Room type", value: formatChoiceLabel(roommate.room_type_preference || student.room_type_preference) },
      ],
    };
  }, [documents, profile, reviews.length, roommateProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] font-sans">
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-500">
          Loading profile...
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] font-sans">
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="rounded-3xl border border-rose-100 bg-white p-6 text-sm font-semibold text-rose-600 shadow-sm">
            {error || "Profile unavailable."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#091E42]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <img
                src={content.avatar}
                alt={content.name}
                className="h-28 w-28 rounded-full object-cover shadow-lg"
              />

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-black">{content.name}</h1>
                  {profile.is_verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      Verified
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  {content.city}
                  <span>·</span>
                  <GraduationCap className="h-4 w-4 text-blue-600" />
                  {content.university}
                </p>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  {content.bio}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/edit-profile")}
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#155BC2] px-4 text-sm font-black text-white"
              >
                <Edit3 className="h-4 w-4" />
                Edit profile
              </button>
              <button
                type="button"
                onClick={() => navigate("/settings")}
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Profile Strength"
            value={content.stats.profileStrength}
            icon={<Sparkles className="h-5 w-5" />}
          />
          <StatCard
            label="Approved Docs"
            value={content.stats.approvedDocs}
            icon={<FileCheck2 className="h-5 w-5" />}
          />
          <StatCard
            label="Pending Docs"
            value={content.stats.pendingDocs}
            icon={<UserRound className="h-5 w-5" />}
          />
          <StatCard
            label="Reviews"
            value={content.stats.reviews}
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
        </section>

        <div className="mt-6 space-y-6">
          <Section title="Student Information" actionLabel="Edit" onAction={() => navigate("/edit-profile")}>
            <InfoGrid items={content.studyInfo} />
          </Section>

          <Section title="Roommate Profile" actionLabel="Open Roommate" onAction={() => navigate("/roommate", { state: { tab: "profile" } })}>
            <InfoGrid items={content.roommateInfo} />
          </Section>

          <Section title="Verification Documents" actionLabel="Manage" onAction={() => navigate("/settings")}>
            {documents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                No verification documents uploaded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((document) => (
                  <div
                    key={document.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-black text-[#091E42]">
                          {document.doc_type.replaceAll("_", " ")}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Status: {document.status}
                        </p>
                        {document.review_note ? (
                          <p className="mt-2 text-sm text-slate-600">
                            {document.review_note}
                          </p>
                        ) : null}
                      </div>
                      <a
                        href={withApiUrl(document.file)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-black text-[#155BC2]"
                      >
                        Open file
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Reviews">
            {reviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                No public reviews yet.
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-black text-[#091E42]">
                          {review.reviewer_username || "Anonymous"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {review.rating}/5 · {formatReviewDate(review.created_at)}
                        </p>
                      </div>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#155BC2]">
                        {review.reviewer_role || "Reviewer"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {review.comment || "No written comment provided."}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </Section>
        </div>
      </main>
    </div>
  );
}
