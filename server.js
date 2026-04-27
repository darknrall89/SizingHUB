import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(cors());
app.use(express.json({ limit: "20mb" }));

// ─── /api/analyze ─────────────────────────────────────────────────────────────
app.post("/api/analyze", async (req, res) => {
  try {
    const { project, files } = req.body;
    const filesContent = files
      .filter(f => f.text)
      .map(f => "\n\n=== FICHIER: " + f.name + " (" + f.type.toUpperCase() + ") ===\n" + f.text.slice(0, 8000))
      .join("");

    const prompt = "Tu es un expert avant-vente IT. Analyse les documents fournis pour le projet \"" + project.name + "\" du client \"" + project.client + "\".\n" +
      (project.context ? "\nContexte additionnel: " + project.context : "") +
      filesContent +
      "\n\nReponds UNIQUEMENT en JSON valide:\n" +
      '{"synthesis":"Résumé exécutif 3-4 phrases","enjeux":["enjeu 1","enjeu 2","enjeu 3"],"tags":["tag1","tag2","tag3","tag4"],' +
      '"axes":[{"ico":"⏱","label":"Disponibilité & Continuité","sub":"PRA/PCA, RPO, RTO","prio":"high"},{"ico":"🔒","label":"Sécurité","sub":"Segmentation, conformité","prio":"high"},{"ico":"🌐","label":"Réseau & Connectivité","sub":"MPLS, VPN","prio":"med"},{"ico":"🖥","label":"Infrastructure existante","sub":"Capacité, obsolescence","prio":"med"},{"ico":"☁️","label":"Cloud & Hébergement","sub":"Stratégie cloud","prio":"low"}],' +
      '"alerts":[{"type":"warn","text":"Point d attention détecté"}],' +
      '"data":{"vmCount":null,"totalRAM_GB":null,"totalCPU_cores":null,"totalStorage_TB":null}}\n' +
      "Prio: high/med/low. data: valeurs numériques si trouvées sinon null. JSON uniquement.";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].text;
    const result = JSON.parse(raw.replace(/```json|```/g, "").trim());
    res.json(result);
  } catch (err) {
    console.error("Erreur /api/analyze:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── /api/questions ───────────────────────────────────────────────────────────
app.post("/api/questions", async (req, res) => {
  try {
    const { project, analysis, files = [] } = req.body;
    console.log("Files reçus:", files.length, files.map(f => f.name + " - " + (f.text || "").length + " chars"));

    const rawContent = files
      .filter(f => f.text)
      .map(f => "\n\n=== FICHIER: " + f.name + " ===\n" + f.text.slice(0, 12000))
      .join("");

    const enjeux = (analysis.enjeux || []).join("\n");
    const axes = (analysis.axes || []).map(a => "- " + a.label + " (" + a.prio + "): " + a.sub).join("\n");
    const alerts = (analysis.alerts || []).map(a => a.text).join("\n");
    const data = JSON.stringify(analysis.data || {});

    const systemPrompt = [
      "Tu es un architecte infrastructure senior avec 15+ ans d'experience en avant-vente (datacenter, virtualisation, PRA, reseau, cloud hybride).",
      "Tu reponds a un appel d'offres et ton objectif est d'AIDER A GAGNER LE DEAL.",
      "Tu analyses un CCTP reel dans le cadre d'une reponse a appel d'offres.",
      "",
      "OBJECTIF: Generer UNIQUEMENT des questions a forte valeur avant-vente permettant:",
      "- d'identifier les incoherences techniques",
      "- de detecter les risques projet",
      "- de clarifier les choix d'architecture",
      "- d'aider a construire une solution pertinente",
      "",
      "REGLES ABSOLUES:",
      "- NE genere PAS de questions generiques applicables a n'importe quel projet",
      "- NE pose PAS de questions dont la reponse est deja dans le document",
      "- NE reformule PAS le document",
      "- CHAQUE question reference un element CONCRET et PRECIS du document (chiffre, equipement, contrainte nommee)",
      "- IDENTIFIE et questionne les INCOHERENCES entre existant et cible",
      "- IDENTIFIE les angles morts non explicites",
      "",
      "CATEGORIES OBLIGATOIRES (toutes doivent etre representees):",'
      "- CRITIQUE (prio=high): bloque le design ou le chiffrage",
      "- IMPORTANT (prio=med): choix architecture, dependances, contraintes",
      "- OPTIMISATION (prio=low): amelioration, cout, performance",
      "- INFRA_EXISTANTE: min 30% sur l'existant reel non documente",
      "- DECISION (prio=high, category=DECISION): 3 questions minimum qui forcent un choix architectural (ex: HCI vs 3-tiers, VMware vs alternative)",
      "- CHALLENGE (prio=high, category=CHALLENGE): 3 questions minimum qui challengent les hypotheses client (ex: projection 750 vCPU documentee ou marge securite ?)",
      "- BUSINESS (prio=med, category=BUSINESS): 2 questions minimum sur budget/arbitrage/strategie",
      "",
      "AXES RESEAU A COUVRIR OBLIGATOIREMENT:",
      "- QoS sur switches Dell S5224F (flux stockage vs applicatif)",
      "- Segmentation reelle inter-LAN",
      "- Flux MPLS/Equinix entre PA6 et PA5",
      "- Isolation vSAN/replication Veeam",
      "- CRITIQUE (prio=high): bloque le design ou le chiffrage, contradictions majeures, risques architecture",
      "- IMPORTANT (prio=med): choix architecture, dependances techniques, contraintes reseau/PRA/VM",
      "- OPTIMISATION (prio=low): amelioration infra, gains cout, performance",
      "- INFRA_EXISTANTE: minimum 30% des questions sur l'existant reel non documente",
      "",
      "AXES OBLIGATOIRES: Virtualisation VMware/vCPU/licensing, Compute CPU/RAM, Stockage full-flash/volumetrie/IOPS, Reseau switch/VLAN/management, PRA/sauvegarde Veeam, Architecture HCI vs 3-tier, Migration",
      "",
      'FORMAT: {"questions":[{"text":"Question precise?","prio":"high","axis":"Axe","category":"CRITIQUE"}]}',
      "18-22 questions. Min 30% INFRA_EXISTANTE. 3 DECISION + 3 CHALLENGE + 2 BUSINESS obligatoires. JSON uniquement."
    ].join("\n");

    const userPrompt = [
      "Projet: " + project.name + " | Client: " + project.client,
      project.context ? "Contexte AV: " + project.context : "",
      "",
      "SYNTHESE:",
      analysis.synthesis,
      "",
      "ENJEUX:",
      enjeux,
      "",
      "AXES:",
      axes,
      "",
      "DONNEES EXTRAITES:",
      data,
      "",
      "ALERTES:",
      alerts,
      "",
      "CONTENU BRUT DES DOCUMENTS:",
      rawContent,
      "",
      "Analyse le contenu brut et genere des questions pointues basees sur les elements concrets trouves."
    ].join("\n");

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = message.content[0].text;
    let clean = raw.replace(/```json|```/g, "").trim();
    // Extraire uniquement le JSON entre { et }
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start !== -1 && end !== -1) clean = clean.slice(start, end + 1);
    const result = JSON.parse(clean);
    res.json(result);
  } catch (err) {
    console.error("Erreur /api/questions:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── /api/variants ────────────────────────────────────────────────────────────
app.post("/api/variants", async (req, res) => {
  try {
    const { project, analysis, questions } = req.body;

    const prompt = "Tu es un expert avant-vente IT.\nGenere 3 variantes de solution pour le projet \"" + project.name + "\" (client: " + project.client + ").\n\nSynthese: " + analysis.synthesis + "\nEnjeux: " + (analysis.enjeux || []).join(", ") + "\n\nReponds UNIQUEMENT en JSON:\n" +
      '{"variants":[{"title":"On-Premises renforce","description":"Description courte","score":85,"complexity_infra":70,"complexity_deploy":60,"axes":["Infrastructure","Securite"],"pros":["avantage 1"],"cons":["inconvenient 1"],"recommended":true}]}\n' +
      "3 variantes (On-Prem, Cloud/Hybride, Infogérance). Score 0-100. recommended: true pour la meilleure. JSON uniquement.";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].text;
    const result = JSON.parse(raw.replace(/```json|```/g, "").trim());
    res.json(result);
  } catch (err) {
    console.error("Erreur /api/variants:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── /api/health ──────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => res.json({ status: "ok", version: "1.0.0" }));

app.listen(port, "0.0.0.0", () => console.log("SizingHub API -> http://localhost:" + port));
