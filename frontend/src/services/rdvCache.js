let cache = {};
const TTL = 5 * 60 * 1000; // 5 minutes

export const getCachedRdv = (key) => {
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > TTL) {
    delete cache[key];
    return null;
  }
  return entry.data;
};

export const setCachedRdv = (key, data) => {
  cache[key] = { data, timestamp: Date.now() };
};

export const clearRdvCache = () => {
  cache = {};
};
