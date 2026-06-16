import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ImagePlus, Save } from "lucide-react";
import {
  createProperty,
  uploadPropertyImages,
} from "../../api/properties.js";
import {
  BILL_OPTIONS,
  CITIES,
  FACILITY_OPTIONS,
  PROPERTY_GENDER_OPTIONS,
  PROPERTY_STATUS_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  TRANSPORT_OPTIONS,
  UNIVERSITIES_BY_CITY,
  buildPropertyFormState,
  buildPropertyPayload,
} from "../../utils/propertyForm.js";

const fieldClassName =
  "mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#155BC2]";

const Section = ({ title, children }) => (
  <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
    <h2 className="text-lg font-black text-[#091E42]">{title}</h2>
    <div className="mt-5 grid gap-4 md:grid-cols-2">{children}</div>
  </section>
);

export default function AddNewProperty() {
  const navigate = useNavigate();
  const [formState, setFormState] = useState(() => buildPropertyFormState());
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const previews = useMemo(
    () => images.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })),
    [images],
  );

  const updateField = (key, value) => {
    setFormState((current) => ({ ...current, [key]: value }));
  };

  const toggleFacility = (facility) => {
    setFormState((current) => ({
      ...current,
      amenities: current.amenities.includes(facility)
        ? current.amenities.filter((item) => item !== facility)
        : [...current.amenities, facility],
    }));
  };

  const toggleBill = (bill) => {
    setFormState((current) => ({
      ...current,
      billsIncluded: current.billsIncluded.includes(bill)
        ? current.billsIncluded.filter((item) => item !== bill)
        : [...current.billsIncluded, bill],
    }));
  };

  const toggleTransport = (value) => {
    setFormState((current) => ({
      ...current,
      transportTypes: current.transportTypes.includes(value)
        ? current.transportTypes.filter((t) => t !== value)
        : [...current.transportTypes, value],
    }));
  };

  const handleCityChange = (city) => {
    setFormState((current) => ({
      ...current,
      city,
      nearbyUniversity: "",
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const created = await createProperty(buildPropertyPayload(formState));
      if (images.length > 0) {
        await uploadPropertyImages(created.id, images);
      }
      navigate("/owner/properties");
    } catch (saveError) {
      setError(saveError.message || "Failed to create property.");
    } finally {
      setSaving(false);
    }
  };

  const universityOptions = UNIVERSITIES_BY_CITY[formState.city] || [];

  return (
    <div className="min-h-screen bg-[#F6F8FC] font-sans text-[#091E42]">
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate("/owner/properties")}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to properties
          </button>
          <button
            type="submit"
            form="owner-property-form"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#155BC2] px-5 py-3 text-sm font-black text-white shadow-sm disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Create property"}
          </button>
        </div>

        {error ? (
          <div className="mt-6 rounded-3xl border border-rose-100 bg-white p-6 text-sm font-semibold text-rose-600 shadow-sm">
            {error}
          </div>
        ) : null}

        <form id="owner-property-form" onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Basic Information */}
          <Section title="Basic Information">
            <label className="block">
              <span className="text-sm font-bold text-slate-600">Title</span>
              <input
                value={formState.title}
                onChange={(event) => updateField("title", event.target.value)}
                className={fieldClassName}
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-600">Property type</span>
              <select
                value={formState.propertyType}
                onChange={(event) => updateField("propertyType", event.target.value)}
                className={fieldClassName}
              >
                {PROPERTY_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-600">Monthly price</span>
              <input
                type="number"
                min="1"
                value={formState.price}
                onChange={(event) => updateField("price", event.target.value)}
                className={fieldClassName}
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-600">Status</span>
              <select
                value={formState.status}
                onChange={(event) => updateField("status", event.target.value)}
                className={fieldClassName}
              >
                {PROPERTY_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </Section>

          {/* Availability & Rental Options */}
          <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-[#091E42]">Availability & Rental Options</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-bold text-slate-600">Available from</span>
                <input
                  type="date"
                  value={formState.availableFrom}
                  onChange={(e) => updateField("availableFrom", e.target.value)}
                  className={fieldClassName}
                />
                <p className="mt-1 text-xs text-slate-400">Leave blank if available now</p>
              </label>
            </div>

            {(formState.propertyType === "apartment" || formState.propertyType === "studio") && (
              <div className="mt-6 space-y-4">
                <p className="text-sm font-bold text-slate-600">How can this property be rented?</p>
                <p className="text-xs text-slate-400">Whole unit is always offered. Enable additional options below.</p>

                {formState.propertyType === "apartment" && (
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formState.offerByRoom}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const calc = Math.round(Number(formState.price || 0) / Math.max(1, Number(formState.numRooms || 1)));
                          setFormState((prev) => ({
                            ...prev,
                            offerByRoom: checked,
                            roomPrice: checked ? String(calc) : prev.roomPrice,
                          }));
                        }}
                        className="h-4 w-4 rounded accent-[#155BC2]"
                      />
                      <span className="font-bold text-[#091E42]">Also offer by Room</span>
                    </label>
                    {formState.offerByRoom && (
                      <label className="mt-3 block pl-7">
                        <span className="text-sm font-bold text-slate-600">Room price (EGP / room / month)</span>
                        <input
                          type="number"
                          min="1"
                          value={formState.roomPrice}
                          onChange={(e) => updateField("roomPrice", e.target.value)}
                          className={fieldClassName}
                        />
                        <p className="mt-1 text-xs text-slate-400">
                          Auto: EGP {Math.round(Number(formState.price || 0) / Math.max(1, Number(formState.numRooms || 1))).toLocaleString()} (whole ÷ rooms) — edit to override
                        </p>
                      </label>
                    )}
                  </div>
                )}

                <div className="rounded-2xl border border-slate-200 p-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formState.offerByBed}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const calc = Math.round(Number(formState.price || 0) / Math.max(1, Number(formState.numBeds || 1)));
                        setFormState((prev) => ({
                          ...prev,
                          offerByBed: checked,
                          bedPrice: checked ? String(calc) : prev.bedPrice,
                        }));
                      }}
                      className="h-4 w-4 rounded accent-[#155BC2]"
                    />
                    <span className="font-bold text-[#091E42]">Also offer by Bed</span>
                  </label>
                  {formState.offerByBed && (
                    <label className="mt-3 block pl-7">
                      <span className="text-sm font-bold text-slate-600">Bed price (EGP / bed / month)</span>
                      <input
                        type="number"
                        min="1"
                        value={formState.bedPrice}
                        onChange={(e) => updateField("bedPrice", e.target.value)}
                        className={fieldClassName}
                      />
                      <p className="mt-1 text-xs text-slate-400">
                        Auto: EGP {Math.round(Number(formState.price || 0) / Math.max(1, Number(formState.numBeds || 1))).toLocaleString()} (whole ÷ beds) — edit to override
                      </p>
                    </label>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Location */}
          <Section title="Location">
            <label className="block">
              <span className="text-sm font-bold text-slate-600">City</span>
              <select
                value={formState.city}
                onChange={(event) => handleCityChange(event.target.value)}
                className={fieldClassName}
                required
              >
                <option value="">— Select city —</option>
                {CITIES.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-600">Nearby university</span>
              <select
                value={formState.nearbyUniversity}
                onChange={(event) => updateField("nearbyUniversity", event.target.value)}
                className={fieldClassName}
                disabled={!formState.city}
              >
                <option value="">{formState.city ? "— Select university —" : "— Select city first —"}</option>
                {universityOptions.map((uni) => (
                  <option key={uni} value={uni}>{uni}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-600">District</span>
              <input
                value={formState.district}
                onChange={(event) => updateField("district", event.target.value)}
                className={fieldClassName}
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-600">Distance label</span>
              <input
                value={formState.distanceToUniversity}
                onChange={(event) => updateField("distanceToUniversity", event.target.value)}
                className={fieldClassName}
                placeholder="e.g. 10 minutes"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-bold text-slate-600">Address</span>
              <input
                value={formState.address}
                onChange={(event) => updateField("address", event.target.value)}
                className={fieldClassName}
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-600">Latitude</span>
              <input
                value={formState.latitude}
                onChange={(event) => updateField("latitude", event.target.value)}
                className={fieldClassName}
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-600">Longitude</span>
              <input
                value={formState.longitude}
                onChange={(event) => updateField("longitude", event.target.value)}
                className={fieldClassName}
              />
            </label>
          </Section>

          {/* Rooms & Stay */}
          <Section title="Rooms & Stay">
            <label className="block">
              <span className="text-sm font-bold text-slate-600">Rooms</span>
              <input
                type="number"
                min="1"
                value={formState.numRooms}
                onChange={(event) => updateField("numRooms", event.target.value)}
                className={fieldClassName}
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-600">Beds</span>
              <input
                type="number"
                min="1"
                value={formState.numBeds}
                onChange={(event) => updateField("numBeds", event.target.value)}
                className={fieldClassName}
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-600">Bathrooms</span>
              <input
                type="number"
                min="1"
                value={formState.numBathrooms}
                onChange={(event) => updateField("numBathrooms", event.target.value)}
                className={fieldClassName}
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-600">Floor</span>
              <input
                type="number"
                value={formState.floor}
                onChange={(event) => updateField("floor", event.target.value)}
                className={fieldClassName}
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-600">Area (sqm)</span>
              <input
                type="number"
                min="0"
                value={formState.areaSqm}
                onChange={(event) => updateField("areaSqm", event.target.value)}
                className={fieldClassName}
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-600">Gender preference</span>
              <select
                value={formState.genderPreference}
                onChange={(event) => updateField("genderPreference", event.target.value)}
                className={fieldClassName}
              >
                {PROPERTY_GENDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-600">Min stay (months)</span>
              <input
                type="number"
                min="1"
                value={formState.minStayMonths}
                onChange={(event) => updateField("minStayMonths", event.target.value)}
                className={fieldClassName}
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-600">Max stay (months)</span>
              <input
                type="number"
                min="1"
                value={formState.maxStayMonths}
                onChange={(event) => updateField("maxStayMonths", event.target.value)}
                className={fieldClassName}
              />
            </label>

            {/* Transport type — multi-select checkboxes */}
            <div className="md:col-span-2">
              <span className="text-sm font-bold text-slate-600">Transport to university</span>
              <div className="mt-2 flex flex-wrap gap-3">
                {TRANSPORT_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formState.transportTypes.includes(opt.value)}
                      onChange={() => toggleTransport(opt.value)}
                      className="h-4 w-4 rounded accent-[#155BC2]"
                    />
                    <span className="text-sm font-semibold text-[#091E42]">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </Section>

          {/* Amenities & Photos */}
          <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-[#091E42]">Amenities & Photos</h2>

            {/* Facilities */}
            <div className="mt-5">
              <p className="mb-3 text-sm font-bold text-slate-600">Facilities</p>
              <div className="flex flex-wrap gap-3">
                {FACILITY_OPTIONS.map((facility) => (
                  <label key={facility} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formState.amenities.includes(facility)}
                      onChange={() => toggleFacility(facility)}
                      className="h-4 w-4 rounded accent-[#155BC2]"
                    />
                    <span className="text-sm font-semibold text-[#091E42]">{facility}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Bills */}
            <div className="mt-6">
              <p className="mb-3 text-sm font-bold text-slate-600">Bills included in rent</p>
              <div className="flex flex-wrap gap-3">
                {BILL_OPTIONS.map((bill) => (
                  <label key={bill.value} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formState.billsIncluded.includes(bill.value)}
                      onChange={() => toggleBill(bill.value)}
                      className="h-4 w-4 rounded accent-[#155BC2]"
                    />
                    <span className="text-sm font-semibold text-[#091E42]">{bill.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Photo upload */}
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#155BC2] shadow-sm">
                <ImagePlus className="h-4 w-4" />
                Upload property photos
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => setImages(Array.from(event.target.files || []))}
                  className="hidden"
                />
              </label>
              <p className="mt-3 text-sm text-slate-500">
                This phase supports listing photos only.
              </p>

              {previews.length > 0 ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {previews.map((preview) => (
                    <div key={preview.name} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <img
                        src={preview.url}
                        alt={preview.name}
                        className="h-28 w-full object-cover"
                      />
                      <p className="truncate px-3 py-2 text-xs font-semibold text-slate-500">
                        {preview.name}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        </form>
      </main>
    </div>
  );
}
