/**
 * Mobile Alternative View
 * Transforme les tableaux en cartes responsives pour mobile
 * Inspiré des meilleures pratiques UX mobile
 */

class MobileAlternative {
  constructor() {
    this.isMobile = this.checkIfMobile();
    this.init();
  }

  checkIfMobile() {
    return window.innerWidth < 768; // Correspond au breakpoint md
  }

  init() {
    this.handleResize();
    window.addEventListener("resize", () => this.handleResize());

    // Observer pour les tableaux ajoutés dynamiquement
    this.observeTableChanges();
  }

  handleResize() {
    const newIsMobile = this.checkIfMobile();
    if (newIsMobile !== this.isMobile) {
      this.isMobile = newIsMobile;
      this.transformTables();
    }
  }

  observeTableChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          const addedTables = Array.from(mutation.addedNodes)
            .filter((node) => node.nodeType === Node.ELEMENT_NODE)
            .flatMap((node) => [
              ...(node.matches?.(".checklist-table") ? [node] : []),
              ...Array.from(node.querySelectorAll?.(".checklist-table") || []),
            ]);

          if (addedTables.length > 0 && this.isMobile) {
            addedTables.forEach((table) => this.transformTableToCards(table));
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  transformTables() {
    const tables = document.querySelectorAll(".checklist-table");
    tables.forEach((table) => {
      if (this.isMobile) {
        this.transformTableToCards(table);
      } else {
        this.restoreTableFromCards(table);
      }
    });
  }

  transformTableToCards(table) {
    // Éviter de transformer plusieurs fois
    if (table.classList.contains("mobile-transformed")) return;

    const tbody = table.querySelector("tbody");
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll("tr"));
    if (rows.length === 0) return;

    // Créer le conteneur de cartes
    const cardsContainer = document.createElement("div");
    cardsContainer.className = "mobile-cards-container";
    cardsContainer.setAttribute("data-original-table", "true");

    // Transformer chaque ligne en carte
    rows.forEach((row) => {
      if (row.querySelector("h3")) {
        // Gérer les en-têtes de sous-section
        const card = this.createSectionHeader(row);
        cardsContainer.appendChild(card);
      } else {
        // Gérer les lignes normales
        const card = this.createFeatureCard(row);
        if (card) cardsContainer.appendChild(card);
      }
    });

    // Masquer le tableau et insérer les cartes
    table.style.display = "none";
    table.classList.add("mobile-transformed");
    table.parentNode.insertBefore(cardsContainer, table.nextSibling);

    // NOUVEAU : Réattacher les event listeners pour les calculs
    this.reattachEventListeners(cardsContainer);
  }

  createSectionHeader(row) {
    const headerText =
      row.querySelector("h3")?.textContent ||
      row.querySelector("td")?.textContent;

    const header = document.createElement("div");
    header.className = "mobile-section-header";
    header.innerHTML = `
      <h3 style="margin: 1.5rem 0 0.75rem 0; font-size: 1.1rem; color: #2e4a9e;">
        ${headerText}
      </h3>
    `;

    return header;
  }

  createFeatureCard(row) {
    const cells = Array.from(row.querySelectorAll("td"));
    if (cells.length < 2) return null;

    const card = document.createElement("div");
    card.className = "mobile-feature-card";

    // Récupérer les données de la ligne
    const checkbox = cells[0]?.querySelector(
      'input[type="checkbox"], .switch input'
    );
    const featureName = cells[1]?.innerHTML || "";
    const numberInput = cells[2]?.querySelector('input[type="number"]');
    const unit = cells[3]?.textContent || "";
    const time = cells[4]?.textContent || "";
    const subtotal = cells[5]?.textContent || "";

    // Gérer les switches différemment des checkboxes normales
    const isSwitch = cells[0]?.querySelector(".switch");
    let checkboxHtml = "";

    if (isSwitch) {
      // Copier le switch existant avec tous ses attributs
      const switchElement = cells[0].querySelector(".switch");
      const inputElement = switchElement.querySelector("input");
      checkboxHtml = `
        <label class="switch">
          <input type="checkbox" ${inputElement.checked ? "checked" : ""} 
                 class="${inputElement.className}" 
                 id="${inputElement.id}" 
                 name="${inputElement.name}"
                 aria-label="${
                   inputElement.getAttribute("aria-label") ||
                   "Activer cette fonctionnalité"
                 }" />
          <span class="slider"></span>
        </label>
      `;
    } else if (checkbox) {
      // Copier la checkbox normale
      checkboxHtml = `<input type="checkbox" ${
        checkbox.checked ? "checked" : ""
      } 
                      class="${checkbox.className}" 
                      id="${checkbox.id}" 
                      name="${checkbox.name}"
                      aria-label="${
                        checkbox.getAttribute("aria-label") ||
                        "Activer cette fonctionnalité"
                      }">`;
    }

    // Construire la carte
    card.innerHTML = `
      <div class="mobile-card-header">
        <div class="mobile-card-checkbox">
          ${checkboxHtml}
        </div>
        <div class="mobile-card-title">
          ${featureName}
        </div>
      </div>
      
      <div class="mobile-card-details">
        ${
          numberInput
            ? `
          <div class="mobile-card-row">
            <span class="mobile-card-label">Quantité:</span>
            <div class="mobile-card-input">
              <input type="number" min="0" value="${numberInput.value}" 
                     class="${numberInput.className}" 
                     id="${numberInput.id}" 
                     name="${numberInput.name}" 
                     style="width: 80px;" 
                     data-unit="${
                       numberInput.getAttribute("data-unit") || ""
                     }" />
              <span class="mobile-unit">${unit}</span>
            </div>
          </div>
        `
            : ""
        }
        
        ${
          time
            ? `
          <div class="mobile-card-row">
            <span class="mobile-card-label">Temps unitaire:</span>
            <span class="mobile-card-value">${time}</span>
          </div>
        `
            : ""
        }
        
        <div class="mobile-card-row mobile-card-total">
          <span class="mobile-card-label">Sous-total:</span>
          <span class="mobile-card-value mobile-subtotal sous-total">${subtotal}</span>
        </div>
      </div>
    `;

    // Copier les attributs data-* de la ligne originale
    Array.from(row.attributes).forEach((attr) => {
      if (attr.name.startsWith("data-")) {
        card.setAttribute(attr.name, attr.value);
      }
    });

    return card;
  }

  /**
   * NOUVEAU : Réattache les event listeners pour les calculs après transformation
   */
  reattachEventListeners(cardsContainer) {
    // Attacher les listeners pour les checkboxes et inputs
    const interactiveElements = cardsContainer.querySelectorAll(
      'input[type="checkbox"], input[type="number"], .switch input'
    );

    interactiveElements.forEach((element) => {
      // Supprimer les listeners existants pour éviter les doublons
      element.removeEventListener("input", this.handleInputChange);
      element.removeEventListener("change", this.handleInputChange);

      // Ajouter les nouveaux listeners
      element.addEventListener("input", this.handleInputChange);
      element.addEventListener("change", this.handleInputChange);
    });

    // Gérer spécifiquement les profils dynamiques s'ils existent
    const profilElements = cardsContainer.querySelectorAll(
      ".check-feature-profil, .profil-nb, .profil-modif"
    );

    profilElements.forEach((element) => {
      element.removeEventListener("input", this.handleInputChange);
      element.addEventListener("input", this.handleInputChange);
    });

    // Réattacher les listeners pour les boutons d'action des profils
    const profilButtons = cardsContainer.querySelectorAll(
      "#add-profil-btn, #profile-manager-btn, .remove-profil-btn"
    );

    profilButtons.forEach((button) => {
      // Ces boutons ont leurs propres gestionnaires dans profileManager.js
      // On déclenche un événement personnalisé pour les réinitialiser
      button.dispatchEvent(new Event("mobile-transform-complete"));
    });
  }

  /**
   * NOUVEAU : Gestionnaire unifié pour les changements d'input
   */
  handleInputChange = (event) => {
    // Appeler updateTotals si la fonction existe
    if (typeof updateTotals === "function") {
      updateTotals();
    }

    // Gérer les accords grammaticaux pour les unités
    const input = event.target;
    if (input.type === "number" && input.hasAttribute("data-unit")) {
      const card = input.closest(".mobile-feature-card");
      if (card) {
        const unitSpan = card.querySelector(".mobile-unit");
        const unitBase = input.getAttribute("data-unit");
        const count = parseInt(input.value, 10) || 0;

        if (unitSpan && unitBase && typeof accordUnit === "function") {
          unitSpan.textContent = accordUnit(count, unitBase);
        }
      }
    }
  };

  restoreTableFromCards(table) {
    if (!table.classList.contains("mobile-transformed")) return;

    // Trouver et supprimer le conteneur de cartes
    const cardsContainer = table.parentNode.querySelector(
      ".mobile-cards-container"
    );
    if (cardsContainer) {
      cardsContainer.remove();
    }

    // Restaurer le tableau
    table.style.display = "";
    table.classList.remove("mobile-transformed");

    // Réattacher les listeners sur le tableau restauré
    if (typeof addAllInputListeners === "function") {
      setTimeout(() => addAllInputListeners(), 100);
    }
  }
}

// Styles CSS pour les cartes mobiles
const mobileCardStyles = `
<style>
.mobile-cards-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1rem 0;
}

.mobile-feature-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s ease;
}

.mobile-feature-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.mobile-card-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
}

.mobile-card-checkbox {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
}

.mobile-card-title {
  flex: 1;
  font-weight: 600;
  font-size: 0.95rem;
  line-height: 1.4;
  color: #1f2937;
}

.mobile-card-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mobile-card-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
}

.mobile-card-label {
  font-weight: 500;
  font-size: 0.875rem;
  color: #6b7280;
  flex-shrink: 0;
}

.mobile-card-value {
  font-size: 0.875rem;
  color: #1f2937;
  text-align: right;
}

.mobile-card-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.mobile-card-input input {
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.mobile-unit {
  font-size: 0.875rem;
  color: #6b7280;
  white-space: nowrap;
}

.mobile-card-total {
  margin-top: 0.25rem;
  padding-top: 0.5rem;
  border-top: 1px solid #f3f4f6;
  font-weight: 600;
}

.mobile-card-total .mobile-card-value {
  color: #2e4a9e;
  font-weight: 700;
}

.mobile-section-header {
  margin: 1rem 0 0.5rem 0;
}

.mobile-section-header h3 {
  margin: 0;
  padding: 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #2e4a9e;
  border-bottom: 2px solid #e5e7eb;
}

/* Adaptations pour les switches dans les cartes */
.mobile-card-checkbox .switch {
  margin: 0;
}

/* Style pour les badges dans les cartes */
.mobile-card-title .attention-badge,
.mobile-card-title .warning-badge,
.mobile-card-title .neo-badge,
.mobile-card-title .air-badge,
.mobile-card-title .adapps-badge {
  display: inline-block;
  margin-top: 0.25rem;
  margin-left: 0;
}

/* Améliorer l'espacement pour les profils dynamiques */
.mobile-feature-card #profils-dyn-list {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f3f4f6;
}

.mobile-feature-card .profil-buttons {
  margin-top: 0.75rem !important;
  justify-content: space-between !important;
}

.mobile-feature-card .profil-buttons .action-btn {
  flex: 1;
  margin: 0 0.25rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

/* Assurer que les sous-totaux des cartes sont bien mis à jour */
.mobile-feature-card .mobile-subtotal {
  font-weight: 700;
  color: #2e4a9e;
}
</style>
`;

// Injecter les styles
document.head.insertAdjacentHTML("beforeend", mobileCardStyles);

// Initialiser le système mobile alternatif
document.addEventListener("DOMContentLoaded", () => {
  new MobileAlternative();
});

// Exporter pour usage externe si nécessaire
window.MobileAlternative = MobileAlternative;
