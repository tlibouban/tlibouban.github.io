/**
 * Test Mobile - Vérification du calcul des temps
 * A supprimer après validation
 */

// Test automatique du calcul des temps sur mobile
document.addEventListener("DOMContentLoaded", () => {
  // Attendre que la transformation mobile soit prête
  setTimeout(() => {
    if (window.innerWidth < 768) {
      console.log(
        "🧪 [TEST MOBILE] Vérification du calcul des temps sur mobile..."
      );

      // Tester avec une carte mobile
      const mobileCards = document.querySelectorAll(".mobile-feature-card");
      if (mobileCards.length > 0) {
        console.log(`✅ ${mobileCards.length} cartes mobiles trouvées`);

        // Tester le premier input checkbox
        const firstCheckbox = document.querySelector(
          '.mobile-feature-card input[type="checkbox"]'
        );
        if (firstCheckbox) {
          console.log("✅ Premier checkbox mobile trouvé");

          // Simuler un clic
          firstCheckbox.checked = !firstCheckbox.checked;
          firstCheckbox.dispatchEvent(new Event("change", { bubbles: true }));

          console.log("✅ Test de changement de checkbox mobile effectué");
        }

        // Tester le premier input number
        const firstNumberInput = document.querySelector(
          '.mobile-feature-card input[type="number"]'
        );
        if (firstNumberInput) {
          console.log("✅ Premier input number mobile trouvé");

          // Simuler un changement de valeur
          const oldValue = firstNumberInput.value;
          firstNumberInput.value = parseInt(oldValue || "1") + 1;
          firstNumberInput.dispatchEvent(new Event("input", { bubbles: true }));

          console.log(
            `✅ Test de changement d'input number mobile effectué: ${oldValue} → ${firstNumberInput.value}`
          );
        }

        // Vérifier si le total général se met à jour
        setTimeout(() => {
          const totalGeneral = document.getElementById("total-general-h1");
          if (totalGeneral) {
            console.log(
              `📊 Total général après test: ${totalGeneral.textContent}`
            );
          }
        }, 500);
      } else {
        console.log(
          "⚠️ Aucune carte mobile trouvée - transformation non activée"
        );
      }
    } else {
      console.log(
        "ℹ️ [TEST MOBILE] Écran desktop détecté - test mobile non applicable"
      );
    }
  }, 1000);
});

// Fonction de test manuelle
window.testMobileCalculation = () => {
  console.log("🧪 [TEST MOBILE MANUEL] Démarrage du test...");

  const cards = document.querySelectorAll(".mobile-feature-card");
  console.log(`Cartes trouvées: ${cards.length}`);

  cards.forEach((card, index) => {
    const checkbox = card.querySelector('input[type="checkbox"]');
    const numberInput = card.querySelector('input[type="number"]');

    console.log(`Carte ${index + 1}:`, {
      hasCheckbox: !!checkbox,
      checkboxChecked: checkbox?.checked,
      hasNumberInput: !!numberInput,
      numberValue: numberInput?.value,
    });
  });

  // Vérifier les listeners
  const interactiveElements = document.querySelectorAll(
    ".mobile-feature-card input"
  );
  console.log(
    `Éléments interactifs dans les cartes: ${interactiveElements.length}`
  );

  // Test updateTotals
  if (typeof updateTotals === "function") {
    console.log("✅ updateTotals est disponible");
    updateTotals();
    console.log("✅ updateTotals appelé manuellement");
  } else {
    console.log("❌ updateTotals non disponible");
  }
};
