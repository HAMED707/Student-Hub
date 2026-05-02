import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Star,
  StarHalf,
  ShieldCheck,
  FileText,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Pencil,
  Eye,
  LogOut,
  Settings,
  X,
  CalendarDays,
  Users,
  CreditCard,
  Home,
  AlertTriangle,
  BedDouble,
} from "lucide-react";

/**
 * ✅ OwnerProfile (ONE FILE)
 * - لا تغيير في عرض الشقق Available (الكروت كما هي)
 * - Booked Details (Modal): تفاصيل مهمة + توزيع غرف/أسِرّة + الطلاب بدون رقم هاتف
 * - منع اختلاط الأولاد والبنات: تحذير واضح لو حدث
 * - Edit Profile داخل نفس الصفحة (Modal)
 * - Booked: بدون Edit نهائيًا
 */

const cx = (...c) => c.filter(Boolean).join(" ");

const COLORS = {
  pageBg: "#F3F6FB",
  cardBorder: "#E7ECF5",
  primary: "#0B5ED7",
};

function useLockBodyScroll(locked) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev);
  }, [locked]);
}

function fmtDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "2-digit" });
}

function calcMonthsOrDays(from, to) {
  if (!from || !to) return "-";
  const a = new Date(from);
  const b = new Date(to);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return "-";
  const diffDays = Math.max(0, Math.round((b - a) / (1000 * 60 * 60 * 24)));
  const months = Math.round(diffDays / 30);
  return months >= 1 ? `${months} month(s)` : `${diffDays} day(s)`;
}

function normalizeGender(g) {
  if (!g) return "Unknown";
  const x = String(g).toLowerCase();
  if (x.startsWith("m")) return "Male";
  if (x.startsWith("f")) return "Female";
  return "Unknown";
}

function genderPill(g) {
  const gg = normalizeGender(g);
  if (gg === "Male") return { text: "Male", cls: "bg-blue-50 text-blue-700 border-blue-200" };
  if (gg === "Female") return { text: "Female", cls: "bg-pink-50 text-pink-700 border-pink-200" };
  return { text: "Unknown", cls: "bg-slate-50 text-slate-700 border-slate-200" };
}

/* -------------------- UI -------------------- */

function Card({ title, right, children, className }) {
  return (
    <div className={cx("rounded-xl bg-white border", className)} style={{ borderColor: COLORS.cardBorder }}>
      {title ? (
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: COLORS.cardBorder }}>
          <div className="text-[14px] font-semibold text-slate-900">{title}</div>
          {right ? <div>{right}</div> : null}
        </div>
      ) : null}
      <div className={cx(title ? "px-5 py-5" : "p-5")}>{children}</div>
    </div>
  );
}

function InfoField({ icon, label, value }) {
  return (
    <div>
      <div className="text-[11px] text-slate-600 mb-1">{label}</div>
      <div className="h-10 rounded-md border bg-white px-3 flex items-center gap-2" style={{ borderColor: COLORS.cardBorder }}>
        <span className="text-slate-500">{icon}</span>
        <div className="text-[12px] font-medium text-slate-800 truncate">{value}</div>
      </div>
    </div>
  );
}

function Input({ label, icon, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <div className="text-[11px] text-slate-600 mb-1">{label}</div>
      <div className="h-10 rounded-md border bg-white px-3 flex items-center gap-2" style={{ borderColor: COLORS.cardBorder }}>
        <span className="text-slate-500">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-full w-full bg-transparent outline-none text-[12px] text-slate-900 placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder }) {
  return (
    <div>
      <div className="text-[11px] text-slate-600 mb-1">{label}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[120px] w-full rounded-md border bg-white px-3 py-3 outline-none text-[12px] text-slate-900 placeholder:text-slate-400"
        style={{ borderColor: COLORS.cardBorder }}
      />
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="text-[12px] text-slate-600">{label}</div>
      <div className="text-[12px] font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function Stars({ value }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f${i}`} className="h-4 w-4 text-amber-500 fill-amber-500" />
      ))}
      {half ? <StarHalf className="h-4 w-4 text-amber-500 fill-amber-500" /> : null}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e${i}`} className="h-4 w-4 text-slate-300" />
      ))}
      <span className="ml-2 text-[12px] font-semibold text-slate-800">{value.toFixed(1)}</span>
    </div>
  );
}

function ReviewCard({ review, active }) {
  return (
    <div
      className={cx(
        "min-w-[360px] max-w-[360px] rounded-xl px-5 py-5 transition border",
        active ? "bg-[#2F6FED] text-white border-transparent" : "bg-white text-slate-800"
      )}
      style={{
        borderColor: active ? "transparent" : COLORS.cardBorder,
        boxShadow: active ? "0 18px 40px rgba(11,94,215,0.18)" : "none",
      }}
    >
      <div className={cx("text-[13px] leading-relaxed", active ? "text-white/95" : "text-slate-700")}>{review.text}</div>

      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cx("h-9 w-9 rounded-full flex items-center justify-center text-[12px] font-bold", active ? "bg-white/15" : "bg-slate-50 border")}
            style={!active ? { borderColor: COLORS.cardBorder } : undefined}
          >
            {review.authorInitials}
          </div>
          <div>
            <div className={cx("text-[12px] font-semibold", active ? "text-white" : "text-slate-900")}>{review.author}</div>
            <div className={cx("text-[11px]", active ? "text-white/80" : "text-slate-500")}>{review.role}</div>
          </div>
        </div>

        <div className={cx("text-[11px] font-semibold", active ? "text-white/80" : "text-slate-500")}>{review.date}</div>
      </div>
    </div>
  );
}

function InfoCell({ icon, label, value }) {
  return (
    <div className="col-span-12 sm:col-span-6 lg:col-span-4 rounded-xl border p-3" style={{ borderColor: COLORS.cardBorder }}>
      <div className="text-[11px] text-slate-500 mb-1 flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-[13px] font-semibold text-slate-900">{value}</div>
    </div>
  );
}

/* -------------------- Booked Layout: Rooms/Beds -------------------- */

function BedCard({ roomLabel, bedLabel, student, from, to, paymentStatus }) {
  const g = genderPill(student?.gender);
  return (
    <div className="rounded-xl border p-4 bg-white" style={{ borderColor: COLORS.cardBorder }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[12px] text-slate-500 flex items-center gap-2">
            <BedDouble className="h-4 w-4" />
            <span className="font-semibold text-slate-700">
              {roomLabel} • {bedLabel}
            </span>
          </div>
          <div className="mt-1 text-[14px] font-extrabold text-slate-900 truncate">{student?.name || "-"}</div>
          <div className="mt-1 text-[12px] text-slate-600 truncate">{student?.university || "-"}</div>
        </div>

        <span className={cx("inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-semibold", g.cls)}>
          {g.text}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border px-3 py-2" style={{ borderColor: COLORS.cardBorder }}>
          <div className="text-[11px] text-slate-500">From</div>
          <div className="text-[12px] font-semibold text-slate-900">{fmtDate(from)}</div>
        </div>
        <div className="rounded-lg border px-3 py-2" style={{ borderColor: COLORS.cardBorder }}>
          <div className="text-[11px] text-slate-500">To</div>
          <div className="text-[12px] font-semibold text-slate-900">{fmtDate(to)}</div>
        </div>
        <div className="rounded-lg border px-3 py-2 col-span-2" style={{ borderColor: COLORS.cardBorder }}>
          <div className="text-[11px] text-slate-500">Payment</div>
          <div className="text-[12px] font-semibold text-slate-900">{paymentStatus || "-"}</div>
        </div>
      </div>
    </div>
  );
}

function RoomsSection({ booking }) {
  const rooms = booking?.rooms || [];

  // collect genders across all beds
  const genders = [];
  rooms.forEach((r) => (r.beds || []).forEach((b) => genders.push(normalizeGender(b?.student?.gender))));
  const unique = Array.from(new Set(genders.filter((g) => g !== "Unknown")));
  const mixed = unique.length > 1;

  return (
    <div className="mt-5">
      {mixed ? (
        <div className="mb-4 rounded-xl border px-4 py-3 bg-red-50 text-red-700 flex items-start gap-3" style={{ borderColor: "#FECACA" }}>
          <AlertTriangle className="h-5 w-5 mt-0.5" />
          <div>
            <div className="text-[13px] font-extrabold">Not allowed: mixed genders</div>
            <div className="text-[12px] text-red-700/90">
              لا يمكن أن يكون أولاد وبنات مع بعض داخل نفس السكن. يرجى فصل الحجز أو تعديل توزيع الغرف/الأسرة.
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-5">
        {rooms.map((room) => {
          const roomGender = genderPill(room?.gender);
          return (
            <div key={room.id || room.label} className="rounded-2xl border p-5" style={{ borderColor: COLORS.cardBorder }}>
              <div className="flex items-center justify-between gap-3">
                <div className="text-[15px] font-extrabold text-slate-900">
                  {room?.label || "Room"}{" "}
                  <span className="text-[12px] font-semibold text-slate-500">
                    ({(room?.beds || []).length} bed(s))
                  </span>
                </div>

                <span className={cx("inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-semibold", roomGender.cls)}>
                  {roomGender.text}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {(room?.beds || []).map((bed) => (
                  <BedCard
                    key={bed.id || bed.label}
                    roomLabel={room?.label || "Room"}
                    bedLabel={bed?.label || "Bed"}
                    student={bed?.student}
                    from={bed?.from || booking?.from}
                    to={bed?.to || booking?.to}
                    paymentStatus={bed?.paymentStatus || booking?.paymentStatus}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------- Modals -------------------- */

function PropertyDetailsModal({ open, onClose, property, onEditClick }) {
  if (!open) return null;

  const isBooked = property?.status === "Booked";

  // IMPORTANT: الطلاب الآن من beds داخل rooms
  const rooms = property?.booking?.rooms || [];
  const allStudents = [];
  rooms.forEach((r) => (r.beds || []).forEach((b) => b?.student && allStudents.push(b.student)));

  const payment = property?.booking?.paymentStatus || "-";
  const duration = calcMonthsOrDays(property?.booking?.from, property?.booking?.to);

  const title = property?.title || "Property Details";
  const address = property?.address || `${property?.city || ""}${property?.area ? `, ${property.area}` : ""}`;

  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-[980px] max-h-[90vh] rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b flex items-start justify-between" style={{ borderColor: COLORS.cardBorder }}>
            <div className="min-w-0">
              <div className="text-[22px] font-extrabold text-slate-900 truncate">{title}</div>
              <div className="mt-1 flex items-center gap-2 text-[13px] text-slate-600">
                <MapPin className="h-4 w-4" />
                <span className="truncate">{address}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 rounded-full hover:bg-slate-100 flex items-center justify-center"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-slate-700" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto">
            {/* Property summary */}
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 md:col-span-4">
                <div className="rounded-xl border p-4" style={{ borderColor: COLORS.cardBorder }}>
                  <div className="text-[12px] text-slate-500 mb-1 flex items-center gap-2">
                    <Home className="h-4 w-4" /> Type
                  </div>
                  <div className="text-[14px] font-bold text-slate-900">{property?.type || "-"}</div>
                </div>
              </div>

              <div className="col-span-12 md:col-span-4">
                <div className="rounded-xl border p-4" style={{ borderColor: COLORS.cardBorder }}>
                  <div className="text-[12px] text-slate-500 mb-1 flex items-center gap-2">
                    <Users className="h-4 w-4" /> Rooms
                  </div>
                  <div className="text-[14px] font-bold text-slate-900">{property?.rooms ?? "-"}</div>
                </div>
              </div>

              <div className="col-span-12 md:col-span-4">
                <div className="rounded-xl border p-4" style={{ borderColor: COLORS.cardBorder }}>
                  <div className="text-[12px] text-slate-500 mb-1 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" /> Price / month
                  </div>
                  <div className="text-[14px] font-bold text-slate-900">EGP {property?.price ?? "-"}</div>
                </div>
              </div>
            </div>

            {/* Booking details */}
            <div className="mt-6 rounded-2xl border p-5" style={{ borderColor: COLORS.cardBorder }}>
              <div className="flex items-center justify-between gap-3">
                <div className="text-[16px] font-extrabold text-slate-900">Booking Details</div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={cx(
                      "inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-semibold",
                      isBooked ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    )}
                  >
                    {property?.status}
                  </span>

                  {isBooked && (
                    <span
                      className={cx(
                        "inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-semibold",
                        payment === "Paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                      )}
                    >
                      Payment: {payment}
                    </span>
                  )}

                  {isBooked && (
                    <span className="inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-semibold bg-slate-50 text-slate-700 border-slate-200">
                      Students: {allStudents.length}
                    </span>
                  )}
                </div>
              </div>

              {!isBooked ? (
                <div className="mt-3 text-[12px] text-slate-600">No active booking for this property.</div>
              ) : (
                <>
                  <div className="mt-4 grid grid-cols-12 gap-3">
                    <InfoCell icon={<CalendarDays className="h-4 w-4" />} label="Booking Date" value={fmtDate(property?.booking?.bookingDate)} />
                    <InfoCell icon={<CalendarDays className="h-4 w-4" />} label="From" value={fmtDate(property?.booking?.from)} />
                    <InfoCell icon={<CalendarDays className="h-4 w-4" />} label="To" value={fmtDate(property?.booking?.to)} />
                    <InfoCell icon={<Clock className="h-4 w-4" />} label="Duration" value={duration} />
                    <InfoCell icon={<Users className="h-4 w-4" />} label="Rooms in booking" value={rooms.length || 0} />
                    <InfoCell icon={<BedDouble className="h-4 w-4" />} label="Total beds" value={rooms.reduce((acc, r) => acc + (r.beds?.length || 0), 0)} />
                  </div>

                  {/* ✅ Rooms/Beds/Students (بدون تليفون) */}
                  <RoomsSection booking={property?.booking} />
                </>
              )}
            </div>

            {property?.description ? (
              <div className="mt-6 rounded-2xl border p-5" style={{ borderColor: COLORS.cardBorder }}>
                <div className="text-[14px] font-extrabold text-slate-900 mb-2">Description</div>
                <div className="text-[12px] text-slate-600 whitespace-pre-line leading-relaxed">{property.description}</div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="px-6 py-5 border-t flex items-center justify-between" style={{ borderColor: COLORS.cardBorder }}>
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-5 rounded-md border text-[12px] font-semibold hover:bg-slate-50"
              style={{ borderColor: COLORS.cardBorder }}
            >
              Close
            </button>

            {/* ✅ Edit فقط Available — Booked ممنوع */}
            {!isBooked ? (
              <button
                type="button"
                onClick={onEditClick}
                className="h-10 px-8 rounded-md text-white text-[12px] font-semibold hover:opacity-95"
                style={{ backgroundColor: COLORS.primary }}
              >
                Edit
              </button>
            ) : (
              <div className="text-[12px] text-slate-500">Booked properties cannot be edited.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EditProfileModal({ open, onClose, owner, onSave }) {
  if (!open) return null;

  const [name, setName] = useState(owner?.name || "");
  const [email, setEmail] = useState(owner?.email || "");
  const [about, setAbout] = useState(owner?.about || "");
  const [contactEmail, setContactEmail] = useState(owner?.contact?.email || "");
  const [phone, setPhone] = useState(owner?.contact?.phone || "");
  const [location, setLocation] = useState(owner?.contact?.location || "");
  const [responseTime, setResponseTime] = useState(owner?.contact?.responseTime || "");

  useEffect(() => {
    setName(owner?.name || "");
    setEmail(owner?.email || "");
    setAbout(owner?.about || "");
    setContactEmail(owner?.contact?.email || "");
    setPhone(owner?.contact?.phone || "");
    setLocation(owner?.contact?.location || "");
    setResponseTime(owner?.contact?.responseTime || "");
  }, [owner]);

  const handleSubmit = () => {
    onSave({
      ...owner,
      name,
      email,
      about,
      contact: {
        ...owner.contact,
        email: contactEmail,
        phone,
        location,
        responseTime,
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-[860px] rounded-2xl bg-white shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: COLORS.cardBorder }}>
            <div>
              <div className="text-[18px] font-extrabold text-slate-900">Edit Profile</div>
              <div className="text-[12px] text-slate-500">Update your info (اربط API بعدين).</div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 rounded-full border hover:bg-slate-50 flex items-center justify-center"
              style={{ borderColor: COLORS.cardBorder }}
            >
              <X className="h-5 w-5 text-slate-700" />
            </button>
          </div>

          <div className="px-6 py-6 grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-6 space-y-4">
              <Input label="Name" icon={<Users className="h-4 w-4" />} value={name} onChange={setName} placeholder="Owner name" />
              <Input label="Account Email" icon={<Mail className="h-4 w-4" />} value={email} onChange={setEmail} placeholder="Account email" />
              <TextArea label="About" value={about} onChange={setAbout} placeholder="Write about you..." />
            </div>

            <div className="col-span-12 md:col-span-6 space-y-4">
              <Input label="Contact Email" icon={<Mail className="h-4 w-4" />} value={contactEmail} onChange={setContactEmail} placeholder="Contact email" />
              <Input label="Phone" icon={<Phone className="h-4 w-4" />} value={phone} onChange={setPhone} placeholder="+20..." />
              <Input label="Location" icon={<MapPin className="h-4 w-4" />} value={location} onChange={setLocation} placeholder="City, Area" />
              <Input label="Response Time" icon={<Clock className="h-4 w-4" />} value={responseTime} onChange={setResponseTime} placeholder="Usually responds within..." />
            </div>
          </div>

          <div className="px-6 py-5 border-t flex items-center justify-end gap-2" style={{ borderColor: COLORS.cardBorder }}>
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-5 rounded-md border text-[12px] font-semibold hover:bg-slate-50"
              style={{ borderColor: COLORS.cardBorder }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className="h-10 px-5 rounded-md text-white text-[12px] font-semibold hover:opacity-95"
              style={{ backgroundColor: COLORS.primary }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Page -------------------- */

export default function OwnerProfile() {
  const navigate = useNavigate();

  const initialOwner = useMemo(
    () => ({
      name: "Mathew Perry",
      email: "mathewperry@xyz.com",
      avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=256&q=80",
      about:
        "I have been hosting students for more than 5 years, offering well-managed properties designed specifically for student needs.\nMy focus is on safety, comfort, and great communication. I always try to help new students adapt to the area and find the environment that suits them best.",
      contact: {
        email: "kilanijames@gmail.com",
        phone: "+201156904878",
        location: "Nasr City, Cairo",
        responseTime: "Usually responds within 1 hour",
      },
      stats: {
        rating: 2.5,
        properties: 8,
        availableRooms: 7,
        reviews: 34,
        responseRate: "97%",
        avgResponseTime: "1 hour",
      },
      verification: {
        identity: "Verified",
        ownership: "Verified",
        email: "Verified",
      },
      badge: {
        title: "Trusted Owner",
        verifiedAt: "2024-11-02",
      },
    }),
    []
  );

  const [owner, setOwner] = useState(initialOwner);

  // ✅ الداتا التجريبية الآن فيها booking.rooms.beds.students مع gender
  const properties = useMemo(
    () => [
      // Available (لا نغير شكل العرض)
      {
        id: "p1",
        title: "Shared Room - Nasr City",
        city: "Cairo",
        area: "Nasr City",
        address: "Khalifa Al Maamoun Street, Abbasiya, Cairo",
        price: 4500,
        status: "Available",
        type: "Apartment",
        rooms: 2,
        description: "Clean furnished apartment.\nClose to transportation.\nSuitable for students.",
      },

      // Booked (تفاصيل غرف/أسرة)
      {
        id: "p2",
        title: "Furnished Apartment - El Hamra (2 Rooms)",
        city: "Cairo",
        area: "El Hamra",
        address: "El Hamra, Cairo",
        price: 3500,
        status: "Booked",
        type: "Apartment",
        rooms: 2,
        description: "Booked property.\nOwner provides maintenance.\nQuiet neighborhood.",
        booking: {
          bookingDate: "2026-02-10",
          from: "2026-03-01",
          to: "2026-06-01",
          paymentStatus: "Paid",
          // ممنوع اختلاط -> هنا كلهم Male
          rooms: [
            {
              id: "r1",
              label: "Room 1",
              gender: "Male",
              beds: [
                {
                  id: "b1",
                  label: "Bed A",
                  from: "2026-03-01",
                  to: "2026-06-01",
                  paymentStatus: "Paid",
                  student: { id: "s1", name: "Ahmed Ali", university: "Cairo University", gender: "Male" },
                },
              ],
            },
            {
              id: "r2",
              label: "Room 2",
              gender: "Male",
              beds: [
                {
                  id: "b2",
                  label: "Bed A",
                  from: "2026-03-05",
                  to: "2026-06-01",
                  paymentStatus: "Paid",
                  student: { id: "s2", name: "Omar Hassan", university: "Helwan University", gender: "Male" },
                },
              ],
            },
          ],
        },
      },

      // Booked مثال ثاني (Room 1 فقط)
      {
        id: "p3",
        title: "Shared Room - Heliopolis",
        city: "Cairo",
        area: "Heliopolis",
        address: "Heliopolis, Cairo",
        price: 5200,
        status: "Booked",
        type: "Room",
        rooms: 1,
        description: "Shared room.\nGood internet.\nNear services.",
        booking: {
          bookingDate: "2026-01-28",
          from: "2026-02-01",
          to: "2026-05-01",
          paymentStatus: "Pending",
          // مثال Female فقط
          rooms: [
            {
              id: "r3",
              label: "Unit 1",
              gender: "Female",
              beds: [
                {
                  id: "b3",
                  label: "Bed B",
                  from: "2026-02-01",
                  to: "2026-05-01",
                  paymentStatus: "Pending",
                  student: { id: "s3", name: "Sara Mohamed", university: "Ain Shams University", gender: "Female" },
                },
              ],
            },
          ],
        },
      },

      // Available
      {
        id: "p4",
        title: "Private Room - Smouha",
        city: "Alexandria",
        area: "Smouha",
        address: "Smouha, Alexandria",
        price: 4000,
        status: "Available",
        type: "Room",
        rooms: 1,
        description: "Private room.\nNice view.\nSafe area.",
      },
    ],
    []
  );

  const reviews = useMemo(
    () => [
      { id: "r1", text: "Lorem ipsum is simply dummy text of the printing and typesetting industry.", author: "Kim Ihone", authorInitials: "KI", role: "CEO of joyhome", date: "2 days ago" },
      { id: "r2", text: "Lorem ipsum has been the industry's standard dummy text ever since the 1500s.", author: "Ruri Kylia", authorInitials: "RK", role: "CEO of joyhome", date: "1 week ago" },
      { id: "r3", text: "Good experience overall and smooth communication.", author: "Omar H.", authorInitials: "OH", role: "Student", date: "3 weeks ago" },
    ],
    []
  );

  const [docsOpen, setDocsOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  useLockBodyScroll(docsOpen || detailsOpen || editProfileOpen);

  useEffect(() => {
    const onEsc = (e) => {
      if (e.key !== "Escape") return;
      setMoreOpen(false);
      setDetailsOpen(false);
      setDocsOpen(false);
      setEditProfileOpen(false);
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (!moreOpen) return;
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [moreOpen]);

  const [activeReview, setActiveReview] = useState(0);
  const trackRef = useRef(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = 360;
    const gap = 16;
    el.scrollTo({ left: activeReview * (cardWidth + gap), behavior: "smooth" });
  }, [activeReview]);

  const [tab, setTab] = useState("available");
  const availableList = useMemo(() => properties.filter((p) => p.status === "Available"), [properties]);
  const bookedList = useMemo(() => properties.filter((p) => p.status === "Booked"), [properties]);

  const handleBack = () => (window.history.length > 1 ? navigate(-1) : navigate("/owner/overview"));

  const handleSettings = () => {
    setMoreOpen(false);
    navigate("/owner/settings");
  };

  const handleLogout = () => {
    setMoreOpen(false);
    navigate("/login");
  };

  const handleViewDetails = (p) => {
    setSelectedProperty(p);
    setDetailsOpen(true);
  };

  const handleEditProperty = (id) => {
    setDetailsOpen(false);
    navigate(`/owner/properties/edit/${id}`);
  };

  return (
    <div className="min-h-screen w-full" style={{ background: COLORS.pageBg }}>
      <div className="w-full max-w-[1240px] mx-auto px-6 py-6">
        {/* Banner + Profile header */}
        <div className="relative">
          <div className="h-[140px] w-full rounded-xl bg-gradient-to-r from-fuchsia-500 via-sky-500 to-indigo-500" />

          <div className="-mt-[44px]">
            <div className="rounded-xl bg-white border" style={{ borderColor: COLORS.cardBorder }}>
              <div className="px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-[64px] w-[64px] rounded-full bg-white border overflow-hidden" style={{ borderColor: COLORS.cardBorder }}>
                    <img src={owner.avatar} alt="" className="h-full w-full object-cover" />
                  </div>

                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold text-slate-900">{owner.name}</div>
                    <div className="text-[12px] text-slate-500 truncate">{owner.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 relative" ref={moreRef}>
                  <button
                    type="button"
                    onClick={() => setEditProfileOpen(true)}
                    className="h-9 px-4 rounded-md text-white text-[12px] font-semibold inline-flex items-center gap-2 hover:opacity-95"
                    style={{ backgroundColor: COLORS.primary }}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit Profile
                  </button>

                  <button
                    type="button"
                    onClick={() => setMoreOpen((v) => !v)}
                    className="h-9 w-9 rounded-md border hover:bg-slate-50 flex items-center justify-center"
                    style={{ borderColor: COLORS.cardBorder }}
                    aria-label="More"
                  >
                    <MoreVertical className="h-5 w-5 text-slate-700" />
                  </button>

                  {moreOpen && (
                    <div className="absolute right-0 top-11 w-56 rounded-xl bg-white border shadow-lg p-2 z-50" style={{ borderColor: COLORS.cardBorder }}>
                      <button
                        type="button"
                        onClick={handleSettings}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-slate-700 hover:bg-slate-50 transition"
                      >
                        <Settings className="h-4 w-4 text-slate-500" />
                        <span className="text-[13px] font-semibold">Settings</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-red-600 hover:bg-red-50 transition"
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="text-[13px] font-semibold">Logout</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleBack}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-slate-700 hover:bg-slate-50 transition"
                      >
                        <ChevronLeft className="h-4 w-4 text-slate-500" />
                        <span className="text-[13px] font-semibold">Back</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="h-px w-full" style={{ backgroundColor: COLORS.cardBorder }} />
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-12 gap-6 mt-6">
          {/* Left */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <Card title="About">
              <div className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-line">{owner.about}</div>
            </Card>

            <Card title="Contact Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField icon={<Mail className="h-4 w-4" />} label="Email" value={owner.contact.email} />
                <InfoField icon={<Phone className="h-4 w-4" />} label="Phone Number" value={owner.contact.phone} />
                <InfoField icon={<MapPin className="h-4 w-4" />} label="Location" value={owner.contact.location} />
                <InfoField icon={<Clock className="h-4 w-4" />} label="Response Time" value={owner.contact.responseTime} />
              </div>
            </Card>

            {/* Properties */}
            <Card
              title="Properties"
              right={
                <div className="flex items-center gap-2">
                  <div className="text-[12px] text-slate-500 mr-2">{properties.length} listings</div>
                  <button
                    type="button"
                    onClick={() => setTab("available")}
                    className={cx(
                      "h-8 px-3 rounded-md text-[12px] font-semibold border",
                      tab === "available" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    Available
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("booked")}
                    className={cx(
                      "h-8 px-3 rounded-md text-[12px] font-semibold border",
                      tab === "booked" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    Booked
                  </button>
                </div>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {(tab === "available" ? availableList : bookedList).slice(0, 4).map((p) => {
                  const isBooked = p.status === "Booked";

                  // booked quick summary from rooms/beds
                  const bedsCount = (p.booking?.rooms || []).reduce((acc, r) => acc + (r.beds?.length || 0), 0);

                  return (
                    <div key={p.id} className="rounded-xl border overflow-hidden bg-white" style={{ borderColor: COLORS.cardBorder }}>
                      <div className="px-4 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold text-slate-900 line-clamp-1">{p.title}</div>
                            <div className="mt-1 text-[11px] text-slate-500">
                              {p.city} - {p.area}
                            </div>
                          </div>

                          <span
                            className={cx(
                              "rounded-full px-3 py-1 text-[11px] font-semibold",
                              isBooked ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                            )}
                          >
                            {p.status}
                          </span>
                        </div>

                        <div className="mt-2 text-[12px] text-slate-700">
                          Price: <span className="font-semibold text-slate-900">EGP {p.price}</span>
                        </div>

                        {/* ✅ لا تغيّر شكل عرض Available */}
                        {/* ✅ Booked quick info بسيط */}
                        {isBooked ? (
                          <div className="mt-3 rounded-lg border bg-amber-50/30 p-3 text-[12px]" style={{ borderColor: COLORS.cardBorder }}>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600">From</span>
                              <span className="font-semibold text-slate-900">{fmtDate(p.booking?.from)}</span>
                            </div>
                            <div className="mt-1 flex items-center justify-between">
                              <span className="text-slate-600">To</span>
                              <span className="font-semibold text-slate-900">{fmtDate(p.booking?.to)}</span>
                            </div>
                            <div className="mt-1 flex items-center justify-between">
                              <span className="text-slate-600">Beds</span>
                              <span className="font-semibold text-slate-900">{bedsCount}</span>
                            </div>
                            <div className="mt-1 flex items-center justify-between">
                              <span className="text-slate-600">Payment</span>
                              <span className="font-semibold text-slate-900">{p.booking?.paymentStatus || "-"}</span>
                            </div>
                          </div>
                        ) : null}

                        <div className="mt-4 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedProperty(p) || setDetailsOpen(true)}
                            className="h-9 flex-1 rounded-full border text-[12px] font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center justify-center gap-2"
                            style={{ borderColor: COLORS.cardBorder }}
                          >
                            <Eye className="h-4 w-4" />
                            View Details
                          </button>

                          {/* ✅ Edit فقط Available */}
                          {!isBooked ? (
                            <button
                              type="button"
                              onClick={() => handleEditProperty(Settings)}
                              className="h-9 flex-1 rounded-full text-[12px] font-semibold text-white hover:opacity-95"
                              style={{ backgroundColor: COLORS.primary }}
                            >
                              Edit
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Reviews */}
            <Card title="Student Reviews" right={<span className="text-[12px] text-slate-500">{owner.stats.reviews} total</span>} className="overflow-hidden">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveReview((v) => Math.max(0, v - 1))}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white border flex items-center justify-center hover:bg-slate-50"
                  style={{ borderColor: COLORS.cardBorder }}
                  aria-label="Prev"
                >
                  <ChevronLeft className="h-5 w-5 text-slate-800" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveReview((v) => Math.min(reviews.length - 1, v + 1))}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white border flex items-center justify-center hover:bg-slate-50"
                  style={{ borderColor: COLORS.cardBorder }}
                  aria-label="Next"
                >
                  <ChevronRight className="h-5 w-5 text-slate-800" />
                </button>

                <div ref={trackRef} className="flex gap-4 overflow-x-auto scroll-smooth px-12" style={{ scrollbarWidth: "none" }}>
                  {reviews.map((r, idx) => (
                    <ReviewCard key={r.id} review={r} active={idx === activeReview} />
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-center gap-2">
                  {reviews.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveReview(i)}
                      className={cx("h-2 w-2 rounded-full transition", i === activeReview ? "bg-[#0B5ED7]" : "bg-slate-300")}
                      aria-label={`Go to review ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </Card>

            {/* Badge */}
            <Card title="Verification & Owner Badge">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="text-[12px] text-slate-600">This owner has completed identity and ownership verification.</div>
                  <div className="space-y-1 text-[12px]">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-700 font-semibold">Identity:</span>
                      <span className="text-emerald-700 font-semibold">Verified</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-700 font-semibold">Ownership:</span>
                      <span className="text-emerald-700 font-semibold">Verified</span>
                    </div>
                    <div className="text-[11px] text-slate-500">Verified at: {owner.badge.verifiedAt}</div>
                  </div>
                </div>

                <span className="inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  {owner.badge.title}
                </span>
              </div>
            </Card>
          </div>

          {/* Right */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <Card title="Owner Statistics">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[12px] text-slate-600">Avg. Rating :</div>
                <Stars value={owner.stats.rating} />
              </div>

              <div className="border-t pt-3" style={{ borderColor: COLORS.cardBorder }}>
                <StatRow label="Properties :" value={owner.stats.properties} />
                <StatRow label="Available Rooms :" value={owner.stats.availableRooms} />
                <StatRow label="Reviews :" value={owner.stats.reviews} />
                <StatRow label="Response Rate :" value={owner.stats.responseRate} />
                <StatRow label="Avg. response time :" value={owner.stats.avgResponseTime} />
              </div>
            </Card>

            <Card
              title="Verification"
              right={
                <button
                  type="button"
                  onClick={() => setDocsOpen(true)}
                  className="text-[12px] font-semibold text-slate-700 hover:text-slate-900 inline-flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  View Documents
                </button>
              }
            >
              <div className="space-y-2 text-[12px]">
                <div className="flex items-center justify-between">
                  <div className="text-slate-600">Identity:</div>
                  <div className="font-semibold text-emerald-700">{owner.verification.identity}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-slate-600">Ownership:</div>
                  <div className="font-semibold text-emerald-700">{owner.verification.ownership}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-slate-600">Email:</div>
                  <div className="font-semibold text-emerald-700">{owner.verification.email}</div>
                </div>

                <button
                  type="button"
                  onClick={() => setDocsOpen(true)}
                  className="mt-4 h-9 w-full rounded-md border text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
                  style={{ borderColor: COLORS.cardBorder }}
                >
                  View Documents
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Documents Modal */}
      {docsOpen && (
        <div className="fixed inset-0 z-[9999]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDocsOpen(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-[760px] rounded-2xl bg-white shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: COLORS.cardBorder }}>
                <div className="text-[16px] font-semibold text-slate-900">Verification Documents</div>
                <button
                  type="button"
                  onClick={() => setDocsOpen(false)}
                  className="h-10 w-10 rounded-full border hover:bg-slate-50 flex items-center justify-center"
                  style={{ borderColor: COLORS.cardBorder }}
                >
                  <X className="h-5 w-5 text-slate-700" />
                </button>
              </div>

              <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border p-4 bg-white" style={{ borderColor: COLORS.cardBorder }}>
                  <div className="text-[13px] font-semibold text-slate-900">Identity Document</div>
                  <div className="mt-2 text-[12px] text-slate-600">Placeholder preview.</div>
                  <div className="mt-3 h-[140px] rounded-lg bg-slate-100 border" style={{ borderColor: COLORS.cardBorder }} />
                </div>

                <div className="rounded-xl border p-4 bg-white" style={{ borderColor: COLORS.cardBorder }}>
                  <div className="text-[13px] font-semibold text-slate-900">Ownership Document</div>
                  <div className="mt-2 text-[12px] text-slate-600">Placeholder preview.</div>
                  <div className="mt-3 h-[140px] rounded-lg bg-slate-100 border" style={{ borderColor: COLORS.cardBorder }} />
                </div>
              </div>

              <div className="px-6 py-4 border-t flex justify-end" style={{ borderColor: COLORS.cardBorder }}>
                <button
                  type="button"
                  onClick={() => setDocsOpen(false)}
                  className="h-10 px-5 rounded-md text-white text-[12px] font-semibold"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal (same page) */}
      <EditProfileModal open={editProfileOpen} onClose={() => setEditProfileOpen(false)} owner={owner} onSave={(updated) => setOwner(updated)} />

      {/* Property Details Modal */}
      <PropertyDetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        property={selectedProperty}
        onEditClick={() => navigate(`/owner/properties/edit/${selectedProperty?.id}`)}
      />
    </div>
  );
}