export const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export const formatDateTime = (dateStr, timeStr) => {
  if (!dateStr && !timeStr) return "";
  const base = dateStr ? new Date(dateStr) : new Date();
  if (timeStr) {
    const [h, m] = timeStr.split(":");
    if (!Number.isNaN(parseInt(h, 10))) {
      base.setHours(parseInt(h, 10) || 0, parseInt(m, 10) || 0, 0, 0);
    }
  }
  if (Number.isNaN(base.getTime())) return `${dateStr || ""} ${timeStr || ""}`.trim();
  return base.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const truncate = (value, max = 80) => {
  if (!value) return "";
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
};
