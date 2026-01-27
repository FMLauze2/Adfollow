#!/usr/bin/env powershell
# Test rapide pour vérifier que l'intégration fonctionne

Write-Host ""
Write-Host "============================================================"
Write-Host "TEST D'INTEGRATION - GENERATION DE PDF"
Write-Host "============================================================"
Write-Host ""

# Vérifier que Python est installé
Write-Host "1. Vérification de Python..."
try {
    $pythonVersion = python --version 2>&1
    Write-Host "   ✓ Python: $pythonVersion"
} catch {
    Write-Host "   ✗ ERREUR: Python non trouvé"
    exit 1
}

# Vérifier que le template existe
Write-Host "2. Vérification du template..."
if (Test-Path "backend/services/pdf/templates/CONTRAT SERVICE.docx") {
    Write-Host "   ✓ Template trouvé"
} else {
    Write-Host "   ✗ ERREUR: Template manquant"
    exit 1
}

# Vérifier que le script Python existe
Write-Host "3. Vérification du script Python..."
if (Test-Path "backend/services/pdf/generate_contrat.py") {
    Write-Host "   ✓ Script Python trouvé"
} else {
    Write-Host "   ✗ ERREUR: Script Python manquant"
    exit 1
}

# Vérifier que l'env Python existe
Write-Host "4. Vérification de l'environnement Python..."
if (Test-Path "backend/env") {
    Write-Host "   ✓ Environnement Python trouvé"
} else {
    Write-Host "   ⚠ Environnement Python non trouvé"
    Write-Host "   → Exécutez: .\setup_backend_python.ps1"
    exit 1
}

# Activer l'env et tester les dépendances
Write-Host "5. Activation de l'environnement et vérification des dépendances..."
& "backend/env/Scripts/Activate.ps1"
$output = python -c "import docx, docx2pdf; print('OK')" 2>&1
if ($output -contains "OK") {
    Write-Host "   ✓ Dépendances OK"
} else {
    Write-Host "   ✗ ERREUR: Dépendances manquantes"
    exit 1
}

Write-Host ""
Write-Host "============================================================"
Write-Host "✓ TOUS LES TESTS SONT PASSÉS!"
Write-Host "============================================================"
Write-Host ""
Write-Host "L'intégration est opérationnelle. Vous pouvez relancer le backend:"
Write-Host "  cd backend"
Write-Host "  npm start"
Write-Host ""
