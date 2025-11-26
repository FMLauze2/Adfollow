-- Migration: Ajouter colonne email à la table contrats
-- Date: 2025-11-26
-- Description: Champ email pour mailto, non affiché dans le PDF

ALTER TABLE contrats ADD COLUMN IF NOT EXISTS email TEXT;

-- Vérification
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'contrats' AND column_name = 'email';
