/**
 * main.js - Script principal
 * Initialisation de l'application et attachement des événements
 */

document.addEventListener("DOMContentLoaded", function () {
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
  let clientDatabase = null;

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
          const [numero, nom, type, erp, effectif] = line.split("\t");
          if (nom && type && erp) {
            clientDatabase.push({
              numero: numero,
              nom: nom.trim(),
              type: type.trim(), // "Prospect" ou "Client"
              erp: erp.trim(), // Logiciel utilisé
              effectif: effectif ? parseInt(effectif.trim()) : 0,
            });
          }
        }
      }
      console.log(
        `📊 Base de données client chargée: ${clientDatabase.length} entrées`
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

  // Fonction pour mettre à jour les options selon le client
  function updateOptionsBasedOnClient() {
    const clientName = clientInput.value;
    const clientData = findClientInDatabase(clientName);

    if (clientData) {
      console.log(
        `🔍 Client trouvé: ${clientData.nom} (${clientData.type}) - ERP: ${clientData.erp}`
      );

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
    } else {
      // Client non trouvé : options standard
      updateProjetOptionsStandard();
      updateLogicielOptionsStandard();
    }

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

    // Si un logiciel de base est sélectionné (AIR ou NEO), ne garder que les options qui commencent par ce logiciel
    if (["AIR", "NEO"].includes(logicielSelect.value)) {
      const prefix = logicielSelect.value.toUpperCase();
      options = options.filter((opt) =>
        opt.label.toUpperCase().startsWith(prefix)
      );
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
      mainTitle.textContent = `Checklist du déploiement du cabinet ${val}`;
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
});
