import { useMemo, useState } from "react";
import {
  Server, Network, Shield, Layers, CheckCircle, AlertTriangle,
  Info, Download, Upload, GitBranch, Boxes, HardDrive, Lock, Scale,
  Flame, Share2, Settings
} from "lucide-react";

const fmt = (n, dec=0) =>
  Number.isFinite(n) ? n.toLocaleString("fr-FR", { maximumFractionDigits: dec }) : "—";

const FLOW_COLORS = {
  mgmt: "#f6b73c",
  prod: "#9b5cf6",
  storage: "#72c240",
  backup: "#2f8ef7",
  interco: "#ff8a2a",
};

export default function SwitchFabric({ th, isMobile=false }) {
  const [step, setStep] = useState("topology");
  const [infra, setInfra] = useState("vmware");
  const [servers, setServers] = useState(24);
  const [nics, setNics] = useState(4);
  const [nicSpeed, setNicSpeed] = useState(25);
  const [leafCount] = useState(2);
  const [spineCount] = useState(2);
  const [uplinkQty] = useState(4);
  const [uplinkSpeed] = useState(100);
  const [resilience, setResilience] = useState("ha");
  const [flows, setFlows] = useState({
    mgmt: true,
    prod: true,
    storage: true,
    backup: true,
    interco: false,
  });

  const ui = {
    page: "#eef2f7",
    card: "#ffffff",
    panel: "#f8fafc",
    border: "#d9e2ee",
    border2: "#bfdbfe",
    title: "#0f172a",
    text: "#334155",
    muted: "#64748b",
    blue: "#2563eb",
    blue2: "#1d4ed8",
    green: "#10a37f",
    green2: "#059669",
    orange: "#f97316",
    purple: "#7c3aed",
    danger: "#dc2626",
  };

  const r = useMemo(() => {
    const usedServerPorts = servers * nics;
    const leafPortsCapacity = leafCount * 64;
    const portUsage = leafPortsCapacity > 0 ? Math.round((usedServerPorts / leafPortsCapacity) * 100) : 0;

    const downlinkBw = servers * nics * nicSpeed;
    const uplinkBw = leafCount * uplinkQty * uplinkSpeed;
    const oversub = uplinkBw > 0 ? downlinkBw / uplinkBw : 0;

    const vlanCount = Object.values(flows).filter(Boolean).length;
    const resilient = leafCount >= 2 && spineCount >= 2 && resilience !== "standard";

    let score = 100;
    if (portUsage > 80) score -= 18;
    if (portUsage > 95) score -= 15;
    if (oversub > 3) score -= 22;
    else if (oversub > 2) score -= 10;
    if (!resilient) score -= 25;
    if (!flows.backup) score -= 8;
    if (!flows.storage) score -= 6;
    score = Math.max(0, Math.min(100, score));

    return {
      usedServerPorts,
      leafPortsCapacity,
      portUsage,
      downlinkBw,
      uplinkBw,
      oversub,
      vlanCount,
      resilient,
      score,
      level: score >= 80 ? "Enterprise" : score >= 60 ? "Standard +" : "À renforcer",
      ok: score >= 75,
    };
  }, [servers, nics, nicSpeed, leafCount, spineCount, uplinkQty, uplinkSpeed, resilience, flows]);

  const displayedServers = Math.min(servers, 12);
  const serverPositions = Array.from({ length: displayedServers }).map((_, i) => {
    const spacing = 590 / (displayedServers + 1);
    return 145 + spacing * (i + 1);
  });

  const flowList = [
    ["mgmt", "Management", "VLAN 10", Lock],
    ["prod", "Production", "VLAN 20", Network],
    ["storage", "Stockage", "VLAN 30", HardDrive],
    ["backup", "Backup", "VLAN 40", Shield],
    ["interco", "Interconnexion DC", "VLAN 50", Share2],
  ];

  const infraIcon = {
    vmware: <Server size={18}/>,
    proxmox: <Boxes size={18}/>,
    nutanix: <Layers size={18}/>,
    other: <Network size={18}/>,
  };

  const card = {
    background: ui.card,
    border: `1px solid ${ui.border}`,
    borderRadius: 14,
    boxShadow: "0 14px 34px rgba(15,23,42,0.08)",
  };

  const input = {
    width: "100%",
    background: "#ffffff",
    border: `1px solid ${ui.border}`,
    borderRadius: 9,
    padding: "9px 10px",
    color: ui.title,
    fontSize: 13,
    boxSizing: "border-box",
  };

  const label = {
    fontSize: 10,
    fontWeight: 900,
    color: ui.muted,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 6,
  };

  const recos = [
    r.resilient
      ? { type:"ok", title:"Haute disponibilité assurée", body:"Redondance complète sur les liens et équipements critiques." }
      : { type:"warn", title:"Résilience insuffisante", body:"Prévoir 2 Leaf, 2 Spine et un mécanisme MLAG/ECMP." },
    r.oversub > 3
      ? { type:"warn", title:"Oversubscription élevée", body:"Augmenter les uplinks ToR → Spine ou réduire la densité serveur par Leaf." }
      : { type:"ok", title:"Oversubscription maîtrisée", body:`Ratio ${r.oversub.toFixed(1)}:1 cohérent pour un design datacenter.` },
    flows.backup
      ? { type:"warn", title:"Isolation du trafic backup", body:"Prévoir un réseau dédié ou une QoS stricte pour les fenêtres de sauvegarde." }
      : { type:"warn", title:"Flux backup non déclaré", body:"Ajouter un VLAN Backup pour éviter un mélange avec la production." },
    { type:"info", title:"Surveillance réseau", body:"Prévoir SNMP, NetFlow/sFlow ou télémétrie pour valider les hypothèses." },
  ];

  const Badge = ({ children, color=ui.blue }) => (
    <span style={{
      display:"inline-flex",
      alignItems:"center",
      gap:6,
      padding:"6px 10px",
      borderRadius:999,
      background:`${color}10`,
      border:`1px solid ${color}25`,
      color,
      fontSize:12,
      fontWeight:900
    }}>
      {children}
    </span>
  );

  const RecoCard = ({ rec }) => {
    const color = rec.type === "ok" ? ui.green : rec.type === "warn" ? ui.orange : ui.blue;
    const Icon = rec.type === "ok" ? CheckCircle : rec.type === "warn" ? AlertTriangle : Info;
    return (
      <div style={{
        display:"flex",
        gap:12,
        padding:"13px 14px",
        borderRadius:13,
        background:`${color}08`,
        border:`1px solid ${color}22`
      }}>
        <div style={{
          width:32,
          height:32,
          borderRadius:999,
          background:`${color}12`,
          color,
          display:"flex",
          alignItems:"center",
          justifyContent:"center",
          flexShrink:0
        }}>
          <Icon size={17}/>
        </div>
        <div>
          <div style={{fontSize:13,fontWeight:950,color:ui.title}}>{rec.title}</div>
          <div style={{fontSize:12,color:ui.text,lineHeight:1.45,marginTop:4}}>{rec.body}</div>
        </div>
      </div>
    );
  };

  const SummaryRow = ({ k, v, status }) => (
    <div style={{
      display:"flex",
      justifyContent:"space-between",
      gap:12,
      padding:"10px 0",
      borderBottom:`1px solid ${ui.border}`
    }}>
      <span style={{fontSize:12,color:ui.text}}>{k}</span>
      <strong style={{
        fontSize:12,
        color:status ? ui.green : ui.title,
        textAlign:"right",
        whiteSpace:"nowrap"
      }}>
        {v}
      </strong>
    </div>
  );

  const shouldShowLeft = step === "needs" || step === "topology";
  const shouldShowCenter = step === "topology" || step === "results";
  const shouldShowRight = step === "topology" || step === "results" || step === "reco";

  return (
    <div style={{
      background: ui.page,
      borderRadius: 18,
      padding: isMobile ? 12 : 20,
      marginTop: -6
    }}>
      {/* Header workflow */}
      <div style={{
        display:"flex",
        justifyContent:"space-between",
        alignItems:"center",
        gap:12,
        marginBottom:16
      }}>
        <div>
          <div style={{fontSize:24,fontWeight:950,color:ui.title}}>Switch Fabric</div>
          <div style={{fontSize:13,color:ui.muted,marginTop:4}}>Datacenter fabric · Leaf / Spine · VLAN · QoS</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button style={{
            ...input,
            width:"auto",
            cursor:"pointer",
            display:"inline-flex",
            alignItems:"center",
            gap:8,
            fontWeight:850
          }}>
            <Upload size={14}/> Importer existant
          </button>
          <button style={{
            cursor:"pointer",
            border:"none",
            borderRadius:10,
            padding:"10px 14px",
            background:ui.blue,
            color:"#fff",
            display:"inline-flex",
            alignItems:"center",
            gap:8,
            fontWeight:950
          }}>
            <Download size={14}/> Exporter le design
          </button>
        </div>
      </div>

      <div style={{
        display:"grid",
        gridTemplateColumns:isMobile?"1fr":"repeat(4,1fr)",
        gap:8,
        marginBottom:16
      }}>
        {[
          ["needs","1. Besoins",Server],
          ["topology","2. Topologie",GitBranch],
          ["results","3. Résultats",Scale],
          ["reco","4. Recommandations",Info],
        ].map(([id,name,Icon])=>(
          <button key={id} onClick={()=>setStep(id)} style={{
            cursor:"pointer",
            border:`1px solid ${step===id?ui.blue:ui.border}`,
            background:step===id?ui.blue:ui.card,
            color:step===id?"#fff":ui.text,
            borderRadius:11,
            padding:"12px 14px",
            fontSize:14,
            fontWeight:900,
            display:"flex",
            alignItems:"center",
            justifyContent:"center",
            gap:10,
            boxShadow:step===id?"0 10px 24px rgba(37,99,235,0.22)":"none"
          }}>
            <Icon size={16}/> {name}
          </button>
        ))}
      </div>

      {/* Decision hero */}
      <div style={{
        ...card,
        padding:"18px 22px",
        marginBottom:16,
        background:r.ok ? "linear-gradient(135deg,#ecfdf5,#ffffff)" : "linear-gradient(135deg,#fff7ed,#ffffff)",
        border:`1px solid ${r.ok ? "#a7f3d0" : "#fed7aa"}`
      }}>
        <div style={{display:"flex",alignItems:"center",gap:18}}>
          <div style={{
            width:58,
            height:58,
            borderRadius:999,
            background:r.ok?ui.green:ui.orange,
            color:"#fff",
            display:"flex",
            alignItems:"center",
            justifyContent:"center",
            fontSize:30,
            fontWeight:950
          }}>
            {r.ok?"✓":"!"}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:22,fontWeight:950,color:r.ok?ui.green:ui.orange}}>
              {r.ok ? "Design réseau cohérent" : "Design réseau à renforcer"}
            </div>
            <div style={{fontSize:13,color:ui.text,marginTop:5}}>
              Score {r.score}/100 · Niveau {r.level} · Oversubscription {r.oversub.toFixed(1)}:1
            </div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}>
            <Badge color={r.portUsage>80?ui.orange:ui.green}>Ports {r.portUsage}%</Badge>
            <Badge color={r.oversub>3?ui.orange:ui.green}>Oversub {r.oversub.toFixed(1)}:1</Badge>
            <Badge color={r.resilient?ui.green:ui.danger}>Résilience {r.resilient?"OK":"NOK"}</Badge>
          </div>
        </div>
      </div>

      <div style={{
        display:"grid",
        gridTemplateColumns:
          isMobile ? "1fr" :
          step === "needs" ? "360px 1fr" :
          step === "reco" ? "1fr 360px" :
          "320px 1fr 300px",
        gap:16,
        alignItems:"start"
      }}>
        {/* LEFT */}
        {shouldShowLeft && (
          <div style={{display:"grid",gap:14}}>
            <div style={{...card,padding:16}}>
              <div style={{fontSize:16,fontWeight:950,color:ui.title,marginBottom:14}}>Configuration des besoins</div>

              <div style={{marginBottom:14}}>
                <div style={label}>Type d’infrastructure</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
                  {[
                    ["vmware","VMware"],
                    ["proxmox","Proxmox"],
                    ["nutanix","Nutanix"],
                    ["other","Autre"],
                  ].map(([id,name])=>(
                    <button key={id} onClick={()=>setInfra(id)} style={{
                      cursor:"pointer",
                      border:`1px solid ${infra===id?ui.blue:ui.border}`,
                      background:infra===id?"#eff6ff":"#f8fafc",
                      color:infra===id?ui.blue:ui.text,
                      borderRadius:11,
                      padding:"12px 8px",
                      fontWeight:900,
                      display:"flex",
                      alignItems:"center",
                      justifyContent:"center",
                      gap:8
                    }}>
                      {infraIcon[id]} {name}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{paddingTop:10,borderTop:`1px solid ${ui.border}`,display:"grid",gap:10}}>
                <div style={label}>Capacité</div>

                <div>
                  <div style={{fontSize:12,color:ui.text,marginBottom:5}}>Nombre de serveurs</div>
                  <input type="number" min={1} value={servers} onChange={e=>setServers(Number(e.target.value))} style={input}/>
                </div>

                <div>
                  <div style={{fontSize:12,color:ui.text,marginBottom:5}}>NIC par serveur</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                    {[2,4,6].map(v=>(
                      <button key={v} onClick={()=>setNics(v)} style={{
                        ...input,
                        cursor:"pointer",
                        border:`1px solid ${nics===v?ui.blue:ui.border}`,
                        background:nics===v?"#eff6ff":"#fff",
                        color:nics===v?ui.blue:ui.title,
                        fontWeight:950
                      }}>{v}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{fontSize:12,color:ui.text,marginBottom:5}}>Débit par port NIC</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                    {[1,10,25,100].map(v=>(
                      <button key={v} onClick={()=>setNicSpeed(v)} style={{
                        ...input,
                        cursor:"pointer",
                        border:`1px solid ${nicSpeed===v?ui.blue:ui.border}`,
                        background:nicSpeed===v?"#eff6ff":"#fff",
                        color:nicSpeed===v?ui.blue:ui.title,
                        fontWeight:950
                      }}>{v}G</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={{...card,padding:16}}>
              <div style={label}>Flux réseau à prendre en compte</div>
              <div style={{display:"grid",gap:8}}>
                {flowList.map(([id,name,vlan,Icon])=>(
                  <label key={id} style={{
                    cursor:"pointer",
                    display:"flex",
                    alignItems:"center",
                    justifyContent:"space-between",
                    gap:10,
                    padding:"10px 11px",
                    borderRadius:11,
                    background:flows[id]?`${FLOW_COLORS[id]}09`:"#f8fafc",
                    border:`1px solid ${flows[id]?`${FLOW_COLORS[id]}35`:ui.border}`
                  }}>
                    <span style={{display:"flex",alignItems:"center",gap:9}}>
                      <input type="checkbox" checked={flows[id]} onChange={e=>setFlows({...flows,[id]:e.target.checked})}/>
                      <span style={{
                        width:22,
                        height:22,
                        borderRadius:7,
                        background:`${FLOW_COLORS[id]}16`,
                        color:FLOW_COLORS[id],
                        display:"flex",
                        alignItems:"center",
                        justifyContent:"center"
                      }}>
                        <Icon size={13}/>
                      </span>
                      <span style={{fontSize:12,fontWeight:900,color:ui.title}}>{name}</span>
                    </span>
                    <span style={{fontSize:11,color:ui.muted}}>{vlan}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{...card,padding:16}}>
              <div style={label}>Niveau de résilience</div>
              {[
                ["standard","Standard","Infrastructure de base"],
                ["ha","Haute disponibilité","Redondance composants"],
                ["enterprise","Enterprise","Tolérance de panne avancée"],
              ].map(([id,title,sub])=>(
                <button key={id} onClick={()=>setResilience(id)} style={{
                  width:"100%",
                  textAlign:"left",
                  cursor:"pointer",
                  border:`1px solid ${resilience===id?ui.blue:ui.border}`,
                  background:resilience===id?"#eff6ff":"#f8fafc",
                  color:ui.title,
                  borderRadius:11,
                  padding:"11px 12px",
                  marginBottom:8
                }}>
                  <div style={{fontSize:12,fontWeight:950}}>{title}</div>
                  <div style={{fontSize:11,color:ui.muted,marginTop:2}}>{sub}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CENTER */}
        {shouldShowCenter && (
          <div>
            <div style={{...card,padding:16,marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div>
                  <div style={{fontSize:17,fontWeight:950,color:ui.title}}>Topologie proposée</div>
                  <div style={{fontSize:12,color:ui.muted}}>Architecture : Leaf / Spine · {servers} serveur(s)</div>
                </div>
                <Badge color={ui.blue}><GitBranch size={14}/> Vue logique</Badge>
              </div>

              <svg viewBox="0 0 980 590" width="100%" style={{
                borderRadius:14,
                background:"#f8fbff",
                border:`1px solid ${ui.border}`
              }}>
                <defs>
                  <pattern id="grid" width="22" height="22" patternUnits="userSpaceOnUse">
                    <path d="M 22 0 L 0 0 0 22" fill="none" stroke="#dbeafe" strokeWidth="0.7" opacity="0.55"/>
                  </pattern>
                  <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#0f172a" floodOpacity="0.18"/>
                  </filter>
                </defs>

                <rect width="980" height="590" fill="url(#grid)"/>

                <rect x="180" y="45" width="600" height="105" rx="18" fill="#eff6ff" stroke="#93c5fd" strokeWidth="1.5"/>
                <text x="205" y="85" fill={ui.blue} fontSize="18" fontWeight="950">Core / Spine</text>

                <rect x="230" y="245" width="520" height="105" rx="18" fill="#ecfdf5" stroke="#86efac" strokeWidth="1.5"/>
                <text x="250" y="285" fill={ui.green} fontSize="18" fontWeight="950">Access / Leaf (ToR)</text>

                <rect x="180" y="415" width="600" height="110" rx="18" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.4"/>
                <text x="205" y="455" fill={ui.text} fontSize="18" fontWeight="950">Serveurs</text>

                <rect x="800" y="292" width="145" height="110" rx="14" fill="#faf5ff" stroke="#d8b4fe" strokeWidth="1.4"/>
                <text x="820" y="320" fill={ui.purple} fontSize="15" fontWeight="950">Services réseau</text>
                <g transform="translate(822 340)">
                  <Flame size={18} color={ui.purple}/>
                  <text x="28" y="15" fill={ui.text} fontSize="13" fontWeight="800">Firewall</text>
                </g>
                <g transform="translate(822 370)">
                  <Share2 size={18} color={ui.purple}/>
                  <text x="28" y="15" fill={ui.text} fontSize="13" fontWeight="800">Load Balancer</text>
                </g>
                <g transform="translate(822 400)">
                  <Settings size={18} color={ui.purple}/>
                  <text x="28" y="15" fill={ui.text} fontSize="13" fontWeight="800">Services divers</text>
                </g>

                {[[390,105,"SPINE-01"],[610,105,"SPINE-02"],[350,300,"LEAF-01"],[630,300,"LEAF-02"]].map(([x,y,t])=>(
                  <g key={t} filter="url(#softShadow)">
                    <rect x={x-58} y={y-28} width="116" height="56" rx="12" fill={t.includes("SPINE")?ui.blue:ui.green}/>
                    <text x={x} y={y+5} textAnchor="middle" fill="#fff" fontSize="16" fontWeight="950">{t}</text>
                  </g>
                ))}

                {[[390,105,350,300],[390,105,630,300],[610,105,350,300],[610,105,630,300]].map((p,i)=>(
                  <line key={i} x1={p[0]} y1={p[1]+28} x2={p[2]} y2={p[3]-28} stroke={ui.blue} strokeWidth="3.2" opacity="0.74"/>
                ))}

                <line x1="408" y1="300" x2="572" y2="300" stroke={ui.green} strokeWidth="6"/>
                <text x="490" y="287" textAnchor="middle" fill={ui.green} fontSize="14" fontWeight="950">MLAG</text>

                <line x1="750" y1="317" x2="800" y2="317" stroke={ui.purple} strokeWidth="3" strokeDasharray="6 5"/>
                <line x1="750" y1="350" x2="800" y2="350" stroke={ui.purple} strokeWidth="3" strokeDasharray="6 5"/>

                {serverPositions.map((x,i)=>(
                  <g key={i}>
                    <rect x={x-25} y="462" width="50" height="42" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.4"/>
                    <rect x={x-17} y="470" width="34" height="6" rx="2" fill="#94a3b8"/>
                    <rect x={x-17} y="481" width="34" height="6" rx="2" fill="#cbd5e1"/>
                    <rect x={x-17} y="492" width="34" height="6" rx="2" fill="#cbd5e1"/>
                    <text x={x} y="532" textAnchor="middle" fill={ui.text} fontSize="11" fontWeight="750">
                      SRV-{String(i+1).padStart(2,"0")}
                    </text>

                    {flows.mgmt && <line x1="350" y1="328" x2={x} y2="462" stroke={FLOW_COLORS.mgmt} strokeWidth="2.2" opacity=".55"/>}
                    {flows.prod && <line x1="350" y1="328" x2={x} y2="462" stroke={FLOW_COLORS.prod} strokeWidth="2.2" opacity=".55"/>}
                    {flows.storage && <line x1="630" y1="328" x2={x} y2="462" stroke={FLOW_COLORS.storage} strokeWidth="2.2" opacity=".55"/>}
                    {flows.backup && <line x1="630" y1="328" x2={x} y2="462" stroke={FLOW_COLORS.backup} strokeWidth="2.2" opacity=".45"/>}
                    {flows.interco && <line x1="630" y1="328" x2={x} y2="462" stroke={FLOW_COLORS.interco} strokeWidth="2.2" opacity=".45"/>}
                  </g>
                ))}

                {servers > displayedServers && (
                  <text x="748" y="485" fill={ui.text} fontSize="14" fontWeight="950">+{servers-displayedServers}</text>
                )}

                <text x="500" y="205" textAnchor="middle" fill={ui.blue} fontSize="15" fontWeight="950">{uplinkQty} × {uplinkSpeed} Gb</text>
                <text x="500" y="392" textAnchor="middle" fill={ui.green} fontSize="15" fontWeight="950">{nicSpeed} Gb server links</text>
              </svg>

              <div style={{
                display:"flex",
                gap:16,
                justifyContent:"center",
                flexWrap:"wrap",
                marginTop:12,
                padding:"9px 12px",
                border:`1px solid ${ui.border}`,
                borderRadius:12,
                background:"#ffffff"
              }}>
                {flowList.filter(([id])=>flows[id]).map(([id,name,vlan])=>(
                  <span key={id} style={{display:"flex",alignItems:"center",gap:7,fontSize:11,color:ui.text,fontWeight:750}}>
                    <span style={{width:20,height:4,borderRadius:999,background:FLOW_COLORS[id]}}/>
                    {name} ({vlan})
                  </span>
                ))}
              </div>
            </div>

            <div style={{...card,padding:16}}>
              <div style={{fontSize:14,fontWeight:950,color:ui.title,marginBottom:12}}>Détail des besoins par flux</div>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(4,1fr)",gap:10}}>
                {flowList.filter(([id])=>flows[id]).slice(0,4).map(([id,name,vlan])=>(
                  <div key={id} style={{
                    border:`1px solid ${FLOW_COLORS[id]}30`,
                    background:`${FLOW_COLORS[id]}08`,
                    borderRadius:13,
                    padding:"13px 14px"
                  }}>
                    <div style={{fontSize:12,fontWeight:950,color:FLOW_COLORS[id]}}>{name}</div>
                    <div style={{fontSize:20,fontWeight:950,color:ui.title,marginTop:6}}>{servers} ports</div>
                    <div style={{fontSize:11,color:ui.muted}}>Utilisé : {Math.round(servers/r.leafPortsCapacity*100)}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RIGHT */}
        {shouldShowRight && (
          <div style={{display:"grid",gap:14}}>
            <div style={{...card,padding:16}}>
              <div style={{fontSize:16,fontWeight:950,color:ui.title,marginBottom:12}}>Résumé du design</div>
              <SummaryRow k="Switches ToR (Leaf)" v={leafCount}/>
              <SummaryRow k="Switches Core (Spine)" v={spineCount}/>
              <SummaryRow k="Ports serveurs utilisés" v={`${r.usedServerPorts} / ${r.leafPortsCapacity} (${r.portUsage}%)`}/>
              <SummaryRow k="Uplinks ToR → Spine" v={`${uplinkQty} × ${uplinkSpeed} Gb`}/>
              <SummaryRow k="Oversubscription ratio" v={`${r.oversub.toFixed(1)}:1`} status={r.oversub<=3}/>
              <SummaryRow k="VLAN utilisés" v={r.vlanCount}/>
              <SummaryRow k="Débit total agrégé" v={`${(r.downlinkBw/1000).toFixed(1)} Tbps`}/>
            </div>

            <div style={{...card,padding:16}}>
              <div style={{fontSize:16,fontWeight:950,color:ui.title,marginBottom:12}}>Score de maturité réseau</div>
              <div style={{display:"flex",alignItems:"center",gap:16}}>
                <div style={{
                  width:84,
                  height:84,
                  borderRadius:999,
                  border:`9px solid ${r.score>=80?ui.green:r.score>=60?ui.orange:ui.danger}`,
                  background:"#ffffff",
                  display:"flex",
                  alignItems:"center",
                  justifyContent:"center",
                  flexDirection:"column",
                  color:ui.title,
                  fontWeight:950
                }}>
                  <span style={{fontSize:23}}>{r.score}</span>
                  <span style={{fontSize:10}}>/100</span>
                </div>
                <div>
                  <div style={{fontSize:12,color:ui.muted}}>Niveau</div>
                  <div style={{fontSize:21,fontWeight:950,color:r.score>=80?ui.green:r.score>=60?ui.orange:ui.danger}}>{r.level}</div>
                  <div style={{fontSize:12,color:ui.text,lineHeight:1.45}}>Architecture résiliente et évolutive.</div>
                </div>
              </div>
            </div>

            <div style={{...card,padding:16}}>
              <div style={{fontSize:16,fontWeight:950,color:ui.title,marginBottom:12}}>Recommandations</div>
              <div style={{display:"grid",gap:10}}>
                {recos.slice(0,3).map((rec,i)=><RecoCard key={i} rec={rec}/>)}
              </div>
              <button style={{
                marginTop:12,
                width:"100%",
                cursor:"pointer",
                border:`1px solid ${ui.border2}`,
                background:"#eff6ff",
                color:ui.blue,
                borderRadius:11,
                padding:"10px 12px",
                fontWeight:950
              }}>
                Voir toutes les recommandations →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
