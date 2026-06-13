import { withApiUrl } from "../api/client.js";
import { mapGenderToBackend } from "./auth.js";

export const DEFAULT_PROFILE_AVATAR =
  "https://ui-avatars.com/api/?name=Student+Hub&background=0A2647&color=fff";

export const GENDER_OPTIONS = [
  { value: "", label: "Prefer not to say" },
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
];

export const ROOM_TYPE_OPTIONS = [
  { value: "", label: "Not selected" },
  { value: "single", label: "Single room" },
  { value: "shared", label: "Shared room" },
  { value: "both", label: "Either" },
];

export const SLEEP_OPTIONS = [
  { value: "", label: "Not selected" },
  { value: "early", label: "Early" },
  { value: "normal", label: "Normal" },
  { value: "late", label: "Late" },
];

export const CLEANLINESS_OPTIONS = [
  { value: "", label: "Not selected" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const PERSONALITY_OPTIONS = [
  { value: "", label: "Not selected" },
  { value: "quiet", label: "Quiet" },
  { value: "moderate", label: "Moderate" },
  { value: "social", label: "Social" },
];

export const SMOKING_OPTIONS = [
  { value: "", label: "Not selected" },
  { value: "non_smoker", label: "Non-smoker" },
  { value: "smoker", label: "Smoker" },
];

export const GUEST_POLICY_OPTIONS = [
  { value: "", label: "Not selected" },
  { value: "never", label: "Never" },
  { value: "sometimes", label: "Sometimes" },
  { value: "often", label: "Often" },
];

const parseOptionalInteger = (value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const pickText = (...values) => values.find((value) => value !== null && value !== undefined && value !== "") || "";

export const formatChoiceLabel = (value, fallback = "Not set") => {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const formatBudgetRange = (minValue, maxValue) => {
  const min = Number(minValue || 0);
  const max = Number(maxValue || 0);

  if (min && max) return `EGP ${min} - ${max}`;
  if (min) return `From EGP ${min}`;
  if (max) return `Up to EGP ${max}`;
  return "Not set";
};

export const getDisplayName = (user = {}) =>
  [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
  user.full_name ||
  user.name ||
  user.username ||
  "User";

export const getProfileAvatar = (user = {}) =>
  user.profile_picture
    ? withApiUrl(user.profile_picture)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
        getDisplayName(user),
      )}&background=0A2647&color=fff`;

export const buildStudentAccountForm = (profile = {}, roommateProfile = {}) => {
  const student = profile.student_profile || {};
  const roommate = roommateProfile || {};

  return {
    firstName: profile.first_name || "",
    lastName: profile.last_name || "",
    email: profile.email || "",
    phoneNumber: profile.phone_number || "",
    gender: profile.gender || "",
    dateOfBirth: profile.date_of_birth || "",
    city: pickText(profile.city, roommate.city),
    avatarUrl: getProfileAvatar(profile),
    bio: pickText(student.bio, roommate.bio),
    university: pickText(student.university, roommate.university),
    faculty: student.faculty || "",
    yearOfStudy: student.year_of_study || "",
    languages: Array.isArray(student.languages) ? student.languages.join(", ") : "",
    isLookingForRoom: Boolean(student.is_looking_for_room || roommate.is_active),
    moveInDate: roommate.move_in_date || "",
    budgetMin: pickText(roommate.budget_min, student.budget_min),
    budgetMax: pickText(roommate.budget_max, student.budget_max),
    sleepingTime: pickText(roommate.sleeping_time, student.sleeping_time),
    studyEnvironment: student.study_environment || "",
    musicPreference: student.music_preference || "",
    guestsPolicy: pickText(roommate.guests_policy, student.guests_policy),
    personality: pickText(roommate.personality, student.personality),
    cleanliness: pickText(roommate.cleanliness, student.cleanliness),
    smoking: pickText(roommate.smoking, student.smoking),
    roomTypePreference: pickText(roommate.room_type_preference, student.room_type_preference),
    preferredRoomType: pickText(student.preferred_room_type, roommate.room_type_preference),
    smokingPreference: pickText(roommate.smoking_preference, student.smoking_preference),
    sleepSchedulePref: pickText(roommate.sleep_schedule_pref, student.sleep_schedule_pref),
    cleanlinessPref: pickText(roommate.cleanliness_pref, student.cleanliness_pref),
    personalityPref: pickText(roommate.personality_pref, student.personality_pref),
  };
};

export const buildStudentAccountPayload = (formState) => {
  const studentProfile = {
    bio: formState.bio?.trim() || "",
    university: formState.university?.trim() || "",
    faculty: formState.faculty?.trim() || "",
    year_of_study: formState.yearOfStudy?.trim() || "",
    languages: formState.languages
      ? formState.languages
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      : [],
    is_looking_for_room: Boolean(formState.isLookingForRoom),
    sleeping_time: formState.sleepingTime || null,
    study_environment: formState.studyEnvironment?.trim() || "",
    music_preference: formState.musicPreference?.trim() || "",
    guests_policy: formState.guestsPolicy || null,
    personality: formState.personality || null,
    cleanliness: formState.cleanliness || null,
    smoking: formState.smoking || null,
    room_type_preference: formState.roomTypePreference || null,
    preferred_room_type: formState.preferredRoomType || null,
    smoking_preference: formState.smokingPreference || null,
    sleep_schedule_pref: formState.sleepSchedulePref || null,
    cleanliness_pref: formState.cleanlinessPref || null,
    personality_pref: formState.personalityPref || null,
  };

  const budgetMin = parseOptionalInteger(formState.budgetMin);
  const budgetMax = parseOptionalInteger(formState.budgetMax);

  if (budgetMin !== undefined) studentProfile.budget_min = budgetMin;
  if (budgetMax !== undefined) studentProfile.budget_max = budgetMax;

  return {
    email: formState.email?.trim() || "",
    first_name: formState.firstName?.trim() || "",
    last_name: formState.lastName?.trim() || "",
    phone_number: formState.phoneNumber?.trim() || "",
    gender: mapGenderToBackend(formState.gender) || null,
    date_of_birth: formState.dateOfBirth || null,
    city: formState.city?.trim() || "",
    student_profile: studentProfile,
  };
};

export const buildRoommatePayloadFromForm = (formState) => {
  const payload = {
    is_active: Boolean(formState.isLookingForRoom),
    bio: formState.bio?.trim() || "",
    university: formState.university?.trim() || "",
    city: formState.city?.trim() || "",
    move_in_date: formState.moveInDate || null,
    sleeping_time: formState.sleepingTime || null,
    cleanliness: formState.cleanliness || null,
    personality: formState.personality || null,
    smoking: formState.smoking || null,
    guests_policy: formState.guestsPolicy || null,
    room_type_preference: formState.roomTypePreference || null,
    smoking_preference: formState.smokingPreference || null,
    sleep_schedule_pref: formState.sleepSchedulePref || null,
    cleanliness_pref: formState.cleanlinessPref || null,
    personality_pref: formState.personalityPref || null,
  };

  const budgetMin = parseOptionalInteger(formState.budgetMin);
  const budgetMax = parseOptionalInteger(formState.budgetMax);

  if (budgetMin !== undefined) payload.budget_min = budgetMin;
  if (budgetMax !== undefined) payload.budget_max = budgetMax;

  return payload;
};
