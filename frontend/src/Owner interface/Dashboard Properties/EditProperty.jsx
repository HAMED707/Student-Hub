import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

/* =========================
   Leaflet icon fix
========================= */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

/* ================= Icons (no emoji) ================= */
const Ic = {
  backTop: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18l6-6-6-6" />
    </svg>
  ),
  chevronDown: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M7 6l1 16h8l1-16" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  ),

  basic: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16M4 12h16M4 17h10" />
    </svg>
  ),
  location: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 21s7-4.35 7-11a7 7 0 0 0-14 0c0 6.65 7 11 7 11Z" />
      <path d="M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    </svg>
  ),
  price: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 1v22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  dots: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor">
      <circle cx="7" cy="7" r="2" />
      <circle cx="17" cy="7" r="2" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  ),
  bills: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 2h12v20l-2-1-2 1-2-1-2 1-2-1-2 1V2z" />
      <path d="M8 7h8M8 11h8M8 15h6" />
    </svg>
  ),
  room: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 11h18" />
      <path d="M4 20V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12" />
      <path d="M8 11v9M16 11v9" />
    </svg>
  ),
  nearby: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor">
      <circle cx="8" cy="8" r="2" />
      <circle cx="16" cy="8" r="2" />
      <circle cx="12" cy="16" r="2" />
    </svg>
  ),
  distance: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M21 7v6h-6" />
    </svg>
  ),
  photo: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h3l2-2h6l2 2h3v13H4V7z" />
      <path d="M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
    </svg>
  ),
  video: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7h12v10H3z" />
      <path d="M15 10l6-3v10l-6-3V10z" />
    </svg>
  ),
  legal: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8M8 17h6" />
    </svg>
  ),

  wifi: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M8.5 16a6 6 0 0 1 7 0" />
      <path d="M12 20h.01" />
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
    </svg>
  ),
  droplet: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2s6 6.5 6 12a6 6 0 0 1-12 0c0-5.5 6-12 6-12z" />
    </svg>
  ),
  flame: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22a7 7 0 0 0 7-7c0-2.5-1.2-4.7-3-6.2-.5 2.5-2.2 3.7-4 4.2C12.2 9.2 10 8 10 5c-3 2.6-5 5.3-5 10a7 7 0 0 0 7 7z" />
    </svg>
  ),
  snow: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v20M4 6l16 12M20 6 4 18" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  lift: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 3h10v18H7z" />
      <path d="M12 7l2 2h-4l2-2z" />
      <path d="M12 17l-2-2h4l-2 2z" />
    </svg>
  ),
  bed: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7v10" />
      <path d="M21 7v10" />
      <path d="M3 16h18" />
      <path d="M7 16V12a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4" />
      <path d="M7 10h2" />
    </svg>
  ),
  desk: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7h18" />
      <path d="M4 7v10" />
      <path d="M20 7v10" />
      <path d="M8 17v-5h8v5" />
    </svg>
  ),
  wardrobe: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 3h12v18H6z" />
      <path d="M12 3v18" />
      <path d="M10 12h.01M14 12h.01" />
    </svg>
  ),
  cart: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6h15l-1.5 9h-12z" />
      <path d="M6 6l-2-3H2" />
      <path d="M9 20h.01M18 20h.01" />
    </svg>
  ),
  bus: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 3h12a3 3 0 0 1 3 3v10H3V6a3 3 0 0 1 3-3z" />
      <path d="M7 16v3M17 16v3" />
      <path d="M5 11h14" />
      <path d="M7 7h2M15 7h2" />
    </svg>
  ),
  pharmacy: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 7V5a2 2 0 0 1 2-2h2v4" />
      <path d="M8 7h8a2 2 0 0 1 2 2v11H6V9a2 2 0 0 1 2-2z" />
      <path d="M12 10v6" />
      <path d="M9 13h6" />
    </svg>
  ),
  key: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 2l-2 2" />
      <path d="M7 14a5 5 0 1 1 4.9-6.1L21 2l1 1-5.9 9.1A5 5 0 0 1 7 14Z" />
      <path d="M16 7l2 2" />
      <path d="M14 9l2 2" />
    </svg>
  ),
  parking: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 3h6a5 5 0 0 1 0 10H7V3z" />
      <path d="M7 13v8" />
    </svg>
  ),
  microwave: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7h18v10H3V7z" />
      <path d="M7 10h6" />
      <path d="M7 13h6" />
      <path d="M18 10h.01M18 13h.01" />
    </svg>
  ),
  fridge: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 2h8v20H8V2z" />
      <path d="M8 12h8" />
      <path d="M10 6h.01M10 16h.01" />
    </svg>
  ),
  washer: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 2h12v20H6V2z" />
      <path d="M8 6h8" />
      <path d="M12 18a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
};

/* ================= Governorates (أوسع) ================= */
const EGYPT = [
  { gov: "Cairo", cities: ["Nasr City", "Heliopolis", "Maadi", "New Cairo", "Downtown", "Ain Shams", "El Abbaseya", "Shubra", "Zamalek", "Hadayek El Kobba"] },
  { gov: "Giza", cities: ["Dokki", "Mohandessin", "Faisal", "Haram", "6th of October", "Sheikh Zayed", "El Ahram", "Bulaq El Dakrour"] },
  { gov: "Alexandria", cities: ["Smouha", "Sidi Gaber", "Stanley", "Gleem", "Miami", "Mandara", "Roushdy", "Sporting"] },
  { gov: "Dakahlia", cities: ["Mansoura", "Talkha"] },
  { gov: "Sharqia", cities: ["Zagazig", "10th of Ramadan"] },
  { gov: "Gharbia", cities: ["Tanta", "El Mahalla El Kubra"] },
  { gov: "Menoufia", cities: ["Shebin El-Kom", "Sadat City"] },
  { gov: "Qalyubia", cities: ["Banha", "Shubra El Kheima"] },
  { gov: "Damietta", cities: ["Damietta", "New Damietta"] },
  { gov: "Ismailia", cities: ["Ismailia"] },
  { gov: "Suez", cities: ["Suez"] },
  { gov: "Faiyum", cities: ["Faiyum"] },
  { gov: "Beni Suef", cities: ["Beni Suef"] },
  { gov: "Minya", cities: ["Minya"] },
  { gov: "Assiut", cities: ["Assiut"] },
  { gov: "Sohag", cities: ["Sohag"] },
  { gov: "Qena", cities: ["Qena"] },
  { gov: "Luxor", cities: ["Luxor"] },
  { gov: "Aswan", cities: ["Aswan"] },
];

function SectionCard({ icon, title, children }) {
  return (
    <div className="rounded-[10px] border border-slate-200 bg-white">
      <div className="flex items-center gap-3 px-5 pt-4 pb-3">
        <div className="text-slate-700">{icon}</div>
        <div className="text-[14px] font-semibold text-slate-900">{title}</div>
      </div>
      <div className="px-5 pb-5">{children}</div>
    </div>
  );
}

function Label({ children, required }) {
  return (
    <label className="text-[12px] font-medium text-slate-700">
      {children} {required ? <span className="text-rose-500">*</span> : null}
    </label>
  );
}

const fieldBase =
  "mt-1.5 w-full h-[38px] rounded-[6px] border border-slate-300 bg-white px-3 text-[13px] text-slate-900 outline-none transition focus:border-[#2563EB]/60 focus:ring-2 focus:ring-[#2563EB]/10";

function TextInput({ value, onChange, placeholder, type = "text" }) {
  return <input type={type} value={value} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder} className={fieldBase} />;
}
function NumberInput({ value, onChange, min = 0, max = 999999, step = 1, placeholder }) {
  return (
    <input type="number" min={min} max={max} step={step} value={value} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder} className={fieldBase} />
  );
}
function TextArea({ value, onChange, placeholder }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className="mt-1.5 w-full min-h-[58px] rounded-[6px] border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-900 outline-none transition focus:border-[#2563EB]/60 focus:ring-2 focus:ring-[#2563EB]/10"
    />
  );
}

/* ✅ Fix dropdown arrow + padding (matching design) */
function SelectInput({ value, onChange, options }) {
  return (
    <div className="relative mt-1.5">
      <select value={value} onChange={(e) => onChange?.(e.target.value)} className={`${fieldBase} pr-10 appearance-none`}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
        {Ic.chevronDown}
      </span>
    </div>
  );
}

/* ============ MultiSelect with Chips + Add Other (NO SEARCH) ============ */
function MultiSelectChips({ label, required, placeholder, options, selected, onChange, allowCustom = false, customPlaceholder = "Other...", onAddCustom }) {
  const [open, setOpen] = useState(false);
  const [customText, setCustomText] = useState("");

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const selectedOptions = useMemo(() => options.filter((o) => selectedSet.has(o.value)), [options, selectedSet]);

  const toggle = (val) => {
    if (selectedSet.has(val)) onChange(selected.filter((x) => x !== val));
    else onChange([...selected, val]);
  };

  const remove = (val) => onChange(selected.filter((x) => x !== val));

  const addCustom = () => {
    const text = customText.trim();
    if (!text) return;

    const value = `custom:${text.toLowerCase().replace(/\s+/g, "_")}`;
    const exists = options.some((o) => o.value === value || o.label.toLowerCase() === text.toLowerCase());

    if (!exists) onAddCustom?.({ value, label: text, icon: Ic.plus });
    if (!selectedSet.has(value)) onChange([...selected, value]);

    setCustomText("");
  };

  return (
    <div className="relative">
      <Label required={required}>{label}</Label>

      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="mt-1.5 w-full min-h-[38px] rounded-[6px] border border-slate-300 bg-white px-3 py-2 pr-10 text-left outline-none transition focus:border-[#2563EB]/60 focus:ring-2 focus:ring-[#2563EB]/10"
      >
        <div className="flex flex-wrap items-center gap-2">
          {selectedOptions.length === 0 ? (
            <span className="text-[13px] text-slate-400">{placeholder}</span>
          ) : (
            selectedOptions.map((o) => (
              <span key={o.value} className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 text-[12px] text-slate-700">
                <span className="text-slate-600">{o.icon}</span>
                <span>{o.label}</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    remove(o.value);
                  }}
                  className="ml-1 text-slate-400 hover:text-slate-700"
                >
                  {Ic.x}
                </span>
              </span>
            ))
          )}
        </div>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{Ic.chevronDown}</span>
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-2 w-full rounded-[10px] border border-slate-200 bg-white shadow-lg overflow-hidden">
            {allowCustom ? (
              <div className="p-2 border-b border-slate-100 flex items-center gap-2">
                <input
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder={customPlaceholder}
                  className="w-full h-9 rounded-[8px] border border-slate-200 px-3 text-[13px] outline-none focus:border-[#2563EB]/60 focus:ring-2 focus:ring-[#2563EB]/10"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustom();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addCustom}
                  className="h-9 px-3 rounded-[8px] bg-[#2563EB] text-white text-[12px] font-semibold hover:bg-[#1D4ED8] inline-flex items-center gap-2"
                >
                  {Ic.plus}
                  Add
                </button>
              </div>
            ) : null}

            <div className="max-h-72 overflow-auto p-2">
              {options.map((o) => {
                const isOn = selectedSet.has(o.value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => toggle(o.value)}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-[13px] ${
                      isOn ? "bg-slate-100 text-slate-900" : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-slate-600">{o.icon}</span>
                      <span>{o.label}</span>
                    </span>
                    {isOn ? <span className="text-slate-700">{Ic.check}</span> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

/* ================= Map picker ================= */
function LocationPicker({ position, setPosition }) {
  function ClickHandler() {
    useMapEvents({
      click(e) {
        setPosition([e.latlng.lat, e.latlng.lng]);
      },
    });
    return null;
  }

  return (
    <div className="mt-3">
      <div className="text-[12px] font-medium text-slate-700 mb-2">Property Location on Map</div>

      <div className="rounded-[8px] overflow-hidden border border-slate-300 bg-white">
        <div className="h-[180px]">
          <MapContainer center={position} zoom={13} className="h-full w-full">
            <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <ClickHandler />
            <Marker
              position={position}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const ll = e.target.getLatLng();
                  setPosition([ll.lat, ll.lng]);
                },
              }}
            >
              <Popup>Selected location</Popup>
            </Marker>
          </MapContainer>
        </div>
      </div>

      <div className="mt-2 text-[11px] text-slate-500">
        Click on map to set location. ({position[0].toFixed(5)}, {position[1].toFixed(5)})
      </div>
    </div>
  );
}

/* ================= Existing Media UI (no external URLs) ================= */
function FileBadge({ name, onRemove }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[8px] border border-slate-200 bg-white px-3 py-2">
      <div className="min-w-0">
        <div className="truncate text-[13px] font-medium text-slate-800">{name}</div>
        <div className="text-[11px] text-slate-500">Existing file</div>
      </div>
      <button type="button" onClick={onRemove} className="inline-flex items-center gap-2 text-[12px] text-rose-600 hover:text-rose-700">
        {Ic.trash}
        Remove
      </button>
    </div>
  );
}

/* ===================== Page ===================== */
/**
 * Edit only (Update)
 * - بدون زر Edit فوق (حسب طلبك)
 * - بدون Search داخل الدروب بتاع الـ chips
 * - بيانات موجودة + صور موجودة (كـ أسماء ملفات + إمكانية إزالة/استبدال)
 * - بدون فراغات يمين/يسار كبيرة (full width)
 */
export default function EditProperty({ onBack, initialProperty }) {
  const handleBack = () => {
    if (typeof onBack === "function") return onBack();
    if (window.history.length > 1) return window.history.back();
  };

  const [property, setProperty] = useState(null);

  useEffect(() => {
    if (initialProperty) {
      setProperty(initialProperty);
      sessionStorage.setItem("edit_property", JSON.stringify(initialProperty));
      return;
    }
    const saved = sessionStorage.getItem("edit_property");
    if (saved) {
      try {
        setProperty(JSON.parse(saved));
      } catch {
        setProperty(null);
      }
    }
  }, [initialProperty]);

  // Basic
  const [propertyName, setPropertyName] = useState("");
  const [propertyType, setPropertyType] = useState("Apartment");
  const [bathrooms, setBathrooms] = useState("2");
  const [roomsCount, setRoomsCount] = useState("3");
  const [capacity, setCapacity] = useState("4");
  const [floor, setFloor] = useState("3");

  // Location
  const governorates = useMemo(() => EGYPT.map((x) => x.gov), []);
  const [governorate, setGovernorate] = useState("Dakahlia");
  const citiesForGov = useMemo(() => EGYPT.find((x) => x.gov === governorate)?.cities ?? [], [governorate]);
  const [city, setCity] = useState("Mansoura");

  useEffect(() => {
    if (!citiesForGov.includes(city)) setCity(citiesForGov[0] ?? "");
  }, [citiesForGov, city]);

  const [street, setStreet] = useState("El-Samaa Area");
  const [landmark, setLandmark] = useState("Mansoura University");
  const [fullAddress, setFullAddress] = useState("12 El-Samaa Street, Near Mansoura University Gate 3");
  const [position, setPosition] = useState([31.04095, 31.37847]);

  // Price
  const [priceEgp, setPriceEgp] = useState("3200");
  const [leaseTerm, setLeaseTerm] = useState("month");
  const [deposit, setDeposit] = useState("2000");

  // Facilities (more options + meaningful icons)
  const [facilitiesOptions, setFacilitiesOptions] = useState([
    { value: "wifi", label: "Wi-Fi", icon: Ic.wifi },
    { value: "ac", label: "Air Conditioning", icon: Ic.snow },
    { value: "security", label: "Security", icon: Ic.shield },
    { value: "cctv", label: "CCTV", icon: Ic.shield },
    { value: "elevator", label: "Elevator", icon: Ic.lift },
    { value: "furnished", label: "Furnished", icon: Ic.room },
    { value: "study_area", label: "Study Area", icon: Ic.desk },
    { value: "kitchen", label: "Kitchen Access", icon: Ic.microwave },
    { value: "fridge", label: "Refrigerator", icon: Ic.fridge },
    { value: "washing_machine", label: "Washing Machine", icon: Ic.washer },
    { value: "cleaning", label: "Cleaning Service", icon: Ic.dots },
    { value: "maintenance", label: "Maintenance Support", icon: Ic.bell },
    { value: "key_access", label: "Key/Access Control", icon: Ic.key },
    { value: "parking", label: "Parking", icon: Ic.parking },
  ]);
  const [facilities, setFacilities] = useState(["wifi", "security", "furnished", "kitchen"]);

  // Bills (more options)
  const [billsOptions, setBillsOptions] = useState([
    { value: "electricity", label: "Electricity", icon: Ic.bolt },
    { value: "water", label: "Water", icon: Ic.droplet },
    { value: "gas", label: "Gas", icon: Ic.flame },
    { value: "internet", label: "Internet", icon: Ic.wifi },
    { value: "maintenance_fee", label: "Maintenance Fee", icon: Ic.bills },
    { value: "building_fees", label: "Building Fees", icon: Ic.bills },
    { value: "trash_collection", label: "Waste/Trash", icon: Ic.bills },
    { value: "security_fee", label: "Security Fee", icon: Ic.shield },
  ]);
  const [bills, setBills] = useState(["electricity", "internet", "water"]);

  // Room Amenities (more options)
  const [roomAmenityOptions, setRoomAmenityOptions] = useState([
    { value: "bed", label: "Bed", icon: Ic.bed },
    { value: "desk", label: "Desk", icon: Ic.desk },
    { value: "wardrobe", label: "Wardrobe", icon: Ic.wardrobe },
    { value: "wifi_room", label: "Wi-Fi (Room)", icon: Ic.wifi },
    { value: "ac_room", label: "AC (Room)", icon: Ic.snow },
    { value: "private_bath", label: "Private Bathroom", icon: Ic.droplet },
    { value: "study_lamp", label: "Study Lamp", icon: Ic.bolt },
    { value: "curtains", label: "Curtains/Blinds", icon: Ic.room },
    { value: "mirror", label: "Mirror", icon: Ic.room },
    { value: "heater", label: "Heater", icon: Ic.flame },
  ]);

  const roomsN = Math.max(1, Math.min(20, parseInt(roomsCount || "1", 10) || 1));
  const [roomAmenities, setRoomAmenities] = useState(() => {
    const init = Array.from({ length: 3 }, () => ["bed", "wardrobe"]);
    init[0] = ["bed", "desk", "wardrobe", "wifi_room", "private_bath", "study_lamp"];
    return init;
  });

  useEffect(() => {
    setRoomAmenities((prev) => {
      const next = [...prev];
      if (next.length < roomsN) while (next.length < roomsN) next.push(["bed", "wardrobe"]);
      if (next.length > roomsN) next.length = roomsN;
      return next;
    });
  }, [roomsN]);

  // Nearby (bigger + place-appropriate)
  const [nearbyOptions, setNearbyOptions] = useState([
    { value: "supermarket", label: "Supermarket", icon: Ic.cart },
    { value: "mini_market", label: "Mini Market", icon: Ic.cart },
    { value: "pharmacy", label: "Pharmacy", icon: Ic.pharmacy },
    { value: "bus_stop", label: "Bus Stop", icon: Ic.bus },
    { value: "metro", label: "Metro Station", icon: Ic.bus },
    { value: "taxi_stand", label: "Taxi Stand", icon: Ic.bus },
    { value: "atm", label: "ATM", icon: Ic.nearby },
    { value: "bank", label: "Bank", icon: Ic.nearby },
    { value: "restaurants", label: "Restaurants", icon: Ic.nearby },
    { value: "cafes", label: "Cafes", icon: Ic.nearby },
    { value: "gym", label: "Gym", icon: Ic.nearby },
    { value: "hospital", label: "Hospital", icon: Ic.nearby },
    { value: "clinic", label: "Clinic", icon: Ic.nearby },
    { value: "bookstore", label: "Bookstore", icon: Ic.legal },
    { value: "stationery", label: "Stationery", icon: Ic.legal },
    { value: "printing", label: "Printing Center", icon: Ic.legal },
    { value: "laundry_shop", label: "Laundry Shop", icon: Ic.washer },
    { value: "co_working", label: "Co-Working Space", icon: Ic.desk },
    { value: "sports", label: "Sports Center", icon: Ic.nearby },
    { value: "park", label: "Park", icon: Ic.location },
  ]);
  const [nearby, setNearby] = useState(["supermarket", "pharmacy", "bus_stop", "printing"]);

  // Distance to University (عمود واحد)
  const [distanceKm, setDistanceKm] = useState("2.5");
  const [walkingMin, setWalkingMin] = useState("15");
  const [transportMin, setTransportMin] = useState("8");
  const [ways, setWays] = useState("Walking access");
  const [note, setNote] = useState(
    "The property is located 2.5 km from the university, with direct access via the main road. Several bus lines are available nearby."
  );

  // Existing media placeholders + new uploads (no external URLs)
  const [existingCoverName, setExistingCoverName] = useState("cover.jpg");
  const [existingPhotos, setExistingPhotos] = useState(["room-1.jpg", "room-2.jpg", "kitchen.jpg", "bathroom.jpg"]);
  const [existingVideoName, setExistingVideoName] = useState("tour.mp4");
  const [existingLeaseName, setExistingLeaseName] = useState("lease.pdf");
  const [existingDeedName, setExistingDeedName] = useState("title-deed.pdf");

  const [coverImage, setCoverImage] = useState(null);
  const [propertyPhotos, setPropertyPhotos] = useState([]);
  const [videoTour, setVideoTour] = useState(null);
  const [leaseAgreement, setLeaseAgreement] = useState(null);
  const [titleDeed, setTitleDeed] = useState(null);

  // Prefill from property object if provided
  useEffect(() => {
    if (!property) return;

    setPropertyName(property.propertyName ?? property.title ?? propertyName);
    setPropertyType(property.propertyType ?? property.type ?? propertyType);
    setBathrooms(String(property.bathrooms ?? bathrooms));
    setRoomsCount(String(property.rooms ?? roomsCount));
    setCapacity(String(property.capacity ?? capacity));
    setFloor(property.floor != null ? String(property.floor) : floor);

    setGovernorate(property.governorate ?? governorate);
    setCity(property.city ?? city);
    setStreet(property.street ?? street);
    setLandmark(property.landmark ?? landmark);
    setFullAddress(property.fullAddress ?? property.address ?? fullAddress);

    const lat = Number(property.lat ?? property.location?.lat ?? position[0]);
    const lng = Number(property.lng ?? property.location?.lng ?? position[1]);
    setPosition([lat, lng]);

    setPriceEgp(String(property.priceEgp ?? property.price ?? priceEgp));
    setLeaseTerm(property.leaseTerm ?? leaseTerm);
    setDeposit(property.deposit != null ? String(property.deposit) : deposit);

    if (Array.isArray(property.facilities)) setFacilities(property.facilities);
    if (Array.isArray(property.bills)) setBills(property.bills);
    if (Array.isArray(property.nearby)) setNearby(property.nearby);
    if (Array.isArray(property.roomFacilities)) setRoomAmenities(property.roomFacilities);

    if (property.distanceToUniversity) {
      const d = property.distanceToUniversity;
      if (d.distanceKm != null) setDistanceKm(String(d.distanceKm));
      if (d.walkingMin != null) setWalkingMin(String(d.walkingMin));
      if (d.transportMin != null) setTransportMin(String(d.transportMin));
      if (d.ways) setWays(d.ways);
      if (d.note) setNote(d.note);
    }

    // existing file names if present
    if (property.media?.coverName) setExistingCoverName(property.media.coverName);
    if (Array.isArray(property.media?.photos)) setExistingPhotos(property.media.photos);
    if (property.media?.videoName) setExistingVideoName(property.media.videoName);
    if (property.media?.leaseName) setExistingLeaseName(property.media.leaseName);
    if (property.media?.deedName) setExistingDeedName(property.media.deedName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property]);

  const submit = (e) => {
    e.preventDefault();

    const payload = {
      id: property?.id ?? null,
      basic: {
        propertyName,
        propertyType,
        bathrooms: Number(bathrooms),
        rooms: roomsN,
        capacity: Number(capacity),
        floor: floor ? Number(floor) : null,
      },
      location: { governorate, city, street, landmark, fullAddress, lat: position[0], lng: position[1] },
      price: { priceEgp: Number(priceEgp), leaseTerm, deposit: deposit ? Number(deposit) : null },
      facilities,
      bills,
      roomFacilities: roomAmenities,
      nearby,
      distanceToUniversity: {
        distanceKm: distanceKm ? Number(distanceKm) : null,
        walkingMin: walkingMin ? Number(walkingMin) : null,
        transportMin: transportMin ? Number(transportMin) : null,
        ways,
        note,
      },
      existingMedia: {
        coverName: existingCoverName,
        photos: existingPhotos,
        videoName: existingVideoName,
        leaseName: existingLeaseName,
        deedName: existingDeedName,
      },
      newFiles: { coverImage, propertyPhotos, videoTour, leaseAgreement, titleDeed },
    };

    console.log("EDIT PROPERTY PAYLOAD:", payload);
    alert("Updated. Check console payload.");
  };

  if (!property) {
    return (
      <div className="min-h-screen bg-[#F3F5F8] text-slate-900">
        <div className="w-full px-6 py-10">
          <div className="rounded-[10px] border border-slate-200 bg-white p-6">
            <div className="text-[16px] font-semibold">No property selected</div>
            <div className="mt-1 text-[12px] text-slate-500">
              Put your property JSON in sessionStorage with key: <span className="font-semibold">edit_property</span>
            </div>
            <button
              type="button"
              onClick={handleBack}
              className="mt-5 rounded-[6px] bg-[#2563EB] px-5 py-2.5 text-[12px] font-semibold text-white hover:bg-[#1D4ED8]"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F5F8] text-slate-900">
      {/* Header (no top edit button) */}
      <div className=" border-b border-slate-200">
        <div className="w-full px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex flex-col w-full">
              <div className="text-[22px] font-bold">Edit Property</div>
              <div className="text-[12px] text-slate-500 mt-1">Update the details below and save changes.</div>
            </div>

            <button
              type="button"
              onClick={handleBack}
              className="absolute right-6 mt-[2px] inline-flex items-center justify-center text-slate-500 hover:text-slate-700"
              aria-label="Back"
              title="Back"
            >
              {Ic.backTop}
            </button>
          </div>
        </div>
      </div>

      {/* Full width form (no big side spaces) */}
      <form onSubmit={submit} className="w-full px-6 py-5 space-y-5">
        <SectionCard icon={Ic.basic} title="Basic Information">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label required>Property Name</Label>
              <TextInput value={propertyName} onChange={setPropertyName} placeholder="Property name" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label required>Property Type</Label>
                <SelectInput
                  value={propertyType}
                  onChange={setPropertyType}
                  options={[
                    { value: "Apartment", label: "Apartment" },
                    { value: "Studio", label: "Studio" },
                    { value: "Shared Apartment", label: "Shared Apartment" },
                    { value: "Private Room", label: "Private Room" },
                    { value: "Shared Room", label: "Shared Room" },
                  ]}
                />
              </div>

              <div>
                <Label required>Number of bathrooms</Label>
                <NumberInput value={bathrooms} onChange={setBathrooms} min={1} max={20} placeholder="2" />
              </div>

              <div>
                <Label required>Number of Rooms</Label>
                <NumberInput value={roomsCount} onChange={setRoomsCount} min={1} max={20} placeholder="3" />
              </div>

              <div>
                <Label required>Capacity</Label>
                <NumberInput value={capacity} onChange={setCapacity} min={1} max={50} placeholder="4" />
              </div>

              <div>
                <Label>Floor</Label>
                <NumberInput value={floor} onChange={setFloor} min={0} max={200} placeholder="3" />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={Ic.location} title="Location Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label required>Governorate</Label>
              <SelectInput value={governorate} onChange={setGovernorate} options={governorates.map((g) => ({ value: g, label: g }))} />
            </div>

            <div>
              <Label required>City</Label>
              <SelectInput value={city} onChange={setCity} options={citiesForGov.map((c) => ({ value: c, label: c }))} />
            </div>

            <div>
              <Label required>Street Name</Label>
              <TextInput value={street} onChange={setStreet} placeholder="Street name" />
            </div>

            <div>
              <Label required>Nearest Landmark</Label>
              <TextInput value={landmark} onChange={setLandmark} placeholder="Nearest landmark" />
            </div>

            <div className="md:col-span-2">
              <Label required>Full Address</Label>
              <TextInput value={fullAddress} onChange={setFullAddress} placeholder="Full address" />
            </div>
          </div>

          <LocationPicker position={position} setPosition={setPosition} />
        </SectionCard>

        <SectionCard icon={Ic.price} title="Price Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label required>Price (EGP)</Label>
              <NumberInput value={priceEgp} onChange={setPriceEgp} min={0} max={1000000} placeholder="3200" />
            </div>

            <div>
              <Label required>Lease Term</Label>
              <SelectInput
                value={leaseTerm}
                onChange={setLeaseTerm}
                options={[
                  { value: "month", label: "month" },
                  { value: "semester", label: "semester" },
                  { value: "year", label: "year" },
                ]}
              />
            </div>

            <div className="md:col-span-2">
              <Label>Security Deposit</Label>
              <NumberInput value={deposit} onChange={setDeposit} min={0} max={1000000} placeholder="2000" />
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={Ic.dots} title="Facilities">
          <MultiSelectChips
            label="Facilities"
            required
            placeholder="Choose the facilities available in your property"
            options={facilitiesOptions}
            selected={facilities}
            onChange={setFacilities}
            allowCustom
            customPlaceholder="Other facility..."
            onAddCustom={(opt) => setFacilitiesOptions((prev) => [...prev, opt])}
          />
        </SectionCard>

        <SectionCard icon={Ic.bills} title="Bills Information">
          <MultiSelectChips
            label="Bills Included"
            required
            placeholder="Select included bills"
            options={billsOptions}
            selected={bills}
            onChange={setBills}
            allowCustom
            customPlaceholder="Other bill..."
            onAddCustom={(opt) => setBillsOptions((prev) => [...prev, opt])}
          />
        </SectionCard>

        <SectionCard icon={Ic.room} title="Room Facilities">
          <div className="space-y-4">
            {roomAmenities.map((sel, idx) => (
              <MultiSelectChips
                key={idx}
                label={`Room (${idx + 1})`}
                required={idx === 0}
                placeholder="Add room amenities"
                options={roomAmenityOptions}
                selected={sel}
                onChange={(next) => {
                  setRoomAmenities((prev) => {
                    const copy = [...prev];
                    copy[idx] = next;
                    return copy;
                  });
                }}
                allowCustom
                customPlaceholder="Other room amenity..."
                onAddCustom={(opt) => setRoomAmenityOptions((prev) => [...prev, opt])}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard icon={Ic.nearby} title="Nearby Facilities">
          <MultiSelectChips
            label="Nearby Facilities"
            required
            placeholder="Select nearby services and facilities"
            options={nearbyOptions}
            selected={nearby}
            onChange={setNearby}
            allowCustom
            customPlaceholder="Other nearby service..."
            onAddCustom={(opt) => setNearbyOptions((prev) => [...prev, opt])}
          />
        </SectionCard>

        <SectionCard icon={Ic.distance} title="Distance to University">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label>Distance to University (km)</Label>
              <NumberInput value={distanceKm} onChange={setDistanceKm} min={0} max={200} step={0.1} placeholder="2.5" />
            </div>

            <div>
              <Label>Walking Time (minutes)</Label>
              <NumberInput value={walkingMin} onChange={setWalkingMin} min={0} max={300} placeholder="15" />
            </div>

            <div>
              <Label required>Transportation Time (minutes)</Label>
              <NumberInput value={transportMin} onChange={setTransportMin} min={0} max={300} placeholder="8" />
            </div>

            <div>
              <Label required>Ways to reach the university</Label>
              <SelectInput
                value={ways}
                onChange={setWays}
                options={[
                  { value: "Walking access", label: "Walking access" },
                  { value: "Public transport", label: "Public transport" },
                  { value: "Taxi", label: "Taxi" },
                ]}
              />
            </div>

            <div>
              <Label>Provide details for better accuracy</Label>
              <TextArea value={note} onChange={setNote} placeholder="Notes..." />
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={Ic.photo} title="Property Photos">
          <div className="space-y-4">
            <div>
              <Label required>Set Cover Image</Label>

              <div className="mt-1.5 grid grid-cols-1 gap-3">
                {existingCoverName ? (
                  <FileBadge
                    name={existingCoverName}
                    onRemove={() => {
                      setExistingCoverName("");
                      setCoverImage(null);
                    }}
                  />
                ) : null}

                <input type="file" accept="image/*" onChange={(e) => setCoverImage(e.target.files?.[0] ?? null)} className={`${fieldBase} py-2`} />
              </div>
            </div>

            <div>
              <Label required>Upload Property Photos</Label>

              <div className="mt-1.5 grid grid-cols-1 gap-3">
                {existingPhotos.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {existingPhotos.map((n) => (
                      <FileBadge
                        key={n}
                        name={n}
                        onRemove={() => setExistingPhotos((prev) => prev.filter((x) => x !== n))}
                      />
                    ))}
                  </div>
                ) : null}

                <input type="file" multiple accept="image/*" onChange={(e) => setPropertyPhotos(Array.from(e.target.files || []))} className={`${fieldBase} py-2`} />
              </div>
            </div>

            <button
              type="button"
              className="rounded-[6px] bg-[#2563EB] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#1D4ED8]"
              onClick={() => alert("Connect upload to your API")}
            >
              Upload
            </button>
          </div>
        </SectionCard>

        <SectionCard icon={Ic.video} title="Video Tour (Optional)">
          <div className="space-y-3">
            <div>
              <Label>Add Video Tour</Label>

              <div className="mt-1.5 grid grid-cols-1 gap-3">
                {existingVideoName ? (
                  <FileBadge
                    name={existingVideoName}
                    onRemove={() => {
                      setExistingVideoName("");
                      setVideoTour(null);
                    }}
                  />
                ) : null}

                <input type="file" accept="video/*" onChange={(e) => setVideoTour(e.target.files?.[0] ?? null)} className={`${fieldBase} py-2`} />
              </div>
            </div>

            <button
              type="button"
              className="rounded-[6px] bg-[#2563EB] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#1D4ED8]"
              onClick={() => alert("Connect upload to your API")}
            >
              Upload
            </button>
          </div>
        </SectionCard>

        <SectionCard icon={Ic.legal} title="Legal Information">
          <div className="space-y-4">
            <div>
              <Label required>Lease Agreement (Contract)</Label>

              <div className="mt-1.5 grid grid-cols-1 gap-3">
                {existingLeaseName ? (
                  <FileBadge
                    name={existingLeaseName}
                    onRemove={() => {
                      setExistingLeaseName("");
                      setLeaseAgreement(null);
                    }}
                  />
                ) : null}

                <input type="file" accept=".pdf,image/*" onChange={(e) => setLeaseAgreement(e.target.files?.[0] ?? null)} className={`${fieldBase} py-2`} />
              </div>
            </div>

            <div>
              <Label required>Ownership Deed (Title Deed)</Label>

              <div className="mt-1.5 grid grid-cols-1 gap-3">
                {existingDeedName ? (
                  <FileBadge
                    name={existingDeedName}
                    onRemove={() => {
                      setExistingDeedName("");
                      setTitleDeed(null);
                    }}
                  />
                ) : null}

                <input type="file" accept=".pdf,image/*" onChange={(e) => setTitleDeed(e.target.files?.[0] ?? null)} className={`${fieldBase} py-2`} />
              </div>
            </div>

            <button
              type="button"
              className="rounded-[6px] bg-[#2563EB] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#1D4ED8]"
              onClick={() => alert("Connect upload to your API")}
            >
              Upload
            </button>
          </div>
        </SectionCard>

        {/* زر Edit (فقط تحت) */}
        <div className="pt-1">
          <button type="submit" className="rounded-[6px] bg-[#2563EB] px-5 py-2.5 text-[12px] font-semibold text-white hover:bg-[#1D4ED8]">
            Edit
          </button>
        </div>
      </form>
    </div>
  );
}
