/**
 * filters.js - Gestion des filtres de recherche et de tags
 * Contient les fonctions pour filtrer les éléments de la checklist
 */

// =====================
// Initialisation des filtres
// =====================
function initFilters() {
  // Filtres de tags (NEO/AIR/ADAPPS)
  const tagButtons = document.querySelectorAll(".tag-filter-btn");
  const searchInput = document.getElementById("search-input");
  const clearSearchBtn = document.getElementById("clear-search-btn");

  let activeTag = "all";
  let searchTerm = "";

  // Ajoute les listeners pour les boutons de filtre de tags
  tagButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      activeTag = this.dataset.tag;

      // Mise à jour de l'apparence des boutons
      tagButtons.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      applyFilters();
    });
  });

  // Ajoute le listener pour le champ de recherche
  searchInput.addEventListener("input", function () {
    searchTerm = this.value.trim().toLowerCase();
    applyFilters();
    // Afficher/masquer le bouton de suppression
    clearSearchBtn.style.display = searchTerm ? "flex" : "none";
  });

  // Ajoute le listener pour le bouton de suppression de la recherche
  clearSearchBtn.addEventListener("click", function () {
    searchInput.value = "";
    searchTerm = "";
    clearSearchBtn.style.display = "none";
    applyFilters();
  });

  // Masquer le bouton clear au chargement initial
  clearSearchBtn.style.display = "none";

  // =====================
  // Application des filtres
  // =====================
  function applyFilters() {
    const sections = document.querySelectorAll(".section");
    let hasResults = false;

    sections.forEach((section) => {
      const rows = section.querySelectorAll("tbody tr");
      let sectionHasVisibleRows = false;

      rows.forEach((row) => {
        const text = row.textContent.toLowerCase();
        const matchesSearch = searchTerm === "" || text.includes(searchTerm);

        // Vérifie si la ligne a la classe ou l'attribut data pour le tag actif
        const hasTag =
          activeTag === "all" ||
          row.classList.contains(activeTag) ||
          row.querySelector(`.${activeTag}-badge`) ||
          (row.textContent.toLowerCase().includes(activeTag) &&
            activeTag !== "all");

        const isVisible = matchesSearch && hasTag;

        row.style.display = isVisible ? "" : "none";

        if (isVisible) {
          sectionHasVisibleRows = true;
          hasResults = true;
        }
      });

      // Si la section est vide après filtrage, on peut la cacher
      const sectionTitle = section.querySelector(".section-title");
      const sectionContent = section.querySelector(".section-content");

      if (
        !sectionHasVisibleRows &&
        sectionContent.querySelectorAll("tr").length > 0
      ) {
        section.classList.add("filtered-out");
      } else {
        section.classList.remove("filtered-out");
      }
    });

    // Afficher un message si aucun résultat
    const noResultsMsg = document.getElementById("no-results-message");
    if (!hasResults) {
      if (!noResultsMsg) {
        const msg = document.createElement("div");
        msg.id = "no-results-message";
        msg.className = "no-results";
        msg.textContent = "Aucun résultat ne correspond à votre recherche.";
        document.getElementById("checklist-sections").appendChild(msg);
      }
    } else if (noResultsMsg) {
      noResultsMsg.remove();
    }

    // Dispatch d'un événement pour informer d'autres modules du changement
    document.dispatchEvent(new CustomEvent("filterChanged"));
  }

  // Initialise l'état des filtres (pour afficher tout par défaut)
  document
    .querySelector('.tag-filter-btn[data-tag="all"]')
    .classList.add("active");
  applyFilters();
}
