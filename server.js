import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import multer from "multer";

dotenv.config();

const app       = express();
const port      = process.env.PORT || 3001;
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const upload    = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

app.use(cors());
app.use(express.json({ limit: "5mb" }));

// ─── POST /api/upload ─────────────────────────────────────────────────────────
// Reçoit : multipart/form-data avec un ou plusieurs fichiers
// Retourne: [{ file_id, name, size, type }]
app.post("/api/upload", upload.array("files", 10), async (req, res) => {
  try {
    const results = [];
    for (const file of req.files) {
      const blob = new Blob([file.buffer], { type: file.mimetype });
      const uploaded = await anthropic.beta.files.upload(
        { file: new File([blob], file.originalname, { type: file.mimetype }) },
        { headers: { "anthropic-beta": "files-api-2025-04-14" } }
      );
      results.push({ file_id: uploaded.id, name: file.originalname, size: file.size, type: file.mimetype });
    }
    res.json({ files: results });
  } catch (err) {
    console.error("Erreur /api/upload:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/analyze ───────────────────────────────────────────────────────
// Reçoit : { project, files: [{ file_id, name, type }] }
// Retourne: { synthesis, enjeux, tags, axes, alerts, data, projectType, understanding }
app.post("/api/analyze", async (req, res) => {
  try {
    const { project, files } = req.body;

    const fileContents = files.map(f => {
      if (f.type === "application/pdf" || f.type.includes("wordprocessingml") || f.type.includes("msword")) {
        return { type: "document", source: { type: "file", file_id: f.file_id }, title: f.name };
      }
      return null;
    }).filter(Boolean);

    const textFiles = files.filter(f =>
      f.type.includes("spreadsheet") || f.type.includes("excel") || f.type === "text/plain"
    );

    const prompt = [
      "Tu es un architecte infrastructure senior avec 15+ ans d'experience en avant-vente.",
      "Projet: " + project.name + " | Client: " + project.client,
      project.context ? "Contexte: " + project.context : "",
      textFiles.length > 0 ? "Fichiers non-PDF joints: " + textFiles.map(f => f.name).join(", ") : "",
      "",
      "Analyse TOUS les documents fournis et reponds en JSON strict:",
      '{',
      '  "synthesis": "Synthese executive 3-4 phrases",',
      '  "enjeux": ["enjeu 1", "enjeu 2", "enjeu 3"],',
      '  "tags": ["tag1", "tag2", "tag3"],',
      '  "projectType": "ENTERPRISE_DC|CRITICAL_INDUSTRIAL|SMB|CLOUD_MIGRATION|HARDWARE_ACQUISITION",',
      '  "axes": [{ "ico": "⏱", "label": "Axe", "sub": "detail", "prio": "high|med|low" }],',
      '  "alerts": [{ "type": "warn|info", "text": "point attention" }],',
      '  "data": { "vmCount": null, "totalRAM_GB": null, "totalCPU_cores": null, "totalStorage_TB": null },',
      '  "understanding": {',
      '    "projectSummary": "Resume precis du projet",',
      '    "existingArch": { "servers": "", "storage": "", "network": "", "virtualization": "", "backup": "" },',
      '    "targetArch": { "servers": "", "storage": "", "network": "", "virtualization": "", "backup": "" },',
      '    "knownFacts": ["fait documente 1", "fait documente 2"],',
      '    "blindSpots": ["element manquant 1", "element manquant 2"],',
      '    "inconsistencies": ["incoherence detectee"],',
      '    "riskAreas": ["zone de risque"]',
      '  }',
      '}',
      "JSON uniquement."
    ].join("\n");

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4000,
      messages: [{
        role: "user",
        content: [
          ...fileContents,
          { type: "text", text: prompt }
        ]
      }],
      betas: ["files-api-2025-04-14"],
    });

    const raw   = message.content[0].text;
    const clean = raw.replace(/```json|```/g, "").trim();
    const start = clean.indexOf("{");
    const end   = clean.lastIndexOf("}");
    const result = JSON.parse(clean.slice(start, end + 1));
    res.json(result);
  } catch (err) {
    console.error("Erreur /api/analyze:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/questions ─────────────────────────────────────────────────────
// Reçoit : { project, analysis, files }
// Retourne: { questions: [{ text, prio, axis, category }] }
app.post("/api/questions", async (req, res) => {
  try {
    const { project, analysis, files = [] } = req.body;

    const fileContents = files.map(f => {
      if (f.type === "application/pdf" || f.type.includes("wordprocessingml")) {
        return { type: "document", source: { type: "file", file_id: f.file_id }, title: f.name };
      }
      return null;
    }).filter(Boolean);

    const SPECIALIZED = {
      CRITICAL_INDUSTRIAL: "Infrastructure critique industrielle (SCADA, OT, telégestion). Focus: continuite operationnelle, protocoles industriels, HA avec peu de noeuds, latence temps reel, certifications sectorielles.",
      ENTERPRISE_DC: "Grand datacenter entreprise. Focus: VMware licensing, capacity planning, PRA/PCA, reseau VLAN/QoS, stockage IOPS, migration.",
      SMB: "PME petite infrastructure. Focus: simplicite, TCO, support constructeur, evolutivite.",
      CLOUD_MIGRATION: "Migration cloud hybride. Focus: strategie migration, dependances applicatives, couts, souverainete.",
      HARDWARE_ACQUISITION: "Acquisition materielle. Focus: compatibilite existant, contraintes datacenter, support, evolutivite.",
    };

    const systemPrompt = [
      "Tu es un architecte infrastructure senior avec 15+ ans d'experience en avant-vente.",
      "TYPE DE PROJET: " + (analysis.projectType || "ENTERPRISE_DC"),
      SPECIALIZED[analysis.projectType] || SPECIALIZED.ENTERPRISE_DC,
      "",
      "REGLES ABSOLUES:",
      "- NE pose PAS de questions dont la reponse est deja clairement dans les documents",
      "- CHAQUE question reference un element CONCRET du document",
      "- IDENTIFIE les incoherences entre existant et cible",
      "- Chaque question doit DEBLOQUER une decision technique en RDV",
      "",
      "CATEGORIES (toutes requises):",
      "- CRITIQUE (prio=high, 5): bloque le design ou le chiffrage",
      "- IMPORTANT (prio=med, 5): choix architecture, dependances",
      "- DECISION (prio=high, 3): force un choix architectural",
      "- CHALLENGE (prio=high, 2): challenge une hypothese client",
      "- OPTIMISATION (prio=low, 3): amelioration, cout, perf",
      "",
      'FORMAT: {"questions":[{"text":"?","prio":"high","axis":"Axe","category":"CRITIQUE"}]}',
      "18 questions max. JSON uniquement."
    ].join("\n");

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{
        role: "user",
        content: [
          ...fileContents,
          { type: "text", text: "Projet: " + project.name + " | Client: " + project.client + "\n\nFICHE DE COMPREHENSION:\n" + JSON.stringify(analysis.understanding, null, 2) + "\n\nFAITS CONNUS (ne pas poser de questions sur ces points):\n" + (analysis.understanding?.knownFacts || []).join("\n") + "\n\nGenere des questions pointues basees sur les zones grises et incoherences detectees." }
        ]
      }],
      betas: ["files-api-2025-04-14"],
    });

    const raw   = message.content[0].text;
    const clean = raw.replace(/```json|```/g, "").trim();
    const start = clean.indexOf("{");
    const end   = clean.lastIndexOf("}");
    const result = JSON.parse(clean.slice(start, end + 1));
    res.json(result);
  } catch (err) {
    console.error("Erreur /api/questions:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/agenda ────────────────────────────────────────────────────────
// Reçoit : { project, analysis, questions, answers, selectedVariant }
// Retourne: { agenda: { sections: [...] } }
app.post("/api/agenda", async (req, res) => {
  try {
    const { project, analysis, questions = [], answers = {}, notes = "" } = req.body;

    const answeredQs = questions
      .map((q, i) => answers[i] ? "Q: " + q.text + "\nR: " + answers[i] : null)
      .filter(Boolean).join("\n\n");

    const prompt = [
      "Tu es un expert avant-vente IT qui redige des reponses a appel d'offres.",
      "Genere un agenda detaille pour repondre au projet: " + project.name + " (client: " + project.client + ")",
      "",
      "CONTEXTE:",
      analysis.understanding?.projectSummary || analysis.synthesis,
      "",
      "ENJEUX: " + (analysis.enjeux || []).join(", "),
      "",
      answeredQs ? "REPONSES CLIENT:\n" + answeredQs : "",
      notes ? "NOTES AV:\n" + notes : "",
      "",
      "Genere un agenda de reponse professionnel en JSON:",
      '{',
      '  "title": "Titre de la proposition",',
      '  "sections": [',
      '    {',
      '      "id": "s1",',
      '      "title": "Titre de la section",',
      '      "objective": "Objectif de cette section",',
      '      "content_points": ["point cle 1", "point cle 2"],',
      '      "placeholder": "[A COMPLETER PAR LAV]",',
      '      "duration_min": 15',
      '    }',
      '  ],',
      '  "total_duration_min": 90,',
      '  "preparation_tips": ["conseil 1", "conseil 2"]',
      '}',
      "Genere 6-8 sections. JSON uniquement."
    ].join("\n");

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw   = message.content[0].text;
    const clean = raw.replace(/```json|```/g, "").trim();
    const start = clean.indexOf("{");
    const end   = clean.lastIndexOf("}");
    const result = JSON.parse(clean.slice(start, end + 1));
    res.json(result);
  } catch (err) {
    console.error("Erreur /api/agenda:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/generate-pptx-content ─────────────────────────────────────────
app.post("/api/generate-pptx-content", async (req, res) => {
  try {
    const { project, analysis, questions, answers = {}, agenda } = req.body;

    const answeredQs = (questions || [])
      .map((q, i) => answers[i] ? "Q: " + q.text + "\nR: " + answers[i] : null)
      .filter(Boolean).join("\n\n");

    const prompt = [
      "Tu es un expert avant-vente IT qui redige des propositions techniques professionnelles.",
      "Genere le contenu narratif enrichi d'un PowerPoint pour: " + project.name + " (client: " + project.client + ")",
      "",
      "SYNTHESE: " + analysis.synthesis,
      "ENJEUX: " + (analysis.enjeux || []).join(", "),
      answeredQs ? "REPONSES CLIENT:\n" + answeredQs : "",
      agenda ? "AGENDA:\n" + JSON.stringify(agenda) : "",
      "",
      'FORMAT JSON:',
      '{',
      '  "slide_cover": { "title": "", "subtitle": "" },',
      '  "slide_context": { "intro": "", "situation": "", "challenge": "" },',
      '  "slide_enjeux": { "intro": "", "items": [] },',
      '  "slide_solution": { "pitch": "", "differenciants": [], "architecture_narrative": "" },',
      '  "slide_benefits": { "intro": "", "benefits": [{ "title": "", "desc": "" }] },',
      '  "slide_risks": { "intro": "", "items": [{ "risk": "", "mitigation": "" }] },',
      '  "slide_next_steps": { "intro": "", "steps": [{ "step": "", "desc": "", "delai": "" }] },',
      '  "slide_conclusion": { "pitch_final": "", "call_to_action": "" }',
      '}',
      "JSON uniquement."
    ].join("\n");

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw   = message.content[0].text;
    const clean = raw.replace(/```json|```/g, "").trim();
    const start = clean.indexOf("{");
    const end   = clean.lastIndexOf("}");
    const result = JSON.parse(clean.slice(start, end + 1));
    res.json(result);
  } catch (err) {
    console.error("Erreur /api/generate-pptx-content:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/health ──────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => res.json({ status: "ok", version: "2.0.0" }));

app.listen(port, "0.0.0.0", () => console.log("SizingHub API v2 -> http://localhost:" + port));
