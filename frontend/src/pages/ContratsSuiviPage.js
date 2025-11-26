import React, { useEffect, useState } from "react";
import axios from "axios";

const ContratsSuiviPage = () => {
  const [contrats, setContrats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState({});
  const [selectedContratId, setSelectedContratId] = useState(null);

  const fetchContrats = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/contrats");
      setContrats(res.data);

      const initialDates = {};
      res.data.forEach((c) => {
        initialDates[c.id_contrat] = {
          date_envoi: c.date_envoi ? c.date_envoi.split("T")[0] : "",
          date_reception: c.date_reception ? c.date_reception.split("T")[0] : "",
        };
      });
      setDates(initialDates);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContrats();
  }, []);

  // 🔥 SUPPRESSION D'UN CONTRAT
  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer définitivement ce contrat ?")) return;

    try {
      await axios.delete(`http://localhost:4000/api/contrats/${id}`);

      // Mise à jour instantanée de la liste
      setContrats((prev) => prev.filter((c) => c.id_contrat !== id));

      // Retire les dates associées
      const updatedDates = { ...dates };
      delete updatedDates[id];
      setDates(updatedDates);

      // Réinitialise la sélection si le contrat supprimé était sélectionné
      if (selectedContratId === id) {
        setSelectedContratId(null);
      }

    } catch (err) {
      console.error("Erreur suppression :", err);
      alert("Impossible de supprimer le contrat.");
    }
  };

  const updateDates = async (id) => {
    let date_envoi = dates[id]?.date_envoi || null;
    let date_reception = dates[id]?.date_reception || null;

    // Convertir les dates ISO au format yyyy-MM-dd si nécessaire
    if (date_envoi && date_envoi.includes("T")) {
      date_envoi = date_envoi.split("T")[0];
    }
    if (date_reception && date_reception.includes("T")) {
      date_reception = date_reception.split("T")[0];
    }

    try {
      await axios.put(`http://localhost:4000/api/contrats/${id}`, {
        date_envoi,
        date_reception,
      });
      alert("Dates mises à jour !");
      fetchContrats();
    } catch (err) {
      console.error("Erreur update contrat:", err);
      alert("Erreur lors de la mise à jour");
    }
  };

  if (loading) return <p className="text-center mt-10">Chargement…</p>;

  const selectedContrat = selectedContratId 
    ? contrats.find(c => c.id_contrat === selectedContratId) 
    : null;

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Suivi des Contrats</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LISTE DES CONTRATS - Colonne de gauche */}
        <div className="lg:col-span-1">
          <div className="space-y-4">
            {contrats.map((c) => (
              <div
                key={c.id_contrat}
                onClick={() => setSelectedContratId(c.id_contrat)}
                className={`bg-white p-4 rounded shadow border-2 cursor-pointer transition ${
                  selectedContratId === c.id_contrat
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                {/* TITRE + BOUTON SUPPRIMER */}
                <div className="flex justify-between items-start gap-2">
                  <h2 className="text-lg font-semibold text-gray-900 flex-1">{c.cabinet}</h2>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(c.id_contrat);
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm flex-shrink-0"
                  >
                    Supprimer
                  </button>
                </div>

                <p className="text-sm text-gray-600">
                  {c.adresse}, {c.code_postal} {c.ville}
                </p>
                <p className="mt-2 text-sm">
                  <strong>Praticiens :</strong> {c.praticiens.join(", ")}
                </p>
                <p className="text-sm">
                  <strong>Prix :</strong> {c.prix} 
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium">Date d'envoi</label>
                    <input
                      type="date"
                      value={dates[c.id_contrat]?.date_envoi || ""}
                      onChange={(e) => {
                        e.stopPropagation();
                        setDates({
                          ...dates,
                          [c.id_contrat]: {
                            ...dates[c.id_contrat],
                            date_envoi: e.target.value,
                          },
                        });
                      }}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Date de réception</label>
                    <input
                      type="date"
                      value={dates[c.id_contrat]?.date_reception || ""}
                      onChange={(e) => {
                        e.stopPropagation();
                        setDates({
                          ...dates,
                          [c.id_contrat]: {
                            ...dates[c.id_contrat],
                            date_reception: e.target.value,
                          },
                        });
                      }}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateDates(c.id_contrat);
                  }}
                  className="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded text-sm"
                >
                  Mettre à jour
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* VISIONNEUSE PDF - Colonne de droite */}
        <div className="lg:col-span-2">
          {selectedContrat ? (
            <div className="bg-white rounded shadow p-4 h-full">
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                {selectedContrat.cabinet}
              </h2>

              <div className="mb-4 text-sm text-gray-600">
                <p><strong>Adresse :</strong> {selectedContrat.adresse}, {selectedContrat.code_postal} {selectedContrat.ville}</p>
                <p><strong>Praticiens :</strong> {selectedContrat.praticiens.join(", ")}</p>
                <p><strong>Prix :</strong> {selectedContrat.prix} </p>
              </div>

              {/* Visionneuse PDF */}
              <div className="bg-gray-100 rounded border border-gray-300 flex items-center justify-center" style={{ height: "500px" }}>
                <iframe
                  src={`http://localhost:4000/uploads/contrats/contrat_${selectedContrat.id_contrat}.pdf`}
                  title={`PDF ${selectedContrat.cabinet}`}
                  className="w-full h-full rounded"
                  style={{ border: "none" }}
                  onError={() => (
                    <div className="text-gray-500 text-center">
                      <p>Aucun PDF disponible pour ce contrat.</p>
                    </div>
                  )}
                />
              </div>

              <a
                href={`http://localhost:4000/uploads/contrats/contrat_${selectedContrat.id_contrat}.pdf`}
                download
                className="mt-4 block w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 rounded text-center"
              >
                Télécharger le PDF
              </a>
            </div>
          ) : (
            <div className="bg-white rounded shadow p-4 h-full flex items-center justify-center">
              <p className="text-gray-400 text-center">
                Sélectionnez un contrat pour afficher le PDF
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContratsSuiviPage;
