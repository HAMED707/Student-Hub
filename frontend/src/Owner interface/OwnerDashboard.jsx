import { useEffect, useRef, useState } from "react";
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
import { apiRequest } from "../api/client.js";
import { fetchKycStatus, createKycInquiry, syncKycStatus } from "../api/kyc.js";
import { getConnectStatus, startOnboarding, getLandlordPayouts } from "../api/payments.js";
import { clearSession } from "../utils/auth.js";
import { CITIES, TRANSPORT_OPTIONS, UNIVERSITIES_BY_CITY } from "../utils/propertyConstants.js";
import { buildPropertyFormState, buildPropertyPayload } from "../utils/propertyForm.js";

const NAV_ITEMS = [
  { label: "Units", sectionId: "section-units" },
  { label: "Alerts", sectionId: "section-alerts" },
  { label: "Payments", sectionId: "section-payments" },
];

const CONTACTS = [
  { id: 1, name: "Mohamed", avatar: "MO", handle: "@mohamed", lastMsg: "Hey, is the room still available?", time: "Dec 15", unread: 2 },
  { id: 2, name: "Caream", avatar: "CA", handle: "@caream", lastMsg: "Thank you for your recommendation!", time: "Dec 15" },
  { id: 3, name: "EELU Community", avatar: "EC", handle: "@eelu", lastMsg: "New announcement posted for students", time: "Dec 14" },
  { id: 4, name: "Sara Hassan", avatar: "SH", handle: "@sara", lastMsg: "When can I move in?", time: "Dec 13", unread: 1 },
  { id: 5, name: "Ahmed Nour", avatar: "AN", handle: "@ahmed", lastMsg: "Is utilities included in the price?", time: "Dec 12" },
  { id: 6, name: "Nadia Farouk", avatar: "NF", handle: "@nadia", lastMsg: "Can I visit tomorrow morning?", time: "Dec 11", unread: 3 },
  { id: 7, name: "Omar Tarek", avatar: "OT", handle: "@omar", lastMsg: "Just confirmed my payment!", time: "Dec 10" },
];

const MESSAGES_BY_CONTACT = {
  1: [
    { id: 1, text: "Hey, is the room still available?", from: "them" },
    { id: 2, text: "Yes it is! Would you like to schedule a visit?", from: "me" },
    { id: 3, text: "That would be great, when works for you?", from: "them" },
  ],
  2: [
    { id: 1, text: "Thank you for your good recommendation!", from: "them" },
    { id: 2, text: "Happy to help! Let me know if you need anything.", from: "me" },
  ],
  3: [
    { id: 1, text: "New announcement posted for students", from: "them" },
    { id: 2, text: "Thanks for the update!", from: "me" },
  ],
};

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

const BOOKING_STATS = [
  { label: "Booked Apartments", count: 1, color: "bg-blue-500" },
  { label: "Booked Rooms", count: 2, color: "bg-indigo-500" },
  { label: "Booked Beds", count: 3, color: "bg-sky-500" },
];

const TOP_PROPERTIES = [
  { name: "Shared Room - Nasr City", views: "124 views", bookings: "8 bookings" },
  { name: "Studio Near University", views: "98 views", bookings: "5 bookings" },
];

const RECENT_BOOKINGS = ["Mohamed booked a bed", "Mohamed booked a bed", "Caream booked a room"];

const cardShadow = { boxShadow: "0 2px 12px rgba(27,48,112,0.08)" };
const navShadow = { boxShadow: "0 1px 4px rgba(27,48,112,0.08)" };
const greenButton = { backgroundColor: "#5CAA28" };
const greenButtonHover = "#4a9020";

function AvatarCircle({ initials, color = "bg-blue-500" }) {
  return (
    <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
}

function StatusBadge({ status }) {
  const cls =
    status === "Paid" ? "bg-green-100 text-green-700" :
    status === "Pending" ? "bg-yellow-100 text-yellow-700" :
    "bg-red-100 text-red-700";

  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status}</span>;
}

function FloatingWindow({ title, subtitle, onClose, children, width = "w-80", height }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative bg-white rounded-2xl shadow-2xl ${width} ${height ?? ""} flex flex-col overflow-hidden border border-blue-100`}
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

function ProfileWindow({ onClose }) {
  const [name, setName] = useState("Salah Ahmed");
  const [email, setEmail] = useState("salah@example.com");
  const [phone, setPhone] = useState("+20 100 000 0000");
  const [city, setCity] = useState("Cairo");
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 900);
  }

  return (
    <FloatingWindow title="My Profile" onClose={onClose} width="w-80">
      <div className="p-4 space-y-3">
        <div className="flex flex-col items-center gap-2 pb-2">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
            {name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <p className="text-xs text-gray-400">Owner Account</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
          <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
            <option>Cairo</option>
            <option>Alexandria</option>
            <option>Giza</option>
            <option>Mansoura</option>
            <option>Assiut</option>
            <option>Other</option>
          </select>
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="button" onClick={save} className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${saved ? "bg-green-500 text-white" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
            {saved ? "Saved ✓" : "Save Changes"}
          </button>
        </div>
      </div>
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

function ChatWindow({ contact, onClose }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(MESSAGES_BY_CONTACT[contact.id] ?? []);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  function send() {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { id: Date.now(), text: input.trim(), from: "me" }]);
    setInput("");
  }

  return (
    <FloatingWindow title={contact.name} subtitle={contact.handle} onClose={onClose} width="w-80" height="h-[420px]">
      <div className="flex flex-col h-full">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
              {msg.from === "them" && <AvatarCircle initials={contact.avatar} color="bg-blue-400" />}
              <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${msg.from === "me" ? "bg-blue-600 text-white ml-2" : "bg-gray-100 text-gray-800 ml-2"}`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
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
          <button type="button" onClick={send} className="text-blue-600 hover:text-blue-700 transition-colors" aria-label="Send"><Send size={16} /></button>
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
  const [activeNav, setActiveNav] = useState("");
  const [floating, setFloating] = useState(null);
  const [msgSearch, setMsgSearch] = useState("");
  const [properties, setProperties] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
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
    } catch (_) {
      // keep previous state
    } finally {
      setPaymentsLoading(false);
    }
  }

  useEffect(() => { loadPaymentsData(); }, []);

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
    } catch (_) {
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
    } catch (_) {
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

  function scrollToSection(sectionId, label) {
    setActiveNav(label);
    const el = document.getElementById(sectionId);
    if (el) {
      const top = el.getBoundingClientRect().top + window.pageYOffset - 70;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }
  }

  function handleLogout() {
    clearSession();
    navigate("/login");
  }

  const filteredContacts = CONTACTS.filter((contact) =>
    contact.name.toLowerCase().includes(msgSearch.toLowerCase())
  );

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-shrink-0">
            <img src={logo} alt="Studenthub" style={{ height: "32px", objectFit: "contain" }} />
            <span className="font-semibold text-sm whitespace-nowrap px-2 py-0.5 rounded-md text-white" style={{ backgroundColor: "#1b3070" }}>Owner</span>
          </div>
          <div className="hidden sm:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                type="button"
                key={item.label}
                onClick={() => scrollToSection(item.sectionId, item.label)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeNav === item.label
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setFloating({ kind: "profile" })} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-xs font-semibold text-white">SA</span>
              </div>
              <span className="text-sm text-gray-600 font-medium hidden sm:block">Hi, Salah</span>
            </button>
            <button type="button" title="Log out" onClick={handleLogout} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {(() => {
          const kycApproved   = kycStatus === "APPROVED";
          const kycInProgress = ["CREATED", "STARTED", "PROCESSING", "PENDING_REVIEW"].includes(kycStatus);
          const kycFailed     = ["FAILED", "REJECTED"].includes(kycStatus);
          return kycStatus && !kycApproved ? (
            <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3">
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
                className="text-xs font-semibold text-yellow-800 bg-yellow-100 hover:bg-yellow-200 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
              >
                {kycStarting ? "Opening…" : kycInProgress ? "Continue →" : kycFailed ? "Retry →" : "Verify Now →"}
              </button>
            </div>
          ) : null;
        })()}

        <div id="section-units" className="grid grid-cols-1 md:grid-cols-2 gap-4 scroll-mt-16">
          <div className="bg-white rounded-2xl border border-blue-100 p-4" style={cardShadow}>
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
            <div className="space-y-2 sh-scroll" style={{ maxHeight: "220px", overflowY: "auto", paddingRight: "2px" }}>
              {propertiesLoading ? (
                <div className="flex items-center justify-center py-8 text-gray-400 text-xs">Loading…</div>
              ) : properties.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-400">
                  <Home size={22} className="text-blue-100" />
                  <p className="text-xs">No properties yet — click Add to get started.</p>
                </div>
              ) : properties.map((prop) => (
                <div key={prop.id} className="flex items-center justify-between bg-blue-50 rounded-xl px-3 py-2.5 border border-blue-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 bg-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Home size={13} className="text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-700 font-medium truncate">{prop.title}</p>
                      <p className="text-xs text-gray-400 capitalize">{prop.unit_type} · {prop.city}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
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
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-blue-100 p-4" style={cardShadow}>
            <h3 className="font-bold text-gray-800 mb-3">Booking Stats</h3>
            <div className="space-y-2">
              {BOOKING_STATS.map((item) => (
                <div key={item.label} className="flex items-center justify-between bg-blue-50 rounded-xl px-3 py-2.5 border border-blue-100">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">{item.count}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-blue-50">
              <p className="text-xs font-semibold text-gray-500 mb-2">Top Properties</p>
              <div className="sh-scroll" style={{ maxHeight: "140px", overflowY: "auto" }}>
                {TOP_PROPERTIES.map((property) => (
                  <div key={property.name} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <p className="text-xs text-gray-700 font-medium">{property.name}</p>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-gray-800">{property.views}</p>
                      <p className="text-xs text-gray-400">{property.bookings}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div id="section-alerts" className="grid grid-cols-1 md:grid-cols-2 gap-4 scroll-mt-16">
          <div className="bg-white rounded-2xl border border-blue-100 p-4" style={cardShadow}>
            <h3 className="font-bold text-gray-800 mb-3">Messages</h3>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={msgSearch} onChange={(e) => setMsgSearch(e.target.value)} placeholder="Search people or message" className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 bg-gray-50" />
            </div>
            <p className="text-xs text-gray-400 font-medium mb-2 px-1">All</p>
            <div className="space-y-1 sh-scroll" style={{ maxHeight: "240px", overflowY: "auto", paddingRight: "2px" }}>
              {filteredContacts.map((contact) => (
                <button key={contact.id} type="button" onClick={() => setFloating({ kind: "chat", contact })} className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-blue-50 transition-colors text-left">
                  <div className="relative">
                    <AvatarCircle initials={contact.avatar} color="bg-blue-500" />
                    {contact.unread && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {contact.unread}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-800">{contact.name}</span>
                      <span className="text-[11px] text-gray-400">{contact.time}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{contact.lastMsg}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-blue-100 p-4" style={cardShadow}>
            <h3 className="font-bold text-gray-800 mb-3">Quick Alerts</h3>
            <div className="space-y-2 sh-scroll" style={{ maxHeight: "240px", overflowY: "auto", paddingRight: "2px" }}>
              {ALERTS.map((alert, index) => (
                <div key={`${alert.text}-${index}`} className="flex items-start gap-2.5 bg-blue-50 rounded-xl px-3 py-2.5 border border-blue-100">
                  <div className="mt-0.5 flex-shrink-0">{alert.icon}</div>
                  <p className="text-xs text-gray-700 leading-relaxed">{alert.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-blue-50">
              <p className="text-xs font-semibold text-gray-500 mb-2">Recent Bookings</p>
              {RECENT_BOOKINGS.map((item, index) => (
                <div key={`${item}-${index}`} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                  <p className="text-xs text-gray-600">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div id="section-payments" className="bg-white rounded-2xl border border-blue-100 p-4 scroll-mt-16" style={cardShadow}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-800">Payouts</h3>
              <p className="text-xs text-gray-400 mt-0.5">Your earnings from completed check-ins</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowQrScanner(true)} className="flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                <QrCode size={13} /> Scan QR
              </button>
              <button type="button" onClick={loadPaymentsData} className="text-xs border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors font-medium">
                Refresh
              </button>
            </div>
          </div>

          {/* Post-onboarding return banner */}
          {onboardingBanner === "complete" && (
            <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-600 shrink-0" />
                <p className="text-xs font-bold text-green-800">Verification submitted! Your account is being reviewed — payouts will activate automatically.</p>
              </div>
              <button type="button" onClick={() => setOnboardingBanner(null)} className="text-green-700 text-xs font-bold hover:underline">Dismiss</button>
            </div>
          )}
          {onboardingBanner === "refresh" && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-center justify-between gap-3">
              <p className="text-xs font-bold text-amber-800">Onboarding session expired. Please try again.</p>
              <button type="button" onClick={() => setOnboardingBanner(null)} className="text-amber-700 text-xs font-bold hover:underline">Dismiss</button>
            </div>
          )}

          {/* Account verification banner */}
          {!paymentsLoading && connectStatus && !connectStatus.onboarding_complete && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-start justify-between gap-3">
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
                className="shrink-0 text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg font-bold transition-colors disabled:opacity-60"
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
            <div className="grid grid-cols-2 gap-3 mb-4">
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
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["Property", "Tenant", "Amount (EGP)", "Date", "Status"].map((h) => (
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
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {floating?.kind === "chat" && <ChatWindow contact={floating.contact} onClose={() => setFloating(null)} />}
      {floating?.kind === "editProperty" && <EditPropertyWindow property={floating.property} onClose={() => setFloating(null)} onPropertyUpdated={fetchProperties} />}
      {floating?.kind === "addProperty" && <AddPropertyWindow onClose={() => setFloating(null)} onPropertyAdded={fetchProperties} />}
      {floating?.kind === "withdraw" && <WithdrawWindow onClose={() => setFloating(null)} />}
      {floating?.kind === "cancelRequests" && <CancelRequestsWindow onClose={() => setFloating(null)} />}
      {floating?.kind === "profile" && <ProfileWindow onClose={() => setFloating(null)} />}
      {showQrScanner && <QrScannerModal onClose={() => setShowQrScanner(false)} onCheckin={handleCheckin} />}
    </div>
  );
}

export default OwnerDashboard;
