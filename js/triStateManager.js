/**
 * triStateManager.js - Gestion des switches tri-state
 * États : rouge (non examiné) → bleu croix (écarté) → vert (activé)
 */

// Variables globales pour les compteurs
let triStateCounters = {
  notExamined: 0,
  rejected: 0,
  activated: 0,
};

// Variable pour gérer l'état réduit/étendu de la boîte flottante
let isFloatingStatsMinimized = false;

/**
 * Génère un switch tri-state pour remplacer les switches binaires
 * @param {string} id - ID unique pour le switch
 * @param {string} name - Nom du champ
 * @param {string} initialState - État initial (not-examined, rejected, activated)
 * @param {string} ariaLabel - Label d'accessibilité
 * @param {string} cssClass - Classe CSS additionnelle
 * @returns {string} HTML du switch tri-state
 */
function renderTriStateSwitch(
  id,
  name,
  initialState = "not-examined",
  ariaLabel = "",
  cssClass = "check-feature"
) {
  const stateClasses = {
    "not-examined": "",
    rejected: "rejected",
    activated: "activated",
  };

  const stateClass = stateClasses[initialState] || "";

  return `
        <div class="tri-state-modern-container">
            <div class="tri-state-modern-switch ${stateClass}" 
                 data-id="${id}"
                 data-name="${name}"
                 data-state="${initialState}"
                 data-css-class="${cssClass}"
                 aria-label="${ariaLabel}"
                 tabindex="0"
                 role="button">
                <div class="tri-state-tick-mark"></div>
                <span class="cross-icon">❌</span>
            </div>
        </div>
    `;
}

/**
 * Cycle entre les états du switch tri-state
 * @param {HTMLElement} element - Élément du switch
 */
function cycleTriState(element) {
  const currentState = element.getAttribute("data-state");
  let newState;

  // Cycle : non examiné → écarté → activé → non examiné
  switch (currentState) {
    case "not-examined":
      newState = "rejected";
      break;
    case "rejected":
      newState = "activated";
      break;
    case "activated":
      newState = "not-examined";
      break;
    default:
      newState = "not-examined";
  }

  // Mettre à jour l'état
  setTriStateState(element, newState);

  // Mettre à jour les totaux
  if (typeof updateTotals === "function") {
    updateTotals();
  }
  updateTriStateCounters();
}

/**
 * Définit l'état d'un switch tri-state
 * @param {HTMLElement} element - Élément du switch
 * @param {string} state - Nouvel état
 */
function setTriStateState(element, state) {
  // Supprimer toutes les classes d'état
  element.classList.remove("rejected", "activated");

  // Ajouter la nouvelle classe d'état
  if (state !== "not-examined") {
    element.classList.add(state);
  }

  // Mettre à jour l'attribut data-state
  element.setAttribute("data-state", state);
}

/**
 * Obtient l'état d'un switch tri-state
 * @param {HTMLElement} element - Élément du switch
 * @returns {string} État actuel
 */
function getTriStateState(element) {
  return element.getAttribute("data-state") || "not-examined";
}

/**
 * Vérifie si un switch tri-state est activé (pour les calculs)
 * @param {HTMLElement} element - Élément du switch
 * @returns {boolean} True si activé
 */
function isTriStateActivated(element) {
  return getTriStateState(element) === "activated";
}

/**
 * Met à jour les compteurs tri-state
 */
function updateTriStateCounters() {
  // Réinitialiser les compteurs
  triStateCounters = {
    notExamined: 0,
    rejected: 0,
    activated: 0,
  };

  // Compter tous les switches tri-state
  document.querySelectorAll(".tri-state-modern-switch").forEach((sw) => {
    const state = getTriStateState(sw);
    switch (state) {
      case "not-examined":
        triStateCounters.notExamined++;
        break;
      case "rejected":
        triStateCounters.rejected++;
        break;
      case "activated":
        triStateCounters.activated++;
        break;
    }
  });

  // Mettre à jour l'affichage
  updateFloatingStatsDisplay();
}

/**
 * Met à jour l'affichage de la boîte flottante
 */
function updateFloatingStatsDisplay() {
  const elements = {
    "floating-count-not-examined": triStateCounters.notExamined,
    "floating-count-rejected": triStateCounters.rejected,
    "floating-count-activated": triStateCounters.activated,
  };

  Object.entries(elements).forEach(([id, count]) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = count;
    }
  });
}

/**
 * Bascule entre le mode réduit et étendu de la boîte flottante
 */
function toggleFloatingStatsMode() {
  isFloatingStatsMinimized = !isFloatingStatsMinimized;
  const floatingStats = document.getElementById("floating-stats");
  const toggleBtn = document.getElementById("floating-toggle-btn");

  if (floatingStats && toggleBtn) {
    floatingStats.classList.toggle("minimized", isFloatingStatsMinimized);
    toggleBtn.textContent = isFloatingStatsMinimized ? "📊" : "➖";
    toggleBtn.title = isFloatingStatsMinimized
      ? "Étendre la boîte"
      : "Réduire la boîte";
  }
}

/**
 * Crée la boîte flottante des compteurs - Version simple et compacte
 */
function createFloatingStats() {
  const floatingHTML = `
        <div class="floating-stats" id="floating-stats">
            <div class="floating-header">
                <h3>📊 Compteur</h3>
                <button class="floating-toggle-btn" id="floating-toggle-btn" title="Réduire la boîte">➖</button>
            </div>

            <div class="floating-content">
                <div class="floating-stat-item floating-stat-not-examined">
                    <span>❓</span>
                    <span class="floating-stat-number" id="floating-count-not-examined">0</span>
                </div>

                <div class="floating-stat-item floating-stat-rejected">
                    <span>❌</span>
                    <span class="floating-stat-number" id="floating-count-rejected">0</span>
                </div>

                <div class="floating-stat-item floating-stat-activated">
                    <span>✅</span>
                    <span class="floating-stat-number" id="floating-count-activated">0</span>
                </div>
            </div>
        </div>
    `;

  // Ajouter au body
  document.body.insertAdjacentHTML("beforeend", floatingHTML);

  // Ajouter les styles CSS directement
  const styles = `
    <style>
    .floating-stats {
        position: fixed;
        right: 6rem;
        top: 42rem;
        transform: translateY(-50%);
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        padding: 15px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        border: 2px solid #e8f4fd;
        z-index: 1000;
        min-width: 115px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        transition: all 0.3s ease;
    }
    
    .floating-stats.minimized {
        min-width: 60px;
        padding: 8px;
    }
    
    .floating-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
    }
    
    .floating-stats.minimized .floating-header {
        margin-bottom: 0;
        justify-content: center;
    }
    
    .floating-stats h3 {
        margin: 0;
        font-size: 14px;
        color: #2c3e50;
        font-weight: 600;
    }
    
    .floating-stats.minimized h3 {
        display: none;
    }
    
    .floating-toggle-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 12px;
        padding: 2px;
        border-radius: 4px;
        transition: background-color 0.2s ease;
    }
    
    .floating-toggle-btn:hover {
        background: rgba(52, 152, 219, 0.1);
    }
    
    .floating-content {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    
    .floating-stats.minimized .floating-content {
        flex-direction: column;
        gap: 4px;
    }
    
    .floating-stat-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 0;
    }
    
    .floating-stats.minimized .floating-stat-item {
        justify-content: center;
        gap: 6px;
    }
    
    .floating-stat-item span:first-child {
        font-size: 16px;
    }
    
    .floating-stats.minimized .floating-stat-item span:first-child {
        font-size: 14px;
    }
    
    .floating-stat-number {
        font-size: 16px;
        font-weight: 700;
        color: #2c3e50;
        min-width: 20px;
        text-align: center;
    }
    
    .floating-stats.minimized .floating-stat-number {
        font-size: 12px;
        font-weight: 600;
        min-width: 16px;
    }
    
    /* Couleurs pour les différents états en mode réduit */
    .floating-stats.minimized .floating-stat-not-examined {
        color: #e74c3c;
    }
    
    .floating-stats.minimized .floating-stat-rejected {
        color: #3498db;
    }
    
    .floating-stats.minimized .floating-stat-activated {
        color: #27ae60;
    }
    
    @media (max-width: 768px) {
        .floating-stats {
            right: 1rem;
            top: 35rem;
        }
    }
    </style>
  `;

  // Ajouter les styles au head
  document.head.insertAdjacentHTML("beforeend", styles);

  // Attacher l'event listener pour le bouton toggle
  const toggleBtn = document.getElementById("floating-toggle-btn");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", toggleFloatingStatsMode);
  }
}

/**
 * Attache les event listeners aux switches tri-state
 */
function attachTriStateListeners() {
  // Supprimer les anciens listeners pour éviter les doublons
  document.removeEventListener("click", handleTriStateClick);
  document.removeEventListener("keydown", handleTriStateKeydown);

  // Ajouter les nouveaux listeners
  document.addEventListener("click", handleTriStateClick);
  document.addEventListener("keydown", handleTriStateKeydown);
}

/**
 * Gestion des clics sur les switches tri-state
 */
function handleTriStateClick(event) {
  if (event.target.closest(".tri-state-modern-switch")) {
    const switchElement = event.target.closest(".tri-state-modern-switch");
    cycleTriState(switchElement);
  }
}

/**
 * Gestion du clavier pour l'accessibilité
 */
function handleTriStateKeydown(event) {
  if (event.target.classList.contains("tri-state-modern-switch")) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      cycleTriState(event.target);
    }
  }
}

/**
 * Initialisation du système tri-state
 */
function initTriStateSystem() {
  console.log("🎯 Initialisation du système tri-state...");

  // Créer la boîte flottante
  createFloatingStats();

  // Attacher les gestionnaires d'événements
  attachTriStateListeners();

  // Compter initial
  updateTriStateCounters();

  console.log("🎯 Système tri-state initialisé");
}

/**
 * Fonction pour réattacher les listeners après un nouveau rendu
 */
function reinitTriStateListeners() {
  attachTriStateListeners();
  updateTriStateCounters();
}

// Exposer les fonctions globalement pour compatibilité
window.cycleTriState = cycleTriState;
window.renderTriStateSwitch = renderTriStateSwitch;
window.setTriStateState = setTriStateState;
window.getTriStateState = getTriStateState;
window.isTriStateActivated = isTriStateActivated;
window.updateTriStateCounters = updateTriStateCounters;
window.toggleFloatingStatsMode = toggleFloatingStatsMode;
window.initTriStateSystem = initTriStateSystem;
window.reinitTriStateListeners = reinitTriStateListeners;

// Initialiser dès que le DOM est prêt
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTriStateSystem);
} else {
  initTriStateSystem();
}
