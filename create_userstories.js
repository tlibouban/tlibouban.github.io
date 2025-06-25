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

// organisation-level call
const apiOrg = (path, method = "GET", body) =>
  fetch(`https://dev.azure.com/${ORG}/_apis${path}`, {
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

// projet-level call
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
  // 1. Récupère la liste des personas (ID -> title)
  const wiql = {
    query:
      "SELECT [System.Id], [System.Title] FROM WorkItems WHERE [System.Tags] CONTAINS 'Persona'",
  };
  const resWiql = await apiProj("/wit/wiql?api-version=7.0", "POST", wiql);
  if (!resWiql.ok) {
    const txt = await resWiql.text();
    console.error("Erreur WIQL:", resWiql.status, txt.slice(0, 200));
    process.exit(1);
  }
  const wiqlData = await resWiql.json();
  const ids = wiqlData.workItems.map((w) => w.id);
  const personaMap = {};
  if (ids.length) {
    const resDetails = await apiOrg(
      `/wit/workitemsbatch?api-version=7.0`,
      "POST",
      { ids }
    );
    const dataDetails = await resDetails.json();
    dataDetails.value.forEach((item) => {
      personaMap[item.fields["System.Title"]] = item.id;
    });
  } else {
    console.error("Aucun Persona trouvé");
    process.exit(1);
  }

  // 2. Tableau de User Stories à créer
  const stories = [
    {
      title: "Checklist : estimation du paramétrage",
      desc: "En tant qu'Avocat Associé je veux voir le temps total de paramétrage afin de valider le budget.",
      personas: ["Persona : Avocat Associé"],
    },
    {
      title: "Checklist : saisie rapide",
      desc: "En tant qu'Avocat Collaborateur je veux saisir les options via des switches pour gagner du temps.",
      personas: ["Persona : Avocat Collaborateur"],
    },
    {
      title: "Exports comptables",
      desc: "En tant que Responsable Comptable je veux exporter les données au format CSV pour la compta.",
      personas: ["Persona : Responsable Comptable"],
    },
    {
      title: "Module formation",
      desc: "En tant que Formateur Septeo je veux voir le nombre de jours de formation pour planifier mes interventions.",
      personas: ["Persona : Formateur Septeo"],
    },
  ];

  // 3. Création et liens
  for (const s of stories) {
    // patch body pour la création
    const patch = [
      { op: "add", path: "/fields/System.Title", value: s.title },
      { op: "add", path: "/fields/System.Description", value: s.desc },
      { op: "add", path: "/fields/System.Tags", value: "Story" },
    ];

    // ajouter relations vers personas
    s.personas.forEach((pTitle) => {
      const pid = personaMap[pTitle];
      if (pid) {
        patch.push({
          op: "add",
          path: "/relations/-",
          value: {
            rel: "System.LinkTypes.Related",
            url: `https://dev.azure.com/${ORG}/_apis/wit/workItems/${pid}`,
            attributes: { comment: "Linked persona" },
          },
        });
      }
    });

    const resCreate = await fetch(
      `https://dev.azure.com/${ORG}/${PROJECT}/_apis/wit/workitems/$User%20Story?api-version=7.0`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json-patch+json",
          Authorization: `Basic ${AUTH}`,
        },
        body: JSON.stringify(patch),
      }
    );
    const data = await resCreate.json();
    if (resCreate.ok) {
      console.log(`✅ Story ${data.id} créée et liée aux personas`);
    } else {
      console.error(`❌ Erreur story ${s.title}:`, data);
    }
  }
})();
