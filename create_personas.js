const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const ORG = "Septeo-SECIB";
const PROJECT = "OnboardingClient";
const PAT = process.env.AZURE_DEVOPS_PAT;
if (!PAT) {
  console.error(
    "Veuillez définir la variable d'env AZURE_DEVOPS_PAT avec votre PAT Azure DevOps"
  );
  process.exit(1);
}
const auth = Buffer.from(":" + PAT).toString("base64");

const personas = [
  { title: "Persona : Avocat Associé", desc: "Décideur, valide le budget" },
  {
    title: "Persona : Avocat Collaborateur",
    desc: `Utilisateur quotidien de l'application`,
  },
  {
    title: "Persona : Secrétaire",
    desc: `Production et mise en forme d'actes`,
  },
  { title: "Persona : Responsable IT", desc: "Administration technique" },
  {
    title: "Persona : Responsable Comptable",
    desc: "Exports comptables, suivi facturation",
  },
  { title: "Persona : Commercial Septeo", desc: "Avant-vente, upsell" },
  { title: "Persona : CSM Septeo", desc: "Suivi post-vente, satisfaction" },
  { title: "Persona : Formateur Septeo", desc: "Anime les formations" },
  {
    title: "Persona : Support Technique",
    desc: "Gestion des tickets techniques",
  },
  {
    title: "Persona : DevOps / SRE",
    desc: "Surveillance, automatisation CI/CD",
  },
];

(async () => {
  for (const p of personas) {
    const url = `https://dev.azure.com/${ORG}/${PROJECT}/_apis/wit/workitems/$User%20Story?api-version=7.1-preview.3`;
    const body = [
      { op: "add", path: "/fields/System.Title", value: p.title },
      { op: "add", path: "/fields/System.Description", value: p.desc },
      { op: "add", path: "/fields/System.Tags", value: "Persona" },
    ];
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json-patch+json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        console.log(`✅ Créé: ${data.id} - ${p.title}`);
      } else {
        const txt = await res.text();
        console.error(`❌ Erreur pour ${p.title}: ${res.status} ${txt}`);
      }
    } catch (err) {
      console.error("Exception", err);
    }
  }
})();
