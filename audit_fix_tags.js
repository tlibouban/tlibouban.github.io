// audit_fix_tags.js
// -----------------------------------------------------------------------------
// Objectif :
//   1. Lister tous les Work Items du projet Azure DevOps
//   2. Identifier ceux qui n'ont pas de tags ou pas de Story Points (SP)
//   3. Ajouter un tag par défaut (configurable) et/ou un SP de base
// -----------------------------------------------------------------------------

import "dotenv/config";
import fetchPkg from "node-fetch";
const fetch = (...args) => fetchPkg(...args);

// -- Config -------------------------------------------------------------------
const ORG = process.env.ADO_ORG || "Septeo-SECIB";
const PROJECT = process.env.ADO_PROJECT || "OnboardingClient";
const PAT = process.env.AZURE_DEVOPS_PAT;

if (!PAT) {
  console.error("[ERREUR] Variable AZURE_DEVOPS_PAT manquante.");
  process.exit(1);
}

const DEFAULT_TAG = process.env.DEFAULT_TAG || "Backlog"; // Tag ajouté s'il manque
const DEFAULT_SP = Number(process.env.DEFAULT_SP || 3); // Effort par défaut
const DRY_RUN = process.env.DRY_RUN === "true"; // Pas d'écriture si true

const AUTH = Buffer.from(":" + PAT).toString("base64");
const apiProj = (path, method = "GET", body) =>
  fetch(`https://dev.azure.com/${ORG}/${PROJECT}/_apis${path}`, {
    method,
    headers: {
      Authorization: `Basic ${AUTH}`,
      ...(method === "PATCH"
        ? { "Content-Type": "application/json-patch+json" }
        : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

// Fetch all active Work Items via WIQL -------------------------------------------------
const getAllWorkItemIds = async () => {
  const wiql = {
    query: `SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = '${PROJECT}' AND [System.State] <> 'Removed'`,
  };
  const res = await apiProj("/wit/wiql?api-version=7.0", "POST", wiql);
  if (!res.ok) {
    console.error("Erreur WIQL", await res.text());
    process.exit(1);
  }
  const data = await res.json();
  return data.workItems.map((w) => w.id);
};

// Batch read details (max 200 ids per call) -----------------------------------
const getWorkItems = async (ids) => {
  if (ids.length === 0) return [];
  const chunk = ids.join(",");
  const url = `/wit/workitemsbatch?api-version=7.0`;
  const body = {
    ids,
    fields: [
      "System.Id",
      "System.Title",
      "System.Tags",
      "Microsoft.VSTS.Scheduling.StoryPoints",
    ],
  };
  const res = await apiProj(url, "POST", body);
  if (!res.ok) throw new Error(`Erreur lecture batch: ${await res.text()}`);
  const json = await res.json();
  return json.value;
};

const updateWorkItem = async (id, tags, storyPoints) => {
  const patch = [];
  if (tags !== undefined) {
    patch.push({ op: "add", path: "/fields/System.Tags", value: tags });
  }
  if (storyPoints !== undefined) {
    patch.push({
      op: "add",
      path: "/fields/Microsoft.VSTS.Scheduling.StoryPoints",
      value: storyPoints,
    });
  }
  if (patch.length === 0) return;
  console.log(`→ Mise à jour WI #${id}`, DRY_RUN ? "[DRY RUN]" : "");
  if (DRY_RUN) return;
  const res = await apiProj(
    `/wit/workitems/${id}?api-version=7.0`,
    "PATCH",
    patch
  );
  if (!res.ok) console.error("⚠️  Update failed", id, await res.text());
};

(async () => {
  console.log("Audit des Work Items…");
  const ids = await getAllWorkItemIds();
  console.log(`Total WI: ${ids.length}`);
  // Traiter par batch de 200
  for (let i = 0; i < ids.length; i += 200) {
    const slice = ids.slice(i, i + 200);
    const items = await getWorkItems(slice);
    for (const wi of items) {
      const id = wi.id;
      const title = wi.fields["System.Title"];
      const tags = wi.fields["System.Tags"] || "";
      const sp = wi.fields["Microsoft.VSTS.Scheduling.StoryPoints"];

      const needTag = tags.trim() === "";
      const needSP = sp === undefined || sp === null;

      if (needTag || needSP) {
        const newTags = needTag ? DEFAULT_TAG : tags;
        const newSP = needSP ? DEFAULT_SP : undefined;
        console.log(
          `- WI #${id} « ${title} » : manquant →`,
          needTag ? "Tag" : "",
          needSP ? "SP" : ""
        );
        await updateWorkItem(id, newTags, newSP);
      }
    }
  }
  console.log("Audit terminé.");
})();
