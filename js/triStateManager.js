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
 * Crée la boîte flottante des compteurs
 */
function createFloatingStats() {
  const floatingHTML = `
        <div class="floating-stats" id="floating-stats">
            <h3>📊 Fonctionnalités</h3>
            
            <div class="floating-stat-item floating-stat-not-examined">
                <span>❓ Non examinées</span>
                <span class="floating-stat-number" id="floating-count-not-examined">0</span>
            </div>
            
            <div class="floating-stat-item floating-stat-rejected">
                <span>❌ Écartées</span>
                <span class="floating-stat-number" id="floating-count-rejected">0</span>
            </div>
            
            <div class="floating-stat-item floating-stat-activated">
                <span>✅ Activées</span>
                <span class="floating-stat-number" id="floating-count-activated">0</span>
            </div>
            
            <div class="floating-controls">
                <button class="floating-btn" id="bulk-reset-btn" title="Marquer tout comme non examiné">
                    🔄 Reset
                </button>
                <button class="floating-btn" id="bulk-activate-btn" title="Activer toutes les fonctionnalités écartées">
                    ✅ Activer écartées
                </button>
            </div>
        </div>
    `;

  // Ajouter au body
  document.body.insertAdjacentHTML("beforeend", floatingHTML);

  // Attacher les event listeners pour les boutons de masse
  const resetBtn = document.getElementById("bulk-reset-btn");
  const activateBtn = document.getElementById("bulk-activate-btn");

  if (resetBtn) {
    resetBtn.addEventListener("click", bulkSetTriStateNotExamined);
  }

  if (activateBtn) {
    activateBtn.addEventListener("click", bulkSetTriStateActivated);
  }
}

/**
 * Actions en lot pour les switches tri-state
 */
function bulkSetTriStateNotExamined() {
  document.querySelectorAll(".tri-state-modern-switch").forEach((sw) => {
    setTriStateState(sw, "not-examined");
  });
  if (typeof updateTotals === "function") {
    updateTotals();
  }
  updateTriStateCounters();
}

function bulkSetTriStateActivated() {
  document.querySelectorAll(".tri-state-modern-switch").forEach((sw) => {
    const currentState = getTriStateState(sw);
    if (currentState === "rejected") {
      setTriStateState(sw, "activated");
    }
  });
  if (typeof updateTotals === "function") {
    updateTotals();
  }
  updateTriStateCounters();
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
window.bulkSetTriStateNotExamined = bulkSetTriStateNotExamined;
window.bulkSetTriStateActivated = bulkSetTriStateActivated;
window.initTriStateSystem = initTriStateSystem;
window.reinitTriStateListeners = reinitTriStateListeners;

// Initialiser dès que le DOM est prêt
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTriStateSystem);
} else {
  initTriStateSystem();
}
