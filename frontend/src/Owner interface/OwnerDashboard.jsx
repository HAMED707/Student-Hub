import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Home,
  Image as ImageIcon,
  LogOut,
  MoreVertical,
  Plus,
  QrCode,
  Search,
  Send,
  Smile,
  Star,
  Upload,
  X,
  Zap,
} from "lucide-react";

import logo from "../assets/brand/icons/logo.svg";
import { fetchMyProfile, updateMyProfile } from "../api/accounts.js";
import { apiRequest, withApiUrl } from "../api/client.js";
import { fetchKycStatus, createKycInquiry, syncKycStatus } from "../api/kyc.js";
import {
  fetchConversationMessages,
  fetchConversations,
  markConversationRead,
  sendConversationMessage,
} from "../api/messaging.js";
import { getConnectStatus, startOnboarding, getLandlordPayouts } from "../api/payments.js";
import { clearSession, getApiErrorMessage, getStoredUser } from "../utils/auth.js";
import { mapConversation, mapMessage } from "../utils/messaging.js";
import { CITIES, TRANSPORT_OPTIONS, UNIVERSITIES_BY_CITY } from "../utils/propertyConstants.js";
import { buildPropertyFormState, buildPropertyPayload } from "../utils/propertyForm.js";

const NAV_ITEMS = ["Units", "Messages", "Payments"];

const PROPERTIES = [
  { id: 1, name: "Room - Elsalam", type: "Room" },
  { id: 2, name: "Apartment - Elsalam", type: "Apartment" },
  { id: 3, name: "Studio - Nasr City", type: "Studio" },
  { id: 4, name: "Shared Room - Zamalek", type: "Room" },
  { id: 5, name: "Apartment - Maadi", type: "Apartment" },
  { id: 6, name: "Room - Heliopolis", type: "Room" },
  { id: 7, name: "Studio - 6th October", type: "Studio" },
];

const TRANSACTIONS = [
  { property: "Luxury Apartment - Zamalek", tenant: "Lina G.", amount: "3500 EGP", date: "2025-10-05", status: "Paid", method: "Credit Card" },
  { property: "Shared Room - Nasr City", tenant: "Youssef A.", amount: "2000 EGP", date: "2025-10-09", status: "Pending", method: "Credit Card" },
  { property: "Studio Near Cairo University", tenant: "Mona K.", amount: "1500 EGP", date: "2025-10-27", status: "Refunded", method: "Credit Card" },
  { property: "Room - Elsalam", tenant: "Sara H.", amount: "1200 EGP", date: "2025-11-01", status: "Paid", method: "Bank Transfer" },
  { property: "Apartment - Maadi", tenant: "Ahmed N.", amount: "4200 EGP", date: "2025-11-03", status: "Paid", method: "Instapay" },
  { property: "Studio - Nasr City", tenant: "Nadia F.", amount: "2800 EGP", date: "2025-11-10", status: "Pending", method: "Credit Card" },
  { property: "Shared Room - Zamalek", tenant: "Omar T.", amount: "1800 EGP", date: "2025-11-15", status: "Paid", method: "Instapay" },
  { property: "Room - Heliopolis", tenant: "Rana M.", amount: "1600 EGP", date: "2025-11-20", status: "Refunded", method: "Bank Transfer" },
];

const ALERTS = [
  { icon: <Zap size={14} className="text-orange-500" />, text: 'New booking request for "Shared Room - Nasr City"' },
  { icon: <AlertTriangle size={14} className="text-yellow-500" />, text: "Reminder: Update your listing photos" },
  { icon: <CheckCircle2 size={14} className="text-green-500" />, text: "Payment completed: EGP 3,500" },
  { icon: <Star size={14} className="text-yellow-400" />, text: "Your property rating increased to 4.8/5" },
  { icon: <Zap size={14} className="text-orange-500" />, text: 'New booking request for "Studio - 6th October"' },
  { icon: <CheckCircle2 size={14} className="text-green-500" />, text: "Payment completed: EGP 4,200 from Ahmed N." },
  { icon: <AlertTriangle size={14} className="text-yellow-500" />, text: "Lease expiring soon: Room - Heliopolis (Dec 31)" },
  { icon: <Star size={14} className="text-yellow-400" />, text: 'New 5-star review on "Apartment - Maadi"' },
  { icon: <Zap size={14} className="text-orange-500" />, text: 'Cancellation request for "Shared Room - Zamalek"' },
];

const cardShadow = { boxShadow: "0 2px 12px rgba(27,48,112,0.08)" };
const navShadow = { boxShadow: "0 1px 4px rgba(27,48,112,0.08)" };
const greenButton = { backgroundColor: "#5CAA28" };
const greenButtonHover = "#4a9020";

const getOwnerDisplayName = (profile = {}) =>
  [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
  profile.fullName ||
  profile.name ||
  profile.username ||
  "Owner";

const getOwnerFirstName = (profile = {}) =>
  profile.first_name ||
  getOwnerDisplayName(profile).split(/\s+/).filter(Boolean)[0] ||
  "Owner";

const getOwnerInitials = (profile = {}) =>
  getOwnerDisplayName(profile)
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "OW";

const getOwnerAvatarUrl = (profile = {}) => {
  const avatar = profile.profile_picture || profile.avatarUrl;
  return avatar ? withApiUrl(avatar) : "";
};

const formatUnitType = (value) =>
  value
    ? String(value)
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : "Property";

function StatusBadge({ status }) {
  const cls =
    status === "Paid" ? "bg-green-100 text-green-700" :
    status === "Pending" ? "bg-yellow-100 text-yellow-700" :
    "bg-red-100 text-red-700";

  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status}</span>;
}

function FloatingWindow({ title, subtitle, onClose, children, width = "w-80", height }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative mx-auto max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-2xl ${width} ${height ?? ""} flex flex-col overflow-hidden border border-blue-100`}
        style={{ maxHeight: "90vh" }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
          <div>
            <p className="font-semibold text-sm text-gray-800">{title}</p>
            {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="More options">
              <MoreVertical size={15} />
            </button>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors" aria-label="Close">
              <X size={15} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function ProfileWindow({ profile, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    firstName: profile?.first_name || "",
    lastName: profile?.last_name || "",
    email: profile?.email || "",
    phone: profile?.phone_number || "",
    city: profile?.city || "",
    companyName: profile?.landlord_profile?.company_name || "",
    nationalId: profile?.landlord_profile?.national_id || "",
  }));
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const previewAvatar = useMemo(
    () => (avatarFile ? URL.createObjectURL(avatarFile) : getOwnerAvatarUrl(profile)),
    [avatarFile, profile],
  );
  const displayProfile = {
    ...profile,
    first_name: form.firstName,
    last_name: form.lastName,
    email: form.email,
  };

  useEffect(() => {
    setForm({
      firstName: profile?.first_name || "",
      lastName: profile?.last_name || "",
      email: profile?.email || "",
      phone: profile?.phone_number || "",
      city: profile?.city || "",
      companyName: profile?.landlord_profile?.company_name || "",
      nationalId: profile?.landlord_profile?.national_id || "",
    });
  }, [profile]);

  useEffect(() => {
    if (!avatarFile) return undefined;
    const objectUrl = previewAvatar;
    return () => URL.revokeObjectURL(objectUrl);
  }, [avatarFile, previewAvatar]);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      let updated = await updateMyProfile({
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim(),
        phone_number: form.phone.trim(),
        city: form.city.trim(),
        landlord_profile: {
          company_name: form.companyName.trim(),
          national_id: form.nationalId.trim(),
        },
      });

      if (avatarFile) {
        const body = new FormData();
        body.append("profile_picture", avatarFile);
        updated = await updateMyProfile(body);
      }

      onSaved(updated);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 700);
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, "Failed to update profile."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <FloatingWindow title="My Profile" subtitle="Owner Account" onClose={onClose} width="w-[420px]">
      <form onSubmit={save} className="p-4 space-y-3">
        <div className="flex flex-col items-center gap-2 pb-2">
          {previewAvatar ? (
            <img src={previewAvatar} alt={getOwnerDisplayName(displayProfile)} className="w-16 h-16 rounded-full object-cover border border-blue-100" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
              {getOwnerInitials(displayProfile)}
            </div>
          )}
          <p className="text-xs text-gray-400">Owner Account</p>
          <label className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
            Change photo
            <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} className="hidden" />
          </label>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">First Name</label>
            <input value={form.firstName} onChange={(e) => updateField("firstName", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
            <input value={form.lastName} onChange={(e) => updateField("lastName", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
          <input value={form.email} onChange={(e) => updateField("email", e.target.value)} type="email" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
          <input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
          <select value={form.city} onChange={(e) => updateField("city", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
            <option value="">Not set</option>
            {CITIES.map((cityName) => (
              <option key={cityName} value={cityName}>{cityName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Company Name</label>
          <input value={form.companyName} onChange={(e) => updateField("companyName", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">National ID</label>
          <input value={form.nationalId} onChange={(e) => updateField("nationalId", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
        </div>
        {error && <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-60 ${saved ? "bg-green-500 text-white" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
          </button>
        </div>
      </form>
    </FloatingWindow>
  );
}

function StatCard({ label, value, valueColor = "text-gray-800" }) {
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
      <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
      <p className={`text-xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}

function ChatWindow({ conversation, currentUserId, onClose, onMessageSent }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    let isCancelled = false;

    async function loadMessages() {
      setLoading(true);
      setError("");
      try {
        const data = await fetchConversationMessages(conversation.id);
        if (isCancelled) return;
        setMessages(Array.isArray(data) ? data.map((message) => mapMessage(message, currentUserId)) : []);
        await markConversationRead(conversation.id);
        onMessageSent?.();
      } catch (loadError) {
        if (!isCancelled) setError(getApiErrorMessage(loadError, "Failed to load messages."));
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadMessages();
    return () => {
      isCancelled = true;
    };
  }, [conversation.id, currentUserId, onMessageSent]);

  async function send() {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setError("");
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      text: trimmed,
      from: "me",
      time: "Just now",
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setInput("");

    try {
      const created = await sendConversationMessage(conversation.id, trimmed);
      const mapped = mapMessage(created, currentUserId);
      setMessages((prev) => prev.map((message) => (message.id === optimisticMessage.id ? mapped : message)));
      onMessageSent?.();
    } catch (sendError) {
      setMessages((prev) => prev.filter((message) => message.id !== optimisticMessage.id));
      setError(getApiErrorMessage(sendError, "Failed to send message."));
      setInput(trimmed);
    } finally {
      setSending(false);
    }
  }

  return (
    <FloatingWindow title={conversation.name} subtitle={conversation.role || "Student"} onClose={onClose} width="w-80" height="h-[420px]">
      <div className="flex flex-col h-full">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {loading ? (
            <div className="flex h-full items-center justify-center text-xs text-gray-400">Loading…</div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-gray-400">No messages yet.</div>
          ) : messages.map((msg) => (
            <div key={msg.id} className={`flex items-end ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
              {msg.from === "them" && (
                <img src={conversation.avatar} alt={conversation.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
              )}
              <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${msg.from === "me" ? "bg-blue-600 text-white ml-2" : "bg-gray-100 text-gray-800 ml-2"}`}>
                <p>{msg.text}</p>
                {msg.time && <p className={`mt-1 text-[10px] ${msg.from === "me" ? "text-blue-100" : "text-gray-400"}`}>{msg.time}</p>}
              </div>
            </div>
          ))}
        </div>
        {error && <p className="border-t border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</p>}
        <div className="border-t border-gray-100 px-3 py-2 flex items-center gap-2">
          <button type="button" className="text-gray-400 hover:text-blue-500 transition-colors" aria-label="Attach image"><ImageIcon size={16} /></button>
          <button type="button" className="text-gray-400 hover:text-blue-500 transition-colors text-xs font-bold border border-gray-300 rounded px-1">GIF</button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Start a new message"
            className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 outline-none focus:border-blue-400 focus:bg-white transition-colors"
          />
          <button type="button" className="text-gray-400 hover:text-blue-500 transition-colors" aria-label="Emoji"><Smile size={16} /></button>
          <button type="button" onClick={send} disabled={!input.trim() || sending} className="text-blue-600 hover:text-blue-700 transition-colors disabled:text-gray-300" aria-label="Send"><Send size={16} /></button>
        </div>
      </div>
    </FloatingWindow>
  );
}

const STEP_LABELS = ["What are you listing?", "Where is it?", "Property details", "Availability & photos"];
const AMENITY_FIELDS = [
  { key: "hasInternet",    label: "Internet" },
  { key: "hasAc",          label: "AC" },
  { key: "hasWater",       label: "Water" },
  { key: "hasElectricity", label: "Electricity" },
  { key: "hasGas",         label: "Gas" },
];

function ToggleChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
        active
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
      }`}
    >
      {children}
    </button>
  );
}

function NumberStepper({ label, value, onChange, min = 0 }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-sm font-bold"
        >−</button>
        <span className="text-sm font-semibold w-5 text-center">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-sm font-bold"
        >+</button>
      </div>
    </div>
  );
}

function PropertyWizard({ title, initialData, onSubmit, onClose, submitLabel = "Save", showPhotos = true }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialData);
  const [universities, setUniversities] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const firstCityLoad = useRef(true);

  const set = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (!formData.city) return;
    const fallback = (UNIVERSITIES_BY_CITY[formData.city] || []).map((name, i) => ({ id: i + 1, name }));
    setUniversities(fallback);

    if (!firstCityLoad.current) {
      setFormData((prev) => ({ ...prev, nearbyUniversities: [] }));
    }
    firstCityLoad.current = false;

    apiRequest(`/api/properties/universities/?city=${encodeURIComponent(formData.city)}`)
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data) && data.length > 0) setUniversities(data); })
      .catch(() => {});
  }, [formData.city]);

  function toggleUniversity(id) {
    setFormData((prev) => {
      const exists = prev.nearbyUniversities.includes(id);
      return {
        ...prev,
        nearbyUniversities: exists
          ? prev.nearbyUniversities.filter((u) => u !== id)
          : [...prev.nearbyUniversities, id],
      };
    });
  }

  function toggleTransport(value) {
    setFormData((prev) => {
      const exists = prev.transportTypes.includes(value);
      return {
        ...prev,
        transportTypes: exists ? prev.transportTypes.filter((t) => t !== value) : [...prev.transportTypes, value],
      };
    });
  }

  function validateStep() {
    if (step === 1) {
      if (!formData.title.trim()) return "Property title is required.";
      if (formData.unitType === "apartment" && formData.rentalMode === "whole_apartment" && !formData.price) return "Price is required.";
      if (formData.unitType === "apartment" && formData.rentalMode === "by_unit" && (!formData.roomPrice || !formData.bedPrice)) return "Room price and bed price are required.";
      if (formData.unitType === "room" && !formData.roomPrice) return "Room price is required.";
      if (formData.unitType === "bed" && !formData.bedPrice) return "Bed price is required.";
    }
    if (step === 2) {
      if (!formData.city) return "City is required.";
      if (formData.nearbyUniversities.length === 0) return "Select at least one nearby university.";
    }
    return "";
  }

  function next() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");
    setStep((s) => s + 1);
  }

  async function handleSubmit() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);
    try {
      await onSubmit(formData, images);
      onClose();
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white";
  const labelCls = "block text-xs font-medium text-gray-600 mb-1";

  return (
    <FloatingWindow title={title} onClose={onClose} width="w-[580px]">
      {/* Progress bar */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex gap-1.5 mb-1">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className={`flex-1 h-1.5 rounded-full transition-colors ${i + 1 <= step ? "bg-blue-600" : "bg-gray-100"}`} />
          ))}
        </div>
        <p className="text-xs text-gray-400">Step {step} of 4 — <span className="font-medium text-gray-600">{STEP_LABELS[step - 1]}</span></p>
      </div>

      <div className="px-5 pb-5 space-y-4">
        {/* ── Step 1 ── */}
        {step === 1 && (
          <>
            <div>
              <label className={labelCls}>Property title *</label>
              <input value={formData.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Cozy Room Near Cairo University" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Unit type *</label>
              <div className="flex gap-2">
                {[["apartment","Apartment"],["room","Room"],["bed","Bed"]].map(([v, l]) => (
                  <ToggleChip key={v} active={formData.unitType === v} onClick={() => set("unitType", v)}>{l}</ToggleChip>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Gender preference *</label>
              <div className="flex gap-2">
                {[["male","Male only"],["female","Female only"]].map(([v, l]) => (
                  <ToggleChip key={v} active={formData.genderPreference === v} onClick={() => set("genderPreference", v)}>{l}</ToggleChip>
                ))}
              </div>
            </div>
            {formData.unitType === "apartment" && (
              <div>
                <label className={labelCls}>Rental mode *</label>
                <div className="flex gap-2">
                  {[["whole_apartment","Whole apartment"],["by_unit","By room / bed"]].map(([v, l]) => (
                    <ToggleChip key={v} active={formData.rentalMode === v} onClick={() => set("rentalMode", v)}>{l}</ToggleChip>
                  ))}
                </div>
              </div>
            )}
            {formData.unitType === "apartment" && formData.rentalMode === "whole_apartment" && (
              <div>
                <label className={labelCls}>Price (EGP / month) *</label>
                <input value={formData.price} onChange={(e) => set("price", e.target.value)} type="number" min="0" placeholder="e.g. 5000" className={inputCls} />
              </div>
            )}
            {(formData.unitType === "room" || (formData.unitType === "apartment" && formData.rentalMode === "by_unit")) && (
              <div>
                <label className={labelCls}>Room price (EGP / month) *</label>
                <input value={formData.roomPrice} onChange={(e) => set("roomPrice", e.target.value)} type="number" min="0" placeholder="e.g. 2500" className={inputCls} />
              </div>
            )}
            {(formData.unitType === "bed" || (formData.unitType === "apartment" && formData.rentalMode === "by_unit")) && (
              <div>
                <label className={labelCls}>Bed price (EGP / month) *</label>
                <input value={formData.bedPrice} onChange={(e) => set("bedPrice", e.target.value)} type="number" min="0" placeholder="e.g. 1200" className={inputCls} />
              </div>
            )}
          </>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <>
            <div>
              <label className={labelCls}>City *</label>
              <select value={formData.city} onChange={(e) => set("city", e.target.value)} className={inputCls}>
                <option value="">Select a city…</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>District</label>
                <input value={formData.district} onChange={(e) => set("district", e.target.value)} placeholder="e.g. Nasr City" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Street address</label>
                <input value={formData.address} onChange={(e) => set("address", e.target.value)} placeholder="e.g. 12 Hassan St." className={inputCls} />
              </div>
            </div>
            {formData.city && universities.length > 0 && (
              <div>
                <label className={labelCls}>Nearby universities * (select all that apply)</label>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {universities.map((u) => (
                    <label key={u.id} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.nearbyUniversities.includes(u.id)}
                        onChange={() => toggleUniversity(u.id)}
                        className="accent-blue-600"
                      />
                      <span className="text-gray-700 leading-tight">{u.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Distance to university</label>
                <input value={formData.distanceToUniversity} onChange={(e) => set("distanceToUniversity", e.target.value)} placeholder="e.g. 5-10 mins" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Transport options</label>
              <div className="flex flex-wrap gap-2">
                {TRANSPORT_OPTIONS.map((t) => (
                  <ToggleChip key={t.value} active={formData.transportTypes.includes(t.value)} onClick={() => toggleTransport(t.value)}>
                    {t.label}
                  </ToggleChip>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Step 3 ── */}
        {step === 3 && (
          <>
            <div className="flex justify-around py-2">
              <NumberStepper label="Rooms"     value={formData.numRooms}     onChange={(v) => set("numRooms", v)}     min={1} />
              <NumberStepper label="Beds"      value={formData.numBeds}      onChange={(v) => set("numBeds", v)}      min={1} />
              <NumberStepper label="Bathrooms" value={formData.numBathrooms} onChange={(v) => set("numBathrooms", v)} min={1} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Floor</label>
                <input value={formData.floor} onChange={(e) => set("floor", e.target.value)} type="number" min="0" placeholder="e.g. 3" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Area (sqm)</label>
                <input value={formData.areaSqm} onChange={(e) => set("areaSqm", e.target.value)} type="number" min="0" placeholder="e.g. 45" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Included amenities & bills</label>
              <div className="flex flex-wrap gap-2">
                {AMENITY_FIELDS.map(({ key, label }) => (
                  <ToggleChip key={key} active={formData[key]} onClick={() => set(key, !formData[key])}>
                    {label}
                  </ToggleChip>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Step 4 ── */}
        {step === 4 && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Status</label>
                <select value={formData.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="rented">Rented</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Available from</label>
                <input value={formData.availableFrom} onChange={(e) => set("availableFrom", e.target.value)} type="date" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Min stay (months)</label>
                <input value={formData.minStayMonths} onChange={(e) => set("minStayMonths", e.target.value)} type="number" min="1" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Max stay (months)</label>
                <input value={formData.maxStayMonths} onChange={(e) => set("maxStayMonths", e.target.value)} type="number" min="1" placeholder="No limit" className={inputCls} />
              </div>
            </div>
            {showPhotos && (
              <div>
                <label className={labelCls}>Photos (optional — first photo becomes cover)</label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl py-6 flex flex-col items-center gap-2 text-gray-400 hover:border-blue-300 hover:text-blue-400 transition-colors"
                >
                  <Upload size={20} />
                  <span className="text-xs">{images.length > 0 ? `${images.length} photo${images.length > 1 ? "s" : ""} selected` : "Click to upload photos"}</span>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => setImages(Array.from(e.target.files))} />
                {images.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {images.map((img) => (
                      <img key={img.name} src={URL.createObjectURL(img)} alt={img.name} className="w-14 h-14 object-cover rounded-lg border border-gray-200" />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {error && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-2 pt-1">
          {step > 1 ? (
            <button type="button" onClick={() => { setError(""); setStep((s) => s - 1); }} className="flex items-center gap-1 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <ChevronLeft size={14} /> Back
            </button>
          ) : (
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          )}
          {step < 4 ? (
            <button type="button" onClick={next} className="flex-1 flex items-center justify-center gap-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 transition-colors">
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={loading} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 transition-colors disabled:opacity-60 font-medium">
              {loading ? "Saving…" : submitLabel}
            </button>
          )}
        </div>
      </div>
    </FloatingWindow>
  );
}

function AddPropertyWindow({ onClose, onPropertyAdded }) {
  async function handleSubmit(formData, images) {
    const payload = buildPropertyPayload(formData);
    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (Array.isArray(v)) v.forEach((item) => fd.append(k, item));
      else if (v !== null && v !== undefined) fd.append(k, v);
    });
    images.forEach((img) => fd.append("uploaded_images", img));

    const res = await apiRequest("/api/properties/create/", { method: "POST", body: fd });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = data?.detail || Object.values(data).flat().find((v) => typeof v === "string") || "Failed to create property.";
      throw new Error(msg);
    }
    onPropertyAdded?.();
  }

  return (
    <PropertyWizard
      title="Add New Property"
      initialData={buildPropertyFormState()}
      onSubmit={handleSubmit}
      onClose={onClose}
      submitLabel="Publish Property"
      showPhotos
    />
  );
}

function EditPropertyWindow({ property, onClose, onPropertyUpdated }) {
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    apiRequest(`/api/properties/${property.id}/`)
      .then((res) => res.json())
      .then((full) => {
        setInitialData(buildPropertyFormState({
          ...full,
          nearby_universities: (full.nearby_universities ?? []).map((u) => u.id),
          transport_types: full.transport_types ?? [],
        }));
      })
      .catch(() => {
        setInitialData(buildPropertyFormState({
          ...property,
          nearby_universities: (property.nearby_universities ?? []).map((u) => u.id),
          transport_types: property.transport_types ?? [],
        }));
      });
  }, [property.id]);

  async function handleSubmit(formData) {
    const payload = buildPropertyPayload(formData);
    const res = await apiRequest(`/api/properties/${property.id}/edit/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = data?.detail || Object.values(data).flat().find((v) => typeof v === "string") || "Failed to save changes.";
      throw new Error(msg);
    }
    onPropertyUpdated?.();
  }

  if (!initialData) {
    return (
      <FloatingWindow title="Edit Property" onClose={onClose} width="w-[580px]">
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Loading…</div>
      </FloatingWindow>
    );
  }

  return (
    <PropertyWizard
      title="Edit Property"
      initialData={initialData}
      onSubmit={handleSubmit}
      onClose={onClose}
      submitLabel="Save Changes"
      showPhotos={false}
    />
  );
}

function WithdrawWindow({ onClose }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Bank Transfer");

  return (
    <FloatingWindow title="Request Withdrawal" onClose={onClose} width="w-80">
      <div className="p-4 space-y-3">
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-600 font-medium">Available Balance</p>
          <p className="text-xl font-bold text-blue-700">EGP 15,000</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Amount (EGP)</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Withdrawal Method</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
            <option>Bank Transfer</option>
            <option>Credit Card</option>
            <option>Wallet</option>
          </select>
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="button" onClick={onClose} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 transition-colors">Request</button>
        </div>
      </div>
    </FloatingWindow>
  );
}

function CancelRequestsWindow({ onClose }) {
  const requests = [
    { tenant: "Ahmed M.", property: "Room - Elsalam", reason: "Found another place", date: "Dec 14" },
    { tenant: "Sara K.", property: "Apartment - Elsalam", reason: "Personal reasons", date: "Dec 13" },
  ];

  return (
    <FloatingWindow title="Cancel Requests" onClose={onClose} width="w-96">
      <div className="p-4 space-y-3">
        {requests.map((request) => (
          <div key={`${request.tenant}-${request.property}`} className="border border-gray-100 rounded-xl p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm text-gray-800">{request.tenant}</span>
              <span className="text-xs text-gray-400">{request.date}</span>
            </div>
            <p className="text-xs text-gray-500 mb-1">{request.property}</p>
            <p className="text-xs text-gray-600 italic">"{request.reason}"</p>
            <div className="flex gap-2 mt-2">
              <button type="button" className="flex-1 text-xs border border-red-200 text-red-600 rounded-lg py-1.5 hover:bg-red-50 transition-colors">Reject</button>
              <button type="button" className="flex-1 text-xs bg-blue-600 text-white rounded-lg py-1.5 hover:bg-blue-700 transition-colors">Approve</button>
            </div>
          </div>
        ))}
        <button type="button" onClick={onClose} className="w-full border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Close</button>
      </div>
    </FloatingWindow>
  );
}

function QrScannerModal({ onClose, onCheckin }) {
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);
  const [result, setResult] = useState(null); // null | {ok, message}
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    let scanner;
    import("html5-qrcode").then(({ Html5Qrcode }) => {
      scanner = new Html5Qrcode("qr-reader");
      html5QrRef.current = scanner;
      scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          if (!scanning) return;
          setScanning(false);
          await scanner.stop().catch(() => {});
          const res = await onCheckin(decodedText);
          setResult(res);
        },
        () => {},
      ).catch(() => {
        setResult({ ok: false, message: "Camera access denied. Please allow camera permission." });
      });
    });
    return () => {
      html5QrRef.current?.stop().catch(() => {});
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-black text-gray-900">Scan Check-in QR</h3>
            <p className="text-xs text-gray-500 mt-0.5">Point camera at the student's QR code</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100 transition">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {!result ? (
          <div id="qr-reader" ref={scannerRef} className="w-full rounded-2xl overflow-hidden" />
        ) : result.ok ? (
          <div className="rounded-2xl bg-green-50 border border-green-200 p-6 text-center">
            <CheckCircle2 size={40} className="mx-auto text-green-500 mb-3" />
            <p className="font-black text-green-800 text-lg">Check-in confirmed!</p>
            <p className="text-sm text-green-700 mt-1">{result.message}</p>
            <button onClick={onClose} className="mt-4 w-full rounded-xl bg-green-600 text-white py-2.5 text-sm font-bold hover:bg-green-700 transition">
              Done
            </button>
          </div>
        ) : (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-center">
            <p className="font-black text-red-800">Check-in failed</p>
            <p className="text-sm text-red-600 mt-1">{result.message}</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => { setResult(null); setScanning(true); }} className="flex-1 rounded-xl border border-red-200 text-red-600 py-2.5 text-sm font-bold hover:bg-red-50 transition">
                Try again
              </button>
              <button onClick={onClose} className="flex-1 rounded-xl bg-red-600 text-white py-2.5 text-sm font-bold hover:bg-red-700 transition">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OwnerDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [onboardingBanner, setOnboardingBanner] = useState(null);
  const [ownerProfile, setOwnerProfile] = useState(() => getStoredUser() || null);
  const [activeNav, setActiveNav] = useState("Units");
  const [floating, setFloating] = useState(null);
  const [msgSearch, setMsgSearch] = useState("");
  const [conversations, setConversations] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [messagesError, setMessagesError] = useState("");
  const [properties, setProperties] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState(null);
  const [kycStarting, setKycStarting] = useState(false);
  const [connectStatus, setConnectStatus] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [onboardingBusy, setOnboardingBusy] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);

  useEffect(() => {
    fetchKycStatus()
      .then((d) => setKycStatus(d.status))
      .catch(() => setKycStatus("NOT_STARTED"));
  }, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const activeStatuses = ["CREATED", "STARTED", "PROCESSING", "PENDING_REVIEW"];
      const syncer = activeStatuses.includes(kycStatus) ? syncKycStatus : fetchKycStatus;
      syncer().then((d) => setKycStatus(d.status)).catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [kycStatus]);

  async function loadPaymentsData() {
    setPaymentsLoading(true);
    try {
      const [status, payoutList] = await Promise.all([getConnectStatus(), getLandlordPayouts()]);
      setConnectStatus(status);
      setPayouts(payoutList || []);
    } catch {
      // keep previous state
    } finally {
      setPaymentsLoading(false);
    }
  }

  useEffect(() => { loadPaymentsData(); }, []);

  useEffect(() => {
    fetchMyProfile()
      .then((profile) => setOwnerProfile(profile))
      .catch(() => {
        // Keep the stored auth user if the profile request is temporarily unavailable.
      });
  }, []);

  const currentUserId = ownerProfile?.id ? String(ownerProfile.id) : String(getStoredUser()?.id || "");

  const loadOwnerMessages = useCallback(async () => {
    setMessagesLoading(true);
    setMessagesError("");
    try {
      const data = await fetchConversations();
      setConversations(Array.isArray(data) ? data.map((conversation) => mapConversation(conversation, currentUserId)) : []);
    } catch (loadError) {
      setMessagesError(getApiErrorMessage(loadError, "Failed to load messages."));
    } finally {
      setMessagesLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadOwnerMessages();
  }, [loadOwnerMessages]);

  useEffect(() => {
    const param = searchParams.get("onboarding");
    if (param === "complete" || param === "refresh") {
      setOnboardingBanner(param);
      setSearchParams({}, { replace: true });
      loadPaymentsData(); // re-fetch so status reflects the completed onboarding
    }
  }, []);

  async function handleCheckin(qrToken) {
    try {
      const res = await apiRequest("/api/payments/checkin/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_token: qrToken }),
      });
      const data = await res.json();
      if (res.ok) {
        loadPaymentsData();
        return { ok: true, message: `Payout of EGP ${data.landlord_amount_aed?.toLocaleString() || "—"} ${data.payout_status === "pending" ? "is pending — complete your account verification." : "transferred to your account."}` };
      }
      return { ok: false, message: data.error || "Check-in failed." };
    } catch {
      return { ok: false, message: "Network error. Please try again." };
    }
  }

  async function handleStartOnboarding() {
    setOnboardingBusy(true);
    try {
      const data = await startOnboarding();
      if (data.onboarding_url) window.location.href = data.onboarding_url;
    } catch {
      // silently fail — user can retry
    } finally {
      setOnboardingBusy(false);
    }
  }

  async function handleStartKyc() {
    setKycStarting(true);
    try {
      const data = await createKycInquiry();
      if (data.verification_url) window.open(data.verification_url, "_blank");
    } catch {
      // banner stays visible; landlord can retry
    } finally {
      setKycStarting(false);
    }
  }

  async function fetchProperties() {
    try {
      setPropertiesLoading(true);
      const res = await apiRequest("/api/properties/landlord/properties/");
      if (res.ok) {
        const data = await res.json();
        setProperties(data);
      }
    } catch {
      // silently keep previous state
    } finally {
      setPropertiesLoading(false);
    }
  }

  useEffect(() => { fetchProperties(); }, []);

  async function fetchDashboardData() {
    try {
      setDashboardLoading(true);
      const res = await apiRequest("/api/properties/landlord/dashboard/");
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch {
      // keep previous dashboard data
    } finally {
      setDashboardLoading(false);
    }
  }

  useEffect(() => { fetchDashboardData(); }, []);

  function refreshOwnerData() {
    fetchProperties();
    fetchDashboardData();
  }

  function openDashboardPage(label) {
    setActiveNav(label);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleLogout() {
    clearSession();
    navigate("/login");
  }

  const filteredConversations = conversations.filter((conversation) =>
    `${conversation.name} ${conversation.lastMessage}`.toLowerCase().includes(msgSearch.toLowerCase())
  );
  const ownerName = getOwnerFirstName(ownerProfile);
  const ownerAvatar = getOwnerAvatarUrl(ownerProfile);
  const ownerInitials = getOwnerInitials(ownerProfile);
  const bookingUnitCounts = dashboardData?.summary?.booking_unit_counts || {};
  const bookingStats = [
    { label: "Booked Apartments", count: bookingUnitCounts.whole || 0 },
    { label: "Booked Rooms", count: bookingUnitCounts.room || 0 },
    { label: "Booked Beds", count: bookingUnitCounts.bed || 0 },
  ];
  const topProperties = dashboardData?.top_properties || [];
  const recentBookings = dashboardData?.recent_bookings || [];

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "Inter, sans-serif" }}>
      <style>
        {`
          .sh-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
          .sh-scroll::-webkit-scrollbar-track { background: transparent; }
          .sh-scroll::-webkit-scrollbar-thumb { background: #bfdbfe; border-radius: 99px; }
          .sh-scroll::-webkit-scrollbar-thumb:hover { background: #93c5fd; }
        `}
      </style>

      <nav className="bg-white border-b border-blue-100 sticky top-0 z-40" style={navShadow}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 min-h-14 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-shrink-0">
            <img src={logo} alt="Studenthub" style={{ height: "32px", objectFit: "contain" }} />
            <span className="font-semibold text-sm whitespace-nowrap px-2 py-0.5 rounded-md text-white" style={{ backgroundColor: "#1b3070" }}>Owner</span>
          </div>
          <div className="order-last flex w-full items-center gap-1 overflow-x-auto sh-scroll pb-1 sm:order-none sm:w-auto sm:overflow-visible sm:pb-0">
            {NAV_ITEMS.map((label) => (
              <button
                type="button"
                key={label}
                onClick={() => openDashboardPage(label)}
                className={`shrink-0 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeNav === label
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setFloating({ kind: "profile" })} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              {ownerAvatar ? (
                <img src={ownerAvatar} alt={ownerName} className="w-8 h-8 rounded-full object-cover border border-blue-100" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-xs font-semibold text-white">{ownerInitials}</span>
                </div>
              )}
              <span className="text-sm text-gray-600 font-medium hidden sm:block">Hi, {ownerName}</span>
            </button>
            <button type="button" title="Log out" onClick={handleLogout} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
        {/* KYC banner — full width */}
        {activeNav === "Units" && (() => {
          const kycApproved   = kycStatus === "APPROVED";
          const kycInProgress = ["CREATED", "STARTED", "PROCESSING", "PENDING_REVIEW"].includes(kycStatus);
          const kycFailed     = ["FAILED", "REJECTED"].includes(kycStatus);
          return kycStatus && !kycApproved ? (
            <div className="flex flex-col gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3 sm:flex-row sm:items-start">
              <AlertTriangle size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-yellow-800">Identity verification required</p>
                <p className="text-xs text-yellow-700 mt-0.5">
                  {kycInProgress
                    ? "Your verification is in progress — we'll unlock property listing once it's approved."
                    : kycFailed
                    ? "Your verification was not approved. Please try again to publish properties."
                    : "You must complete identity verification before you can list properties."}
                </p>
              </div>
              <button
                onClick={handleStartKyc}
                disabled={kycStarting}
                className="w-full text-xs font-semibold text-yellow-800 bg-yellow-100 hover:bg-yellow-200 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50 sm:w-auto"
              >
                {kycStarting ? "Opening…" : kycInProgress ? "Continue →" : kycFailed ? "Retry →" : "Verify Now →"}
              </button>
            </div>
          ) : null;
          })()}

        {/* Dashboard pages */}
        <div className="flex flex-col gap-4">

          {activeNav === "Units" && (
          <>
          {/* Units + Booking Stats side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* My Units */}
            <div id="section-units" className="bg-white rounded-2xl border border-blue-100 p-4 scroll-mt-16 h-full" style={cardShadow}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800">My Units</h3>
                {(() => {
                  const approved = kycStatus === "APPROVED";
                  return (
                    <button
                      type="button"
                      onClick={approved ? () => setFloating({ kind: "addProperty" }) : undefined}
                      disabled={!approved || kycStatus === null}
                      title={approved ? undefined : "Complete identity verification to add properties"}
                      className="flex items-center gap-1 text-white text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      style={approved ? greenButton : { backgroundColor: "#9ca3af" }}
                      onMouseEnter={(e) => { if (approved) e.currentTarget.style.backgroundColor = greenButtonHover; }}
                      onMouseLeave={(e) => { if (approved) e.currentTarget.style.backgroundColor = greenButton.backgroundColor; }}
                    >
                      <Plus size={12} /> Add
                    </button>
                  );
                })()}
              </div>
              <div className="space-y-2 sh-scroll" style={{ maxHeight: "280px", overflowY: "auto", paddingRight: "2px" }}>
                {propertiesLoading ? (
                  <div className="flex items-center justify-center py-8 text-gray-400 text-xs">Loading…</div>
                ) : properties.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-400">
                    <Home size={22} className="text-blue-100" />
                    <p className="text-xs">No properties yet — click Add to get started.</p>
                  </div>
                ) : properties.map((prop) => {
                  const coverImg = prop.cover_image || prop.images?.[0]?.image || null;
                  return (
                  <div key={prop.id} className="flex flex-col gap-3 bg-blue-50 rounded-xl px-3 py-2.5 border border-blue-100 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden bg-blue-200">
                        {coverImg ? (
                          <img src={withApiUrl(coverImg)} alt={prop.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Home size={15} className="text-blue-600" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-gray-700 font-medium truncate">{prop.title}</p>
                        <p className="text-xs text-gray-400 capitalize">{prop.unit_type} · {prop.city}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 flex-shrink-0 sm:ml-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        prop.status === "available" ? "bg-green-100 text-green-700" :
                        prop.status === "rented"    ? "bg-blue-100 text-blue-700" :
                        prop.status === "reserved"  ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-500"
                      }`}>{prop.status}</span>
                      <button type="button" onClick={() => setFloating({ kind: "editProperty", property: prop })} className="flex items-center gap-1 text-xs border border-blue-200 text-blue-600 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors">
                        <Edit2 size={11} /> Edit
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>

            {/* Booking Stats + Quick Alerts + Recent Bookings */}
            <div id="section-alerts" className="bg-white rounded-2xl border border-blue-100 p-4 scroll-mt-16 h-full" style={cardShadow}>
              <h3 className="font-bold text-gray-800 mb-3">Booking Stats</h3>

              {/* Stat numbers row */}
              <div className="grid grid-cols-1 gap-2 mb-4 sm:grid-cols-3">
                {bookingStats.map((item) => (
                  <div key={item.label} className="bg-blue-50 rounded-xl border border-blue-100 px-3 py-3 text-center">
                    <p className="text-xl font-bold text-blue-700">{dashboardLoading ? "…" : item.count}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>

              {/* Top Properties + Alerts side by side */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Top Properties</p>
                  <div className="sh-scroll" style={{ maxHeight: "160px", overflowY: "auto" }}>
                    {dashboardLoading ? (
                      <p className="text-xs text-gray-400 py-2">Loading…</p>
                    ) : topProperties.length === 0 ? (
                      <p className="text-xs text-gray-400 py-2">No properties yet.</p>
                    ) : topProperties.map((property) => (
                      <div key={property.id} className="flex items-center justify-between gap-3 py-1.5 border-b border-gray-50 last:border-0">
                        <p className="text-xs text-gray-700 font-medium truncate">{property.title}</p>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-semibold text-gray-800">{property.view_count || 0} views</p>
                          <p className="text-xs text-gray-400">{property.booking_count || 0} bookings</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Quick Alerts</p>
                  <div className="space-y-1.5 sh-scroll" style={{ maxHeight: "160px", overflowY: "auto" }}>
                    {ALERTS.map((alert, index) => (
                      <div key={`${alert.text}-${index}`} className="flex items-start gap-2 bg-blue-50 rounded-xl px-2.5 py-2 border border-blue-100">
                        <div className="mt-0.5 flex-shrink-0">{alert.icon}</div>
                        <p className="text-xs text-gray-700 leading-relaxed">{alert.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Bookings */}
              <div className="mt-4 pt-3 border-t border-blue-50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recent Bookings</p>
                <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                  {dashboardLoading ? (
                    <p className="text-xs text-gray-400 py-1.5">Loading…</p>
                  ) : recentBookings.length === 0 ? (
                    <p className="text-xs text-gray-400 py-1.5">No bookings yet.</p>
                  ) : recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                      <p className="text-xs text-gray-600 truncate">
                        {booking.tenant_name} booked {formatUnitType(booking.booking_unit)} at {booking.property_title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>{/* end row 1 grid */}
          </>
          )}

          {activeNav === "Messages" && (
          <>
          {/* Messages */}
          <div id="section-messages" className="bg-white rounded-2xl border border-blue-100 p-4 scroll-mt-16" style={cardShadow}>
              <h3 className="font-bold text-gray-800 mb-3">Messages</h3>
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={msgSearch} onChange={(e) => setMsgSearch(e.target.value)} placeholder="Search people or message" className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 bg-gray-50" />
              </div>
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-xs text-gray-400 font-medium">All</p>
                <button type="button" onClick={loadOwnerMessages} className="text-xs font-semibold text-blue-600 hover:text-blue-700">Refresh</button>
              </div>
              <div className="space-y-1 sh-scroll" style={{ maxHeight: "280px", overflowY: "auto", paddingRight: "2px" }}>
                {messagesError ? (
                  <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{messagesError}</p>
                ) : messagesLoading ? (
                  <p className="py-8 text-center text-xs text-gray-400">Loading messages…</p>
                ) : filteredConversations.length === 0 ? (
                  <p className="py-8 text-center text-xs text-gray-400">No conversations yet.</p>
                ) : filteredConversations.map((conversation) => (
                  <button key={conversation.id} type="button" onClick={() => setFloating({ kind: "chat", conversation })} className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-blue-50 transition-colors text-left">
                    <div className="relative">
                      <img src={conversation.avatar} alt={conversation.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                      {conversation.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-gray-800">{conversation.name}</span>
                        <span className="text-[11px] text-gray-400">{conversation.lastTime}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{conversation.lastMessage}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
          )}

          {activeNav === "Payments" && (
          <>
          <div id="section-payments" className="bg-white rounded-2xl border border-blue-100 p-4 scroll-mt-16" style={cardShadow}>
          <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-gray-800">Payouts</h3>
              <p className="text-xs text-gray-400 mt-0.5">Your earnings from completed check-ins</p>
            </div>
            <button type="button" onClick={loadPaymentsData} className="w-full text-xs border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors font-medium sm:w-auto">
              Refresh
            </button>
          </div>

          {/* Post-onboarding return banner */}
          {onboardingBanner === "complete" && (
            <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-600 shrink-0" />
                <p className="text-xs font-bold text-green-800">Verification submitted! Your account is being reviewed — payouts will activate automatically.</p>
              </div>
              <button type="button" onClick={() => setOnboardingBanner(null)} className="text-green-700 text-xs font-bold hover:underline">Dismiss</button>
            </div>
          )}
          {onboardingBanner === "refresh" && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-bold text-amber-800">Onboarding session expired. Please try again.</p>
              <button type="button" onClick={() => setOnboardingBanner(null)} className="text-amber-700 text-xs font-bold hover:underline">Dismiss</button>
            </div>
          )}

          {/* Account verification banner */}
          {!paymentsLoading && connectStatus && !connectStatus.onboarding_complete && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold text-amber-800">Identity verification required</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {connectStatus.pending_earnings_aed > 0
                    ? `EGP ${connectStatus.pending_earnings_aed.toLocaleString()} is held until you verify your account.`
                    : "Verify your identity to receive payouts when students check in."}
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartOnboarding}
                disabled={onboardingBusy}
                className="w-full shrink-0 text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg font-bold transition-colors disabled:opacity-60 sm:w-auto"
              >
                {onboardingBusy ? "Opening…" : "Verify Now"}
              </button>
            </div>
          )}

          {!paymentsLoading && connectStatus?.onboarding_complete && (
            <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 flex items-center gap-2">
              <CheckCircle2 size={14} className="text-green-600 shrink-0" />
              <p className="text-xs font-bold text-green-800">Account verified — payouts are active</p>
            </div>
          )}

          {/* Earnings summary */}
          {!paymentsLoading && (
            <div className="grid grid-cols-1 gap-3 mb-4 sm:grid-cols-2">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 font-medium">Transferred</p>
                <p className="text-lg font-bold text-blue-600">
                  EGP {payouts.filter(p => p.payout_status === "done").reduce((s, p) => s + (p.landlord_amount_egp || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 font-medium">Deposits received</p>
                <p className="text-lg font-bold text-amber-600">
                  EGP {payouts.filter(p => p.booking_status === "paid").reduce((s, p) => s + p.deposit_egp, 0).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Payout history */}
          <div>
            <p className="text-sm font-bold text-gray-800 mb-3">Payout History</p>
            {paymentsLoading ? (
              <p className="text-xs text-gray-400 py-4 text-center">Loading…</p>
            ) : payouts.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No payouts yet — they appear after students check in.</p>
            ) : (
              <div className="overflow-x-auto sh-scroll" style={{ maxHeight: "260px", overflowY: "auto" }}>
                <table className="min-w-[760px] w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["Property", "Tenant", "Amount (EGP)", "Date", "Status", ""].map((h) => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-500 pb-2 pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((p) => {
                      const isCheckedIn = p.booking_status === "finished";
                      const payoutDone = p.payout_status === "done";
                      const payoutPending = p.payout_status === "pending";
                      const label = payoutDone ? "Transferred" : payoutPending ? "Payout pending" : isCheckedIn ? "Payout failed" : "Deposit received";
                      const labelClass = payoutDone ? "bg-green-100 text-green-700" : payoutPending ? "bg-amber-100 text-amber-700" : isCheckedIn ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700";
                      return (
                        <tr key={p.booking_id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                          <td className="py-2.5 pr-4 text-gray-700 whitespace-nowrap text-xs">{p.property_title}</td>
                          <td className="py-2.5 pr-4 text-gray-600 text-xs">{p.tenant_name}</td>
                          <td className="py-2.5 pr-4 font-semibold text-gray-800">
                            {(payoutDone ? p.landlord_amount_egp : p.deposit_egp).toLocaleString()}
                          </td>
                          <td className="py-2.5 pr-4 text-gray-500 text-xs">
                            {new Date(p.triggered_at || p.updated_at).toLocaleDateString("en-GB")}
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${labelClass}`}>{label}</span>
                          </td>
                          <td className="py-2.5">
                            {p.booking_status === "paid" && (
                              <button
                                type="button"
                                onClick={() => setShowQrScanner(true)}
                                className="flex items-center gap-1 text-xs bg-blue-600 text-white px-2.5 py-1 rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
                              >
                                <QrCode size={11} /> Scan QR
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>{/* end payout history */}
          </div>{/* end section-payments */}
          </>
          )}
        </div>{/* end dashboard stack */}
      </main>

      {floating?.kind === "chat" && (
        <ChatWindow
          conversation={floating.conversation}
          currentUserId={currentUserId}
          onClose={() => setFloating(null)}
          onMessageSent={loadOwnerMessages}
        />
      )}
      {floating?.kind === "editProperty" && <EditPropertyWindow property={floating.property} onClose={() => setFloating(null)} onPropertyUpdated={refreshOwnerData} />}
      {floating?.kind === "addProperty" && <AddPropertyWindow onClose={() => setFloating(null)} onPropertyAdded={refreshOwnerData} />}
      {floating?.kind === "withdraw" && <WithdrawWindow onClose={() => setFloating(null)} />}
      {floating?.kind === "cancelRequests" && <CancelRequestsWindow onClose={() => setFloating(null)} />}
      {floating?.kind === "profile" && (
        <ProfileWindow
          profile={ownerProfile}
          onClose={() => setFloating(null)}
          onSaved={setOwnerProfile}
        />
      )}
      {showQrScanner && <QrScannerModal onClose={() => setShowQrScanner(false)} onCheckin={handleCheckin} />}
    </div>
  );
}

export default OwnerDashboard;
