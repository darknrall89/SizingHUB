import { useState, useMemo } from "react";

// ── Constantes ────────────────────────────────────────────────────────────────
const INFRA_TYPES = [
  {id:"vmware",  label:"VMware",  icon:"vm"},
  {id:"proxmox", label:"Proxmox", icon:"px"},
  {id:"nutanix", label:"Nutanix", icon:"nt"},
  {id:"other",   label:"Autre",   icon:"??"},
];

const FLOWS = [
  {id:"mgmt",    label:"Management", color:"#f59e0b", vlan:10},
  {id:"prod",    label:"Production", color:"#8b5cf6", vlan:20},
  {id:"storage", label:"Stockage",   color:"#10b981", vlan:30},
  {id:"backup",  label:"Backup",     color:"#3b82f6", vlan:40},
  {id:"interco", label:"Interco DC", color:"#f97316", vlan:50},
];

const RESILIENCE = [
  {id:"standard", label:"Standard",          desc:"Infrastructure de base"},
  {id:"ha",       label:"Haute disponibilite",desc:"Redondance composants"},
  {id:"enterprise",label:"Enterprise",        desc:"Tolerance de panne avancee"},
];

const NIC_SPEEDS = [1,10,25,100];

// ── Helpers ───────────────────────────────────────────────────────────────────
const calcDesign = (servers, nicPerServer, nicSpeed, flows, resilience) => {
  const totalPorts   = servers * nicPerServer;
  const uplinkSpeed  = nicSpeed >= 25 ? 100 : 10;
  const leafCount    = resilience === "enterprise" ? Math.ceil(servers/16)*2 : Math.ceil(servers/24)*(resilience==="ha"?2:1);
  const spineCount   = resilience === "standard" ? 0 : 2;
  const portsPerLeaf = 48;
  const usedPorts    = totalPorts;
  const totalPortsAvail = leafCount * portsPerLeaf;
  const uplinkPerLeaf   = 4;
  const oversubRaw  = usedPorts / (leafCount * uplinkPerLeaf * uplinkSpeed / nicSpeed);
  const oversubRatio = parseFloat(Math.max(1, oversubRaw).toFixed(1));
  const totalBw     = leafCount * uplinkPerLeaf * uplinkSpeed;
  const score = Math.min(100, Math.round(
    (resilience==="enterprise"?40:resilience==="ha"?25:10) +
    (nicSpeed>=25?20:10) +
    (spineCount>0?20:0) +
    (oversubRatio<=2?20:oversubRatio<=4?10:0) +
    (flows.length>=3?10:5)
  ));
  const level = score>=80?"Enterprise":score>=60?"Intermediaire":"Basique";
  const recs = [];
  if (resilience==="standard") recs.push({type:"warning", text:"Pas de redondance — risque SPOF sur les liens serveurs"});
  if (nicSpeed<25&&flows.includes("storage")) recs.push({type:"warning", text:"Trafic stockage detecte — 25 Gb recommande"});
  if (flows.includes("backup")&&!flows.includes("interco")) recs.push({type:"info", text:"Trafic backup detecte — envisager isolation reseau physique"});
  if (resilience!=="standard") recs.push({type:"ok", text:"Haute disponibilite assuree — redondance complete sur les liens"});
  if (oversubRatio<=1.5) recs.push({type:"ok", text:"Oversubscription optimale ("+oversubRatio+":1) — bande passante suffisante"});
  return {leafCount, spineCount, usedPorts, totalPortsAvail, uplinkSpeed, uplinkPerLeaf, oversubRatio, totalBw, score, level, recs, vlanCount:flows.length};
};

// ── SVG Topology ──────────────────────────────────────────────────────────────
const TopologyDiagram = ({servers, nicPerServer, nicSpeed, flows, resilience, design}) => {
  const W=1000, H=700;
  const {leafCount, spineCount} = design;
  const activeFlows = FLOWS.filter(f=>flows.includes(f.id));
  const displayServers = Math.min(servers, 6);
  const hasSpine = spineCount > 0;

  // Positions
  const spineY = 110;
  const leafY  = hasSpine ? 320 : 180;
  const srvY   = hasSpine ? 560 : 420;

  const spineX = (i) => W/2 - (spineCount-1)*100 + i*200;
  const leafX  = (i) => 80 + i*(W-160)/(Math.max(leafCount,2)-1||1);
  const srvX   = (i) => 80 + i*(W-160)/(Math.max(displayServers,2)-1||1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{position:"absolute",inset:0,width:"100%",height:"100%"}}>
      {/* Fond zones */}
      {hasSpine&&<rect x="20" y="40" width={W-40} height="70" rx="8" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1"/>}
      <rect x="20" y={leafY-30} width={W-40} height="70" rx="8" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1"/>
      <rect x="20" y={srvY-30} width={W-40} height="80" rx="8" fill="#fafafa" stroke="#e5e7eb" strokeWidth="1"/>

      {/* Labels zones */}
      {hasSpine&&<text x="30" y="58" fontSize="9" fill="#93c5fd" fontWeight="600">Core / Spine</text>}
      <text x="30" y={leafY-14} fontSize="9" fill="#6ee7b7" fontWeight="600">Access / Leaf (ToR)</text>
      <text x="30" y={srvY-14} fontSize="9" fill="#9ca3af" fontWeight="600">Serveurs</text>

      {/* Liens Spine-Leaf */}
      {hasSpine&&Array.from({length:spineCount},(_, si)=>
        Array.from({length:Math.min(leafCount,4)},(_,li)=>(
          <line key={`sl-${si}-${li}`}
            x1={spineX(si)} y1={spineY+20}
            x2={leafX(li)}  y2={leafY-20}
            stroke="#93c5fd" strokeWidth="2" strokeDasharray="4 2" opacity="0.7"/>
        ))
      )}
      {hasSpine&&Array.from({length:spineCount},(_, si)=>
        Array.from({length:Math.min(leafCount,4)},(_,li)=>(
          <text key={`sl-label-${si}-${li}`}
            x={(spineX(si)+leafX(li))/2+4}
            y={(spineY+20+leafY-20)/2}
            fontSize="7" fill="#60a5fa" textAnchor="middle">
            {design.uplinkSpeed} Gb
          </text>
        ))
      )}

      {/* Liens Leaf-Serveurs (colorés par flux) */}
      {Array.from({length:Math.min(leafCount,4)},(_,li)=>
        Array.from({length:displayServers},(_,si)=>{
          const flowColor = activeFlows[si%activeFlows.length]?.color||"#94a3b8";
          return (
            <line key={`ls-${li}-${si}`}
              x1={leafX(li)} y1={leafY+20}
              x2={srvX(si)}  y2={srvY-20}
              stroke={flowColor} strokeWidth="1.5" opacity="0.6"/>
          );
        })
      )}

      {/* MLAG entre leaves */}
      {leafCount>=2&&(
        <>
          <line x1={leafX(0)+22} y1={leafY} x2={leafX(Math.min(leafCount-1,3))-22} y2={leafY} stroke="#34d399" strokeWidth="2.5" strokeDasharray="none"/>
          <text x={(leafX(0)+leafX(Math.min(leafCount-1,3)))/2} y={leafY-6} fontSize="8" fill="#059669" textAnchor="middle" fontWeight="600">MLAG</text>
        </>
      )}

      {/* Spine switches */}
      {hasSpine&&Array.from({length:spineCount},(_,i)=>(
        <g key={`spine-${i}`}>
          <rect x={spineX(i)-38} y={spineY-20} width="76" height="40" rx="8" fill="#1d4ed8" stroke="#3b82f6" strokeWidth="2"/>
          <text x={spineX(i)} y={spineY-4} fontSize="10" fill="white" textAnchor="middle" fontWeight="700">SPINE-0{i+1}</text>
          <text x={spineX(i)} y={spineY+12} fontSize="8" fill="#93c5fd" textAnchor="middle">Core</text>
        </g>
      ))}

      {/* Leaf switches */}
      {Array.from({length:Math.min(leafCount,4)},(_,i)=>(
        <g key={`leaf-${i}`}>
          <rect x={leafX(i)-38} y={leafY-20} width="76" height="40" rx="8" fill="#059669" stroke="#34d399" strokeWidth="2"/>
          <text x={leafX(i)} y={leafY-4} fontSize="10" fill="white" textAnchor="middle" fontWeight="700">LEAF-0{i+1}</text>
          <text x={leafX(i)} y={leafY+12} fontSize="8" fill="#6ee7b7" textAnchor="middle">ToR</text>
        </g>
      ))}

      {/* Serveurs */}
      {Array.from({length:displayServers},(_,i)=>(
        <g key={`srv-${i}`}>
          <rect x={srvX(i)-24} y={srvY-18} width="48" height="30" rx="5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2"/>
          <rect x={srvX(i)-18} y={srvY-12} width="10" height="8" rx="1" fill="#94a3b8" opacity="0.5"/>
          <rect x={srvX(i)-5}  y={srvY-12} width="10" height="8" rx="1" fill="#94a3b8" opacity="0.5"/>
          <rect x={srvX(i)+8}  y={srvY-12} width="6" height="8" rx="1" fill="#10b981" opacity="0.7"/>
          <text x={srvX(i)} y={srvY+20} fontSize="8" fill="#64748b" textAnchor="middle">SRV-{String(i+1).padStart(2,"0")}</text>
        </g>
      ))}
      {servers>6&&(
        <text x={W-40} y={srvY+6} fontSize="9" fill="#94a3b8" textAnchor="middle">...</text>
      )}

      {/* Légende flux */}
      {activeFlows.slice(0,5).map((f,i)=>(
        <g key={f.id}>
          <rect x={20+i*110} y={H-22} width="8" height="8" rx="2" fill={f.color}/>
          <text x={32+i*110} y={H-15} fontSize="7" fill="#64748b">{f.label} (VLAN {f.vlan})</text>
        </g>
      ))}
    </svg>
  );
};

// ── Score Gauge ───────────────────────────────────────────────────────────────
const ScoreGauge = ({score, level}) => {
  const r=36, circ=2*Math.PI*r;
  const fill=score/100*circ;
  const color=score>=80?"#10b981":score>=60?"#f59e0b":"#ef4444";
  return (
    <div className="flex items-center gap-4">
      <div className="relative w-24 h-24 flex-shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10"/>
          <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{color}}>{score}</span>
          <span className="text-xs text-gray-400">/100</span>
        </div>
      </div>
      <div>
        <div className="text-sm font-bold" style={{color}}>Niveau</div>
        <div className="text-lg font-bold" style={{color}}>{level}</div>
        <div className="text-xs text-gray-400 mt-1">Architecture resiliante et evolutive.</div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function SwitchFabric({ th, isMobile=false }) {
  const [infraType,    setInfraType]    = useState("vmware");
  const [servers,      setServers]      = useState(24);
  const [nicPerServer, setNicPerServer] = useState(4);
  const [nicSpeed,     setNicSpeed]     = useState(25);
  const [flows,        setFlows]        = useState(["mgmt","prod","storage","backup"]);
  const [resilience,   setResilience]   = useState("ha");
  const [generated,    setGenerated]    = useState(true);

  const design = useMemo(()=>calcDesign(servers, nicPerServer, nicSpeed, flows, resilience),
    [servers, nicPerServer, nicSpeed, flows, resilience]);

  const toggleFlow = (id) => setFlows(f=>f.includes(id)?f.filter(x=>x!==id):[...f,id]);

  const s = {
    card:   {background:"#ffffff",border:"1px solid #e5e7eb",borderRadius:12,padding:16,marginBottom:12,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"},
    label:  {display:"block",fontSize:10,color:"#6b7280",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6},
    input:  {width:"100%",background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:6,padding:"7px 10px",color:"#111827",fontFamily:"monospace",fontSize:12,boxSizing:"border-box"},
    select: {width:"100%",background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:6,padding:"7px 10px",color:"#111827",fontFamily:"monospace",fontSize:12},
    secTitle:{fontSize:11,fontWeight:700,color:"#374151",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10,fontFamily:"monospace"},
  };

  return (
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"280px minmax(0,1fr) 300px",gap:16,alignItems:"start",width:"100%"}}>

      {/* ── LEFT PANEL ── */}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>

        {/* Type infra */}
        <div style={s.card}>
          <div style={s.secTitle}>Type d infrastructure</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {INFRA_TYPES.map(t=>(
              <button key={t.id} onClick={()=>setInfraType(t.id)}
                style={{padding:"10px 6px",border:"2px solid "+(infraType===t.id?"#3b82f6":"#e5e7eb"),borderRadius:8,background:infraType===t.id?"#eff6ff":"#fafafa",cursor:"pointer",textAlign:"center"}}>
                <div style={{fontSize:9,fontWeight:700,color:infraType===t.id?"#1d4ed8":"#6b7280",fontFamily:"monospace"}}>{t.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Capacité */}
        <div style={s.card}>
          <div style={s.secTitle}>Capacite</div>
          <div style={{marginBottom:10}}>
            <label style={s.label}>Nombre de serveurs</label>
            <input type="number" min={1} max={512} value={servers}
              onChange={e=>setServers(Number(e.target.value))} style={s.input}/>
          </div>
          <div style={{marginBottom:10}}>
            <label style={s.label}>NIC par serveur</label>
            <div style={{display:"flex",gap:6}}>
              {[2,4,6].map(n=>(
                <button key={n} onClick={()=>setNicPerServer(n)}
                  style={{flex:1,padding:"6px",border:"2px solid "+(nicPerServer===n?"#3b82f6":"#e5e7eb"),borderRadius:6,background:nicPerServer===n?"#eff6ff":"#fafafa",fontSize:12,fontWeight:600,color:nicPerServer===n?"#1d4ed8":"#6b7280",cursor:"pointer"}}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={s.label}>Debit par NIC</label>
            <div style={{display:"flex",gap:4}}>
              {NIC_SPEEDS.map(n=>(
                <button key={n} onClick={()=>setNicSpeed(n)}
                  style={{flex:1,padding:"5px 2px",border:"2px solid "+(nicSpeed===n?"#3b82f6":"#e5e7eb"),borderRadius:6,background:nicSpeed===n?"#eff6ff":"#fafafa",fontSize:10,fontWeight:600,color:nicSpeed===n?"#1d4ed8":"#6b7280",cursor:"pointer"}}>
                  {n}G
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Flux réseau */}
        <div style={s.card}>
          <div style={s.secTitle}>Flux reseau</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {FLOWS.map(f=>(
              <label key={f.id} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"6px 8px",borderRadius:6,background:flows.includes(f.id)?"#f9fafb":"transparent",border:"1px solid "+(flows.includes(f.id)?"#e5e7eb":"transparent")}}>
                <input type="checkbox" checked={flows.includes(f.id)} onChange={()=>toggleFlow(f.id)} style={{display:"none"}}/>
                <div style={{width:12,height:12,borderRadius:3,background:flows.includes(f.id)?f.color:"#e5e7eb",flexShrink:0}}/>
                <span style={{fontSize:11,fontWeight:500,color:"#374151",flex:1}}>{f.label}</span>
                <span style={{fontSize:9,color:"#9ca3af",fontFamily:"monospace"}}>VLAN {f.vlan}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Résilience */}
        <div style={s.card}>
          <div style={s.secTitle}>Niveau de resilience</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {RESILIENCE.map(r=>(
              <button key={r.id} onClick={()=>setResilience(r.id)}
                style={{padding:"10px 12px",border:"2px solid "+(resilience===r.id?"#3b82f6":"#e5e7eb"),borderRadius:8,background:resilience===r.id?"#eff6ff":"#fafafa",cursor:"pointer",textAlign:"left"}}>
                <div style={{fontSize:11,fontWeight:700,color:resilience===r.id?"#1d4ed8":"#374151"}}>{r.label}</div>
                <div style={{fontSize:9,color:"#9ca3af",marginTop:2}}>{r.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <button onClick={()=>setGenerated(true)}
          style={{padding:"12px",background:"#2563eb",border:"none",borderRadius:8,color:"white",fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          ⚡ Generer la topologie
        </button>
      </div>

      {/* ── CENTER PANEL ── */}
      <div style={{display:"flex",flexDirection:"column",gap:16,minWidth:0,width:"100%"}}>
        <div style={{...s.card,padding:"20px 20px 16px",display:"flex",flexDirection:"column",height:"calc(70vh - 60px)",minHeight:580}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <div>
              <div style={{fontSize:16,fontWeight:700,color:"#111827"}}>Topologie proposee</div>
              <div style={{fontSize:11,color:"#6b7280",marginTop:2}}>Architecture : {resilience==="standard"?"Flat L2":"Leaf/Spine"}</div>
            </div>
            <div style={{display:"flex",gap:6}}>
              <div style={{padding:"4px 10px",background:"#eff6ff",borderRadius:20,fontSize:10,fontWeight:600,color:"#1d4ed8"}}>Vue logique</div>
            </div>
          </div>
          <div style={{position:"relative",width:"100%",flex:1}}>
            <TopologyDiagram servers={servers} nicPerServer={nicPerServer} nicSpeed={nicSpeed}
              flows={flows} resilience={resilience} design={design}/>
          </div>
        </div>

        {/* Détail flux - en dehors de la topology card */}
        <div style={{...s.card,marginTop:0}}>
          <div style={s.secTitle}>Detail des besoins par flux</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
            {FLOWS.filter(f=>flows.includes(f.id)).map(f=>{
              const portsForFlow = Math.round(servers*nicPerServer/flows.length);
              return (
                <div key={f.id} style={{padding:"10px 12px",borderRadius:8,border:"1px solid "+f.color+"33",background:f.color+"0d"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                    <div style={{width:8,height:8,borderRadius:2,background:f.color,flexShrink:0}}/>
                    <span style={{fontSize:10,fontWeight:700,color:"#374151"}}>{f.label}</span>
                  </div>
                  <div style={{fontSize:13,fontWeight:700,color:"#111827"}}>{portsForFlow} ports</div>
                  <div style={{fontSize:9,color:"#9ca3af",marginTop:2}}>Utilise : {portsForFlow} ({Math.round(portsForFlow/design.totalPortsAvail*100)}%)</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{display:"flex",flexDirection:"column",gap:12,position:"sticky",top:16}}>

        {/* Résumé design */}
        <div style={s.card}>
          <div style={s.secTitle}>Resume du design</div>
          {[
            {label:"Switches ToR (Leaf)",      val:design.leafCount},
            {label:"Switches Core (Spine)",     val:design.spineCount||"—"},
            {label:"Ports serveurs utilises",   val:design.usedPorts+" / "+design.totalPortsAvail+" ("+Math.round(design.usedPorts/design.totalPortsAvail*100)+"%)"},
            {label:"Uplinks ToR ↔ Spine",       val:design.spineCount?"4 x "+design.uplinkSpeed+" Gb":"N/A"},
            {label:"Oversubscription ratio",    val:design.oversubRatio+":1",  color:design.oversubRatio<=2?"#10b981":"#f59e0b"},
            {label:"VLAN utilises",             val:design.vlanCount},
            {label:"Debit total agrege",        val:(design.totalBw/1000).toFixed(1)+" Tbps"},
          ].map(r=>(
            <div key={r.label} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #f3f4f6"}}>
              <span style={{fontSize:11,color:"#6b7280"}}>{r.label}</span>
              <span style={{fontSize:11,fontWeight:700,fontFamily:"monospace",color:r.color||"#111827"}}>{r.val}</span>
            </div>
          ))}
        </div>

        {/* Score maturité */}
        <div style={s.card}>
          <div style={s.secTitle}>Score de maturite reseau</div>
          <ScoreGauge score={design.score} level={design.level}/>
        </div>

        {/* Recommandations */}
        <div style={s.card}>
          <div style={s.secTitle}>Recommandations</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {design.recs.map((r,i)=>(
              <div key={i} style={{display:"flex",gap:8,padding:"8px 10px",borderRadius:6,
                background:r.type==="ok"?"#f0fdf4":r.type==="warning"?"#fffbeb":"#eff6ff",
                border:"1px solid "+(r.type==="ok"?"#bbf7d0":r.type==="warning"?"#fde68a":"#bfdbfe")}}>
                <span style={{fontSize:13,flexShrink:0}}>{r.type==="ok"?"✅":r.type==="warning"?"⚠️":"ℹ️"}</span>
                <span style={{fontSize:11,color:"#374151"}}>{r.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
