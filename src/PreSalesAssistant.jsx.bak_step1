import { useState, useCallback } from "react";
import {
  Upload, FileText, FileSpreadsheet, File,
  ArrowRight, CheckCircle, X, Plus
} from "lucide-react";

// ─── CONSTANTES ───────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Upload & Contexte",  sub: "Documents et informations"      },
  { id: 2, label: "Analyse & Synthèse", sub: "Lecture du dossier"             },
  { id: 3, label: "Questions client",   sub: "Axes & points de clarification" },
  { id: 4, label: "Cadre de solution",  sub: "Variantes & recommandation"     },
  { id: 5, label: "Rendu final",        sub: "Export PowerPoint"              },
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
  project:   { name: "", client: "", context: "" },
  files:     [],
  analysis:  null,
  questions: [],
  variants:  [],
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
    2: "Voir les questions client",
    3: "Voir le cadre de solution",
    4: "Générer le rendu final",
    5: "Terminer",
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
      {currentStep >= 2 && (
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
