import React, { useEffect, useState } from "react";
import axios from "axios";

const ContratsSuiviPage = () => {
  const [contrats, setContrats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState({}); // state pour toutes les dates

  const fetchContrats = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/contrats");
      setContrats(res.data);

      // LOG pour confirmer le vrai nom du champ
      console.log("Contrats reçus :", res.data);

      // Initialisation correct avec id_contrat
      const initialDates = {};
      res.data.forEach((c) => {
        initialDates[c.id_contrat] = {
          date_envoi: c.date_envoi || "",
          date_reception: c.date_reception || "",
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

  const updateDates = async (id) => {
    const date_envoi = dates[id]?.date_envoi || null;
    const date_reception = dates[id]?.date_reception || null;

    if (!dates[id]) {
      alert("Dates non définies !");
      return;
    }

    try {
      await axios.put(`http://localhost:4000/api/contrats/${id}`, {
        date_envoi,
        date_reception,
      });
      alert("Dates mises à jour !");
      fetchContrats(); // refresh
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
            <h2 className="text-lg font-semibold text-gray-900">{c.cabinet}</h2>
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
