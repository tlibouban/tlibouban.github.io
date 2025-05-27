/**
 * clientSearch.js - Module de recherche automatique de client
 * Permet de rechercher et auto-compléter le nom du client à partir du numéro de dossier
 */

class ClientSearch {
  constructor() {
    this.clientDatabase = new Map();
    this.isLoaded = false;
    this.isLoading = false;
    this.cache = new Map(); // Cache pour optimiser les recherches
    this.searchTimeout = null; // Pour debounce

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
      this.monitorClientField();
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

        // Stocker dans la Map principale
        this.clientDatabase.set(cleanNumero, cleanClient);

        // Créer des variantes pour la recherche flexible
        this.addSearchVariants(cleanNumero, cleanClient);
      }
    }
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
    console.log("🔍 updateClientField called:", {
      client,
      exactMatch,
      clientInput,
    });

    if (!clientInput || !client) {
      console.log("❌ Missing clientInput or client:", {
        clientInput: !!clientInput,
        client,
      });
      return;
    }

    // Nettoyer d'abord les classes existantes
    this.clearClientField(clientInput);

    // Mettre à jour la valeur du champ
    clientInput.value = client;
    console.log("✅ Client field value set to:", clientInput.value);
    console.log("📋 Field innerHTML:", clientInput.innerHTML);
    console.log("📋 Field outerHTML:", clientInput.outerHTML);

    // Appliquer les styles visuels appropriés
    const className = exactMatch ? "client-found" : "client-approximate";
    clientInput.classList.add(className);
    console.log("🎨 CSS class applied:", className);
    console.log("🎨 Current classList:", Array.from(clientInput.classList));

    // Vérifier les styles CSS appliqués
    const computedStyle = window.getComputedStyle(clientInput);
    console.log("🎨 Computed styles:", {
      backgroundColor: computedStyle.backgroundColor,
      color: computedStyle.color,
      borderColor: computedStyle.borderColor,
      value: clientInput.value,
      display: computedStyle.display,
      visibility: computedStyle.visibility,
      fontSize: computedStyle.fontSize,
      fontWeight: computedStyle.fontWeight,
      textShadow: computedStyle.textShadow,
    });

    // Test direct de la valeur
    console.log("🔧 Direct value check:", {
      value: clientInput.value,
      getAttribute: clientInput.getAttribute("value"),
      hasValue: !!clientInput.value,
      valueLength: clientInput.value.length,
    });

    // Forcer plusieurs fois la valeur
    setTimeout(() => {
      clientInput.value = client;
      clientInput.setAttribute("value", client);
      console.log("🔧 Forced value again:", clientInput.value);
    }, 100);

    // Déclencher l'événement input pour mettre à jour le titre
    const inputEvent = new Event("input", { bubbles: true });
    clientInput.dispatchEvent(inputEvent);
    console.log("📡 Input event dispatched for title update");

    // Forcer l'affichage
    clientInput.style.setProperty("display", "block", "important");
    console.log("🔧 Forced display style applied");

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

  /**
   * Surveille le champ client pour détecter les interférences
   */
  monitorClientField() {
    const clientInput = document.getElementById("client");
    if (!clientInput) return;

    // Observer les changements de valeur
    let lastValue = clientInput.value;
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "value"
        ) {
          console.log("🔍 Attribute 'value' changed:", {
            oldValue: mutation.oldValue,
            newValue: clientInput.getAttribute("value"),
            currentValue: clientInput.value,
          });
        }
      });
    });

    observer.observe(clientInput, {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ["value"],
    });

    // Observer les changements de propriété value
    setInterval(() => {
      if (clientInput.value !== lastValue) {
        console.log("🔍 Value property changed:", {
          from: lastValue,
          to: clientInput.value,
          stackTrace: new Error().stack,
        });
        lastValue = clientInput.value;
      }
    }, 100);

    // Observer les événements
    ["input", "change", "focus", "blur", "reset"].forEach((eventType) => {
      clientInput.addEventListener(eventType, (e) => {
        console.log(`🔍 Event '${eventType}' on client field:`, {
          value: clientInput.value,
          target: e.target,
          isTrusted: e.isTrusted,
        });
      });
    });

    console.log("🔍 Monitoring client field for interferences");
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
