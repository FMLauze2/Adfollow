@echo off
REM Script de configuration Python pour le backend

echo.
echo ============================================================
echo CONFIGURATION DE L'ENVIRONNEMENT PYTHON - BACKEND
echo ============================================================
echo.

REM Vérifier que Python est installé
echo Vérification de Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ ERREUR: Python n'est pas trouvé ou pas dans PATH
    echo.
    echo Solution:
    echo 1. Installez Python 3.8+ depuis https://www.python.org/
    echo 2. Cochez "Add Python to PATH" durant l'installation
    echo 3. Redémarrez ce terminal
    echo 4. Réexécutez ce script
    pause
    exit /b 1
)
echo ✓ Python trouvé
python --version
echo.

REM Accéder au dossier backend
echo Configuration de l'environnement virtuel dans backend...
cd backend

REM Créer l'environnement virtuel s'il n'existe pas
if not exist env (
    echo Création de l'environnement virtuel...
    python -m venv env
    if %errorlevel% neq 0 (
        echo ✗ ERREUR: Impossible de créer l'environnement virtuel
        pause
        exit /b 1
    )
    echo ✓ Environnement virtuel créé
) else (
    echo ✓ Environnement virtuel existe déjà
)

echo.

REM Activer l'environnement virtuel
echo Activation de l'environnement...
call env\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo ✗ ERREUR: Impossible d'activer l'environnement
    pause
    exit /b 1
)
echo ✓ Environnement activé
echo.

REM Installer les dépendances
echo Installation des dépendances Python...
pip install -q python-docx docx2pdf
if %errorlevel% neq 0 (
    echo ✗ ERREUR: Impossible d'installer les dépendances
    pause
    exit /b 1
)
echo ✓ Dépendances installées
echo.

REM Vérifier que tout fonctionne
echo Vérification de l'installation...
python -c "import docx, docx2pdf; print('✓ Modules importés avec succès')"
if %errorlevel% neq 0 (
    echo ✗ ERREUR: Les modules ne peuvent pas être importés
    pause
    exit /b 1
)

echo.
echo ============================================================
echo ✓ CONFIGURATION TERMINÉE AVEC SUCCÈS!
echo ============================================================
echo.
echo L'environnement Python est prêt dans le dossier backend/
echo Vous pouvez maintenant relancer le serveur Node.js:
echo   npm start
echo.
pause
