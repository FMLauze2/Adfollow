const listeners = new Set();

export const showToast = (payload) => {
  listeners.forEach((fn) => fn(payload));
};

export const showSuccess = (message) => showToast({ type: "success", message });
export const showError = (message) => showToast({ type: "error", message });
export const showInfo = (message) => showToast({ type: "info", message });

export const subscribeToast = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
