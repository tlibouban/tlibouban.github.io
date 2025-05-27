/**
 * formStyling.js - Gestion de la mise en forme cohérente des champs
 */

function initFormStyling() {
  const fieldsToStyle = ["numero-dossier", "projet", "logiciel", "sens"];

  fieldsToStyle.forEach((fieldId) => {
    const field = document.getElementById(fieldId);
    if (!field) return;

    // Ajouter la classe has-value quand le champ a une valeur
    function updateHasValueClass() {
      if (field.value && field.value.trim() !== "") {
        field.classList.add("has-value");
      } else {
        field.classList.remove("has-value");
      }
    }

    // Écouter les changements
    field.addEventListener("input", updateHasValueClass);
    field.addEventListener("change", updateHasValueClass);

    // Initialiser l'état
    updateHasValueClass();
  });

  console.log("📝 Mise en forme des champs initialisée");
}

// Auto-initialisation
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFormStyling);
} else {
  initFormStyling();
}
