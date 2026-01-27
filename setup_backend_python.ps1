#!/usr/bin/env powershell
# Script de configuration Python pour le backend
# Crée l'environnement virtuel dans le dossier backend

Write-Host ""
Write-Host "============================================================"
Write-Host "CONFIGURATION DE L'ENVIRONNEMENT PYTHON - BACKEND"
Write-Host "============================================================"
Write-Host ""

# Vérifier que Python est installé
Write-Host "Vérification de Python..."
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python trouvé: $pythonVersion"
} catch {
    Write-Host "✗ ERREUR: Python n'est pas trouvé ou pas dans PATH"
    Write-Host ""
    Write-Host "Solution:"
    Write-Host "1. Installez Python 3.8+ depuis https://www.python.org/"
    Write-Host "2. Cochez 'Add Python to PATH' durant l'installation"
    Write-Host "3. Redémarrez ce terminal"
    Write-Host "4. Réexécutez ce script"
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}
Write-Host ""

# Accéder au dossier backend
Write-Host "Configuration de l'environnement virtuel dans backend..."
Set-Location backend

# Créer l'environnement virtuel s'il n'existe pas
if (-not (Test-Path env)) {
    Write-Host "Création de l'environnement virtuel..."
    & python -m venv env
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ ERREUR: Impossible de créer l'environnement virtuel"
        Read-Host "Appuyez sur Entrée pour quitter"
        exit 1
    }
    Write-Host "✓ Environnement virtuel créé"
} else {
    Write-Host "✓ Environnement virtuel existe déjà"
}

Write-Host ""

# Activer l'environnement virtuel
Write-Host "Activation de l'environnement..."
& .\env\Scripts\Activate.ps1
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ ERREUR: Impossible d'activer l'environnement"
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}
Write-Host "✓ Environnement activé"
Write-Host ""

# Installer les dépendances
Write-Host "Installation des dépendances Python..."
& pip install -q python-docx docx2pdf
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ ERREUR: Impossible d'installer les dépendances"
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}
Write-Host "✓ Dépendances installées"
Write-Host ""

# Vérifier que tout fonctionne
Write-Host "Vérification de l'installation..."
& python -c "import docx, docx2pdf; print('✓ Modules importés avec succès')"
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ ERREUR: Les modules ne peuvent pas être importés"
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

Write-Host ""
Write-Host "============================================================"
Write-Host "✓ CONFIGURATION TERMINÉE AVEC SUCCÈS!"
Write-Host "============================================================"
Write-Host ""
Write-Host "L'environnement Python est prêt dans le dossier backend/"
Write-Host "Vous pouvez maintenant relancer le serveur Node.js:"
Write-Host "  npm start"
Write-Host ""
Read-Host "Appuyez sur Entrée pour quitter"
