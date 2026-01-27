# 🚀 Mise en route rapide - PDF Python intégré

## 5 minutes pour configurer

### 1️⃣ Configuration unique (une fois seulement)

```powershell
# Depuis la racine du projet
.\setup_backend_python.ps1
```

Cela:
- ✅ Crée un environnement Python dans `backend/env/`
- ✅ Installe les dépendances (`python-docx`, `docx2pdf`)
- ✅ Teste que tout fonctionne

### 2️⃣ Relancer le backend

```powershell
cd backend
npm start
```

### 3️⃣ C'est prêt! 🎉

Les PDFs générés utiliseront maintenant votre template Word professionnel.

---

## 📂 Où trouver les fichiers?

| Fichier | Localisation |
|---------|--------------|
| **Template du contrat** | `backend/services/pdf/templates/CONTRAT SERVICE.docx` |
| **Script Python** | `backend/services/pdf/generate_contrat.py` |
| **Wrapper Node.js** | `backend/services/pdf/generateContratPDFPython.js` |
| **Environnement Python** | `backend/env/` |

---

## ✏️ Modifier le template

1. Ouvrez `backend/services/pdf/templates/CONTRAT SERVICE.docx` dans Word
2. Éditez le contenu, style, logo, etc.
3. Sauvegardez
4. Les prochains PDFs générés utiliseront la nouvelle version ✓

---

## 🆘 Besoin d'aide?

### Python not found?
```powershell
python --version
# Si ça ne marche pas, réinstallez Python avec "Add Python to PATH" coché
```

### Module not found?
```powershell
.\setup_backend_python.ps1
# Relancez le script de configuration
```

### Template not found?
Vérifiez que `backend/services/pdf/templates/CONTRAT SERVICE.docx` existe.

---

## 📚 Documentation complète

- `REORGANIZATION_SUMMARY.md` - Vue d'ensemble de la réorganisation
- `CLEANUP.md` - Comment nettoyer après (optionnel)
- `backend/services/pdf/generate_contrat.py` - Code avec commentaires

---

## ✅ Vérifier que tout fonctionne

```powershell
.\test_integration.ps1
```

Vous devriez voir: `✓ TOUS LES TESTS SONT PASSÉS!`

---

**C'est tout!** Vous pouvez maintenant générer des PDF professionnels depuis votre application web. 🎉

