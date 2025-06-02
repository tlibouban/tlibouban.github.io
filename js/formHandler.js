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
        <span class="section-total-badge" id="section-total-${sectionId}">0h 00min</span>
      </h2>`;
      html += `<div class="section-content" id="content-${sectionId}">`;
    } else {
      html += `<h2 class="section-title">${section}<span class="section-total-badge" id="section-total-${sectionId}">0h 00min</span></h2>`;
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

      // Déterminer approximativement où couper pour équilibrer les colonnes
      const sectionCount = sousSectionsKeys.length;
      const itemsPerColumn = Math.ceil(sectionCount / 3);

      // Première colonne
      html += renderCabinetColumn(
        section,
        sectionId,
        sousSections,
        sousSectionsKeys.slice(0, itemsPerColumn),
        0
      );

      // Deuxième colonne
      html += renderCabinetColumn(
        section,
        sectionId,
        sousSections,
        sousSectionsKeys.slice(itemsPerColumn, itemsPerColumn * 2),
        100
      );

      // Troisième colonne
      html += renderCabinetColumn(
        section,
        sectionId,
        sousSections,
        sousSectionsKeys.slice(itemsPerColumn * 2),
        200
      );

      html += `</div>`;
    }
    // Traitement standard pour les autres sections
    else {
      // Table header
      html += `<table class="checklist-table"><thead><tr><th>✔</th><th>Fonctionnalité</th><th>Nb</th><th>Unité</th><th>Temps unitaire</th><th>Sous-total</th></tr></thead><tbody>`;

      let idxGlobal = 0;
      sousSectionsKeys.forEach((ss) => {
        html += `<tr><td colspan="6"><h3 style="margin:18px 0 8px 0;font-size:1.08em;color:#2e4a9e;">${ss}</h3></td></tr>`;
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
              hasNumber
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
  updateTotals();

  // Ajoute les listeners
  document
    .querySelectorAll(
      ".check-feature, .feature-nb, .check-feature-utilisateurs, .check-feature-cabinet"
    )
    .forEach((el) => {
      el.addEventListener("input", updateTotals);
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
    html += `<h3 style="margin:18px 0 8px 0;font-size:1.08em;color:#2e4a9e;">${ss}</h3>`;
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
        <td><label class="switch">
            <input type="checkbox" class="check-feature-cabinet" aria-label="Activer/désactiver cette fonctionnalité" 
              id="feature-${sectionId}-${ss.replace(/\s+/g, "-")}-${idxGlobal}" 
              name="feature-${sectionId}-${idxGlobal}" 
              ${forceActive ? "checked" : ""}
            />
            <span class="slider"></span>
          </label></td>
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
function renderStandardRow(
  section,
  sectionId,
  item,
  idxGlobal,
  unit,
  hasNumber
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
    return `<tr data-section="${section}" data-idx="${idxGlobal}" data-temps="${
      item.TEMPS || ""
    }">
      <td><label class="switch">
          <input type="checkbox" class="check-feature" aria-label="Activer/désactiver cette fonctionnalité" id="feature-${sectionId}-${idxGlobal}" name="feature-${sectionId}-${idxGlobal}" />
          <span class="slider"></span>
        </label></td>
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
      <td class=\"sous-total\">${hideSubtotal ? "N/A" : "0"}</td>
    </tr>`;
  } else {
    // Ligne standard ou avec nombre
    return `<tr data-section="${section}" data-idx="${idxGlobal}" data-temps="${
      item.TEMPS || ""
    }">
      <td><input type="checkbox" class="check-feature" aria-label="Inclure cette fonctionnalité dans le calcul" id="feature-${sectionId}-${idxGlobal}" name="feature-${sectionId}-${idxGlobal}" /></td>
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
          ? `<input type=\"number\" min=\"0\" value=\"${defaultValue}\" class=\"feature-nb\" style=\"width:60px;\" aria-label=\"Quantité\" id=\"nb-${sectionId}-${idxGlobal}\" name=\"nb-${sectionId}-${idxGlobal}\" data-unit="${uniteSingulier}" />`
          : ""
      }</td>
      <td class="unite-cell" data-unit-base="${uniteSingulier}">${
      uniteSingulier ? accordUnit(defaultValue, uniteSingulier) : ""
    }</td>
      <td>${item.TEMPS ? item.TEMPS.slice(0, 5) : ""}</td>
      <td class=\"sous-total\">0</td>
    </tr>`;
  }
}

/**
 * Génère le HTML pour la ligne Utilisateurs avec les profils
 */
function renderUtilisateursRow(section, sectionId, item, idxGlobal) {
  return `<tr data-section="${section}" data-idx="${idxGlobal}" data-temps="${
    item.TEMPS || ""
  }">
    <td><input type="checkbox" class="check-feature-utilisateurs" aria-label="Inclure les utilisateurs dans le calcul" id="feature-utilisateurs-${sectionId}-${idxGlobal}" name="feature-utilisateurs-${sectionId}-${idxGlobal}" /></td>
    <td>
      Utilisateurs
      <br>
      <div id="profils-dyn-list"></div>
      <div class="profil-buttons" style="display:flex;gap:10px;margin-top:8px;">
        <button type="button" id="add-profil-btn" class="action-btn">Ajouter un profil</button>
        <button type="button" id="profile-manager-btn" class="action-btn">Gérer les profils</button>
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
  let totalGeneral = 0;

  // Liste des éléments à exclure du calcul des totaux
  const excludedFromTotal = [
    "Dashboard",
    "Actions liées",
    "Infos complémentaires",
  ];

  document.querySelectorAll(".section").forEach((sectionDiv) => {
    let sectionTotal = 0;
    const isCabinetOption = sectionDiv.id === "section-CABINET-OPTION";

    sectionDiv.querySelectorAll("tbody tr").forEach((tr, idx) => {
      // Vérifier si la ligne contient une fonctionnalité à exclure
      const fonctionnaliteText = tr
        .querySelector("td:nth-child(2)")
        ?.textContent.trim();
      const isExcluded = excludedFromTotal.some((item) =>
        fonctionnaliteText?.includes(item)
      );

      // Cas spécial : ligne Utilisateurs (par user)
      if (tr.querySelector("#profils-dyn-list")) {
        let utilisateursTotal = 0;
        let profilsTotalMinutes = 0;

        if (window.profilsDynList) {
          window.profilsDynList.forEach((profil, pidx) => {
            const checked = tr.querySelector(
              `#profils-dyn-list .check-feature-profil[data-idx='${pidx}']`
            )?.checked;
            const nb = tr.querySelector(
              `#profils-dyn-list .profil-nb[data-idx='${pidx}']`
            )
              ? parseInt(
                  tr.querySelector(
                    `#profils-dyn-list .profil-nb[data-idx='${pidx}']`
                  ).value,
                  10
                )
              : 1;
            const modif = tr.querySelector(
              `#profils-dyn-list .profil-modif[data-idx='${pidx}']`
            )?.checked;

            utilisateursTotal += checked ? nb : 0;

            // Temps profils : 0 si pas modif, 30 min si modif
            let tempsProfil = 0;
            if (modif) tempsProfil += 30;
            profilsTotalMinutes += checked ? tempsProfil : 0;

            // Met à jour le sous-total de la ligne profil
            const sousTotalCell = tr.querySelector(
              `#profils-dyn-list .profil-sous-total[data-idx='${pidx}']`
            );
            if (sousTotalCell) {
              sousTotalCell.textContent =
                checked && modif ? formatMinutes(30) : "0";
            }
          });
        }

        // Met à jour le champ nb utilisateurs
        const nbInput = tr.querySelector("#utilisateurs-nb");
        if (nbInput) {
          nbInput.value = utilisateursTotal;

          // Mettre à jour l'unité avec l'accord grammatical
          const uniteCell = tr.querySelector(".unite-cell");
          if (uniteCell && uniteCell.hasAttribute("data-unit-base")) {
            const unitBase = uniteCell.getAttribute("data-unit-base");
            uniteCell.textContent = accordUnit(utilisateursTotal, unitBase);
          }
        }

        // Calcul du sous-total utilisateurs (ligne)
        const checkedUtil = tr.querySelector(
          ".check-feature-utilisateurs"
        )?.checked;
        const timeMins = parseTimeToMinutes(tr.dataset.temps);
        const sousTotalUtil = checkedUtil ? utilisateursTotal * timeMins : 0;
        const totalUtilEtProfils = sousTotalUtil + profilsTotalMinutes;

        const sousTotalCell = tr.querySelector(".sous-total");
        if (sousTotalCell) {
          sousTotalCell.innerHTML = totalUtilEtProfils
            ? `${formatMinutes(
                totalUtilEtProfils
              )}<br><span style='font-size:0.95em;color:#444;'>(utilisateurs : ${
                sousTotalUtil ? formatMinutes(sousTotalUtil) : "0"
              } + profils : ${
                profilsTotalMinutes ? formatMinutes(profilsTotalMinutes) : "0"
              })</span>`
            : "0";
        }

        // Ajoute bien la somme utilisateurs+profils au total de la section
        sectionTotal += totalUtilEtProfils;

        // Ajoute le sous-total profils à la cellule dédiée
        const profilsTotalCell = tr.querySelector(
          "#profils-dyn-list #profils-total-cell"
        );
        if (profilsTotalCell) {
          profilsTotalCell.textContent = profilsTotalMinutes
            ? formatMinutes(profilsTotalMinutes)
            : "0";
        }
      } else {
        // Calcul standard pour les autres lignes
        const checked = tr.querySelector(
          ".check-feature, .check-feature-cabinet"
        );
        const isChecked = checked ? checked.checked : false;

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
          const sousTotal = isChecked && !isExcluded ? nb * timeMins : 0;

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
          }
        }
      }
    });

    // Met à jour le badge de la section
    const badge = sectionDiv.querySelector(".section-total-badge");
    if (badge) {
      if (isCabinetOption) {
        // Pour Cabinet Option, afficher le nombre d'options activées plutôt que le temps
        const optionsActivees = sectionDiv.querySelectorAll(
          ".check-feature-cabinet:checked"
        ).length;
        const optionsTotal = sectionDiv.querySelectorAll(
          ".check-feature-cabinet"
        ).length;

        // Affichage avec accord grammatical
        const texteOption =
          optionsActivees <= 1 ? "option active" : "options actives";
        badge.textContent = `${optionsActivees}/${optionsTotal} ${texteOption}`;
      } else {
        badge.textContent = formatMinutes(sectionTotal);
      }
    }

    // N'ajoute au total général que pour les sections autres que Cabinet Option
    if (!isCabinetOption) {
      totalGeneral += sectionTotal;
    }
  });

  document.getElementById("total-general-h1").textContent =
    formatMinutes(totalGeneral);
}

// =====================
// Ajoute les listeners sur tous les champs interactifs (checkbox, input)
// =====================
function addAllInputListeners() {
  // Pour tous les champs standards
  document
    .querySelectorAll(
      ".check-feature, .feature-nb, .check-feature-utilisateurs, .check-feature-cabinet"
    )
    .forEach((el) => {
      el.removeEventListener("input", updateTotals); // évite les doublons
      el.addEventListener("input", updateTotals);
    });

  // Pour les profils dynamiques
  document
    .querySelectorAll(
      ".check-feature-profil, .profil-nb, .profil-modif, .profil-nom, .remove-profil-btn"
    )
    .forEach((el) => {
      el.removeEventListener("input", updateTotals);
      el.addEventListener("input", updateTotals);
    });
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
