const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { generateContratPDFHTML } = require('./generateContratPDFHTML');

async function generateContratPDF(contrat) {
  try {
    // Générer le HTML
    const htmlContent = await generateContratPDFHTML(contrat);

    // Lancer Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Charger le contenu HTML
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Créer le dossier de destination s'il n'existe pas
    const outputDir = path.join(__dirname, 'uploads', 'contrats');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Générer le PDF
    const outputPath = path.join(outputDir, `contrat_${contrat.id_contrat}.pdf`);
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
      displayHeaderFooter: false
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