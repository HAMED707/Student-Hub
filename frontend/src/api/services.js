import { apiJson } from "./client.js";

export const fetchSupportedUniversities = () =>
  apiJson("/api/services/universities/");

export const fetchUniversityPlaces = ({
  name,
  type = "supermarket",
  radius = 1500,
}) =>
  apiJson(
    `/api/services/university/?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}&radius=${radius}`,
  );

export const fetchNearbyPlaces = ({
  lat,
  lng,
  type = "supermarket",
  radius = 1500,
}) =>
  apiJson(
    `/api/services/nearby/?lat=${lat}&lng=${lng}&type=${encodeURIComponent(type)}&radius=${radius}`,
  );
