/**
 * formHandler.js - Gestion du formulaire de checklist
 * Contient les fonctions de rendu et de manipulation du formulaire
 */

// =====================
// Fonctions utilitaires pour la robustesse du code
// =====================

/**
 * Fonction helper pour comparer les noms de sections de manière robuste
 * Centralise les comparaisons pour éviter les problèmes de casse
 * @param {string} sectionName - Nom de la section à vérifier
 * @param {string} expectedName - Nom attendu
 * @returns {boolean} - True si les noms correspondent
 */
function isSectionNamed(sectionName, expectedName) {
  return sectionName.toLowerCase() === expectedName.toLowerCase();
}

// =====================
// Génération dynamique du formulaire checklist
// =====================
function renderChecklist() {
  // Regroupe les fonctionnalités par section
  const sections = {};
  checklistData.forEach((item) => {
    if (!sections[item.THEME]) sections[item.THEME] = [];
    sections[item.THEME].push(item);
  });

  // Génère le HTML des sections
  const container = document.getElementById("checklist-sections");
  container.innerHTML = "";
  let totalGeneral = 0;
  const sectionTotals = {};

  // Définir l'ordre des sections
  const ordreDesSections = [
    "PARAMÉTRAGE",
    "FORMATIONS",
    "MODULES COMPLEMENTAIRES",
    "CABINET OPTION",
  ];

  // Traiter les sections dans l'ordre défini
  ordreDesSections.forEach((sectionKey) => {
    // Vérifier si la section existe dans les données
    if (!sections[sectionKey]) return;

    const section = sectionKey;
    let sectionTotal = 0;
    const sectionId = section.replace(/\s+/g, "-");
    let isCollapsible = [
      "paramétrage",
      "cabinet option",
      "modules complementaires",
      "formations",
    ].includes(section.toLowerCase());

    let html = `<div class="section" id="section-${sectionId}">`;
    if (isCollapsible) {
      // Affichage du badge de total pour toutes les sections
      html += `<h2 class="section-title">
        <button type="button" class="toggle-section-btn" id="toggle-${sectionId}" aria-label="Replier ou déplier la section" aria-expanded="true"></button>
        ${section}
        <span class="section-badges">
          <span class="section-total-badge" id="section-total-${sectionId}">0h 00min</span>
          <span class="section-montant-badge" id="section-montant-${sectionId}" style="display: none;">0 €</span>
        </span>
      </h2>`;
      html += `<div class="section-content" id="content-${sectionId}">`;
    } else {
      html += `<h2 class="section-title">${section}
        <span class="section-badges">
          <span class="section-total-badge" id="section-total-${sectionId}">0h 00min</span>
          <span class="section-montant-badge" id="section-montant-${sectionId}" style="display: none;">0 €</span>
        </span>
      </h2>`;
      html += `<div class="section-content">`;
    }

    // Regrouper par SOUS_SECTION pour toutes les sections
    const sousSections = {};
    sections[section].forEach((item) => {
      const ss = item.SOUS_SECTION || "AUTRE";
      if (!sousSections[ss]) sousSections[ss] = [];
      sousSections[ss].push(item);
    });

    // Déterminer l'ordre des sous-sections en fonction de la section
    const ordreSousSections = isSectionNamed(section, "PARAMÉTRAGE")
      ? ["UTILISATEURS", "MATRICES", "NUMÉROTATION"]
      : isSectionNamed(section, "FORMATIONS")
      ? [
          "PACK DÉMARRAGE COMPLET",
          "PACK SECRÉTARIAT JURIDIQUE",
          "MODULES SECRÉTARIAT JURIDIQUE",
          "A LA CARTE",
          "MODULES",
        ]
      : isSectionNamed(section, "CABINET OPTION")
      ? // Pour Cabinet Option : trier par nombre d'éléments décroissant
        Object.keys(sousSections).sort(
          (a, b) => sousSections[b].length - sousSections[a].length
        )
      : Object.keys(sousSections).sort();

    // Sous-sections triées dans l'ordre défini + les autres
    const sousSectionsKeys = [
      ...ordreSousSections.filter((ss) => sousSections[ss]),
      ...Object.keys(sousSections).filter(
        (ss) => !ordreSousSections.includes(ss)
      ),
    ];

    // Traitement spécial pour la section CABINET OPTION
    if (isSectionNamed(section, "CABINET OPTION")) {
      // Affichage en trois colonnes
      html += `<div class="cabinet-option-container">`;

      // Répartition équilibrée des éléments dans les 3 colonnes
      const sectionCount = sousSectionsKeys.length;
      const baseItemsPerColumn = Math.floor(sectionCount / 3);
      const remainder = sectionCount % 3;

      // Calculer le nombre d'éléments pour chaque colonne
      const col1Count = baseItemsPerColumn + (remainder > 0 ? 1 : 0);
      const col2Count = baseItemsPerColumn + (remainder > 1 ? 1 : 0);
      const col3Count = baseItemsPerColumn;

      // Définir les indices de début et fin pour chaque colonne
      const col1End = col1Count;
      const col2End = col1End + col2Count;

      // Première colonne
      html += renderCabinetColumn(
        section,
        sectionId,
        sousSections,
        sousSectionsKeys.slice(0, col1End),
        0
      );

      // Deuxième colonne
      html += renderCabinetColumn(
        section,
        sectionId,
        sousSections,
        sousSectionsKeys.slice(col1End, col2End),
        100
      );

      // Troisième colonne
      html += renderCabinetColumn(
        section,
        sectionId,
        sousSections,
        sousSectionsKeys.slice(col2End),
        200
      );

      html += `</div>`;
    }
    // Traitement standard pour les autres sections
    else {
      // Table header - Ajouter colonnes Prix unitaire et Montant pour FORMATIONS
      const isFormationsSection = isSectionNamed(section, "FORMATIONS");
      if (isFormationsSection) {
        html += `<table class="checklist-table"><thead><tr><th>✔</th><th>Fonctionnalité</th><th>Nb</th><th>Unité</th><th>Temps unitaire</th><th>Sous-total</th><th>Prix unitaire</th><th>Montant</th></tr></thead><tbody>`;
      } else {
        html += `<table class="checklist-table"><thead><tr><th>✔</th><th>Fonctionnalité</th><th>Nb</th><th>Unité</th><th>Temps unitaire</th><th>Sous-total</th></tr></thead><tbody>`;
      }

      let idxGlobal = 0;
      sousSectionsKeys.forEach((ss) => {
        const colspanValue = isFormationsSection ? "8" : "6";
        html += `<tr class="subsection-header-row"><td colspan="${colspanValue}"><h3 style="margin:18px 0 8px 0;font-size:1.08em;color:#2e4a9e;">${ss}</h3></td></tr>`;
        sousSections[ss].forEach((item) => {
          // Ignorer la ligne spécifique avec data-section="PARAMÉTRAGE" et data-idx="1"
          if (isSectionNamed(section, "PARAMÉTRAGE") && idxGlobal === 1) {
            idxGlobal++;
            return;
          }

          const isUtilisateurs =
            isSectionNamed(section, "PARAMÉTRAGE") &&
            (item.FONCTIONNALITES.trim().toLowerCase() ===
              "utilisateurs (par user)" ||
              item.FONCTIONNALITES.trim()
                .toLowerCase()
                .includes("utilisateurs"));
          const unit = getUnitFromLabel(item.FONCTIONNALITES);
          const hasNumber =
            !!unit ||
            isSectionNamed(section, "FORMATIONS") ||
            isSectionNamed(section, "MODULES COMPLEMENTAIRES") ||
            item.FONCTIONNALITES.includes("Equipes") ||
            item.FONCTIONNALITES.includes("Modèles de taux");

          if (isUtilisateurs) {
            html += renderUtilisateursRow(section, sectionId, item, idxGlobal);
          } else {
            html += renderStandardRow(
              section,
              sectionId,
              item,
              idxGlobal,
              unit,
              hasNumber,
              isFormationsSection
            );
          }
          idxGlobal++;
        });
      });

      html += `</tbody></table>`;
    }

    html += `</div></div>`;
    container.innerHTML += html;

    if (isCollapsible) {
      setTimeout(() => {
        const btn = document.getElementById(`toggle-${sectionId}`);
        const content = document.getElementById(`content-${sectionId}`);
        if (btn && content) {
          btn.onclick = function () {
            const expanded = btn.getAttribute("aria-expanded") === "true";
            btn.setAttribute("aria-expanded", String(!expanded));

            // Utiliser les nouvelles classes pour l'animation
            if (expanded) {
              btn.classList.add("collapsed");
              content.classList.add("collapsed");
            } else {
              btn.classList.remove("collapsed");
              content.classList.remove("collapsed");
            }
          };
        }
      }, 0);
    }
  });

  // Initialisation dynamique des profils (sous Utilisateurs)
  initProfilsDyn();

  // Mettre à jour les totaux une première fois
  setTimeout(() => {
    updateTotals();
  }, 100);

  // Réinitialiser les listeners tri-state pour que les clics fonctionnent
  setTimeout(() => {
    if (typeof reinitTriStateListeners === "function") {
      reinitTriStateListeners();
    }
  }, 150);

  // Ajoute les listeners
  document
    .querySelectorAll(
      ".modern-switch-input.check-feature, .feature-nb, .modern-switch-input.check-feature-utilisateurs, .modern-switch-input.check-feature-cabinet"
    )
    .forEach((el) => {
      // Pour les checkbox/switches, utiliser 'change'
      if (el.type === "checkbox") {
        el.addEventListener("change", updateTotals);
      } else {
        // Pour les input number, utiliser 'input'
        el.addEventListener("input", updateTotals);
      }
    });
}

/**
 * Génère le HTML pour une colonne de la section CABINET OPTION
 */
function renderCabinetColumn(
  section,
  sectionId,
  sousSections,
  columnSections,
  idxOffset
) {
  let html = `<div class="cabinet-option-column">`;

  columnSections.forEach((ss) => {
    html += `<div class="cabinet-option-subsection-header"><h3 style="margin:18px 0 8px 0;font-size:1.08em;color:#2e4a9e;">${ss}</h3></div>`;
    html += `<table class="checklist-table cabinet-option-table"><thead><tr><th>On/Off</th><th>Fonctionnalité</th></tr></thead><tbody>`;

    // Parcourir les items de cette sous-section
    sousSections[ss].forEach((item, idx) => {
      const idxGlobal = idxOffset + idx;
      // Vérifier si l'option est active par défaut
      const optionName = item.FONCTIONNALITES.replace(
        /^\[PACKS\] |^\[MODULE\] /,
        ""
      ).trim();

      // Utiliser la fonction avec le nom affiché dans l'interface
      const isActive = isCabinetOptionActive(optionName);

      // S'assurer que AccesAnalytics est toujours activé par défaut
      const forceActive = optionName === "AccesAnalytics" ? true : isActive;

      // Créer un tooltip basé sur le nom de l'option
      let tooltipHTML = "";

      // Définir les descriptions pour chaque option
      const tooltips = {
        DeepSearch: "Permet d'activer la recherche avancée dans LéA",
        FiltreFavori:
          "Permet d'enregistrer des filtres pour faciliter les prochaines recherches",
        ListeNewLook:
          "Permet à l'utilisateur de pouvoir redimensionner et déplacer les colonnes des grilles dans Néo",
        MicroServiceDashboard:
          "Permet l'affichage du nouveau dashboard µService",
        MicroServiceDashboardPilote:
          "Permet l'accès à la fenêtre de retour utilisateur en plus de l'affichage du dashboard",
        PersonnalisationOnglets:
          "Permet l'accès à la gestion des onglets (creation, renommage et suppression des onglets)",
        ParametrageEtMultiInstanceWidget:
          "Permet l'ajout de plusieurs instances d'une même tuile et leur paramétrage",
        AccesCalculsInterets:
          "Permet de beneficier du calcul d'intérêts dans Néo",
        CalculInteretAnneesBissextiles:
          "Le calcul d'interêts comptabilise bien le jour supplementaire des années bissextiles",
        CalculInteretAvantOperation:
          "Le calcul d'interêts prend en compte comme date de fin du calcul la veille de la date en cours",
        CalculInteretCapitalisationAnnuelle:
          "Le calcul d'interêts offre l'option de calcul de capitalisation annuelle",
        CalculInteretDifference:
          "Le calcul d'interêts offre l'option de calcul par difference",
        CompteAuxiliaireErrorText:
          "Gere l'apparition d'un message si le compte auxiliaire client renseigné existe déjà en base",
        DeleteOnlylastFacture:
          "Limite la supression de facture à la derniere créée",
        FraisFournisseur: "Permet l'utilisation des frais fournisseurs",
        LiaisonFraisTempsPassesAir:
          "Active la liaison des codes d'activités pour les Temps Passes et les frais",
        ModePaiement:
          "Permet de sélectionner le mode de paiement lors de la saisie de règlement",
        MultiComptabilite:
          "Permet de gérer plusieurs comptabilité au sein d'un cabinet",
        MultiDevise: "Permet d'avoir la multi devise dans neo",
        ParametreRelance:
          "Permet de rattacher les doc de factu dans les mails ou impression de relance",
        TypeFacturier:
          'Permet d\'afficher le champs "Type de Facturier" dans le paramétrage de ceux-ci',
        ImpayeRelanceOngletClient:
          "Permet de voir l'onglet client dans les impayes",
        FacturationMultiDossierDepuisDossier:
          "Permet de facturer plusieurs dossiers à partir d un dossier",
        ProformaComptabilise:
          "Si actif, les proforma remontent dans le calcul du solde",
        EtatPrefacturationInteractif:
          "Permet de pouvoir faire un état de préfa interactif",
        Budget: "Permet de créer des budgets",
        AccesAnalytics: "Permet d'accéder aux fonctionnalités d'Analytics",
        AncrageOutlook:
          "Bloque en place les fenetres du complement outlook WPF, en cachant les option de déplacement",
        ArrondiTempsPasses:
          "Permet d'avoir l'arrondi des temps dans la fiche personne et le parametre avancé",
        Categorie:
          "Permet l'utilisation des catégories pour le tri automatique des documents",
        ChronoDossier: "Permet d'afficher un chrono dans le dossier",
        CommunicationStructuree:
          "Permet l'utilisation de la communication structurée pour les factures BE",
        ComplementInformation:
          "Permet l'ajout d'un champ \"complement d'information\" dans les parties d'un dossier",
        DecisionAttaquee:
          "Permet de préciser quelles decisions sont attaquées dans les dossiers, dans les infos de la juridiction",
        DetectionDoublonMailOutlook:
          "Permet au complement outlook de signaler si un mail similaire a déjà été rattaché au dossier",
        DPA: "Permet l'utilisation de la DPA, équivalent d'E-barreau Belge",
        Ebarreau: "Permet de voir le menu E-barreau dans le menu de gauche",
        Ecostaff: "Permet d'afficher l'accès à ecostaff dans le menu de gauche",
        EffacementRGPD:
          "Permet l'accès au module d'effacement RGPD des personnes et dossiers",
        IdentificationTemps:
          "Permet d'avoir les valeurs perdu et traité dans l'état des TP lors de la factu",
        Juridique:
          "Débloque l'accés aux onglets des matières juridiques (IFU, RCM, Suivi des sociétés...)",
        LectureCarteIdentite:
          "Permet d'acceder à la fonctionnalité de lecture de carte d'identité en place en Belgique",
        LibelleMatiereAvecTypeDossier:
          "Permet l'affichage du type de dossier associé à la matière dans les listes de filtres",
        LogicielComptaCasper:
          "Ajoute le logiciel Casper (aka Secib Compta) à la liste des logiciels de comptabilité",
        Meetlaw: "Donne accès à Meetlaw dans le menu de gauche",
        MobileTachePrioritaire:
          "Permet d'activer la notion de taches prio dans Mobile",
        NumerotationManuelleDossier:
          "Permet de définir manuellement la numérotation des dossiers",
        NumerotationSite: "Permet de gérer la numérotation par site",
        OutlookClassementResponseMail:
          "Permet au complement de proposer un dossier de classement lors de la réponse à un mail",
        ParametrageEmail:
          "Permet de configurer les paramètres avancés des emails",
        RattachementAvanceOutlook:
          "Permet dans le complément Outlook de rattacher plusieurs emails simultanément",
        RattachementIntelligentOutlook:
          "Permet au complement de proposer un dossier de classement des mails reçus",
        Repartition:
          "Permet d'afficher la gestion de la répartition de l'encaissement dans les dossiers",
        SecibVoIP:
          "Permets d'accéder au service de suivi des appels (création de tickets avec temps passés)",
        Strada:
          "Permet l'utilisation des Stradalex, utilisé pour la comptabilité Belge",
        SuggestionParapheur:
          "Permet d'avoir des suggestions intelligentes dans le parapheur",
        SynchroPersonneOutlook: "Synchronisation des personnes vers Outlook",
        TacheMultiIntervenant:
          "Permet l'envoi d'une tache à plusieurs intervenants",
        TempsPasseParapheur:
          "Permet l'affichage d'un compteur dans la prévisu des docs au parapheur",
        TempsPassesRecalcul:
          "Active la présence du bouton de recalcul des temps passés",
        VerificationLicenceAR24:
          "Permet de vérifier si une licence est active pour le cabinet sur AR24",
        VerificationLicenceYousign:
          "Permet de vérifier si une licence est active pour le cabinet sur la eSignature",
        EquipeAgenda: "Permet la gestion d'équipes dans l'agenda",
        DossierConfidentialiteHorsResponsable:
          "Permet d'activer un droit qui permet de rendre un dossier confidentiel",
        AffichageAvanceTauxHoraires:
          "Permet d'afficher la colonne taux engagé dans les TP",
        Fragments: "Permet l'accès au module complément office Fragments",
      };

      // Ajouter la description si elle existe dans notre liste
      if (tooltips[optionName]) {
        tooltipHTML = `<button class="tooltip-button">?</button><div class="tooltip-content">${tooltips[optionName]}</div>`;
      }

      html += `<tr data-section="${section}" data-idx="${idxGlobal}" data-temps="${
        item.TEMPS || ""
      }" data-option-name="${optionName}">
        <td>${renderModernSwitch(
          `feature-${sectionId}-${ss.replace(/\s+/g, "-")}-${idxGlobal}`,
          `feature-${sectionId}-${idxGlobal}`,
          forceActive,
          "Activer/désactiver cette fonctionnalité",
          "check-feature-cabinet"
        )}</td>
        <td>${tooltipHTML}${item.FONCTIONNALITES.replace(
        /^\[PACKS\] |^\[MODULE\] /,
        ""
      ).replace(/\n/g, "<br>")}
          ${
            !forceActive && item.Attention
              ? `<span class=\"attention-badge${
                  item.Attention.toLowerCase().includes("warning")
                    ? " warning-badge"
                    : ""
                }\">${item.Attention}</span>`
              : ""
          }
          ${getProduitsHTML(item.FONCTIONNALITES)}
        </td>
      </tr>`;
    });

    html += `</tbody></table>`;
  });

  html += `</div>`;
  return html;
}

/**
 * Génère le HTML pour une ligne standard
 */
/**
 * Obtient le prix d'une formation basé sur son nom
 */
function getFormationPrice(formationName) {
  if (!window.formationsLogiciels) {
    console.log(
      "⚠️ formationsLogiciels pas encore chargé pour:",
      formationName
    );
    return "N/A";
  }

  // Nettoyer le nom de la formation pour la correspondance
  const cleanName = formationName
    .replace(/^\[PACKS\] |^\[MODULE\] /, "")
    .trim()
    .toUpperCase();

  console.log("🔍 Recherche prix pour:", cleanName);

  // Chercher dans les formations logiciels
  const formation = window.formationsLogiciels.find((f) => {
    const fNom = f.nom.toUpperCase();
    // Essayer différentes correspondances
    const match =
      fNom.includes(cleanName) ||
      cleanName.includes(fNom) ||
      fNom === cleanName ||
      // Correspondances spéciales
      (cleanName.includes("GESTION DE DOSSIER") &&
        fNom.includes("GESTION DE DOSSIERS")) ||
      (cleanName.includes("PASSER DE AIR") && fNom.includes("PASSER DE AIR")) ||
      (cleanName.includes("BRAIN") && fNom.includes("SEPTEO BRAIN")) ||
      (cleanName.includes("ACTIONS LIÉES") && fNom.includes("ACTIONS LI")) ||
      (cleanName.includes("SECRÉTARIAT") && fNom.includes("SECRÉTARIAT"));

    if (match) {
      console.log(
        `✅ Correspondance trouvée: "${cleanName}" -> "${fNom}" = ${f.prix_ht}`
      );
    }
    return match;
  });

  if (!formation) {
    console.log(`❌ Aucune correspondance trouvée pour: "${cleanName}"`);
    console.log(
      "💡 Formations disponibles:",
      window.formationsLogiciels.map((f) => f.nom)
    );
  }

  return formation ? formation.prix_ht : "N/A";
}

function renderStandardRow(
  section,
  sectionId,
  item,
  idxGlobal,
  unit,
  hasNumber,
  isFormationsSection = false
) {
  const isNumberType = item.TYPE === "number";
  const isSwitchType = item.TYPE === "switch";
  const defaultValue = item.DEFAULT_VALUE || 1;

  // Vérifier si c'est un élément pour lequel on ne veut pas de sous-total
  const noSubtotalItems = [
    "Dashboard",
    "Actions liées",
    "Infos complémentaires",
  ];
  const hideSubtotal = noSubtotalItems.includes(item.FONCTIONNALITES);

  // Déterminer l'unité à afficher avec accord grammatical
  let uniteSingulier = "";
  if (isNumberType) {
    if (item.FONCTIONNALITES.includes("Site")) {
      uniteSingulier = "site";
    } else if (item.FONCTIONNALITES.includes("Arborescence")) {
      uniteSingulier = "arborescence";
    } else if (item.SOUS_SECTION === "MATRICES") {
      uniteSingulier = "matrice";
    } else {
      uniteSingulier = "série";
    }
  } else {
    uniteSingulier = unit;
  }

  if (isSwitchType) {
    // Créer une ligne avec un switch on/off (similaire à CABINET OPTION)
    const prixUnitaire = isFormationsSection
      ? getFormationPrice(item.FONCTIONNALITES)
      : null;

    let switchRow = `<tr data-section="${section}" data-idx="${idxGlobal}" data-temps="${
      item.TEMPS || ""
    }" data-prix-unitaire="${prixUnitaire || ""}">
      <td>${renderModernSwitch(
        `feature-${sectionId}-${idxGlobal}`,
        `feature-${sectionId}-${idxGlobal}`,
        false,
        "Activer/désactiver cette fonctionnalité"
      )}</td>
      <td>${item.FONCTIONNALITES.replace(
        /^\[PACKS\] |^\[MODULE\] /,
        ""
      ).replace(/\n/g, "<br>")}
        ${
          item.Attention
            ? `<span class=\"attention-badge${
                item.Attention.toLowerCase().includes("warning")
                  ? " warning-badge"
                  : ""
              }\">${item.Attention}</span>`
            : ""
        }
        ${getProduitsHTML(item.FONCTIONNALITES)}
      </td>
      <td></td>
      <td></td>
      <td>${item.TEMPS ? item.TEMPS.slice(0, 5) : ""}</td>
      <td class=\"sous-total\">${hideSubtotal ? "N/A" : "0"}</td>`;

    // Ajouter colonnes Prix unitaire et Montant pour FORMATIONS
    if (isFormationsSection) {
      switchRow += `
      <td class="prix-unitaire">${prixUnitaire || "N/A"}</td>
      <td class="montant-formation">N/A</td>`;
    }

    switchRow += `</tr>`;
    return switchRow;
  } else {
    // Ligne standard ou avec nombre
    const prixUnitaire = isFormationsSection
      ? getFormationPrice(item.FONCTIONNALITES)
      : null;

    let baseRow = `<tr data-section="${section}" data-idx="${idxGlobal}" data-temps="${
      item.TEMPS || ""
    }" data-prix-unitaire="${prixUnitaire || ""}">
      <td>${renderModernSwitch(
        `feature-${sectionId}-${idxGlobal}`,
        `feature-${sectionId}-${idxGlobal}`,
        false,
        "Inclure cette fonctionnalité dans le calcul"
      )}</td>
      <td>${item.FONCTIONNALITES.replace(
        /^\[PACKS\] |^\[MODULE\] /,
        ""
      ).replace(/\n/g, "<br>")}
        ${
          item.Attention
            ? `<span class=\"attention-badge${
                item.Attention.toLowerCase().includes("warning")
                  ? " warning-badge"
                  : ""
              }\">${item.Attention}</span>`
            : ""
        }
        ${getProduitsHTML(item.FONCTIONNALITES)}
      </td>
      <td>${
        hasNumber || isNumberType
          ? `<input type=\"number\" min=\"0\" value=\"${defaultValue}\" class=\"feature-nb formation-nb\" style=\"width:60px;\" aria-label=\"Quantité\" id=\"nb-${sectionId}-${idxGlobal}\" name=\"nb-${sectionId}-${idxGlobal}\" data-unit="${uniteSingulier}" />`
          : ""
      }</td>
      <td class="unite-cell" data-unit-base="${uniteSingulier}">${
      uniteSingulier ? accordUnit(defaultValue, uniteSingulier) : ""
    }</td>
      <td>${item.TEMPS ? item.TEMPS.slice(0, 5) : ""}</td>
      <td class=\"sous-total\">0</td>`;

    // Ajouter colonnes Prix unitaire et Montant pour FORMATIONS
    if (isFormationsSection) {
      baseRow += `
      <td class="prix-unitaire">${prixUnitaire || "N/A"}</td>
      <td class="montant-formation">0 €</td>`;
    }

    baseRow += `</tr>`;
    return baseRow;
  }
}

/**
 * Génère le HTML pour la ligne Utilisateurs avec les profils
 */
function renderUtilisateursRow(section, sectionId, item, idxGlobal) {
  return `<tr data-section="${section}" data-idx="${idxGlobal}" data-temps="${
    item.TEMPS || ""
  }" class="utilisateurs-main-row">
    <td>${renderModernSwitch(
      `feature-utilisateurs-${sectionId}-${idxGlobal}`,
      `feature-utilisateurs-${sectionId}-${idxGlobal}`,
      false,
      "Inclure les utilisateurs dans le calcul",
      "check-feature-utilisateurs"
    )}</td>
    <td>
      Utilisateurs
      <br>
      <div class="profil-buttons" style="display:flex;gap:10px;margin-top:8px;">
        <button type="button" id="add-profil-btn" class="action-btn">Ajouter un profil</button>
        <button type="button" id="profile-manager-btn-utilisateurs" class="action-btn">Gérer les profils</button>
      </div>
    </td>
    <td><input type="number" id="utilisateurs-nb" name="utilisateurs-nb-${sectionId}-${idxGlobal}" value="0" class="feature-nb" style="width:60px;" readonly tabindex="-1" aria-label="Nombre d'utilisateurs" data-unit="utilisateur" /></td>
    <td class="unite-cell" data-unit-base="utilisateur">utilisateur</td>
    <td>${item.TEMPS ? item.TEMPS.slice(0, 5) : ""}</td>
    <td class=\"sous-total\">0</td>
  </tr>`;
}

// =====================
// Gestion des accords grammaticaux
// =====================
/**
 * Retourne une chaîne avec accord singulier/pluriel selon le nombre
 * @param {number} count - Nombre à considérer
 * @param {string} singulier - Forme singulière du mot
 * @param {string} pluriel - Forme plurielle du mot
 * @returns {string} - Chaîne avec le nombre et le mot accordé
 */
function accordGrammatical(count, singulier, pluriel) {
  return `${count} ${count <= 1 ? singulier : pluriel}`;
}

// =====================
// Calcul dynamique des sous-totaux et totaux
// =====================
function updateTotals() {
  // Debug pour voir si la fonction est appelée
  console.log("🔄 updateTotals() appelé");

  // IMPORTANT: Mettre à jour les montants des formations EN PREMIER
  // avant de calculer les totaux de section
  updateFormationMontants();

  let totalGeneral = 0;
  let totalParametrage = 0;

  // Fonctionnalités à exclure du calcul total
  const excludedFromTotal = [];

  document.querySelectorAll(".section").forEach((sectionDiv) => {
    let sectionTotal = 0;

    const sectionTitle = sectionDiv.querySelector("h2");
    const isCabinetOption =
      sectionTitle &&
      isSectionNamed(sectionTitle.textContent, "CABINET OPTION");

    // Vérifier si c'est la section PARAMÉTRAGE
    const isParametrageSection =
      sectionTitle && isSectionNamed(sectionTitle.textContent, "PARAMÉTRAGE");

    // Vérifier si c'est la section FORMATIONS
    const isFormationsSection =
      sectionTitle && isSectionNamed(sectionTitle.textContent, "FORMATIONS");

    sectionDiv.querySelectorAll("tbody tr").forEach((tr, idx) => {
      // Vérifier si la ligne contient une fonctionnalité à exclure
      const fonctionnaliteText = tr
        .querySelector("td:nth-child(2)")
        ?.textContent.trim();
      const isExcluded = excludedFromTotal.some((item) =>
        fonctionnaliteText?.includes(item)
      );

      // Cas spécial : ligne Utilisateurs (par user)
      if (tr.classList.contains("utilisateurs-main-row")) {
        console.log("📊 Recalcul complet de la section PARAMÉTRAGE...");
        let utilisateursTotal = 0;
        let profilsTotalMinutes = 0;

        // 1. Calculer le total des utilisateurs et des temps de profil
        if (window.profilsDynList) {
          window.profilsDynList.forEach((profil, pidx) => {
            const nbInput = document.querySelector(`#profil-nb-${pidx}`);
            const nb = nbInput ? parseInt(nbInput.value, 10) || 0 : 0;

            // Le total des utilisateurs est la somme de TOUS les profils
            utilisateursTotal += nb;

            // Le temps est calculé seulement si le profil est coché et modifié
            const checkboxProfil = document.querySelector(
              `#profil-check-${pidx}`
            );
            const modifSwitch = document.querySelector(`#profil-modif-${pidx}`);
            const isChecked = checkboxProfil ? checkboxProfil.checked : false;
            const isModified = modifSwitch
              ? isTriStateActivated(modifSwitch)
              : false;

            console.log(
              `  Profil ${profil.nom}: nb=${nb}, coché=${isChecked}, modifié=${isModified}`
            );

            let tempsProfil = 0;
            if (isChecked && isModified) {
              tempsProfil = 30; // 30 min par profil modifié
              profilsTotalMinutes += tempsProfil;
            }

            // Mettre à jour le sous-total de la ligne profil
            const sousTotalCell = document.querySelector(
              `.profil-sous-total[data-idx='${pidx}']`
            );
            if (sousTotalCell) {
              sousTotalCell.textContent = tempsProfil
                ? formatMinutes(tempsProfil)
                : "0";
            }
          });
        }
        console.log(
          `👤 Utilisateurs Total (somme profils): ${utilisateursTotal}`
        );
        console.log(`⏱️ Profils Total (temps modif): ${profilsTotalMinutes}`);

        // 2. Mettre à jour le champ utilisateurs-nb
        const nbInput = tr.querySelector("#utilisateurs-nb");
        if (nbInput) {
          nbInput.value = utilisateursTotal;
          const uniteCell = tr.querySelector(".unite-cell");
          if (uniteCell && uniteCell.hasAttribute("data-unit-base")) {
            const unitBase = uniteCell.getAttribute("data-unit-base");
            uniteCell.textContent = accordUnit(utilisateursTotal, unitBase);
          }
        }

        // 3. Calculer le sous-total de la ligne "Utilisateurs"
        const switchUtil = tr.querySelector(".tri-state-modern-switch");
        const checkedUtil = switchUtil
          ? isTriStateActivated(switchUtil)
          : false;
        const timeMins = parseTimeToMinutes(tr.dataset.temps);
        const sousTotalUtil = checkedUtil ? utilisateursTotal * timeMins : 0;

        console.log(`🔘 Switch "Utilisateurs" activé: ${checkedUtil}`);
        console.log(
          `💰 Sous-total (ligne "Utilisateurs"): ${formatMinutes(
            sousTotalUtil
          )}`
        );

        // 4. Calculer le total pour la section PARAMETRAGE
        const totalUtilEtProfils = sousTotalUtil + profilsTotalMinutes;
        console.log(
          `🟰 Total Section (Utilisateurs + Profils): ${formatMinutes(
            totalUtilEtProfils
          )}`
        );

        const sousTotalCell = tr.querySelector(".sous-total");
        if (sousTotalCell) {
          sousTotalCell.innerHTML = totalUtilEtProfils
            ? `${formatMinutes(
                totalUtilEtProfils
              )}<br><span style='font-size:0.95em;color:#444;'>(utilisateurs : ${formatMinutes(
                sousTotalUtil
              )} + profils : ${formatMinutes(profilsTotalMinutes)})</span>`
            : "0";
        }

        sectionTotal += totalUtilEtProfils;
        if (isParametrageSection) {
          totalParametrage += totalUtilEtProfils;
        }

        // Valider la cohérence des effectifs après le calcul
        validateProfilesVsEffectif();
      } else {
        // Calcul standard pour les autres lignes
        const switchElement = tr.querySelector(".tri-state-modern-switch");

        // Vérifier l'état du tri-state switch (seulement "activated" compte pour les calculs)
        const isActivated = switchElement
          ? isTriStateActivated(switchElement)
          : false;

        // Pour la section CABINET OPTION, pas de calcul de temps mais juste comptage
        if (isCabinetOption) {
          // Ne rien ajouter au total, juste mettre à jour l'état visuel
          const sousTotalCell = tr.querySelector(".sous-total");
          if (sousTotalCell) {
            sousTotalCell.textContent = "N/A";
          }
        } else {
          // Calcul normal pour les autres sections
          const nbInput = tr.querySelector(".feature-nb");
          const nb = nbInput ? parseInt(nbInput.value, 10) : 1;
          const timeMins = parseTimeToMinutes(tr.dataset.temps);
          const sousTotal = isActivated && !isExcluded ? nb * timeMins : 0;

          // Mettre à jour l'unité avec l'accord grammatical
          if (nbInput) {
            const uniteCell = tr.querySelector(".unite-cell");
            if (uniteCell && uniteCell.hasAttribute("data-unit-base")) {
              const unitBase = uniteCell.getAttribute("data-unit-base");
              uniteCell.textContent = accordUnit(nb, unitBase);
            }
          }

          const sousTotalCell = tr.querySelector(".sous-total");
          if (sousTotalCell) {
            if (isExcluded) {
              sousTotalCell.textContent = "N/A";
            } else {
              sousTotalCell.textContent = sousTotal
                ? formatMinutes(sousTotal)
                : "0";
            }
          }

          // Ajoute bien chaque sous-total au total de la section (sauf éléments exclus)
          if (!isExcluded) {
            sectionTotal += sousTotal;

            // Si c'est la section PARAMÉTRAGE, ajouter au total paramétrage
            if (isParametrageSection) {
              totalParametrage += sousTotal;
            }
          }
        }
      }
    });

    // Met à jour le badge de la section
    const badge = sectionDiv.querySelector(".section-total-badge");
    const montantBadge = sectionDiv.querySelector(".section-montant-badge");

    if (badge) {
      if (isCabinetOption) {
        // Pour Cabinet Option, compter les tri-state switches activés
        const optionsActivees = Array.from(
          sectionDiv.querySelectorAll(".tri-state-modern-switch")
        ).filter((sw) => isTriStateActivated(sw)).length;

        const optionsTotal = sectionDiv.querySelectorAll(
          ".tri-state-modern-switch"
        ).length;

        // Affichage avec accord grammatical
        const texteOption =
          optionsActivees <= 1 ? "option active" : "options actives";
        badge.textContent = `${optionsActivees}/${optionsTotal} ${texteOption}`;
      } else if (isFormationsSection) {
        // Pour FORMATIONS, afficher temps + sous-total financier
        const sousTotal = calculateFormationSousTotal();
        if (sousTotal > 0) {
          badge.innerHTML = `${formatMinutes(
            sectionTotal
          )}<br><span style="font-size:0.85em;color:#1565c0;">${sousTotal} € HT</span>`;
        } else {
          badge.textContent = formatMinutes(sectionTotal);
        }
      } else {
        badge.textContent = formatMinutes(sectionTotal);
      }
    }

    // Mettre à jour le badge de montant
    if (montantBadge) {
      const sectionTitle = sectionDiv.querySelector("h2");
      let sectionName = "";

      if (sectionTitle) {
        // Extraire le nom de section en évitant les badges dynamiques
        // On prend le premier texte avant les badges
        const textNodes = [];
        for (let node of sectionTitle.childNodes) {
          if (node.nodeType === Node.TEXT_NODE) {
            textNodes.push(node.textContent);
          } else if (
            node.tagName &&
            !node.classList.contains("section-badges")
          ) {
            // Inclure le texte des éléments qui ne sont pas des badges
            textNodes.push(node.textContent);
          }
        }
        sectionName = textNodes.join(" ").trim();
      }

      // Nettoyer le nom de section en enlevant les éléments indésirables
      const cleanSectionName = sectionName
        .replace(/^\s*▼?\s*/, "") // Enlever le symbole de toggle éventuel
        .replace(/VOTRE DEPLOIEMENT SEPTEO SOLUTIONS AVOCATS/, "DEPLOIEMENT") // Normaliser le nom de déploiement
        .replace(/\s+/g, " ") // Remplacer tous les espaces multiples et sauts de ligne par un seul espace
        .trim();

      console.log(
        `🔍 Debug badge montant - Section: "${cleanSectionName}" (original: "${sectionName}")`
      );

      const montantTotal = calculateSectionMontantTotal(cleanSectionName);
      console.log(
        `💰 Montant calculé pour "${cleanSectionName}": ${montantTotal}€`
      );

      if (montantTotal > 0) {
        montantBadge.textContent = `${montantTotal} € HT`;
        montantBadge.style.display = "inline-block";
        console.log(
          `✅ Badge montant affiché pour "${cleanSectionName}": ${montantTotal} € HT`
        );
      } else {
        montantBadge.style.display = "none";
        console.log(
          `❌ Badge montant masqué pour "${cleanSectionName}" (montant: ${montantTotal})`
        );
      }
    }

    // N'ajoute au total général que pour les sections autres que Cabinet Option
    if (!isCabinetOption) {
      totalGeneral += sectionTotal;
    }
  });

  // Mise à jour des nouveaux éléments d'affichage dans le header
  const heuresDisplay = document.getElementById("heures-display");
  const journeesDisplay = document.getElementById("journees-display");
  const demiJourneesDisplay = document.getElementById("demi-journees-display");
  const formateursDisplay = document.getElementById("formateurs-display");
  const formationsCoutDisplay = document.getElementById(
    "formations-cout-display"
  );

  if (heuresDisplay) {
    heuresDisplay.textContent = formatMinutesAvecParametrage(
      totalGeneral,
      totalParametrage
    );
  }

  if (journeesDisplay) {
    journeesDisplay.textContent = formatJournees(
      totalGeneral,
      totalParametrage
    );
  }

  if (demiJourneesDisplay) {
    demiJourneesDisplay.textContent = formatDemiJournees(
      totalGeneral,
      totalParametrage
    );
  }

  // Mise à jour de l'affichage des formateurs
  if (formateursDisplay) {
    // Calculer le nombre de jours (sans la validation des connaissances)
    const joursTotal = convertToJournees(totalGeneral);

    // Vérifier si le paramétrage est présent
    const hasParametrage = totalParametrage > 0;

    // Calculer les formateurs nécessaires
    const formateurs1Sem = calculateFormateurs(joursTotal, hasParametrage, 1);
    const formateurs2Sem = calculateFormateurs(joursTotal, hasParametrage, 2);

    if (joursTotal > 0) {
      formateursDisplay.innerHTML = `
        <div>Formateurs nécessaires</div>
        <div style="font-size: 0.85em; opacity: 0.9; margin-top: 2px;">
          1 sem.: ${formateurs1Sem} • 2 sem.: ${formateurs2Sem}
        </div>
      `;
    } else {
      formateursDisplay.textContent = "0 formateur";
    }
  }

  // Compatibilité avec l'ancien élément (au cas où il existe encore)
  const oldElement = document.getElementById("total-general-h1");
  if (oldElement) {
    oldElement.textContent = formatMinutes(totalGeneral);
  }

  // Mise à jour du sous-total financier des formations
  if (formationsCoutDisplay) {
    const sousTotal = calculateFormationSousTotal();
    formationsCoutDisplay.textContent =
      sousTotal > 0 ? `${sousTotal} € HT` : "0 € HT";
  }
}

// =====================
// Ajoute les listeners sur tous les champs interactifs (input numbers principalement)
// Les tri-state switches gèrent leurs propres événements via onclick
// =====================
function addAllInputListeners() {
  // Pour tous les champs input numériques
  document.querySelectorAll(".feature-nb, .profil-nb").forEach((el) => {
    el.removeEventListener("input", updateTotals); // évite les doublons
    el.addEventListener("input", updateTotals);

    // Ajouter listener spécial pour les formations pour calculer le montant
    if (el.classList.contains("formation-nb")) {
      el.removeEventListener("input", updateFormationMontants);
      el.addEventListener("input", updateFormationMontants);
    }
  });

  // Pour les anciens switches s'il en reste (profils, utilisateurs, etc.)
  document
    .querySelectorAll(
      ".modern-switch-input.check-feature-utilisateurs, .modern-switch-input.check-feature-profil, .modern-switch-input.profil-modif"
    )
    .forEach((el) => {
      el.removeEventListener("change", updateTotals);
      el.addEventListener("change", updateTotals);
    });

  // Pour les autres éléments (noms de profils, boutons de suppression)
  document.querySelectorAll(".profil-nom, .remove-profil-btn").forEach((el) => {
    el.removeEventListener("input", updateTotals);
    el.removeEventListener("change", updateTotals);

    if (el.type === "button") {
      el.addEventListener("click", updateTotals);
    } else {
      el.addEventListener("input", updateTotals);
    }
  });

  // Ajouter un listener sur le champ effectif pour mettre à jour les quantités automatiquement
  const effectifInput = document.getElementById("effectif");
  if (effectifInput) {
    effectifInput.removeEventListener(
      "input",
      updateFormationQuantitiesBasedOnEffectif
    );
    effectifInput.addEventListener(
      "input",
      updateFormationQuantitiesBasedOnEffectif
    );
  }

  // Générer la section DEPLOIEMENT
  renderDeploymentSection();
}

// Fonction pour générer la section DEPLOIEMENT dynamiquement
function renderDeploymentSection() {
  const container = document.getElementById("checklist-sections");
  if (!container) return;

  const sectionId = "DEPLOIEMENT";

  // Insérer la section DEPLOIEMENT en premier (avant les autres sections)
  let html = `<div class="section" id="section-${sectionId}">`;
  html += `<h2 class="section-title">
    <button type="button" class="toggle-section-btn" id="toggle-${sectionId}" aria-label="Replier ou déplier la section" aria-expanded="true"></button>
    VOTRE DEPLOIEMENT SEPTEO SOLUTIONS AVOCATS
    <span class="section-badges">
      <span class="section-total-badge" id="section-total-${sectionId}">0h 00min</span>
      <span class="section-montant-badge" id="section-montant-${sectionId}" style="display: none;">0 €</span>
    </span>
  </h2>`;
  html += `<div class="section-content" id="content-${sectionId}">`;

  // Contenu de la section avec les différentes équipes
  html += `
    <!-- Équipe commerciale -->
    <div id="commercial-team-info" class="commercial-team-container" style="display: none"></div>

    <!-- Équipe CSM -->
    <div id="csm-team-info" class="csm-team-container" style="display: none"></div>

    <!-- Équipe technique -->
    <div id="technical-team-info" class="technical-team-container" style="display: none"></div>

    <!-- Équipe formation -->
    <div id="formation-team-info" class="formation-team-container" style="display: none"></div>

    <!-- Affectation automatique des formateurs -->
    <div id="trainer-assignment-info" class="trainer-assignment-container" style="display: none"></div>

    <!-- Options de déploiement -->
    <div id="deployment-options" class="deployment-options-container" style="display: none"></div>
  `;

  html += `</div></div>`;

  // Insérer au début du container pour que ce soit la première section
  container.insertAdjacentHTML("afterbegin", html);

  // Ajouter la logique de toggle après un délai pour s'assurer que le DOM est prêt
  setTimeout(() => {
    const btn = document.getElementById(`toggle-${sectionId}`);
    const content = document.getElementById(`content-${sectionId}`);
    if (btn && content) {
      btn.onclick = function () {
        const expanded = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!expanded));

        // Utiliser les nouvelles classes pour l'animation
        if (expanded) {
          btn.classList.add("collapsed");
          content.classList.add("collapsed");
        } else {
          btn.classList.remove("collapsed");
          content.classList.remove("collapsed");
        }
      };
    }
  }, 0);
}

// =====================
// Gestion déplier/replier toutes les sections
// =====================
function setAllSections(expanded) {
  document.querySelectorAll(".toggle-section-btn").forEach((btn) => {
    btn.setAttribute("aria-expanded", String(expanded));

    // Mise à jour des classes pour l'animation
    const sectionId = btn.id.replace("toggle-", "");
    const content = document.getElementById(`content-${sectionId}`);

    if (!expanded) {
      btn.classList.add("collapsed");
      if (content) content.classList.add("collapsed");
    } else {
      btn.classList.remove("collapsed");
      if (content) content.classList.remove("collapsed");
    }
  });
}

/**
 * Génère un switch tri-state pour les tableaux (remplace les switches binaires)
 * @param {string} id - ID unique pour le switch
 * @param {string} name - Nom du champ
 * @param {boolean} checked - État initial (converti en tri-state)
 * @param {string} ariaLabel - Label d'accessibilité
 * @param {string} cssClass - Classe CSS additionnelle (optionnel)
 * @returns {string} HTML du switch tri-state
 */
function renderModernSwitch(
  id,
  name,
  checked = false,
  ariaLabel = "",
  cssClass = "check-feature"
) {
  // Convertir l'état binaire en tri-state
  const initialState = checked ? "activated" : "not-examined";

  // Utiliser le nouveau système tri-state
  return renderTriStateSwitch(id, name, initialState, ariaLabel, cssClass);
}

// =====================
// Fonction pour mettre à jour les prix après chargement des données JSON
// =====================
function updateFormationPrices() {
  console.log("🔄 Mise à jour des prix des formations...");
  document.querySelectorAll('tr[data-section="FORMATIONS"]').forEach((row) => {
    const fonctionnalite = row
      .querySelector("td:nth-child(2)")
      ?.textContent?.trim();
    if (!fonctionnalite) return;

    const newPrice = getFormationPrice(fonctionnalite);
    const prixUnitaireCell = row.querySelector(".prix-unitaire");

    if (prixUnitaireCell && newPrice !== "N/A") {
      prixUnitaireCell.textContent = newPrice;
      row.setAttribute("data-prix-unitaire", newPrice);
      console.log(`✅ Prix mis à jour pour "${fonctionnalite}": ${newPrice}`);
    }
  });

  // Recalculer les montants après la mise à jour des prix
  updateFormationMontants();
}

// =====================
// Fonction pour calculer les montants des formations
// =====================
function updateFormationMontants() {
  console.log("💰 updateFormationMontants() appelé");

  // Trouver toutes les lignes de formations
  const formationRows = document.querySelectorAll(
    'tr[data-section="FORMATIONS"]'
  );
  console.log(
    `📋 Nombre de lignes FORMATIONS trouvées: ${formationRows.length}`
  );

  formationRows.forEach((row, index) => {
    const nbInput = row.querySelector(".formation-nb");
    const montantCell = row.querySelector(".montant-formation");
    const switchElement = row.querySelector(".tri-state-modern-switch");
    const prixUnitaire = row.getAttribute("data-prix-unitaire");

    console.log(`  🔍 Ligne ${index}:`);
    console.log(`    - nbInput: ${nbInput ? nbInput.value : "NON TROUVÉ"}`);
    console.log(`    - montantCell: ${montantCell ? "TROUVÉ" : "NON TROUVÉ"}`);
    console.log(
      `    - switchElement: ${switchElement ? "TROUVÉ" : "NON TROUVÉ"}`
    );
    console.log(`    - prixUnitaire: ${prixUnitaire}`);

    if (!nbInput || !montantCell || !prixUnitaire || prixUnitaire === "N/A") {
      if (montantCell) {
        montantCell.textContent = "N/A";
        console.log(`    ❌ Montant mis à N/A (données manquantes)`);
      }
      return;
    }

    // Vérifier si le switch est activé
    const isActivated = switchElement
      ? isTriStateActivated(switchElement)
      : false;

    console.log(`    - Switch activé: ${isActivated}`);

    if (!isActivated) {
      montantCell.textContent = "0 €";
      console.log(`    💰 Montant mis à 0 € (switch non activé)`);
      return;
    }

    const nb = parseInt(nbInput.value, 10) || 0;

    // Extraire le nombre du prix (enlever le symbole € et les caractères non numériques)
    const prixMatch = prixUnitaire.match(/(\d+)/);
    const prix = prixMatch ? parseInt(prixMatch[1], 10) : 0;

    const montant = nb * prix;
    const montantText = montant > 0 ? `${montant} €` : "0 €";
    montantCell.textContent = montantText;

    console.log(
      `    💰 Calcul: ${nb} × ${prix} = ${montant} (affiché: "${montantText}")`
    );
  });

  console.log("✅ updateFormationMontants() terminé");
}

// =====================
// Fonction pour calculer le sous-total financier des formations
// =====================
function calculateFormationSousTotal() {
  let totalFinancier = 0;

  document.querySelectorAll('tr[data-section="FORMATIONS"]').forEach((row) => {
    const montantCell = row.querySelector(".montant-formation");
    if (!montantCell) return;

    const montantText = montantCell.textContent.trim();
    if (montantText === "N/A" || montantText === "0 €") return;

    // Extraire le montant (enlever le symbole €)
    const montantMatch = montantText.match(/(\d+)/);
    if (montantMatch) {
      totalFinancier += parseInt(montantMatch[1], 10);
    }
  });

  return totalFinancier;
}

// =====================
// Fonction pour calculer le montant total d'une section
// =====================
function calculateSectionMontantTotal(sectionName) {
  let totalMontant = 0;

  console.log(`🧮 calculateSectionMontantTotal appelé pour: "${sectionName}"`);
  console.log(
    `🔍 isSectionNamed("${sectionName}", "FORMATIONS"): ${isSectionNamed(
      sectionName,
      "FORMATIONS"
    )}`
  );

  // Pour l'instant, seule la section FORMATIONS a des montants
  if (isSectionNamed(sectionName, "FORMATIONS")) {
    const formationRows = document.querySelectorAll(
      'tr[data-section="FORMATIONS"]'
    );
    console.log(`📋 Lignes FORMATIONS trouvées: ${formationRows.length}`);

    formationRows.forEach((row, index) => {
      const montantCell = row.querySelector(".montant-formation");
      if (!montantCell) {
        console.log(`  ❌ Ligne ${index}: Pas de cellule montant-formation`);
        return;
      }

      const montantText = montantCell.textContent.trim();
      console.log(`  💰 Ligne ${index}: montant = "${montantText}"`);

      if (montantText === "N/A" || montantText === "0 €") {
        console.log(`  ⏭️ Ligne ${index}: montant ignoré (N/A ou 0 €)`);
        return;
      }

      // Extraire le montant (enlever le symbole €)
      const montantMatch = montantText.match(/(\d+)/);
      if (montantMatch) {
        const montant = parseInt(montantMatch[1], 10);
        totalMontant += montant;
        console.log(
          `  ✅ Ligne ${index}: ajout de ${montant}€ (total: ${totalMontant}€)`
        );
      } else {
        console.log(
          `  ❌ Ligne ${index}: impossible d'extraire le montant de "${montantText}"`
        );
      }
    });
  } else {
    console.log(
      `❌ Section "${sectionName}" n'est pas reconnue comme FORMATIONS`
    );
  }

  console.log(`🎯 Total final pour "${sectionName}": ${totalMontant}€`);
  return totalMontant;
}

// =====================
// Fonction pour valider la cohérence entre profils et effectif (avec throttling)
// =====================
let lastValidationTime = 0;
const VALIDATION_THROTTLE_MS = 2000; // Throttle à 2 secondes

function validateProfilesVsEffectif() {
  const now = Date.now();

  // Throttling : éviter le spam de validations
  if (now - lastValidationTime < VALIDATION_THROTTLE_MS) {
    return;
  }
  lastValidationTime = now;

  const effectifInput = document.getElementById("effectif");
  if (!effectifInput || !effectifInput.value || !window.profilsDynList) {
    // Ne plus afficher d'avertissement si pas d'effectif saisi
    return;
  }

  const effectifTotal = parseInt(effectifInput.value, 10);
  if (isNaN(effectifTotal) || effectifTotal <= 0) {
    return;
  }

  // Calculer seulement les profils cochés (comme dans updateTotals)
  let profilsTotal = 0;
  let profilsCochesCount = 0;

  window.profilsDynList.forEach((profil, idx) => {
    const checkbox = document.querySelector(`#profil-check-${idx}`);
    const nbInput = document.querySelector(`#profil-nb-${idx}`);

    if (checkbox && checkbox.checked && nbInput) {
      const nb = parseInt(nbInput.value, 10) || 0;
      profilsTotal += nb;
      profilsCochesCount++;
    }
  });

  // Ne valider que si au moins 1 profil est coché ET qu'un effectif est saisi
  if (profilsCochesCount === 0 && effectifTotal > 0) {
    // Cas spécial : effectif saisi mais aucun profil coché - pas d'erreur immédiate
    return;
  }

  // Si les totaux ne correspondent pas, afficher un avertissement
  if (profilsTotal !== effectifTotal && profilsCochesCount > 0) {
    console.warn(
      `⚠️ Incohérence: Somme profils cochés (${profilsTotal}) ≠ Effectif total (${effectifTotal})`
    );

    // Optionnel: ajouter un indicateur visuel sur l'interface
    const utilisateursRow = document.querySelector(
      '[data-section="PARAMÉTRAGE"] #utilisateurs-nb'
    );
    if (utilisateursRow) {
      const parent = utilisateursRow.closest("td");
      if (parent && !parent.querySelector(".effectif-warning")) {
        const warning = document.createElement("div");
        warning.className = "effectif-warning";
        warning.style.cssText =
          "color: #e74c3c; font-size: 0.8em; margin-top: 2px;";
        warning.textContent = `⚠️ Profils cochés: ${profilsTotal}/${effectifTotal}`;
        parent.appendChild(warning);

        // Supprimer l'avertissement après 5 secondes
        setTimeout(() => {
          if (warning.parentNode) {
            warning.parentNode.removeChild(warning);
          }
        }, 5000);
      }
    }
  } else if (profilsTotal === effectifTotal && profilsCochesCount > 0) {
    console.log(
      `✅ Cohérence vérifiée: Profils cochés = Effectif = ${profilsTotal}`
    );

    // Supprimer les avertissements existants
    document.querySelectorAll(".effectif-warning").forEach((warning) => {
      if (warning.parentNode) {
        warning.parentNode.removeChild(warning);
      }
    });
  }
}

// =====================
// Fonction pour calculer le nombre d'unités basé sur l'effectif
// =====================
function updateFormationQuantitiesBasedOnEffectif() {
  const effectifInput = document.getElementById("effectif");
  if (!effectifInput || !effectifInput.value) {
    console.log("📊 Pas d'effectif saisi, aucune mise à jour des quantités");
    return;
  }

  const effectif = parseInt(effectifInput.value, 10);
  if (isNaN(effectif) || effectif <= 0) {
    console.log("📊 Effectif invalide, aucune mise à jour des quantités");
    return;
  }

  // Calculer le nombre d'unités nécessaires: effectif / 8 arrondi à l'unité supérieure
  const unitesNecessaires = Math.ceil(effectif / 8);
  let elementsUpdated = 0;

  // Mettre à jour toutes les formations et modules complémentaires qui ont "Par groupe de 8"
  document
    .querySelectorAll(
      'tr[data-section="FORMATIONS"], tr[data-section="MODULES COMPLEMENTAIRES"]'
    )
    .forEach((tr) => {
      const attentionBadge = tr.querySelector(".attention-badge");

      // Vérifier si cet élément a le badge "Par groupe de 8"
      if (
        attentionBadge &&
        attentionBadge.textContent.includes("Par groupe de 8")
      ) {
        const nbInput = tr.querySelector(".feature-nb");
        if (nbInput) {
          // Mettre à jour la valeur seulement si elle est différente
          const currentValue = parseInt(nbInput.value, 10) || 1;
          if (currentValue !== unitesNecessaires) {
            const fonctionnalite =
              tr
                .querySelector("td:nth-child(2)")
                ?.textContent?.trim()
                .split("\n")[0] || "Inconnue";
            console.log(
              `  ↳ ${fonctionnalite}: ${currentValue} → ${unitesNecessaires}`
            );

            nbInput.value = unitesNecessaires;
            elementsUpdated++;

            // Déclencher l'événement input pour mettre à jour les totaux
            const inputEvent = new Event("input", { bubbles: true });
            nbInput.dispatchEvent(inputEvent);
          }
        }
      }
    });

  console.log(
    `📊 Quantités mises à jour: ${effectif} personnes → ${unitesNecessaires} unités (par groupe de 8) - ${elementsUpdated} éléments modifiés`
  );
}

// Exposer les fonctions de formation globalement
window.updateFormationMontants = updateFormationMontants;
window.updateFormationPrices = updateFormationPrices;
