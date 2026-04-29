import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config();

const app  = express();
const port = process.env.PORT || 3001;
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ─── POST /api/analyze ────────────────────────────────────────────────────────
// Reçoit : { project, files: [{ name, type, text }] }
// Retourne: { synthesis, enjeux, tags, axes, alerts, data }
app.post("/api/analyze", async (req, res) => {
  try {
    const { project, files } = req.body;

    const filesContent = files
      .filter(f => f.text)
      .map(f => `\n\n=== FICHIER: ${f.name} (${f.type.toUpperCase()}) ===\n${f.text.slice(0, 40000)}`)
      .join("");

    const prompt = `Tu es un expert avant-vente IT. Analyse les documents fournis pour le projet "${project.name}" du client "${project.client}".
${project.context ? `\nContexte additionnel: ${project.context}` : ""}
${filesContent}

Réponds UNIQUEMENT en JSON valide avec cette structure:
{
  "synthesis": "Résumé exécutif 3-4 phrases",
  "enjeux": ["enjeu 1", "enjeu 2", "enjeu 3"],
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "axes": [
    { "ico": "⏱", "label": "Disponibilité & Continuité", "sub": "PRA/PCA, RPO, RTO", "prio": "high" },
    { "ico": "🔒", "label": "Sécurité", "sub": "Segmentation, conformité", "prio": "high" },
    { "ico": "🌐", "label": "Réseau & Connectivité", "sub": "MPLS, VPN", "prio": "med" },
    { "ico": "🖥", "label": "Infrastructure existante", "sub": "Capacité, obsolescence", "prio": "med" },
    { "ico": "☁️", "label": "Cloud & Hébergement", "sub": "Stratégie cloud", "prio": "low" }
  ],
  "alerts": [{ "type": "warn", "text": "Point d'attention détecté" }],
  "data": { "vmCount": null, "totalRAM_GB": null, "totalCPU_cores": null, "totalStorage_TB": null }
}
Prio: high/med/low. data: valeurs numériques si trouvées sinon null. JSON uniquement.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const raw   = message.content[0].text;
    const clean = raw.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);
    res.json(result);
  } catch (err) {
    console.error("Erreur /api/analyze:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/questions ──────────────────────────────────────────────────────
// Reçoit : { project, analysis }
// Retourne: { questions: [{ text, prio, axis }] }
app.post("/api/questions", async (req, res) => {
  try {
    const { project, analysis } = req.body;

    const prompt = `Tu es un expert avant-vente IT. 
Génère 12 questions précises à poser au client pour qualifier le projet "${project.name}" (client: ${project.client}).

Contexte du projet:
${analysis.synthesis}

Axes identifiés: ${analysis.axes.map(a => a.label).join(", ")}

Réponds UNIQUEMENT en JSON:
{
  "questions": [
    { "text": "Question précise ?", "prio": "high", "axis": "Disponibilité & Continuité" }
  ]
}
Génère exactement 12 questions. Prio: high (4), med (5), low (3). JSON uniquement.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw    = message.content[0].text;
    const clean  = raw.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);
    res.json(result);
  } catch (err) {
    console.error("Erreur /api/questions:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/variants ───────────────────────────────────────────────────────
// Reçoit : { project, analysis, questions }
// Retourne: { variants: [{ title, description, score, complexity, axes, pros, cons }] }
app.post("/api/variants", async (req, res) => {
  try {
    const { project, analysis, questions } = req.body;

    const prompt = `Tu es un expert avant-vente IT.
Génère 3 variantes de solution pour le projet "${project.name}" (client: ${project.client}).

Synthèse: ${analysis.synthesis}
Enjeux: ${analysis.enjeux.join(", ")}

Réponds UNIQUEMENT en JSON:
{
  "variants": [
    {
      "title": "On-Premises renforcé",
      "description": "Description courte de la variante",
      "score": 85,
      "complexity_infra": 70,
      "complexity_deploy": 60,
      "axes": ["Infrastructure", "Sécurité"],
      "pros": ["avantage 1", "avantage 2"],
      "cons": ["inconvénient 1"],
      "recommended": true
    }
  ]
}
Génère 3 variantes (On-Prem, Cloud/Hybride, Infogérance). Score 0-100. recommended: true pour la meilleure. JSON uniquement.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw    = message.content[0].text;
    const clean  = raw.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);
    res.json(result);
  } catch (err) {
    console.error("Erreur /api/variants:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/health ──────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => res.json({ status: "ok", version: "1.0.0" }));

app.listen(port, "0.0.0.0", () => console.log(`SizingHub API → http://localhost:${port}`));
