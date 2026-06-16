import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, MapPin, Pencil, Plus, Search, Trash2 } from "lucide-react";
import {
  deleteProperty,
  fetchLandlordProperties,
} from "../../api/properties.js";

const formatMoney = (value) =>
  `EGP ${Number(value || 0).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })}`;

const statusStyles = {
  available: "bg-emerald-50 text-emerald-700 border-emerald-100",
  reserved: "bg-amber-50 text-amber-700 border-amber-100",
  rented: "bg-blue-50 text-blue-700 border-blue-100",
  unavailable: "bg-slate-50 text-slate-700 border-slate-100",
};

export default function OwnerProperties() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProperties = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await fetchLandlordProperties();
        const rows = Array.isArray(data) ? data : [];
        setProperties(rows);
        setSelectedPropertyId((current) => current || String(rows[0]?.id || ""));
      } catch (loadError) {
        setError(loadError.message || "Unable to load your properties.");
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, []);

  const filteredProperties = useMemo(() => {
    const search = query.trim().toLowerCase();
    return properties.filter((property) => {
      const matchesSearch =
        !search ||
        property.title?.toLowerCase().includes(search) ||
        property.city?.toLowerCase().includes(search) ||
        property.district?.toLowerCase().includes(search) ||
        property.nearby_university?.toLowerCase().includes(search);
      const matchesStatus =
        statusFilter === "all" || property.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [properties, query, statusFilter]);

  const selectedProperty =
    filteredProperties.find((property) => String(property.id) === String(selectedPropertyId)) ||
    filteredProperties[0] ||
    null;

  const handleDelete = async (propertyId) => {
    const confirmed = window.confirm(
      "Delete this listing permanently? This only removes the actual backend property you own.",
    );
    if (!confirmed) return;

    try {
      await deleteProperty(propertyId);
      setProperties((current) =>
        current.filter((property) => String(property.id) !== String(propertyId)),
      );
      setSelectedPropertyId("");
    } catch (deleteError) {
      setError(deleteError.message || "Failed to delete property.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] font-sans text-[#091E42]">
      <main className="mx-auto max-w-7xl px-6 py-8">
        <header className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#155BC2]">
                Owner listings
              </p>
              <h1 className="mt-1 text-3xl font-black">Properties</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Your listings now come entirely from the live landlord properties endpoint. Delete, edit, and create actions all hit the real backend.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/owner/properties/new")}
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#155BC2] px-4 text-sm font-black text-white transition hover:bg-[#0f4ca3]"
            >
              <Plus className="h-4 w-4" />
              New property
            </button>
          </div>
        </header>

        <section className="mt-6 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <label className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by title, city, district, or university"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-[#F8FAFC] pl-11 pr-4 text-sm outline-none focus:border-[#155BC2] focus:bg-white"
              />
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-[#155BC2]"
            >
              <option value="all">All statuses</option>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="rented">Rented</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
        </section>

        {error ? (
          <div className="mt-6 rounded-3xl border border-rose-100 bg-white p-6 text-sm font-semibold text-rose-600 shadow-sm">
            {error}
          </div>
        ) : null}

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-4">
            {loading ? (
              <div className="rounded-3xl border border-slate-100 bg-white p-6 text-sm text-slate-500 shadow-sm">
                Loading properties...
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
                <h2 className="text-xl font-black text-[#091E42]">
                  No properties match these filters
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Try a different search or add a new listing.
                </p>
              </div>
            ) : (
              filteredProperties.map((property) => (
                <article
                  key={property.id}
                  className={`rounded-3xl border bg-white p-4 shadow-sm transition ${
                    String(selectedPropertyId) === String(property.id)
                      ? "border-blue-200 ring-2 ring-blue-50"
                      : "border-slate-100"
                  }`}
                >
                  <div className="flex flex-col gap-4 md:flex-row">
                    <button
                      type="button"
                      onClick={() => setSelectedPropertyId(String(property.id))}
                      className="h-40 w-full overflow-hidden rounded-2xl md:w-64"
                    >
                      <img
                        src={property.cover_image}
                        alt={property.title}
                        className="h-full w-full object-cover"
                      />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-xl font-black text-[#091E42]">
                              {property.title}
                            </h2>
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-black ${
                                statusStyles[property.status] || statusStyles.unavailable
                              }`}
                            >
                              {property.status}
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-semibold text-[#155BC2]">
                            {formatMoney(property.price)}
                          </p>
                          <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                            <MapPin className="h-4 w-4" />
                            {property.city}
                            {property.district ? ` · ${property.district}` : ""}
                          </p>
                          <p className="mt-2 text-sm text-slate-500">
                            {property.nearby_university || "University not added"}
                          </p>
                        </div>

                        <div className="text-sm text-slate-500">
                          <p>{property.num_beds || 0} bed(s)</p>
                          <p>{property.review_count || 0} review(s)</p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedPropertyId(String(property.id))}
                          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700"
                        >
                          <Eye className="h-4 w-4" />
                          Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/owner/properties/edit/${property.id}`)}
                          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#155BC2] px-3 text-xs font-black text-white"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(property.id)}
                          className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-black text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          <aside className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black">Selected Listing</h2>
            {selectedProperty ? (
              <div className="mt-5 space-y-4">
                <img
                  src={selectedProperty.cover_image}
                  alt={selectedProperty.title}
                  className="h-52 w-full rounded-3xl object-cover"
                />

                <div>
                  <h3 className="text-xl font-black text-[#091E42]">
                    {selectedProperty.title}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-[#155BC2]">
                    {formatMoney(selectedProperty.price)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="font-black text-[#091E42]">Snapshot</p>
                  <ul className="mt-3 space-y-2">
                    <li>- Status: {selectedProperty.status}</li>
                    <li>- Beds: {selectedProperty.num_beds || 0}</li>
                    <li>- Reviews: {selectedProperty.review_count || 0}</li>
                    <li>- Rating: {selectedProperty.average_rating || 0}</li>
                    <li>- Featured: {selectedProperty.is_featured ? "Yes" : "No"}</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="font-black text-[#091E42]">Amenities</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(selectedProperty.amenities || []).length ? (
                      selectedProperty.amenities.map((amenity) => (
                        <span
                          key={amenity}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600"
                        >
                          {amenity}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">
                        No amenities added yet.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                Pick a property from the list to preview it here.
              </div>
            )}
          </aside>
        </section>
      </main>
    </div>
  );
}
