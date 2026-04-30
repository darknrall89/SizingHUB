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
      .map(f => `\n\n=== FICHIER: ${f.name} (${f.type.toUpperCase()}) ===\n${f.text.slice(0, 60000)}`)
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
Prio: high/med/low. data: valeurs numériques si trouvées sinon null.
projectType: classe le projet parmi ces types:
- ENTERPRISE_DC: grand datacenter, infra complexe, >50 VMs, multi-sites
- CRITICAL_INDUSTRIAL: infra critique industrielle (SCADA, OT, télégestion, énergie, santé)
- SMB: PME, petite infra, <20 VMs, budget limité
- CLOUD_MIGRATION: migration cloud, hybride, SaaS
- HARDWARE_ACQUISITION: achat matériel simple, peu de VMs, cluster minimaliste
JSON uniquement.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
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
    const { project, analysis, files = [], understanding = null } = req.body;
    console.log("Files reçus:", files.length, files.map(f => f.name + " - " + (f.text || "").length + " chars"));
    console.log("Project type:", analysis.projectType);
    console.log("Understanding:", understanding ? "disponible" : "absent");

    const rawContent = files
      .filter(f => f.text)
      .map(f => "\n\n=== FICHIER: " + f.name + " ===\n" + f.text.slice(0, 60000))
      .join("");

    const enjeux = (analysis.enjeux || []).join("\n");
    const axes = (analysis.axes || []).map(a => "- " + a.label + " (" + a.prio + "): " + a.sub).join("\n");
    const alerts = (analysis.alerts || []).map(a => a.text).join("\n");
    const data = JSON.stringify(analysis.data || {});
    const projectType = analysis.projectType || "ENTERPRISE_DC";

    // Prompts spécialisés par type de projet
    const SPECIALIZED_CONTEXTS = {
      ENTERPRISE_DC: [
        "CONTEXTE: Grand datacenter d'entreprise, infra complexe, potentiellement >50 VMs, multi-sites.",
        "FOCUS OBLIGATOIRE: VMware licensing (cœurs, sockets), capacity planning détaillé, PRA/PCA, réseau (VLAN, QoS, uplinks), stockage (IOPS, dédup, tiering), migration à chaud.",
        "CHALLENGE: Incohérences chiffrées, contradictions capacity planning vs licensing, risques migration."
      ],
      CRITICAL_INDUSTRIAL: [
        "CONTEXTE: Infrastructure critique industrielle (SCADA, OT, télégestion, énergie, santé). Qualité et disponibilité > volume.",
        "FOCUS OBLIGATOIRE: Continuité opérationnelle (impact métier en cas de panne), protocoles industriels (SCADA/OPC/Modbus), contraintes datacenter spécifiques (EDF, santé...), sécurité OT/IT, HA avec peu de nœuds (quorum, split-brain), latence temps réel.",
        "CHALLENGE: Architecture minimaliste (2 nœuds = vrais risques), dépendances terrain, certifications sectorielles, contraintes réglementaires spécifiques.",
        "NE PAS DEMANDER: Les spécifications techniques déjà présentes dans le CCTP (CPU, RAM, stockage si mentionnés)."
      ],
      SMB: [
        "CONTEXTE: PME, petite infrastructure, budget contraint, équipe IT réduite.",
        "FOCUS OBLIGATOIRE: Simplicité d'administration, coût total (TCO), support constructeur, évolutivité simple, sauvegarde basique.",
        "CHALLENGE: Capacités équipe interne, budget réel, risques de surstockage ou sous-dimensionnement."
      ],
      CLOUD_MIGRATION: [
        "CONTEXTE: Migration vers le cloud ou architecture hybride.",
        "FOCUS OBLIGATOIRE: Stratégie de migration (lift & shift vs refactoring), dépendances applicatives, coûts cloud vs on-prem, latence, souveraineté des données, réversibilité.",
        "CHALLENGE: Applications non cloud-ready, coûts cachés, dépendances réseau, conformité RGPD."
      ],
      HARDWARE_ACQUISITION: [
        "CONTEXTE: Acquisition matérielle simple, cluster minimaliste, peu de VMs.",
        "FOCUS OBLIGATOIRE: Compatibilité avec l'existant (hyperviseur, réseau, firewall), contraintes physiques datacenter, support constructeur, évolutivité matérielle.",
        "CHALLENGE: Adéquation specs demandées vs usage réel, risques HA avec peu de nœuds, contraintes intégration site."
      ]
    };

    const specializedContext = (SPECIALIZED_CONTEXTS[projectType] || SPECIALIZED_CONTEXTS.ENTERPRISE_DC).join("\n");

    const systemPrompt = [
      "Tu es un architecte infrastructure senior avec 15+ ans d'experience en avant-vente.",
      "Tu analyses un CCTP reel dans le cadre d'une reponse a appel d'offres.",
      "",
      "TYPE DE PROJET DETECTE: " + projectType,
      specializedContext,
      "",
      "REGLES ABSOLUES:",
      "- NE genere PAS de questions generiques applicables a n'importe quel projet",
      "- NE pose PAS de questions dont la reponse est deja clairement dans le document",
      "- NE reformule PAS le document",
      "- CHAQUE question reference un element CONCRET et PRECIS du document",
      "- IDENTIFIE les incoherences entre existant et cible",
      "- IDENTIFIE les angles morts non explicites",
      "- Chaque question doit DEBLOQUER une decision technique en RDV client",
      "",
      "CATEGORIES OBLIGATOIRES:",
      "- CRITIQUE (prio=high, 5 questions): bloque le design ou le chiffrage",
      "- IMPORTANT (prio=med, 6 questions): choix architecture, dependances, contraintes",
      "- OPTIMISATION (prio=low, 4 questions): amelioration, cout, performance",
      "- DECISION (prio=high, 3 questions): force un choix architectural cle",
      "- CHALLENGE (prio=high, 2 questions): challenge une hypothese client",
      "",
      'FORMAT: {"questions":[{"text":"Question precise?","prio":"high","axis":"Axe","category":"CRITIQUE"}]}',
      "15-18 questions. JSON uniquement."
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
      "CONTENU BRUT DES DOCUMENTS (lis attentivement avant de generer les questions):",
      rawContent,
      "",
      understanding ? "\n\nFICHE DE COMPREHENSION PROJET (BASE POUR LES QUESTIONS):" : "",
      understanding ? JSON.stringify(understanding, null, 2) : "",
      "",
      understanding ? "IMPORTANT: Ne pose PAS de questions sur les knownFacts ci-dessus. Concentre-toi sur les blindSpots, inconsistencies et riskAreas." : "",
      "",
      "Genere des questions pointues adaptees au type de projet " + projectType + "."
    ].join("\n");

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = message.content[0].text;
    let clean = raw.replace(/```json|```/g, "").trim();
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


// ─── POST /api/variants ───────────────────────────────────────────────────────
// Reçoit : { project, analysis, questions }
// Retourne: { variants: [{ title, description, score, complexity, axes, pros, cons }] }
app.post("/api/understand", async (req, res) => {
  try {
    const { project, analysis, files = [] } = req.body;

    const rawContent = files
      .filter(f => f.text)
      .map(f => "\n\n=== FICHIER: " + f.name + " ===\n" + f.text.slice(0, 60000))
      .join("");

    const systemPrompt = [
      "Tu es un architecte infrastructure senior avec 15+ ans d'experience en avant-vente.",
      "Tu dois produire une FICHE DE COMPREHENSION PROJET avant de generer des questions.",
      "Cette fiche servira de base pour generer des questions pertinentes.",
      "",
      "INSTRUCTIONS:",
      "- Lis TOUT le contenu des documents fournis",
      "- Identifie ce qui EST explicitement dans les documents (ne pas poser de questions sur ces points)",
      "- Identifie ce qui MANQUE ou est ambigu (angles morts = futurs questions)",
      "- Sois factuel et precis",
      "",
      'FORMAT JSON STRICT:',
      '{',
      '  "projectType": "CRITICAL_INDUSTRIAL",',
      '  "projectSummary": "Description precise du projet en 2-3 phrases",',
      '  "existingArch": {',
      '    "servers": "Description precise des serveurs existants",',
      '    "storage": "Description precise du stockage existant",',
      '    "network": "Description precise du reseau existant",',
      '    "virtualization": "Hyperviseur, version, nombre VMs",',
      '    "backup": "Solution de sauvegarde existante"',
      '  },',
      '  "targetArch": {',
      '    "servers": "Ce qui est demande pour les serveurs",',
      '    "storage": "Ce qui est demande pour le stockage",',
      '    "network": "Ce qui est demande pour le reseau",',
      '    "virtualization": "Hyperviseur cible demande",',
      '    "backup": "Sauvegarde cible demandee"',
      '  },',
      '  "knownFacts": [',
      '    "Fait 1 clairement documente",',
      '    "Fait 2 clairement documente"',
      '  ],',
      '  "blindSpots": [',
      '    "Element manquant ou ambigu 1",',
      '    "Element manquant ou ambigu 2"',
      '  ],',
      '  "inconsistencies": [',
      '    "Incoherence detectee entre X et Y"',
      '  ],',
      '  "riskAreas": [',
      '    "Zone de risque identifiee"',
      '  ]',
      '}',
      "JSON uniquement, aucun texte avant ou apres."
    ].join("\n");

    const userPrompt = [
      "Projet: " + project.name + " | Client: " + project.client,
      project.context ? "Contexte: " + project.context : "",
      "",
      "SYNTHESE ETAPE 2:",
      analysis.synthesis,
      "",
      "CONTENU BRUT DES DOCUMENTS:",
      rawContent,
      "",
      "Produis la fiche de comprehension projet."
    ].join("\n");

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = message.content[0].text;
    let clean = raw.replace(/```json|```/g, "").trim();
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start !== -1 && end !== -1) clean = clean.slice(start, end + 1);
    const result = JSON.parse(clean);
    res.json(result);
  } catch (err) {
    console.error("Erreur /api/understand:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/variants", async (req, res) => {
  try {
    const { project, analysis, understanding, questions, answers = {} } = req.body;

    const answeredQuestions = (questions || [])
      .map((q, i) => answers[i] ? "Q: " + q.text + "\nR: " + answers[i] : null)
      .filter(Boolean)
      .join("\n\n");

    const systemPrompt = [
      "Tu es un architecte infrastructure senior avec 15+ ans d'experience en avant-vente.",
      "Tu dois generer 3 variantes de solution adaptees au projet, scorees et comparables.",
      "",
      "REGLES:",
      "- Les variantes doivent etre REELLEMENT DIFFERENTES (pas juste des variantes de prix)",
      "- Chaque variante doit tenir compte des reponses du client si disponibles",
      "- Le score doit refleter l'adequation reelle au besoin specifique du projet",
      "- La variante recommandee doit etre clairement justifiee",
      "- Les pros/cons doivent etre specifiques au contexte, pas generiques",
      "",
      'FORMAT JSON STRICT:',
      '{',
      '  "variants": [',
      '    {',
      '      "id": "v1",',
      '      "title": "Titre court de la variante",',
      '      "subtitle": "Sous-titre descriptif",',
      '      "description": "Description 2-3 phrases du concept architectural",',
      '      "architecture": {',
      '        "servers": "Description precise des serveurs proposes",',
      '        "storage": "Description precise du stockage propose",',
      '        "network": "Description precise du reseau propose",',
      '        "virtualization": "Hyperviseur et licences proposes",',
      '        "backup": "Solution de sauvegarde proposee"',
      '      },',
      '      "scores": {',
      '        "adequation": 85,',
      '        "complexity_infra": 60,',
      '        "complexity_deploy": 50,',
      '        "cost_index": 70',
      '      },',
      '      "global_score": 78,',
      '      "pros": ["avantage specifique 1", "avantage specifique 2"],',
      '      "cons": ["inconvenient specifique 1", "inconvenient specifique 2"],',
      '      "risks": ["risque identifie 1"],',
      '      "recommended": false,',
      '      "recommendation_reason": "Pourquoi recommander ou non cette variante"',
      '    }',
      '  ],',
      '  "recommendation_summary": "Synthese de la recommandation finale en 2-3 phrases"',
      '}',
      "",
      "adequation: adéquation au besoin (100=parfait)",
      "complexity_infra: complexite infrastructure (100=tres complexe)",
      "complexity_deploy: complexite deploiement (100=tres complexe)",
      "cost_index: index de cout relatif (100=le plus cher)",
      "global_score: score global adequation/complexite/cout (100=meilleur)",
      "Une seule variante avec recommended=true.",
      "JSON uniquement."
    ].join("\n");

    const userPrompt = [
      "Projet: " + project.name + " | Client: " + project.client,
      project.context ? "Contexte: " + project.context : "",
      "",
      "TYPE DE PROJET: " + (analysis.projectType || "ENTERPRISE_DC"),
      "",
      "SYNTHESE:",
      analysis.synthesis,
      "",
      "COMPREHENSION PROJET:",
      understanding ? JSON.stringify(understanding, null, 2) : "Non disponible",
      "",
      answeredQuestions ? "REPONSES CLIENT:\n" + answeredQuestions : "Aucune reponse client disponible",
      "",
      "Genere 3 variantes de solution adaptees a ce projet specifique."
    ].join("\n");

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = message.content[0].text;
    let clean = raw.replace(/```json|```/g, "").trim();
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start !== -1 && end !== -1) clean = clean.slice(start, end + 1);
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
