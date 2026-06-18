import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  Clock3,
  Filter,
  MessageSquare,
  RotateCcw,
  Send,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";
import Navbar from "../../assets/components/Navbar/Navbar.jsx";
import { fetchMyProfile, updateMyProfile } from "../../api/accounts.js";
import {
  fetchMyRoommateProfile,
  fetchRoommateMatches,
  fetchRoommateRequests,
  fetchRoommates,
  sendRoommateRequest,
  updateMyRoommateProfile,
  updateRoommateRequestStatus,
} from "../../api/roommates.js";
import {
  CLEANLINESS_OPTIONS,
  GUEST_POLICY_OPTIONS,
  PERSONALITY_OPTIONS,
  ROOM_TYPE_OPTIONS,
  SLEEP_OPTIONS,
  SMOKING_OPTIONS,
  buildStudentAccountForm,
  formatBudgetRange,
  formatChoiceLabel,
} from "../../utils/profile.js";
import { buildDraftChatState } from "../../utils/messaging.js";
import { withApiUrl } from "../../api/client.js";

// ── Constants ─────────────────────────────────────────────────────────────

const tabs = [
  { id: "discover", label: "Discover" },
  { id: "matches", label: "Matches" },
  { id: "requests", label: "Requests" },
  { id: "profile", label: "My roommate profile" },
];

const fieldClassName =
  "mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#155BC2]";

// ── Pure helpers ──────────────────────────────────────────────────────────

const buildAvatar = (name, picture) =>
  picture
    ? withApiUrl(picture)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Student")}&background=0A2647&color=fff`;

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const computeProfileCompleteness = (form) => {
  const fields = [
    form.bio,
    form.university,
    form.city,
    form.sleepingTime,
    form.cleanliness,
    form.personality,
    form.smoking,
    form.guestsPolicy,
    form.budgetMin,
    form.budgetMax,
    form.roomTypePreference,
  ];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
};

// ── Data mappers ──────────────────────────────────────────────────────────

const mapRoommateCard = (raw = {}) => {
  const name = raw.full_name || raw.username || "Student";
  return {
    id: String(raw.user_id || raw.id || ""),
    name,
    avatar: buildAvatar(name, raw.profile_picture),
    university: raw.university || "Not set",
    faculty: raw.faculty || "Not set",
    yearOfStudy: raw.year_of_study || "Not set",
    city: raw.city || "Not set",
    bio: raw.bio || "No bio yet.",
    budget: formatBudgetRange(raw.budget_min, raw.budget_max),
    budgetMin: raw.budget_min ? Number(raw.budget_min) : null,
    budgetMax: raw.budget_max ? Number(raw.budget_max) : null,
    matchScore: Number(raw.match_score || 0),
    sleepingTime: formatChoiceLabel(raw.sleeping_time),
    cleanliness: formatChoiceLabel(raw.cleanliness),
    personality: formatChoiceLabel(raw.personality),
    roomType: formatChoiceLabel(raw.room_type_preference),
    roomTypeRaw: raw.room_type_preference || "",
  };
};

const mapRequest = (raw = {}, type = "sent") => {
  const name =
    type === "sent"
      ? raw.receiver_username || "Student"
      : raw.sender_username || "Student";
  const picture = type === "sent" ? raw.receiver_picture : raw.sender_picture;
  return {
    id: String(raw.id),
    userId: String(type === "sent" ? raw.receiver : raw.sender),
    name,
    avatar: buildAvatar(name, picture),
    status: raw.status,
    message: raw.message || "",
    createdAt: raw.created_at,
    type,
  };
};

// ── Shared UI pieces ──────────────────────────────────────────────────────

const Section = ({ title, description, children }) => (
  <section className="mt-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
    <h2 className="text-lg font-black text-[#091E42]">{title}</h2>
    {description ? (
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    ) : null}
    <div className="mt-5">{children}</div>
  </section>
);

function LifestyleGrid({ card }) {
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-600">
        Budget: {card.budget}
      </div>
      <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-600">
        {card.city} · {card.yearOfStudy}
      </div>
      <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-600">
        Sleep: {card.sleepingTime}
      </div>
      <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-600">
        Cleanliness: {card.cleanliness}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cls =
    status === "pending"
      ? "bg-amber-50 text-amber-700"
      : status === "accepted"
        ? "bg-emerald-50 text-emerald-700"
        : status === "withdrawn"
          ? "bg-slate-100 text-slate-500"
          : "bg-rose-50 text-rose-600";
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${cls}`}>
      {status}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────

const VALID_TABS = new Set(["discover", "matches", "requests", "profile"]);

export default function Roommate() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = (() => {
    const fromUrl = searchParams.get("tab");
    if (fromUrl && VALID_TABS.has(fromUrl)) return fromUrl;
    return location.state?.tab || "discover";
  })();

  const setActiveTab = (tab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", tab);
      return next;
    }, { replace: true });
  };

  const [filters, setFilters] = useState({
    university: "",
    city: "",
    budget_max: "",
    room_type: "",
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [discoverCards, setDiscoverCards] = useState([]);
  const [matches, setMatches] = useState([]);
  const [matchesError, setMatchesError] = useState("");
  const [requests, setRequests] = useState({ sent: [], received: [] });
  const [roommateForm, setRoommateForm] = useState(() => buildStudentAccountForm());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [requestTarget, setRequestTarget] = useState(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [rejectTarget, setRejectTarget] = useState(null);

  const highlightedRequestId = location.state?.requestId
    ? String(location.state.requestId)
    : "";

  // ── Data loading ────────────────────────────────────────────────────────

  const loadRoommateData = async () => {
    setLoading(true);
    setError("");
    setMatchesError("");
    try {
      let matchPayload = { matches: [] };
      const [profile, roommateProfile, discover, requestPayload] =
        await Promise.all([
          fetchMyProfile(),
          fetchMyRoommateProfile(),
          fetchRoommates({}),
          fetchRoommateRequests(),
        ]);

      try {
        matchPayload = await fetchRoommateMatches();
      } catch (matchErr) {
        const msg =
          matchErr?.data?.error ||
          matchErr?.message ||
          "Could not load AI matches.";
        setMatchesError(msg);
      }

      const discoverRows = Array.isArray(discover)
        ? discover.map(mapRoommateCard)
        : [];
      const discoverMap = new Map(discoverRows.map((card) => [card.id, card]));

      const matchRows = Array.isArray(matchPayload?.matches)
        ? matchPayload.matches.map((match) => {
            // Backend now returns full profile data alongside compatibility_score.
            // Fall back to discoverMap for any field not present in the match payload.
            const linked = discoverMap.get(String(match.user_id || ""));
            const raw = match; // enriched profile fields land at the top level
            const name =
              raw.full_name ||
              raw.username ||
              linked?.name ||
              "Student";
            return {
              id: String(raw.user_id || match.user_id || linked?.id || Math.random()),
              name,
              avatar: buildAvatar(name, raw.profile_picture || null),
              university: raw.university || linked?.university || "Not set",
              faculty: raw.faculty || linked?.faculty || "Not set",
              yearOfStudy: raw.year_of_study || linked?.yearOfStudy || "Not set",
              city: raw.city || linked?.city || "Not set",
              bio: raw.bio || linked?.bio || "Top AI match",
              budget: formatBudgetRange(raw.budget_min, raw.budget_max) || linked?.budget || "Not set",
              matchScore: Math.round(Number(raw.compatibility_score || 0)),
              sleepingTime: formatChoiceLabel(raw.sleeping_time) || linked?.sleepingTime || "Not set",
              cleanliness: formatChoiceLabel(raw.cleanliness) || linked?.cleanliness || "Not set",
              personality: formatChoiceLabel(raw.personality) || linked?.personality || "Not set",
              roomType: formatChoiceLabel(raw.room_type_preference) || linked?.roomType || "Not set",
            };
          })
        : [];

      setRoommateForm(buildStudentAccountForm(profile, roommateProfile));
      setDiscoverCards(discoverRows);
      setMatches(matchRows);
      setRequests({
        sent: Array.isArray(requestPayload?.sent)
          ? requestPayload.sent.map((item) => mapRequest(item, "sent"))
          : [],
        received: Array.isArray(requestPayload?.received)
          ? requestPayload.received.map((item) => mapRequest(item, "received"))
          : [],
      });
    } catch (err) {
      setError(err.message || "Unable to load roommate data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoommateData();
  }, []);

  // ── Derived state ───────────────────────────────────────────────────────

  const requestedUserIds = useMemo(
    () =>
      new Set(
        requests.sent
          .filter((r) => r.status !== "withdrawn")
          .map((r) => r.userId),
      ),
    [requests.sent],
  );

  const profileCompleteness = useMemo(
    () => computeProfileCompleteness(roommateForm),
    [roommateForm],
  );

  const showIncompleteCallout =
    profileCompleteness < 30 &&
    (activeTab === "discover" || activeTab === "matches");

  const universitySuggestions = useMemo(() => {
    const seen = new Set();
    return discoverCards
      .map((c) => c.university)
      .filter((u) => u && u !== "Not set" && !seen.has(u) && seen.add(u))
      .sort();
  }, [discoverCards]);

  const citySuggestions = useMemo(() => {
    const seen = new Set();
    return discoverCards
      .map((c) => c.city)
      .filter((c) => c && c !== "Not set" && !seen.has(c) && seen.add(c))
      .sort();
  }, [discoverCards]);

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter(Boolean).length,
    [filters],
  );

  const filteredDiscoverCards = useMemo(() => {
    const uniQ = filters.university.trim().toLowerCase();
    const cityQ = filters.city.trim().toLowerCase();
    const budgetMax = filters.budget_max ? Number(filters.budget_max) : null;
    const roomType = filters.room_type;

    return discoverCards.filter((card) => {
      if (uniQ && !card.university.toLowerCase().includes(uniQ)) return false;
      if (cityQ && !card.city.toLowerCase().includes(cityQ)) return false;
      if (budgetMax !== null && card.budgetMin !== null && card.budgetMin > budgetMax) return false;
      if (roomType && card.roomTypeRaw !== roomType) return false;
      return true;
    });
  }, [discoverCards, filters]);

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleClearFilters = () => {
    setFilters({ university: "", city: "", budget_max: "", room_type: "" });
  };

  const handleSendRequest = (card) => {
    setRequestTarget(card);
    setRequestMessage(`Hi ${card.name}, I'd like to connect about being roommates.`);
  };

  const handleConfirmRequest = async () => {
    if (!requestTarget) return;
    setSaving(true);
    setError("");
    try {
      await sendRoommateRequest({
        receiver: Number(requestTarget.id),
        message: requestMessage,
      });
      setRequestTarget(null);
      await loadRoommateData();
      setActiveTab("requests");
    } catch (err) {
      setError(err.message || "Failed to send roommate request.");
    } finally {
      setSaving(false);
    }
  };

  const handleRequestAction = async (requestId, newStatus) => {
    setSaving(true);
    setError("");
    try {
      await updateRoommateRequestStatus(requestId, newStatus);
      await loadRoommateData();
    } catch (err) {
      setError(err.message || "Failed to update request.");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    setSaving(true);
    setError("");
    try {
      await updateRoommateRequestStatus(rejectTarget.id, "rejected");
      setRejectTarget(null);
      await loadRoommateData();
    } catch (err) {
      setError(err.message || "Failed to reject request.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRoommateProfile = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await Promise.all([
        updateMyRoommateProfile({
          is_active: Boolean(roommateForm.isLookingForRoom),
          bio: roommateForm.bio,
          university: roommateForm.university,
          city: roommateForm.city,
          move_in_date: roommateForm.moveInDate || null,
          budget_min: roommateForm.budgetMin ? Number(roommateForm.budgetMin) : 0,
          budget_max: roommateForm.budgetMax ? Number(roommateForm.budgetMax) : 0,
          sleeping_time: roommateForm.sleepingTime || null,
          cleanliness: roommateForm.cleanliness || null,
          personality: roommateForm.personality || null,
          smoking: roommateForm.smoking || null,
          guests_policy: roommateForm.guestsPolicy || null,
          room_type_preference: roommateForm.roomTypePreference || null,
          smoking_preference: roommateForm.smokingPreference || null,
          sleep_schedule_pref: roommateForm.sleepSchedulePref || null,
          cleanliness_pref: roommateForm.cleanlinessPref || null,
          personality_pref: roommateForm.personalityPref || null,
        }),
        updateMyProfile({
          city: roommateForm.city,
          student_profile: {
            bio: roommateForm.bio,
            university: roommateForm.university,
            is_looking_for_room: Boolean(roommateForm.isLookingForRoom),
          },
        }),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      await loadRoommateData();
    } catch (err) {
      setError(err.message || "Failed to save roommate profile.");
    } finally {
      setSaving(false);
    }
  };

  const openDirectChat = (card) =>
    navigate("/messages", {
      state: buildDraftChatState({
        receiverId: card.id,
        name: card.name,
        avatar: card.avatar,
        receiverRole: "Student",
      }),
    });

  // ── JSX ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#091E42]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">

        {/* Header */}
        <header className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#155BC2]">
            Roommates
          </p>
          <h1 className="mt-1 text-3xl font-black">Roommate Matching</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Find your ideal roommate through AI-powered matching, manage requests, and keep your listing up to date.
          </p>
        </header>

        {/* Tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                activeTab === tab.id
                  ? "bg-[#155BC2] text-white"
                  : "border border-slate-200 bg-white text-slate-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Incomplete profile callout */}
        {showIncompleteCallout ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            Your roommate profile is incomplete — match scores will be inaccurate.{" "}
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className="font-black underline"
            >
              Complete your profile →
            </button>
          </div>
        ) : null}

        {/* Global error */}
        {error ? (
          <div className="mt-6 rounded-3xl border border-rose-100 bg-white p-5 text-sm font-semibold text-rose-600 shadow-sm">
            {error}
          </div>
        ) : null}

        {/* Loading */}
        {loading ? (
          <div className="mt-6 rounded-3xl border border-slate-100 bg-white p-6 text-sm text-slate-500 shadow-sm">
            Loading roommate data…
          </div>
        ) : null}

        {/* ══ DISCOVER TAB ════════════════════════════════════════ */}
        {!loading && activeTab === "discover" ? (
          <>
            {/* Filter toggle */}
            <div className="mt-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFiltersOpen((o) => !o)}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-black transition ${
                    filtersOpen || activeFilterCount > 0
                      ? "border-[#155BC2] bg-blue-50 text-[#155BC2]"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="rounded-full bg-[#155BC2] px-2 py-0.5 text-[10px] text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="text-xs font-black text-slate-400 hover:text-rose-500"
                  >
                    Clear all
                  </button>
                )}

                <span className="ml-auto text-sm text-slate-400">
                  {filteredDiscoverCards.length} result{filteredDiscoverCards.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Collapsible panel */}
              {filtersOpen && (
                <div className="mt-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-end gap-3">
                    <label className="flex min-w-[160px] flex-1 flex-col gap-1">
                      <span className="text-xs font-bold text-slate-500">University</span>
                      <input
                        list="university-suggestions"
                        value={filters.university}
                        onChange={(e) =>
                          setFilters((f) => ({ ...f, university: e.target.value }))
                        }
                        placeholder="Type to search…"
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#155BC2]"
                      />
                      <datalist id="university-suggestions">
                        {universitySuggestions.map((u) => (
                          <option key={u} value={u} />
                        ))}
                      </datalist>
                    </label>

                    <label className="flex min-w-[130px] flex-1 flex-col gap-1">
                      <span className="text-xs font-bold text-slate-500">City</span>
                      <input
                        list="city-suggestions"
                        value={filters.city}
                        onChange={(e) =>
                          setFilters((f) => ({ ...f, city: e.target.value }))
                        }
                        placeholder="Type to search…"
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#155BC2]"
                      />
                      <datalist id="city-suggestions">
                        {citySuggestions.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </label>

                    <label className="flex min-w-[140px] flex-1 flex-col gap-1">
                      <span className="text-xs font-bold text-slate-500">Max budget (EGP)</span>
                      <input
                        type="number"
                        min="0"
                        value={filters.budget_max}
                        onChange={(e) =>
                          setFilters((f) => ({ ...f, budget_max: e.target.value }))
                        }
                        placeholder="e.g. 5000"
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#155BC2]"
                      />
                    </label>

                    <label className="flex min-w-[130px] flex-1 flex-col gap-1">
                      <span className="text-xs font-bold text-slate-500">Room type</span>
                      <select
                        value={filters.room_type}
                        onChange={(e) =>
                          setFilters((f) => ({ ...f, room_type: e.target.value }))
                        }
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#155BC2]"
                      >
                        <option value="">All types</option>
                        <option value="single">Single</option>
                        <option value="shared">Shared</option>
                        <option value="both">Either</option>
                      </select>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <Section
              title="Discover Students"
              description="Browse active same-gender students looking for a roommate. Scores show compatibility based on your profile."
            >
              {filteredDiscoverCards.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                  {activeFilterCount > 0
                    ? "No students match your current filters. Try clearing one or more."
                    : "No same-gender roommate profiles are active yet."}
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {filteredDiscoverCards.map((card) => (
                    <article
                      key={card.id}
                      className="rounded-3xl border border-slate-100 bg-slate-50 p-5"
                    >
                      <div className="flex gap-4">
                        <img
                          src={card.avatar}
                          alt={card.name}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-lg font-black text-[#091E42]">
                            {card.name}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {card.university} · {card.faculty}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">{card.bio}</p>
                        </div>
                      </div>

                      <LifestyleGrid card={card} />

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/profile/${card.id}`)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"
                        >
                          <UserRound className="h-4 w-4" />
                          Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => openDirectChat(card)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Message
                        </button>
                        {requestedUserIds.has(card.id) ? (
                          <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-500">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            Requested
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSendRequest(card)}
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#155BC2] px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            <Send className="h-4 w-4" />
                            Send request
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </Section>
          </>
        ) : null}

        {/* ══ MATCHES TAB ═════════════════════════════════════════ */}
        {!loading && activeTab === "matches" ? (
          <Section
            title="AI Matches"
            description="Your top same-gender roommate suggestions, ranked by compatibility using cosine similarity on lifestyle fields."
          >
            {matchesError ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                <p className="font-bold">AI matching is unavailable</p>
                <p className="mt-1">{matchesError}</p>
                {matchesError.toLowerCase().includes("active") ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab("profile")}
                    className="mt-3 rounded-xl bg-amber-600 px-4 py-2 text-xs font-black text-white"
                  >
                    Activate my profile →
                  </button>
                ) : null}
              </div>
            ) : matches.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                No AI matches yet. The algorithm needs at least one other active same-gender student who shares your university and city. Make sure your profile is active and filled in.
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {matches.map((card) => (
                  <article
                    key={card.id}
                    className="rounded-3xl border border-slate-100 bg-slate-50 p-5"
                  >
                    <div className="flex gap-4">
                      <img
                        src={card.avatar}
                        alt={card.name}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-lg font-black text-[#091E42]">
                            {card.name}
                          </h3>
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                            {card.matchScore}% compatibility
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {card.university} · {card.faculty}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">{card.bio}</p>
                      </div>
                    </div>

                    <LifestyleGrid card={card} />

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/profile/${card.id}`)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"
                      >
                        <UserRound className="h-4 w-4" />
                        Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => openDirectChat(card)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Message
                      </button>
                      {requestedUserIds.has(card.id) ? (
                        <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-500">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          Requested
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendRequest(card)}
                          disabled={saving}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#155BC2] px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          <Send className="h-4 w-4" />
                          Send request
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </Section>
        ) : null}

        {/* ══ REQUESTS TAB ════════════════════════════════════════ */}
        {!loading && activeTab === "requests" ? (
          <Section
            title="Roommate Requests"
            description="Manage your incoming and outgoing roommate connection requests."
          >
            {/* Received */}
            <div className="mb-8">
              <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-400">
                Requests for you ({requests.received.length})
              </h3>
              {requests.received.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                  No one has sent you a request yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.received.map((req) => (
                    <article
                      key={req.id}
                      id={`roommate-request-${req.id}`}
                      className={`rounded-3xl border p-5 ${
                        highlightedRequestId === req.id
                          ? "border-blue-200 bg-blue-50/40"
                          : "border-slate-100 bg-slate-50"
                      }`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-4">
                          <img
                            src={req.avatar}
                            alt={req.name}
                            className="h-14 w-14 rounded-full object-cover"
                          />
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-black text-[#091E42]">{req.name}</h4>
                              <StatusBadge status={req.status} />
                              <span className="text-xs text-slate-400">
                                {formatRelativeTime(req.createdAt)}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-600">
                              {req.message || "No message attached."}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openDirectChat({
                                id: req.userId,
                                name: req.name,
                                avatar: req.avatar,
                              })
                            }
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"
                          >
                            <MessageSquare className="h-4 w-4" />
                            Message
                          </button>
                          {req.status === "pending" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleRequestAction(req.id, "accepted")}
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Accept
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectTarget(req)}
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <XCircle className="h-4 w-4" />
                                Reject
                              </button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* Sent — active (pending / accepted / rejected) */}
            {(() => {
              const activeSent = requests.sent.filter((r) => r.status !== "withdrawn");
              const withdrawnSent = requests.sent.filter((r) => r.status === "withdrawn");
              return (
                <>
                  <div>
                    <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-400">
                      Your sent requests ({activeSent.length})
                    </h3>
                    {activeSent.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                        You haven't sent any active requests yet. Go to Discover to find roommates.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activeSent.map((req) => (
                          <article
                            key={req.id}
                            id={`roommate-request-${req.id}`}
                            className="rounded-3xl border border-slate-100 bg-slate-50 p-5"
                          >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                              <div className="flex items-center gap-4">
                                <img
                                  src={req.avatar}
                                  alt={req.name}
                                  className="h-14 w-14 rounded-full object-cover"
                                />
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="font-black text-[#091E42]">{req.name}</h4>
                                    <StatusBadge status={req.status} />
                                    <span className="text-xs text-slate-400">
                                      {formatRelativeTime(req.createdAt)}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-sm text-slate-600">
                                    {req.message || "No message attached."}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openDirectChat({
                                      id: req.userId,
                                      name: req.name,
                                      avatar: req.avatar,
                                    })
                                  }
                                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                  Message
                                </button>
                                {req.status === "pending" ? (
                                  <button
                                    type="button"
                                    onClick={() => handleRequestAction(req.id, "withdrawn")}
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    <Clock3 className="h-4 w-4" />
                                    Withdraw
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Withdrawn */}
                  {withdrawnSent.length > 0 && (
                    <div>
                      <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-400">
                        Withdrawn by you ({withdrawnSent.length})
                      </h3>
                      <div className="space-y-3">
                        {withdrawnSent.map((req) => (
                          <article
                            key={req.id}
                            className="rounded-3xl border border-slate-200 bg-white p-5 opacity-80"
                          >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                              <div className="flex items-center gap-4">
                                <img
                                  src={req.avatar}
                                  alt={req.name}
                                  className="h-14 w-14 rounded-full object-cover grayscale"
                                />
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="font-black text-[#091E42]">{req.name}</h4>
                                    <StatusBadge status="withdrawn" />
                                    <span className="text-xs text-slate-400">
                                      {formatRelativeTime(req.createdAt)}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-sm text-slate-500">
                                    {req.message || "No message attached."}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSendRequest({
                                      id: req.userId,
                                      name: req.name,
                                      avatar: req.avatar,
                                    })
                                  }
                                  disabled={saving}
                                  className="inline-flex items-center gap-2 rounded-xl border border-[#155BC2] bg-blue-50 px-3 py-2 text-xs font-black text-[#155BC2] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                  Re-request
                                </button>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </Section>
        ) : null}

        {/* ══ PROFILE TAB ═════════════════════════════════════════ */}
        {!loading && activeTab === "profile" ? (
          <Section
            title="My Roommate Profile"
            description="Keep your profile complete to get accurate match scores. Fields here also sync with your student profile."
          >
            {/* Completeness bar */}
            <div className="mb-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-bold text-slate-600">Profile completeness</span>
                <span
                  className={`font-black ${
                    profileCompleteness >= 70
                      ? "text-emerald-600"
                      : profileCompleteness >= 40
                        ? "text-amber-600"
                        : "text-rose-500"
                  }`}
                >
                  {profileCompleteness}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    profileCompleteness >= 70
                      ? "bg-emerald-500"
                      : profileCompleteness >= 40
                        ? "bg-amber-400"
                        : "bg-rose-400"
                  }`}
                  style={{ width: `${profileCompleteness}%` }}
                />
              </div>
            </div>

            {/* Visibility toggle */}
            <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-slate-700">Visible in roommate discovery</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Other students can find and contact you
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={roommateForm.isLookingForRoom}
                onClick={() =>
                  setRoommateForm((c) => ({
                    ...c,
                    isLookingForRoom: !c.isLookingForRoom,
                  }))
                }
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                  roommateForm.isLookingForRoom ? "bg-[#155BC2]" : "bg-slate-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    roommateForm.isLookingForRoom ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Section: My lifestyle */}
            <p className="mb-4 text-sm font-black text-[#091E42]">My lifestyle</p>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-bold text-slate-600">City</span>
                <input
                  value={roommateForm.city}
                  onChange={(e) =>
                    setRoommateForm((c) => ({ ...c, city: e.target.value }))
                  }
                  className={fieldClassName}
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-600">University</span>
                <input
                  value={roommateForm.university}
                  onChange={(e) =>
                    setRoommateForm((c) => ({ ...c, university: e.target.value }))
                  }
                  className={fieldClassName}
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm font-bold text-slate-600">Bio</span>
                <textarea
                  rows={4}
                  value={roommateForm.bio}
                  onChange={(e) =>
                    setRoommateForm((c) => ({ ...c, bio: e.target.value }))
                  }
                  className={fieldClassName}
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-600">Move-in date</span>
                <input
                  type="date"
                  value={roommateForm.moveInDate}
                  onChange={(e) =>
                    setRoommateForm((c) => ({ ...c, moveInDate: e.target.value }))
                  }
                  className={fieldClassName}
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-600">Room type</span>
                <select
                  value={roommateForm.roomTypePreference}
                  onChange={(e) =>
                    setRoommateForm((c) => ({ ...c, roomTypePreference: e.target.value }))
                  }
                  className={fieldClassName}
                >
                  {ROOM_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-600">Budget min (EGP)</span>
                <input
                  type="number"
                  min="0"
                  value={roommateForm.budgetMin}
                  onChange={(e) =>
                    setRoommateForm((c) => ({ ...c, budgetMin: e.target.value }))
                  }
                  className={fieldClassName}
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-600">Budget max (EGP)</span>
                <input
                  type="number"
                  min="0"
                  value={roommateForm.budgetMax}
                  onChange={(e) =>
                    setRoommateForm((c) => ({ ...c, budgetMax: e.target.value }))
                  }
                  className={fieldClassName}
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-600">Sleep schedule</span>
                <select
                  value={roommateForm.sleepingTime}
                  onChange={(e) =>
                    setRoommateForm((c) => ({ ...c, sleepingTime: e.target.value }))
                  }
                  className={fieldClassName}
                >
                  {SLEEP_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-600">Cleanliness</span>
                <select
                  value={roommateForm.cleanliness}
                  onChange={(e) =>
                    setRoommateForm((c) => ({ ...c, cleanliness: e.target.value }))
                  }
                  className={fieldClassName}
                >
                  {CLEANLINESS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-600">Personality</span>
                <select
                  value={roommateForm.personality}
                  onChange={(e) =>
                    setRoommateForm((c) => ({ ...c, personality: e.target.value }))
                  }
                  className={fieldClassName}
                >
                  {PERSONALITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-600">Smoking</span>
                <select
                  value={roommateForm.smoking}
                  onChange={(e) =>
                    setRoommateForm((c) => ({ ...c, smoking: e.target.value }))
                  }
                  className={fieldClassName}
                >
                  {SMOKING_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-600">Guests policy</span>
                <select
                  value={roommateForm.guestsPolicy}
                  onChange={(e) =>
                    setRoommateForm((c) => ({ ...c, guestsPolicy: e.target.value }))
                  }
                  className={fieldClassName}
                >
                  {GUEST_POLICY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Section: Preferences */}
            <p className="mb-4 mt-8 text-sm font-black text-[#091E42]">
              What I want in a roommate
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-bold text-slate-600">Preferred smoking</span>
                <select
                  value={roommateForm.smokingPreference}
                  onChange={(e) =>
                    setRoommateForm((c) => ({ ...c, smokingPreference: e.target.value }))
                  }
                  className={fieldClassName}
                >
                  {SMOKING_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-600">Preferred sleep schedule</span>
                <select
                  value={roommateForm.sleepSchedulePref}
                  onChange={(e) =>
                    setRoommateForm((c) => ({ ...c, sleepSchedulePref: e.target.value }))
                  }
                  className={fieldClassName}
                >
                  {SLEEP_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-600">Preferred cleanliness</span>
                <select
                  value={roommateForm.cleanlinessPref}
                  onChange={(e) =>
                    setRoommateForm((c) => ({ ...c, cleanlinessPref: e.target.value }))
                  }
                  className={fieldClassName}
                >
                  {CLEANLINESS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-600">Preferred personality</span>
                <select
                  value={roommateForm.personalityPref}
                  onChange={(e) =>
                    setRoommateForm((c) => ({ ...c, personalityPref: e.target.value }))
                  }
                  className={fieldClassName}
                >
                  {PERSONALITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Save */}
            {error && activeTab === "profile" ? (
              <p className="mt-4 text-sm font-semibold text-rose-600">{error}</p>
            ) : null}
            <button
              type="button"
              onClick={handleSaveRoommateProfile}
              disabled={saving}
              className={`mt-6 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white transition-colors disabled:cursor-not-allowed disabled:bg-slate-300 ${
                saved ? "bg-emerald-600" : "bg-[#155BC2]"
              }`}
            >
              {saved ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  {saving ? "Saving…" : "Save roommate profile"}
                </>
              )}
            </button>
          </Section>
        ) : null}
      </main>

      {/* ── Send request modal ──────────────────────────────────── */}
      {requestTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-black text-[#091E42]">
              Send request to {requestTarget.name}
            </h3>
            <textarea
              rows={4}
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#155BC2]"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRequestTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleConfirmRequest}
                className="rounded-xl bg-[#155BC2] px-4 py-2 text-sm font-black text-white disabled:bg-slate-300"
              >
                {saving ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Reject confirmation modal ───────────────────────────── */}
      {rejectTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-black text-[#091E42]">Reject request?</h3>
            <p className="mt-2 text-sm text-slate-500">
              Reject the request from{" "}
              <span className="font-bold">{rejectTarget.name}</span>? This cannot
              be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleConfirmReject}
                className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-black text-white disabled:bg-slate-300"
              >
                {saving ? "Rejecting…" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
