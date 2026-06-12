export const AUTH_STORAGE_KEYS = {
  token: "token",
  refresh: "refresh",
  user: "user",
};

export const AUTH_CHANGE_EVENT = "studenthub:auth-changed";

const readStorage = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key, value) => {
  try {
    if (value === null || value === undefined || value === "") {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, value);
  } catch {
    // ignore storage issues
  }
};

const emitAuthChange = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
};

const buildDisplayName = (user) => {
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
  return fullName || user?.name || user?.username || "";
};

export const normalizeStoredUser = (user) => {
  if (!user || typeof user !== "object") return null;

  const name = buildDisplayName(user);

  return {
    ...user,
    name: user.name || name,
    fullName: user.fullName || name,
    avatarUrl: user.avatarUrl || user.profile_picture || "",
  };
};

export const getStoredToken = () => readStorage(AUTH_STORAGE_KEYS.token);

export const getStoredRefreshToken = () => readStorage(AUTH_STORAGE_KEYS.refresh);

export const getStoredUser = () => {
  const raw = readStorage(AUTH_STORAGE_KEYS.user);
  if (!raw) return null;

  try {
    return normalizeStoredUser(JSON.parse(raw));
  } catch {
    return null;
  }
};

export const getAuthSnapshot = () => ({
  token: getStoredToken(),
  refresh: getStoredRefreshToken(),
  user: getStoredUser(),
});

export const storeSession = ({ access, refresh, user }) => {
  if (access) writeStorage(AUTH_STORAGE_KEYS.token, access);
  if (refresh) writeStorage(AUTH_STORAGE_KEYS.refresh, refresh);
  if (user) writeStorage(AUTH_STORAGE_KEYS.user, JSON.stringify(normalizeStoredUser(user)));
  emitAuthChange();
};

export const updateStoredUser = (user) => {
  if (!user) return;
  writeStorage(AUTH_STORAGE_KEYS.user, JSON.stringify(normalizeStoredUser(user)));
  emitAuthChange();
};

export const clearSession = () => {
  writeStorage(AUTH_STORAGE_KEYS.token, null);
  writeStorage(AUTH_STORAGE_KEYS.refresh, null);
  writeStorage(AUTH_STORAGE_KEYS.user, null);
  emitAuthChange();
};

export const getDefaultRouteForRole = (role) =>
  role === "landlord" ? "/owner/overview" : "/home";

export const mapGenderToBackend = (value) => {
  if (!value) return value;
  const normalized = String(value).trim().toLowerCase();

  if (normalized === "male" || normalized === "m") return "M";
  if (normalized === "female" || normalized === "f") return "F";

  return value;
};

const firstValue = (value) => {
  if (Array.isArray(value)) return value[0];
  if (value && typeof value === "object") {
    const nested = Object.values(value).flat().find(Boolean);
    return typeof nested === "string" ? nested : null;
  }
  return typeof value === "string" ? value : null;
};

export const getApiErrorMessage = (error, fallback = "Request failed") => {
  const payload = error?.data;

  if (typeof payload === "string" && payload.trim()) return payload;
  if (payload?.error) return payload.error;
  if (payload?.detail) return payload.detail;
  if (payload?.non_field_errors?.[0]) return payload.non_field_errors[0];

  if (payload && typeof payload === "object") {
    const first = Object.values(payload).map(firstValue).find(Boolean);
    if (first) return first;
  }

  return error?.message || fallback;
};
