-- Migration: Création de la table rendez_vous
-- Date: 2025-11-27
-- Description: Table pour gérer les rendez-vous (installations, maintenances, etc.)

CREATE TABLE IF NOT EXISTS rendez_vous (
    id_rdv SERIAL PRIMARY KEY,
    cabinet VARCHAR(255) NOT NULL,
    date_rdv DATE NOT NULL,
    heure_rdv TIME NOT NULL,
    type_rdv VARCHAR(50) NOT NULL CHECK (type_rdv IN ('Installation', 'Maintenance', 'Autre')),
    adresse TEXT NOT NULL,
    code_postal VARCHAR(10) NOT NULL,
    ville VARCHAR(100) NOT NULL,
    praticiens JSONB,
    statut VARCHAR(50) NOT NULL DEFAULT 'Planifié' CHECK (statut IN ('Planifié', 'Effectué', 'Annulé')),
    notes TEXT,
    id_contrat INTEGER REFERENCES contrats(id_contrat) ON DELETE SET NULL,
    date_creation TIMESTAMP DEFAULT NOW()
);

-- Index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_rendez_vous_date ON rendez_vous(date_rdv);
CREATE INDEX IF NOT EXISTS idx_rendez_vous_statut ON rendez_vous(statut);
CREATE INDEX IF NOT EXISTS idx_rendez_vous_cabinet ON rendez_vous(cabinet);
CREATE INDEX IF NOT EXISTS idx_rendez_vous_contrat ON rendez_vous(id_contrat);

-- Vérification
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'rendez_vous'
ORDER BY ordinal_position;
