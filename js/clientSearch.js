/**
 * clientSearch.js - Module de recherche automatique de client
 * Permet de rechercher et auto-compléter le nom du client à partir du numéro de dossier
 * ET recherche inversée : numéro à partir du nom du client avec autocomplétion
 */

class ClientSearch {
  constructor() {
    this.clientDatabase = new Map(); // numero -> client
    this.reverseDatabase = new Map(); // client -> [numeros]
    this.clientNames = []; // Liste triée des noms de clients pour autocomplétion
    this.isLoaded = false;
    this.isLoading = false;
    this.cache = new Map(); // Cache pour optimiser les recherches
    this.searchTimeout = null; // Pour debounce
    this.suggestionTimeout = null; // Pour debounce des suggestions
    this.currentSuggestions = [];
    this.selectedSuggestionIndex = -1;

    this.init();
  }

  /**
   * Initialise le module de recherche
   */
  async init() {
    try {
      await this.loadClientDatabase();
      this.setupEventListeners();
      this.addSearchIndicator();
      console.log("✅ Module de recherche client initialisé avec succès");
    } catch (error) {
      console.error(
        "❌ Erreur lors de l'initialisation du module de recherche client:",
        error
      );
      this.showError("Impossible de charger la base de données des clients");
    }
  }

  /**
   * Charge la base de données des clients depuis le fichier TSV
   */
  async loadClientDatabase() {
    if (this.isLoading || this.isLoaded) {
      return;
    }

    this.isLoading = true;

    try {
      const response = await fetch("csv/db_anonymized.tsv");
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const tsvContent = await response.text();
      this.parseClientData(tsvContent);
      this.isLoaded = true;

      console.log(
        `📊 Base de données chargée: ${this.clientDatabase.size} clients`
      );
    } catch (error) {
      console.error("Erreur lors du chargement du fichier TSV:", error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Parse le contenu TSV et construit la base de données
   * @param {string} tsvContent - Contenu du fichier TSV
   */
  parseClientData(tsvContent) {
    const lines = tsvContent.trim().split("\n");

    // Ignorer la première ligne (en-têtes)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const [numero, client] = line.split("\t");

      if (numero && client) {
        // Nettoyer et normaliser les données
        const cleanNumero = numero.trim();
        const cleanClient = client.trim();

        // Stocker dans la Map principale (numero -> client)
        this.clientDatabase.set(cleanNumero, cleanClient);

        // Stocker dans la Map inversée (client -> [numeros])
        if (!this.reverseDatabase.has(cleanClient)) {
          this.reverseDatabase.set(cleanClient, []);
        }
        this.reverseDatabase.get(cleanClient).push(cleanNumero);

        // Créer des variantes pour la recherche flexible
        this.addSearchVariants(cleanNumero, cleanClient);
      }
    }

    // Construire la liste triée des noms de clients pour autocomplétion
    this.clientNames = Array.from(this.reverseDatabase.keys()).sort();
  }

  /**
   * Ajoute des variantes de recherche pour plus de flexibilité
   * @param {string} numero - Numéro original
   * @param {string} client - Nom du client
   */
  addSearchVariants(numero, client) {
    // Ajouter des zéros en début si nécessaire (ex: 262 -> 0262, 00262)
    if (numero.length < 4) {
      const paddedNumero = numero.padStart(4, "0");
      this.clientDatabase.set(paddedNumero, client);
    }

    // Supprimer les zéros en début (ex: 0262 -> 262)
    const unPaddedNumero = numero.replace(/^0+/, "") || "0";
    if (unPaddedNumero !== numero) {
      this.clientDatabase.set(unPaddedNumero, client);
    }
  }

  /**
   * Configure les écouteurs d'événements
   */
  setupEventListeners() {
    const numeroInput = document.getElementById("numero-dossier");
    const clientInput = document.getElementById("client");

    if (!numeroInput || !clientInput) {
      console.warn("⚠️ Champs numéro de dossier ou client introuvables");
      return;
    }

    // ===== RECHERCHE DIRECTE (numéro -> client) =====
    // Écouteur sur le champ numéro avec debounce
    numeroInput.addEventListener("input", (event) => {
      this.debounceSearch(event.target.value, clientInput);
    });

    // Écouteur sur la perte de focus pour une recherche immédiate
    numeroInput.addEventListener("blur", (event) => {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }
      this.performSearch(event.target.value, clientInput);
    });

    // Écouteur sur Entrée pour recherche immédiate
    numeroInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        if (this.searchTimeout) {
          clearTimeout(this.searchTimeout);
        }
        this.performSearch(event.target.value, clientInput);
      }
    });

    // ===== RECHERCHE INVERSÉE (client -> numéro) =====
    // Écouteur sur le champ client pour autocomplétion
    clientInput.addEventListener("input", (event) => {
      this.debounceClientSuggestions(event.target.value, numeroInput);
    });

    // Écouteur pour navigation clavier dans les suggestions
    clientInput.addEventListener("keydown", (event) => {
      this.handleSuggestionNavigation(event, numeroInput);
    });

    // Écouteur sur la perte de focus pour fermer les suggestions
    clientInput.addEventListener("blur", (event) => {
      // Délai pour permettre le clic sur une suggestion
      setTimeout(() => {
        this.hideSuggestions();
      }, 200);
    });

    // Créer le conteneur de suggestions
    this.createSuggestionsContainer();
  }

  /**
   * Recherche avec délai (debounce) pour éviter trop de requêtes
   * @param {string} numero - Numéro à rechercher
   * @param {HTMLElement} clientInput - Champ client à remplir
   */
  debounceSearch(numero, clientInput) {
    // Annuler la recherche précédente
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Programmer une nouvelle recherche avec délai
    this.searchTimeout = setTimeout(() => {
      this.performSearch(numero, clientInput);
    }, 500); // Attendre 500ms après la dernière frappe
  }

  /**
   * Effectue la recherche du client
   * @param {string} numero - Numéro à rechercher
   * @param {HTMLElement} clientInput - Champ client à remplir
   */
  performSearch(numero, clientInput) {
    if (!numero || !this.isLoaded) {
      this.clearClientField(clientInput);
      return;
    }

    const cleanNumero = numero.trim();

    // Vérifier le cache d'abord
    if (this.cache.has(cleanNumero)) {
      const cachedResult = this.cache.get(cleanNumero);
      this.updateClientField(
        clientInput,
        cachedResult.client,
        cachedResult.found
      );
      return;
    }

    // Rechercher dans la base de données
    const client = this.clientDatabase.get(cleanNumero);

    if (client) {
      // Client trouvé
      this.cache.set(cleanNumero, { client, found: true });
      this.updateClientField(clientInput, client, true);
      this.showSuccess(`Client trouvé: ${client}`);
    } else {
      // Essayer une recherche approximative
      const approximateMatch = this.findApproximateMatch(cleanNumero);

      if (approximateMatch) {
        this.cache.set(cleanNumero, {
          client: approximateMatch.client,
          found: false,
        });
        this.updateClientField(clientInput, approximateMatch.client, false);
        this.showWarning(
          `Correspondance approximative trouvée: ${approximateMatch.client} (N° ${approximateMatch.numero})`
        );
      } else {
        this.cache.set(cleanNumero, { client: "", found: false });
        this.clearClientField(clientInput);
        this.showInfo(`Aucun client trouvé pour le N° ${cleanNumero}`);
      }
    }
  }

  /**
   * Recherche approximative si recherche exacte échoue
   * @param {string} numero - Numéro recherché
   * @returns {Object|null} - Résultat approximatif ou null
   */
  findApproximateMatch(numero) {
    // Recherche par préfixe/suffixe
    for (const [dbNumero, client] of this.clientDatabase.entries()) {
      if (dbNumero.includes(numero) || numero.includes(dbNumero)) {
        return { numero: dbNumero, client };
      }
    }

    return null;
  }

  /**
   * Met à jour le champ client avec le résultat trouvé
   */
  updateClientField(clientInput, client, exactMatch = true) {
    if (!clientInput || !client) {
      return;
    }

    // Nettoyer d'abord les classes existantes
    this.clearClientField(clientInput);

    // Mettre à jour la valeur du champ
    clientInput.value = client;

    // Appliquer les styles visuels appropriés
    const className = exactMatch ? "client-found" : "client-approximate";
    clientInput.classList.add(className);

    // Déclencher l'événement input pour mettre à jour le titre
    const inputEvent = new Event("input", { bubbles: true });
    clientInput.dispatchEvent(inputEvent);

    // Animation de confirmation
    if (exactMatch) {
      clientInput.classList.add("client-found-animation");
      setTimeout(() => {
        clientInput.classList.remove("client-found-animation");
      }, 600);
    }

    // Notification de succès
    const message = exactMatch
      ? `✅ Client trouvé : ${client}`
      : `🔍 Correspondance approximative : ${client}`;

    this.showSuccess(message);
  }

  /**
   * Vide le champ client
   * @param {HTMLElement} clientInput - Champ client
   */
  clearClientField(clientInput) {
    clientInput.value = "";
    clientInput.classList.remove(
      "client-found",
      "client-approximate",
      "client-not-found"
    );
  }

  /**
   * Ajoute un indicateur visuel de recherche
   */
  addSearchIndicator() {
    const numeroInput = document.getElementById("numero-dossier");
    if (!numeroInput) return;

    // Ajouter un conteneur pour l'icône de recherche
    const container = numeroInput.parentNode;
    if (!container.classList.contains("search-input-container")) {
      container.classList.add("search-input-container");

      const searchIcon = document.createElement("span");
      searchIcon.className = "search-icon";
      searchIcon.innerHTML = "🔍";
      searchIcon.setAttribute("aria-hidden", "true");
      container.appendChild(searchIcon);
    }
  }

  /**
   * Affiche un message de succès
   * @param {string} message - Message à afficher
   */
  showSuccess(message) {
    this.showNotification(message, "success");
  }

  /**
   * Affiche un message d'avertissement
   * @param {string} message - Message à afficher
   */
  showWarning(message) {
    this.showNotification(message, "warning");
  }

  /**
   * Affiche un message d'information
   * @param {string} message - Message à afficher
   */
  showInfo(message) {
    this.showNotification(message, "info");
  }

  /**
   * Affiche un message d'erreur
   * @param {string} message - Message à afficher
   */
  showError(message) {
    this.showNotification(message, "error");
  }

  /**
   * Affiche une notification temporaire
   * @param {string} message - Message à afficher
   * @param {string} type - Type de notification (success, warning, info, error)
   */
  showNotification(message, type = "info") {
    // Supprimer les notifications existantes
    const existingNotifications = document.querySelectorAll(
      ".client-search-notification"
    );
    existingNotifications.forEach((notification) => notification.remove());

    // Créer la nouvelle notification
    const notification = document.createElement("div");
    notification.className = `client-search-notification notification-${type}`;
    notification.textContent = message;

    // Ajouter au DOM
    const container = document.querySelector(".scenario-row") || document.body;
    container.appendChild(notification);

    // Animation d'apparition
    setTimeout(() => notification.classList.add("show"), 10);

    // Supprimer après 4 secondes
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  /**
   * Retourne les statistiques de la base de données
   * @returns {Object} - Statistiques
   */
  getStats() {
    return {
      totalClients: this.clientDatabase.size,
      isLoaded: this.isLoaded,
      cacheSize: this.cache.size,
    };
  }

  /**
   * Recherche manuelle par numéro (pour usage externe)
   * @param {string} numero - Numéro à rechercher
   * @returns {string|null} - Nom du client ou null
   */
  searchClient(numero) {
    if (!this.isLoaded || !numero) {
      return null;
    }

    return this.clientDatabase.get(numero.trim()) || null;
  }

  /**
   * Vide le cache
   */
  clearCache() {
    this.cache.clear();
    console.log("🗑️ Cache de recherche client vidé");
  }

  // ===== RECHERCHE INVERSÉE ET AUTOCOMPLÉTION =====

  /**
   * Recherche avec délai pour les suggestions de clients
   * @param {string} query - Texte recherché
   * @param {HTMLElement} numeroInput - Champ numéro à remplir
   */
  debounceClientSuggestions(query, numeroInput) {
    // Annuler la recherche précédente
    if (this.suggestionTimeout) {
      clearTimeout(this.suggestionTimeout);
    }

    // Programmer une nouvelle recherche avec délai
    this.suggestionTimeout = setTimeout(() => {
      this.performClientSuggestions(query, numeroInput);
    }, 300); // Délai plus court pour les suggestions
  }

  /**
   * Effectue la recherche de suggestions de clients
   * @param {string} query - Texte recherché
   * @param {HTMLElement} numeroInput - Champ numéro à remplir
   */
  performClientSuggestions(query, numeroInput) {
    if (!query || query.length < 2) {
      this.hideSuggestions();
      return;
    }

    const cleanQuery = query.trim().toLowerCase();
    const suggestions = this.findClientSuggestions(cleanQuery);

    if (suggestions.length > 0) {
      this.showSuggestions(suggestions, numeroInput);
    } else {
      this.hideSuggestions();
    }
  }

  /**
   * Trouve les suggestions de clients basées sur la requête
   * @param {string} query - Texte recherché (en minuscules)
   * @returns {Array} - Liste des suggestions
   */
  findClientSuggestions(query) {
    const suggestions = [];
    const maxSuggestions = 8;

    // Recherche exacte au début
    for (const clientName of this.clientNames) {
      if (clientName.toLowerCase().startsWith(query)) {
        suggestions.push({
          name: clientName,
          numbers: this.reverseDatabase.get(clientName),
          type: "exact",
        });
        if (suggestions.length >= maxSuggestions) break;
      }
    }

    // Si pas assez de résultats, recherche contenant
    if (suggestions.length < maxSuggestions) {
      for (const clientName of this.clientNames) {
        if (
          clientName.toLowerCase().includes(query) &&
          !suggestions.some((s) => s.name === clientName)
        ) {
          suggestions.push({
            name: clientName,
            numbers: this.reverseDatabase.get(clientName),
            type: "partial",
          });
          if (suggestions.length >= maxSuggestions) break;
        }
      }
    }

    return suggestions;
  }

  /**
   * Crée le conteneur de suggestions
   */
  createSuggestionsContainer() {
    const clientInput = document.getElementById("client");
    if (!clientInput) return;

    const container = document.createElement("div");
    container.id = "client-suggestions";
    container.className = "client-suggestions-container";

    // Insérer après le champ client
    clientInput.parentNode.insertBefore(container, clientInput.nextSibling);
  }

  /**
   * Affiche les suggestions
   * @param {Array} suggestions - Liste des suggestions
   * @param {HTMLElement} numeroInput - Champ numéro
   */
  showSuggestions(suggestions, numeroInput) {
    const container = document.getElementById("client-suggestions");
    if (!container) return;

    this.currentSuggestions = suggestions;
    this.selectedSuggestionIndex = -1;

    container.innerHTML = "";
    container.style.display = "block";

    suggestions.forEach((suggestion, index) => {
      const item = document.createElement("div");
      item.className = "suggestion-item";
      item.innerHTML = `
        <div class="suggestion-name">${this.highlightMatch(
          suggestion.name
        )}</div>
        <div class="suggestion-numbers">${
          suggestion.numbers.length
        } dossier(s): ${suggestion.numbers.slice(0, 3).join(", ")}${
        suggestion.numbers.length > 3 ? "..." : ""
      }</div>
      `;

      item.addEventListener("click", () => {
        this.selectSuggestion(suggestion, numeroInput);
      });

      container.appendChild(item);
    });
  }

  /**
   * Surligne la correspondance dans le nom
   * @param {string} name - Nom du client
   * @returns {string} - Nom avec surlignage
   */
  highlightMatch(name) {
    const clientInput = document.getElementById("client");
    const query = clientInput.value.trim();

    if (!query) return name;

    const regex = new RegExp(`(${query})`, "gi");
    return name.replace(regex, "<strong>$1</strong>");
  }

  /**
   * Sélectionne une suggestion
   * @param {Object} suggestion - Suggestion sélectionnée
   * @param {HTMLElement} numeroInput - Champ numéro
   */
  selectSuggestion(suggestion, numeroInput) {
    const clientInput = document.getElementById("client");

    // Remplir le champ client
    clientInput.value = suggestion.name;

    // Remplir le champ numéro avec le premier dossier
    if (suggestion.numbers.length > 0) {
      numeroInput.value = suggestion.numbers[0];

      // Appliquer les styles de succès
      clientInput.classList.remove("client-approximate", "client-not-found");
      clientInput.classList.add("client-found");

      // Notification
      const message =
        suggestion.numbers.length === 1
          ? `✅ Client trouvé : ${suggestion.name} (N° ${suggestion.numbers[0]})`
          : `✅ Client trouvé : ${suggestion.name} (${suggestion.numbers.length} dossiers, N° ${suggestion.numbers[0]} sélectionné)`;

      this.showSuccess(message);

      // Déclencher l'événement pour la mise à jour du titre
      const inputEvent = new Event("input", { bubbles: true });
      clientInput.dispatchEvent(inputEvent);
    }

    this.hideSuggestions();
  }

  /**
   * Gère la navigation clavier dans les suggestions
   * @param {KeyboardEvent} event - Événement clavier
   * @param {HTMLElement} numeroInput - Champ numéro
   */
  handleSuggestionNavigation(event, numeroInput) {
    const container = document.getElementById("client-suggestions");
    if (!container || container.style.display === "none") return;

    const items = container.querySelectorAll(".suggestion-item");

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        this.selectedSuggestionIndex = Math.min(
          this.selectedSuggestionIndex + 1,
          this.currentSuggestions.length - 1
        );
        this.updateSuggestionSelection(items);
        break;

      case "ArrowUp":
        event.preventDefault();
        this.selectedSuggestionIndex = Math.max(
          this.selectedSuggestionIndex - 1,
          -1
        );
        this.updateSuggestionSelection(items);
        break;

      case "Enter":
        event.preventDefault();
        if (this.selectedSuggestionIndex >= 0) {
          this.selectSuggestion(
            this.currentSuggestions[this.selectedSuggestionIndex],
            numeroInput
          );
        }
        break;

      case "Escape":
        this.hideSuggestions();
        break;
    }
  }

  /**
   * Met à jour la sélection visuelle des suggestions
   * @param {NodeList} items - Éléments de suggestion
   */
  updateSuggestionSelection(items) {
    items.forEach((item, index) => {
      if (index === this.selectedSuggestionIndex) {
        item.classList.add("selected");
      } else {
        item.classList.remove("selected");
      }
    });
  }

  /**
   * Cache les suggestions
   */
  hideSuggestions() {
    const container = document.getElementById("client-suggestions");
    if (container) {
      container.style.display = "none";
      container.innerHTML = "";
    }
    this.currentSuggestions = [];
    this.selectedSuggestionIndex = -1;
  }
}

// Initialisation globale
let clientSearchInstance = null;

// Fonction d'initialisation à appeler quand le DOM est prêt
function initClientSearch() {
  if (!clientSearchInstance) {
    clientSearchInstance = new ClientSearch();
  }
  return clientSearchInstance;
}

// Auto-initialisation si le DOM est déjà prêt
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initClientSearch);
} else {
  initClientSearch();
}

// Export pour usage externe
window.ClientSearch = ClientSearch;
window.getClientSearchInstance = () => clientSearchInstance;
