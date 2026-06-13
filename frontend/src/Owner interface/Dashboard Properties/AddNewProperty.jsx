import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ImagePlus, Save } from "lucide-react";
import {
  createProperty,
  uploadPropertyImages,
} from "../../api/properties.js";
import {
  PROPERTY_AMENITIES,
  PROPERTY_GENDER_OPTIONS,
  PROPERTY_STATUS_OPTIONS,
  PROPERTY_TRANSPORT_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
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
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const toggleAmenity = (amenity) => {
    setFormState((current) => ({
      ...current,
      amenities: current.amenities.includes(amenity)
        ? current.amenities.filter((item) => item !== amenity)
        : [...current.amenities, amenity],
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

            <label className="block md:col-span-2">
              <span className="text-sm font-bold text-slate-600">Description</span>
              <textarea
                value={formState.description}
                onChange={(event) => updateField("description", event.target.value)}
                rows={5}
                className={fieldClassName}
              />
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

          <Section title="Location">
            <label className="block">
              <span className="text-sm font-bold text-slate-600">City</span>
              <input
                value={formState.city}
                onChange={(event) => updateField("city", event.target.value)}
                className={fieldClassName}
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-600">District</span>
              <input
                value={formState.district}
                onChange={(event) => updateField("district", event.target.value)}
                className={fieldClassName}
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
              <span className="text-sm font-bold text-slate-600">Nearby university</span>
              <input
                value={formState.nearbyUniversity}
                onChange={(event) => updateField("nearbyUniversity", event.target.value)}
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
              <span className="text-sm font-bold text-slate-600">Roommates</span>
              <input
                type="number"
                min="0"
                value={formState.numRoommates}
                onChange={(event) => updateField("numRoommates", event.target.value)}
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
              <span className="text-sm font-bold text-slate-600">Transport type</span>
              <select
                value={formState.transportType}
                onChange={(event) => updateField("transportType", event.target.value)}
                className={fieldClassName}
              >
                {PROPERTY_TRANSPORT_OPTIONS.map((option) => (
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
          </Section>

          <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-[#091E42]">Amenities & Photos</h2>

            <div className="mt-5 flex flex-wrap gap-2">
              {PROPERTY_AMENITIES.map((amenity) => {
                const active = formState.amenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                      active
                        ? "border-[#155BC2] bg-blue-50 text-[#155BC2]"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    {amenity}
                  </button>
                );
              })}
            </div>

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
                This phase supports listing photos only. Video tours and legal property files stay disabled.
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
