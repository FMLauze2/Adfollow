import React from "react";

const STATUS_COLORS = {
  Planifié: {
    bg: "var(--status-planifie-bg)",
    text: "var(--status-planifie-text)",
  },
  Effectué: {
    bg: "var(--status-effectue-bg)",
    text: "var(--status-effectue-text)",
  },
  Facturé: {
    bg: "var(--status-facture-bg)",
    text: "var(--status-facture-text)",
  },
  Annulé: {
    bg: "var(--status-annule-bg)",
    text: "var(--status-annule-text)",
  },
};

const StatusBadge = ({ value }) => {
  const colors = STATUS_COLORS[value] || { bg: "#f3f4f6", text: "#1f2937" };
  return (
    <span
      className="px-2 py-1 rounded text-xs font-medium"
      style={{ backgroundColor: colors.bg, color: colors.text }}
      aria-label={`Statut ${value || "inconnu"}`}
    >
      {value || "-"}
    </span>
  );
};

export default StatusBadge;
