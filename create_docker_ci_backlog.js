const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// -- Paramètres Azure DevOps --------------------------------------------------
// Organisme et projet ciblés
const ORG = process.env.ADO_ORG || "Septeo-SECIB"; // personnalisez au besoin
const PROJECT = process.env.ADO_PROJECT || "OnboardingClient"; // idem
const PAT = process.env.AZURE_DEVOPS_PAT; // Personal Access Token avec droits Work Items (WIT)
if (!PAT) {
  console.error(
    "[ERREUR] Variable d'environnement AZURE_DEVOPS_PAT manquante."
  );
  process.exit(1);
}
const AUTH = Buffer.from(":" + PAT).toString("base64");

// Helper d'appel REST WIT
const apiProj = (path, method = "GET", body) =>
  fetch(`https://dev.azure.com/${ORG}/${PROJECT}/_apis${path}`, {
    method,
    headers: {
      Authorization: `Basic ${AUTH}`,
      ...(method === "PATCH"
        ? { "Content-Type": "application/json-patch+json" }
        : {}),
      ...(method === "POST" && body
        ? { "Content-Type": "application/json" }
        : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

(async () => {
  // -------------------------------------------------------------------------
  // EPICS (macro-phases de la chronologie)
  // -------------------------------------------------------------------------
  const epics = [
    {
      key: "DOCKER",
      title: "EPIC – Dockerisation de l'application",
      desc: "Créer et valider l'image Docker locale (Dockerfile, compose, tests).",
    },
    {
      key: "CI",
      title: "EPIC – Pipeline CI : Build & Push de l'image",
      desc: "Automatiser la construction et le push de l'image vers le registre.",
    },
    {
      key: "QA",
      title: "EPIC – Validation & Sécurité de l'image",
      desc: "Tests automatisés, scans de vulnérabilités et gating qualité.",
    },
    {
      key: "DIST",
      title: "EPIC – Distribution de l'image à l'équipe Dev",
      desc: "Mettre à disposition l'image et la procédure de pull/run pour les devs.",
    },
    {
      key: "REL",
      title: "EPIC – Release & Déploiement automatisé",
      desc: "Déployer l'image sur l'environnement Dev via un stage dédié.",
    },
    {
      key: "DOC",
      title: "EPIC – Documentation & Amélioration continue",
      desc: "Documenter l'architecture Docker/CI et améliorer en continu.",
    },
  ];

  const epicId = {};

  for (const e of epics) {
    const patch = [
      { op: "add", path: "/fields/System.WorkItemType", value: "Epic" },
      { op: "add", path: "/fields/System.Title", value: e.title },
      { op: "add", path: "/fields/System.Description", value: e.desc },
      { op: "add", path: "/fields/System.Tags", value: "Backlog;CI/CD;Docker" },
    ];

    const res = await apiProj(
      "/wit/workitems/$Epic?api-version=7.0",
      "PATCH",
      patch
    );
    const data = await res.json();
    if (res.ok) {
      console.log(`✅ Epic créé (#${data.id}): ${e.title}`);
      epicId[e.key] = data.id;
    } else {
      console.error("[ERREUR] Création Epic", e.title, data);
      process.exit(1);
    }
  }

  // -------------------------------------------------------------------------
  // USER STORIES détaillant les tâches clés de chaque phase
  // -------------------------------------------------------------------------
  const stories = [
    // EPIC DOCKER
    {
      epic: "DOCKER",
      title: "US – Rédiger le Dockerfile minimal",
      desc: "• Sélectionner l'image de base\n• Copier le code source\n• Exposer les ports nécessaires\n• Paramétrer les variables d'environnement par défaut\n• Critère d'acceptation : lancer 'docker build' local ➜ conteneur opérationnel.",
    },
    {
      epic: "DOCKER",
      title: "US – Créer le docker-compose.yml (optionnel)",
      desc: "Définir services applicatif + dépendances (BD, cache). Tests : 'docker compose up' sans erreur.",
    },
    {
      epic: "DOCKER",
      title: "US – Exécuter les tests unitaires dans le conteneur",
      desc: "Lancer 'npm test' ou équivalent dans l'image construite.\nValider que 100 % des tests passent.",
    },
    {
      epic: "DOCKER",
      title: "US – Documenter l'usage Docker en local",
      desc: "Mettre à jour README : commandes build/run, variables .env, troubleshooting.",
    },

    // EPIC CI
    {
      epic: "CI",
      title: "US – Créer la connexion de service au registre (ACR/Docker Hub)",
      desc: "Configurer Service Connection dans Project Settings. Critère : test 'Verify' réussi.",
    },
    {
      epic: "CI",
      title: "US – Ajouter azure-pipelines.yml (Build & Push)",
      desc: "Pipeline YAML :\n– Agent ubuntu-latest\n– Docker@2 buildAndPush\n– Tags: $(Build.BuildId), dev-latest.\nLe pipeline doit se déclencher sur 'main'.",
    },
    {
      epic: "CI",
      title: "US – Paramétrer les variables du pipeline",
      desc: "Définir registryServiceConn, imageRepo, tag. Valeurs stockées dans Variable Group sécurisé.",
    },
    {
      epic: "CI",
      title: "US – Valider l'exécution du pipeline initial",
      desc: "Le build doit aboutir et pousser l'image dans le registre.",
    },

    // EPIC QA
    {
      epic: "QA",
      title: "US – Ajouter step d'exécution des tests dans le conteneur",
      desc: "Script 'docker run image npm test'. Échec du job si tests KO.",
    },
    {
      epic: "QA",
      title: "US – Intégrer le scan Trivy/Dockle",
      desc: "Pipeline exécute un scan vulnérabilités. Critère : score < seuil ou build échoue.",
    },
    {
      epic: "QA",
      title: "US – Activer la politique 'build vert' sur la branche main",
      desc: "Configurer Branch policies : la PR nécessite un pipeline CI réussi avant merge.",
    },

    // EPIC DIST
    {
      epic: "DIST",
      title: "US – Rédiger le guide de récupération de l'image",
      desc: "Documentation Teams/Confluence : docker login + pull + run.",
    },
    {
      epic: "DIST",
      title: "US – Partager les credentials du registre de façon sécurisée",
      desc: "Ajouter les secrets dans Azure Key Vault et donner l'accès aux devs.",
    },
    {
      epic: "DIST",
      title: "US – Communiquer le tag et le changelog à l'équipe",
      desc: "Template de message Teams ou Release notes automatisées.",
    },

    // EPIC REL
    {
      epic: "REL",
      title: "US – Ajouter un stage Deploy_dev dans le pipeline",
      desc: "Multi-stage YAML ou Release classique. Dépend du job Build & Push.",
    },
    {
      epic: "REL",
      title: "US – Créer l'environnement Dev dans Azure DevOps",
      desc: "Définir 'Dev' avec approvals éventuelles et variables d'env.",
    },
    {
      epic: "REL",
      title: "US – Automatiser le déploiement de l'image sur Dev",
      desc: "Ex. Azure Web App for Containers : task AzureWebApp@1 avec package image:tag.",
    },
    {
      epic: "REL",
      title: "US – Ajouter une approbation manuelle avant Prod",
      desc: "Gate 'Manual Validation' ou approbateur nommé avant promotion.",
    },
    {
      epic: "REL",
      title: "US – Vérifier le bon fonctionnement post-déploiement",
      desc: "Smoke tests : endpoint /health renvoie 200.",
    },

    // EPIC DOC
    {
      epic: "DOC",
      title: "US – Documenter l'architecture Docker & pipeline",
      desc: "Schémas Mermaid, README détaillant chaque stage pipeline.",
    },
    {
      epic: "DOC",
      title: "US – Ajouter tests end-to-end dans CI",
      desc: "Mettre en place Cypress/Playwright pour les parcours clés.",
    },
    {
      epic: "DOC",
      title: "US – Introduire versioning sémantique des tags",
      desc: "Stratégie tags: v<MAJOR>.<MINOR>.<PATCH>, latest », mapping branches.",
    },
    {
      epic: "DOC",
      title: "US – Optimiser le cache Docker build",
      desc: "Utiliser --cache-from, builder login ACR pour accélérer la CI.",
    },
    {
      epic: "DOC",
      title: "US – Générer et publier le SBOM",
      desc: "Task sbom-tool ou 'docker buildx bake' --sbom ; publier en artifact.",
    },
  ];

  for (const s of stories) {
    const parent = epicId[s.epic];
    if (!parent) {
      console.error("[WARN] Epic non trouvé pour", s.title);
      continue;
    }
    const patch = [
      { op: "add", path: "/fields/System.WorkItemType", value: "User Story" },
      { op: "add", path: "/fields/System.Title", value: s.title },
      { op: "add", path: "/fields/System.Description", value: s.desc },
      { op: "add", path: "/fields/System.Tags", value: "CI/CD;Docker" },
      {
        op: "add",
        path: "/relations/-",
        value: {
          rel: "System.LinkTypes.Hierarchy-Reverse",
          url: `https://dev.azure.com/${ORG}/_apis/wit/workItems/${parent}`,
          attributes: { comment: "Child of Epic" },
        },
      },
    ];
    const res = await apiProj(
      "/wit/workitems/$User%20Story?api-version=7.0",
      "PATCH",
      patch
    );
    const data = await res.json();
    if (res.ok) {
      console.log(`  → Story créée (#${data.id}): ${s.title}`);
    } else {
      console.error("[ERREUR] Story", s.title, data);
    }
  }
})();
