/**
 * utils.js - Fonctions utilitaires pour la checklist de déploiement
 * Contient les fonctions de manipulation de temps, de formatage et utilitaires
 */

/**
 * Convertit une durée au format HH:MM:SS en minutes entières
 * @param {string} str - Chaîne au format "HH:MM:SS"
 * @returns {number} - Nombre de minutes
 */
function parseTimeToMinutes(str) {
  if (!str) return 0;
  const parts = str.split(":");
  if (parts.length !== 3) return 0;
  return (
    parseInt(parts[0], 10) * 60 +
    parseInt(parts[1], 10) +
    Math.round(parseInt(parts[2], 10) / 60)
  );
}

/**
 * Formate un nombre de minutes en "Xh YYmin"
 * @param {number} mins - Nombre de minutes à formater
 * @returns {string} - Chaîne formatée
 */
function formatMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m.toString().padStart(2, "0")}min`;
}

/**
 * Applique l'accord grammatical singulier/pluriel à une unité
 * @param {number} count - Nombre d'éléments
 * @param {string} unit - Unité à accorder (avec forme au singulier)
 * @returns {string} - Unité accordée
 */
function accordUnit(count, unit) {
  // Pour les unités se terminant par (s), retirer les parenthèses conditionnelles
  if (unit.endsWith("(s)")) {
    const baseSingulier = unit.slice(0, -3);
    return count <= 1 ? baseSingulier : baseSingulier + "s";
  }

  // Pour les autres cas (singulier fourni)
  return count <= 1 ? unit : unit + "s";
}

/**
 * Détecte l'unité à afficher selon le label de la fonctionnalité
 * @param {string} label - Label de la fonctionnalité
 * @returns {string} - Unité détectée (au singulier)
 */
function getUnitFromLabel(label) {
  if (/par user/i.test(label)) return "utilisateur";
  if (/par site/i.test(label)) return "site";
  if (/par matrice/i.test(label)) return "matrice";
  if (/par arbo/i.test(label)) return "arborescence";
  if (/par fdp/i.test(label)) return "fonds de page";
  if (/profil/i.test(label)) return "profil";
  return "";
}

/**
 * Génère les badges HTML pour les produits compatibles
 * @param {string} fonctionnalite - Nom de la fonctionnalité
 * @returns {string} - HTML des badges
 */
function getProduitsHTML(fonctionnalite) {
  // Retire les indicateurs warning/licences pour la recherche
  const fonctionaliteBase = fonctionnalite
    .replace(/ \(warning\)| \(licences\)| \(warning \+ licences\)/g, "")
    .replace(/^\[PACKS\] |^\[MODULE\] /, "");

  // Recherche les produits compatibles
  let produits = [];

  // Cas spécial pour les DEMARRAGE COMPLET, SECRETARIAT JURIDIQUE etc.
  for (const [key, value] of Object.entries(moduleProduits)) {
    if (fonctionaliteBase.includes(key) || key.includes(fonctionaliteBase)) {
      produits = value;
      break;
    }
  }

  if (produits.length === 0) {
    return "";
  }

  // Génère les badges HTML
  let html = '<div style="margin-top:6px;">';
  produits.forEach((produit) => {
    const classe = produit.toLowerCase() + "-badge";
    html += `<span class="attention-badge ${classe}">${produit}</span>`;
  });
  html += "</div>";

  return html;
}

/**
 * Vérifie si une option cabinet est active dans le CSV
 * @param {string} optionName - Nom de l'option à vérifier
 * @returns {boolean} - True si l'option est active (IsActive=1), False sinon
 */
function isCabinetOptionActive(optionName) {
  // Si l'objet cabinetOptions n'existe pas, retourne false
  if (!window.cabinetOptions) return false;

  // Cherche l'élément dans checklistData qui correspond à cette option
  const optionConfig = window.checklistData.find(
    (item) =>
      item.THEME === "CABINET OPTION" && item.FONCTIONNALITES === optionName
  );

  // Récupère le nom technique depuis le champ csvName si disponible
  const technicalName =
    optionConfig && optionConfig.csvName ? optionConfig.csvName : optionName;

  // Si le nom technique est vide, c'est une option qui n'existe pas dans le CSV
  if (!technicalName) return false;

  // Recherche l'option dans le tableau par son nom technique
  const option = window.cabinetOptions.find(
    (opt) => opt.Nom.toLowerCase() === technicalName.toLowerCase()
  );

  // Retourne true si l'option existe et est active (IsActive = 1)
  return option ? option.IsActive === 1 : false;
}

/**
 * Récupère la description d'une option cabinet par son nom
 * @param {string} optionName - Nom de l'option à vérifier
 * @returns {string} - Description de l'option ou une chaîne vide si non trouvée
 */
function getCabinetOptionDescription(optionName) {
  // Si l'objet cabinetOptions n'existe pas, retourne une chaîne vide
  if (!window.cabinetOptions) return "";

  // Cherche l'élément dans checklistData qui correspond à cette option
  const optionConfig = window.checklistData.find(
    (item) =>
      item.THEME === "CABINET OPTION" && item.FONCTIONNALITES === optionName
  );

  // Récupère le nom technique depuis le champ csvName si disponible
  const technicalName =
    optionConfig && optionConfig.csvName ? optionConfig.csvName : optionName;

  // Si le nom technique est vide, retourne une chaîne vide
  if (!technicalName) return "";

  // Recherche l'option dans le tableau par son nom technique
  const option = window.cabinetOptions.find(
    (opt) => opt.Nom.toLowerCase() === technicalName.toLowerCase()
  );

  // S'il n'y a pas de correspondance exacte, chercher une correspondance partielle
  if (!option) {
    const optionPartielle = window.cabinetOptions.find(
      (opt) =>
        opt.Nom.toLowerCase().includes(technicalName.toLowerCase()) ||
        technicalName.toLowerCase().includes(opt.Nom.toLowerCase())
    );

    if (optionPartielle) {
      return optionPartielle.Description || "";
    }
  }

  // Retourne la description si l'option existe, sinon une chaîne vide
  return option && option.Description ? option.Description : "";
}
