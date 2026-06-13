import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ImagePlus, Save, Trash2 } from "lucide-react";
import {
  deletePropertyImage,
  fetchPropertyDetail,
  updateProperty,
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

export default function EditProperty() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const propertyId = params.id || location.state?.propertyId || "";

  const [formState, setFormState] = useState(() => buildPropertyFormState());
  const [property, setProperty] = useState(null);
  const [newImages, setNewImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!propertyId) {
      navigate("/owner/properties");
      return;
    }

    const loadProperty = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await fetchPropertyDetail(propertyId);
        setProperty(data);
        setFormState(buildPropertyFormState(data));
      } catch (loadError) {
        setError(loadError.message || "Unable to load property.");
      } finally {
        setLoading(false);
      }
    };

    loadProperty();
  }, [navigate, propertyId]);

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
      await updateProperty(propertyId, buildPropertyPayload(formState));
      if (newImages.length > 0) {
        await uploadPropertyImages(propertyId, newImages);
      }
      navigate("/owner/properties");
    } catch (saveError) {
      setError(saveError.message || "Failed to update property.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    try {
      await deletePropertyImage(propertyId, imageId);
      setProperty((current) => ({
        ...current,
        images: (current?.images || []).filter((image) => image.id !== imageId),
      }));
    } catch (deleteError) {
      setError(deleteError.message || "Failed to delete image.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F8FC] px-6 py-8 text-sm font-semibold text-slate-500">
        Loading property...
      </div>
    );
  }

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
            {saving ? "Saving..." : "Save changes"}
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

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(property?.images || []).map((image) => (
                <div key={image.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <img src={image.image} alt="Property" className="h-36 w-full object-cover" />
                  <div className="flex items-center justify-between px-3 py-3">
                    <span className="text-xs font-bold text-slate-500">
                      {image.is_cover ? "Cover photo" : "Gallery photo"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(image.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-black text-rose-600"
                    >
                      <Trash2 className="h-3 w-3" />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#155BC2] shadow-sm">
                <ImagePlus className="h-4 w-4" />
                Upload more photos
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => setNewImages(Array.from(event.target.files || []))}
                  className="hidden"
                />
              </label>
              <p className="mt-3 text-sm text-slate-500">
                Photo uploads remain supported. Video tours and legal property files stay out of scope for this pass.
              </p>
            </div>
          </section>
        </form>
      </main>
    </div>
  );
}
