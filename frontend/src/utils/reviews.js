export const PROPERTY_REVIEW_CREATED_EVENT = "studenthub:property-review-created";

const buildPropertyReviewStorageKey = (propertyId) =>
  `studenthub:property-review-updated:${propertyId}`;

export const notifyPropertyReviewCreated = (propertyId) => {
  if (!propertyId || typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      buildPropertyReviewStorageKey(propertyId),
      String(Date.now()),
    );
  } catch {
    // ignore storage issues
  }

  window.dispatchEvent(
    new CustomEvent(PROPERTY_REVIEW_CREATED_EVENT, {
      detail: { propertyId: String(propertyId) },
    }),
  );
};

export const consumePropertyReviewUpdate = (propertyId) => {
  if (!propertyId || typeof window === "undefined") return false;

  const key = buildPropertyReviewStorageKey(propertyId);

  try {
    const hasUpdate = Boolean(window.localStorage.getItem(key));
    if (hasUpdate) {
      window.localStorage.removeItem(key);
    }
    return hasUpdate;
  } catch {
    return false;
  }
};
