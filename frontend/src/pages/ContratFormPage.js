import React from 'react';
import ContratsForm from '../components/ContratForm';

const ContratFormPage = () => {
  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Créer un nouveau contrat</h1>

      <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow">
        <ContratsForm />
      </div>
    </div> 
  );
};

export default ContratFormPage;
