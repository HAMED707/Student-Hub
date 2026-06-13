import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, UploadCloud } from "lucide-react";
import Navbar from "../../assets/components/Navbar/Navbar.jsx";
import {
  fetchMyProfile,
  updateMyProfile,
} from "../../api/accounts.js";
import {
  fetchMyRoommateProfile,
  updateMyRoommateProfile,
} from "../../api/roommates.js";
import {
  CLEANLINESS_OPTIONS,
  GENDER_OPTIONS,
  GUEST_POLICY_OPTIONS,
  PERSONALITY_OPTIONS,
  ROOM_TYPE_OPTIONS,
  SLEEP_OPTIONS,
  SMOKING_OPTIONS,
  buildRoommatePayloadFromForm,
  buildStudentAccountForm,
  buildStudentAccountPayload,
} from "../../utils/profile.js";

const fieldClassName =
  "mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#155BC2]";

const Section = ({ title, children }) => (
  <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
    <h2 className="text-lg font-black text-[#091E42]">{title}</h2>
    <div className="mt-5 grid gap-4 md:grid-cols-2">{children}</div>
  </section>
);

export default function EditProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const onboarding = Boolean(location.state?.onboarding);

  const [formState, setFormState] = useState(() => buildStudentAccountForm());
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const profile = await fetchMyProfile();
        const roommateProfile = await fetchMyRoommateProfile().catch(() => null);
        setFormState(buildStudentAccountForm(profile, roommateProfile || {}));
      } catch (loadError) {
        setError(loadError.message || "Unable to load profile form.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const updateField = (key, value) => {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await Promise.all([
        updateMyProfile(buildStudentAccountPayload(formState)),
        updateMyRoommateProfile(buildRoommatePayloadFromForm(formState)),
      ]);

      if (avatarFile) {
        const body = new FormData();
        body.append("profile_picture", avatarFile);
        await updateMyProfile(body);
      }

      navigate("/profile");
    } catch (saveError) {
      setError(saveError.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] font-sans">
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-500">
          Loading profile form...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#091E42]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to profile
          </button>
          <button
            type="submit"
            form="student-profile-form"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#155BC2] px-5 py-3 text-sm font-black text-white shadow-sm disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : onboarding ? "Finish setup" : "Save changes"}
          </button>
        </div>

        {onboarding ? (
          <div className="mt-6 rounded-3xl border border-blue-100 bg-white p-5 text-sm text-slate-600 shadow-sm">
            Finish your student setup here. The same form updates your account profile and your roommate listing preferences together.
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-3xl border border-rose-100 bg-white p-5 text-sm font-semibold text-rose-600 shadow-sm">
            {error}
          </div>
        ) : null}

        <form id="student-profile-form" onSubmit={handleSave} className="mt-6 space-y-6">
          <Section title="Basic Information">
            <label className="block">
              <span className="text-sm font-bold text-slate-600">First name</span>
              <input
                value={formState.firstName}
                onChange={(event) => updateField("firstName", event.target.value)}
                className={fieldClassName}
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-600">Last name</span>
              <input
                value={formState.lastName}
                onChange={(event) => updateField("lastName", event.target.value)}
                className={fieldClassName}
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-600">Email</span>
              <input
                type="email"
                value={formState.email}
                onChange={(event) => updateField("email", event.target.value)}
                className={fieldClassName}
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-600">Phone</span>
              <input
                value={formState.phoneNumber}
                onChange={(event) => updateField("phoneNumber", event.target.value)}
                className={fieldClassName}
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-600">Gender</span>
              <select
                value={formState.gender}
                onChange={(event) => updateField("gender", event.target.value)}
                className={fieldClassName}
              >
                {GENDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-600">Date of birth</span>
              <input
                type="date"
                value={formState.dateOfBirth}
                onChange={(event) => updateField("dateOfBirth", event.target.value)}
                className={fieldClassName}
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-600">City</span>
              <input
                value={formState.city}
                onChange={(event) => updateField("city", event.target.value)}
                className={fieldClassName}
              />
            </label>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-600">Avatar</p>
              <div className="mt-4 flex items-center gap-4">
                <img
                  src={formState.avatarUrl}
                  alt="Profile"
                  className="h-16 w-16 rounded-full object-cover"
                />
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#155BC2] shadow-sm">
                  <UploadCloud className="h-4 w-4" />
                  Change avatar
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      setAvatarFile(file);
                      if (file) {
                        updateField("avatarUrl", URL.createObjectURL(file));
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </Section>

          <Section title="Student Details">
            <label className="block">
              <span className="text-sm font-bold text-slate-600">University</span>
              <input
                value={formState.university}
                onChange={(event) => updateField("university", event.target.value)}
                className={fieldClassName}
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-600">Faculty</span>
              <input
                value={formState.faculty}
                onChange={(event) => updateField("faculty", event.target.value)}
                className={fieldClassName}
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-600">Year of study</span>
              <input
                value={formState.yearOfStudy}
                onChange={(event) => updateField("yearOfStudy", event.target.value)}
                className={fieldClassName}
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-600">Languages</span>
              <input
                value={formState.languages}
                onChange={(event) => updateField("languages", event.target.value)}
                className={fieldClassName}
                placeholder="English, Arabic"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-bold text-slate-600">Bio</span>
              <textarea
                rows={5}
                value={formState.bio}
                onChange={(event) => updateField("bio", event.target.value)}
                className={fieldClassName}
              />
            </label>
          </Section>

          <Section title="Roommate Preferences">
            <label className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 md:col-span-2">
              <span className="text-sm font-bold text-slate-600">
                Looking for a roommate
              </span>
              <input
                type="checkbox"
                checked={Boolean(formState.isLookingForRoom)}
                onChange={(event) => updateField("isLookingForRoom", event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#155BC2]"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-600">Move-in date</span>
              <input
                type="date"
                value={formState.moveInDate}
                onChange={(event) => updateField("moveInDate", event.target.value)}
                className={fieldClassName}
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-600">Budget min</span>
              <input
                type="number"
                min="0"
                value={formState.budgetMin}
                onChange={(event) => updateField("budgetMin", event.target.value)}
                className={fieldClassName}
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-600">Budget max</span>
              <input
                type="number"
                min="0"
                value={formState.budgetMax}
                onChange={(event) => updateField("budgetMax", event.target.value)}
                className={fieldClassName}
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-600">Sleep schedule</span>
              <select
                value={formState.sleepingTime}
                onChange={(event) => updateField("sleepingTime", event.target.value)}
                className={fieldClassName}
              >
                {SLEEP_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-600">Cleanliness</span>
              <select
                value={formState.cleanliness}
                onChange={(event) => updateField("cleanliness", event.target.value)}
                className={fieldClassName}
              >
                {CLEANLINESS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-600">Personality</span>
              <select
                value={formState.personality}
                onChange={(event) => updateField("personality", event.target.value)}
                className={fieldClassName}
              >
                {PERSONALITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-600">Smoking</span>
              <select
                value={formState.smoking}
                onChange={(event) => updateField("smoking", event.target.value)}
                className={fieldClassName}
              >
                {SMOKING_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-600">Guests policy</span>
              <select
                value={formState.guestsPolicy}
                onChange={(event) => updateField("guestsPolicy", event.target.value)}
                className={fieldClassName}
              >
                {GUEST_POLICY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-600">Room type</span>
              <select
                value={formState.roomTypePreference}
                onChange={(event) => updateField("roomTypePreference", event.target.value)}
                className={fieldClassName}
              >
                {ROOM_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </Section>
        </form>
      </main>
    </div>
  );
}
