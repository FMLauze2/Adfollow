import fs from 'fs';
import { PDFDocument } from 'pdf-lib';
import path from 'path';

export const generateContratPDF = async (contrat) => {
  const templatePath = path.join(__dirname, '..', 'templates', 'contrat_template.pdf');
  const pdfBytes = fs.readFileSync(templatePath);

  const pdfDoc = await PDFDocument.load(pdfBytes);

  // Calcul des dates
  const dateDebut = new Date(contrat.date_envoi || new Date());
  const dateFin = new Date(dateDebut);
  dateFin.setFullYear(dateDebut.getFullYear() + 1);

  // Texte à insérer
  const textes = {
    NOMBREPRATICIEN: contrat.praticiens.length.toString(),
    PRIX: (contrat.prix || 46).toString(),
    NOMCABINET: contrat.cabinet,
    ADRESSECABINET: contrat.adresse,
    CPCABINET: contrat.code_postal,
    VILLECABINET: contrat.ville,
    LISTEPRATICIENS: contrat.praticiens.join(', '),
    DATEDEBUT: dateDebut.toLocaleDateString(),
    DATEFIN: dateFin.toLocaleDateString(),
    DATEREALISATION: dateDebut.toLocaleDateString(),
  };

  // Récupération des champs du formulaire (AcroForm)
  const form = pdfDoc.getForm();

  // Pour chaque balise, on suppose qu'il y a un champ du même nom dans le PDF
  Object.entries(textes).forEach(([key, value]) => {
    try {
      const field = form.getTextField(key); // doit correspondre au nom du champ dans le PDF
      field.setText(value);
    } catch (err) {
      console.warn(`Champ "${key}" introuvable dans le PDF.`);
    }
  });

  // On peut aussi "aplatir" le formulaire pour que le texte devienne fixe
  form.flatten();

  const pdfBytesFinal = await pdfDoc.save();

  // Sauvegarde
  const outputDir = path.join(__dirname, 'uploads', 'contrats');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, `contrat_${contrat.id_contrat}.pdf`);
  fs.writeFileSync(outputPath, pdfBytesFinal);

  return outputPath;
};
