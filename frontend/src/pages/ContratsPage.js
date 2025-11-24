// pages/ContratsPage.js
import React from 'react';
import ContratsForm from '../components/ContratForm';
import ContratsList from '../components/ContratsList';

const ContratsPage = () => {
  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Gestion des contrats</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* FORMULAIRE */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Créer un contrat</h2>
          <ContratsForm />
        </div>

        {/* LISTE DES CONTRATS */}
        <div className="bg-white p-6 rounded-xl shadow overflow-y-auto max-h-[80vh]">
          <h2 className="text-xl font-semibold mb-4">Liste des contrats</h2>
          <ContratsList />
        </div>

      </div>
    </div> 
  );
  
};


export default ContratsPage;
