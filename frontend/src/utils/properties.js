import { withApiUrl } from "../api/client.js";

const PROPERTY_TYPE_LABELS = {
  apartment: "Apartment",
  studio: "Studio",
  room: "Private Room",
  shared: "Shared Room",
};

const AMENITY_ICON_KEYS = {
  wifi: "wifi",
  "wi-fi": "wifi",
  internet: "wifi",
  ac: "snowflake",
  "air conditioning": "snowflake",
  kitchen: "utensils",
  security: "shield",
  secure: "shield",
  maintenance: "wind",
  furnished: "home",
  laundry: "droplet",
  study: "monitor",
  desk: "monitor",
};

const toNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

export const isPropertyAvailable = (property) => {
  if (!property || typeof property !== "object") return true;

  if (property.isAvailable === true) return true;
  if (property.isAvailable === false) return false;

  const rawStatus = String(
    property.availabilityStatus ?? property.status ?? "",
  )
    .trim()
    .toLowerCase();

  if (!rawStatus) return true;

  if (rawStatus === "available") return true;
  if (["reserved", "rented", "unavailable", "booked"].includes(rawStatus)) {
    return false;
  }

  return true;
};

const getDurationLabel = (property) =>
  property?.university_distance?.duration_text ||
  property?.distance_to_university ||
  (property?.nearby_university ? `Near ${property.nearby_university}` : "Location available");

const getCoverImage = (property) =>
  property?.cover_image ||
  property?.images?.find((image) => image?.is_cover)?.image ||
  property?.images?.[0]?.image ||
  "https://via.placeholder.com/1200x800?text=Property";

const buildLocation = (property) =>
  [property?.city, property?.district].filter(Boolean).join(" - ") || property?.address || "Location not set";

const getCampusMinutes = (property) => {
  const source = property?.university_distance?.duration_text || property?.distance_to_university || "";
  const match = String(source).match(/(\d+)/);
  return match ? Number(match[1]) : 15;
};

export const mapPropertyTypeLabel = (propertyType) =>
  PROPERTY_TYPE_LABELS[propertyType] || propertyType || "Property";

export const normalizePropertyCard = (property) => ({
  id: property.id,
  title: property.title,
  type: mapPropertyTypeLabel(property.property_type),
  location: buildLocation(property),
  universityDistance: getDurationLabel(property),
  distance: getDurationLabel(property),
  campusMinutes: getCampusMinutes(property),
  price: toNumber(property.price),
  rating: toNumber(property.average_rating),
  reviews: toNumber(property.review_count),
  roommates: toNumber(property.num_roommates),
  image: getCoverImage(property),
  availabilityStatus: property.status,
  isAvailable: isPropertyAvailable(property),
  amenities: Array.isArray(property.amenities) ? property.amenities : [],
  city: property.city || "Unknown",
  area: property.district || property.city || "Unknown",
  lat: property.latitude ? Number(property.latitude) : 30.0444,
  lng: property.longitude ? Number(property.longitude) : 31.2357,
  createdAt: property.created_at ? new Date(property.created_at).getTime() : Date.now(),
  description: property.description || "",
  images: Array.isArray(property.images) ? property.images.map((image) => image.image) : [getCoverImage(property)],
});

const buildDerivedRooms = (property) => {
  const totalRooms = Math.max(1, toNumber(property.num_rooms, 1));
  const totalBeds = Math.max(1, toNumber(property.num_beds, 1));
  const baseImage = getCoverImage(property);

  return Array.from({ length: totalRooms }, (_, index) => {
    const bedsPerRoom = Math.max(1, Math.ceil(totalBeds / totalRooms));
    const roomType = totalBeds > totalRooms ? "Shared room" : mapPropertyTypeLabel(property.property_type);
    const bedEntries = Array.from({ length: bedsPerRoom }, (_, bedIndex) => ({
      id: `property-${property.id}-room-${index + 1}-bed-${bedIndex + 1}`,
      name: `Bed ${bedIndex + 1}`,
      status: isPropertyAvailable(property) ? "AVAILABLE" : "BOOKED",
      price: toNumber(property.price),
    }));

    return {
      id: `property-${property.id}-room-${index + 1}`,
      name: `Room ${index + 1}`,
      type: roomType,
      price: toNumber(property.price),
      status: isPropertyAvailable(property) ? "AVAILABLE" : "BOOKED",
      capacity: bedsPerRoom,
      beds: bedEntries,
      image: baseImage,
    };
  });
};

export const normalizePropertyReviews = (payload) =>
  Array.isArray(payload?.reviews)
    ? payload.reviews.map((review) => ({
        id: review.id,
        user: review.reviewer_username || "Student",
        date: review.created_at
          ? new Date(review.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
            })
          : "Recently",
        rating: toNumber(review.rating),
        text: review.comment || "No comment provided.",
        avatar: review.reviewer_picture
          ? withApiUrl(review.reviewer_picture)
          : "https://ui-avatars.com/api/?name=Student&background=0A2647&color=fff",
      }))
    : [];

export const normalizePropertyDetail = (property, reviewsPayload) => {
  const images = Array.isArray(property.images) && property.images.length > 0
    ? property.images.map((image) => image.image)
    : [getCoverImage(property)];

  const amenities = Array.isArray(property.amenities) ? property.amenities : [];
  const derivedRooms = buildDerivedRooms(property);
  const landlordName = property.landlord_name || "Property owner";
  const reviews = normalizePropertyReviews(reviewsPayload);
  const rating =
    reviewsPayload?.average_rating != null
      ? toNumber(reviewsPayload.average_rating)
      : toNumber(property.average_rating);
  const reviewCount =
    reviewsPayload?.review_count != null
      ? toNumber(reviewsPayload.review_count)
      : toNumber(property.review_count);

  return {
    id: property.id,
    title: property.title,
    price: toNumber(property.price),
    deposit: toNumber(property.price),
    serviceFee: 150,
    address: property.address || buildLocation(property),
    lat: property.latitude ? Number(property.latitude) : 30.0444,
    lng: property.longitude ? Number(property.longitude) : 31.2357,
    rating,
    reviewCount,
    distance: getDurationLabel(property),
    description:
      property.description ||
      "Live property details are now connected to the backend listing data.",
    landlord: {
      id: property.landlord_id,
      name: landlordName,
      image: property.landlord_picture
        ? withApiUrl(property.landlord_picture)
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(landlordName)}&background=0A2647&color=fff`,
      response: property.landlord_is_verified ? "Verified landlord" : "Host on Student Hub",
      isVerified: Boolean(property.landlord_is_verified),
      isTopRated: Boolean(property.landlord_is_top_rated),
    },
    images,
    rooms: derivedRooms,
    services: amenities.map((name) => ({
      name,
      iconKey: AMENITY_ICON_KEYS[String(name).trim().toLowerCase()] || "check",
    })),
    bills: [
      { name: "Internet", iconKey: "wifi", included: amenities.some((item) => String(item).toLowerCase().includes("wifi")) },
      { name: "Utilities", iconKey: "zap", included: false },
      { name: "Water", iconKey: "droplet", included: false },
      { name: "Gas", iconKey: "flame", included: false },
    ],
    reviews,
    nearbyUniversity: property.nearby_university || "",
    genderPreference: property.gender_preference || "",
    minStayMonths: property.min_stay_months || 1,
    maxStayMonths: property.max_stay_months || null,
    amenities,
    status: property.status,
    isAvailable: isPropertyAvailable(property),
    locationLabel: buildLocation(property),
  };
};
