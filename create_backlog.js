const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const ORG = "Septeo-SECIB";
const PROJECT = "OnboardingClient";
const PAT = process.env.AZURE_DEVOPS_PAT;
if (!PAT) {
  console.error("Définir AZURE_DEVOPS_PAT");
  process.exit(1);
}
const AUTH = Buffer.from(":" + PAT).toString("base64");

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
  const epics = [
    {
      title: "EPIC – Base de données & ORM",
      desc: "Conception, migration, scripts seed et ORM Prisma/Drizzle.",
    },
    {
      title: "EPIC – API Backend OptimExCo",
      desc: "Endpoints REST, validation, security, tests.",
    },
    {
      title: "EPIC – Intégration Frontend",
      desc: "Appels fetch, persistance, rechargement du formulaire.",
    },
    {
      title: "EPIC – CI/CD & DevOps",
      desc: "Pipelines Azure, déploiements Render/Azure, tests auto.",
    },
    {
      title: "EPIC – Documentation & UX",
      desc: "Wiki technique, guides utilisateur, diagrammes.",
    },
  ];

  const epicIdMap = {};

  // Créer les Epics
  for (const e of epics) {
    const patch = [
      { op: "add", path: "/fields/System.Title", value: e.title },
      { op: "add", path: "/fields/System.Description", value: e.desc },
      { op: "add", path: "/fields/System.WorkItemType", value: "Epic" },
    ];
    const res = await apiProj(
      "/wit/workitems/$Epic?api-version=7.0",
      "PATCH",
      patch
    );
    const data = await res.json();
    if (res.ok) {
      console.log(`✅ Epic ${data.id} créé: ${e.title}`);
      epicIdMap[e.title] = data.id;
    } else {
      console.error("Erreur epic", e.title, data);
      process.exit(1);
    }
  }

  // Stories sous chaque epic
  const stories = [
    {
      epic: "EPIC – Base de données & ORM",
      title: "Migration schema.sql sur Render",
      desc: "Appliquer le script SQL via pipeline.",
    },
    {
      epic: "EPIC – Base de données & ORM",
      title: "Créer schema.prisma",
      desc: "Générer le modèle Prisma et la migration initiale.",
    },
    {
      epic: "EPIC – API Backend OptimExCo",
      title: "Route POST /dossier",
      desc: "Sérialiser et enregistrer la checklist complète.",
    },
    {
      epic: "EPIC – API Backend OptimExCo",
      title: "Route GET /dossier/:id",
      desc: "Recharger le dossier pour modification.",
    },
    {
      epic: "EPIC – Intégration Frontend",
      title: "Appel fetch sauvegarde",
      desc: "Envoyer le formulaire vers /dossier.",
    },
    {
      epic: "EPIC – Intégration Frontend",
      title: "Rechargement du formulaire",
      desc: "Récupérer données et pré-remplir les tri-states.",
    },
    {
      epic: "EPIC – CI/CD & DevOps",
      title: "Pipeline CI (lint + tests)",
      desc: "YAML sur agent ubuntu-latest.",
    },
    {
      epic: "EPIC – CI/CD & DevOps",
      title: "Stage Deploy Render",
      desc: "Déploiement auto après merge main.",
    },
    {
      epic: "EPIC – Documentation & UX",
      title: "Structure Wiki",
      desc: "Migrer README, ERD, guides.",
    },
    {
      epic: "EPIC – Documentation & UX",
      title: "Diagrammes Mermaid",
      desc: "Ajouter ERD et flux CI/CD.",
    },
  ];

  for (const s of stories) {
    const parentId = epicIdMap[s.epic];
    if (!parentId) continue;
    const patch = [
      { op: "add", path: "/fields/System.Title", value: s.title },
      { op: "add", path: "/fields/System.Description", value: s.desc },
      { op: "add", path: "/fields/System.Tags", value: "Backlog" },
      {
        op: "add",
        path: "/relations/-",
        value: {
          rel: "System.LinkTypes.Hierarchy-Reverse",
          url: `https://dev.azure.com/${ORG}/_apis/wit/workItems/${parentId}`,
          attributes: { comment: "Child of epic" },
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
      console.log(`✅ Story ${data.id} créé sous epic ${s.epic}`);
    } else {
      console.error("Erreur story", s.title, data);
    }
  }
})();
