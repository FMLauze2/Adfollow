import React, { useEffect, useState } from "react";
import axios from "axios";

const ContratsSuiviPage = () => {
  const [contrats, setContrats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState({});

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

  // 🔥 SUPPRESSION D’UN CONTRAT
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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Suivi des Contrats</h1>

      <div className="space-y-4">
        {contrats.map((c) => (
          <div
            key={c.id_contrat}
            className="bg-white p-4 rounded shadow border border-gray-200"
          >
            {/* TITRE + BOUTON SUPPRIMER */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">{c.cabinet}</h2>

              <button
                onClick={() => handleDelete(c.id_contrat)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
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
              <strong>Prix :</strong> {c.prix} €
            </p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium">Date d’envoi</label>
                <input
                  type="date"
                  value={dates[c.id_contrat]?.date_envoi || ""}
                  onChange={(e) =>
                    setDates({
                      ...dates,
                      [c.id_contrat]: {
                        ...dates[c.id_contrat],
                        date_envoi: e.target.value,
                      },
                    })
                  }
                  className="w-full border border-gray-300 rounded px-2 py-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Date de réception</label>
                <input
                  type="date"
                  value={dates[c.id_contrat]?.date_reception || ""}
                  onChange={(e) =>
                    setDates({
                      ...dates,
                      [c.id_contrat]: {
                        ...dates[c.id_contrat],
                        date_reception: e.target.value,
                      },
                    })
                  }
                  className="w-full border border-gray-300 rounded px-2 py-1"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => updateDates(c.id_contrat)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded"
                >
                  Mettre à jour
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContratsSuiviPage;
