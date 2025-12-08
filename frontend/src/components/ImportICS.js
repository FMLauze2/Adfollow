import React, { useState } from 'react';
import axios from 'axios';

const ImportICS = () => {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.ics')) {
        setFile(selectedFile);
        setResult(null);
      } else {
        alert('Seuls les fichiers .ics sont acceptés');
        e.target.value = '';
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      alert('Veuillez sélectionner un fichier .ics');
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('icsFile', file);

      const response = await axios.post('http://localhost:4000/api/import-ics', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setResult(response.data);
      
      // Rafraîchir la page après un import réussi
      if (response.data.results.imported > 0) {
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (error) {
      console.error('Erreur import:', error);
      setResult({
        success: false,
        message: error.response?.data?.error || 'Erreur lors de l\'import',
        details: error.response?.data?.details
      });
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setShowDetails(false);
    document.getElementById('file-input').value = '';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          📥 Importer des RDV depuis Thunderbird
        </h2>
      </div>

      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
          <strong>📝 Comment exporter depuis Thunderbird :</strong>
        </p>
        <ol className="text-sm text-blue-700 dark:text-blue-300 list-decimal list-inside space-y-1">
          <li>Ouvrir Thunderbird et aller dans le calendrier</li>
          <li>Clic droit sur le calendrier → <strong>Exporter</strong></li>
          <li>Choisir le format <strong>iCalendar (*.ics)</strong></li>
          <li>Enregistrer le fichier et l'importer ci-dessous</li>
        </ol>
      </div>

      {!result && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              id="file-input"
              type="file"
              accept=".ics"
              onChange={handleFileChange}
              className="flex-1 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {importing ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Import en cours...
                </>
              ) : (
                '📤 Importer'
              )}
            </button>
          </div>

          {file && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Fichier sélectionné : <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${
            result.success 
              ? 'bg-green-50 dark:bg-green-900 border-2 border-green-500' 
              : 'bg-red-50 dark:bg-red-900 border-2 border-red-500'
          }`}>
            <p className={`font-bold mb-2 ${
              result.success 
                ? 'text-green-800 dark:text-green-200' 
                : 'text-red-800 dark:text-red-200'
            }`}>
              {result.success ? '✅ Import terminé !' : '❌ Erreur d\'import'}
            </p>
            <p className={result.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
              {result.message}
            </p>
            {result.details && (
              <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">{result.details}</p>
            )}
          </div>

          {result.results && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-100 dark:bg-green-800 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-700 dark:text-green-200">
                  {result.results.imported}
                </div>
                <div className="text-sm text-green-600 dark:text-green-300">Importés</div>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-800 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-200">
                  {result.results.skipped}
                </div>
                <div className="text-sm text-yellow-600 dark:text-yellow-300">Ignorés</div>
              </div>
              <div className="bg-red-100 dark:bg-red-800 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-red-700 dark:text-red-200">
                  {result.results.errors}
                </div>
                <div className="text-sm text-red-600 dark:text-red-300">Erreurs</div>
              </div>
            </div>
          )}

          {result.results && result.results.details && result.results.details.length > 0 && (
            <div>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm mb-2"
              >
                {showDetails ? '▼' : '▶'} {showDetails ? 'Masquer' : 'Voir'} les détails ({result.results.details.length} événements)
              </button>

              {showDetails && (
                <div className="max-h-96 overflow-y-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left">Cabinet</th>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Statut</th>
                        <th className="px-4 py-2 text-left">Détails</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                      {result.results.details.map((detail, idx) => (
                        <tr key={idx} className={
                          detail.status === 'imported' ? 'bg-green-50 dark:bg-green-900' :
                          detail.status === 'skipped' ? 'bg-yellow-50 dark:bg-yellow-900' :
                          'bg-red-50 dark:bg-red-900'
                        }>
                          <td className="px-4 py-2">{detail.cabinet}</td>
                          <td className="px-4 py-2">{detail.date || '-'}</td>
                          <td className="px-4 py-2">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                              detail.status === 'imported' ? 'bg-green-500 text-white' :
                              detail.status === 'skipped' ? 'bg-yellow-500 text-white' :
                              'bg-red-500 text-white'
                            }`}>
                              {detail.status === 'imported' ? '✅ Importé' :
                               detail.status === 'skipped' ? '⏭️ Ignoré' :
                               '❌ Erreur'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-600 dark:text-gray-400">
                            {detail.reason || (detail.id_rdv ? `ID: ${detail.id_rdv}` : '-')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={handleReset}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg"
            >
              Importer un autre fichier
            </button>
            {result.results && result.results.imported > 0 && (
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg"
              >
                ✅ Voir les RDV importés
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportICS;
