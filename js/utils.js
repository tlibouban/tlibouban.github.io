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
    .replace(/^\[PACKS\] |^\[MODULE\] /, "")
    .trim();

  let produits = [];

  // Charger les formations depuis le JSON si pas déjà fait
  if (!window.formationsLogiciels) {
    // Essayer de charger de façon synchrone si possible
    fetch("json/formations_logiciels.json")
      .then((response) => response.json())
      .then((data) => {
        window.formationsLogiciels = data.formations;
      })
      .catch((error) => {
        console.warn(
          "Erreur lors du chargement des formations logiciels:",
          error
        );
        window.formationsLogiciels = [];
      });

    // Utiliser l'ancien système en attendant
    return getProduitsHTMLFromModuleProduits(fonctionaliteBase);
  }

  // Rechercher dans le fichier JSON des formations
  const formation = window.formationsLogiciels.find((f) => {
    const nomFormation = f.nom
      .replace(/[^\w\s]/g, "")
      .trim()
      .toLowerCase();
    const fonctionnaliteSearch = fonctionaliteBase
      .replace(/[^\w\s]/g, "")
      .trim()
      .toLowerCase();

    // Correspondance exacte
    if (nomFormation === fonctionnaliteSearch) return true;

    // Correspondance partielle (contient)
    if (
      nomFormation.includes(fonctionnaliteSearch) ||
      fonctionnaliteSearch.includes(nomFormation)
    )
      return true;

    // Correspondances spécifiques
    if (
      fonctionnaliteSearch.includes("online") &&
      nomFormation.includes("online")
    )
      return true;
    if (
      fonctionnaliteSearch.includes("analytics") &&
      nomFormation.includes("analytics")
    )
      return true;
    if (
      fonctionnaliteSearch.includes("digitaldoc") &&
      nomFormation.includes("digital doc")
    )
      return true;
    if (
      fonctionnaliteSearch.includes("dictaplus") &&
      nomFormation.includes("dicta")
    )
      return true;
    if (
      fonctionnaliteSearch.includes("brain") &&
      nomFormation.includes("intelligence artificielle")
    )
      return true;
    if (
      fonctionnaliteSearch.includes("rpva") &&
      nomFormation.includes("e-barreau")
    )
      return true;
    if (
      fonctionnaliteSearch.includes("saisie immobilière") &&
      nomFormation.includes("saisie immobilière")
    )
      return true;
    if (
      fonctionnaliteSearch.includes("actions liées") &&
      nomFormation.includes("actions liées")
    )
      return true;
    if (
      fonctionnaliteSearch.includes("gestion de dossier") &&
      nomFormation.includes("gestion de dossiers")
    )
      return true;
    if (
      fonctionnaliteSearch.includes("gestion financière") &&
      nomFormation.includes("gestion financière")
    )
      return true;
    if (
      fonctionnaliteSearch.includes("gestion intégrée") &&
      nomFormation.includes("gestion intégrée")
    )
      return true;
    if (
      fonctionnaliteSearch.includes("assistance au démarrage") &&
      nomFormation.includes("assistance au démarrage")
    )
      return true;
    if (
      fonctionnaliteSearch.includes("validation des connaissances") &&
      nomFormation.includes("validation des connaissances")
    )
      return true;
    if (
      fonctionnaliteSearch.includes("secrétariat juridique") &&
      nomFormation.includes("secrétariat juridique")
    )
      return true;
    if (
      fonctionnaliteSearch.includes("passer de air à neo") &&
      nomFormation.includes("passer de air à néo")
    )
      return true;
    if (
      fonctionnaliteSearch.includes("facturation avancée") &&
      nomFormation.includes("facturation avancée")
    )
      return true;
    if (
      fonctionnaliteSearch.includes("processus de facturation") &&
      nomFormation.includes("processus de facturation")
    )
      return true;
    if (
      fonctionnaliteSearch.includes("calcul d'intérêt") &&
      nomFormation.includes("calcul d'intérêt")
    )
      return true;
    if (
      fonctionnaliteSearch.includes("modification simple de matrices") &&
      nomFormation.includes("modification simple de matrices")
    )
      return true;
    if (
      fonctionnaliteSearch.includes("pilotage de l'activité") &&
      nomFormation.includes("pilotage de l'activité")
    )
      return true;
    if (
      fonctionnaliteSearch.includes("audit de pratique") &&
      nomFormation.includes("audit de pratique")
    )
      return true;
    if (
      fonctionnaliteSearch.includes("suivi personnalisé") &&
      nomFormation.includes("suivi personnalisé")
    )
      return true;
    if (
      fonctionnaliteSearch.includes("accompagnement sur mesure") &&
      nomFormation.includes("accompagnement sur mesure")
    )
      return true;
    if (
      fonctionnaliteSearch.includes("formation en ligne") &&
      nomFormation.includes("formation en ligne")
    )
      return true;
    if (
      fonctionnaliteSearch.includes("interface comptable") &&
      nomFormation.includes("interface comptable")
    )
      return true;
    if (
      fonctionnaliteSearch.includes("paramétrage de base") &&
      nomFormation.includes("paramétrage de base")
    )
      return true;
    if (
      fonctionnaliteSearch.includes("paramétrage ledes") &&
      nomFormation.includes("paramétrage ledes")
    )
      return true;

    return false;
  });

  if (formation) {
    produits = formation.logiciels || [];
  }

  // Si rien trouvé dans le JSON, utiliser l'ancien système
  if (produits.length === 0) {
    return getProduitsHTMLFromModuleProduits(fonctionaliteBase);
  }

  // Génère les badges HTML
  if (produits.length === 0) {
    return "";
  }

  let html = '<div style="margin-top:6px;">';
  produits.forEach((produit) => {
    const classe = produit.toLowerCase() + "-badge";
    html += `<span class="attention-badge ${classe}">${produit}</span>`;
  });
  html += "</div>";

  return html;
}

/**
 * Version de fallback utilisant l'ancien système moduleProduits
 * @param {string} fonctionaliteBase - Nom de la fonctionnalité nettoyé
 * @returns {string} - HTML des badges
 */
function getProduitsHTMLFromModuleProduits(fonctionaliteBase) {
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

/**
 * Force la mise à jour complète des totaux d'utilisateurs
 * Cette fonction est appelée après la mise à jour des profils depuis les données TSV
 */
function forceUpdateUsersCalculation() {
  console.log("🔧 Forcing complete users calculation update...");

  // Vérifier que les éléments nécessaires existent
  const profilsDiv = document.getElementById("profils-dyn-list");
  const utilisateursNb = document.getElementById("utilisateurs-nb");
  const effectifInput = document.getElementById("effectif");

  if (!profilsDiv || !utilisateursNb || !window.profilsDynList) {
    console.warn("❌ Éléments manquants pour le calcul des utilisateurs");
    return false;
  }

  console.log("📊 État actuel des profils:", window.profilsDynList);

  // Calculer le total des utilisateurs (TOUS les profils, pas seulement cochés)
  let totalUsers = 0;
  window.profilsDynList.forEach((profil, idx) => {
    const nb = profil.nb || 0;
    totalUsers += nb;
    console.log(`  - ${profil.nom}: ${nb} utilisateurs`);
  });

  console.log(`👤 Total calculé: ${totalUsers} utilisateurs`);

  // Mettre à jour le champ nombre d'utilisateurs DIRECTEMENT
  utilisateursNb.value = totalUsers;

  // Vérifier la cohérence avec l'effectif TSV
  if (effectifInput && effectifInput.value) {
    const effectifTSV = parseInt(effectifInput.value, 10);
    if (totalUsers !== effectifTSV) {
      console.warn(
        `⚠️ Incohérence: ${totalUsers} utilisateurs ≠ ${effectifTSV} effectif TSV`
      );
    } else {
      console.log(`✅ Cohérence vérifiée: ${totalUsers} = ${effectifTSV}`);
    }
  }

  // Forcer la mise à jour des totaux
  if (typeof updateTotals === "function") {
    updateTotals();
    console.log("🔄 updateTotals() forcé depuis forceUpdateUsersCalculation()");
  }

  return true;
}

/**
 * Débugger les données de profils et leur état
 */
function debugProfilesState() {
  console.log("🐛 DEBUG: État complet des profils");
  console.log("📋 window.profilsDynList:", window.profilsDynList);

  // Vérifier les éléments de profil dans le tableau principal
  console.log("🎯 Éléments DOM des profils dans le tableau principal:");

  const checkboxes = document.querySelectorAll(".check-feature-profil");
  const numbers = document.querySelectorAll(".profil-nb");
  const modifs = document.querySelectorAll(".profil-modif");

  console.log(`  - Checkboxes: ${checkboxes.length}`);
  console.log(`  - Number inputs: ${numbers.length}`);
  console.log(`  - Modif switches: ${modifs.length}`);

  numbers.forEach((input, idx) => {
    console.log(
      `  - Profil ${idx}: value="${input.value}", data-idx="${input.dataset.idx}"`
    );
  });

  const utilisateursNb = document.getElementById("utilisateurs-nb");
  if (utilisateursNb) {
    console.log(`👤 utilisateurs-nb.value: "${utilisateursNb.value}"`);
  }

  const effectifInput = document.getElementById("effectif");
  if (effectifInput) {
    console.log(`📊 effectif.value: "${effectifInput.value}"`);
  }
}

/**
 * Fonction pour vérifier en temps réel si le calcul des utilisateurs est correct
 */
function verifyUsersCalculation() {
  console.log("🔍 Vérification du calcul des utilisateurs");

  if (!window.profilsDynList) {
    console.log("❌ Aucune liste de profils trouvée");
    return false;
  }

  let expectedTotal = 0;
  let actualCheckedTotal = 0;

  window.profilsDynList.forEach((profil, idx) => {
    const checkbox = document.querySelector(`#profil-check-${idx}`);
    const numberInput = document.querySelector(`#profil-nb-${idx}`);

    const isChecked = checkbox ? checkbox.checked : false;
    const nb = numberInput ? parseInt(numberInput.value, 10) : 0;

    expectedTotal += nb; // Total de tous les profils
    if (isChecked) {
      actualCheckedTotal += nb; // Total seulement des profils cochés
    }

    console.log(
      `  📊 Profil ${idx} (${profil.nom}): nb=${nb}, checked=${isChecked}`
    );
  });

  const utilisateursNb = document.getElementById("utilisateurs-nb");
  const displayedTotal = utilisateursNb
    ? parseInt(utilisateursNb.value, 10)
    : 0;

  console.log(`📈 Résultats:`);
  console.log(`  - Total attendu (cochés): ${actualCheckedTotal}`);
  console.log(`  - Total affiché: ${displayedTotal}`);
  console.log(`  - Total de tous les profils: ${expectedTotal}`);

  const isCorrect = displayedTotal === actualCheckedTotal;
  console.log(
    `${isCorrect ? "✅" : "❌"} Le calcul est ${
      isCorrect ? "correct" : "incorrect"
    }`
  );

  return isCorrect;
}

/**
 * Fonction pour déclencher manuellement un recalcul et vérifier le résultat
 */
function recalculateAndVerify() {
  console.log("🔄 Recalcul forcé et vérification");

  if (typeof updateTotals === "function") {
    updateTotals();

    // Vérifier après un court délai
    setTimeout(() => {
      verifyUsersCalculation();
    }, 100);
  } else {
    console.log("❌ Fonction updateTotals non disponible");
  }
}

/**
 * Convertit les minutes en journées de 7h avec arrondi à la moitié supérieure
 * @param {number} mins - Nombre de minutes
 * @returns {number} - Nombre de journées (arrondi à la moitié supérieure)
 */
function convertToJournees(mins) {
  const journees = mins / (7 * 60);

  // Arrondi à la moitié supérieure : 18,3 → 18,5 et 18,7 → 19
  const partieEntiere = Math.floor(journees);
  const partieDecimale = journees - partieEntiere;

  if (partieDecimale === 0) {
    return journees; // Nombre entier, pas d'arrondi nécessaire
  } else if (partieDecimale <= 0.5) {
    return partieEntiere + 0.5; // Arrondir à la moitié
  } else {
    return partieEntiere + 1; // Arrondir à l'unité supérieure
  }
}

/**
 * Convertit les minutes en demi-journées de 3h30
 * @param {number} mins - Nombre de minutes
 * @returns {number} - Nombre de demi-journées (arrondi à l'entier supérieur)
 */
function convertToDemiJournees(mins) {
  return Math.ceil(mins / (3.5 * 60)); // 3h30 = 210 minutes
}

/**
 * Formate l'affichage des journées avec accord grammatical
 * @param {number} mins - Nombre de minutes
 * @param {number} minsParametrage - Nombre de minutes de paramétrage (optionnel)
 * @returns {string} - Texte formaté
 */
function formatJournees(mins, minsParametrage = 0) {
  const journees = convertToJournees(mins);
  const journeesParametrage =
    minsParametrage > 0 ? convertToJournees(minsParametrage) : 0;

  // Formatage avec 1 décimale si nécessaire
  const journeesFormatted =
    journees % 1 === 0
      ? journees.toString()
      : journees.toFixed(1).replace(".", ",");
  const journeesParametrageFormatted =
    journeesParametrage % 1 === 0
      ? journeesParametrage.toString()
      : journeesParametrage.toFixed(1).replace(".", ",");

  // Accord grammatical
  const motJournee = journees <= 1 ? "journée" : "journées";
  const motJourneeParametrage =
    journeesParametrage <= 1 ? "journée" : "journées";

  let result = `${journeesFormatted} ${motJournee}`;

  if (minsParametrage > 0 && journeesParametrage > 0) {
    result += ` - dont ${journeesParametrageFormatted} ${motJourneeParametrage} de paramétrage`;
  }

  return result;
}

/**
 * Formate l'affichage des demi-journées avec accord grammatical
 * @param {number} mins - Nombre de minutes
 * @param {number} minsParametrage - Nombre de minutes de paramétrage (optionnel)
 * @returns {string} - Texte formaté
 */
function formatDemiJournees(mins, minsParametrage = 0) {
  const demiJournees = convertToDemiJournees(mins);
  const demiJourneesParametrage =
    minsParametrage > 0 ? convertToDemiJournees(minsParametrage) : 0;

  // Accord grammatical
  const motDemiJournee = demiJournees <= 1 ? "demi-journée" : "demi-journées";
  const motDemiJourneeParametrage =
    demiJourneesParametrage <= 1 ? "demi-journée" : "demi-journées";

  let result = `${demiJournees} ${motDemiJournee}`;

  if (minsParametrage > 0 && demiJourneesParametrage > 0) {
    result += ` - dont ${demiJourneesParametrage} ${motDemiJourneeParametrage} de paramétrage`;
  }

  return result;
}

/**
 * Formate l'affichage des heures avec indication du paramétrage
 * @param {number} mins - Nombre de minutes
 * @param {number} minsParametrage - Nombre de minutes de paramétrage (optionnel)
 * @returns {string} - Texte formaté
 */
function formatMinutesAvecParametrage(mins, minsParametrage = 0) {
  const heuresFormatees = formatMinutes(mins);

  if (minsParametrage > 0) {
    const heuresParametrageFormatees = formatMinutes(minsParametrage);
    return `${heuresFormatees} - dont ${heuresParametrageFormatees} de paramétrage`;
  }

  return heuresFormatees;
}

/**
 * Calcule le nombre de formateurs nécessaires pour le déploiement
 * @param {number} totalJours - Nombre total de jours de formation (en excluant validation)
 * @param {boolean} hasParametrage - Si le paramétrage est présent
 * @param {number} semaines - Nombre de semaines pour le déploiement (1 ou 2)
 * @returns {number} - Nombre de formateurs nécessaires
 */
function calculateFormateurs(totalJours, hasParametrage, semaines = 1) {
  if (totalJours <= 0) return 0;

  let joursDisponibles = 0;

  if (hasParametrage) {
    if (semaines === 1) {
      joursDisponibles = 4; // 4 jours par formateur la première semaine
    } else if (semaines === 2) {
      joursDisponibles = 4 + 5; // 4 jours première semaine + 5 jours deuxième semaine
    }
  } else {
    // Sans paramétrage, utiliser les capacités standard
    joursDisponibles = semaines * 5; // 5 jours par semaine
  }

  return Math.ceil(totalJours / joursDisponibles);
}

/**
 * Génère l'affichage du calcul de formateurs
 * @param {number} totalJours - Nombre total de jours
 * @param {boolean} hasParametrage - Si le paramétrage est présent
 * @returns {string} - HTML de l'affichage des formateurs
 */
function formatFormateurs(totalJours, hasParametrage) {
  if (totalJours <= 0) return "0 formateur";

  const formateurs1Semaine = calculateFormateurs(totalJours, hasParametrage, 1);
  const formateurs2Semaines = calculateFormateurs(
    totalJours,
    hasParametrage,
    2
  );

  let html = `<div style="font-size: 0.9em; color: #666; margin-top: 4px;">`;
  html += `• 1 semaine: ${formateurs1Semaine} ${accordUnit(
    formateurs1Semaine,
    "formateur"
  )}<br>`;
  html += `• 2 semaines: ${formateurs2Semaines} ${accordUnit(
    formateurs2Semaines,
    "formateur"
  )}`;
  html += `</div>`;

  return html;
}

// =====================
// Attribution d'ID automatiques
// =====================
/**
 * Parcourt le DOM et attribue un id aux éléments qui n'en ont pas encore.
 * Les id sont construits sous la forme `${prefix}-${n}` où `prefix` est basé
 * sur le nom de la balise et éventuellement sa classe principale.
 * @param {HTMLElement} [root=document.body] – Noeud racine à parcourir
 */
function assignAutoIds(root = document.body) {
  if (!root) return;
  const counters = {};

  const getNext = (pref) => {
    counters[pref] = (counters[pref] || 0) + 1;
    return `${pref}-${counters[pref]}`;
  };

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT,
    null,
    false
  );

  while (walker.nextNode()) {
    const el = walker.currentNode;
    if (!(el instanceof HTMLElement)) continue;
    if (el.id) continue; // déjà un id

    // Définir un prefix pertinent : balise + première classe éventuelle
    const tag = el.tagName.toLowerCase();
    let prefix = tag;
    if (el.classList.length) {
      const mainClass = el.classList[0].replace(/[^a-zA-Z0-9_-]/g, "");
      if (mainClass && !mainClass.startsWith("ng-")) {
        prefix += `-${mainClass}`;
      }
    }
    el.id = getNext(prefix);
  }
}

// Rendre disponible globalement pour pouvoir l'appeler au besoin
window.assignAutoIds = assignAutoIds;

// Rendre ces fonctions disponibles globalement pour le débogage
window.debugProfilesState = debugProfilesState;
window.verifyUsersCalculation = verifyUsersCalculation;
window.recalculateAndVerify = recalculateAndVerify;
