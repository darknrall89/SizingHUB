import { useState, useCallback } from "react";
import {
  Upload, ArrowRight, CheckCircle, X, Plus,
  AlertTriangle, Info, Lightbulb, Loader
} from "lucide-react";
import * as XLSX from "xlsx";
import * as mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// ─── EXTRACTION DE TEXTE ─────────────────────────────────────────────────────
async function extractText(file) {
  const mime = file.type;
  const buf  = await file.arrayBuffer();
  if (mime === "application/pdf") {
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const pages = [];
    for (let i = 1; i <= Math.min(pdf.numPages, 40); i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      pages.push(content.items.map(it => it.str).join(" "));
    }
    return { type: "pdf", text: pages.join("\n"), pages: pdf.numPages };
  }
  if (mime.includes("spreadsheet") || mime.includes("excel")) {
    const wb = XLSX.read(buf, { type: "array" });
    const text = wb.SheetNames.slice(0, 10).map(name => {
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: "" }).slice(0, 500);
      return `=== Feuille: ${name} ===\n` + rows.map(r => Object.values(r).join(" | ")).join("\n");
    }).join("\n\n");
    return { type: "xlsx", text, sheets: wb.SheetNames };
  }
  if (mime.includes("wordprocessingml") || mime.includes("msword")) {
    const result = await mammoth.extractRawText({ arrayBuffer: buf });
    return { type: "docx", text: result.value };
  }
  return { type: "unknown", text: "" };
}

// ─── APPEL API ANTHROPIC ──────────────────────────────────────────────────────
// ─── API BACKEND ─────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || "https://sizinghub-api.onrender.com";

async function analyzeWithClaude(project, extractedFiles) {
  const files = extractedFiles.map(f => ({
    name: f.name,
    type: f.extracted.type,
    text: f.extracted.text,
  }));
  const response = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project, files }),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

async function fetchUnderstanding(project, analysis, extractedFiles = []) {
  const files = extractedFiles.map(f => ({ name: f.name, type: f.extracted.type, text: f.extracted.text }));
  const response = await fetch(`${API_BASE}/api/understand`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project, analysis, files }),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

async function fetchQuestions(project, analysis, extractedFiles = [], understanding = null) {
  const files = extractedFiles.map(f => ({ name: f.name, type: f.extracted.type, text: f.extracted.text }));
  const response = await fetch(`${API_BASE}/api/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project, analysis, files, understanding }),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

async function fetchVariants(project, analysis, understanding, questions, answers) {
  const response = await fetch(`${API_BASE}/api/variants`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project, analysis, understanding, questions, answers }),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

// ─── CONSTANTES ───────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Upload & Contexte",       sub: "Documents et informations"      },
  { id: 2, label: "Analyse & Synthèse",      sub: "Lecture du dossier"             },
  { id: 3, label: "Compréhension projet",    sub: "Fiche structurée & angles morts" },
  { id: 4, label: "Questions client",        sub: "Axes & points de clarification" },
  { id: 5, label: "Cadre de solution",       sub: "Variantes & recommandation"     },
  { id: 6, label: "Rendu final",             sub: "Export PowerPoint"              },
];

// Types de fichiers acceptés + rendu visuel
const FILE_TYPE_MAP = {
  "application/pdf": { label: "PDF", bg: "#FEE2E2", color: "#DC2626" },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { label: "XLS", bg: "#D1FAE5", color: "#059669" },
  "application/vnd.ms-excel": { label: "XLS", bg: "#D1FAE5", color: "#059669" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { label: "DOC", bg: "#DBEAFE", color: "#2563EB" },
  "application/msword": { label: "DOC", bg: "#DBEAFE", color: "#2563EB" },
  "default": { label: "FILE", bg: "#F1F5F9", color: "#64748B" },
};

const getFileType = (mime) => FILE_TYPE_MAP[mime] || FILE_TYPE_MAP["default"];

const fmtSize = (bytes) => {
  if (bytes < 1024) return bytes + " o";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " Ko";
  return (bytes / (1024 * 1024)).toFixed(1) + " Mo";
};

// ─── ÉTAT GLOBAL partagé entre les 5 étapes ───────────────────────────────────
// Modifié uniquement via setState dans chaque étape.
// {
//   project:   { name, client, context }          ← étape 1
//   files:     File[]                              ← étape 1
//   analysis:  { synthesis, tags, axes, data }     ← étape 2
//   questions: { text, prio, bookmarked }[]        ← étape 3
//   variants:  { title, score, axes, selected }[]  ← étape 4
// }
const INITIAL_STATE = {
  project:      { name: "", client: "", context: "" },
  files:        [],
  analysis:     null,
  understanding: null,
  questions:    [],
  variants:     [],
};

// ─── STEPPER ──────────────────────────────────────────────────────────────────
function StepperBar({ currentStep, maxReached }) {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      padding: "0 16px", height: 48, flexShrink: 0,
      background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.07)",
      overflowX: "hidden", gap: 0,
    }}>
      {STEPS.map((s, i) => {
        const done   = s.id < currentStep;
        const active = s.id === currentStep;
        const locked = s.id > maxReached;
        return (
          <div key={s.id} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "0 8px 0 0", height: 48, position: "relative",
              borderBottom: active ? "2px solid #2563EB" : "2px solid transparent",
              opacity: locked ? 0.4 : 1, transition: "opacity .2s",
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 700,
                background: done ? "#059669" : active ? "#2563EB" : "#E2E8F0",
                color: (done || active) ? "#fff" : "#94A3B8",
              }}>
                {done ? <CheckCircle size={12} /> : s.id}
              </div>
              <div>
                <div style={{
                  fontSize: 11, fontWeight: active ? 600 : 500, whiteSpace: "nowrap",
                  color: active ? "#2563EB" : done ? "#475569" : "#94A3B8",
                }}>
                  {s.label}
                </div>
                {active && (
                  <div style={{ fontSize: 9, color: "rgba(37,99,235,0.7)", marginTop: 1, whiteSpace: "nowrap" }}>
                    {s.sub}
                  </div>
                )}
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <span style={{ color: "#CBD5E1", fontSize: 12, padding: "0 2px", flexShrink: 0 }}>›</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── TOPBAR PROJET ────────────────────────────────────────────────────────────
function ProjectTopbar({ projectName, onContinue, canContinue }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 20px", height: 48, background: "#fff", flexShrink: 0,
      borderBottom: "1px solid rgba(0,0,0,0.07)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 11, color: "#94A3B8" }}>Projet</span>
        <span style={{ color: "#CBD5E1", fontSize: 13 }}>›</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
          {projectName || "Nouveau projet"}
        </span>
        {projectName && (
          <span style={{
            fontSize: 10, padding: "2px 8px", borderRadius: 99, fontWeight: 500,
            background: "rgba(37,99,235,0.1)", color: "#2563EB",
            border: "1px solid rgba(37,99,235,0.2)", marginLeft: 4,
          }}>Actif</span>
        )}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button style={{
          display: "flex", alignItems: "center", gap: 5, padding: "5px 12px",
          borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer",
          border: "1px solid rgba(0,0,0,0.1)", background: "#fff", color: "#475569",
          fontFamily: "inherit",
        }}>
          💾 Enregistrer
        </button>
        <button onClick={onContinue} disabled={!canContinue} style={{
          display: "flex", alignItems: "center", gap: 5, padding: "5px 14px",
          borderRadius: 6, fontSize: 12, fontWeight: 600,
          cursor: canContinue ? "pointer" : "not-allowed", border: "none",
          background: canContinue ? "#2563EB" : "#E2E8F0",
          color: canContinue ? "#fff" : "#94A3B8",
          fontFamily: "inherit", transition: "all .15s",
        }}>
          Continuer <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}

// ─── BOTTOM BAR ───────────────────────────────────────────────────────────────
function BottomBar({ onStop, onContinue, canContinue, continueLabel }) {
  return (
    <div style={{
      padding: "10px 16px", borderTop: "1px solid rgba(0,0,0,0.07)",
      display: "flex", alignItems: "center", gap: 10,
      background: "#fff", flexShrink: 0,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10, flex: 1, padding: "10px 14px",
        borderRadius: 8, border: "1px solid rgba(0,0,0,0.08)", background: "#F8F9FC",
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6, background: "#E2E8F0",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, fontSize: 14,
        }}>⏸</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>Je souhaite m'arrêter ici</div>
          <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 1 }}>J'utilise ces éléments pour préparer mon échange avec le client.</div>
        </div>
        <button onClick={onStop} style={{
          padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 500,
          cursor: "pointer", border: "1px solid rgba(0,0,0,0.1)", background: "#fff",
          color: "#475569", fontFamily: "inherit", flexShrink: 0,
        }}>Enregistrer à ce stade</button>
      </div>

      <span style={{ fontSize: 11, color: "#94A3B8", flexShrink: 0, fontWeight: 500 }}>OU</span>

      <div style={{
        display: "flex", alignItems: "center", gap: 10, flex: 1, padding: "10px 14px",
        borderRadius: 8,
        border: canContinue ? "1px solid rgba(37,99,235,0.25)" : "1px solid rgba(0,0,0,0.08)",
        background: canContinue ? "rgba(37,99,235,0.05)" : "#F8F9FC",
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: canContinue ? "rgba(37,99,235,0.1)" : "#E2E8F0",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <ArrowRight size={13} style={{ color: canContinue ? "#2563EB" : "#94A3B8" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>Je souhaite continuer</div>
          <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 1 }}>J'ai déjà des réponses ou je souhaite construire une solution.</div>
        </div>
        <button onClick={onContinue} disabled={!canContinue} style={{
          padding: "7px 14px", borderRadius: 6, fontSize: 11, fontWeight: 600,
          cursor: canContinue ? "pointer" : "not-allowed", border: "none",
          background: canContinue ? "#2563EB" : "#E2E8F0",
          color: canContinue ? "#fff" : "#94A3B8",
          fontFamily: "inherit", flexShrink: 0,
          display: "flex", alignItems: "center", gap: 5, transition: "all .15s",
        }}>
          {continueLabel} <ArrowRight size={11} />
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ÉTAPE 1 — Upload & Contexte
// ═══════════════════════════════════════════════════════════════════════════════
function Step1Upload({ state, setState, onNext }) {
  const [dragOver, setDragOver] = useState(false);

  const canContinue = state.files.length > 0
    && state.project.name.trim() !== ""
    && state.project.client.trim() !== "";

  const addFiles = useCallback((incoming) => {
    const arr = Array.from(incoming);
    setState(prev => {
      const existing = new Set(prev.files.map(f => f.name + f.size));
      const newFiles = arr.filter(f => !existing.has(f.name + f.size));
      return { ...prev, files: [...prev.files, ...newFiles] };
    });
  }, [setState]);

  const removeFile = (idx) =>
    setState(prev => ({ ...prev, files: prev.files.filter((_, i) => i !== idx) }));

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const setProject = (field, value) =>
    setState(prev => ({ ...prev, project: { ...prev.project, [field]: value } }));

  const card = {
    background: "#fff", border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 12, overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  };
  const inputStyle = {
    width: "100%", padding: "8px 12px", borderRadius: 6, fontSize: 13,
    border: "1px solid rgba(0,0,0,0.12)", background: "#F8F9FC",
    color: "#0F172A", fontFamily: "inherit", outline: "none",
    boxSizing: "border-box", transition: "border-color .15s",
  };
  const labelStyle = {
    fontSize: 11, fontWeight: 600, color: "#475569",
    textTransform: "uppercase", letterSpacing: "0.06em",
    display: "block", marginBottom: 6,
  };

  return (
    <div style={{
      flex: 1, overflow: "hidden", display: "grid",
      gridTemplateColumns: "1fr 360px",
      gap: 16, padding: 16, background: "#F4F6FA",
    }}>

      {/* ── Colonne gauche : Upload ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>

        {/* Zone d'upload */}
        <div style={card}>
          <div style={{
            padding: "11px 16px", borderBottom: "1px solid rgba(0,0,0,0.07)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Documents du projet</span>
            {state.files.length > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
                background: "rgba(37,99,235,0.1)", color: "#2563EB",
              }}>{state.files.length} fichier{state.files.length > 1 ? "s" : ""}</span>
            )}
          </div>
          <div style={{ padding: 16 }}>
            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => document.getElementById("ps-file-input").click()}
              style={{
                border: `2px dashed ${dragOver ? "#2563EB" : "#CBD5E1"}`,
                borderRadius: 10, padding: "32px 20px", textAlign: "center",
                cursor: "pointer", transition: "all .2s",
                background: dragOver ? "rgba(37,99,235,0.04)" : "#F8F9FC",
                marginBottom: state.files.length > 0 ? 14 : 0,
              }}
            >
              <input id="ps-file-input" type="file" multiple
                accept=".pdf,.xlsx,.xls,.docx,.doc"
                style={{ display: "none" }} onChange={e => addFiles(e.target.files)} />
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: dragOver ? "rgba(37,99,235,0.1)" : "#E2E8F0",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 12px",
              }}>
                <Upload size={20} style={{ color: dragOver ? "#2563EB" : "#94A3B8" }} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>
                Glissez vos fichiers ici
              </div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 10 }}>
                ou <span style={{ color: "#2563EB", fontWeight: 600 }}>parcourez vos fichiers</span>
              </div>
              <div style={{ fontSize: 11, color: "#CBD5E1" }}>
                PDF · XLSX · DOCX · XLS · DOC — 50 Mo max
              </div>
            </div>

            {/* Liste des fichiers chargés */}
            {state.files.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {state.files.map((file, i) => {
                  const ft = getFileType(file.type);
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                      borderRadius: 8, background: "#F8F9FC",
                      border: "1px solid rgba(0,0,0,0.07)",
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 7, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: ft.bg, color: ft.color, fontSize: 9, fontWeight: 700,
                      }}>{ft.label}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 12, fontWeight: 500, color: "#0F172A",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>{file.name}</div>
                        <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>
                          {fmtSize(file.size)} · {ft.label}
                        </div>
                      </div>
                      <div style={{
                        width: 18, height: 18, borderRadius: "50%",
                        background: "#ECFDF5", border: "1px solid #A7F3D0",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#059669", fontSize: 10, flexShrink: 0,
                      }}>✓</div>
                      <button onClick={() => removeFile(i)} style={{
                        width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "transparent", border: "none", cursor: "pointer",
                        color: "#CBD5E1",
                      }}
                        onMouseEnter={e => e.currentTarget.style.color = "#DC2626"}
                        onMouseLeave={e => e.currentTarget.style.color = "#CBD5E1"}
                      ><X size={13} /></button>
                    </div>
                  );
                })}
                <button onClick={() => document.getElementById("ps-file-input").click()} style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "8px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                  cursor: "pointer", border: "1px dashed #CBD5E1", background: "transparent",
                  color: "#475569", fontFamily: "inherit",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#2563EB"; e.currentTarget.style.color = "#2563EB"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#CBD5E1"; e.currentTarget.style.color = "#475569"; }}
                >
                  <Plus size={13} /> Ajouter d'autres fichiers
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Fichiers recommandés */}
        <div style={card}>
          <div style={{ padding: "11px 16px", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Fichiers recommandés</span>
          </div>
          <div style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "CCTP / Cahier des charges", ext: "PDF",  color: "#DC2626", bg: "#FEE2E2", desc: "Exigences techniques et fonctionnelles" },
              { label: "Export RVTools",             ext: "XLSX", color: "#059669", bg: "#D1FAE5", desc: "Inventaire VM, CPU, RAM, stockage"      },
              { label: "Contexte projet",            ext: "DOCX", color: "#2563EB", bg: "#DBEAFE", desc: "Notes, historique, contraintes client"  },
              { label: "Budget / Devis existants",   ext: "XLSX", color: "#059669", bg: "#D1FAE5", desc: "Enveloppe financière, contrats actuels" },
            ].map((item, i) => (
              <div key={i} style={{
                padding: "10px 12px", borderRadius: 8,
                background: "#F8F9FC", border: "1px solid rgba(0,0,0,0.07)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                    background: item.bg, color: item.color,
                  }}>{item.ext}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#0F172A" }}>{item.label}</span>
                </div>
                <div style={{ fontSize: 10, color: "#94A3B8" }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Colonne droite : Contexte projet ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
        <div style={card}>
          <div style={{ padding: "11px 16px", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Contexte du projet</span>
          </div>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>

            <div>
              <span style={labelStyle}>Nom du projet *</span>
              <input style={inputStyle}
                placeholder="Ex : Refonte SI Groupe Acme"
                value={state.project.name}
                onChange={e => setProject("name", e.target.value)}
                onFocus={e => e.target.style.borderColor = "#2563EB"}
                onBlur={e => e.target.style.borderColor = "rgba(0,0,0,0.12)"}
              />
            </div>

            <div>
              <span style={labelStyle}>Nom du client *</span>
              <input style={inputStyle}
                placeholder="Ex : Groupe Acme"
                value={state.project.client}
                onChange={e => setProject("client", e.target.value)}
                onFocus={e => e.target.style.borderColor = "#2563EB"}
                onBlur={e => e.target.style.borderColor = "rgba(0,0,0,0.12)"}
              />
            </div>

            <div>
              <span style={labelStyle}>Contexte additionnel</span>
              <textarea style={{ ...inputStyle, height: 110, resize: "vertical", lineHeight: 1.6 }}
                placeholder="Informations complémentaires, contraintes spécifiques, historique..."
                value={state.project.context}
                onChange={e => setProject("context", e.target.value)}
                onFocus={e => e.target.style.borderColor = "#2563EB"}
                onBlur={e => e.target.style.borderColor = "rgba(0,0,0,0.12)"}
              />
            </div>

            {/* Récap */}
            {(state.files.length > 0 || state.project.name) && (
              <div style={{
                background: canContinue ? "rgba(37,99,235,0.05)" : "#F8F9FC",
                border: `1px solid ${canContinue ? "rgba(37,99,235,0.2)" : "rgba(0,0,0,0.07)"}`,
                borderRadius: 8, padding: "10px 12px",
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#0F172A", marginBottom: 6 }}>Récapitulatif</div>
                {[
                  { label: "Projet",   value: state.project.name   || "—", ok: !!state.project.name   },
                  { label: "Client",   value: state.project.client || "—", ok: !!state.project.client },
                  { label: "Fichiers", value: state.files.length > 0 ? `${state.files.length} chargé${state.files.length > 1 ? "s" : ""}` : "Aucun", ok: state.files.length > 0 },
                ].map((row, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "4px 0",
                    borderBottom: i < 2 ? "1px solid rgba(0,0,0,0.05)" : "none",
                  }}>
                    <span style={{ fontSize: 11, color: "#475569" }}>{row.label}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ fontSize: 11, fontWeight: 500, color: "#0F172A" }}>{row.value}</span>
                      {row.ok
                        ? <CheckCircle size={12} style={{ color: "#059669" }} />
                        : <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#E2E8F0" }} />
                      }
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            <button onClick={onNext} disabled={!canContinue} style={{
              width: "100%", padding: "11px 0", borderRadius: 8,
              fontSize: 13, fontWeight: 600,
              cursor: canContinue ? "pointer" : "not-allowed", border: "none",
              background: canContinue ? "#2563EB" : "#E2E8F0",
              color: canContinue ? "#fff" : "#94A3B8",
              fontFamily: "inherit", transition: "all .15s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              Lancer l'analyse <ArrowRight size={14} />
            </button>

            {!canContinue && (
              <div style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", marginTop: -8 }}>
                {state.files.length === 0
                  ? "Chargez au moins un document pour continuer"
                  : "Renseignez le nom du projet et du client"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// ÉTAPE 2 — Analyse & Synthèse
// ═══════════════════════════════════════════════════════════════════════════════

const PRIO_STYLES = {
  high: { bg: "rgba(220,38,38,0.08)",  color: "#DC2626", border: "rgba(220,38,38,0.2)",  label: "Élevé"  },
  med:  { bg: "rgba(217,119,6,0.08)",  color: "#D97706", border: "rgba(217,119,6,0.2)",  label: "Moyen"  },
  low:  { bg: "rgba(5,150,105,0.08)",  color: "#059669", border: "rgba(5,150,105,0.2)",  label: "Faible" },
};

function PrioBadge({ level }) {
  const s = PRIO_STYLES[level] || PRIO_STYLES.med;
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      flexShrink: 0, whiteSpace: "nowrap",
    }}>{s.label}</span>
  );
}

function Step2Analysis({ state, setState, onNext, onPrev }) {
  const [phase,   setPhase]   = useState("idle"); // idle | extracting | analyzing | done | error
  const [progress, setProgress] = useState({ current: 0, total: 0, file: "" });
  const [errorMsg, setErrorMsg] = useState("");

  const analysis = state.analysis;

  const FILE_TYPE_MAP_LOCAL = {
    "application/pdf": { label: "PDF", bg: "#FEE2E2", color: "#DC2626" },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { label: "XLS", bg: "#D1FAE5", color: "#059669" },
    "application/vnd.ms-excel": { label: "XLS", bg: "#D1FAE5", color: "#059669" },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { label: "DOC", bg: "#DBEAFE", color: "#2563EB" },
    "application/msword": { label: "DOC", bg: "#DBEAFE", color: "#2563EB" },
    "default": { label: "FILE", bg: "#F1F5F9", color: "#64748B" },
  };

  const runAnalysis = async () => {
    try {
      setPhase("extracting");
      const extracted = [];
      for (let i = 0; i < state.files.length; i++) {
        const file = state.files[i];
        setProgress({ current: i + 1, total: state.files.length, file: file.name });
        const result = await extractText(file);
        extracted.push({ name: file.name, extracted: result });
      }
      setPhase("analyzing");
      const result = await analyzeWithClaude(state.project, extracted);
      setState(prev => ({ ...prev, extractedFiles: extracted }));
      setState(prev => ({ ...prev, analysis: result }));
      setPhase("done");
    } catch (e) {
      console.error(e);
      setErrorMsg(e.message || "Erreur inconnue");
      setPhase("error");
    }
  };

  const card = {
    background: "#fff", border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    overflow: "hidden",
  };
  const hdr = (title, badge) => (
    <div style={{
      padding: "11px 16px", borderBottom: "1px solid rgba(0,0,0,0.07)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{title}</span>
      {badge}
    </div>
  );

  // ── Phase idle : récap fichiers + bouton lancer ───────────────────────────
  if (phase === "idle" && !analysis) {
    return (
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, padding: 16, background: "#F4F6FA", overflow: "hidden" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
          <div style={card}>
            {hdr("Documents à analyser", <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: "rgba(37,99,235,0.1)", color: "#2563EB" }}>{state.files.length} fichier{state.files.length > 1 ? "s" : ""}</span>)}
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              {state.files.map((file, i) => {
                const ft = FILE_TYPE_MAP_LOCAL[file.type] || FILE_TYPE_MAP_LOCAL["default"];
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, background: "#F8F9FC", border: "1px solid rgba(0,0,0,0.07)" }}>
                    <div style={{ width: 30, height: 30, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: ft.bg, color: ft.color, fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{ft.label}</div>
                    <span style={{ fontSize: 12, fontWeight: 500, color: "#0F172A", flex: 1 }}>{file.name}</span>
                    <span style={{ fontSize: 10, color: "#94A3B8" }}>{(file.size / 1024 / 1024).toFixed(1)} Mo</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ ...card, background: "rgba(37,99,235,0.03)", border: "1px solid rgba(37,99,235,0.15)" }}>
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>Ce que Claude va analyser</div>
              <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
                Extraction du texte complet de chaque document, identification des enjeux, contraintes réglementaires, volumétrie infrastructure, et génération des axes de qualification prioritaires.
              </div>
              {["Extraction texte PDF, XLSX, DOCX", "Identification des enjeux métier", "Détection des contraintes (conformité, souveraineté...)", "Génération des axes de qualification"].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <CheckCircle size={13} style={{ color: "#059669", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#475569" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={card}>
            <div style={{ padding: "11px 16px", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Projet</span>
            </div>
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Projet", value: state.project.name },
                { label: "Client", value: state.project.client },
                { label: "Fichiers", value: `${state.files.length} document${state.files.length > 1 ? "s" : ""}` },
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 2 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                  <span style={{ fontSize: 12, color: "#94A3B8" }}>{row.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{row.value}</span>
                </div>
              ))}
              {state.project.context && (
                <div style={{ marginTop: 4, padding: "8px 10px", background: "#F8F9FC", borderRadius: 6, fontSize: 11, color: "#475569", lineHeight: 1.5 }}>
                  {state.project.context}
                </div>
              )}
            </div>
          </div>
          <button onClick={runAnalysis} style={{
            padding: "13px 0", borderRadius: 10, fontSize: 13, fontWeight: 600,
            cursor: "pointer", border: "none", background: "#2563EB", color: "#fff",
            fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            ✦ Lancer l'analyse Claude <ArrowRight size={14} />
          </button>
          <button onClick={onPrev} style={{
            padding: "9px 0", borderRadius: 8, fontSize: 12, fontWeight: 500,
            cursor: "pointer", border: "1px solid rgba(0,0,0,0.1)", background: "#fff",
            color: "#475569", fontFamily: "inherit",
          }}>← Modifier les fichiers</button>
        </div>
      </div>
    );
  }

  // ── Phase extraction / analyse : spinner ─────────────────────────────────
  if (phase === "extracting" || phase === "analyzing") {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#F4F6FA", flexDirection: "column", gap: 20 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16, background: "rgba(37,99,235,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: 32, height: 32, border: "3px solid rgba(37,99,235,0.2)",
            borderTop: "3px solid #2563EB", borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#0F172A", marginBottom: 6 }}>
            {phase === "extracting" ? "Extraction du contenu..." : "Analyse en cours..."}
          </div>
          <div style={{ fontSize: 13, color: "#94A3B8" }}>
            {phase === "extracting"
              ? `Fichier ${progress.current}/${progress.total} — ${progress.file}`
              : "Claude analyse vos documents, cela peut prendre 15-30 secondes"
            }
          </div>
        </div>
        <div style={{ width: 280, height: 4, background: "#E2E8F0", borderRadius: 99, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 99, background: "#2563EB",
            width: phase === "extracting" ? `${(progress.current / progress.total) * 60}%` : "90%",
            transition: "width 0.5s ease",
          }} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Phase error ───────────────────────────────────────────────────────────
  if (phase === "error") {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#F4F6FA", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 32 }}>❌</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#DC2626" }}>Erreur d'analyse</div>
        <div style={{ fontSize: 12, color: "#94A3B8", maxWidth: 400, textAlign: "center" }}>{errorMsg}</div>
        <button onClick={() => setPhase("idle")} style={{
          marginTop: 8, padding: "8px 20px", borderRadius: 8, fontSize: 12, fontWeight: 600,
          cursor: "pointer", border: "none", background: "#2563EB", color: "#fff", fontFamily: "inherit",
        }}>Réessayer</button>
      </div>
    );
  }

  // ── Phase done : résultats ────────────────────────────────────────────────
  const a = analysis;
  return (
    <div style={{ flex: 1, overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 1fr 260px", gap: 14, padding: 14, background: "#F4F6FA" }}>

      {/* Colonne 1 : Synthèse + Enjeux */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
        <div style={card}>
          {hdr("Synthèse du dossier")}
          <div style={{ padding: 14, fontSize: 13, color: "#475569", lineHeight: 1.7 }}>{a.synthesis}</div>
        </div>
        <div style={card}>
          {hdr("Enjeux identifiés")}
          <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            {(a.enjeux || []).map((e, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 11px", background: "#F8F9FC", borderRadius: 8, border: "1px solid rgba(0,0,0,0.07)" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(37,99,235,0.1)", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                <span style={{ fontSize: 12, color: "#0F172A", lineHeight: 1.5 }}>{e}</span>
              </div>
            ))}
          </div>
        </div>
        {a.tags?.length > 0 && (
          <div style={card}>
            {hdr("Tags")}
            <div style={{ padding: 14, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {a.tags.map((t, i) => (
                <span key={i} style={{ padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 500, background: "#fff", color: "#475569", border: "1px solid rgba(0,0,0,0.08)" }}>{t}</span>
              ))}
            </div>
          </div>
        )}
        {/* Data chiffrée si RVTools détecté */}
        {a.data && Object.values(a.data).some(v => v !== null) && (
          <div style={card}>
            {hdr("Données extraites")}
            <div style={{ padding: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: "VMs", value: a.data.vmCount, unit: "" },
                { label: "RAM totale", value: a.data.totalRAM_GB, unit: " Go" },
                { label: "CPU cores", value: a.data.totalCPU_cores, unit: "" },
                { label: "Stockage", value: a.data.totalStorage_TB, unit: " To" },
              ].filter(d => d.value !== null).map((d, i) => (
                <div key={i} style={{ padding: "10px 12px", background: "#F8F9FC", borderRadius: 8, border: "1px solid rgba(0,0,0,0.07)" }}>
                  <div style={{ fontSize: 10, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{d.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#2563EB", fontFamily: "monospace" }}>{d.value}{d.unit}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Colonne 2 : Axes de recherche */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
        <div style={card}>
          {hdr("Axes de recherche identifiés", <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: "rgba(37,99,235,0.1)", color: "#2563EB" }}>{(a.axes || []).length}</span>)}
          <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 6 }}>
            {(a.axes || []).map((ax, i) => {
              const ps = PRIO_STYLES[ax.prio] || PRIO_STYLES.med;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.07)", background: "#fff" }}>
                  <div style={{ width: 30, height: 30, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: ps.bg, fontSize: 15, flexShrink: 0 }}>{ax.ico}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{ax.label}</div>
                    <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 1 }}>{ax.sub}</div>
                  </div>
                  <PrioBadge level={ax.prio} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Colonne 3 : Alertes */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
        <div style={card}>
          {hdr("Points d'attention")}
          <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 6 }}>
            {(a.alerts || []).map((al, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 10px", borderRadius: 7, fontSize: 11, lineHeight: 1.5,
                background: al.type === "warn" ? "rgba(217,119,6,0.07)" : "rgba(37,99,235,0.07)",
                border: `1px solid ${al.type === "warn" ? "rgba(217,119,6,0.2)" : "rgba(37,99,235,0.2)"}`,
              }}>
                {al.type === "warn"
                  ? <AlertTriangle size={12} style={{ color: "#D97706", flexShrink: 0, marginTop: 1 }} />
                  : <Info size={12} style={{ color: "#2563EB", flexShrink: 0, marginTop: 1 }} />
                }
                <span style={{ color: "#475569" }}>{al.text}</span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={() => { setState(prev => ({ ...prev, analysis: null })); setPhase("idle"); }} style={{
          padding: "9px 0", borderRadius: 8, fontSize: 11, fontWeight: 500,
          cursor: "pointer", border: "1px solid rgba(0,0,0,0.1)", background: "#fff",
          color: "#475569", fontFamily: "inherit",
        }}>↺ Relancer l'analyse</button>
      </div>
    </div>
  );
}




// ─── Modal de réponse ────────────────────────────────────────────────────────
function AnswerModal({ question, answer, onSave, onClose }) {
  const [text, setText] = useState(answer || "");

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 14, width: "100%", maxWidth: 560,
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)", overflow: "hidden",
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Question client</div>
            <div style={{ fontSize: 13, color: "#0F172A", lineHeight: 1.55, fontWeight: 500 }}>{question.text}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 18, flexShrink: 0, padding: 2 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Réponse / Notes AV
          </div>
          <textarea
            autoFocus
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Saisir la réponse du client ou vos notes... (optionnel)"
            style={{
              width: "100%", minHeight: 120, padding: "10px 12px",
              borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)",
              fontSize: 13, color: "#0F172A", fontFamily: "inherit",
              lineHeight: 1.6, resize: "vertical", outline: "none",
              background: "#F8F9FC", boxSizing: "border-box",
            }}
            onFocus={e => e.target.style.borderColor = "#2563EB"}
            onBlur={e => e.target.style.borderColor = "rgba(0,0,0,0.12)"}
          />
          <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 6 }}>
            💡 Cette réponse influencera les variantes de solution à l'étape suivante
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 18px", borderTop: "1px solid rgba(0,0,0,0.07)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
          {answer && (
            <button onClick={() => { onSave(""); onClose(); }} style={{
              padding: "7px 14px", borderRadius: 7, fontSize: 12, fontWeight: 500,
              cursor: "pointer", border: "1px solid rgba(220,38,38,0.2)",
              background: "rgba(220,38,38,0.05)", color: "#DC2626", fontFamily: "inherit",
            }}>Effacer</button>
          )}
          <button onClick={onClose} style={{
            padding: "7px 14px", borderRadius: 7, fontSize: 12, fontWeight: 500,
            cursor: "pointer", border: "1px solid rgba(0,0,0,0.1)",
            background: "#fff", color: "#475569", fontFamily: "inherit",
          }}>Annuler</button>
          <button onClick={() => { onSave(text); onClose(); }} style={{
            padding: "7px 16px", borderRadius: 7, fontSize: 12, fontWeight: 600,
            cursor: "pointer", border: "none", background: "#2563EB",
            color: "#fff", fontFamily: "inherit",
          }}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ÉTAPE 3 — Compréhension projet (fiche structurée)
// ═══════════════════════════════════════════════════════════════════════════════
function Step2bUnderstanding({ state, setState, onNext, onPrev }) {
  const [phase, setPhase] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const understanding = state.understanding;

  const runFetch = async () => {
    try {
      setPhase("loading");
      const result = await fetchUnderstanding(state.project, state.analysis, state.extractedFiles || []);
      setState(prev => ({ ...prev, understanding: result }));
      setPhase("done");
    } catch (e) {
      setErrorMsg(e.message);
      setPhase("error");
    }
  };

  const card = {
    background: "#fff", border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden",
  };

  const Section = ({ title, items, color = "#2563EB", bg = "rgba(37,99,235,0.06)", icon = "•" }) => (
    items && items.length > 0 ? (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{title}</div>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 10px", borderRadius: 6, background: bg, border: "1px solid " + color.replace(")", ",0.15)").replace("rgb", "rgba"), marginBottom: 4 }}>
            <span style={{ color, flexShrink: 0, fontSize: 12 }}>{icon}</span>
            <span style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>{item}</span>
          </div>
        ))}
      </div>
    ) : null
  );

  const ArchRow = ({ label, value }) => value && value !== "Non documenté" ? (
    <div style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", minWidth: 80, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, color: "#0F172A", lineHeight: 1.6, wordBreak: "break-word", flex: 1 }}>{value}</span>
    </div>
  ) : null;

  if (phase === "idle" && !understanding) {
    return (
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, padding: 16, background: "#F4F6FA" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
          <div style={card}>
            <div style={{ padding: "11px 16px", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Synthèse — Étape 2</span>
            </div>
            <div style={{ padding: 14, fontSize: 13, color: "#475569", lineHeight: 1.7 }}>{state.analysis?.synthesis}</div>
          </div>
          <div style={{ ...card, background: "rgba(37,99,235,0.03)", border: "1px solid rgba(37,99,235,0.15)" }}>
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 6 }}>Ce que Claude va produire</div>
              {[
                "Fiche de compréhension structurée du projet",
                "Architecture existante lue et documentée",
                "Architecture cible demandée",
                "Faits connus (ne seront PAS posés en questions)",
                "Angles morts et incohérences détectés",
                "Zones de risque identifiées"
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <CheckCircle size={13} style={{ color: "#059669", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#475569" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={card}>
            <div style={{ padding: "11px 14px", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>Type détecté</span>
            </div>
            <div style={{ padding: 14 }}>
              {(() => {
                const types = {
                  ENTERPRISE_DC: { label: "Enterprise Datacenter", color: "#2563EB", bg: "rgba(37,99,235,0.08)", icon: "🏢" },
                  CRITICAL_INDUSTRIAL: { label: "Infra critique industrielle", color: "#DC2626", bg: "rgba(220,38,38,0.08)", icon: "⚡" },
                  SMB: { label: "PME / Mid-market", color: "#059669", bg: "rgba(5,150,105,0.08)", icon: "🏪" },
                  CLOUD_MIGRATION: { label: "Migration Cloud", color: "#7C3AED", bg: "rgba(124,58,237,0.08)", icon: "☁️" },
                  HARDWARE_ACQUISITION: { label: "Acquisition matérielle", color: "#D97706", bg: "rgba(217,119,6,0.08)", icon: "🖥" },
                };
                const t = types[state.analysis?.projectType] || types.ENTERPRISE_DC;
                return (
                  <div style={{ padding: "10px 12px", borderRadius: 8, background: t.bg, border: "1px solid " + t.color + "30", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 24 }}>{t.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: t.color }}>{t.label}</div>
                      <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>{state.analysis?.projectType}</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
          <button onClick={runFetch} style={{
            padding: "13px 0", borderRadius: 10, fontSize: 13, fontWeight: 600,
            cursor: "pointer", border: "none", background: "#2563EB", color: "#fff",
            fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            ✦ Analyser la compréhension <ArrowRight size={14} />
          </button>
          <button onClick={onPrev} style={{
            padding: "9px 0", borderRadius: 8, fontSize: 12, fontWeight: 500,
            cursor: "pointer", border: "1px solid rgba(0,0,0,0.1)", background: "#fff",
            color: "#475569", fontFamily: "inherit",
          }}>← Retour à l'analyse</button>
        </div>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#F4F6FA", flexDirection: "column", gap: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(37,99,235,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 32, height: 32, border: "3px solid rgba(37,99,235,0.2)", borderTop: "3px solid #2563EB", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#0F172A", marginBottom: 6 }}>Lecture approfondie en cours...</div>
          <div style={{ fontSize: 13, color: "#94A3B8" }}>Claude lit et structure la compréhension du projet</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#F4F6FA", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 32 }}>❌</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#DC2626" }}>Erreur</div>
        <div style={{ fontSize: 12, color: "#94A3B8" }}>{errorMsg}</div>
        <button onClick={() => setPhase("idle")} style={{ padding: "8px 20px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", background: "#2563EB", color: "#fff", fontFamily: "inherit" }}>Réessayer</button>
      </div>
    );
  }

  const u = understanding;
  return (
    <div style={{ flex: 1, overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, padding: 14, background: "#F4F6FA" }}>

      {/* Colonne gauche */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>

        {/* Type + Résumé */}
        <div style={card}>
          <div style={{ padding: "11px 14px", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>Compréhension projet</span>
            {u.projectType && (
              <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: "rgba(37,99,235,0.1)", color: "#2563EB" }}>{u.projectType}</span>
            )}
          </div>
          <div style={{ padding: 14, fontSize: 13, color: "#475569", lineHeight: 1.7 }}>{u.projectSummary}</div>
        </div>

        {/* Architecture existante */}
        <div style={card}>
          <div style={{ padding: "11px 14px", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>Architecture existante lue</span>
          </div>
          <div style={{ padding: 14 }}>
            <ArchRow label="Serveurs" value={u.existingArch?.servers} />
            <ArchRow label="Stockage" value={u.existingArch?.storage} />
            <ArchRow label="Réseau" value={u.existingArch?.network} />
            <ArchRow label="Virtua." value={u.existingArch?.virtualization} />
            <ArchRow label="Backup" value={u.existingArch?.backup} />
          </div>
        </div>

        {/* Architecture cible */}
        <div style={card}>
          <div style={{ padding: "11px 14px", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>Architecture cible demandée</span>
          </div>
          <div style={{ padding: 14 }}>
            <ArchRow label="Serveurs" value={u.targetArch?.servers} />
            <ArchRow label="Stockage" value={u.targetArch?.storage} />
            <ArchRow label="Réseau" value={u.targetArch?.network} />
            <ArchRow label="Virtua." value={u.targetArch?.virtualization} />
            <ArchRow label="Backup" value={u.targetArch?.backup} />
          </div>
        </div>
      </div>

      {/* Colonne droite */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>

        <div style={card}>
          <div style={{ padding: "11px 14px", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>Analyse</span>
          </div>
          <div style={{ padding: 14 }}>
            <Section title="✅ Faits connus (pas de questions)" items={u.knownFacts} color="#059669" bg="rgba(5,150,105,0.06)" icon="✓" />
            <Section title="🔍 Angles morts détectés" items={u.blindSpots} color="#2563EB" bg="rgba(37,99,235,0.06)" icon="?" />
            <Section title="⚠️ Incohérences" items={u.inconsistencies} color="#D97706" bg="rgba(217,119,6,0.06)" icon="!" />
            <Section title="🔴 Zones de risque" items={u.riskAreas} color="#DC2626" bg="rgba(220,38,38,0.06)" icon="⚠" />
          </div>
        </div>

        <button onClick={onNext} style={{
          padding: "11px 0", borderRadius: 8, fontSize: 12, fontWeight: 600,
          cursor: "pointer", border: "none", background: "#2563EB", color: "#fff",
          fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          Générer les questions <ArrowRight size={13} />
        </button>
        <button onClick={() => { setState(prev => ({ ...prev, understanding: null })); setPhase("idle"); }} style={{
          padding: "8px 0", borderRadius: 8, fontSize: 11, fontWeight: 500,
          cursor: "pointer", border: "1px solid rgba(0,0,0,0.1)", background: "#fff",
          color: "#475569", fontFamily: "inherit",
        }}>↺ Relancer la compréhension</button>
        <button onClick={onPrev} style={{
          padding: "8px 0", borderRadius: 8, fontSize: 11, fontWeight: 500,
          cursor: "pointer", border: "1px solid rgba(0,0,0,0.1)", background: "#fff",
          color: "#475569", fontFamily: "inherit",
        }}>← Retour à l'analyse</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ÉTAPE 3 — Questions client
// ═══════════════════════════════════════════════════════════════════════════════
function Step3Questions({ state, setState, onNext, onPrev }) {
  const [phase,     setPhase]     = useState("idle");
  const [errorMsg,  setErrorMsg]  = useState("");
  const [tab,       setTab]       = useState("all");
  const [bookmarks, setBookmarks] = useState(new Set());
  const [answers,   setAnswers]   = useState(state.answers || {});
  const [modalQ,    setModalQ]    = useState(null); // question ouverte dans le modal

  const questions = state.questions || [];

  const saveAnswer = (idx, text) => {
    const next = { ...answers, [idx]: text };
    if (!text) delete next[idx];
    setAnswers(next);
    setState(prev => ({ ...prev, answers: next }));
  };

  const runFetch = async () => {
    try {
      setPhase("loading");
      const result = await fetchQuestions(state.project, state.analysis, state.extractedFiles || [], state.understanding);
      setState(prev => ({ ...prev, questions: result.questions || [] }));
      setPhase("done");
    } catch (e) {
      setErrorMsg(e.message);
      setPhase("error");
    }
  };

  const toggleBm = (i) => setBookmarks(prev => {
    const next = new Set(prev);
    next.has(i) ? next.delete(i) : next.add(i);
    return next;
  });

  const filtered = tab === "prio"
    ? questions.filter(q => q.prio === "high")
    : tab === "bookmarked"
    ? questions.filter((_, i) => bookmarks.has(i))
    : tab === "answered"
    ? questions.filter((_, i) => answers[i])
    : questions;

  const card = {
    background: "#fff", border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden",
  };

  if (phase === "idle" && questions.length === 0) {
    return (
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, padding: 16, background: "#F4F6FA" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
          <div style={card}>
            <div style={{ padding: "11px 16px", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Synthèse — Étape 2</span>
            </div>
            <div style={{ padding: 14, fontSize: 13, color: "#475569", lineHeight: 1.7 }}>{state.analysis?.synthesis}</div>
          </div>
          <div style={{ ...card, background: "rgba(37,99,235,0.03)", border: "1px solid rgba(37,99,235,0.15)" }}>
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 6 }}>Ce que Claude va générer</div>
              {["15 questions techniques et contextualisées", "Référençant des éléments concrets du dossier", "Incohérences et angles morts identifiés", "Filtrables par priorité et sauvegardables"].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <CheckCircle size={13} style={{ color: "#059669", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#475569" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={card}>
            <div style={{ padding: "11px 14px", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>Axes identifiés</span>
            </div>
            <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              {(state.analysis?.axes || []).map((ax, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 8, background: "#F8F9FC", border: "1px solid rgba(0,0,0,0.07)" }}>
                  <span style={{ fontSize: 14 }}>{ax.ico}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#0F172A", flex: 1 }}>{ax.label}</span>
                  <PrioBadge level={ax.prio} />
                </div>
              ))}
            </div>
          </div>
          <button onClick={runFetch} style={{ padding: "13px 0", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: "#2563EB", color: "#fff", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            ✦ Générer les questions <ArrowRight size={14} />
          </button>
          <button onClick={onPrev} style={{ padding: "9px 0", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", border: "1px solid rgba(0,0,0,0.1)", background: "#fff", color: "#475569", fontFamily: "inherit" }}>← Retour à l'analyse</button>
        </div>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#F4F6FA", flexDirection: "column", gap: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(37,99,235,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 32, height: 32, border: "3px solid rgba(37,99,235,0.2)", borderTop: "3px solid #2563EB", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#0F172A", marginBottom: 6 }}>Génération des questions...</div>
          <div style={{ fontSize: 13, color: "#94A3B8" }}>Claude analyse les axes et génère des questions ciblées</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#F4F6FA", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 32 }}>❌</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#DC2626" }}>Erreur</div>
        <div style={{ fontSize: 12, color: "#94A3B8" }}>{errorMsg}</div>
        <button onClick={() => setPhase("idle")} style={{ padding: "8px 20px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", background: "#2563EB", color: "#fff", fontFamily: "inherit" }}>Réessayer</button>
      </div>
    );
  }

  const TABS = [
    { id: "all",        label: "Toutes",       count: questions.length },
    { id: "prio",       label: "Prioritaires", count: questions.filter(q => q.prio === "high").length },
    { id: "answered",   label: "Répondues",    count: Object.keys(answers).length },
    { id: "bookmarked", label: "Sauvegardées", count: bookmarks.size },
  ];

  return (
    <div style={{ flex: 1, overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 260px", gap: 14, padding: 14, background: "#F4F6FA" }}>
      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ ...card, display: "flex", flexDirection: "column", height: "100%" }}>
          <div style={{ padding: "11px 16px", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Questions à poser au client</span>
            <button onClick={() => { setState(prev => ({ ...prev, questions: [] })); setPhase("idle"); }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: "pointer", border: "1px solid rgba(0,0,0,0.08)", background: "#fff", color: "#475569", fontFamily: "inherit" }}>↺ Regénérer</button>
          </div>
          <div style={{ padding: "10px 14px 0", display: "flex", gap: 4, flexShrink: 0 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "5px 12px", borderRadius: 99, fontSize: 11, fontWeight: 500, cursor: "pointer", border: "1px solid", borderColor: tab === t.id ? "#2563EB" : "rgba(0,0,0,0.08)", background: tab === t.id ? "#2563EB" : "#fff", color: tab === t.id ? "#fff" : "#475569", fontFamily: "inherit" }}>
                {t.label} ({t.count})
              </button>
            ))}
          </div>
          <div style={{ padding: "10px 14px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 5 }}>
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: "#94A3B8", fontSize: 13 }}>
                {tab === "bookmarked" ? "Aucune question sauvegardée" : "Aucune question"}
              </div>
            )}
            {filtered.map((q, i) => {
              const realIdx = questions.indexOf(q);
              const bm = bookmarks.has(realIdx);
              const dot = PRIO_STYLES[q.prio] || PRIO_STYLES.med;
              return (
                <div key={i} onClick={() => setModalQ({ q, idx: realIdx })} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 13px", borderRadius: 8, cursor: "pointer", transition: "all .15s", border: answers[realIdx] ? "1px solid rgba(5,150,105,0.25)" : "1px solid rgba(0,0,0,0.07)", background: answers[realIdx] ? "rgba(5,150,105,0.04)" : "#fff" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: answers[realIdx] ? "#059669" : dot.color, flexShrink: 0, marginTop: 5 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: "#0F172A", lineHeight: 1.55 }}>{q.text}</div>
                    {q.axis && <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 3 }}>{q.axis}</div>}
                    {answers[realIdx] && (
                      <div style={{ fontSize: 11, color: "#059669", marginTop: 5, padding: "4px 8px", background: "rgba(5,150,105,0.08)", borderRadius: 5, lineHeight: 1.4 }}>
                        ✓ {answers[realIdx]}
                      </div>
                    )}
                  </div>
                  <PrioBadge level={q.prio} />
                  <div onClick={() => toggleBm(realIdx)} style={{ flexShrink: 0, cursor: "pointer", padding: 2, color: bm ? "#2563EB" : "#CBD5E1" }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill={bm ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 2h8v12l-4-3-4 3V2z"/>
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
          {modalQ && (
            <AnswerModal
              question={modalQ.q}
              answer={answers[modalQ.idx]}
              onSave={text => saveAnswer(modalQ.idx, text)}
              onClose={() => setModalQ(null)}
            />
          )}
          <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(0,0,0,0.07)", flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#94A3B8" }}>
              {Object.keys(answers).length} réponse{Object.keys(answers).length > 1 ? "s" : ""} · {bookmarks.size} sauvegardée{bookmarks.size > 1 ? "s" : ""}
            </span>
            <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: "pointer", border: "1px solid rgba(0,0,0,0.08)", background: "#fff", color: "#475569", fontFamily: "inherit" }}>
              <ArrowRight size={11} /> Exporter la liste
            </button>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
        <div style={card}>
          <div style={{ padding: "11px 14px", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>Répartition par axe</span>
          </div>
          <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 5 }}>
            {(state.analysis?.axes || []).map((ax, i) => {
              const count = questions.filter(q => q.axis === ax.label).length;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 6, background: "#F8F9FC" }}>
                  <span style={{ fontSize: 13 }}>{ax.ico}</span>
                  <span style={{ fontSize: 11, color: "#475569", flex: 1 }}>{ax.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#2563EB" }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div style={card}>
          <div style={{ padding: "11px 14px", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>Points d'attention</span>
          </div>
          <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            {(state.analysis?.alerts || []).map((al, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, padding: "7px 9px", borderRadius: 6, fontSize: 11, lineHeight: 1.45, background: al.type === "warn" ? "rgba(217,119,6,0.07)" : "rgba(37,99,235,0.07)", border: "1px solid " + (al.type === "warn" ? "rgba(217,119,6,0.2)" : "rgba(37,99,235,0.2)") }}>
                <AlertTriangle size={11} style={{ color: al.type === "warn" ? "#D97706" : "#2563EB", flexShrink: 0, marginTop: 1 }} />
                <span style={{ color: "#475569" }}>{al.text}</span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={onNext} style={{ padding: "11px 0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", background: "#2563EB", color: "#fff", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          Cadre de solution <ArrowRight size={13} />
        </button>
        <button onClick={onPrev} style={{ padding: "9px 0", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", border: "1px solid rgba(0,0,0,0.1)", background: "#fff", color: "#475569", fontFamily: "inherit" }}>← Retour à l'analyse</button>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// ÉTAPE 5 — Cadre de solution (variantes)
// ═══════════════════════════════════════════════════════════════════════════════
function Step4Variants({ state, setState, onNext, onPrev }) {
  const [phase,    setPhase]    = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [selected, setSelected] = useState(null);

  const variants = state.variants || [];
  const summary  = state.variantSummary || "";

  const runFetch = async () => {
    try {
      setPhase("loading");
      const result = await fetchVariants(
        state.project, state.analysis, state.understanding,
        state.questions, state.answers || {}
      );
      setState(prev => ({ ...prev, variants: result.variants || [], variantSummary: result.recommendation_summary || "" }));
      const rec = (result.variants || []).findIndex(v => v.recommended);
      setSelected(rec >= 0 ? rec : 0);
      setPhase("done");
    } catch (e) {
      setErrorMsg(e.message);
      setPhase("error");
    }
  };

  const card = {
    background: "#fff", border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden",
  };

  const ScoreBar = ({ label, value, color = "#2563EB", invert = false }) => {
    const display = invert ? 100 - value : value;
    const c = display >= 70 ? "#059669" : display >= 40 ? "#D97706" : "#DC2626";
    return (
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
          <span style={{ fontSize: 11, color: "#475569" }}>{label}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: c }}>{display}/100</span>
        </div>
        <div style={{ height: 5, background: "#F1F5F9", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ width: display + "%", height: "100%", background: c, borderRadius: 99, transition: "width .5s" }} />
        </div>
      </div>
    );
  };

  // ── Idle ──────────────────────────────────────────────────────────────────
  if (phase === "idle" && variants.length === 0) {
    const answersCount = Object.keys(state.answers || {}).length;
    return (
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, padding: 16, background: "#F4F6FA" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
          <div style={card}>
            <div style={{ padding: "11px 16px", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Synthèse de qualification</span>
            </div>
            <div style={{ padding: 14, fontSize: 13, color: "#475569", lineHeight: 1.7 }}>{state.analysis?.synthesis}</div>
          </div>
          {answersCount > 0 && (
            <div style={{ ...card, background: "rgba(5,150,105,0.03)", border: "1px solid rgba(5,150,105,0.15)" }}>
              <div style={{ padding: "11px 16px", borderBottom: "1px solid rgba(5,150,105,0.1)" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#059669" }}>✓ {answersCount} réponse{answersCount > 1 ? "s" : ""} client intégrée{answersCount > 1 ? "s" : ""}</span>
              </div>
              <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                {(state.questions || []).map((q, i) => state.answers?.[i] ? (
                  <div key={i} style={{ padding: "7px 10px", background: "#fff", borderRadius: 7, border: "1px solid rgba(5,150,105,0.15)" }}>
                    <div style={{ fontSize: 11, color: "#475569", marginBottom: 3 }}>{q.text}</div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "#059669" }}>→ {state.answers[i]}</div>
                  </div>
                ) : null)}
              </div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ ...card, background: "rgba(37,99,235,0.03)", border: "1px solid rgba(37,99,235,0.15)" }}>
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 6 }}>Ce que Claude va générer</div>
              {["3 variantes architecturales différentes", "Scores d'adéquation, complexité et coût", "Pros/cons spécifiques au contexte", "Recommandation motivée", "Architectures détaillées (serveurs, stockage, réseau)"].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <CheckCircle size={13} style={{ color: "#059669", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#475569" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={runFetch} style={{
            padding: "13px 0", borderRadius: 10, fontSize: 13, fontWeight: 600,
            cursor: "pointer", border: "none", background: "#2563EB", color: "#fff",
            fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            ✦ Générer le cadre de solution <ArrowRight size={14} />
          </button>
          <button onClick={onPrev} style={{
            padding: "9px 0", borderRadius: 8, fontSize: 12, fontWeight: 500,
            cursor: "pointer", border: "1px solid rgba(0,0,0,0.1)", background: "#fff",
            color: "#475569", fontFamily: "inherit",
          }}>← Retour aux questions</button>
        </div>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#F4F6FA", flexDirection: "column", gap: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(37,99,235,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 32, height: 32, border: "3px solid rgba(37,99,235,0.2)", borderTop: "3px solid #2563EB", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#0F172A", marginBottom: 6 }}>Génération du cadre de solution...</div>
          <div style={{ fontSize: 13, color: "#94A3B8" }}>Claude analyse le projet et génère les variantes architecturales</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (phase === "error") {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#F4F6FA", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 32 }}>❌</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#DC2626" }}>Erreur</div>
        <div style={{ fontSize: 12, color: "#94A3B8" }}>{errorMsg}</div>
        <button onClick={() => setPhase("idle")} style={{ padding: "8px 20px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", background: "#2563EB", color: "#fff", fontFamily: "inherit" }}>Réessayer</button>
      </div>
    );
  }

  // ── Done : affichage des variantes ─────────────────────────────────────────
  const v = selected !== null ? variants[selected] : null;
  return (
    <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", gap: 0, background: "#F4F6FA" }}>

      {/* Tabs variantes */}
      <div style={{ display: "flex", gap: 10, padding: "12px 16px 0", flexShrink: 0 }}>
        {variants.map((vr, i) => (
          <div key={i} onClick={() => setSelected(i)} style={{
            flex: 1, padding: "10px 14px", borderRadius: "10px 10px 0 0", cursor: "pointer",
            background: selected === i ? "#fff" : "rgba(255,255,255,0.5)",
            border: "1px solid rgba(0,0,0,0.08)", borderBottom: selected === i ? "1px solid #fff" : "1px solid rgba(0,0,0,0.08)",
            position: "relative", transition: "all .15s",
          }}>
            {vr.recommended && (
              <div style={{ position: "absolute", top: -8, right: 10, fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: "#2563EB", color: "#fff" }}>RECOMMANDÉ</div>
            )}
            <div style={{ fontSize: 12, fontWeight: 700, color: selected === i ? "#0F172A" : "#475569" }}>{vr.title}</div>
            <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>{vr.subtitle}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: selected === i ? "#2563EB" : "#94A3B8", marginTop: 4 }}>{vr.global_score}<span style={{ fontSize: 10, fontWeight: 500 }}>/100</span></div>
          </div>
        ))}
      </div>

      {/* Contenu variante sélectionnée */}
      {v && (
        <div style={{ flex: 1, overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 1fr 280px", gap: 14, padding: "0 16px 16px", marginTop: -1 }}>

          {/* Col 1 : Description + Architecture */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", paddingTop: 14 }}>
            <div style={card}>
              <div style={{ padding: "11px 14px", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>Description</span>
              </div>
              <div style={{ padding: 14, fontSize: 13, color: "#475569", lineHeight: 1.7 }}>{v.description}</div>
            </div>
            <div style={card}>
              <div style={{ padding: "11px 14px", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>Architecture proposée</span>
              </div>
              <div style={{ padding: 14 }}>
                {[
                  { label: "Serveurs",        value: v.architecture?.servers },
                  { label: "Stockage",        value: v.architecture?.storage },
                  { label: "Réseau",          value: v.architecture?.network },
                  { label: "Virtualisation",  value: v.architecture?.virtualization },
                  { label: "Sauvegarde",      value: v.architecture?.backup },
                ].filter(r => r.value).map((row, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: i < 4 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", minWidth: 90, flexShrink: 0 }}>{row.label}</span>
                    <span style={{ fontSize: 12, color: "#0F172A", lineHeight: 1.5, flex: 1 }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Col 2 : Pros / Cons / Risques */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", paddingTop: 14 }}>
            <div style={card}>
              <div style={{ padding: "11px 14px", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>Avantages</span>
              </div>
              <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                {(v.pros || []).map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, padding: "6px 10px", background: "rgba(5,150,105,0.06)", borderRadius: 7, border: "1px solid rgba(5,150,105,0.15)" }}>
                    <span style={{ color: "#059669", flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 12, color: "#475569" }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={card}>
              <div style={{ padding: "11px 14px", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>Inconvénients</span>
              </div>
              <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                {(v.cons || []).map((c, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, padding: "6px 10px", background: "rgba(217,119,6,0.06)", borderRadius: 7, border: "1px solid rgba(217,119,6,0.15)" }}>
                    <span style={{ color: "#D97706", flexShrink: 0 }}>⚠</span>
                    <span style={{ fontSize: 12, color: "#475569" }}>{c}</span>
                  </div>
                ))}
              </div>
            </div>
            {v.risks?.length > 0 && (
              <div style={card}>
                <div style={{ padding: "11px 14px", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>Risques</span>
                </div>
                <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                  {v.risks.map((r, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, padding: "6px 10px", background: "rgba(220,38,38,0.06)", borderRadius: 7, border: "1px solid rgba(220,38,38,0.15)" }}>
                      <span style={{ color: "#DC2626", flexShrink: 0 }}>!</span>
                      <span style={{ fontSize: 12, color: "#475569" }}>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Col 3 : Scores + Navigation */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", paddingTop: 14 }}>
            <div style={card}>
              <div style={{ padding: "11px 14px", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>Scores</span>
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ textAlign: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: "#2563EB" }}>{v.global_score}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8" }}>Score global /100</div>
                </div>
                <ScoreBar label="Adéquation besoins" value={v.scores?.adequation || 0} />
                <ScoreBar label="Simplicité infra" value={v.scores?.complexity_infra || 0} invert />
                <ScoreBar label="Facilité déploiement" value={v.scores?.complexity_deploy || 0} invert />
                <ScoreBar label="Optimisation coût" value={v.scores?.cost_index || 0} invert />
              </div>
            </div>

            {v.recommended && (
              <div style={{ padding: "10px 12px", background: "rgba(37,99,235,0.06)", borderRadius: 8, border: "1px solid rgba(37,99,235,0.2)", fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
                <div style={{ fontWeight: 600, color: "#2563EB", marginBottom: 4 }}>💡 Pourquoi cette variante ?</div>
                {v.recommendation_reason}
              </div>
            )}

            {summary && (
              <div style={{ padding: "10px 12px", background: "#F8F9FC", borderRadius: 8, border: "1px solid rgba(0,0,0,0.07)", fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
                <div style={{ fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>Synthèse</div>
                {summary}
              </div>
            )}

            <button onClick={onNext} style={{
              padding: "11px 0", borderRadius: 8, fontSize: 12, fontWeight: 600,
              cursor: "pointer", border: "none", background: "#2563EB", color: "#fff",
              fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              Rendu final <ArrowRight size={13} />
            </button>
            <button onClick={() => { setState(prev => ({ ...prev, variants: [], variantSummary: "" })); setPhase("idle"); }} style={{
              padding: "8px 0", borderRadius: 8, fontSize: 11, fontWeight: 500,
              cursor: "pointer", border: "1px solid rgba(0,0,0,0.1)", background: "#fff",
              color: "#475569", fontFamily: "inherit",
            }}>↺ Regénérer</button>
            <button onClick={onPrev} style={{
              padding: "8px 0", borderRadius: 8, fontSize: 11, fontWeight: 500,
              cursor: "pointer", border: "1px solid rgba(0,0,0,0.1)", background: "#fff",
              color: "#475569", fontFamily: "inherit",
            }}>← Retour aux questions</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLACEHOLDERS étapes 2 → 5
// ═══════════════════════════════════════════════════════════════════════════════
function StepPlaceholder({ step, onNext, onPrev }) {
  return (
    <div style={{
      flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
      background: "#F4F6FA", flexDirection: "column", gap: 12,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: "rgba(37,99,235,0.1)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
      }}>🚧</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: "#0F172A" }}>
        Étape {step.id} — {step.label}
      </div>
      <div style={{ fontSize: 13, color: "#94A3B8" }}>En cours de développement</div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={onPrev} style={{
          padding: "7px 16px", borderRadius: 6, fontSize: 12, fontWeight: 500,
          border: "1px solid rgba(0,0,0,0.1)", background: "#fff", color: "#475569",
          cursor: "pointer", fontFamily: "inherit",
        }}>← Retour</button>
        {step.id < 5 && (
          <button onClick={onNext} style={{
            padding: "7px 16px", borderRadius: 6, fontSize: 12, fontWeight: 600,
            border: "none", background: "#2563EB", color: "#fff",
            cursor: "pointer", fontFamily: "inherit",
          }}>Suivant →</button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function PreSalesAssistant({ th, isMobile = false }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [maxReached,  setMaxReached]  = useState(1);
  const [state,       setState]       = useState(INITIAL_STATE);

  const goTo = (step) => {
    setCurrentStep(step);
    if (step > maxReached) setMaxReached(step);
  };
  const next = () => goTo(Math.min(5, currentStep + 1));
  const prev = () => goTo(Math.max(1, currentStep - 1));

  const canContinue1 = state.files.length > 0
    && state.project.name.trim() !== ""
    && state.project.client.trim() !== "";

  const CONTINUE_LABELS = {
    1: "Lancer l'analyse",
    2: "Analyser la compréhension",
    3: "Voir les questions client",
    4: "Voir le cadre de solution",
    5: "Générer le rendu final",
    6: "Terminer",
  };

  const currentStepData = STEPS.find(s => s.id === currentStep);

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      
      height: "100%",
      overflow: "hidden",
    }}>
      <ProjectTopbar
        projectName={state.project.name}
        canContinue={currentStep === 1 ? canContinue1 : true}
        onContinue={next}
      />

      <StepperBar currentStep={currentStep} maxReached={maxReached} />

      {currentStep === 1 && (
        <Step1Upload state={state} setState={setState} onNext={next} />
      )}
      {currentStep === 2 && (
        <Step2Analysis state={state} setState={setState} onNext={next} onPrev={prev} />
      )}
      {currentStep === 3 && (
        <Step2bUnderstanding state={state} setState={setState} onNext={next} onPrev={prev} />
      )}
      {currentStep === 4 && (
        <Step3Questions state={state} setState={setState} onNext={next} onPrev={prev} />
      )}
      {currentStep === 5 && (
        <Step4Variants state={state} setState={setState} onNext={next} onPrev={prev} />
      )}
      {currentStep >= 6 && (
        <StepPlaceholder step={currentStepData} onNext={next} onPrev={prev} />
      )}

      <BottomBar
        onStop={() => {}}
        onContinue={next}
        canContinue={currentStep === 1 ? canContinue1 : true}
        continueLabel={CONTINUE_LABELS[currentStep]}
      />
    </div>
  );
}
