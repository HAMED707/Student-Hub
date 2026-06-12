import { useCallback, useEffect, useMemo, useState } from "react";
import { addFavorite, fetchFavorites, removeFavorite } from "../api/favorites.js";
import {
  AUTH_CHANGE_EVENT,
  getApiErrorMessage,
  getStoredUser,
} from "../utils/auth.js";
import { normalizePropertyCard } from "../utils/properties.js";

export const FAVORITES_CHANGE_EVENT = "studenthub:favorites-changed";

let favoritesCache = {
  loaded: false,
  items: [],
  ids: [],
};

const emitFavoritesChange = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(FAVORITES_CHANGE_EVENT));
};

const normalizeFavoriteItem = (item) =>
  normalizePropertyCard(item?.property_detail || item?.property || item);

const syncCache = (items) => {
  const normalizedItems = (Array.isArray(items) ? items : []).map(normalizeFavoriteItem);
  favoritesCache = {
    loaded: true,
    items: normalizedItems,
    ids: normalizedItems.map((item) => item.id),
  };
  emitFavoritesChange();
  return favoritesCache;
};

const applyEmptyCache = () => {
  favoritesCache = { loaded: true, items: [], ids: [] };
  emitFavoritesChange();
};

export function useFavorites({ autoLoad = true } = {}) {
  const [favoriteItems, setFavoriteItems] = useState(() => favoritesCache.items);
  const [favoriteIds, setFavoriteIds] = useState(() => favoritesCache.ids);
  const [loading, setLoading] = useState(
    autoLoad && !favoritesCache.loaded && getStoredUser()?.role === "student",
  );
  const [error, setError] = useState("");

  const applyCache = useCallback(() => {
    setFavoriteItems(favoritesCache.items);
    setFavoriteIds(favoritesCache.ids);
  }, []);

  const refreshFavorites = useCallback(async () => {
    const user = getStoredUser();

    if (!user || user.role !== "student") {
      applyEmptyCache();
      applyCache();
      setLoading(false);
      setError("");
      return [];
    }

    setLoading(true);
    setError("");

    try {
      const rows = await fetchFavorites();
      const cache = syncCache(rows);
      applyCache();
      return cache.items;
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Failed to load favorites"));
      throw loadError;
    } finally {
      setLoading(false);
    }
  }, [applyCache]);

  useEffect(() => {
    if (autoLoad && !favoritesCache.loaded && getStoredUser()?.role === "student") {
      refreshFavorites().catch(() => {});
      return undefined;
    }

    applyCache();
    return undefined;
  }, [applyCache, autoLoad, refreshFavorites]);

  useEffect(() => {
    const handleChange = () => applyCache();

    window.addEventListener(FAVORITES_CHANGE_EVENT, handleChange);
    return () => window.removeEventListener(FAVORITES_CHANGE_EVENT, handleChange);
  }, [applyCache]);

  useEffect(() => {
    const handleAuthChange = () => {
      const user = getStoredUser();

      if (!user || user.role !== "student") {
        applyEmptyCache();
        applyCache();
        setError("");
        setLoading(false);
        return;
      }

      favoritesCache = { loaded: false, items: [], ids: [] };
      setFavoriteItems([]);
      setFavoriteIds([]);
      refreshFavorites().catch(() => {});
    };

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, [applyCache, refreshFavorites]);

  const toggleFavorite = useCallback(
    async (property, callbacks = {}) => {
      const { onRequireAuth, onError, onSuccess } = callbacks;
      const user = getStoredUser();

      if (!user) {
        onRequireAuth?.();
        return false;
      }

      if (user.role !== "student") {
        const message = "Only students can save properties";
        setError(message);
        onError?.(message);
        return false;
      }

      const propertyId = property?.id;
      if (!propertyId) {
        const message = "Property is unavailable";
        setError(message);
        onError?.(message);
        return false;
      }

      setError("");

      try {
        const alreadySaved = favoritesCache.ids.includes(propertyId);

        if (alreadySaved) {
          await removeFavorite(propertyId);
          syncCache(favoritesCache.items.filter((item) => item.id !== propertyId));
        } else {
          const response = await addFavorite(propertyId);
          const nextItem = normalizeFavoriteItem(response);
          syncCache([
            nextItem,
            ...favoritesCache.items.filter((item) => item.id !== propertyId),
          ]);
        }

        applyCache();
        onSuccess?.(!alreadySaved);
        return !alreadySaved;
      } catch (toggleError) {
        const message = getApiErrorMessage(toggleError, "Failed to update favorites");
        setError(message);
        onError?.(message);
        return favoritesCache.ids.includes(propertyId);
      }
    },
    [applyCache],
  );

  return useMemo(
    () => ({
      favoriteItems,
      favoriteIds,
      favoriteIdSet: new Set(favoriteIds),
      isFavorite: (propertyId) => favoriteIds.includes(propertyId),
      loading,
      error,
      refreshFavorites,
      toggleFavorite,
    }),
    [error, favoriteIds, favoriteItems, loading, refreshFavorites, toggleFavorite],
  );
}
