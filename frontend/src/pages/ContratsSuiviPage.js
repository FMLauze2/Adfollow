import React, { useEffect, useState } from "react";
import axios from "axios";

const ContratsSuiviPage = () => {
  const [contrats, setContrats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState({});
  const [selectedContratId, setSelectedContratId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const contractsPerPage = 5;
  const [pdfAvailable, setPdfAvailable] = useState(false);
  const [checkingPdf, setCheckingPdf] = useState(false);

  const fetchContrats = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/contrats");
      // Trier par id_contrat décroissant pour afficher le dernier créé en premier
      const sorted = Array.isArray(res.data)
        ? res.data.slice().sort((a, b) => (b.id_contrat || 0) - (a.id_contrat || 0))
        : [];
      setContrats(sorted);

      const initialDates = {};
      sorted.forEach((c) => {
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

  useEffect(() => {
    const checkPdf = async () => {
      if (!selectedContratId) {
        setPdfAvailable(false);
        return;
      }
      setCheckingPdf(true);
      const url = `http://localhost:4000/uploads/contrats/contrat_${selectedContratId}.pdf`;
      try {
        await axios.head(url);
        setPdfAvailable(true);
      } catch (err) {
        setPdfAvailable(false);
      } finally {
        setCheckingPdf(false);
      }
    };
    checkPdf();
  }, [selectedContratId]);

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

  // Pagination
  const startIndex = (currentPage - 1) * contractsPerPage;
  const endIndex = startIndex + contractsPerPage;
  const paginatedContrats = contrats.slice(startIndex, endIndex);
  const totalPages = Math.ceil(contrats.length / contractsPerPage);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="p-6 pb-0">
        <h1 className="text-2xl font-bold text-gray-800">Suivi des Contrats</h1>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 p-6 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
          {/* LISTE DES CONTRATS - Colonne de gauche */}
          <div className="lg:col-span-1 flex flex-col bg-white rounded shadow overflow-hidden">
            <div className="space-y-3 overflow-y-auto flex-1 p-4">
              {paginatedContrats.map((c) => (
                <div
                  key={c.id_contrat}
                  onClick={() => setSelectedContratId(c.id_contrat)}
                  className={`bg-white p-3 rounded border-2 cursor-pointer transition ${
                    selectedContratId === c.id_contrat
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  {/* TITRE + BOUTON SUPPRIMER */}
                  <div className="flex justify-between items-start gap-2">
                    <h2 className="text-sm font-semibold text-gray-900 flex-1">{c.cabinet}</h2>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(c.id_contrat);
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs flex-shrink-0"
                    >
                      X
                    </button>
                  </div>

                  <p className="text-xs text-gray-600">
                    {c.adresse}, {c.code_postal} {c.ville}
                  </p>
                  <p className="mt-1 text-xs">
                    <strong>Prix :</strong> {c.prix}€
                  </p>

                  <div className="mt-2 grid grid-cols-2 gap-1">
                    <div>
                      <label className="block text-xs font-medium">Envoi</label>
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
                        className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium">Réception</label>
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
                        className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                      />
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateDates(c.id_contrat);
                    }}
                    className="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-1 rounded text-xs"
                  >
                    Mettre à jour
                  </button>
                </div>
              ))}
            </div>

            {/* PAGINATION */}
            <div className="flex items-center justify-between gap-2 p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded text-xs"
              >
                ←
              </button>
              <span className="text-xs font-medium text-gray-700">
                {currentPage}/{totalPages || 1}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded text-xs"
              >
                →
              </button>
            </div>
          </div>

          {/* VISIONNEUSE PDF - Colonne de droite */}
          <div className="lg:col-span-3">
            {selectedContrat ? (
              <div className="bg-white rounded shadow p-4 h-full flex flex-col">
                <h2 className="text-xl font-bold mb-2 text-gray-800">
                  {selectedContrat.cabinet}
                </h2>

                <div className="mb-3 text-sm text-gray-600">
                  <p><strong>Adresse :</strong> {selectedContrat.adresse}, {selectedContrat.code_postal} {selectedContrat.ville}</p>
                  <p><strong>Praticiens :</strong> {selectedContrat.praticiens.join(", ")}</p>
                  <p><strong>Prix :</strong> {selectedContrat.prix}€</p>
                </div>

                {/* Visionneuse PDF */}
                <div className="bg-gray-100 rounded border border-gray-300 flex-1 overflow-hidden flex items-center justify-center">
                  {checkingPdf ? (
                    <p className="text-gray-600">Vérification du PDF…</p>
                  ) : pdfAvailable ? (
                    <iframe
                      key={selectedContratId}
                      src={`http://localhost:4000/uploads/contrats/contrat_${selectedContrat.id_contrat}.pdf`}
                      title={`PDF ${selectedContrat.cabinet}`}
                      className="w-full h-full"
                      style={{ border: "none" }}
                      allowFullScreen
                      allow="fullscreen"
                    />
                  ) : (
                    <div className="text-gray-500 text-center p-4">
                      <p>Aucun PDF disponible pour ce contrat.</p>
                    </div>
                  )}
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
    </div>
  );
};

export default ContratsSuiviPage;
