/**
 * trainerAssignment.js - Module d'affectation intelligente des formateurs
 * Logique d'attribution basée sur la spécialité, la localisation et le type de formation
 */

class TrainerAssignment {
  constructor() {
    this.formationDatabase = null;
    this.zoneMapping = new Map(); // Mapping département -> zone
    this.specializationMapping = new Map(); // Mapping logiciel -> spécialité SEPTEO
    this.isLoaded = false;

    this.init();
  }

  /**
   * Initialise le module d'affectation
   */
  async init() {
    try {
      await this.loadFormationDatabase();
      this.buildZoneMapping();
      this.buildSpecializationMapping();
      this.isLoaded = true;
      console.log("✅ Module d'affectation des formateurs initialisé");
    } catch (error) {
      console.error(
        "❌ Erreur lors de l'initialisation du module d'affectation:",
        error
      );
    }
  }

  /**
   * Charge la base de données des formateurs
   */
  async loadFormationDatabase() {
    try {
      const response = await fetch("json/equipe_formation.json");
      const data = await response.json();
      this.formationDatabase = data;
      console.log(`👨‍🏫 Base formateurs chargée: ${data.length} zones`);
    } catch (error) {
      console.error("Erreur lors du chargement de la base formation:", error);
      throw error;
    }
  }

  /**
   * Construit le mapping département -> zone
   */
  buildZoneMapping() {
    if (!this.formationDatabase) return;

    this.formationDatabase.forEach((zoneData) => {
      this.zoneMapping.set(zoneData.Departement, zoneData.Zone);
    });
  }

  /**
   * Construit le mapping logiciel -> spécialité SEPTEO
   */
  buildSpecializationMapping() {
    // Logiciels de base SEPTEO
    this.specializationMapping.set("AIR", "AIR");
    this.specializationMapping.set("NEO", "NEO");
    this.specializationMapping.set("ADAPPS", "ADAPPS");

    // Solutions SEPTEO - tous les autres logiciels sont mappés vers les spécialités existantes
    // Pour l'instant, on considère que les autres solutions utilisent NEO comme base
    this.specializationMapping.set("Autre", "NEO"); // Par défaut
  }

  /**
   * Détermine la spécialité requise en fonction du logiciel
   * @param {string} logiciel - Logiciel utilisé par le client
   * @returns {string} - Spécialité requise
   */
  getRequiredSpecialty(logiciel) {
    if (!logiciel) return null;

    const cleanLogiciel = logiciel.trim().toUpperCase();

    // Vérifier si c'est un logiciel de base SEPTEO
    if (["AIR", "NEO", "ADAPPS"].includes(cleanLogiciel)) {
      return cleanLogiciel;
    }

    // Pour tout autre logiciel, on considère que c'est une solution SEPTEO
    // qui nécessite une expertise NEO par défaut
    return "NEO";
  }

  /**
   * Trouve tous les formateurs disponibles pour une spécialité donnée
   * @param {string} specialty - Spécialité recherchée
   * @returns {Array} - Liste des formateurs avec leurs informations (dédoublonnés)
   */
  findTrainersBySpecialty(specialty) {
    if (!this.formationDatabase || !specialty) return [];

    const trainersMap = new Map(); // Utiliser une Map pour éviter les doublons

    this.formationDatabase.forEach((zoneData) => {
      // Parcourir tous les formateurs de cette zone
      Object.keys(zoneData)
        .filter((key) => key.startsWith("Formateur_"))
        .forEach((formKey) => {
          const formateur = zoneData[formKey];

          if (formateur.Specialite === specialty) {
            // Créer un ID unique basé sur nom + prénom + email
            const uniqueId = `${formateur.Prenom}-${formateur.Nom}-${formateur.Email}`;

            // Ajouter seulement si pas déjà présent (évite les doublons)
            if (!trainersMap.has(uniqueId)) {
              trainersMap.set(uniqueId, {
                ...formateur,
                Zone: zoneData.Zone,
                Departement: zoneData.Departement,
                id: uniqueId,
              });
            }
          }
        });
    });

    // Convertir la Map en Array
    return Array.from(trainersMap.values());
  }

  /**
   * Calcule la proximité géographique entre deux zones
   * @param {string} clientZone - Zone du client
   * @param {string} trainerZone - Zone du formateur
   * @returns {number} - Score de proximité (plus petit = plus proche)
   */
  calculateGeographicProximity(clientZone, trainerZone) {
    if (!clientZone || !trainerZone) return 999;

    // Si même zone, proximité maximale
    if (clientZone === trainerZone) return 0;

    // Définir les groupes de zones proches
    const zoneGroups = {
      Nord: ["Nord"],
      "Île-de-France": ["Île-de-France"],
      Est: ["Est"],
      "Centre-Ouest": ["Centre-Ouest", "Ouest"],
      Ouest: ["Ouest", "Centre-Ouest"],
      "Sud-Est": ["Sud-Est"],
      "Sud-Ouest": ["Sud-Ouest"],
    };

    const clientGroup = zoneGroups[clientZone] || [];

    // Si le formateur est dans une zone proche
    if (clientGroup.includes(trainerZone)) return 1;

    // Proximité par défaut
    return 2;
  }

  /**
   * Obtient le type de formation sélectionné
   * @returns {string} - "sur-site" ou "distance"
   */
  getSelectedTrainingType() {
    const deploymentRadios = document.querySelectorAll(
      'input[name="deployment-type"]'
    );

    for (const radio of deploymentRadios) {
      if (radio.checked) {
        return radio.value;
      }
    }

    // Par défaut, formation sur site
    return "sur-site";
  }

  /**
   * Fonction principale d'affectation des formateurs
   * @param {Object} clientData - Données du client
   * @param {string} logiciel - Logiciel utilisé
   * @returns {Object} - Résultat de l'affectation
   */
  assignTrainers(clientData, logiciel) {
    if (!this.isLoaded) {
      return {
        success: false,
        error: "Module d'affectation non initialisé",
      };
    }

    // 1. Déterminer la spécialité requise
    const requiredSpecialty = this.getRequiredSpecialty(logiciel);
    if (!requiredSpecialty) {
      return {
        success: false,
        error: "Impossible de déterminer la spécialité requise",
      };
    }

    // 2. Trouver tous les formateurs avec cette spécialité
    const availableTrainers = this.findTrainersBySpecialty(requiredSpecialty);
    if (availableTrainers.length === 0) {
      return {
        success: false,
        error: `Aucun formateur disponible pour la spécialité ${requiredSpecialty}`,
      };
    }

    // 3. Déterminer le type de formation
    const trainingType = this.getSelectedTrainingType();

    // 4. Appliquer la logique de sélection
    let selectedTrainers = [];

    if (trainingType === "distance") {
      // Formation à distance : pas de critère géographique
      selectedTrainers = availableTrainers;
    } else {
      // Formation sur site : prioriser la proximité géographique
      if (clientData && clientData.departement) {
        const clientZone = this.zoneMapping.get(clientData.departement);

        if (clientZone) {
          // Trier par proximité géographique
          selectedTrainers = availableTrainers
            .map((trainer) => ({
              ...trainer,
              proximityScore: this.calculateGeographicProximity(
                clientZone,
                trainer.Zone
              ),
            }))
            .sort((a, b) => a.proximityScore - b.proximityScore);
        } else {
          selectedTrainers = availableTrainers;
        }
      } else {
        selectedTrainers = availableTrainers;
      }
    }

    return {
      success: true,
      specialty: requiredSpecialty,
      trainingType: trainingType,
      clientZone: clientData
        ? this.zoneMapping.get(clientData.departement)
        : null,
      totalAvailable: availableTrainers.length,
      recommendedTrainers: selectedTrainers,
      primaryTrainer: selectedTrainers[0] || null,
    };
  }

  /**
   * Génère un affichage formaté des recommandations
   * @param {Object} assignment - Résultat de l'affectation
   * @returns {string} - HTML formaté
   */
  formatAssignmentResult(assignment) {
    if (!assignment.success) {
      return `<div class="trainer-assignment-error">❌ ${assignment.error}</div>`;
    }

    const {
      specialty,
      trainingType,
      clientZone,
      recommendedTrainers,
      primaryTrainer,
    } = assignment;

    let html = `
      <div class="trainer-assignment-result">
        <h5>🎯 Affectation automatique des formateurs</h5>
        <div class="assignment-details">
          <p><strong>Spécialité requise:</strong> ${specialty}</p>
          <p><strong>Type de formation:</strong> ${
            trainingType === "distance" ? "À distance" : "Sur site"
          }</p>
          ${
            clientZone
              ? `<p><strong>Zone cliente:</strong> ${clientZone}</p>`
              : ""
          }
        </div>
    `;

    if (primaryTrainer) {
      html += `
        <div class="primary-trainer">
          <h6>👨‍🏫 Formateur recommandé</h6>
          <div class="trainer-card primary">
            <strong>${primaryTrainer.Prenom} ${primaryTrainer.Nom}</strong><br>
            <span class="trainer-specialty">Spécialité: ${
              primaryTrainer.Specialite
            }</span><br>
            <span class="trainer-zone">Zone: ${primaryTrainer.Zone}</span><br>
            <a href="mailto:${primaryTrainer.Email}" class="trainer-email">${
        primaryTrainer.Email
      }</a>
            ${
              primaryTrainer.proximityScore !== undefined
                ? `<span class="proximity-indicator">📍 ${this.getProximityLabel(
                    primaryTrainer.proximityScore
                  )}</span>`
                : ""
            }
          </div>
        </div>
      `;

      // Afficher les alternatives si disponibles
      if (recommendedTrainers.length > 1) {
        html += `
          <div class="alternative-trainers">
            <h6>🔄 Formateurs alternatifs (${
              recommendedTrainers.length - 1
            })</h6>
            <div class="trainers-grid">
        `;

        recommendedTrainers.slice(1, 4).forEach((trainer) => {
          // Limiter à 3 alternatives
          html += `
            <div class="trainer-card alternative">
              <strong>${trainer.Prenom} ${trainer.Nom}</strong><br>
              <span class="trainer-zone">${trainer.Zone}</span>
              ${
                trainer.proximityScore !== undefined
                  ? `<span class="proximity-indicator">📍 ${this.getProximityLabel(
                      trainer.proximityScore
                    )}</span>`
                  : ""
              }
            </div>
          `;
        });

        html += `</div></div>`;
      }
    }

    html += `</div>`;
    return html;
  }

  /**
   * Obtient le label de proximité
   * @param {number} score - Score de proximité
   * @returns {string} - Label descriptif
   */
  getProximityLabel(score) {
    switch (score) {
      case 0:
        return "Même zone";
      case 1:
        return "Zone proche";
      case 2:
        return "Zone éloignée";
      default:
        return "Distance inconnue";
    }
  }

  /**
   * Met à jour l'affichage des formateurs dans l'interface
   * @param {Object} clientData - Données du client
   * @param {string} logiciel - Logiciel sélectionné
   */
  updateTrainerDisplay(clientData, logiciel) {
    const assignment = this.assignTrainers(clientData, logiciel);
    const formattedResult = this.formatAssignmentResult(assignment);

    // Utiliser la div existante pour l'affectation des formateurs
    let assignmentDiv = document.getElementById("trainer-assignment-info");

    assignmentDiv.innerHTML = formattedResult;
    assignmentDiv.style.display = "block";
  }

  /**
   * Masque l'affichage des affectations
   */
  hideTrainerDisplay() {
    const assignmentDiv = document.getElementById("trainer-assignment-info");
    if (assignmentDiv) {
      assignmentDiv.style.display = "none";
    }
  }
}

// Instance globale
let trainerAssignmentInstance = null;

/**
 * Initialise le module d'affectation des formateurs
 */
function initTrainerAssignment() {
  if (!trainerAssignmentInstance) {
    trainerAssignmentInstance = new TrainerAssignment();
  }
  return trainerAssignmentInstance;
}

/**
 * Obtient l'instance du module d'affectation
 * @returns {TrainerAssignment|null}
 */
function getTrainerAssignmentInstance() {
  return trainerAssignmentInstance;
}

// Auto-initialisation
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    trainerAssignmentInstance = initTrainerAssignment();
    window.trainerAssignmentInstance = trainerAssignmentInstance;
  });
} else {
  trainerAssignmentInstance = initTrainerAssignment();
  window.trainerAssignmentInstance = trainerAssignmentInstance;
}

// Export pour usage externe
window.TrainerAssignment = TrainerAssignment;
window.getTrainerAssignmentInstance = getTrainerAssignmentInstance;
