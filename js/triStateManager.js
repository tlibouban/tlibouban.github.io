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

// Variables pour le filtrage
let activeTriStateFilter = null; // null = tous, 'not-examined', 'rejected', 'activated'

/*
 * Ancien système de compteur flottant - DÉSACTIVÉ
 * Remplacé par compteurs intégrés dans les boutons de filtre
 */

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
 * Cycle entre les états du switch tri-state selon le bouton de la souris
 * @param {HTMLElement} element - Élément du switch
 * @param {string} clickType - Type de clic ('left' ou 'right')
 */
function cycleTriState(element, clickType = "left") {
  const currentState = element.getAttribute("data-state");
  let newState;

  if (clickType === "right") {
    // Clic droit : Cycle Non-examinée ↔ Refusée
    switch (currentState) {
      case "not-examined":
        newState = "rejected";
        break;
      case "rejected":
        newState = "not-examined";
        break;
      case "activated":
        // Si on était en activé et qu'on fait clic droit, on va vers refusé
        newState = "rejected";
        break;
      default:
        newState = "not-examined";
    }
  } else {
    // Clic gauche : Cycle Non-examinée ↔ Activée
    switch (currentState) {
      case "not-examined":
        newState = "activated";
        break;
      case "activated":
        newState = "not-examined";
        break;
      case "rejected":
        // Si on était en refusé et qu'on fait clic gauche, on va vers activé
        newState = "activated";
        break;
      default:
        newState = "not-examined";
    }
  }

  // Mettre à jour l'état
  setTriStateState(element, newState);

  // NEW: Afficher ou masquer le lien « Interface comptable » si concerné
  const parentRow = element.closest("tr");
  if (parentRow) {
    const featureCell = parentRow.querySelector("td:nth-child(2)");
    const isInterfaceComptable =
      featureCell &&
      featureCell.textContent.toLowerCase().includes("interface comptable");
    if (isInterfaceComptable) {
      let specialLink = parentRow.querySelector(".interface-comptable-link");
      if (!specialLink) {
        // Créer le lien si absent
        specialLink = document.createElement("a");
        specialLink.href = "https://optimexco.onrender.com/";
        specialLink.target = "_blank";
        specialLink.className = "interface-comptable-link action-btn";
        specialLink.style.marginLeft = "10px";
        specialLink.textContent = "Questionnaire Export Compta";
        featureCell.appendChild(specialLink);
      }
      specialLink.style.display =
        newState === "activated" ? "inline-flex" : "none";
    }
  }

  // Mettre à jour les totaux (qui inclut maintenant updateFormationMontants)
  if (typeof updateTotals === "function") {
    updateTotals();
  }

  updateTriStateCounters();

  // Réappliquer le filtre actif s'il y en a un
  if (activeTriStateFilter !== null) {
    applyTriStateFilter(activeTriStateFilter);
  }
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

  // Mettre à jour l'affichage dans les boutons de filtre
  updateFilterButtonCounters();
}

/**
 * Met à jour les compteurs dans les boutons de filtre
 */
function updateFilterButtonCounters() {
  const countElements = {
    "count-not-examined": triStateCounters.notExamined,
    "count-rejected": triStateCounters.rejected,
    "count-activated": triStateCounters.activated,
  };

  Object.entries(countElements).forEach(([id, count]) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = `(${count})`;
    }
  });
}

/**
 * Applique le filtre tri-state aux éléments
 * @param {string|null} filterState - État à filtrer ('not-examined', 'rejected', 'activated', null pour tous)
 */
function applyTriStateFilter(filterState) {
  activeTriStateFilter = filterState;

  // Trouver toutes les lignes qui contiennent des switches tri-state
  const rows = document.querySelectorAll("tr:has(.tri-state-modern-switch)");

  // Si le navigateur ne supporte pas :has(), utiliser une approche alternative
  if (rows.length === 0) {
    // Méthode alternative pour les navigateurs sans support :has()
    const allRows = document.querySelectorAll("tr");
    allRows.forEach((row) => {
      const switch_ = row.querySelector(".tri-state-modern-switch");
      if (switch_) {
        applyFilterToRow(row, switch_, filterState);
      }
    });
  } else {
    // Méthode moderne avec :has()
    rows.forEach((row) => {
      const switch_ = row.querySelector(".tri-state-modern-switch");
      applyFilterToRow(row, switch_, filterState);
    });
  }

  // Mettre à jour l'apparence des boutons de filtre
  updateTriStateFilterButtons();
}

/**
 * Applique le filtre à une ligne spécifique
 * @param {HTMLElement} row - La ligne de tableau
 * @param {HTMLElement} switch_ - Le switch tri-state
 * @param {string|null} filterState - État du filtre
 */
function applyFilterToRow(row, switch_, filterState) {
  if (!switch_) return;

  const switchState = getTriStateState(switch_);

  if (filterState === null) {
    // Afficher tous les éléments
    row.style.display = "";
  } else {
    // Afficher seulement les éléments correspondant au filtre
    if (switchState === filterState) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  }
}

/**
 * Met à jour l'apparence des boutons de filtre tri-state
 */
function updateTriStateFilterButtons() {
  const filterButtons = document.querySelectorAll(".tri-state-filter-btn");

  filterButtons.forEach((button) => {
    const buttonState = button.getAttribute("data-state");

    if (activeTriStateFilter === buttonState) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });
}

/**
 * Gestion des clics sur les boutons de filtre tri-state
 * @param {Event} event - Événement de clic
 */
function handleTriStateFilterClick(event) {
  if (event.target.closest(".tri-state-filter-btn")) {
    const button = event.target.closest(".tri-state-filter-btn");
    const filterState = button.getAttribute("data-state");

    // Si le bouton est déjà actif, désactiver le filtre
    if (activeTriStateFilter === filterState) {
      applyTriStateFilter(null);
    } else {
      applyTriStateFilter(filterState);
    }
  }
}

/**
 * Réinitialise tous les filtres tri-state
 */
function resetTriStateFilters() {
  applyTriStateFilter(null);
}

/**
 * Attache les event listeners aux switches tri-state
 */
function attachTriStateListeners() {
  // Supprimer les anciens listeners pour éviter les doublons
  document.removeEventListener("click", handleTriStateClick);
  document.removeEventListener("contextmenu", handleTriStateRightClick);
  document.removeEventListener("keydown", handleTriStateKeydown);
  document.removeEventListener("click", handleTriStateFilterClick);

  // Ajouter les nouveaux listeners
  document.addEventListener("click", handleTriStateClick);
  document.addEventListener("contextmenu", handleTriStateRightClick);
  document.addEventListener("keydown", handleTriStateKeydown);
  document.addEventListener("click", handleTriStateFilterClick);
}

/**
 * Gestion des clics gauche sur les switches tri-state
 */
function handleTriStateClick(event) {
  if (event.target.closest(".tri-state-modern-switch")) {
    const switchElement = event.target.closest(".tri-state-modern-switch");
    cycleTriState(switchElement, "left");
  }
}

/**
 * Gestion des clics droit sur les switches tri-state
 */
function handleTriStateRightClick(event) {
  if (event.target.closest(".tri-state-modern-switch")) {
    event.preventDefault(); // Empêcher l'apparition du menu contextuel
    const switchElement = event.target.closest(".tri-state-modern-switch");
    cycleTriState(switchElement, "right");
  }
}

/**
 * Gestion du clavier pour l'accessibilité
 */
function handleTriStateKeydown(event) {
  if (event.target.classList.contains("tri-state-modern-switch")) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      cycleTriState(event.target, "left"); // Entrée/Espace = clic gauche
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      cycleTriState(event.target, "right"); // Delete/Backspace = clic droit
    }
  }
}

/**
 * Initialisation du système tri-state
 */
function initTriStateSystem() {
  console.log("🎯 Initialisation du système tri-state...");

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
window.initTriStateSystem = initTriStateSystem;
window.reinitTriStateListeners = reinitTriStateListeners;
window.applyTriStateFilter = applyTriStateFilter;
window.resetTriStateFilters = resetTriStateFilters;

// Initialiser dès que le DOM est prêt
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTriStateSystem);
} else {
  initTriStateSystem();
}

/*
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

  // Insertion du CSS
  document.head.insertAdjacentHTML("beforeend", styles);

  // Écouter les clics sur le bouton de bascule
  const toggleBtn = document.getElementById("floating-toggle-btn");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", toggleFloatingStatsMode);
  }
}
*/
