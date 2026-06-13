export const PROPERTY_TYPE_OPTIONS = [
  { value: "apartment", label: "Apartment" },
  { value: "studio", label: "Studio" },
  { value: "room", label: "Room" },
  { value: "shared", label: "Shared room" },
];

export const PROPERTY_STATUS_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "reserved", label: "Reserved" },
  { value: "rented", label: "Rented" },
  { value: "unavailable", label: "Unavailable" },
];

export const PROPERTY_TRANSPORT_OPTIONS = [
  { value: "", label: "Not selected" },
  { value: "walk", label: "Walking" },
  { value: "metro", label: "Metro" },
  { value: "transport", label: "Public transport" },
];

export const PROPERTY_GENDER_OPTIONS = [
  { value: "male", label: "Male only" },
  { value: "female", label: "Female only" },
];

export const PROPERTY_AMENITIES = [
  "WiFi",
  "Air Conditioning",
  "Washing Machine",
  "Parking",
  "Elevator",
  "Security",
  "Kitchen",
  "Desk",
  "Wardrobe",
  "Private Bathroom",
];

const parseOptionalNumber = (value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const buildPropertyFormState = (property = {}) => ({
  title: property.title || "",
  description: property.description || "",
  propertyType: property.property_type || "apartment",
  price: property.price ?? "",
  city: property.city || "",
  district: property.district || "",
  address: property.address || "",
  latitude: property.latitude ?? "",
  longitude: property.longitude ?? "",
  nearbyUniversity: property.nearby_university || "",
  distanceToUniversity: property.distance_to_university || "",
  transportType: property.transport_type || "",
  numRooms: property.num_rooms ?? 1,
  numBeds: property.num_beds ?? 1,
  numBathrooms: property.num_bathrooms ?? 1,
  numRoommates: property.num_roommates ?? 0,
  floor: property.floor ?? "",
  areaSqm: property.area_sqm ?? "",
  genderPreference: property.gender_preference || "male",
  amenities: Array.isArray(property.amenities) ? property.amenities : [],
  minStayMonths: property.min_stay_months ?? 1,
  maxStayMonths: property.max_stay_months ?? "",
  status: property.status || "available",
});

export const buildPropertyPayload = (formState) => {
  const payload = {
    title: formState.title?.trim() || "",
    description: formState.description?.trim() || "",
    property_type: formState.propertyType,
    price: Number(formState.price || 0),
    city: formState.city?.trim() || "",
    district: formState.district?.trim() || "",
    address: formState.address?.trim() || "",
    nearby_university: formState.nearbyUniversity?.trim() || "",
    distance_to_university: formState.distanceToUniversity?.trim() || "",
    transport_type: formState.transportType || null,
    num_rooms: Number(formState.numRooms || 1),
    num_beds: Number(formState.numBeds || 1),
    num_bathrooms: Number(formState.numBathrooms || 1),
    num_roommates: Number(formState.numRoommates || 0),
    gender_preference: formState.genderPreference,
    amenities: formState.amenities || [],
    min_stay_months: Number(formState.minStayMonths || 1),
    status: formState.status,
  };

  const latitude = parseOptionalNumber(formState.latitude);
  const longitude = parseOptionalNumber(formState.longitude);
  const floor = parseOptionalNumber(formState.floor);
  const areaSqm = parseOptionalNumber(formState.areaSqm);
  const maxStayMonths = parseOptionalNumber(formState.maxStayMonths);

  if (latitude !== undefined) payload.latitude = latitude;
  if (longitude !== undefined) payload.longitude = longitude;
  if (floor !== undefined) payload.floor = floor;
  if (areaSqm !== undefined) payload.area_sqm = areaSqm;
  if (maxStayMonths !== undefined) payload.max_stay_months = maxStayMonths;

  return payload;
};
