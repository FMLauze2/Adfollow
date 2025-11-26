const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { generateContratPDFHTML } = require('./generateContratPDFHTML');

async function generateContratPDF(contrat) {
  try {
    // Générer le HTML
    const htmlContent = await generateContratPDFHTML(contrat);

    // Pour debug : écrire le HTML généré dans un fichier afin de vérifier l'image
    try {
      const debugDir = path.join(__dirname, 'uploads', 'contrats', 'debug');
      if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
      const debugHtmlPath = path.join(debugDir, `contrat_${contrat.id_contrat}.html`);
      fs.writeFileSync(debugHtmlPath, htmlContent, 'utf8');
      console.log(`DEBUG HTML écrit: ${debugHtmlPath}`);
    } catch (e) {
      console.warn('Impossible d\'écrire le debug HTML:', e.message);
    }

    // Lancer Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Charger le contenu HTML
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Emuler le média d'impression pour que les règles @media print soient prises en compte
    try {
      await page.emulateMediaType('print');
    } catch (e) {
      // ignore si non supporté
    }

    // Petit délai pour s'assurer que tout est rendu (images/data-URI, polices, etc.)
    await new Promise(resolve => setTimeout(resolve, 250));

    // Écrire une capture d'écran de debug pour vérifier le rendu dans Chromium
    try {
      const debugDir = path.join(__dirname, 'uploads', 'contrats', 'debug');
      if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
      const screenshotPath = path.join(debugDir, `contrat_${contrat.id_contrat}_screenshot.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`DEBUG screenshot écrit: ${screenshotPath}`);
    } catch (e) {
      console.warn('Impossible d\'écrire le screenshot de debug:', e.message);
    }

    // Créer le dossier de destination s'il n'existe pas
    const outputDir = path.join(__dirname, 'uploads', 'contrats');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Générer le PDF avec nom du cabinet (sanitize pour éviter caractères invalides)
    const cabinetSafe = contrat.cabinet.replace(/[^a-z0-9_\-\s]/gi, '').replace(/\s+/g, '_');
    const outputPath = path.join(outputDir, `Contrat_de_services_${cabinetSafe}.pdf`);
    await page.pdf({
      path: outputPath,
      format: 'A4',
      margin: {
        top: '5mm',
        right: '5mm',
        bottom: '5mm',
        left: '5mm'
      },
      printBackground: true,
      displayHeaderFooter: false,
      title: `Contrat de services ${contrat.cabinet}`
    });

    await browser.close();

    console.log(`PDF généré: ${outputPath}`);
    return outputPath;

  } catch (err) {
    console.error('Erreur lors de la génération du PDF:', err);
    throw err;
  }
}

module.exports = { generateContratPDF };