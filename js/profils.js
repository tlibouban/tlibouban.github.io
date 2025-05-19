/**
 * Gestion des profils et des permissions
 */

document.addEventListener("DOMContentLoaded", function () {
  // Gestion des interrupteurs de thème qui contrôlent leurs actions enfants
  const themeCheckboxes = document.querySelectorAll(
    '.theme-switch input[type="checkbox"]'
  );

  themeCheckboxes.forEach((checkbox) => {
    // Écouter les changements sur les checkboxes de thème
    checkbox.addEventListener("change", function () {
      const theme = this.name.replace("theme-", "");
      const isChecked = this.checked;

      // Sélectionner toutes les actions de ce thème
      const actionCheckboxes = document.querySelectorAll(
        `input[name^="${theme}-"]`
      );

      // Activer/désactiver les actions en fonction de l'état du thème
      actionCheckboxes.forEach((actionCheckbox) => {
        actionCheckbox.checked = isChecked;
        actionCheckbox.disabled = !isChecked;

        // Ajouter/retirer une classe visuelle pour montrer les actions désactivées
        const switchLabel = actionCheckbox.closest(".switch");
        if (switchLabel) {
          if (!isChecked) {
            switchLabel.classList.add("disabled-switch");
          } else {
            switchLabel.classList.remove("disabled-switch");
          }
        }
      });
    });

    // Appliquer l'état initial
    checkbox.dispatchEvent(new Event("change"));
  });

  // Gestion du bouton de réinitialisation
  const resetButton = document.getElementById("reset-profil");
  if (resetButton) {
    resetButton.addEventListener("click", function () {
      if (confirm("Êtes-vous sûr de vouloir réinitialiser le formulaire ?")) {
        document.getElementById("profils-form").reset();

        // Réappliquer l'état des thèmes aux actions
        themeCheckboxes.forEach((checkbox) => {
          checkbox.dispatchEvent(new Event("change"));
        });
      }
    });
  }

  // Gestion du bouton d'enregistrement
  const saveButton = document.getElementById("save-profil");
  if (saveButton) {
    saveButton.addEventListener("click", function () {
      // Validation du formulaire
      const profilName = document.getElementById("profil-name").value.trim();
      if (!profilName) {
        alert("Veuillez saisir un nom de profil");
        return;
      }

      // Collecter les données du formulaire
      const formData = new FormData(document.getElementById("profils-form"));
      const profilData = {
        name: formData.get("profil-name"),
        description: formData.get("profil-description"),
        permissions: {},
      };

      // Structure pour organiser les permissions
      for (const [key, value] of formData.entries()) {
        // Ignorer les champs de base
        if (key === "profil-name" || key === "profil-description") continue;

        // Organiser les permissions par thème et action
        if (key.startsWith("theme-")) {
          const theme = key.replace("theme-", "");
          profilData.permissions[theme] = {
            enabled: value === "on",
            actions: {},
          };
        } else if (key.includes("-")) {
          const [theme, action, permission] = key.split("-");

          if (!profilData.permissions[theme]) {
            profilData.permissions[theme] = {
              enabled: true,
              actions: {},
            };
          }

          if (!profilData.permissions[theme].actions[action]) {
            profilData.permissions[theme].actions[action] = {};
          }

          profilData.permissions[theme].actions[action][permission] =
            value === "on";
        }
      }

      // Simuler l'enregistrement (à remplacer par un vrai envoi API)
      alert(`Profil "${profilData.name}" enregistré avec succès!`);

      // Vous pourriez ici envoyer les données à un serveur via fetch
    });
  }

  // Ajout de la classe pour les switches qui doivent être OFF par défaut
  document.querySelectorAll(".slider.off-default").forEach((slider) => {
    const checkbox = slider.previousElementSibling;
    if (checkbox && checkbox.type === "checkbox") {
      checkbox.checked = false;
    }
  });
});
