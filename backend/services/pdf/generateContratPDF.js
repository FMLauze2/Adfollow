const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Génère un PDF de contrat moderne, full HTML/CSS
async function generateContratPDF(contrat) {
  // Formatage des dates
  const dateDebut = new Date(contrat.date_debut || contrat.date_envoi || new Date());
  const dateFin = new Date(dateDebut);
  dateFin.setFullYear(dateDebut.getFullYear() + 1);
  dateFin.setDate(dateFin.getDate() - 1);
  const dateDebutFormatted = dateDebut.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  const dateFinFormatted = dateFin.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

  // Praticiens (toujours tableau)
  let praticiensArr = [];
  if (Array.isArray(contrat.praticiens)) {
    praticiensArr = contrat.praticiens;
  } else if (typeof contrat.praticiens === 'string') {
    praticiensArr = [contrat.praticiens];
  } else if (contrat.praticiens && typeof contrat.praticiens === 'object') {
    praticiensArr = Object.values(contrat.praticiens);
  }
  // S'assurer que chaque praticien est une string (ex: nom complet)
  praticiensArr = praticiensArr.map(p => {
    if (typeof p === 'string') return p;
    if (p && typeof p === 'object') {
      // Concatène nom/prénom si présents, sinon JSON.stringify
      if (p.nom || p.prenom) {
        return [p.prenom, p.nom].filter(Boolean).join(' ');
      }
      return Object.values(p).join(' ');
    }
    return String(p);
  });

  // HTML principal
  const legalText = `
<p><strong>Article 1 – OBJET</strong></p>
<p>Le présent contrat s'applique aux logiciels conçus par A.D.SION INFO SANTE<br>
A.D.SION INFO SANTE  s'engage aux conditions ci-après à fournir son service d'assistance téléphonique et télémaintenance (par modem) pour les logiciels faisant l'objet du présent contrat et désignés  au recto. La télémaintenance s'applique uniquement dans les cas suivants : recherche d'anomalie de fonctionnement (erreur de paramétrage, erreur de manipulation) et rectification du paramétrage, de la commande ou de la manipulation causant l'erreur. Tout logiciel non couvert par un contrat d'assistance téléphonique A.D.SION INFO SANTE  avant  l'entrée en vigueur du présent contrat devra, pour être qualifié, faire l'objet d'un examen  facturable, et,  éventuellement d'une  mise à niveau  par un  ingénieur A.D.SION INFO SANTE .. Ces  conditions générales  s'appliquent aux  contrats d'assistance téléphonique et télémaintenance des  logiciels A.D.SION INFO SANTE   utilisés par  le client  dans ses  locaux. Elles  remplacent toute  proposition ou  communication écrite  ou orale antérieure de A.D.SION INFO SANTE  ou du client.</p>
<p><strong>Article 2 - DUREE</strong></p>
<p>Le présent contrat est conclu  sous réserve du paiement de la redevance pour  une période initiale de UN an, à compter de  la date anniversaire de prise d’effet du contrat. Il sera renouvelé  par tacite reconduction à  l'expiration de chaque période de  douze mois, à moins d'avoir  été dénoncé par l'une  ou l'autre des parties, 3 mois avant la date d'expiration par LRAR.</p>
<p><strong>Article 3 - PRESTATIONS FOURNIES</strong></p>
<p>Pendant la durée du présent contrat, A.D.SION INFO SANTE  s'engage à :</p>
<ol>
<li>Une  assistance téléphonique ou télémaintenance sur  appel du client  de 9h00 à  12h30 et de  13h45 à 18h00,  du lundi au  jeudi (9h00 à 12h30  et 13h45 à  17h00 le vendredi) hors jours fériés. Une intervention  téléphonique sera fournie dans les 9 heures ouvrées suivantes  ;</li>
<li>Envoyer les nouvelles versions éventuelles du logiciel après leur publication, seuls les frais de support et d'expédition seront facturés. Informer régulièrement sur les nouveaux programmes et services :  nouvelles versions des produits existants.</li>
<li>Corriger les dysfonctionnements des logiciels, apporter les éventuelles améliorations et / ou enrichissements, mettre en adéquation les logiciels avec la règlementation en vigueur. A.D.SION INFO SANTE  ne peut être tenu pour responsable notamment  en cas de coupure de courant  ou de mauvaise manipulation ou de virus. Ce service "Dernière  Chance" (récupération de fichiers endommagés lorsque  vous n'avez pas  fait ce qu'il  fallait faire) fait l'objet  d'un tarif réduit.  Le client devra  laisser le personnel  de A.D.SION INFO SANTE  accéder librement aux logiciels, objet du présent pour lui permettre d'assurer ses prestations.</li>
<li>Tous  les salariés de  A.D.SION INFO SANTE  sont soumis  au secret professionnel et ont instruction de respecter le caractère confidentiel des données du client.</li>
</ol>
<p><strong>Article 4 - PRESTATIONS NON FOURNIES</strong></p>
<p>Ne sont pas comprises dans le présent contrat, et donc facturables selon les tarifs en vigueur, après acceptation du client :</p>
<ol>
<li>Les fournitures courantes : disquettes, rubans, etc... ;</li>
<li>Les manuels d'utilisation  ;</li>
<li>Les formations  complémentaires à l'utilisation des progiciels A.D.SION INFO SANTE .Les formations concernant les  mises à niveau et les  nouvelles versions du produit . Les formations concernant de nouveaux utilisateurs du client non encore  formés par A.D.SION INFO SANTE  ;</li>
<li>Les nouveaux produits, les modules logiciels complémentaires et les modules externes interfacés.</li>
<li>Les interventions sur site demandées  par le client dans le but de lui éviter des manipulations habituellement  assistées par téléphone ;  </li>
<li>Les interventions pour la remise en état des fichiers du client,  par suite d'erreur de manipulation ou d'absence de sauvegarde et de coupure de courant ou  panne matérielle régulière. Il  est précisé que A.D.SION INFO SANTE   ne pourra être tenu  pour responsable s'il est  conduit, dans ce cas,  à détruire partiellement ou totalement des informations du client pour la remise en fonctionnement du progiciel; </li>
<li>La réalisation d'adjonction spécifiques au client, L'assistance fournie par A.D.SION INFO SANTE  est limitée à celle qu'on peut raisonnablement fournir dans le cadre d'une conversation téléphonique. Toute intervention nécessitant un  échange de données complémentaires, sous forme  écrite ou lisible par machine, ou  nécessitant un déplacement de personne, est explicitement exclue du présent contrat.</li>
<li>Les frais de supports informatiques et leur expédition, dans le cas de nouvelle version.</li>
</ol>
<p><strong>Article 5 - REDEVANCE, PAIEMENT</strong></p>
<p>Ces prestations  sont fournies en  contrepartie d'une redevance annuelle forfaitaire révisable annuellement en fonction de l’évolution de l’indice SYNTEC. Etant précisé que le non paiement d'une facture liée aux interventions du A.D.SION INFO SANTE  (achat de matériels, fournitures, prestations diverses, etc. ...) entraînera immédiatement la suspension du présent contrat sans mise en demeure préalable. Le redevance annuelle restant néanmoins due, ainsi que toutes les facturations en cours. Cette redevance  est facturée  d'avance à la date de début de service indiquée au recto, puis  à la date anniversaire de celle-ci lors des reconductions. Toutes les factures sont payables net et sans escompte à réception par prélèvement bancaire. Le tarif de la demi-journée sur site sera calculé en fonction du prix actuellement applicable qui est de 304.- €/HT + frais de mission, majoré des variations que ce prix aura subi au jour de la prestation de "service".</p>
<p><strong>Article 6 - RECOURS DU CLIENT, NATURE ET ETENDUE</strong></p>
<p>Aucun manquement à  ses obligations contractuelles  ne pourra être invoqué contre  A.D.SION INFO SANTE  avant que A.D.SION INFO SANTE  n'ait eu raisonnablement la  possibilité de répondre dans le délai fixé à l'article 3.<br>
A.D.SION INFO SANTE  n'est en aucun cas responsable :<br>
- des dommages  dûs à l'inexécution par  le client de ses  obligations. Les logiciels devront être  utilisés sur une configuration  appropriée ; et conformément à  leur but ;<br>
- des dommages indirects, de pertes et bénéfices ;<br>
- des  dommages dûs aux  circonstances échappant  à son contrôle  (grèves, troubles, incendies, virus...).<br>
- Même si A.D.SION INFO SANTE  a eu connaissance de la possilité de survenance de tels dommages.<br>
- Des pertes de fichiers dans la mesure où les sauvegardes ne sont pas réalisées par l’utlisateur.<br>
Les  parties conviennent  de limiter  la responsabilité  de A.D.SION INFO SANTE .,  quel  que soit  le fondement  juridique de  l'action envisagée,  au montant  des prestations réglées par le client et non conformes aux prestations prévues. Dans le cadre du présent contrat, A.D.SION INFO SANTE  a une obligation de moyen et non de résultat. A.D.SION INFO SANTE   sera dégagé de ses obligations de  garantie si des logiciels non qualifiés  ont accés en écriture aux fichiers  utilisés par les logiciels qualifiés.</p>
<p><strong>Article 7 - GENERALITES</strong></p>
<p>Le présent contrat annule et remplace tous les accords antérieurs entre  les parties, écrits ou verbaux, ayant le même objet. Toute modification de l'une quelconque de ces dispositions ne pourra prendre effet qu'après avoir fait l'objet d'un accord écrit dûment signé par les parties. Les termes du présent contrat prévaudront sur toutes les conditions pouvant figurer sur les commandes ou autres documents émis par A.D.SION INFO SANTE .. Le présent contrat devra être présenté  avec les logiciels correspondants pour toute demande d'intervention au titre de A.D.SION INFO SANTE  MAINTENANCE. Ces documents font seuls foi de l'exigence d'un contrat de service en cours  de validité pour les  logiciels considérés. Le présent contrat  est régi par le Droit  Français. En cas de  constestation sur son interprétation ou son exécution, le Tribunal de Commerce de Montpellier sera le seul compétent.<br>
Si l'une des parties manque à ses obligations au titre des présentes, l'autre partie pourra résilier son contrat immédiatement et sans indémnité, s'il n'a  pas été remédié  à ce manquement  suivant notification écrite  à la  partie concernée.</p>
`;
  const montant = contrat.prix ? Number(contrat.prix).toFixed(2) : '0.00';
  const montantStr = `${montant}€ TTC ( index syntec ${dateDebut.getFullYear()} ) par praticien/mois`;

  // Lecture et encodage de la signature en base64
  let signatureBase64 = '';
  try {
    const sigPath = require('path').join(__dirname, 'templates', 'signature.png');
    const sigData = require('fs').readFileSync(sigPath);
    signatureBase64 = `data:image/png;base64,${sigData.toString('base64')}`;
  } catch (e) {
    signatureBase64 = '';
  }

  const htmlContent = `<!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Contrat - ${contrat.cabinet}</title>
      <style>
        html, body { height: 100%; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; color: #222; margin: 0; min-height: 100vh; display: flex; flex-direction: column; }
        .container { max-width: 900px; min-height: 97vh; height: 97vh; display: flex; flex-direction: column; justify-content: flex-start; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px #0001; padding: 18px 24px 8px 24px; box-sizing: border-box; }
        .main-title { color: #2563eb; font-size: 2em; font-weight: 700; text-align: center; margin-bottom: 0; }
        .subtitle { text-align: center; color: #2563eb; font-size: 1em; margin-bottom: 6px; }
        .divider { border: none; border-top: 3px solid #2563eb; margin: 12px 0 18px 0; }
        .section-title { color: #2563eb; font-size: 1em; font-weight: 700; margin-top: 18px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
        .cabinet-info { background: #f6faff; border-radius: 8px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
        .cabinet-labels { color: #2563eb; font-weight: 600; min-width: 120px; font-size: 0.98em; }
        .cabinet-values { text-align: right; font-weight: 600; font-size: 0.98em; }
        .praticiens-block { background: #eaf2ff; border-radius: 8px; padding: 8px 12px; margin-bottom: 10px; }
        .praticien-item { display: flex; align-items: center; font-size: 1em; margin-bottom: 2px; }
        .praticien-item:last-child { margin-bottom: 0; }
        .praticien-check { color: #2563eb; font-size: 1.1em; margin-right: 6px; }
        .montant-block { background: linear-gradient(90deg, #2563eb 60%, #3b82f6 100%); color: #fff; border-radius: 10px; padding: 10px 0 6px 0; text-align: center; font-size: 1.1em; font-weight: 700; margin-bottom: 10px; }
        .montant-desc { font-size: 0.85em; color: #e0e7ff; font-weight: 400; margin-top: 2px; }
        .duree-block { display: flex; gap: 16px; margin-bottom: 10px; }
        .duree-item { flex: 1; background: #f5f3ff; border: 2px solid #a5b4fc; border-radius: 8px; padding: 8px 10px; text-align: center; }
        .duree-label { color: #7c3aed; font-weight: 600; font-size: 0.95em; margin-bottom: 2px; }
        .duree-date { color: #222; font-size: 1em; font-weight: 500; }
        .signatures {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-top: 60px;
          min-height: 120px;
          position: relative;
        }
        .signature-block {
          width: 45%;
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
        }
        .signature-label { margin-top: 10px; color: #444; font-size: 0.95em; }
        .cachet { margin-top: 8px; color: #888; font-size: 0.9em; }
        .signature-line {
          margin: 170px auto 0 auto;
          border-bottom: 1.5px solid #bbb;
          width: 85%;
          height: 38px;
        }
        .sion-sign { margin-top: 4px; }
        .page-break { page-break-before: always; break-before: page; }
        .legal { background: #f0f4ff; border-left: 4px solid #2563eb; padding: 12px 16px; border-radius: 8px; margin-top: 18px; font-size: 0.95em; color: #222; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="main-title">Contrat de services — A.D.SION INFO SANTÉ - Méd'OC</div>
        <div class="subtitle">SERVICES : Assistance logiciel Med’Oc</div>
        <hr class="divider" />
        <div class="section-title">Informations Cabinet</div>
        <div class="cabinet-info">
          <div>
            <div class="cabinet-labels">Cabinet:<br>Adresse:<br>Code Postal:<br>Ville:</div>
          </div>
          <div class="cabinet-values">
            <div>${contrat.cabinet || ''}</div>
            <div>${contrat.adresse || ''}</div>
            <div>${contrat.code_postal || ''}</div>
            <div>${contrat.ville || ''}</div>
          </div>
        </div>
        <div class="section-title">Praticiens (${praticiensArr.length})</div>
        <div class="praticiens-block">
          ${praticiensArr.map(p => `<div class="praticien-item"><span class="praticien-check">✓</span> ${p}</div>`).join('')}
        </div>
        <div class="montant-block">
          ${montantStr}
          <div class="montant-desc">Le montant de la redevance annuelle variera chaque année en fonction de l'évolution de l'indice "SYNTEC"</div>
        </div>
        <div class="section-title">Durée du contrat</div>
        <div class="duree-block">
          <div class="duree-item">
            <div class="duree-label">DATE DE DÉBUT</div>
            <div class="duree-date">${dateDebutFormatted}</div>
          </div>
          <div class="duree-item">
            <div class="duree-label">DATE DE FIN</div>
            <div class="duree-date">${dateFinFormatted}</div>
          </div>
        </div>
        <div class="signatures">
          <div class="signature-block">
            <div style="font-weight:500; margin-bottom:8px; min-height:24px; display:flex; align-items:center; justify-content:center;">Pour le Cabinet</div>
            <div class="signature-line"></div>
            <div class="cachet">Signature et cachet commercial client</div>
          </div>
          <div class="signature-block">
            <div style="font-weight:500; margin-bottom:8px; min-height:24px; display:flex; align-items:center; justify-content:center;">Pour A.D.SION Info Santé</div>
            ${signatureBase64 ? `<img src="${signatureBase64}" alt="Signature Sion" style="height: 140px; display: block; margin: 0 auto 8px auto;" />` : '<div style="height:140px;"></div>'}
            <div style="font-size:0.95em; color:#222;">A.D.SION INFO SANTÉ<br>Future Building II - 1280 avenue des Platanes<br>34970 Lattes-Boirargues - 04 67 65 44 49<br>SIRET 39839782100039</div>
          </div>
        </div>
      </div>
      <div class="page-break"></div>
      <div class="container">
        <div class="section-title">Mentions légales</div>
        <div class="legal">
          ${legalText}
        </div>
      </div>
    </body>
    </html>`;

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

  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  await page.emulateMediaType('print').catch(() => {});
  await new Promise(resolve => setTimeout(resolve, 250));

  // Générer le PDF avec nom du cabinet (sanitize pour éviter caractères invalides)
  const outputDir = path.join(__dirname, 'uploads', 'contrats');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const cabinetSafe = (contrat.cabinet || '').replace(/[^a-z0-9_\-\s]/gi, '').replace(/\s+/g, '_');
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
}

module.exports = { generateContratPDF };