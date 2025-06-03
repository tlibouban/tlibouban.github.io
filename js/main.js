/**
 * main.js - Script principal
 * Initialisation de l'application et attachement des événements
 */

document.addEventListener("DOMContentLoaded", function () {
  console.log("📄 Page chargée, initialisation...");

  // Charger les formations logiciels au démarrage
  loadFormationsLogiciels();

  // Initialise le formulaire
  renderChecklist();

  // Initialise les filtres
  initFilters();

  // Initialiser l'état des sections repliables
  initCollapsibleSections();

  // Bascule du gestionnaire d'événements pour le bouton "Gérer les profils"
  // Il faut le faire ici car il est déplacé dynamiquement
  function reattachProfileManagerHandler() {
    const profileManagerBtn = document.getElementById("profile-manager-btn");
    if (profileManagerBtn) {
      // On retire d'abord tous les gestionnaires
      const newBtn = profileManagerBtn.cloneNode(true);
      profileManagerBtn.parentNode.replaceChild(newBtn, profileManagerBtn);

      // Utiliser la fonction openProfileModal de notre implementation Vue
      newBtn.addEventListener("click", function () {
        if (typeof window.openProfileModal === "function") {
          window.openProfileModal();
        } else {
          console.error("La fonction openProfileModal n'est pas disponible");
        }
      });
    }
  }

  // Initialisation des sections repliables avec animation
  function initCollapsibleSections() {
    // Au chargement initial, les sections sont dépliées par défaut
    // Assurons-nous que les classes reflètent cet état
    document.querySelectorAll(".toggle-section-btn").forEach((btn) => {
      btn.setAttribute("aria-expanded", "true");
      btn.classList.remove("collapsed");

      const content = document.getElementById(
        `content-${btn.id.replace("toggle-", "")}`
      );
      if (content) {
        content.classList.remove("collapsed");
      }
    });
  }

  // Réattacher les gestionnaires d'événements après le rendu
  setTimeout(reattachProfileManagerHandler, 500);

  // S'assurer que les interrupteurs de Cabinet Option sont correctement configurés
  document
    .querySelectorAll(".modern-switch-input.check-feature-cabinet")
    .forEach((switchInput) => {
      switchInput.addEventListener("change", function () {
        // Mettre à jour l'affichage des badges d'attention en fonction de l'état du switch
        const row = this.closest("tr");
        if (row) {
          const warningBadge = row.querySelector(".attention-badge");
          const optionName = row.getAttribute("data-option-name");

          // Si le switch est activé, masquer le badge d'attention s'il existe
          if (this.checked && warningBadge) {
            warningBadge.style.display = "none";
          }
          // Si le switch est désactivé, afficher le badge d'attention s'il existe
          else if (!this.checked && warningBadge) {
            warningBadge.style.display = "";
          }
        }

        // Mettre à jour les totaux
        updateTotals();
      });
    });

  // =====================
  // Base de données des clients depuis le TSV
  // =====================
  let clientDatabase = [];
  let commercialDatabase = null; // Base de données commerciale

  // Charger la base de données des clients
  async function loadClientDatabase() {
    try {
      const response = await fetch("csv/db_anonymized.tsv");
      const text = await response.text();
      const lines = text.split("\n");

      clientDatabase = [];
      // Ignorer la première ligne (headers)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const columns = line.split("\t");
          if (columns.length >= 5 && columns[1] && columns[2] && columns[3]) {
            const [
              numero,
              nom,
              type,
              erp,
              effectif,
              avocats_associes,
              avocats_collaborateurs,
              secretaires,
              assistants_juridiques,
              juristes,
              informatique,
              rh,
              communication,
              documentation,
              comptabilite,
              departement,
            ] = columns;

            clientDatabase.push({
              numero: numero,
              nom: nom.trim(),
              type: type.trim(), // "Prospect" ou "Client"
              erp: erp.trim(), // Logiciel utilisé
              effectif: effectif ? parseInt(effectif.trim()) : 0,
              // Nouvelles colonnes de métiers
              avocats_associes: avocats_associes
                ? parseInt(avocats_associes.trim())
                : 0,
              avocats_collaborateurs: avocats_collaborateurs
                ? parseInt(avocats_collaborateurs.trim())
                : 0,
              secretaires: secretaires ? parseInt(secretaires.trim()) : 0,
              assistants_juridiques: assistants_juridiques
                ? parseInt(assistants_juridiques.trim())
                : 0,
              juristes: juristes ? parseInt(juristes.trim()) : 0,
              informatique: informatique ? parseInt(informatique.trim()) : 0,
              rh: rh ? parseInt(rh.trim()) : 0,
              communication: communication ? parseInt(communication.trim()) : 0,
              documentation: documentation ? parseInt(documentation.trim()) : 0,
              comptabilite: comptabilite ? parseInt(comptabilite.trim()) : 0,
              // Nouvelle colonne département
              departement: departement ? departement.trim() : "",
            });
          }
        }
      }
      console.log(
        `📊 Base de données client chargée: ${clientDatabase.length} entrées avec données de métiers et départements`
      );
    } catch (error) {
      console.error(
        "❌ Erreur lors du chargement de la base de données:",
        error
      );
      clientDatabase = null;
    }
  }

  // Fonction pour rechercher un client dans la base
  function findClientInDatabase(clientName) {
    if (!clientDatabase || !clientName) return null;

    const searchName = clientName.trim().toLowerCase();
    return clientDatabase.find(
      (client) =>
        client.nom.toLowerCase().includes(searchName) ||
        searchName.includes(client.nom.toLowerCase())
    );
  }

  // Charger la base de données au démarrage
  loadClientDatabase();
  loadCommercialDatabase();

  // =====================
  // Gestion des dropdowns avec logique client/prospect
  // =====================

  // Gestion du champ logiciel autre
  const logicielSelect = document.getElementById("logiciel");
  const projetSelect = document.getElementById("projet");
  const sensSelect = document.getElementById("sens");
  const clientInput = document.getElementById("client");
  const logicielAutreContainer = document.getElementById(
    "logiciel-autre-container"
  );

  // Écouter les changements dans le champ client
  clientInput.addEventListener("input", function () {
    updateOptionsBasedOnClient();
  });

  // Fonction pour afficher les informations de l'équipe commerciale
  function displayCommercialTeam(clientData) {
    // Chercher ou créer la div pour les informations commerciales
    let commercialDiv = document.getElementById("commercial-team-info");

    if (!commercialDiv) {
      // Créer la div après la scenario-row
      const scenarioRow = document.querySelector(".scenario-row");
      if (!scenarioRow) return;

      commercialDiv = document.createElement("div");
      commercialDiv.id = "commercial-team-info";
      commercialDiv.className = "commercial-team-container";

      // Insérer après la scenario-row
      scenarioRow.parentNode.insertBefore(
        commercialDiv,
        scenarioRow.nextSibling
      );
    }

    if (!clientData || !clientData.departement) {
      commercialDiv.style.display = "none";
      return;
    }

    const commercialData = getCommercialDataByDepartment(
      clientData.departement
    );

    if (!commercialData) {
      commercialDiv.style.display = "none";
      return;
    }

    // Créer le lien téléphone si un numéro RR est disponible
    const phoneLink = commercialData["RR Tel"]
      ? `<a href="tel:${commercialData["RR Tel"].replace(
          /\s/g,
          ""
        )}" class="commercial-phone-link">${commercialData["RR Tel"]}</a>`
      : "";

    // Construire l'affichage des informations commerciales
    commercialDiv.innerHTML = `
      <div class="commercial-team-content">
        <h4>🏢 Équipe commerciale - Zone ${commercialData.Zone}</h4>
        <div class="commercial-team-details">
          <span class="commercial-item">
            <strong>RR:</strong> ${commercialData["RR Nom"]}${phoneLink}
          </span>
          <span class="commercial-separator">•</span>
          <span class="commercial-item">
            <strong>CS MM:</strong> ${commercialData["CS MM Nom"]}
          </span>
          <span class="commercial-separator">•</span>
          <span class="commercial-item">
            <strong>CS LM:</strong> ${commercialData["CS LM Nom"]}
          </span>
        </div>
      </div>
    `;

    commercialDiv.style.display = "block";
  }

  // Fonction pour mettre à jour les options selon le client
  function updateOptionsBasedOnClient() {
    const clientName = clientInput.value;
    const clientData = findClientInDatabase(clientName);
    const effectifInput = document.getElementById("effectif");

    if (clientData) {
      console.log(
        `🔍 Client trouvé: ${clientData.nom} (${clientData.type}) - ERP: ${clientData.erp} - Effectif: ${clientData.effectif} - Dép: ${clientData.departement}`
      );

      // Remplir le champ effectif
      effectifInput.value = clientData.effectif;

      // Mettre à jour les quantités de formations basées sur l'effectif
      if (typeof updateFormationQuantitiesBasedOnEffectif === "function") {
        updateFormationQuantitiesBasedOnEffectif();
      }

      if (clientData.type === "Prospect") {
        // Si prospect : Type de projet = "New logo" uniquement
        updateProjetOptionsForProspect();
        // Logiciel de base = ERP de la base + supprimer logiciel-autre-container
        updateLogicielOptionsForProspect(clientData.erp);
      } else if (clientData.type === "Client") {
        // Si client : Type de projet = "Séparation de base", "Fusion", "Base collaborateur"
        updateProjetOptionsForClient();
        // Logiciel de base = ERP du client uniquement (comme pour les prospects)
        updateLogicielOptionsForClient(clientData.erp);
      }

      // Afficher les informations de l'équipe commerciale
      displayCommercialTeam(clientData);

      // Afficher les informations de l'équipe formation
      displayFormationTeam(clientData);

      // Affectation intelligente des formateurs
      updateTrainerAssignment(clientData);
    } else {
      // Client non trouvé dans la base, réinitialiser effectif et revenir aux options standard
      effectifInput.value = "";
      updateProjetOptionsStandard();
      updateLogicielOptionsStandard();
      logicielAutreContainer.classList.remove("hidden");

      // Masquer les informations commerciales et formation
      displayCommercialTeam(null);

      // Afficher les options de déploiement basées sur l'effectif saisi manuellement
      displayDeploymentOptions(null);

      displayFormationTeam(null);

      // Masquer l'affectation des formateurs
      hideTrainerAssignment();
    }

    // Mettre à jour les profils utilisateurs selon les données TSV
    updateProfilesFromClientData(clientData);

    // Mettre à jour les options de sens après changement
    updateSensOptions();
  }

  function updateProjetOptionsForProspect() {
    const currentValue = projetSelect.value;
    projetSelect.innerHTML = '<option value="">Sélectionner…</option>';

    const option = document.createElement("option");
    option.value = "newlogo";
    option.textContent = "New logo";
    projetSelect.appendChild(option);

    // Auto-sélectionner "New logo" pour un prospect
    projetSelect.value = "newlogo";
  }

  function updateProjetOptionsForClient() {
    const currentValue = projetSelect.value;
    projetSelect.innerHTML = '<option value="">Sélectionner…</option>';

    [
      { value: "separation", label: "Séparation de base" },
      { value: "fusion", label: "Fusion" },
      { value: "basecollab", label: "Base collaborateur" },
    ].forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.label;
      projetSelect.appendChild(option);
    });

    // Restaurer la valeur si elle existe dans les nouvelles options
    if ([...projetSelect.options].some((o) => o.value === currentValue)) {
      projetSelect.value = currentValue;
    }
  }

  function updateProjetOptionsStandard() {
    const currentValue = projetSelect.value;
    projetSelect.innerHTML = '<option value="">Sélectionner…</option>';

    [
      { value: "separation", label: "Séparation de base" },
      { value: "fusion", label: "Fusion" },
      { value: "newlogo", label: "New logo" },
      { value: "basecollab", label: "Base collaborateur" },
    ].forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.label;
      projetSelect.appendChild(option);
    });

    if ([...projetSelect.options].some((o) => o.value === currentValue)) {
      projetSelect.value = currentValue;
    }
  }

  function updateLogicielOptionsForProspect(erp) {
    const currentValue = logicielSelect.value;
    logicielSelect.innerHTML = '<option value="">Sélectionner...</option>';

    // Ajouter l'ERP du prospect comme seule option
    const option = document.createElement("option");
    option.value = erp;
    option.textContent = erp;
    logicielSelect.appendChild(option);

    // Auto-sélectionner l'ERP
    logicielSelect.value = erp;

    // Masquer le conteneur "logiciel-autre" pour les prospects
    logicielAutreContainer.classList.add("hidden");
  }

  function updateLogicielOptionsStandard() {
    const currentValue = logicielSelect.value;
    logicielSelect.innerHTML = '<option value="">Sélectionner...</option>';

    [
      { value: "AIR", label: "AIR" },
      { value: "NEO", label: "NEO" },
      { value: "Autre", label: "Autre" },
    ].forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.label;
      logicielSelect.appendChild(option);
    });

    if ([...logicielSelect.options].some((o) => o.value === currentValue)) {
      logicielSelect.value = currentValue;
    }
  }

  function updateLogicielOptions() {
    // Cette fonction est maintenant gérée par updateOptionsBasedOnClient()
    // Gardée pour compatibilité avec les appels existants
    const clientName = clientInput.value;
    const clientData = findClientInDatabase(clientName);

    if (clientData && clientData.type === "Prospect") {
      // Pour les prospects, utiliser l'ERP de la base
      return;
    }

    const projetValue = projetSelect.value;
    const currentValue = logicielSelect.value;

    // Sauvegarde de la valeur actuelle si elle est compatible avec les nouvelles options
    const isFusionOrSeparation = ["fusion", "separation"].includes(projetValue);

    // Réinitialiser les options
    logicielSelect.innerHTML =
      '<option value="" selected>Sélectionner...</option>';

    // Cas particulier : "Fusion" ou "Séparation de base" - seulement AIR ou NEO
    if (isFusionOrSeparation) {
      // Ajouter seulement AIR et NEO comme options
      [
        { value: "AIR", label: "AIR" },
        { value: "NEO", label: "NEO" },
      ].forEach((opt) => {
        const o = document.createElement("option");
        o.value = opt.value;
        o.textContent = opt.label;
        logicielSelect.appendChild(o);
      });
    } else {
      // Pour les autres types de projets, ajouter toutes les options
      [
        { value: "AIR", label: "AIR" },
        { value: "NEO", label: "NEO" },
        { value: "Autre", label: "Autre" },
      ].forEach((opt) => {
        const o = document.createElement("option");
        o.value = opt.value;
        o.textContent = opt.label;
        logicielSelect.appendChild(o);
      });
    }

    // Restaurer la valeur précédente si elle est dans les nouvelles options
    if ([...logicielSelect.options].some((o) => o.value === currentValue)) {
      logicielSelect.value = currentValue;
    } else {
      logicielSelect.selectedIndex = 0; // Sélectionner la première option par défaut
    }
  }

  function updateLogicielOptionsForClient(erp) {
    const currentValue = logicielSelect.value;
    logicielSelect.innerHTML = '<option value="">Sélectionner...</option>';

    // Ajouter l'ERP du client comme seule option
    const option = document.createElement("option");
    option.value = erp;
    option.textContent = erp;
    logicielSelect.appendChild(option);

    // Auto-sélectionner l'ERP
    logicielSelect.value = erp;

    // Masquer le conteneur "logiciel-autre" pour les clients aussi
    logicielAutreContainer.classList.add("hidden");
  }

  function updateLogicielAutre() {
    const clientName = clientInput.value;
    const clientData = findClientInDatabase(clientName);

    // Si c'est un prospect ou un client, ne pas afficher logiciel-autre-container
    if (
      clientData &&
      (clientData.type === "Prospect" || clientData.type === "Client")
    ) {
      logicielAutreContainer.classList.add("hidden");
      document.getElementById("logiciel-autre").value = "";

      // Désactiver/activer le dropdown sens selon la sélection
      if (logicielSelect.value === "") {
        sensSelect.disabled = true;
      } else {
        sensSelect.disabled = false;
      }
      updateSensOptions();
      return;
    }

    // Mettre à jour les options disponibles selon le type de projet (logique standard)
    updateLogicielOptions();

    if (logicielSelect.value === "Autre") {
      // Afficher avec une animation
      logicielAutreContainer.classList.remove("hidden");
      // Focus sur le champ de saisie pour faciliter la saisie immédiate
      setTimeout(() => {
        document.getElementById("logiciel-autre").focus();
      }, 300);
    } else {
      // Masquer le conteneur
      logicielAutreContainer.classList.add("hidden");
      // Réinitialiser la valeur pour éviter des soumissions avec des données obsolètes
      document.getElementById("logiciel-autre").value = "";
    }

    // Si la valeur est vide, désactiver le dropdown sens
    if (logicielSelect.value === "") {
      sensSelect.disabled = true;
    } else {
      sensSelect.disabled = false;
    }

    updateSensOptions();
  }

  function updateSensOptions() {
    const oldValue = sensSelect.value;

    // Toujours afficher "Solutions SEPTEO" au lieu de "Sens du changement"
    const sensLabel = document.querySelector('label[for="sens"]');
    if (sensLabel) {
      sensLabel.textContent = "Solutions SEPTEO";
    }

    // Réinitialisation des options
    sensSelect.innerHTML = '<option value="">Sélectionner…</option>';

    // Cas particulier : New logo - Les 6 combinaisons demandées
    if (projetSelect.value === "newlogo") {
      [
        {
          value: "AIR_recupdonnees",
          label: "AIR avec récupération de données",
        },
        { value: "AIR_mastervide", label: "AIR avec master vide" },
        {
          value: "NEO_recupdonnees",
          label: "NEO avec récupération de données",
        },
        { value: "NEO_mastervide", label: "NEO avec master vide" },
        {
          value: "ADAPPS_recupdonnees",
          label: "ADAPPS avec récupération de données",
        },
        { value: "ADAPPS_mastervide", label: "ADAPPS avec master vide" },
      ].forEach((opt) => {
        const o = document.createElement("option");
        o.value = opt.value;
        o.textContent = opt.label;
        sensSelect.appendChild(o);
      });

      // Conserver la valeur sélectionnée si elle existe encore dans les nouvelles options
      if ([...sensSelect.options].some((o) => o.value === oldValue)) {
        sensSelect.value = oldValue;
      }
      return;
    }

    // Cas particulier : Base collaborateur
    if (projetSelect.value === "basecollab") {
      [
        { value: "recupdonnees", label: "Récupération de données" },
        { value: "mastervide", label: "Master vide" },
      ].forEach((opt) => {
        const o = document.createElement("option");
        o.value = opt.value;
        o.textContent = opt.label;
        sensSelect.appendChild(o);
      });

      if ([...sensSelect.options].some((o) => o.value === oldValue)) {
        sensSelect.value = oldValue;
      }
      return;
    }

    // Met à jour les options de base avec NEO en majuscules et ajoute NEO vers AIR
    let options = [
      { value: "AIRversAIR", label: "AIR vers AIR" },
      { value: "NEOversNEO", label: "NEO vers NEO" },
      { value: "AIRversNEO", label: "AIR vers NEO" },
      { value: "NEOversAIR", label: "NEO vers AIR" },
      { value: "AutreversNEO", label: "Autre vers NEO" },
    ];

    // Si Séparation, ne garder que AIR/NEO vers AIR/NEO
    if (projetSelect.value === "separation") {
      options = options.filter((opt) =>
        ["AIRversAIR", "AIRversNEO", "NEOversNEO", "NEOversAIR"].includes(
          opt.value
        )
      );
    }

    // Logique de filtrage améliorée pour gérer tous les ERP
    const currentLogiciel = logicielSelect.value;

    if (currentLogiciel) {
      if (["AIR", "NEO"].includes(currentLogiciel)) {
        // Pour AIR et NEO, garder les options qui commencent par ce logiciel
        const prefix = currentLogiciel.toUpperCase();
        options = options.filter((opt) =>
          opt.label.toUpperCase().startsWith(prefix)
        );
      } else {
        // Pour tous les autres ERP (solutions SEPTEO), proposer migration vers AIR et NEO
        const erpName = currentLogiciel.toUpperCase();
        options = [
          { value: `${erpName}versAIR`, label: `${erpName} vers AIR` },
          { value: `${erpName}versNEO`, label: `${erpName} vers NEO` },
        ];
      }
    }

    // Avant d'ajouter les options au select sens, trie-les par ordre alphabétique sur le label
    options.sort((a, b) =>
      a.label.localeCompare(b.label, "fr", { sensitivity: "base" })
    );

    options.forEach((opt) => {
      const o = document.createElement("option");
      o.value = opt.value;
      o.textContent = opt.label;
      sensSelect.appendChild(o);
    });

    if ([...sensSelect.options].some((o) => o.value === oldValue)) {
      sensSelect.value = oldValue;
    }
  }

  logicielSelect.addEventListener("change", updateLogicielAutre);
  projetSelect.addEventListener("change", updateLogicielAutre);

  // Initialisation
  updateLogicielAutre();

  // =====================
  // Gestion déplier/replier toutes les sections avec bouton toggle
  // =====================
  const toggleAllBtn = document.getElementById("toggle-all-btn");

  if (toggleAllBtn) {
    toggleAllBtn.onclick = () => {
      const currentState = toggleAllBtn.getAttribute("data-state");
      const isExpanding = currentState === "collapsed";

      // Appliquer l'action opposée à l'état actuel
      setAllSections(isExpanding);

      // Mettre à jour l'état et le texte du bouton
      toggleAllBtn.setAttribute(
        "data-state",
        isExpanding ? "expanded" : "collapsed"
      );
      toggleAllBtn.innerHTML = isExpanding
        ? '<span class="icon">&#x25BC;</span> Tout replier'
        : '<span class="icon">&#x25BC;</span> Tout déplier';
    };
  }

  // =====================
  // Gestion du titre dynamique
  // =====================
  const mainTitle = document.getElementById("main-title");

  function updateMainTitle() {
    const val = clientInput.value.trim();
    if (val) {
      // Rechercher le client dans la base pour obtenir le département
      const clientData = findClientInDatabase(val);
      if (clientData && clientData.departement) {
        mainTitle.textContent = `Checklist du déploiement du cabinet ${val} (dép. ${clientData.departement})`;
      } else {
        mainTitle.textContent = `Checklist du déploiement du cabinet ${val}`;
      }
    } else {
      mainTitle.textContent = "Checklist du déploiement";
    }
  }

  clientInput.addEventListener("input", updateMainTitle);

  // Initialisation
  updateMainTitle();

  // =====================
  // Gestion des boutons d'impression/export
  // =====================
  const printBtn = document.getElementById("print-btn");
  const exportBtn = document.getElementById("export-btn");

  if (printBtn) {
    printBtn.onclick = () => window.print();
  }

  if (exportBtn) {
    exportBtn.onclick = () => {
      if (window.printJS) {
        printJS({
          printable: "checklist-form",
          type: "html",
          style: "",
          scanStyles: true,
          documentTitle: document.title,
        });
      } else {
        window.print();
      }
    };
  }

  // Assure que tous les listeners sont bien enregistrés
  addAllInputListeners();

  // Fonction pour mettre à jour les profils selon les données client TSV
  function updateProfilesFromClientData(clientData) {
    if (!clientData || !window.profilsDynList) {
      return;
    }

    console.log("📋 Mise à jour des profils pour le client:", clientData.nom);

    // Mapping des colonnes TSV vers les profils par défaut
    const profilMappings = {
      Associé: clientData.avocats_associes || 0,
      Collaborateur: clientData.avocats_collaborateurs || 0,
      Secrétaire: clientData.secretaires || 0,
      "Assistant juridique": clientData.assistants_juridiques || 0,
      Juriste: clientData.juristes || 0,
      Informatique: clientData.informatique || 0,
      RH: clientData.rh || 0,
      Communication: clientData.communication || 0,
      Documentation: clientData.documentation || 0,
      Comptabilité: clientData.comptabilite || 0,
    };

    // Créer une nouvelle liste de profils basée sur les données du client
    const newProfilesList = [];

    // Ajouter tous les profils qui ont des utilisateurs > 0
    Object.entries(profilMappings).forEach(([profilName, count]) => {
      if (count > 0) {
        newProfilesList.push({
          nom: profilName,
          nb: count,
          ajoute: false, // Ces profils viennent de la base de données
        });
      }
    });

    // Si aucun profil n'a été trouvé (cas improbable), garder les profils par défaut
    if (newProfilesList.length === 0) {
      console.log(
        "⚠️ Aucun profil avec effectif > 0, profils par défaut conservés"
      );
      return;
    }

    // Remplacer la liste des profils
    window.profilsDynList = newProfilesList;

    // Re-rendre les profils
    if (typeof renderProfilsDyn === "function") {
      renderProfilsDyn();
      console.log("✅ Profils mis à jour:", window.profilsDynList);

      // Utiliser la nouvelle fonction utilitaire pour forcer la mise à jour
      setTimeout(() => {
        if (typeof forceUpdateUsersCalculation === "function") {
          const success = forceUpdateUsersCalculation();
          if (!success) {
            console.warn("❌ Échec de la mise à jour forcée des utilisateurs");
          }
        } else {
          // Fallback vers l'ancienne méthode
          if (typeof updateTotals === "function") {
            updateTotals();
            console.log(
              "🔄 Totaux recalculés après mise à jour des profils (fallback)"
            );
          }
        }
      }, 150);
    }

    // Vérification de la cohérence des effectifs
    const totalProfiles = newProfilesList.reduce(
      (sum, profil) => sum + profil.nb,
      0
    );
    if (totalProfiles !== clientData.effectif) {
      console.warn(
        `⚠️ Incohérence détectée: Total profils (${totalProfiles}) ≠ Effectif TSV (${clientData.effectif})`
      );
    } else {
      console.log(
        `✅ Cohérence vérifiée: Total profils = Effectif TSV = ${totalProfiles}`
      );
    }
  }

  // =====================
  // Chargement des données commerciales
  // =====================
  async function loadCommercialDatabase() {
    try {
      const response = await fetch(
        "json/repartition_commerciale_par_departement_anonymized.json"
      );
      const data = await response.json();

      // Créer un map pour un accès rapide par département
      commercialDatabase = new Map();
      data.forEach((entry) => {
        commercialDatabase.set(entry.Département, entry);
      });

      console.log(
        `🏢 Base de données commerciale chargée: ${commercialDatabase.size} départements`
      );
    } catch (error) {
      console.error(
        "❌ Erreur lors du chargement de la base commerciale:",
        error
      );
      commercialDatabase = null;
    }
  }

  // =====================
  // Chargement des données de formation
  // =====================
  async function loadFormationDatabase() {
    try {
      const response = await fetch("json/equipe_formation.json");
      const data = await response.json();

      // Créer un map pour un accès rapide par département
      formationDatabase = new Map();
      data.forEach((entry) => {
        formationDatabase.set(entry.Departement, entry);
      });

      console.log(
        `👨‍🏫 Base de données formation chargée: ${formationDatabase.size} départements`
      );
    } catch (error) {
      console.error(
        "❌ Erreur lors du chargement de la base formation:",
        error
      );
      formationDatabase = null;
    }
  }

  // Fonction pour obtenir les données commerciales d'un département
  function getCommercialDataByDepartment(departement) {
    if (!commercialDatabase || !departement) return null;
    return commercialDatabase.get(departement);
  }

  // Fonction pour obtenir les données de formation d'un département
  function getFormationDataByDepartment(departement) {
    if (!formationDatabase || !departement) return null;
    return formationDatabase.get(departement);
  }

  // Fonction pour afficher l'équipe de formation
  function displayFormationTeam(clientData) {
    let formationDiv = document.getElementById("formation-team-info");

    if (!formationDiv) {
      // Créer la div après deployment-options ou après commercial si deployment n'existe pas
      let insertAfter = document.getElementById("deployment-options");
      if (!insertAfter) {
        insertAfter = document.getElementById("commercial-team-info");
      }

      if (!insertAfter) return;

      formationDiv = document.createElement("div");
      formationDiv.id = "formation-team-info";
      formationDiv.className = "formation-team-container";

      // Insérer après deployment-options ou commercial-team-container
      insertAfter.parentNode.insertBefore(
        formationDiv,
        insertAfter.nextSibling
      );
    }

    if (!clientData || !clientData.departement) {
      formationDiv.style.display = "none";
      return;
    }

    const formationData = getFormationDataByDepartment(clientData.departement);

    if (!formationData) {
      formationDiv.style.display = "none";
      return;
    }

    // Construire l'affichage des informations de formation
    let formatersHTML = "";
    Object.keys(formationData)
      .filter((key) => key.startsWith("Formateur_"))
      .forEach((key) => {
        const formateur = formationData[key];
        formatersHTML += `
          <div class="formation-item">
            <strong>${formateur.Prenom} ${formateur.Nom}</strong><br>
            <span class="formation-specialite">Spécialité: ${formateur.Specialite}</span><br>
            <a href="mailto:${formateur.Email}" class="formation-email">${formateur.Email}</a>
          </div>
        `;
      });

    formationDiv.innerHTML = `
      <div class="formation-team-content">
        <h4>👨‍🏫 Équipe formation - Zone ${formationData.Zone}</h4>
        <div class="formation-team-details">
          ${formatersHTML}
        </div>
      </div>
    `;

    formationDiv.style.display = "block";
  }

  // Fonction pour afficher les warnings et options CSM/Déploiement à distance
  function displayDeploymentOptions(clientData) {
    let optionsDiv = document.getElementById("deployment-options");

    if (!optionsDiv) {
      // Créer la div après commercial-team-info ou avant PARAMÉTRAGE si commercial n'existe pas
      let insertAfter = document.getElementById("commercial-team-info");

      if (!insertAfter) {
        // Si pas d'équipe commerciale, insérer avant PARAMÉTRAGE
        const parametrageSection = document.querySelector(
          '[id*="PARAMÉTRAGE"]'
        );
        if (!parametrageSection) return;

        optionsDiv = document.createElement("div");
        optionsDiv.id = "deployment-options";
        optionsDiv.className = "deployment-options-container";

        parametrageSection.parentNode.insertBefore(
          optionsDiv,
          parametrageSection
        );
      } else {
        // Insérer après l'équipe commerciale
        optionsDiv = document.createElement("div");
        optionsDiv.id = "deployment-options";
        optionsDiv.className = "deployment-options-container";

        insertAfter.parentNode.insertBefore(
          optionsDiv,
          insertAfter.nextSibling
        );
      }
    }

    const effectif = clientData
      ? clientData.effectif
      : parseInt(document.getElementById("effectif")?.value || "0");

    let optionsHTML = "";

    // Option déploiement à distance si effectif < 8
    if (effectif > 0 && effectif < 8) {
      optionsHTML += `
        <div class="deployment-option">
          <label class="deployment-option-label">
            <input type="radio" name="deployment-type" value="sur-site" checked>
            Formation sur site
          </label>
          <label class="deployment-option-label">
            <input type="radio" name="deployment-type" value="distance">
            Formation à distance
          </label>
        </div>
      `;
    }

    // Warning CSM si effectif > 20
    if (effectif > 20) {
      optionsHTML += `
        <div class="csm-warning">
          <span class="warning-icon">⚠️</span>
          <span class="warning-text">
            Effectif supérieur à 20 personnes - La présence d'un CSM (Customer Success Manager) peut être nécessaire.
          </span>
          <label class="csm-option">
            <input type="checkbox" id="csm-required"> Ajouter un CSM au déploiement
          </label>
        </div>
      `;
    }

    if (optionsHTML) {
      optionsDiv.innerHTML = `
        <div class="deployment-options-content">
          <h4>🚀 Options de déploiement</h4>
          ${optionsHTML}
        </div>
      `;
      optionsDiv.style.display = "block";
    } else {
      optionsDiv.style.display = "none";
    }
  }

  // Charger les bases de données au démarrage
  loadCommercialDatabase();
  loadFormationDatabase();

  // Ajouter un listener sur le champ effectif pour les options de déploiement
  const effectifInput = document.getElementById("effectif");
  if (effectifInput) {
    effectifInput.addEventListener("input", () => {
      displayDeploymentOptions(null);
    });
  }

  // =====================
  // Gestion de l'affectation intelligente des formateurs
  // =====================

  /**
   * Met à jour l'affectation des formateurs
   * @param {Object} clientData - Données du client
   */
  function updateTrainerAssignment(clientData) {
    const trainerAssignmentInstance = getTrainerAssignmentInstance();
    if (!trainerAssignmentInstance) {
      console.warn("⚠️ Module d'affectation des formateurs non disponible");
      return;
    }

    const logicielSelect = document.getElementById("logiciel");
    if (!logicielSelect || !logicielSelect.value) {
      hideTrainerAssignment();
      return;
    }

    // Attendre que le module soit initialisé
    if (!trainerAssignmentInstance.isLoaded) {
      setTimeout(() => updateTrainerAssignment(clientData), 500);
      return;
    }

    trainerAssignmentInstance.updateTrainerDisplay(
      clientData,
      logicielSelect.value
    );
  }

  /**
   * Masque l'affectation des formateurs
   */
  function hideTrainerAssignment() {
    const trainerAssignmentInstance = getTrainerAssignmentInstance();
    if (trainerAssignmentInstance) {
      trainerAssignmentInstance.hideTrainerDisplay();
    }
  }

  // Ajouter des listeners pour mettre à jour l'affectation lors des changements
  logicielSelect.addEventListener("change", () => {
    const clientName = clientInput.value;
    const clientData = findClientInDatabase(clientName);
    updateTrainerAssignment(clientData);
  });

  // Listener pour les changements de type de formation (sur site / à distance)
  document.addEventListener("change", (event) => {
    if (event.target.name === "deployment-type") {
      const clientName = clientInput.value;
      const clientData = findClientInDatabase(clientName);
      updateTrainerAssignment(clientData);
    }
  });
});

// Variables globales pour les bases de données
let commercialDatabase = null;
let formationDatabase = null;

// Fonction pour récupérer l'instance de TrainerAssignment
function getTrainerAssignmentInstance() {
  return window.trainerAssignmentInstance || null;
}

/**
 * Charge les données des formations logiciels depuis le JSON
 */
function loadFormationsLogiciels() {
  fetch("json/formations_logiciels.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log(
        "✅ Formations logiciels chargées:",
        data.formations.length,
        "formations"
      );
      window.formationsLogiciels = data.formations;
    })
    .catch((error) => {
      console.error(
        "❌ Erreur lors du chargement des formations logiciels:",
        error
      );
      window.formationsLogiciels = [];
    });
}

// Exposer les fonctions nécessaires dans le scope global
window.updateClientInfo = updateClientInfo;
window.updateTrainerAssignment = updateTrainerAssignment;
window.getTrainerAssignmentInstance = getTrainerAssignmentInstance;
window.loadFormationsLogiciels = loadFormationsLogiciels;
