import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  Settings,
  ShieldCheck,
  Star,
  Wallet,
} from "lucide-react";
import { fetchMyProfile } from "../../api/accounts.js";
import { fetchLandlordProperties } from "../../api/properties.js";
import { fetchUserReviews } from "../../api/roommates.js";
import { withApiUrl } from "../../api/client.js";

const cx = (...classes) => classes.filter(Boolean).join(" ");

const formatMoney = (value) =>
  `EGP ${Number(value || 0).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })}`;

const formatDate = (value) => {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString();
};

const buildAvatar = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "Owner",
  )}&background=0A2647&color=fff&bold=true`;

const StatCard = ({ icon, label, value, accent = "blue" }) => (
  <div
    className={cx(
      "rounded-2xl border bg-white p-5 shadow-sm",
      accent === "blue" && "border-blue-100",
      accent === "green" && "border-emerald-100",
      accent === "amber" && "border-amber-100",
      accent === "slate" && "border-slate-200",
    )}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
          {label}
        </p>
        <p className="mt-2 text-2xl font-black text-[#091E42]">{value}</p>
      </div>
      <div
        className={cx(
          "grid h-12 w-12 place-items-center rounded-2xl",
          accent === "blue" && "bg-blue-50 text-blue-600",
          accent === "green" && "bg-emerald-50 text-emerald-600",
          accent === "amber" && "bg-amber-50 text-amber-600",
          accent === "slate" && "bg-slate-50 text-slate-600",
        )}
      >
        {icon}
      </div>
    </div>
  </div>
);

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
    {icon}
    <div className="min-w-0">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="truncate text-sm font-semibold text-[#091E42]">{value}</p>
    </div>
  </div>
);

export default function OwnerProfile() {
  const navigate = useNavigate();
  const [owner, setOwner] = useState(null);
  const [properties, setProperties] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOwnerProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const profile = await fetchMyProfile();
        const [propertyRows, reviewRows] = await Promise.allSettled([
          fetchLandlordProperties(),
          fetchUserReviews(profile.id),
        ]);

        const fullName =
          [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
          profile?.username ||
          "Owner";

        setOwner({
          id: profile.id,
          name: fullName,
          email: profile.email || "No email",
          phone: profile.phone_number || "No phone added",
          city: profile.city || "No city added",
          avatar: profile.profile_picture
            ? withApiUrl(profile.profile_picture)
            : buildAvatar(fullName),
          company:
            profile.landlord_profile?.company_name || "Independent landlord",
          isVerified: Boolean(profile.is_verified),
          totalIncome: profile.landlord_profile?.total_income || 0,
          availableBalance: profile.landlord_profile?.available_balance || 0,
        });

        setProperties(
          propertyRows.status === "fulfilled" ? propertyRows.value || [] : [],
        );
        setReviews(reviewRows.status === "fulfilled" ? reviewRows.value || [] : []);
      } catch (loadError) {
        setError(loadError.message || "Unable to load owner profile.");
      } finally {
        setLoading(false);
      }
    };

    loadOwnerProfile();
  }, []);

  const stats = useMemo(() => {
    const availableCount = properties.filter(
      (property) => property.status === "available",
    ).length;
    const occupiedCount = properties.filter(
      (property) => property.status !== "available",
    ).length;
    const rating =
      reviews.length > 0
        ? (
            reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
            reviews.length
          ).toFixed(1)
        : "0.0";

    return {
      totalProperties: properties.length,
      availableCount,
      occupiedCount,
      rating,
    };
  }, [properties, reviews]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F6FB] px-6 py-8 text-center text-sm font-bold text-slate-500">
        Loading owner profile...
      </div>
    );
  }

  if (error || !owner) {
    return (
      <div className="min-h-screen bg-[#F3F6FB] px-6 py-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-rose-100 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-black text-[#091E42]">Owner profile unavailable</h1>
          <p className="mt-3 text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F6FB] font-sans text-[#091E42]">
      <main className="mx-auto max-w-7xl px-6 py-8">
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <img
                src={owner.avatar}
                alt={owner.name}
                className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-lg"
              />

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-black">{owner.name}</h1>
                  {owner.isVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                      <ShieldCheck className="h-4 w-4" />
                      Verified
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm font-semibold text-blue-600">
                  {owner.company}
                </p>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  This profile now reads from the live landlord account and listing data in the backend instead of static owner mock content.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/owner/settings")}
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <button
                onClick={() => navigate("/owner/properties")}
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#155BC2] px-4 text-sm font-black text-white transition hover:bg-[#0f4ca3]"
              >
                <Building2 className="h-4 w-4" />
                Manage Properties
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<Building2 className="h-5 w-5" />}
            label="Properties"
            value={stats.totalProperties}
            accent="blue"
          />
          <StatCard
            icon={<Wallet className="h-5 w-5" />}
            label="Available Balance"
            value={formatMoney(owner.availableBalance)}
            accent="green"
          />
          <StatCard
            icon={<CreditCard className="h-5 w-5" />}
            label="Total Income"
            value={formatMoney(owner.totalIncome)}
            accent="amber"
          />
          <StatCard
            icon={<Star className="h-5 w-5" />}
            label="Rating"
            value={`${stats.rating} / 5`}
            accent="slate"
          />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black">Contact & Identity</h2>
              <div className="mt-4 space-y-3">
                <InfoRow icon={<Mail className="h-4 w-4 text-blue-600" />} label="Email" value={owner.email} />
                <InfoRow icon={<Phone className="h-4 w-4 text-blue-600" />} label="Phone" value={owner.phone} />
                <InfoRow icon={<MapPin className="h-4 w-4 text-blue-600" />} label="City" value={owner.city} />
                <InfoRow icon={<Building2 className="h-4 w-4 text-blue-600" />} label="Company" value={owner.company} />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black">Listing Snapshot</h2>
              <div className="mt-4 space-y-3">
                <InfoRow
                  icon={<Building2 className="h-4 w-4 text-blue-600" />}
                  label="Available Listings"
                  value={stats.availableCount}
                />
                <InfoRow
                  icon={<CreditCard className="h-4 w-4 text-blue-600" />}
                  label="Occupied / Reserved"
                  value={stats.occupiedCount}
                />
                <InfoRow
                  icon={<Star className="h-4 w-4 text-blue-600" />}
                  label="Reviews Received"
                  value={reviews.length}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-black">Your Listings</h2>
                <button
                  onClick={() => navigate("/owner/properties")}
                  className="text-sm font-black text-blue-600 transition hover:text-blue-700"
                >
                  View all
                </button>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {properties.length > 0 ? (
                  properties.slice(0, 6).map((property) => (
                    <article
                      key={property.id}
                      className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50"
                    >
                      <div className="h-40 bg-slate-200">
                        {property.cover_image ? (
                          <img
                            src={property.cover_image}
                            alt={property.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="grid h-full place-items-center text-slate-400">
                            <Building2 className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-black text-[#091E42]">
                              {property.title}
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                              {property.city}, {property.district}
                            </p>
                          </div>
                          <span
                            className={cx(
                              "rounded-full px-2.5 py-1 text-[10px] font-black uppercase",
                              property.status === "available"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700",
                            )}
                          >
                            {property.status}
                          </span>
                        </div>
                        <p className="mt-3 text-lg font-black text-blue-600">
                          {formatMoney(property.price)} / month
                        </p>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-400 md:col-span-2">
                    No landlord listings found yet.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black">Recent Reviews</h2>
              <div className="mt-4 space-y-3">
                {reviews.length > 0 ? (
                  reviews.slice(0, 4).map((review) => (
                    <div
                      key={review.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-[#091E42]">
                            {review.reviewer_username || "Anonymous"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {formatDate(review.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500">
                          {[...Array(5)].map((_, index) => (
                            <Star
                              key={index}
                              className={cx(
                                "h-4 w-4",
                                index < Number(review.rating || 0) && "fill-amber-500",
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {review.comment || "No written review provided."}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-400">
                    No reviews yet for this landlord account.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
