import { withApiUrl } from "../api/client.js";

const PROPERTY_TYPE_LABELS = {
  apartment: "Apartment",
  room: "Private Room",
  bed: "Bed",
  // legacy labels kept for fallback
  studio: "Studio",
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

const getDurationLabel = (property) => {
  const firstUni = Array.isArray(property?.nearby_universities) ? property.nearby_universities[0]?.name : null;
  return (
    property?.university_distance?.duration_text ||
    property?.distance_to_university ||
    (firstUni ? `Near ${firstUni}` : "Location available")
  );
};

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
  type: mapPropertyTypeLabel(property.unit_type || property.property_type),
  location: buildLocation(property),
  universityDistance: getDurationLabel(property),
  distance: getDurationLabel(property),
  campusMinutes: getCampusMinutes(property),
  price: toNumber(property.price || property.room_price || property.bed_price),
  rating: toNumber(property.average_rating),
  reviews: toNumber(property.review_count),
  image: getCoverImage(property),
  availabilityStatus: property.status,
  isAvailable: isPropertyAvailable(property),
  amenities: [],
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
    const roomType = totalBeds > totalRooms ? "Shared room" : mapPropertyTypeLabel(property.unit_type || property.property_type);
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

  const unitType    = property.unit_type || property.property_type || "";
  const rentalMode  = property.rental_mode || "";
  const wholePrice  = toNumber(property.price);
  const roomPrice   = property.room_price != null ? toNumber(property.room_price) : null;
  const bedPrice    = property.bed_price  != null ? toNumber(property.bed_price)  : null;

  // Build booking options based on unit_type + rental_mode
  const bookingOptions = [];
  if (unitType === "apartment") {
    if (rentalMode === "by_unit") {
      if (roomPrice != null) bookingOptions.push({ id: "room", label: "By Room", price: roomPrice });
      if (bedPrice  != null) bookingOptions.push({ id: "bed",  label: "By Bed",  price: bedPrice });
    } else {
      bookingOptions.push({ id: "whole", label: "Whole Apartment", price: wholePrice });
    }
  } else if (unitType === "room") {
    bookingOptions.push({ id: "whole", label: "Room", price: roomPrice ?? wholePrice });
  } else if (unitType === "bed") {
    bookingOptions.push({ id: "whole", label: "Bed", price: bedPrice ?? wholePrice });
  }
  if (bookingOptions.length === 0) {
    bookingOptions.push({ id: "whole", label: "Whole", price: wholePrice });
  }

  // transport_types is now a M2M of names (array of strings from SlugRelatedField)
  const transportTypes = Array.isArray(property.transport_types) ? property.transport_types : [];

  // nearby_universities is now an array of {id, name, city} objects
  const nearbyUniversities = Array.isArray(property.nearby_universities) ? property.nearby_universities : [];
  const nearbyUniversity   = nearbyUniversities[0]?.name || "";

  // Facilities derived from boolean fields
  const services = [
    property.has_internet    && { name: "WiFi / Internet",   iconKey: "wifi" },
    property.has_ac          && { name: "Air Conditioning",   iconKey: "snowflake" },
    property.has_water       && { name: "Water Included",     iconKey: "droplet" },
    property.has_electricity && { name: "Electricity Incl.",  iconKey: "zap" },
    property.has_gas         && { name: "Gas Included",       iconKey: "flame" },
  ].filter(Boolean);

  // Bills show all 5 with included/extra status
  const bills = [
    { name: "Internet",     iconKey: "wifi",      included: Boolean(property.has_internet) },
    { name: "AC",           iconKey: "snowflake",  included: Boolean(property.has_ac) },
    { name: "Water",        iconKey: "droplet",    included: Boolean(property.has_water) },
    { name: "Electricity",  iconKey: "zap",        included: Boolean(property.has_electricity) },
    { name: "Gas",          iconKey: "flame",      included: Boolean(property.has_gas) },
  ];

  const displayPrice = bookingOptions[0]?.price ?? wholePrice;

  return {
    id: property.id,
    title: property.title,
    price: displayPrice,
    roomPrice,
    bedPrice,
    bookingOptions,
    deposit: Math.round(displayPrice * 0.2),
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
    services,
    bills,
    reviews,
    nearbyUniversity,
    nearbyUniversities,
    genderPreference: property.gender_preference || "",
    minStayMonths: property.min_stay_months || 1,
    maxStayMonths: property.max_stay_months || null,
    status: property.status,
    availableFrom: property.available_from || null,
    isAvailable: isPropertyAvailable(property),
    locationLabel: buildLocation(property),
    propertyType: unitType,
    unitType,
    rentalMode,
    numRooms: toNumber(property.num_rooms, 1),
    numBeds: toNumber(property.num_beds, 1),
    numBathrooms: toNumber(property.num_bathrooms, 1),
    floor: property.floor ?? null,
    areaSqm: property.area_sqm ?? null,
    transportTypes,
    distanceToUniversity: property.distance_to_university || property.university_distance?.duration_text || "",
  };
};
