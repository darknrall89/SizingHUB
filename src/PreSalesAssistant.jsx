import { useState, useCallback } from "react";
import { Upload, ArrowRight, CheckCircle, X, Plus, AlertTriangle, Info, Bookmark, FileText } from "lucide-react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || "https://sizinghub-api.onrender.com";

const STEPS = [
  { id: 1, label: "Upload",          sub: "Documents & contexte"         },
  { id: 2, label: "Analyse",         sub: "Compréhension du dossier"     },
  { id: 3, label: "Points d'attention", sub: "CCTP & zones grises"       },
  { id: 4, label: "Enrichissement",  sub: "Réponses & notes"             },
  { id: 5, label: "Agenda & Export", sub: "Structure & PowerPoint"       },
];

const FILE_STYLES = {
  "application/pdf": { label: "PDF", bg: "#FEE2E2", color: "#DC2626" },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { label: "XLS", bg: "#D1FAE5", color: "#059669" },
  "application/vnd.ms-excel": { label: "XLS", bg: "#D1FAE5", color: "#059669" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { label: "DOC", bg: "#DBEAFE", color: "#2563EB" },
  "application/msword": { label: "DOC", bg: "#DBEAFE", color: "#2563EB" },
  default: { label: "FILE", bg: "#F1F5F9", color: "#64748B" },
};
const getFT = (mime) => FILE_STYLES[mime] || FILE_STYLES.default;
const fmtSize = (b) => b < 1024 ? b + " o" : b < 1048576 ? (b/1024).toFixed(0) + " Ko" : (b/1048576).toFixed(1) + " Mo";

const PRIO = {
  high: { bg: "rgba(220,38,38,0.08)",  color: "#DC2626", border: "rgba(220,38,38,0.2)",  label: "Élevé"  },
  med:  { bg: "rgba(217,119,6,0.08)",  color: "#D97706", border: "rgba(217,119,6,0.2)",  label: "Moyen"  },
  low:  { bg: "rgba(5,150,105,0.08)",  color: "#059669", border: "rgba(5,150,105,0.2)",  label: "Faible" },
};

// ─── ÉTAT GLOBAL ──────────────────────────────────────────────────────────────
const INIT = {
  project:   { name: "", client: "", context: "" },
  files:     [],          // File[] locaux
  uploadedFiles: [],      // [{ file_id, name, size, type }] — retournés par /api/upload
  analysis:  null,        // résultat /api/analyze
  questions: [],          // résultat /api/questions
  answers:   {},          // { [idx]: string }
  notes:     "",          // notes libres AV
  agenda:    null,        // résultat /api/agenda
};

// ─── COMPOSANTS PARTAGÉS ──────────────────────────────────────────────────────
function PrioBadge({ level }) {
  const s = PRIO[level] || PRIO.med;
  return <span style={{ fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:99, background:s.bg, color:s.color, border:`1px solid ${s.border}`, flexShrink:0 }}>{s.label}</span>;
}

function Spinner({ label }) {
  return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", background:"#F4F6FA", flexDirection:"column", gap:20 }}>
      <div style={{ width:64, height:64, borderRadius:16, background:"rgba(37,99,235,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ width:32, height:32, border:"3px solid rgba(37,99,235,0.2)", borderTop:"3px solid #2563EB", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      </div>
      <div style={{ fontSize:15, fontWeight:600, color:"#0F172A" }}>{label}</div>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );
}

function ErrorScreen({ msg, onRetry }) {
  return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", background:"#F4F6FA", flexDirection:"column", gap:12 }}>
      <div style={{ fontSize:36 }}>❌</div>
      <div style={{ fontSize:14, fontWeight:600, color:"#DC2626" }}>Erreur</div>
      <div style={{ fontSize:12, color:"#94A3B8", maxWidth:400, textAlign:"center" }}>{msg}</div>
      <button onClick={onRetry} style={{ padding:"8px 20px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", border:"none", background:"#2563EB", color:"#fff", fontFamily:"inherit" }}>Réessayer</button>
    </div>
  );
}

function StepperBar({ current }) {
  return (
    <div style={{ display:"flex", alignItems:"center", padding:"0 20px", height:52, flexShrink:0, background:"#fff", borderBottom:"1px solid rgba(0,0,0,0.07)", overflowX:"hidden", gap:0 }}>
      {STEPS.map((s,i) => {
        const done   = s.id < current;
        const active = s.id === current;
        return (
          <div key={s.id} style={{ display:"flex", alignItems:"center", flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:7, padding:"0 10px 0 0", height:52, borderBottom: active?"2px solid #2563EB":"2px solid transparent", opacity: s.id > current ? 0.4 : 1 }}>
              <div style={{ width:20, height:20, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, background: done?"#059669":active?"#2563EB":"#E2E8F0", color:(done||active)?"#fff":"#94A3B8", flexShrink:0 }}>
                {done ? "✓" : s.id}
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:active?600:500, color:active?"#2563EB":done?"#475569":"#94A3B8", whiteSpace:"nowrap" }}>{s.label}</div>
                <div style={{ fontSize:9, color:active?"rgba(37,99,235,0.7)":"#94A3B8", whiteSpace:"nowrap" }}>{s.sub}</div>
              </div>
            </div>
            {i < STEPS.length-1 && <span style={{ color:"#CBD5E1", fontSize:14, padding:"0 2px", flexShrink:0 }}>›</span>}
          </div>
        );
      })}
    </div>
  );
}

function ProjectBar({ name, onSave, onNext, canNext }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 18px", height:46, background:"#fff", flexShrink:0, borderBottom:"1px solid rgba(0,0,0,0.07)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <span style={{ fontSize:11, color:"#94A3B8" }}>Projet</span>
        <span style={{ color:"#CBD5E1" }}>›</span>
        <span style={{ fontSize:13, fontWeight:600, color:"#0F172A" }}>{name || "Nouveau projet"}</span>
        {name && <span style={{ fontSize:10, padding:"2px 7px", borderRadius:99, background:"rgba(37,99,235,0.1)", color:"#2563EB", border:"1px solid rgba(37,99,235,0.2)" }}>Actif</span>}
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={onSave} style={{ padding:"5px 11px", borderRadius:6, fontSize:11, fontWeight:500, cursor:"pointer", border:"1px solid rgba(0,0,0,0.1)", background:"#fff", color:"#475569", fontFamily:"inherit" }}>💾 Enregistrer</button>
        <button onClick={onNext} disabled={!canNext} style={{ padding:"5px 13px", borderRadius:6, fontSize:11, fontWeight:600, cursor:canNext?"pointer":"not-allowed", border:"none", background:canNext?"#2563EB":"#E2E8F0", color:canNext?"#fff":"#94A3B8", fontFamily:"inherit" }}>
          Continuer <ArrowRight size={11} style={{ display:"inline", verticalAlign:"middle" }} />
        </button>
      </div>
    </div>
  );
}

const card = { background:"#fff", border:"1px solid rgba(0,0,0,0.08)", borderRadius:12, boxShadow:"0 1px 3px rgba(0,0,0,0.04)", overflow:"hidden" };
const cardHdr = (title, right) => (
  <div style={{ padding:"10px 14px", borderBottom:"1px solid rgba(0,0,0,0.07)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
    <span style={{ fontSize:12, fontWeight:600, color:"#0F172A" }}>{title}</span>
    {right}
  </div>
);

// ─── ÉTAPE 1 : UPLOAD & CONTEXTE ─────────────────────────────────────────────
function Step1({ state, setState, onNext }) {
  const [drag, setDrag] = useState(false);
  const can = state.files.length > 0 && state.project.name.trim() && state.project.client.trim();

  const addFiles = useCallback((incoming) => {
    const arr = Array.from(incoming);
    setState(prev => {
      const ex = new Set(prev.files.map(f => f.name+f.size));
      return { ...prev, files: [...prev.files, ...arr.filter(f => !ex.has(f.name+f.size))] };
    });
  }, [setState]);

  const setP = (k, v) => setState(prev => ({ ...prev, project: { ...prev.project, [k]: v } }));
  const inp = { width:"100%", padding:"8px 11px", borderRadius:6, fontSize:12, border:"1px solid rgba(0,0,0,0.12)", background:"#F8F9FC", color:"#0F172A", fontFamily:"inherit", outline:"none", boxSizing:"border-box" };
  const lbl = { fontSize:10, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:5 };

  return (
    <div style={{ flex:1, display:"grid", gridTemplateColumns:"1fr 320px", gap:14, padding:14, background:"#F4F6FA", overflow:"hidden" }}>
      <div style={{ display:"flex", flexDirection:"column", gap:12, overflowY:"auto" }}>
        <div style={card}>
          {cardHdr("Documents du projet", state.files.length > 0 && <span style={{ fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:99, background:"rgba(37,99,235,0.1)", color:"#2563EB" }}>{state.files.length} fichier{state.files.length>1?"s":""}</span>)}
          <div style={{ padding:14 }}>
            <div onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)}
              onDrop={e=>{e.preventDefault();setDrag(false);addFiles(e.dataTransfer.files)}}
              onClick={()=>document.getElementById("psa-input").click()}
              style={{ border:`2px dashed ${drag?"#2563EB":"#CBD5E1"}`, borderRadius:10, padding:"28px 20px", textAlign:"center", cursor:"pointer", background:drag?"rgba(37,99,235,0.04)":"#F8F9FC", marginBottom: state.files.length>0?12:0 }}>
              <input id="psa-input" type="file" multiple accept=".pdf,.xlsx,.xls,.docx,.doc" style={{ display:"none" }} onChange={e=>addFiles(e.target.files)} />
              <Upload size={20} style={{ color:drag?"#2563EB":"#94A3B8", marginBottom:8 }} />
              <div style={{ fontSize:13, fontWeight:600, color:"#0F172A", marginBottom:4 }}>Glissez vos fichiers ici</div>
              <div style={{ fontSize:12, color:"#94A3B8" }}>ou <span style={{ color:"#2563EB", fontWeight:600 }}>parcourez</span></div>
              <div style={{ fontSize:10, color:"#CBD5E1", marginTop:6 }}>PDF · XLSX · DOCX — 50 Mo max</div>
            </div>
            {state.files.length > 0 && (
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {state.files.map((f,i) => { const ft=getFT(f.type); return (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 11px", borderRadius:8, background:"#F8F9FC", border:"1px solid rgba(0,0,0,0.07)" }}>
                    <div style={{ width:28, height:28, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", background:ft.bg, color:ft.color, fontSize:9, fontWeight:700, flexShrink:0 }}>{ft.label}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:500, color:"#0F172A", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.name}</div>
                      <div style={{ fontSize:10, color:"#94A3B8", marginTop:1 }}>{fmtSize(f.size)}</div>
                    </div>
                    <div style={{ width:17, height:17, borderRadius:"50%", background:"#ECFDF5", border:"1px solid #A7F3D0", display:"flex", alignItems:"center", justifyContent:"center", color:"#059669", fontSize:10, flexShrink:0 }}>✓</div>
                    <button onClick={()=>setState(prev=>({...prev,files:prev.files.filter((_,j)=>j!==i)}))}
                      style={{ background:"none", border:"none", cursor:"pointer", color:"#CBD5E1", padding:2, flexShrink:0 }}
                      onMouseEnter={e=>e.currentTarget.style.color="#DC2626"} onMouseLeave={e=>e.currentTarget.style.color="#CBD5E1"}>
                      <X size={13} />
                    </button>
                  </div>
                );})}
                <button onClick={()=>document.getElementById("psa-input").click()}
                  style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:5, padding:"7px", borderRadius:8, fontSize:11, fontWeight:500, cursor:"pointer", border:"1px dashed #CBD5E1", background:"transparent", color:"#475569", fontFamily:"inherit" }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor="#2563EB";e.currentTarget.style.color="#2563EB"}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="#CBD5E1";e.currentTarget.style.color="#475569"}}>
                  <Plus size={12} /> Ajouter d'autres fichiers
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={card}>
          {cardHdr("Fichiers recommandés")}
          <div style={{ padding:12, display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {[
              {l:"CCTP / Cahier des charges",ext:"PDF",c:"#DC2626",bg:"#FEE2E2",d:"Exigences techniques"},
              {l:"Export RVTools",ext:"XLSX",c:"#059669",bg:"#D1FAE5",d:"Inventaire VM, CPU, RAM"},
              {l:"Contexte projet",ext:"DOCX",c:"#2563EB",bg:"#DBEAFE",d:"Notes, historique"},
              {l:"Budget / Devis",ext:"XLSX",c:"#059669",bg:"#D1FAE5",d:"Enveloppe financière"},
            ].map((it,i) => (
              <div key={i} style={{ padding:"9px 11px", borderRadius:8, background:"#F8F9FC", border:"1px solid rgba(0,0,0,0.07)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                  <span style={{ fontSize:8, fontWeight:700, padding:"1px 5px", borderRadius:4, background:it.bg, color:it.c }}>{it.ext}</span>
                  <span style={{ fontSize:11, fontWeight:600, color:"#0F172A" }}>{it.l}</span>
                </div>
                <div style={{ fontSize:10, color:"#94A3B8" }}>{it.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:12, overflowY:"auto" }}>
        <div style={card}>
          {cardHdr("Contexte du projet")}
          <div style={{ padding:14, display:"flex", flexDirection:"column", gap:12 }}>
            <div>
              <span style={lbl}>Nom du projet *</span>
              <input style={inp} placeholder="Ex : Refonte SI Groupe Acme" value={state.project.name} onChange={e=>setP("name",e.target.value)} onFocus={e=>e.target.style.borderColor="#2563EB"} onBlur={e=>e.target.style.borderColor="rgba(0,0,0,0.12)"} />
            </div>
            <div>
              <span style={lbl}>Nom du client *</span>
              <input style={inp} placeholder="Ex : Groupe Acme" value={state.project.client} onChange={e=>setP("client",e.target.value)} onFocus={e=>e.target.style.borderColor="#2563EB"} onBlur={e=>e.target.style.borderColor="rgba(0,0,0,0.12)"} />
            </div>
            <div>
              <span style={lbl}>Contexte additionnel</span>
              <textarea style={{ ...inp, height:90, resize:"vertical", lineHeight:1.6 }} placeholder="Contraintes spécifiques, historique..." value={state.project.context} onChange={e=>setP("context",e.target.value)} onFocus={e=>e.target.style.borderColor="#2563EB"} onBlur={e=>e.target.style.borderColor="rgba(0,0,0,0.12)"} />
            </div>

            {(state.files.length>0||state.project.name) && (
              <div style={{ background:can?"rgba(37,99,235,0.05)":"#F8F9FC", border:`1px solid ${can?"rgba(37,99,235,0.2)":"rgba(0,0,0,0.07)"}`, borderRadius:8, padding:"10px 12px" }}>
                {[{l:"Projet",v:state.project.name||"—",ok:!!state.project.name},{l:"Client",v:state.project.client||"—",ok:!!state.project.client},{l:"Fichiers",v:state.files.length>0?state.files.length+" chargé(s)":"Aucun",ok:state.files.length>0}].map((r,i)=>(
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:i<2?"1px solid rgba(0,0,0,0.05)":"none" }}>
                    <span style={{ fontSize:11, color:"#475569" }}>{r.l}</span>
                    <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                      <span style={{ fontSize:11, fontWeight:500, color:"#0F172A" }}>{r.v}</span>
                      {r.ok ? <CheckCircle size={11} style={{ color:"#059669" }} /> : <div style={{ width:11, height:11, borderRadius:"50%", background:"#E2E8F0" }} />}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={onNext} disabled={!can} style={{ padding:"11px 0", borderRadius:8, fontSize:13, fontWeight:600, cursor:can?"pointer":"not-allowed", border:"none", background:can?"#2563EB":"#E2E8F0", color:can?"#fff":"#94A3B8", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
              Lancer l'analyse <ArrowRight size={14} />
            </button>
            {!can && <div style={{ fontSize:11, color:"#94A3B8", textAlign:"center", marginTop:-6 }}>{state.files.length===0?"Chargez au moins un document":"Renseignez projet et client"}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ÉTAPE 2 : ANALYSE & COMPRÉHENSION ───────────────────────────────────────
function Step2({ state, setState, onNext, onPrev }) {
  const [phase, setPhase] = useState(state.analysis ? "done" : "idle");
  const [err,   setErr]   = useState("");

  const run = async () => {
    try {
      setPhase("uploading");
      const fd = new FormData();
      state.files.forEach(f => fd.append("files", f));
      const upRes  = await fetch(`${API_BASE}/api/upload`, { method:"POST", body:fd });
      if (!upRes.ok) throw new Error(await upRes.text());
      const upData = await upRes.json();
      setState(prev => ({ ...prev, uploadedFiles: upData.files }));

      setPhase("analyzing");
      const anRes  = await fetch(`${API_BASE}/api/analyze`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ project: state.project, files: upData.files }) });
      if (!anRes.ok) throw new Error(await anRes.text());
      const anData = await anRes.json();
      setState(prev => ({ ...prev, analysis: anData }));
      setPhase("done");
    } catch(e) { setErr(e.message); setPhase("error"); }
  };

  if (phase==="uploading") return <Spinner label="Upload des documents vers Claude..." />;
  if (phase==="analyzing") return <Spinner label="Analyse approfondie en cours..." />;
  if (phase==="error")     return <ErrorScreen msg={err} onRetry={()=>setPhase("idle")} />;

  if (phase==="idle") return (
    <div style={{ flex:1, display:"grid", gridTemplateColumns:"1fr 300px", gap:14, padding:14, background:"#F4F6FA" }}>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div style={card}>
          {cardHdr("Documents à analyser", <span style={{ fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:99, background:"rgba(37,99,235,0.1)", color:"#2563EB" }}>{state.files.length} fichier{state.files.length>1?"s":""}</span>)}
          <div style={{ padding:14, display:"flex", flexDirection:"column", gap:7 }}>
            {state.files.map((f,i) => { const ft=getFT(f.type); return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 11px", borderRadius:8, background:"#F8F9FC", border:"1px solid rgba(0,0,0,0.07)" }}>
                <div style={{ width:28, height:28, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", background:ft.bg, color:ft.color, fontSize:9, fontWeight:700, flexShrink:0 }}>{ft.label}</div>
                <span style={{ fontSize:12, fontWeight:500, color:"#0F172A", flex:1 }}>{f.name}</span>
                <span style={{ fontSize:10, color:"#94A3B8" }}>{fmtSize(f.size)}</span>
              </div>
            );})}
          </div>
        </div>
        <div style={{ ...card, background:"rgba(37,99,235,0.03)", border:"1px solid rgba(37,99,235,0.15)" }}>
          <div style={{ padding:14 }}>
            <div style={{ fontSize:13, fontWeight:600, color:"#0F172A", marginBottom:6 }}>Analyse via API Files Anthropic</div>
            {["PDF envoyé nativement à Claude (pas d'extraction texte)", "Lecture complète du document sans troncature", "Compréhension structurée : faits connus + zones grises", "Génération des axes de qualification prioritaires"].map((it,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:7, marginTop:7 }}>
                <CheckCircle size={12} style={{ color:"#059669", flexShrink:0 }} />
                <span style={{ fontSize:11, color:"#475569" }}>{it}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        <div style={card}>
          {cardHdr("Projet")}
          <div style={{ padding:12 }}>
            {[{l:"Projet",v:state.project.name},{l:"Client",v:state.project.client}].map((r,i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid rgba(0,0,0,0.05)" }}>
                <span style={{ fontSize:11, color:"#94A3B8" }}>{r.l}</span>
                <span style={{ fontSize:11, fontWeight:600, color:"#0F172A" }}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={run} style={{ padding:"12px 0", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", border:"none", background:"#2563EB", color:"#fff", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
          ✦ Lancer l'analyse Claude <ArrowRight size={14} />
        </button>
        <button onClick={onPrev} style={{ padding:"8px 0", borderRadius:8, fontSize:11, fontWeight:500, cursor:"pointer", border:"1px solid rgba(0,0,0,0.1)", background:"#fff", color:"#475569", fontFamily:"inherit" }}>← Modifier les fichiers</button>
      </div>
    </div>
  );

  const a = state.analysis;
  const u = a.understanding || {};
  return (
    <div style={{ flex:1, overflow:"hidden", display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, padding:14, background:"#F4F6FA" }}>
      <div style={{ display:"flex", flexDirection:"column", gap:12, overflowY:"auto" }}>
        <div style={card}>
          {cardHdr("Synthèse du projet")}
          <div style={{ padding:14, fontSize:13, color:"#475569", lineHeight:1.7 }}>{a.synthesis}</div>
        </div>
        <div style={card}>
          {cardHdr("Architecture existante lue")}
          <div style={{ padding:14 }}>
            {[["Serveurs",u.existingArch?.servers],["Stockage",u.existingArch?.storage],["Réseau",u.existingArch?.network],["Virtua.",u.existingArch?.virtualization],["Backup",u.existingArch?.backup]].filter(r=>r[1]).map(([l,v],i) => (
              <div key={i} style={{ display:"flex", gap:10, padding:"6px 0", borderBottom:"1px solid rgba(0,0,0,0.05)" }}>
                <span style={{ fontSize:10, fontWeight:700, color:"#94A3B8", minWidth:60, flexShrink:0 }}>{l}</span>
                <span style={{ fontSize:12, color:"#0F172A", lineHeight:1.5, flex:1, wordBreak:"break-word" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={card}>
          {cardHdr("Architecture cible demandée")}
          <div style={{ padding:14 }}>
            {[["Serveurs",u.targetArch?.servers],["Stockage",u.targetArch?.storage],["Réseau",u.targetArch?.network],["Virtua.",u.targetArch?.virtualization],["Backup",u.targetArch?.backup]].filter(r=>r[1]).map(([l,v],i) => (
              <div key={i} style={{ display:"flex", gap:10, padding:"6px 0", borderBottom:"1px solid rgba(0,0,0,0.05)" }}>
                <span style={{ fontSize:10, fontWeight:700, color:"#94A3B8", minWidth:60, flexShrink:0 }}>{l}</span>
                <span style={{ fontSize:12, color:"#0F172A", lineHeight:1.5, flex:1, wordBreak:"break-word" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:12, overflowY:"auto" }}>
        <div style={card}>
          {cardHdr("✅ Faits connus (pas de questions)")}
          <div style={{ padding:14, display:"flex", flexDirection:"column", gap:5 }}>
            {(u.knownFacts||[]).map((f,i) => (
              <div key={i} style={{ display:"flex", gap:7, padding:"6px 9px", background:"rgba(5,150,105,0.06)", borderRadius:7, border:"1px solid rgba(5,150,105,0.15)" }}>
                <span style={{ color:"#059669", flexShrink:0, fontSize:11 }}>✓</span>
                <span style={{ fontSize:11, color:"#475569", lineHeight:1.5 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={card}>
          {cardHdr("🔍 Zones grises détectées")}
          <div style={{ padding:14, display:"flex", flexDirection:"column", gap:5 }}>
            {(u.blindSpots||[]).map((b,i) => (
              <div key={i} style={{ display:"flex", gap:7, padding:"6px 9px", background:"rgba(37,99,235,0.06)", borderRadius:7, border:"1px solid rgba(37,99,235,0.15)" }}>
                <span style={{ color:"#2563EB", flexShrink:0, fontSize:11 }}>?</span>
                <span style={{ fontSize:11, color:"#475569", lineHeight:1.5 }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
        {(u.inconsistencies||[]).length > 0 && (
          <div style={card}>
            {cardHdr("⚠️ Incohérences détectées")}
            <div style={{ padding:14, display:"flex", flexDirection:"column", gap:5 }}>
              {u.inconsistencies.map((c,i) => (
                <div key={i} style={{ display:"flex", gap:7, padding:"6px 9px", background:"rgba(217,119,6,0.06)", borderRadius:7, border:"1px solid rgba(217,119,6,0.15)" }}>
                  <span style={{ color:"#D97706", flexShrink:0, fontSize:11 }}>!</span>
                  <span style={{ fontSize:11, color:"#475569", lineHeight:1.5 }}>{c}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <button onClick={onNext} style={{ padding:"11px 0", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", border:"none", background:"#2563EB", color:"#fff", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          Points d'attention <ArrowRight size={13} />
        </button>
        <button onClick={()=>setPhase("idle")} style={{ padding:"8px 0", borderRadius:7, fontSize:11, fontWeight:500, cursor:"pointer", border:"1px solid rgba(0,0,0,0.1)", background:"#fff", color:"#475569", fontFamily:"inherit" }}>↺ Relancer l'analyse</button>
      </div>
    </div>
  );
}

// ─── ÉTAPE 3 : POINTS D'ATTENTION & QUESTIONS ────────────────────────────────
function Step3({ state, setState, onNext, onPrev }) {
  const [phase, setPhase]     = useState(state.questions.length > 0 ? "done" : "idle");
  const [err,   setErr]       = useState("");
  const [tab,   setTab]       = useState("all");
  const [bm,    setBm]        = useState(new Set());
  const [modal, setModal]     = useState(null);

  const run = async () => {
    try {
      setPhase("loading");
      const res    = await fetch(`${API_BASE}/api/questions`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ project: state.project, analysis: state.analysis, files: state.uploadedFiles || [] }) });
      if (!res.ok) throw new Error(await res.text());
      const data   = await res.json();
      setState(prev => ({ ...prev, questions: data.questions || [] }));
      setPhase("done");
    } catch(e) { setErr(e.message); setPhase("error"); }
  };

  if (phase==="loading") return <Spinner label="Génération des questions..." />;
  if (phase==="error")   return <ErrorScreen msg={err} onRetry={()=>setPhase("idle")} />;

  const qs = state.questions;
  const filtered = tab==="prio" ? qs.filter(q=>q.prio==="high") : tab==="bm" ? qs.filter((_,i)=>bm.has(i)) : tab==="ans" ? qs.filter((_,i)=>state.answers[i]) : qs;
  const u  = state.analysis?.understanding || {};

  if (phase==="idle") return (
    <div style={{ flex:1, display:"grid", gridTemplateColumns:"1fr 300px", gap:14, padding:14, background:"#F4F6FA" }}>
      <div style={{ display:"flex", flexDirection:"column", gap:12, overflowY:"auto" }}>
        <div style={card}>
          {cardHdr("Points d'attention du CCTP")}
          <div style={{ padding:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#059669", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>✅ Sujets couverts</div>
            {(u.knownFacts||[]).slice(0,5).map((f,i) => (
              <div key={i} style={{ display:"flex", gap:7, padding:"5px 8px", marginBottom:4, background:"rgba(5,150,105,0.06)", borderRadius:6 }}>
                <span style={{ color:"#059669", fontSize:11 }}>✓</span>
                <span style={{ fontSize:11, color:"#475569" }}>{f}</span>
              </div>
            ))}
            <div style={{ fontSize:11, fontWeight:700, color:"#2563EB", textTransform:"uppercase", letterSpacing:"0.06em", marginTop:12, marginBottom:8 }}>🔍 Zones grises</div>
            {(u.blindSpots||[]).map((b,i) => (
              <div key={i} style={{ display:"flex", gap:7, padding:"5px 8px", marginBottom:4, background:"rgba(37,99,235,0.06)", borderRadius:6 }}>
                <span style={{ color:"#2563EB", fontSize:11 }}>?</span>
                <span style={{ fontSize:11, color:"#475569" }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        <button onClick={run} style={{ padding:"12px 0", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", border:"none", background:"#2563EB", color:"#fff", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
          ✦ Générer les questions <ArrowRight size={14} />
        </button>
        <button onClick={onPrev} style={{ padding:"8px 0", borderRadius:8, fontSize:11, fontWeight:500, cursor:"pointer", border:"1px solid rgba(0,0,0,0.1)", background:"#fff", color:"#475569", fontFamily:"inherit" }}>← Retour à l'analyse</button>
      </div>
    </div>
  );

  return (
    <div style={{ flex:1, overflow:"hidden", display:"grid", gridTemplateColumns:"1fr 260px", gap:14, padding:14, background:"#F4F6FA" }}>
      <div style={{ display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ ...card, display:"flex", flexDirection:"column", height:"100%" }}>
          {cardHdr("Questions à poser au client", <button onClick={()=>{setState(prev=>({...prev,questions:[]}));setPhase("idle");}} style={{ fontSize:10, padding:"4px 9px", borderRadius:6, cursor:"pointer", border:"1px solid rgba(0,0,0,0.08)", background:"#fff", color:"#475569", fontFamily:"inherit" }}>↺ Regénérer</button>)}
          <div style={{ padding:"8px 12px 0", display:"flex", gap:4, flexShrink:0 }}>
            {[{id:"all",l:"Toutes",c:qs.length},{id:"prio",l:"Prioritaires",c:qs.filter(q=>q.prio==="high").length},{id:"ans",l:"Répondues",c:Object.keys(state.answers||{}).length},{id:"bm",l:"Sauvegardées",c:bm.size}].map(t => (
              <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:"4px 10px", borderRadius:99, fontSize:10, fontWeight:500, cursor:"pointer", border:"1px solid", borderColor:tab===t.id?"#2563EB":"rgba(0,0,0,0.08)", background:tab===t.id?"#2563EB":"#fff", color:tab===t.id?"#fff":"#475569", fontFamily:"inherit" }}>
                {t.l} ({t.c})
              </button>
            ))}
          </div>
          <div style={{ padding:"8px 12px", flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:5 }}>
            {filtered.map((q,i) => {
              const ri  = qs.indexOf(q);
              const ans = state.answers?.[ri];
              const dot = PRIO[q.prio]||PRIO.med;
              return (
                <div key={i} onClick={()=>setModal({q,idx:ri})} style={{ display:"flex", alignItems:"flex-start", gap:9, padding:"10px 12px", borderRadius:8, cursor:"pointer", transition:"all .15s", border:ans?"1px solid rgba(5,150,105,0.25)":"1px solid rgba(0,0,0,0.07)", background:ans?"rgba(5,150,105,0.04)":"#fff" }}>
                  <div style={{ width:7, height:7, borderRadius:"50%", background:ans?"#059669":dot.color, flexShrink:0, marginTop:5 }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, color:"#0F172A", lineHeight:1.5 }}>{q.text}</div>
                    {q.axis && <div style={{ fontSize:10, color:"#94A3B8", marginTop:2 }}>{q.axis}</div>}
                    {ans && <div style={{ fontSize:11, color:"#059669", marginTop:4, padding:"3px 7px", background:"rgba(5,150,105,0.08)", borderRadius:5 }}>✓ {ans}</div>}
                  </div>
                  <PrioBadge level={q.prio} />
                  <div onClick={e=>{e.stopPropagation();setBm(prev=>{const n=new Set(prev);n.has(ri)?n.delete(ri):n.add(ri);return n;})}} style={{ color:bm.has(ri)?"#2563EB":"#CBD5E1", cursor:"pointer", flexShrink:0, padding:2 }}>
                    <Bookmark size={13} fill={bm.has(ri)?"currentColor":"none"} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ padding:"8px 12px", borderTop:"1px solid rgba(0,0,0,0.07)", display:"flex", justifyContent:"space-between", fontSize:11, color:"#94A3B8" }}>
            <span>{Object.keys(state.answers||{}).length} réponse(s) · {bm.size} sauvegardée(s)</span>
            <span style={{ color:"#2563EB", cursor:"pointer", fontWeight:500 }}>→ Exporter</span>
          </div>
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:12, overflowY:"auto" }}>
        <div style={card}>
          {cardHdr("Zones grises")}
          <div style={{ padding:12, display:"flex", flexDirection:"column", gap:5 }}>
            {(u.blindSpots||[]).map((b,i) => (
              <div key={i} style={{ fontSize:11, color:"#475569", padding:"5px 8px", background:"rgba(37,99,235,0.06)", borderRadius:6 }}>? {b}</div>
            ))}
          </div>
        </div>
        <div style={card}>
          {cardHdr("Points d'attention")}
          <div style={{ padding:12, display:"flex", flexDirection:"column", gap:5 }}>
            {(state.analysis?.alerts||[]).map((a,i) => (
              <div key={i} style={{ display:"flex", gap:7, padding:"6px 8px", borderRadius:6, background:a.type==="warn"?"rgba(217,119,6,0.07)":"rgba(37,99,235,0.07)", border:`1px solid ${a.type==="warn"?"rgba(217,119,6,0.2)":"rgba(37,99,235,0.2)"}` }}>
                {a.type==="warn" ? <AlertTriangle size={11} style={{ color:"#D97706", flexShrink:0, marginTop:1 }} /> : <Info size={11} style={{ color:"#2563EB", flexShrink:0, marginTop:1 }} />}
                <span style={{ fontSize:11, color:"#475569" }}>{a.text}</span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={onNext} style={{ padding:"11px 0", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", border:"none", background:"#2563EB", color:"#fff", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          Enrichissement <ArrowRight size={13} />
        </button>
      </div>

      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={()=>setModal(null)}>
          <div style={{ background:"#fff", borderRadius:14, width:"100%", maxWidth:520, boxShadow:"0 20px 60px rgba(0,0,0,0.15)" }} onClick={e=>e.stopPropagation()}>
            <div style={{ padding:"13px 16px", borderBottom:"1px solid rgba(0,0,0,0.07)", display:"flex", gap:10 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, fontWeight:700, color:"#2563EB", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>Question</div>
                <div style={{ fontSize:13, color:"#0F172A", lineHeight:1.55, fontWeight:500 }}>{modal.q.text}</div>
              </div>
              <button onClick={()=>setModal(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"#94A3B8", fontSize:18 }}>✕</button>
            </div>
            <div style={{ padding:16 }}>
              <div style={{ fontSize:10, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:7 }}>Réponse / Notes AV</div>
              <textarea autoFocus value={state.answers?.[modal.idx]||""} onChange={e=>setState(prev=>({...prev,answers:{...prev.answers,[modal.idx]:e.target.value}}))} placeholder="Saisir la réponse du client ou vos notes..." style={{ width:"100%", minHeight:110, padding:"9px 11px", borderRadius:8, border:"1px solid rgba(0,0,0,0.12)", fontSize:13, color:"#0F172A", fontFamily:"inherit", lineHeight:1.6, resize:"vertical", outline:"none", background:"#F8F9FC", boxSizing:"border-box" }} onFocus={e=>e.target.style.borderColor="#2563EB"} onBlur={e=>e.target.style.borderColor="rgba(0,0,0,0.12)"} />
              <div style={{ fontSize:11, color:"#94A3B8", marginTop:5 }}>💡 Cette réponse influencera l'agenda de réponse</div>
            </div>
            <div style={{ padding:"11px 16px", borderTop:"1px solid rgba(0,0,0,0.07)", display:"flex", gap:7, justifyContent:"flex-end" }}>
              {state.answers?.[modal.idx] && <button onClick={()=>{setState(prev=>{const a={...prev.answers};delete a[modal.idx];return{...prev,answers:a};});setModal(null);}} style={{ padding:"6px 13px", borderRadius:7, fontSize:12, cursor:"pointer", border:"1px solid rgba(220,38,38,0.2)", background:"rgba(220,38,38,0.05)", color:"#DC2626", fontFamily:"inherit" }}>Effacer</button>}
              <button onClick={()=>setModal(null)} style={{ padding:"6px 13px", borderRadius:7, fontSize:12, cursor:"pointer", border:"1px solid rgba(0,0,0,0.1)", background:"#fff", color:"#475569", fontFamily:"inherit" }}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ÉTAPE 4 : ENRICHISSEMENT ─────────────────────────────────────────────────
function Step4({ state, setState, onNext, onPrev }) {
  const answeredCount = Object.keys(state.answers||{}).length;
  return (
    <div style={{ flex:1, overflow:"hidden", display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, padding:14, background:"#F4F6FA" }}>
      <div style={{ display:"flex", flexDirection:"column", gap:12, overflowY:"auto" }}>
        <div style={card}>
          {cardHdr("Réponses enregistrées", <span style={{ fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:99, background:"rgba(5,150,105,0.1)", color:"#059669" }}>{answeredCount} réponse{answeredCount>1?"s":""}</span>)}
          <div style={{ padding:14 }}>
            {answeredCount === 0 ? (
              <div style={{ textAlign:"center", padding:"20px 0", color:"#94A3B8", fontSize:12 }}>Aucune réponse enregistrée — retournez à l'étape précédente pour répondre aux questions</div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {(state.questions||[]).map((q,i) => state.answers?.[i] ? (
                  <div key={i} style={{ padding:"9px 11px", background:"#F8F9FC", borderRadius:8, border:"1px solid rgba(5,150,105,0.15)" }}>
                    <div style={{ fontSize:11, color:"#475569", marginBottom:4, lineHeight:1.4 }}>{q.text}</div>
                    <div style={{ fontSize:12, fontWeight:600, color:"#059669" }}>→ {state.answers[i]}</div>
                  </div>
                ) : null)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:12, overflowY:"auto" }}>
        <div style={card}>
          {cardHdr("Notes libres AV")}
          <div style={{ padding:14 }}>
            <textarea value={state.notes||""} onChange={e=>setState(prev=>({...prev,notes:e.target.value}))} placeholder="Notes de réunion, éléments verbaux du client, contraintes non documentées, décisions prises..." style={{ width:"100%", minHeight:200, padding:"10px 12px", borderRadius:8, border:"1px solid rgba(0,0,0,0.12)", fontSize:12, color:"#0F172A", fontFamily:"inherit", lineHeight:1.7, resize:"vertical", outline:"none", background:"#F8F9FC", boxSizing:"border-box" }} onFocus={e=>e.target.style.borderColor="#2563EB"} onBlur={e=>e.target.style.borderColor="rgba(0,0,0,0.12)"} />
            <div style={{ fontSize:11, color:"#94A3B8", marginTop:6 }}>💡 Ces notes enrichiront l'agenda et le PowerPoint généré</div>
          </div>
        </div>

        <div style={card}>
          {cardHdr("Résumé de l'enrichissement")}
          <div style={{ padding:14 }}>
            {[
              {l:"Questions répondues", v:answeredCount + " / " + (state.questions?.length||0), ok:answeredCount>0},
              {l:"Notes AV", v:(state.notes||"").length > 0 ? (state.notes.length + " caractères") : "Vides", ok:(state.notes||"").length>0},
            ].map((r,i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:"1px solid rgba(0,0,0,0.05)" }}>
                <span style={{ fontSize:12, color:"#475569" }}>{r.l}</span>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:12, fontWeight:500, color:"#0F172A" }}>{r.v}</span>
                  {r.ok ? <CheckCircle size={12} style={{ color:"#059669" }} /> : <div style={{ width:12, height:12, borderRadius:"50%", background:"#E2E8F0" }} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={onNext} style={{ padding:"11px 0", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", border:"none", background:"#2563EB", color:"#fff", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          Générer l'agenda <ArrowRight size={13} />
        </button>
        <button onClick={onPrev} style={{ padding:"8px 0", borderRadius:7, fontSize:11, fontWeight:500, cursor:"pointer", border:"1px solid rgba(0,0,0,0.1)", background:"#fff", color:"#475569", fontFamily:"inherit" }}>← Retour aux questions</button>
      </div>
    </div>
  );
}

// ─── ÉTAPE 5 : AGENDA & EXPORT ────────────────────────────────────────────────
function Step5({ state, setState, onPrev }) {
  const [phase, setPhase]   = useState(state.agenda ? "done" : "idle");
  const [err,   setErr]     = useState("");
  const [pptxP, setPptxP]   = useState(false);
  const [pptxOk,setPptxOk]  = useState(false);
  const [editing, setEditing] = useState(null); // section en édition

  const runAgenda = async () => {
    try {
      setPhase("loading");
      const res  = await fetch(`${API_BASE}/api/agenda`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ project:state.project, analysis:state.analysis, questions:state.questions, answers:state.answers, notes:state.notes }) });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setState(prev => ({ ...prev, agenda: data }));
      setPhase("done");
    } catch(e) { setErr(e.message); setPhase("error"); }
  };

  const exportPPTX = async () => {
    try {
      setPptxP(true);
      const res    = await fetch(`${API_BASE}/api/generate-pptx-content`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ project:state.project, analysis:state.analysis, questions:state.questions, answers:state.answers, agenda:state.agenda }) });
      if (!res.ok) throw new Error(await res.text());
      const content = await res.json();

      const PptxGenJS = (await import("pptxgenjs")).default;
      const prs = new PptxGenJS();
      prs.layout = "LAYOUT_WIDE";
      const C = { navy:"1B2B4B", blue:"2563EB", white:"FFFFFF", grey:"F4F6FA", greyD:"475569", greyM:"94A3B8", dark:"0F172A", green:"059669" };
      const aS = (bg) => { const s=prs.addSlide(); s.background={color:bg||C.white}; return s; };
      const R  = (s,x,y,w,h,fill) => s.addShape(prs.ShapeType.rect,{x,y,w,h,fill:{color:fill},line:{color:fill}});
      const T  = (s,text,x,y,w,h,o={}) => s.addText(String(text||""),{x,y,w,h,wrap:true,fontFace:"Calibri",fontSize:o.sz||13,bold:o.b||false,color:o.c||C.dark,align:o.a||"left",valign:o.v||"top",italic:o.i||false});

      // Slide 1 couverture
      { const s=aS(C.navy); R(s,0,5.5,13.33,2,C.blue);
        T(s,"PROPOSITION TECHNIQUE",0.7,1.0,12,0.4,{sz:11,c:C.greyM,b:true});
        T(s,content.slide_cover?.title||state.project.name,0.7,1.5,11.5,1.4,{sz:34,b:true,c:C.white});
        T(s,content.slide_cover?.subtitle||"",0.7,3.2,11,0.7,{sz:15,c:C.greyM});
        T(s,"Client : "+state.project.client,0.7,4.1,8,0.4,{sz:13,c:C.greyM});
        T(s,new Date().toLocaleDateString("fr-FR",{year:"numeric",month:"long"}),0.7,5.7,6,0.4,{sz:11,c:C.white}); }

      // Slide 2 contexte
      { const s=aS(); R(s,0,0,13.33,0.75,C.navy);
        T(s,"Contexte & Situation",0.4,0.13,12,0.5,{sz:20,b:true,c:C.white});
        T(s,content.slide_context?.intro||"",0.4,0.95,12.5,0.8,{sz:14,c:C.dark,b:true});
        T(s,content.slide_context?.situation||"",0.4,1.9,12.5,1.2,{sz:13,c:C.greyD});
        T(s,content.slide_context?.challenge||"",0.4,3.3,12.5,1.0,{sz:13,c:C.dark}); }

      // Slide 3 enjeux
      { const s=aS(); R(s,0,0,13.33,0.75,C.navy);
        T(s,"Enjeux identifiés",0.4,0.13,12,0.5,{sz:20,b:true,c:C.white});
        (content.slide_enjeux?.items||state.analysis?.enjeux||[]).slice(0,5).forEach((e,i)=>{
          R(s,0.4,1.0+i*1.1,0.65,0.9,C.blue);
          T(s,String(i+1),0.4,1.02+i*1.1,0.65,0.8,{sz:18,b:true,c:C.white,a:"center"});
          R(s,1.15,1.0+i*1.1,11.75,0.9,i%2===0?C.grey:C.white);
          T(s,e,1.3,1.05+i*1.1,11.45,0.8,{sz:12,c:C.dark,v:"middle"}); }); }

      // Slide 4 agenda
      if (state.agenda) {
        const s=aS(); R(s,0,0,13.33,0.75,C.navy);
        T(s,"Agenda de réponse",0.4,0.13,12,0.5,{sz:20,b:true,c:C.white});
        (state.agenda.sections||[]).slice(0,6).forEach((sec,i)=>{
          const col=i%2, row=Math.floor(i/2);
          R(s,0.4+col*6.6,1.0+row*2.0,6.2,1.8,col===0?C.grey:"EFF6FF");
          T(s,sec.title,0.55+col*6.6,1.1+row*2.0,5.9,0.4,{sz:12,b:true,c:C.blue});
          T(s,sec.objective||"",0.55+col*6.6,1.55+row*2.0,5.9,1.1,{sz:10,c:C.greyD}); }); }

      // Slide 5 prochaines étapes
      { const s=aS(); R(s,0,0,13.33,0.75,C.navy);
        T(s,"Prochaines étapes",0.4,0.13,12,0.5,{sz:20,b:true,c:C.white});
        (content.slide_next_steps?.steps||[]).slice(0,4).forEach((step,i)=>{
          R(s,0.4+i*3.25,1.0,3.05,5.5,["1B2B4B","2563EB","1D4ED8","1E40AF"][i]);
          T(s,String(i+1),0.4+i*3.25,1.15,3.05,0.7,{sz:28,b:true,c:C.white,a:"center"});
          T(s,step.step||"",0.5+i*3.25,2.0,2.85,0.5,{sz:12,b:true,c:C.white,a:"center"});
          T(s,step.desc||"",0.5+i*3.25,2.6,2.85,2.0,{sz:10,c:C.greyM,a:"center"});
          T(s,step.delai||"",0.5+i*3.25,5.8,2.85,0.4,{sz:10,c:C.white,a:"center",b:true}); }); }

      // Slide 6 conclusion
      { const s=aS(C.navy);
        T(s,content.slide_conclusion?.pitch_final||"",0.7,1.5,11.9,2.0,{sz:26,b:true,c:C.white});
        T(s,content.slide_conclusion?.call_to_action||"",0.7,4.0,11.9,1.0,{sz:16,c:C.greyM});
        T(s,"SizingHub Pre-Sales Assistant",0.7,6.8,12,0.35,{sz:10,c:"4A5568",a:"center"}); }

      const fn=(state.project.name||"proposition").replace(/[^a-zA-Z0-9]/g,"_")+"_SizingHub.pptx";
      await prs.writeFile({fileName:fn});
      setPptxOk(true);
    } catch(e) { alert("Erreur PPTX: "+e.message); }
    finally { setPptxP(false); }
  };

  if (phase==="loading") return <Spinner label="Génération de l'agenda..." />;
  if (phase==="error")   return <ErrorScreen msg={err} onRetry={()=>setPhase("idle")} />;

  if (phase==="idle") return (
    <div style={{ flex:1, display:"grid", gridTemplateColumns:"1fr 300px", gap:14, padding:14, background:"#F4F6FA" }}>
      <div style={{ display:"flex", flexDirection:"column", gap:12, overflowY:"auto" }}>
        <div style={card}>
          {cardHdr("Récapitulatif de la qualification")}
          <div style={{ padding:14 }}>
            {[
              {l:"Projet",v:state.project.name},
              {l:"Client",v:state.project.client},
              {l:"Type",v:state.analysis?.projectType},
              {l:"Fichiers analysés",v:(state.files?.length||0)+" document(s)"},
              {l:"Questions générées",v:state.questions?.length||0},
              {l:"Réponses client",v:Object.keys(state.answers||{}).length},
              {l:"Notes AV",v:(state.notes||"").length>0?"Oui":"Non"},
            ].map((r,i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid rgba(0,0,0,0.05)" }}>
                <span style={{ fontSize:12, color:"#94A3B8" }}>{r.l}</span>
                <span style={{ fontSize:12, fontWeight:600, color:"#0F172A" }}>{r.v||"—"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        <button onClick={runAgenda} style={{ padding:"12px 0", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", border:"none", background:"#2563EB", color:"#fff", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
          ✦ Générer l'agenda <ArrowRight size={14} />
        </button>
        <button onClick={onPrev} style={{ padding:"8px 0", borderRadius:8, fontSize:11, fontWeight:500, cursor:"pointer", border:"1px solid rgba(0,0,0,0.1)", background:"#fff", color:"#475569", fontFamily:"inherit" }}>← Retour</button>
      </div>
    </div>
  );

  const ag = state.agenda;
  return (
    <div style={{ flex:1, overflow:"hidden", display:"grid", gridTemplateColumns:"1fr 300px", gap:14, padding:14, background:"#F4F6FA" }}>
      <div style={{ display:"flex", flexDirection:"column", gap:12, overflowY:"auto" }}>
        <div style={card}>
          {cardHdr(ag.title || "Agenda de réponse", <span style={{ fontSize:10, color:"#94A3B8" }}>{ag.total_duration_min} min</span>)}
          <div style={{ padding:14, display:"flex", flexDirection:"column", gap:8 }}>
            {(ag.sections||[]).map((sec,i) => (
              <div key={i} style={{ borderRadius:10, border:"1px solid rgba(0,0,0,0.08)", overflow:"hidden" }}>
                <div style={{ padding:"10px 14px", background:"#F8F9FC", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer" }} onClick={()=>setEditing(editing===i?null:i)}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:24, height:24, borderRadius:"50%", background:"#2563EB", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#fff", flexShrink:0 }}>{i+1}</div>
                    <div>
                      <div style={{ fontSize:12, fontWeight:600, color:"#0F172A" }}>{sec.title}</div>
                      <div style={{ fontSize:10, color:"#94A3B8" }}>{sec.duration_min} min · {sec.objective}</div>
                    </div>
                  </div>
                  <span style={{ color:"#94A3B8", fontSize:12 }}>{editing===i?"▾":"›"}</span>
                </div>
                {editing===i && (
                  <div style={{ padding:14 }}>
                    <div style={{ fontSize:11, fontWeight:600, color:"#0F172A", marginBottom:7 }}>Points clés</div>
                    {(sec.content_points||[]).map((p,j) => (
                      <div key={j} style={{ fontSize:11, color:"#475569", padding:"4px 0", borderBottom:"1px solid rgba(0,0,0,0.05)" }}>• {p}</div>
                    ))}
                    {sec.placeholder && (
                      <div style={{ marginTop:10, padding:"8px 11px", background:"rgba(217,119,6,0.07)", borderRadius:7, border:"1px solid rgba(217,119,6,0.2)", fontSize:11, color:"#D97706", fontStyle:"italic" }}>
                        📝 {sec.placeholder}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {ag.preparation_tips?.length > 0 && (
          <div style={card}>
            {cardHdr("💡 Conseils de préparation")}
            <div style={{ padding:12, display:"flex", flexDirection:"column", gap:6 }}>
              {ag.preparation_tips.map((t,i) => (
                <div key={i} style={{ fontSize:11, color:"#475569", padding:"5px 8px", background:"rgba(37,99,235,0.06)", borderRadius:6 }}>• {t}</div>
              ))}
            </div>
          </div>
        )}

        <div style={card}>
          {cardHdr("Export")}
          <div style={{ padding:14, display:"flex", flexDirection:"column", gap:10 }}>
            {pptxOk && <div style={{ textAlign:"center", fontSize:13, fontWeight:600, color:"#059669" }}>✅ PowerPoint téléchargé !</div>}
            <button onClick={exportPPTX} disabled={pptxP} style={{ padding:"11px 0", borderRadius:8, fontSize:12, fontWeight:600, cursor:pptxP?"wait":"pointer", border:"none", background:pptxP?"#E2E8F0":"#2563EB", color:pptxP?"#94A3B8":"#fff", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
              {pptxP ? "⏳ Génération..." : "📥 Exporter en PowerPoint"}
            </button>
            <button onClick={()=>{setState(prev=>({...prev,agenda:null}));setPhase("idle");setPptxOk(false);}} style={{ padding:"8px 0", borderRadius:7, fontSize:11, fontWeight:500, cursor:"pointer", border:"1px solid rgba(0,0,0,0.1)", background:"#fff", color:"#475569", fontFamily:"inherit" }}>↺ Regénérer l'agenda</button>
            <button onClick={onPrev} style={{ padding:"8px 0", borderRadius:7, fontSize:11, fontWeight:500, cursor:"pointer", border:"1px solid rgba(0,0,0,0.1)", background:"#fff", color:"#475569", fontFamily:"inherit" }}>← Retour</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function PreSalesAssistant({ th, isMobile = false }) {
  const [step,        setStep]        = useState(1);
  const [maxReached,  setMaxReached]  = useState(1);
  const [state,       setState]       = useState(INIT);

  const goTo = (s) => { setStep(s); if (s > maxReached) setMaxReached(s); };
  const next  = () => goTo(Math.min(5, step + 1));
  const prev  = () => goTo(Math.max(1, step - 1));

  const canNext = step === 1
    ? state.files.length > 0 && state.project.name.trim() && state.project.client.trim()
    : true;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden", margin: isMobile?"-60px -12px -12px":"-28px" }}>
      <ProjectBar name={state.project.name} onSave={()=>{}} onNext={next} canNext={canNext} />
      <StepperBar current={step} />
      {step===1 && <Step1 state={state} setState={setState} onNext={next} />}
      {step===2 && <Step2 state={state} setState={setState} onNext={next} onPrev={prev} />}
      {step===3 && <Step3 state={state} setState={setState} onNext={next} onPrev={prev} />}
      {step===4 && <Step4 state={state} setState={setState} onNext={next} onPrev={prev} />}
      {step===5 && <Step5 state={state} setState={setState} onPrev={prev} />}
    </div>
  );
}
