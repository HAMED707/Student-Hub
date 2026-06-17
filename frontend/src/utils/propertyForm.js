export { CITIES, UNIVERSITIES_BY_CITY, TRANSPORT_OPTIONS } from "./propertyConstants.js";

export const UNIT_TYPE_OPTIONS = [
  { value: "apartment", label: "Apartment" },
  { value: "room",      label: "Room" },
  { value: "bed",       label: "Bed in shared room" },
];

export const RENTAL_MODE_OPTIONS = [
  { value: "whole_apartment", label: "Rent entire apartment" },
  { value: "by_unit",         label: "Rent by room / bed" },
];

export const PROPERTY_STATUS_OPTIONS = [
  { value: "available",   label: "Available" },
  { value: "reserved",    label: "Reserved" },
  { value: "rented",      label: "Rented" },
  { value: "unavailable", label: "Unavailable" },
];

export const PROPERTY_GENDER_OPTIONS = [
  { value: "male",   label: "Male only" },
  { value: "female", label: "Female only" },
];

const parseOptionalNumber = (value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const buildPropertyFormState = (property = {}) => ({
  title:                property.title || "",
  unitType:             property.unit_type || "apartment",
  rentalMode:           property.rental_mode || "whole_apartment",
  price:                property.price != null ? String(property.price) : "",
  roomPrice:            property.room_price != null ? String(property.room_price) : "",
  bedPrice:             property.bed_price != null ? String(property.bed_price) : "",
  genderPreference:     property.gender_preference || "male",
  city:                 property.city || "",
  district:             property.district || "",
  address:              property.address || "",
  latitude:             property.latitude ?? "",
  longitude:            property.longitude ?? "",
  nearbyUniversities:   Array.isArray(property.nearby_universities) ? property.nearby_universities : [],
  distanceToUniversity: property.distance_to_university || "",
  transportTypes:       Array.isArray(property.transport_types) ? property.transport_types : [],
  numRooms:             property.num_rooms ?? 1,
  numBeds:              property.num_beds ?? 1,
  numBathrooms:         property.num_bathrooms ?? 1,
  floor:                property.floor ?? "",
  areaSqm:              property.area_sqm ?? "",
  hasInternet:          property.has_internet ?? false,
  hasAc:                property.has_ac ?? false,
  hasWater:             property.has_water ?? false,
  hasElectricity:       property.has_electricity ?? false,
  hasGas:               property.has_gas ?? false,
  minStayMonths:        property.min_stay_months ?? 1,
  maxStayMonths:        property.max_stay_months ?? "",
  status:               property.status || "available",
  availableFrom:        property.available_from || "",
});

export const buildPropertyPayload = (formState) => {
  const payload = {
    title:                  formState.title?.trim() || "",
    unit_type:              formState.unitType,
    gender_preference:      formState.genderPreference,
    city:                   formState.city?.trim() || "",
    district:               formState.district?.trim() || "",
    address:                formState.address?.trim() || "",
    nearby_universities:    formState.nearbyUniversities || [],
    distance_to_university: formState.distanceToUniversity?.trim() || "",
    transport_types:        formState.transportTypes || [],
    num_rooms:              Number(formState.numRooms || 1),
    num_beds:               Number(formState.numBeds || 1),
    num_bathrooms:          Number(formState.numBathrooms || 1),
    has_internet:           Boolean(formState.hasInternet),
    has_ac:                 Boolean(formState.hasAc),
    has_water:              Boolean(formState.hasWater),
    has_electricity:        Boolean(formState.hasElectricity),
    has_gas:                Boolean(formState.hasGas),
    min_stay_months:        Number(formState.minStayMonths || 1),
    status:                 formState.status,
    available_from:         formState.availableFrom || null,
  };

  if (formState.unitType === "apartment") {
    payload.rental_mode = formState.rentalMode;
    if (formState.rentalMode === "whole_apartment") {
      payload.price = Number(formState.price || 0);
    } else {
      payload.room_price = Number(formState.roomPrice || 0);
      payload.bed_price  = Number(formState.bedPrice  || 0);
    }
  } else if (formState.unitType === "room") {
    payload.room_price = Number(formState.roomPrice || 0);
  } else if (formState.unitType === "bed") {
    payload.bed_price = Number(formState.bedPrice || 0);
  }

  const latitude     = parseOptionalNumber(formState.latitude);
  const longitude    = parseOptionalNumber(formState.longitude);
  const floor        = parseOptionalNumber(formState.floor);
  const areaSqm      = parseOptionalNumber(formState.areaSqm);
  const maxStay      = parseOptionalNumber(formState.maxStayMonths);

  if (latitude  !== undefined) payload.latitude  = latitude;
  if (longitude !== undefined) payload.longitude = longitude;
  if (floor     !== undefined) payload.floor     = floor;
  if (areaSqm   !== undefined) payload.area_sqm  = areaSqm;
  if (maxStay   !== undefined) payload.max_stay_months = maxStay;

  return payload;
};
