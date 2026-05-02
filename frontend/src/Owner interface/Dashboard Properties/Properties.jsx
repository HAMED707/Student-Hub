import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  X,
  Wifi,
  Droplets,
  Zap,
  Flame,
  Search,
  Trash2,
  Edit3,
  Eye,
  Building,
  Users,
  DoorOpen,
  Calendar,
} from "lucide-react";

/* =========================
   Helpers
========================= */
const cx = (...c) => c.filter(Boolean).join(" ");

const COLORS = {
  primary: "#1D4ED8",
  primaryDark: "#1E40AF",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
};

function AmenityChip({ icon, label }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 bg-slate-100 text-slate-700 text-sm font-bold border border-slate-200">
      {icon} {label}
    </span>
  );
}

function BillsRow({ bills = [] }) {
  const map = {
    Wifi: { icon: <Wifi size={16} />, label: "Wifi" },
    Water: { icon: <Droplets size={16} />, label: "Water" },
    Electricity: { icon: <Zap size={16} />, label: "Electricity" },
    Gas: { icon: <Flame size={16} />, label: "Gas" },
  };

  return (
    <div className="flex flex-wrap gap-3">
      {bills.length ? (
        bills.map((b) => (
          <AmenityChip key={b} icon={map[b]?.icon || <Zap size={16} />} label={map[b]?.label || b} />
        ))
      ) : (
        <>
          <AmenityChip icon={<Wifi size={16} />} label="Wifi" />
          <AmenityChip icon={<Droplets size={16} />} label="Water" />
          <AmenityChip icon={<Zap size={16} />} label="Electricity" />
        </>
      )}
    </div>
  );
}

/* =========================
   Details Modal
   - Available view stays like the screenshot
   - Rented view shows allocation
========================= */
function PropertyDetailsModal({ open, property, onClose, onEdit, onDelete }) {
  if (!open || !property) return null;

  const isRented = property.status === "Rented";

  return (
    <div className="fixed inset-0 z-[999]">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4 text-left">
        <div className="w-full max-w-[1000px] max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white/90 backdrop-blur px-8 py-6 border-b border-slate-100 flex items-start justify-between z-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={cx(
                    "px-3 py-1 text-xs font-bold rounded-full",
                    property.status === "Available"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  )}
                >
                  {property.status}
                </span>
                <span className="text-sm text-slate-500 font-medium">{property.type}</span>
              </div>

              <h2 className="text-3xl font-extrabold text-slate-900 leading-tight">{property.title}</h2>

              <div className="mt-2 flex items-center gap-2 text-slate-500 font-medium">
                <MapPin size={18} className="text-blue-600" />
                <span>{property.address}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-slate-700" />
            </button>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Left Column: Media */}
              <div className="space-y-4">
                <div className="relative h-[250px] rounded-lg overflow-hidden group">
                  <img
                    src={property.cover}
                    alt="Main cover"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {(property.images || [property.cover]).slice(0, 3).map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt="gallery"
                      className="h-[100px] w-full object-cover rounded-lg border border-slate-100"
                    />
                  ))}
                </div>
              </div>

              {/* Right Column: Info */}
              <div className="space-y-8">
                <div className="flex items-center justify-between bg-slate-50 p-6 rounded-lg border border-slate-100">
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Monthly Rent
                    </p>
                    <p className="text-3xl font-black text-blue-600">EGP {property.price}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-slate-500">
                      <span className="font-bold text-slate-800">{property.views}</span> Views
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      <span className="font-bold text-slate-800">{property.requests || 0}</span> Requests
                    </p>
                  </div>
                </div>

                {isRented ? (
                  <div className="space-y-6 animate-in slide-in-from-bottom-2">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Users className="text-blue-600" size={20} /> Room & Student Allocation
                    </h4>

                    <div className="space-y-4">
                      {property.roomsList?.map((room, rIdx) => (
                        <div key={rIdx} className="border border-slate-100 rounded-lg overflow-hidden bg-white">
                          <div className="bg-slate-50 px-4 py-2 flex justify-between items-center border-b">
                            <span className="text-xs font-bold text-slate-600 flex items-center gap-2">
                              <DoorOpen size={14} /> {room.name}
                            </span>
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                              {room.students.length} / {room.capacity} Beds
                            </span>
                          </div>

                          <div className="p-3 space-y-3">
                            {room.students.map((student, sIdx) => (
                              <div
                                key={sIdx}
                                className="flex justify-between items-center bg-slate-50/50 p-2 rounded-lg border border-slate-100/50"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                                    {(student.name || "S")[0]}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-800">{student.name}</p>
                                    <p className="text-[10px] text-slate-400">{student.faculty}</p>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <p className="text-xs font-black text-emerald-600">EGP {student.share}</p>
                                  <p className="text-[9px] text-slate-400 flex items-center gap-1">
                                    <Calendar size={10} /> {student.date}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 mb-4">Included Bills</h4>
                      <BillsRow bills={property.bills} />
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex justify-between items-center gap-4">
                      <button
                        onClick={() => onDelete?.(property.id)}
                        className="flex items-center gap-2 text-red-500 font-bold hover:bg-red-50 px-4 py-3 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} /> Delete Listing
                      </button>

                      <button
                        onClick={() => onEdit?.(property)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-lg transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                      >
                        <Edit3 size={18} /> Edit Property
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Property Card (unchanged)
========================= */
function PropertyCard({ item, onViewDetails, onEdit }) {
  const isAvailable = item.status === "Available";

  return (
    <div className="group rounded-lg bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col text-left">
      <div className="relative h-[220px] overflow-hidden">
        <img
          src={item.cover}
          alt={item.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
        <span
          className={cx(
            "absolute top-4 left-4 rounded-full px-4 py-1.5 text-xs font-bold shadow-sm backdrop-blur-md",
            isAvailable ? "bg-emerald-500/90 text-white" : "bg-slate-800/90 text-slate-200"
          )}
        >
          {item.status}
        </span>
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h3 className="text-xl font-bold truncate">{item.title}</h3>
          <p className="text-sm opacity-90 truncate flex items-center gap-1 mt-1">
            <MapPin size={14} /> {item.city} - {item.area}
          </p>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1 justify-between">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Monthly Rent</p>
            <p className="text-xl font-black text-slate-900">EGP {item.price}</p>
          </div>
          <div className="text-right space-y-1 text-sm text-slate-500 font-medium">
            <p>{item.rooms} Rooms</p>
            <p>{item.requests || 0} Requests</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-auto">
          <button
            onClick={() => onViewDetails(item)}
            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-lg text-sm font-bold bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            <Eye size={16} /> Details
          </button>

          {isAvailable && (
            <button
              onClick={() => onEdit?.(item)}
              className="flex items-center justify-center h-11 w-11 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
              aria-label="Edit"
            >
              <Edit3 size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================
   Main Page
========================= */
export default function OwnerProperties() {
  const navigate = useNavigate();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [properties, setProperties] = useState([
    // Rented (male)
    {
      id: "p1",
      title: "Shared Flat - Hay Al Jamaa",
      city: "Mansoura",
      area: "Hay Al Jamaa",
      price: 4500,
      status: "Rented",
      cover: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200",
      images: [
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200",
        "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?q=80&w=1200",
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1200",
      ],
      address: "Main Campus Road, Mansoura",
      type: "Apartment",
      rooms: 3,
      requests: 2,
      views: 1200,
      roomsList: [
        {
          name: "Room 1 (Double)",
          capacity: 2,
          students: [
            { name: "Kareem Ali", faculty: "Engineering", share: 1500, date: "Sep 2025" },
            { name: "Samer Essam", faculty: "Medicine", share: 1500, date: "Oct 2025" },
          ],
        },
        {
          name: "Room 2 (Single)",
          capacity: 1,
          students: [{ name: "Omar Yassin", faculty: "Law", share: 2000, date: "Sep 2025" }],
        },
      ],
    },

    // Rented (male)
    {
      id: "p2",
      title: "Students Flat - Heliopolis",
      city: "Cairo",
      area: "Heliopolis",
      price: 6000,
      status: "Rented",
      cover: "https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=1200",
      images: [
        "https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=1200",
        "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?q=80&w=1200",
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200",
      ],
      address: "El Merghany Street, Heliopolis, Cairo",
      type: "Apartment",
      rooms: 2,
      views: 980,
      requests: 5,
      roomsList: [
        {
          name: "Master Room",
          capacity: 2,
          students: [
            { name: "Ziad Ahmed", faculty: "Engineering", share: 3000, date: "Sep 2025" },
            { name: "Ahmed Nour", faculty: "Medicine", share: 3000, date: "Oct 2025" },
          ],
        },
      ],
    },

    // Available
    {
      id: "p3",
      title: "Modern Studio - Smouha",
      city: "Alexandria",
      area: "Smouha",
      price: 5500,
      status: "Available",
      cover: "https://images.unsplash.com/photo-1536376074432-ad7174e9c7b2?q=80&w=1200",
      images: [
        "https://images.unsplash.com/photo-1536376074432-ad7174e9c7b2?q=80&w=1200",
        "https://images.unsplash.com/photo-1560185008-5bf9c5a62b33?q=80&w=1200",
        "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?q=80&w=1200",
      ],
      address: "Victor Emanuel Square, Alexandria",
      type: "Studio",
      rooms: 1,
      requests: 8,
      views: 2400,
      bills: ["Wifi", "Water", "Electricity"],
    },

    // Rented (female)
    {
      id: "p4",
      title: "Female Dorm - Maadi",
      city: "Cairo",
      area: "Maadi",
      price: 4000,
      status: "Rented",
      cover: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1200",
      images: [
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1200",
        "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?q=80&w=1200",
        "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?q=80&w=1200",
      ],
      address: "Street 9, Maadi, Cairo",
      type: "Apartment",
      rooms: 2,
      views: 1500,
      requests: 3,
      roomsList: [
        {
          name: "Room A (Triple)",
          capacity: 3,
          students: [
            { name: "Laila Amer", faculty: "Pharmacy", share: 1300, date: "Oct 2025" },
            { name: "Sara Mahmoud", faculty: "Arts", share: 1300, date: "Oct 2025" },
            { name: "Hoda Zaki", faculty: "Science", share: 1300, date: "Oct 2025" },
          ],
        },
      ],
    },

    // Available
    {
      id: "p5",
      title: "Shared Room - Nasr City",
      city: "Cairo",
      area: "Nasr City",
      price: 4500,
      status: "Available",
      cover: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?q=80&w=1200",
      images: [
        "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?q=80&w=1200",
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200",
        "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?q=80&w=1200",
      ],
      address: "Khalifa Al Maamoun Street, Abbasia, Cairo",
      type: "Apartment",
      rooms: 2,
      requests: 5,
      views: 1760,
      bills: ["Wifi", "Water", "Electricity", "Gas"],
    },

    // Available
    {
      id: "p6",
      title: "Private Room - Dokki",
      city: "Giza",
      area: "Dokki",
      price: 5000,
      status: "Available",
      cover: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200",
      images: [
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200",
        "https://images.unsplash.com/photo-1560185008-5bf9c5a62b33?q=80&w=1200",
        "https://images.unsplash.com/photo-1536376074432-ad7174e9c7b2?q=80&w=1200",
      ],
      address: "Tahrir Street, Dokki, Giza",
      type: "Room",
      rooms: 1,
      requests: 4,
      views: 980,
      bills: ["Wifi", "Water"],
    },

    // Rented (female)
    {
      id: "p7",
      title: "Girls Apartment - Zamalek",
      city: "Cairo",
      area: "Zamalek",
      price: 8000,
      status: "Rented",
      cover: "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?q=80&w=1200",
      images: [
        "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?q=80&w=1200",
        "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?q=80&w=1200",
        "https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=1200",
      ],
      address: "26th of July Street, Zamalek, Cairo",
      type: "Apartment",
      rooms: 3,
      requests: 6,
      views: 2100,
      roomsList: [
        {
          name: "Room 1 (Double)",
          capacity: 2,
          students: [
            { name: "Nada Hossam", faculty: "Business", share: 3000, date: "Nov 2025" },
            { name: "Mona Adel", faculty: "Computers", share: 3000, date: "Nov 2025" },
          ],
        },
        {
          name: "Room 2 (Single)",
          capacity: 1,
          students: [{ name: "Salma Tarek", faculty: "Dentistry", share: 2000, date: "Dec 2025" }],
        },
      ],
    },

    // Available
    {
      id: "p8",
      title: "Shared Flat - New Cairo",
      city: "Cairo",
      area: "New Cairo",
      price: 7200,
      status: "Available",
      cover: "https://images.unsplash.com/photo-1560185008-5bf9c5a62b33?q=80&w=1200",
      images: [
        "https://images.unsplash.com/photo-1560185008-5bf9c5a62b33?q=80&w=1200",
        "https://images.unsplash.com/photo-1536376074432-ad7174e9c7b2?q=80&w=1200",
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1200",
      ],
      address: "90th Street, New Cairo",
      type: "Apartment",
      rooms: 2,
      requests: 2,
      views: 610,
      bills: ["Water", "Electricity", "Gas"],
    },
  ]);

  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.city.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "All" || p.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [properties, searchTerm, statusFilter]);

  const openDetails = (item) => {
    setSelected(item);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelected(null);
  };

  const handleEdit = (p) => {
    if (p.status !== "Available") return;
    navigate("/owner/properties/edit", { state: { property: p } });
  };

  const handleDelete = (id) => {
    setProperties((prev) => prev.filter((x) => x.id !== id));
    closeDetails();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 text-left">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">My Properties</h1>
            <p className="text-slate-500 mt-2 font-medium">Manage your portfolio and track allocations.</p>
          </div>

          <button
            onClick={() => navigate("/owner/properties/new")}
            className="h-12 px-8 rounded-lg text-white font-bold shadow-lg shadow-blue-200 transition-transform active:scale-95 flex items-center gap-2"
            style={{ backgroundColor: COLORS.primary }}
          >
            <Building size={18} /> Add New Property
          </button>
        </div>

        {/* Toolbar (keep as-is) */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search properties or locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 h-12 bg-slate-50 border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-12 px-4 bg-slate-50 border-none rounded-lg text-sm outline-none font-bold text-slate-700 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Rented">Rented</option>
          </select>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProperties.map((p) => (
            <PropertyCard key={p.id} item={p} onViewDetails={openDetails} onEdit={() => handleEdit(p)} />
          ))}
        </div>
      </div>

      <PropertyDetailsModal
        open={detailsOpen}
        property={selected}
        onClose={closeDetails}
        onEdit={(p) => handleEdit(p)}
        onDelete={(id) => handleDelete(id)}
      />
    </div>
  );
}