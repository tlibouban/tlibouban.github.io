/**
 * vueComponents.js - Composants Vue pour l'application
 * Gestion des composants Vue pour les différentes parties de l'application
 */

// Composant Switch moderne avec animation de coche
const ModernSwitch = {
  props: {
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      default: "",
    },
    checked: {
      type: Boolean,
      default: false,
    },
    ariaLabel: {
      type: String,
      default: "",
    },
  },
  emits: ["update:checked", "change"],
  template: `
    <div class="modern-switch-container">
      <input 
        :id="id"
        :name="name"
        :checked="checked"
        :aria-label="ariaLabel"
        type="checkbox" 
        class="modern-switch-input"
        @change="handleChange"
      >
      <label :for="id" class="modern-switch-label">
        <div class="tick-mark"></div>
      </label>
    </div>
  `,
  methods: {
    handleChange(event) {
      const isChecked = event.target.checked;
      this.$emit("update:checked", isChecked);
      this.$emit("change", event);
    },
  },
};

// Attendre que le DOM soit chargé avant de monter Vue
document.addEventListener("DOMContentLoaded", function () {
  // Vérifier si Vue est disponible  if (typeof Vue === "undefined") {    alert("Vue.js n'est pas chargé. Veuillez inclure Vue.js avant ce script.");    return;  }

  // Composant pour le modal de profil
  const ProfileModal = {
    data() {
      return {
        profiles: [],
        selectedProfile: "",
        newProfileName: "",
      };
    },
    methods: {
      loadProfiles() {
        // Utiliser les profils existants s'ils existent
        if (window.profilsDynList && window.profilsDynList.length > 0) {
          this.profiles = window.profilsDynList.map((profil) => ({
            id: profil.nom.toLowerCase().replace(/\s+/g, "_"),
            name: profil.nom,
          }));
        } else {
          // Sinon, utiliser des profils par défaut
          this.profiles = [
            { id: "admin", name: "Administrateur" },
            { id: "user", name: "Utilisateur standard" },
            { id: "guest", name: "Invité" },
          ];
        }
      },
      saveProfile() {
        if (!this.newProfileName.trim()) {
          alert("Veuillez saisir un nom de profil");
          return;
        }

        const profileId = this.newProfileName
          .toLowerCase()
          .replace(/\s+/g, "_");
        this.profiles.push({
          id: profileId,
          name: this.newProfileName,
        });

        // Ajouter également à la liste dynamique si elle existe
        if (window.profilsDynList) {
          window.profilsDynList.push({
            nom: this.newProfileName,
            nb: 0,
            ajoute: true,
          });
        }

        alert(`Profil "${this.newProfileName}" enregistré!`);
        this.newProfileName = "";
      },
      loadProfile() {
        if (!this.selectedProfile) {
          alert("Veuillez sélectionner un profil");
          return;
        }

        const profile = this.profiles.find(
          (p) => p.id === this.selectedProfile
        );
        if (profile) {
          alert(`Profil "${profile.name}" chargé`);
          // TODO: Implémenter le chargement réel des paramètres du profil
        }
      },
      deleteProfile() {
        if (!this.selectedProfile) {
          alert("Veuillez sélectionner un profil à supprimer");
          return;
        }

        const profile = this.profiles.find(
          (p) => p.id === this.selectedProfile
        );
        if (
          profile &&
          confirm(
            `Êtes-vous sûr de vouloir supprimer le profil "${profile.name}" ?`
          )
        ) {
          this.profiles = this.profiles.filter(
            (p) => p.id !== this.selectedProfile
          );

          // Supprimer également de la liste dynamique si elle existe
          if (window.profilsDynList) {
            const index = window.profilsDynList.findIndex(
              (p) => p.nom === profile.name
            );
            if (index !== -1) {
              window.profilsDynList.splice(index, 1);
            }
          }

          alert("Profil supprimé");
          this.selectedProfile = "";
        }
      },
      saveProfileSettings() {
        if (!this.selectedProfile) {
          alert("Veuillez sélectionner un profil ou créer un nouveau");
          return;
        }

        const profile = this.profiles.find(
          (p) => p.id === this.selectedProfile
        );
        if (profile) {
          alert(`Modifications sauvegardées pour le profil "${profile.name}"`);
          // TODO: Collecter et sauvegarder les paramètres du formulaire
        }
      },
      closeModal() {
        const modal = document.getElementById("profileModal");
        if (modal) {
          modal.style.display = "none";
          modal.setAttribute("aria-hidden", "true");
        }
      },
      // Fonction pour remplacer les textes d'en-tête par des emojis
      replaceHeadersWithEmojis() {
        const modal = document.getElementById("profileModal");
        if (!modal) return;

        const tableHeaders = modal.querySelectorAll("th");
        tableHeaders.forEach((header) => {
          const text = header.textContent.trim();
          switch (text) {
            case "VOIR":
              header.innerHTML = '<span title="VOIR">👁️</span>';
              break;
            case "CREER-MODIFIER":
              header.innerHTML = '<span title="CREER-MODIFIER">✏️</span>';
              break;
            case "SUPPRIMER":
              header.innerHTML = '<span title="SUPPRIMER">🗑️</span>';
              break;
          }
        });
      },
      // Fonction pour classifier les tableaux selon leur structure
      classifyTables() {
        const modal = document.getElementById("profileModal");
        if (!modal) return;

        // Remplacer d'abord les en-têtes par des emojis
        this.replaceHeadersWithEmojis();

        const tables = modal.querySelectorAll("table");
        tables.forEach((table) => {
          const headerRow = table.querySelector("thead tr");
          if (!headerRow) return;

          const headerCells = headerRow.querySelectorAll("th");
          const cellCount = headerCells.length;

          // Supprimer les classes existantes
          table.classList.remove("four-col", "two-col", "single-action-col");

          // Vérifier si le tableau a une colonne "ACCÈS"
          const hasAccesCol = Array.from(headerCells).some(
            (cell) =>
              cell.textContent.trim() === "ACCÈS" ||
              cell.querySelector('span[title="ACCÈS"]')
          );

          if (hasAccesCol) {
            // Tableau avec une colonne ACCÈS
            table.classList.add("single-action-col");
            table.classList.add("two-col");

            // S'assurer que toutes les lignes ont 2 cellules
            const rows = table.querySelectorAll("tbody tr");
            rows.forEach((row) => {
              const cells = row.querySelectorAll("td");
              if (cells.length < 2) {
                // Ajouter des cellules masquées si nécessaire
                for (let i = cells.length; i < 2; i++) {
                  const emptyCell = document.createElement("td");
                  emptyCell.classList.add("hidden");
                  row.appendChild(emptyCell);
                }
              }
            });
          } else {
            // Tableau standard avec colonnes VOIR, CREER-MODIFIER, SUPPRIMER
            table.classList.add("four-col");

            // S'assurer que toutes les lignes ont 4 cellules
            const rows = table.querySelectorAll("tbody tr");
            rows.forEach((row) => {
              const cells = row.querySelectorAll("td");
              if (cells.length < 4) {
                // Ajouter des cellules masquées si nécessaire
                for (let i = cells.length; i < 4; i++) {
                  const emptyCell = document.createElement("td");
                  emptyCell.classList.add("hidden");
                  row.appendChild(emptyCell);
                }
              }
            });
          }
        });
      },
    },
    mounted() {
      // Charger les profils lors du montage du composant
      this.loadProfiles();

      // Classifier les tableaux
      this.$nextTick(() => {
        this.classifyTables();
      });

      // Ajouter des gestionnaires d'événements pour les clics en dehors et la touche Echap
      window.addEventListener("click", (event) => {
        const modal = document.getElementById("profileModal");
        if (event.target === modal) {
          this.closeModal();
        }
      });

      window.addEventListener("keydown", (event) => {
        const modal = document.getElementById("profileModal");
        if (
          event.key === "Escape" &&
          modal &&
          modal.style.display === "block"
        ) {
          this.closeModal();
        }
      });
    },
  };

  // Enregistrer le composant pour une utilisation future
  if (Vue.createApp) {
    // Vue 3
    const app = Vue.createApp({
      components: {
        "profile-modal": ProfileModal,
        "modern-switch": ModernSwitch,
      },
    });

    // Monter l'application sur l'élément #profileModal s'il existe
    const profileModalEl = document.getElementById("profileModal");
    if (profileModalEl) {
      app.mount("#profileModal");
    }
  } else if (Vue.component) {
    // Vue 2
    Vue.component("profile-modal", ProfileModal);
    Vue.component("modern-switch", ModernSwitch);

    new Vue({
      el: "#profileModal",
    });
  }
});

// Exporter une fonction pour ouvrir le modal depuis l'extérieur
window.openProfileModal = function () {
  const modal = document.getElementById("profileModal");
  if (modal) {
    modal.style.display = "block";
    modal.setAttribute("aria-hidden", "false");

    // Remplacer les en-têtes par des emojis
    setTimeout(() => {
      // Remplacer les textes d'en-tête par des emojis
      const tableHeaders = modal.querySelectorAll("th");
      tableHeaders.forEach((header) => {
        const text = header.textContent.trim();
        switch (text) {
          case "VOIR":
            header.innerHTML = '<span title="VOIR">👁️</span>';
            break;
          case "CREER-MODIFIER":
            header.innerHTML = '<span title="CREER-MODIFIER">✏️</span>';
            break;
          case "SUPPRIMER":
            header.innerHTML = '<span title="SUPPRIMER">🗑️</span>';
            break;
        }
      });

      // Classifier les tableaux lorsque le modal est ouvert
      const tables = modal.querySelectorAll("table");
      tables.forEach((table) => {
        const headerRow = table.querySelector("thead tr");
        if (!headerRow) return;

        const headerCells = headerRow.querySelectorAll("th");
        const cellCount = headerCells.length;

        // Supprimer les classes existantes
        table.classList.remove("four-col", "two-col", "single-action-col");

        // Vérifier si le tableau a une colonne "ACCÈS"
        const hasAccesCol = Array.from(headerCells).some(
          (cell) =>
            cell.textContent.trim() === "ACCÈS" ||
            cell.querySelector('span[title="ACCÈS"]')
        );

        if (hasAccesCol) {
          // Tableau avec une colonne ACCÈS
          table.classList.add("single-action-col");
          table.classList.add("two-col");

          // S'assurer que toutes les lignes ont 2 cellules
          const rows = table.querySelectorAll("tbody tr");
          rows.forEach((row) => {
            const cells = row.querySelectorAll("td");
            if (cells.length < 2) {
              // Ajouter des cellules masquées si nécessaire
              for (let i = cells.length; i < 2; i++) {
                const emptyCell = document.createElement("td");
                emptyCell.classList.add("hidden");
                row.appendChild(emptyCell);
              }
            }
          });
        } else {
          // Tableau standard avec colonnes VOIR, CREER-MODIFIER, SUPPRIMER
          table.classList.add("four-col");

          // S'assurer que toutes les lignes ont 4 cellules
          const rows = table.querySelectorAll("tbody tr");
          rows.forEach((row) => {
            const cells = row.querySelectorAll("td");
            if (cells.length < 4) {
              // Ajouter des cellules masquées si nécessaire
              for (let i = cells.length; i < 4; i++) {
                const emptyCell = document.createElement("td");
                emptyCell.classList.add("hidden");
                row.appendChild(emptyCell);
              }
            }
          });
        }
      });
    }, 0);
  }
};
