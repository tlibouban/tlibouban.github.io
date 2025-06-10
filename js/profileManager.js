/**
 * profileManager.js - Gestion des profils utilisateur
 * Interface pour créer, gérer et sauvegarder des profils de configuration
 */

/**
 * Génère un switch moderne pour tous les types de tableaux
 * @param {string} id - ID unique pour le switch
 * @param {string} name - Nom du champ
 * @param {boolean} checked - État initial
 * @param {string} ariaLabel - Label d'accessibilité
 * @param {string} cssClass - Classe CSS additionnelle (optionnel)
 * @returns {string} HTML du switch moderne
 */
function renderModernSwitch(
  id,
  name,
  checked = false,
  ariaLabel = "",
  cssClass = "check-feature"
) {
  return `
    <div class="modern-switch-container">
      <input 
        id="${id}"
        name="${name}"
        type="checkbox" 
        class="modern-switch-input ${cssClass}"
        aria-label="${ariaLabel}"
        data-idx="${id.match(/\d+$/) ? id.match(/\d+$/)[0] : ""}"
        ${checked ? "checked" : ""}
      >
      <label for="${id}" class="modern-switch-label">
        <div class="tick-mark"></div>
      </label>
    </div>
  `;
}

/**
 * Génère un switch moderne pour tous les types de tableaux
 * @param {string} id - ID unique pour le switch
 * @param {string} name - Nom du champ
 * @param {boolean} checked - État initial
 * @param {string} ariaLabel - Label d'accessibilité
 * @param {string} cssClass - Classe CSS additionnelle (optionnel)
 * @returns {string} HTML du switch moderne
 */
function renderTriStateModernSwitch(
  id,
  name,
  checked = false,
  ariaLabel = "",
  cssClass = "check-feature"
) {
  return `
    <div class="modern-switch-container">
      <input 
        id="${id}"
        name="${name}"
        type="checkbox" 
        class="modern-switch-input ${cssClass}"
        aria-label="${ariaLabel}"
        data-idx="${id.match(/\d+$/) ? id.match(/\d+$/)[0] : ""}"
        ${checked ? "checked" : ""}
      >
      <label for="${id}" class="modern-switch-label">
        <div class="tick-mark"></div>
      </label>
    </div>
  `;
}

// =====================
// Initialisation du gestionnaire de profils
// =====================
document.addEventListener("DOMContentLoaded", function () {
  initModalHandlers();
  initProfilsDyn();

  // Gestionnaire de secours pour la fermeture de la modal
  // Au cas où initModalHandlers échouerait
  setTimeout(() => {
    const modal = document.getElementById("profileModal");
    const closeBtn = modal ? modal.querySelector(".close") : null;
    const openBtn = document.getElementById("profile-manager-btn");

    if (closeBtn && !closeBtn.hasAttribute("data-handler-added")) {
      closeBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (modal) {
          modal.style.display = "none";
          modal.setAttribute("aria-hidden", "true");
        }
      });
      closeBtn.setAttribute("data-handler-added", "true");
    }

    if (openBtn && modal && !openBtn.hasAttribute("data-handler-added")) {
      openBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        modal.style.display = "block";
        modal.setAttribute("aria-hidden", "false");
      });
      openBtn.setAttribute("data-handler-added", "true");
    }
  }, 100);
});

/**
 * Initialise les gestionnaires d'événements pour la modale de gestion des profils
 */
function initModalHandlers() {
  try {
    const modal = document.getElementById("profileModal");
    const btn = document.getElementById("profile-manager-btn");

    // Vérifier d'abord que les éléments essentiels sont présents
    if (!modal || !btn) {
      console.warn(
        "Éléments essentiels de la modale de profil manquants, initialisation abandonnée"
      );
      return;
    }

    const closeBtn = modal.querySelector(".close");
    const saveProfileBtn = document.getElementById("save-profile-btn");
    const saveProfileFormBtn = document.getElementById("save-profile-form-btn");
    const loadProfileBtn = document.getElementById("load-profile-btn");
    const deleteProfileBtn = document.getElementById("delete-profile-btn");
    const profileSelect = document.getElementById("profile-select");

    // Vérifier que tous les éléments sont présents
    if (
      !closeBtn ||
      !saveProfileBtn ||
      !saveProfileFormBtn ||
      !loadProfileBtn ||
      !deleteProfileBtn ||
      !profileSelect
    ) {
      console.warn(
        "Certains éléments de l'interface du gestionnaire de profils sont manquants, mais l'initialisation continue avec les éléments disponibles"
      );
      // Ne pas quitter la fonction, continuer avec les éléments disponibles
    }

    // Charger les profils depuis la liste dynamique
    if (profileSelect) {
      loadProfilesIntoSelect();
    }

    // Ouvrir la modale
    btn.addEventListener("click", function () {
      // Recharger les profils à chaque ouverture pour s'assurer que la liste est à jour
      if (profileSelect) {
        loadProfilesIntoSelect();
      }

      modal.style.display = "block";
      // Accessibilité: informer les lecteurs d'écran
      modal.setAttribute("aria-hidden", "false");
      // Mémoriser l'élément actif pour y revenir à la fermeture
      modal.lastFocus = document.activeElement;
      // Mettre le focus sur la modale
      const firstFocusable = modal.querySelector(
        "button, [href], input, select, textarea"
      );
      if (firstFocusable) firstFocusable.focus();
    });

    // Fermer la modale en cliquant sur X
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        closeModal(modal);
      });
    }

    // Fermer la modale en cliquant en dehors
    window.addEventListener("click", function (event) {
      if (event.target === modal) {
        closeModal(modal);
      }
    });

    // Fermer la modale avec la touche Echap
    window.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && modal.style.display === "block") {
        closeModal(modal);
      }
    });

    // Enregistrer un nouveau profil
    if (saveProfileBtn) {
      saveProfileBtn.addEventListener("click", function () {
        const profileNameInput = document.getElementById("new-profile-name");
        if (!profileNameInput) return;

        const profileName = profileNameInput.value;
        if (profileName.trim() === "") {
          alert("Veuillez saisir un nom de profil");
          return;
        }

        // Simuler l'enregistrement (à implémenter réellement)
        saveProfile(profileName);

        // Ajouter le profil à la liste
        if (profileSelect) {
          const option = document.createElement("option");
          option.value = profileName.toLowerCase().replace(/\s+/g, "_");
          option.text = profileName;
          profileSelect.add(option);
        }

        // Ajouter également à la liste dynamique des profils si elle existe
        if (window.profilsDynList) {
          window.profilsDynList.push({
            nom: profileName,
            nb: 0,
            ajoute: true,
          });
        }

        profileNameInput.value = "";
      });
    }

    // Enregistrer les changements du formulaire
    saveProfileFormBtn.addEventListener("click", function () {
      const selectedIndex = profileSelect.selectedIndex;

      if (profileSelect.value === "") {
        alert("Veuillez sélectionner un profil ou créer un nouveau");
        return;
      }

      const selectedProfile = profileSelect.options[selectedIndex].text;

      // Simuler l'enregistrement (à implémenter réellement)
      saveProfileSettings(selectedProfile);
    });

    // Charger un profil
    loadProfileBtn.addEventListener("click", function () {
      const selectedIndex = profileSelect.selectedIndex;

      if (profileSelect.value === "") {
        alert("Veuillez sélectionner un profil");
        return;
      }

      const selectedProfile = profileSelect.options[selectedIndex].text;

      // Simuler le chargement (à implémenter réellement)
      loadProfileSettings(selectedProfile);
    });

    // Supprimer un profil
    deleteProfileBtn.addEventListener("click", function () {
      const selectedIndex = profileSelect.selectedIndex;

      if (profileSelect.value === "") {
        alert("Veuillez sélectionner un profil à supprimer");
        return;
      }

      const selectedProfile = profileSelect.options[selectedIndex].text;

      if (
        confirm(
          `Êtes-vous sûr de vouloir supprimer le profil "${selectedProfile}" ?`
        )
      ) {
        // Simuler la suppression (à implémenter réellement)
        deleteProfile(selectedProfile);
        profileSelect.remove(selectedIndex);

        // Supprimer également de la liste dynamique si elle existe
        if (window.profilsDynList) {
          const profilIndex = window.profilsDynList.findIndex(
            (p) => p.nom === selectedProfile
          );
          if (profilIndex !== -1) {
            window.profilsDynList.splice(profilIndex, 1);
          }
        }

        alert("Profil supprimé");
      }
    });
  } catch (error) {
    console.error(
      "Erreur lors de l'initialisation des gestionnaires de modal:",
      error
    );
    // Essayer d'ajouter au moins le gestionnaire de base pour le bouton de fermeture
    const modal = document.getElementById("profileModal");
    const closeBtn = modal ? modal.querySelector(".close") : null;
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        if (modal) modal.style.display = "none";
      });
    }
  }
}

// Exposer la fonction initModalHandlers au niveau global
window.initModalHandlers = initModalHandlers;

/**
 * Ferme la modale et restaure le focus
 * @param {HTMLElement} modal - L'élément modal à fermer
 */
function closeModal(modal) {
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");

  // Restaurer le focus sur l'élément précédent
  if (modal.lastFocus) {
    modal.lastFocus.focus();
  }
}

/**
 * Enregistre un profil (à implémenter avec stockage réel)
 * @param {string} profileName - Nom du profil
 */
function saveProfile(profileName) {
  alert(`Profil "${profileName}" enregistré!`);
  // TODO: Implémenter le stockage réel (localStorage, API, etc.)
}

/**
 * Sauvegarde les paramètres du profil (à implémenter avec stockage réel)
 * @param {string} profileName - Nom du profil
 */
function saveProfileSettings(profileName) {
  alert(`Modifications sauvegardées pour le profil "${profileName}"`);
  // TODO: Collecter les paramètres du formulaire et les stocker
}

/**
 * Charge les paramètres d'un profil (à implémenter avec stockage réel)
 * @param {string} profileName - Nom du profil
 */
function loadProfileSettings(profileName) {
  alert(`Profil "${profileName}" chargé`);
  // TODO: Charger les paramètres et les appliquer au formulaire
}

/**
 * Supprime un profil (à implémenter avec stockage réel)
 * @param {string} profileName - Nom du profil
 */
function deleteProfile(profileName) {
  // TODO: Supprimer le profil du stockage
}

/**
 * Charge les profils dynamiques dans le sélecteur de profils
 */
function loadProfilesIntoSelect() {
  const profileSelect = document.getElementById("profile-select");
  if (!profileSelect) return;

  // Conserver l'option vide par défaut
  profileSelect.innerHTML = '<option value="">Sélectionner un profil</option>';

  // Si la liste des profils dynamiques existe, l'utiliser
  if (window.profilsDynList && window.profilsDynList.length > 0) {
    window.profilsDynList.forEach((profil) => {
      const option = document.createElement("option");
      option.value = profil.nom.toLowerCase().replace(/\s+/g, "_");
      option.text = profil.nom;
      profileSelect.appendChild(option);
    });
  } else {
    // Sinon, utiliser des profils par défaut
    const defaultProfiles = [
      { nom: "Administrateur", valeur: "admin" },
      { nom: "Utilisateur standard", valeur: "user" },
      { nom: "Invité", valeur: "guest" },
    ];

    defaultProfiles.forEach((profil) => {
      const option = document.createElement("option");
      option.value = profil.valeur;
      option.text = profil.nom;
      profileSelect.appendChild(option);
    });
  }
}

// =====================
// Gestion dynamique des profils (intégrés dans le tableau principal)
// =====================
function initProfilsDyn() {
  // Profils par défaut (si non déjà initialisés)
  if (!window.profilsDynList) {
    window.profilsDynList = [
      { nom: "Associé", nb: 1 }, // Valeur par défaut de 1 pour le profil Associé
      { nom: "Collaborateur", nb: 0 },
      { nom: "Secrétaire", nb: 0 },
      { nom: "Consultation", nb: 0 },
      { nom: "Stagiaire", nb: 0 },
    ];
  }

  renderProfilsDyn();

  // Attendre que le DOM soit prêt pour attacher le listener
  setTimeout(() => {
    const addBtn = document.getElementById("add-profil-btn");
    if (addBtn) {
      addBtn.onclick = function () {
        window.profilsDynList.push({
          nom: "Nouveau profil",
          nb: 0,
          ajoute: true,
        });

        renderProfilsDyn();
        updateTotals();
      };
    }
  }, 100);
}

/**
 * Affiche les lignes de profils directement dans le tableau principal
 * - Insère les lignes après la ligne "Utilisateurs"
 * - Ajoute les listeners nécessaires
 */
function renderProfilsDyn() {
  // Trouver la ligne principale des utilisateurs dans le tableau
  const utilisateursRow = document.querySelector(".utilisateurs-main-row");
  if (!utilisateursRow) return;

  // Supprimer les anciennes lignes de profils
  const existingProfilRows = document.querySelectorAll("tr.profil-row");
  existingProfilRows.forEach((row) => row.remove());

  // Créer les nouvelles lignes de profils
  const profilsHTML = window.profilsDynList
    .map(
      (profil, idx) => `
      <tr class="profil-row" data-profil-idx="${idx}" style="background:#f9fafb;">
        <td style="padding-left:20px;">${renderTriStateModernSwitch(
          `profil-check-${idx}`,
          `profil-check-${idx}`,
          idx === 0 && profil.nom === "Associé" ? "activated" : "non-examined",
          "Inclure ce profil",
          "check-feature-profil"
        )}</td>
        <td style="padding-left:20px;">
          <input type="text" value="${profil.nom.replace(/"/g, "&quot;")}" 
                 class="profil-nom" data-idx="${idx}" 
                 style="width:120px;border:1px solid #d1d5db;border-radius:4px;padding:4px;" 
                 aria-label="Nom du profil" id="profil-nom-${idx}" name="profil-nom-${idx}" />
          <button type="button" class="remove-profil-btn" data-idx="${idx}" 
                  style="background:#e74c3c;color:#fff;border:none;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:0.8em;margin-left:5px;" 
                  aria-label="Supprimer ce profil">×</button>
        </td>
        <td>
          <input type="number" min="0" value="${profil.nb}" 
                 class="profil-nb" data-idx="${idx}" 
                 style="width:60px;border:1px solid #d1d5db;border-radius:4px;padding:4px;" 
                 aria-label="Nombre d'utilisateurs pour ce profil" 
                 id="profil-nb-${idx}" name="profil-nb-${idx}" data-unit="utilisateur" />
        </td>
        <td style="text-align:center;">
          ${renderTriStateModernSwitch(
            `profil-modif-${idx}`,
            `profil-modif-${idx}`,
            profil.ajoute ? "activated" : "non-examined",
            "Modifier ce profil",
            "profil-modif"
          )}
        </td>
        <td style="color:#666;">30 min</td>
        <td class="profil-sous-total" data-idx="${idx}">0</td>
      </tr>
    `
    )
    .join("");

  // Ajouter la ligne de sous-total des profils
  const sousProfilTotalHTML = `
    <tr class="profil-row profil-total-row" style="background:#e5e7eb;font-weight:600;">
      <td></td>
      <td style="text-align:right;padding-right:10px;">Sous-total profils:</td>
      <td></td>
      <td></td>
      <td style="color:#666;">30 min/profil</td>
      <td id="profils-total-cell" style="font-weight:700;">0</td>
    </tr>
  `;

  // Insérer les nouvelles lignes après la ligne utilisateurs
  utilisateursRow.insertAdjacentHTML(
    "afterend",
    profilsHTML + sousProfilTotalHTML
  );

  // Listeners pour chaque champ du tableau profils dans le tableau principal
  document.querySelectorAll(".profil-nom").forEach((input) => {
    input.addEventListener("input", function () {
      window.profilsDynList[this.dataset.idx].nom = this.value;
    });
  });

  document.querySelectorAll(".profil-nb").forEach((input) => {
    input.addEventListener("input", function () {
      const nb = parseInt(this.value, 10) || 0;
      window.profilsDynList[this.dataset.idx].nb = nb;

      console.log(`🔄 Profil ${this.dataset.idx} nb mis à jour: ${nb}`);
      console.log(
        "📊 profilsDynList après mise à jour:",
        window.profilsDynList
      );

      // Mettre à jour l'accord grammatical des utilisateurs
      const tr = document.querySelector(
        '[data-section="PARAMÉTRAGE"][data-idx="0"]'
      );
      if (tr) {
        const nbInput = tr.querySelector("#utilisateurs-nb");
        const uniteCell = tr.querySelector(".unite-cell");
        if (nbInput && uniteCell && uniteCell.hasAttribute("data-unit-base")) {
          const unitBase = uniteCell.getAttribute("data-unit-base");
          uniteCell.textContent = accordUnit(
            parseInt(nbInput.value, 10) || 0,
            unitBase
          );
        }
      }

      updateTotals();
    });
  });

  // Les listeners pour les switches sont maintenant gérés par le listener global pour les tri-states

  // Listeners pour les boutons de suppression
  document.querySelectorAll(".remove-profil-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      window.profilsDynList.splice(this.dataset.idx, 1);
      renderProfilsDyn();
      updateTotals();
    });
  });

  // Mettre à jour les totaux après le rendu des profils - appel synchrone
  if (typeof updateTotals === "function") {
    updateTotals();
    console.log("🔄 updateTotals() appelé depuis renderProfilsDyn()");
  }
}
