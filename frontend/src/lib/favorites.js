export function getUserId() {
  return localStorage.getItem("userId") || "";
}

function userKey(uid) {
  return uid ? `favorites:${uid}` : "";
}

function readArray(key) {
  try {
    const v = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

// миграция со старого global-key "favorites" -> "favorites:<userId>"
function migrateLegacyFavorites(uid) {
  const k = userKey(uid);
  if (!k) return;

  const current = readArray(k);
  if (current.length > 0) return;

  const legacy = readArray("favorites");
  if (legacy.length === 0) return;

  localStorage.setItem(k, JSON.stringify(legacy));
  // можно удалить legacy, если хочешь жестко:
  // localStorage.removeItem("favorites");
}

export function getFavIds() {
  const uid = getUserId();
  const k = userKey(uid);
  if (!k) return [];

  migrateLegacyFavorites(uid);
  return readArray(k);
}

export function setFavIds(ids) {
  const uid = getUserId();
  const k = userKey(uid);
  if (!k) return;

  localStorage.setItem(k, JSON.stringify(ids));
  window.dispatchEvent(new Event("favorites:changed"));
}

export function isFavorite(productId) {
  return getFavIds().includes(productId);
}

export function toggleFavorite(productId) {
  const uid = getUserId();
  if (!uid) throw new Error("Сначала войди");

  const ids = getFavIds();
  if (ids.includes(productId)) {
    setFavIds(ids.filter((x) => x !== productId));
    return false;
  }
  setFavIds([...ids, productId]);
  return true;
}

export function removeFavorite(productId) {
  const uid = getUserId();
  if (!uid) return;
  setFavIds(getFavIds().filter((x) => x !== productId));
}

export function favCount() {
  return getFavIds().length;
}
