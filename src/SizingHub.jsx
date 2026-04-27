import { useState, useMemo, useRef, useEffect } from "react";
import AuditCalc from "./AuditCalc.jsx";
import SwitchFabric from "./SwitchFabric.jsx";
import ComputeCalc from "./ComputeCalc.jsx";
import PreSalesAssistant from "./PreSalesAssistant.jsx";
import {
  Server, HardDrive, Cloud, Cpu, Database, Network, FileSearch,
  BarChart2, Shield, CheckCircle, AlertTriangle,
  Info, Sun, Moon, Menu, X
} from "lucide-react";

function useIsMobile() {
  const [w, setW] = useState(window.innerWidth);

  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  return w < 768;
}
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";

// ─── Theme ────────────────────────────────────────────────────────────────────
const DARK = {
  bg0:"#0a0b0d", bg1:"#111318", bg2:"#181b22", sidebarBg:"#1B2B4B", sidebarBorder:"rgba(255,255,255,0.08)",
  t1:"#e8eaf0", t2:"#8b90a0", t3:"#4a5068",
  border:"rgba(255,255,255,0.07)", border2:"rgba(59,126,246,0.2)",
  accent:"#3B7EF6", accent2:"#6366f1", accent3:"#ff6b35",
  warn:"#ffb347", danger:"#ff5555",
  cardBg:"#111318", inputBg:"#181b22",
  infoBoxBg:"rgba(99,102,241,0.08)", infoBoxBorder:"rgba(99,102,241,0.2)", infoBoxColor:"#7ab8ff",
  okBoxBg:"rgba(59,126,246,0.07)", okBoxBorder:"rgba(59,126,246,0.2)", okBoxColor:"#3B7EF6",
  alertBoxBg:"rgba(255,107,53,0.08)", alertBoxBorder:"rgba(255,107,53,0.25)", alertBoxColor:"#ffb347",
  tooltipBg:"#181b22",
};
const LIGHT = {
  bg0:"#F4F6FA", bg1:"#ffffff", bg2:"#f8f9fc", sidebarBg:"#1B2B4B", sidebarBorder:"rgba(255,255,255,0.08)",
  t1:"#111318", t2:"#5a6072", t3:"#9aa0b0",
  border:"rgba(0,0,0,0.08)", border2:"rgba(37,99,235,0.3)",
  accent:"#2563EB", accent2:"#6366f1", accent3:"#e05a20",
  warn:"#d97706", danger:"#dc2626",
  cardBg:"#ffffff", inputBg:"#f4f5f7",
  infoBoxBg:"rgba(99,102,241,0.07)", infoBoxBorder:"rgba(99,102,241,0.2)", infoBoxColor:"#6366f1",
  okBoxBg:"rgba(37,99,235,0.07)", okBoxBorder:"rgba(37,99,235,0.2)", okBoxColor:"#2563EB",
  alertBoxBg:"rgba(217,119,6,0.08)", alertBoxBorder:"rgba(217,119,6,0.25)", alertBoxColor:"#d97706",
  tooltipBg:"#ffffff",
};


// ─── Design System ─────────────────────────────────────────────
const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
};

const SHADOW = {
  card: "0 10px 30px rgba(0,0,0,0.06)",
};

const fmt = (n, dec=0) => Number.isFinite(n) ? n.toLocaleString("fr-FR",{maximumFractionDigits:dec}) : "—";


function PageHeader({ title, subtitle, badge, th }) {
  return (
  <div style={{
    fontFamily: "Inter, sans-serif",
    letterSpacing: "-0.02em",
    fontVariantNumeric: "tabular-nums",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 22,
      paddingBottom: 16,
      borderBottom: `1px solid ${th.border}`,
    }}>
      <div>
        <div style={{ fontSize: 24, fontWeight: 750, color: th.t1 }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: th.t2, marginTop: 4 }}>
          {subtitle}
        </div>
      </div>

      <div style={{
        fontSize: 11,
        color: th.accent,
        background: `${th.accent}14`,
        border: `1px solid ${th.border2}`,
        padding: "6px 10px",
        borderRadius: 999,
        fontFamily:"Inter, sans-serif",
        textTransform: "uppercase",
      }}>
        {badge}
      </div>
    </div>
  );
}



function FieldHint({ children, th }) {
  return (
    <div style={{
      fontSize: 11,
      color: th.t3,
      marginTop: 6,
      lineHeight: 1.45
    }}>
      <span style={{color: th.accent, fontWeight: 800}}>ℹ</span> {children}
    </div>
  );
}

// ─── UI primitives ────────────────────────────────────────────────────────────

function MetricCard({label,value,sub,tone="default",th}){

  const tones = {
    blue:{
      bg:"rgba(64,156,255,0.08)",
      border:"rgba(64,156,255,0.25)",
      color:"#409CFF"
    },
    default:{
      bg:"rgba(59,126,246,0.08)",
      border:"rgba(59,126,246,0.22)",
      color:th.accent
    },
    warn:{
      bg:"rgba(255,181,71,0.10)",
      border:"rgba(255,181,71,0.28)",
      color:th.warn
    },
    danger:{
      bg:"rgba(255,85,85,0.10)",
      border:"rgba(255,85,85,0.30)",
      color:th.danger
    }
  }

  const t = tones[tone] || tones.default

  return (
    <div style={{
      padding:"14px 16px",
      borderRadius:14,
      background:t.bg,
      border:`1px solid ${t.border}`,
      boxShadow:SHADOW.card,
      transition:"all 0.2s"
    }}>
      <div style={{
        fontSize:11,
        color:th.t3,
        textTransform:"uppercase",
        letterSpacing:"0.08em",
        fontFamily:"Inter, sans-serif",
        marginBottom:6
      }}>
        {label}
      </div>

      <div style={{
        fontSize:20,
        fontWeight:800,
        color:t.color,
        marginBottom:4
      }}>
        {value}
      </div>

      <div style={{
        fontSize:12,
        color:th.t2,
        lineHeight:1.4
      }}>
        {sub}
      </div>
    </div>
  )
}



function KpiCard({label, value, color, sub, bg, th}) {
  const hasBg = !!bg;
  return (
    <div style={{background:hasBg?bg:th.cardBg, border:hasBg?"none":`1px solid ${th.border}`, borderRadius:8, padding:"14px 16px"}}>
      <div style={{fontSize:10, color:hasBg?"rgba(255,255,255,0.6)":th.t3, fontFamily:"Inter, sans-serif", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4}}>{label}</div>
      <div style={{fontSize:22, fontWeight:700, fontFamily:"Inter, sans-serif", color:hasBg?"#fff":(color||th.accent)}}>{value}</div>
      {sub&&<div style={{fontSize:11, color:hasBg?"rgba(255,255,255,0.7)":th.t3, fontFamily:"Inter, sans-serif", marginTop:3}}>{sub}</div>}
    </div>
  );
}

function Card({children, accent, th}) {
  const accentColors = {accent:th.accent, accent2:th.accent2, accent3:th.accent3, warn:th.warn};
  return (
    <div style={{
      background:th.cardBg, borderTop:`1px solid ${th.border}`,borderRight:`1px solid ${th.border}`,borderBottom:`1px solid ${th.border}`,borderLeft:accent ? `2px solid ${accentColors[accent]||th.accent}` : `1px solid ${th.border}`, borderRadius:6, padding:18,
    }}>{children}</div>
  );
}

function SectionTitle({children, th}) {
  return <div style={{fontSize:10, fontWeight:600, color:th.t2, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:14, paddingBottom:8, borderBottom:`1px solid ${th.border}`, fontFamily:"Inter, sans-serif"}}>{children}</div>;
}

function ResultRow({label, value, highlight, warn, danger, th}) {
  const color = danger ? th.danger : warn ? th.warn : highlight ? th.accent : th.t1;
  return (
    <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${th.border}`}}>
      <span style={{fontSize:12, color:th.t2}}>{label}</span>
      <span style={{fontFamily:"Inter, sans-serif", fontWeight:600, fontSize:13, color}}>{value}</span>
    </div>
  );
}

function InfoBox({children, type="info", th}) {
  const s = type==="ok"
    ? {bg:th.okBoxBg, border:th.okBoxBorder, color:th.okBoxColor}
    : type==="alert"
    ? {bg:th.alertBoxBg, border:th.alertBoxBorder, color:th.alertBoxColor}
    : {bg:th.infoBoxBg, border:th.infoBoxBorder, color:th.infoBoxColor};
  const Icon = type==="ok" ? CheckCircle : type==="alert" ? AlertTriangle : Info;
  return (
    <div style={{background:s.bg, border:`1px solid ${s.border}`, borderRadius:4, padding:"8px 12px", fontSize:11, color:s.color, fontFamily:"Inter, sans-serif", marginBottom:12, display:"flex", gap:8, alignItems:"flex-start"}}>
      <Icon size={13} style={{marginTop:1, flexShrink:0}} /><span>{children}</span>
    </div>
  );
}

function SliderField({label, min, max, step=1, value, onChange, display, th}) {
  return (
    <div style={{marginBottom:14}}>
      <label style={{display:"block", fontSize:10, color:th.t3, fontFamily:"Inter, sans-serif", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:5}}>{label}</label>
      <div style={{display:"flex", alignItems:"center", gap:10}}>
        <input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))} style={{flex:1, accentColor:th.accent}} />
        <span style={{fontFamily:"Inter, sans-serif", fontSize:12, color:th.accent, minWidth:60, textAlign:"right"}}>{display||value}</span>
      </div>
    </div>
  );
}

function NumField({label, min, max, step=1, value, onChange, unit, note, th}) {
  return (
    <div style={{marginBottom:14}}>
      <label style={{display:"block", fontSize:10, color:th.t3, fontFamily:"Inter, sans-serif", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:5}}>{label}</label>
      <div style={{display:"flex", gap:8, alignItems:"center"}}>
        <input type="number" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}
          style={{width:"100%", background:th.inputBg, border:`1px solid ${th.border}`, borderRadius:4, padding:"7px 10px", color:th.t1, fontFamily:"Inter, sans-serif", fontSize:13, boxSizing:"border-box"}} />
        {unit && <span style={{fontSize:11, color:th.t3, whiteSpace:"nowrap"}}>{unit}</span>}
      </div>
      {note && <div style={{fontSize:10, color:th.t3, marginTop:3}}>{note}</div>}
    </div>
  );
}

function SelectField({label, value, onChange, options, th}) {
  return (
    <div style={{marginBottom:14}}>
      <label style={{display:"block", fontSize:10, color:th.t3, fontFamily:"Inter, sans-serif", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:5}}>{label}</label>
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{width:"100%", background:th.inputBg, border:`1px solid ${th.border}`, borderRadius:4, padding:"7px 10px", color:th.t1, fontFamily:"Inter, sans-serif", fontSize:12, boxSizing:"border-box"}}>
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ─── 1. VMware ────────────────────────────────────────────────────────────────
function VMwareCalc({th, isMobile=false}) {
  const [nodes,        setNodes]        = useState(1);
  const [sockets,      setSockets]      = useState(1);
  const [cores,        setCores]        = useState(10);
  const [ram,          setRam]          = useState(768);
  const [overcommit,   setOvercommit]   = useState(3.75);
  const [licType,      setLicType]      = useState("vvf");
  const [pricePerCore, setPricePerCore] = useState(50);
  const [yearsTotal,   setYearsTotal]   = useState(3);
  const [maintenancePct,setMaintenancePct]=useState(20);
  const [financeOpen,  setFinanceOpen]  = useState(false);
  useEffect(()=>{ setFinanceOpen(cores < 16); }, [cores]);
  const [fxRate,       setFxRate]       = useState(0.92);

  const LICENSE_PRICES = { vvf:50, vcf:72 };

  const r = useMemo(()=>{
    const totalSockets    = nodes*sockets;
    const totalPhys       = totalSockets*cores;
    const billedPerSocket = Math.max(cores,16);
    const totalBilled     = totalSockets*billedPerSocket;
    const totalRamTo      = (nodes*ram)/1024;
    const vcpuTotal       = totalPhys*overcommit;
    const haRam           = ((nodes-1)*ram)/1024;
    const haCores         = (nodes-1)*sockets*cores;
    const haVcpu          = haCores*overcommit;
    const haPct           = nodes>0?(1/nodes)*100:0;
    const packs           = Math.ceil(totalBilled/2);
    const surcharge       = totalBilled>totalPhys;
    const surPct          = totalPhys>0?Math.round(((totalBilled-totalPhys)/totalPhys)*100):0;
    const annualCost      = totalBilled*pricePerCore;
    const annualCostEur   = annualCost;
    const maintenanceCost = annualCost*(maintenancePct/100);
    const totalAnnual     = annualCost+maintenanceCost;
    const totalProject    = totalAnnual*yearsTotal;
    const totalAnnualEur  = totalAnnual;
    const totalProjectEur = totalProject;
    const optBilled       = totalSockets*16;
    const optAnnual       = optBilled*pricePerCore;
    const savingsVsOpt    = annualCost-optAnnual;
    const showOpt         = cores < 16; // Surcoût réel seulement si CPU < 16 cœurs/socket

    // Avant-vente : efficacité licensing / perte financière
    const wastedCores     = Math.max(0, totalBilled - totalPhys);
    const efficiencyPct   = totalBilled > 0 ? Math.round((totalPhys / totalBilled) * 100) : 100;
    const wastedAnnual    = wastedCores * pricePerCore;
    const wastedProject   = wastedAnnual * yearsTotal;
    const extraPerfPct    = totalPhys > 0 ? Math.round((wastedCores / totalPhys) * 100) : 0;
    const efficiencyTone  = efficiencyPct >= 90 ? "default" : efficiencyPct >= 75 ? "warn" : "danger";

    // Comparaison avant-vente : VMware vs Proxmox
    const proxmoxPremiumPerSocket = 1100; // Proxmox VE Premium : €/an/socket
    const proxmoxAnnualCost = totalSockets * proxmoxPremiumPerSocket;
    const proxmoxProjectCost = proxmoxAnnualCost * yearsTotal;
    const savingsVsProxmoxAnnual = totalAnnual - proxmoxAnnualCost;
    const savingsVsProxmoxProject = totalProject - proxmoxProjectCost;

    return {
      totalSockets,totalPhys,billedPerSocket,totalBilled,totalRamTo,
      vcpuTotal,haRam,haCores,haVcpu,haPct,packs,surcharge,surPct,
      annualCost,annualCostEur,maintenanceCost,totalAnnual,totalProject,totalAnnualEur,totalProjectEur,
      annualCostEur,totalAnnualEur,totalProjectEur,
      optBilled,optAnnual,savingsVsOpt,showOpt,
      wastedCores,efficiencyPct,wastedAnnual,wastedProject,extraPerfPct,efficiencyTone,
      proxmoxPremiumPerSocket,proxmoxAnnualCost,proxmoxProjectCost,savingsVsProxmoxAnnual,savingsVsProxmoxProject,
    };
  },[nodes,sockets,cores,ram,overcommit,pricePerCore,maintenancePct,yearsTotal,fxRate]);

  const tt = {background:th.tooltipBg,border:`1px solid ${th.border2}`,borderRadius:4,fontSize:11,color:th.t1};
  const s = {
    card:     (accent)=>({background:th.cardBg,borderTop:`1px solid ${th.border}`,borderRight:`1px solid ${th.border}`,borderBottom:`1px solid ${th.border}`,borderLeft:accent?`2px solid ${accent}`:`1px solid ${th.border}`,borderRadius:6,padding:16}),
    secTitle: {fontSize:10,fontWeight:600,color:th.t2,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:14,paddingBottom:8,borderBottom:`1px solid ${th.border}`,fontFamily:"Inter, sans-serif"},
    label:    {display:"block",fontSize:10,color:th.t3,fontFamily:"Inter, sans-serif",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:5},
    input:    {width:"100%",background:th.bg2,border:`1px solid ${th.border}`,borderRadius:4,padding:"7px 10px",color:th.t1,fontFamily:"Inter, sans-serif",fontSize:13,boxSizing:"border-box"},
    select:   {width:"100%",background:th.bg2,border:`1px solid ${th.border}`,borderRadius:4,padding:"7px 10px",color:th.t1,fontFamily:"Inter, sans-serif",fontSize:12,boxSizing:"border-box"},
    row:      {display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${th.border}`},
    divider:  {border:"none",borderTop:`1px solid ${th.border}`,margin:"12px 0"},
    field:    {marginBottom:12},
  };

  function NF({label,value,onChange,min,max,step=1,unit,note}) {
    return (
      <div style={s.field}>
        <label style={s.label}>{label}</label>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <input type="number" min={min} max={max} step={step} value={value}
            onChange={e=>onChange(Number(e.target.value))} style={s.input}/>
          {unit&&<span style={{fontSize:11,color:th.t3,whiteSpace:"nowrap"}}>{unit}</span>}
        </div>
        {note&&<div style={{fontSize:10,color:th.t3,marginTop:3}}>{note}</div>}
      </div>
    );
  }

  function RR({label,value,color,highlight}) {
    return (
      <div style={{...s.row,background:highlight?`${th.accent}11`:undefined,padding:highlight?"8px 10px":"8px 0",borderRadius:highlight?4:0,marginBottom:highlight?4:0}}>
        <span style={{fontSize:12,color:th.t2,lineHeight:1.4}}>{label}</span>
        <span style={{fontFamily:"Inter, sans-serif",fontWeight:600,fontSize:13,color:color||th.t1}}>{value}</span>
      </div>
    );
  }

  function KpiC({label,value,sub,bg}) {
    return (
      <div style={{background:bg,borderRadius:8,padding:"14px 16px"}}>
        <div style={{fontSize:22,fontWeight:700,fontFamily:"Inter, sans-serif",color:"#fff"}}>{value}</div>
        {sub&&<div style={{fontSize:11,color:"rgba(255,255,255,0.75)",fontFamily:"Inter, sans-serif",marginTop:2}}>{sub}</div>}
        <div style={{fontSize:10,color:"rgba(255,255,255,0.55)",textTransform:"uppercase",letterSpacing:"0.08em",marginTop:4}}>{label}</div>
      </div>
    );
  }

  return (
    <div>
      {/* KPIs */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)",
        gap: 12,
        marginBottom: 22
      }}>
        <MetricCard
          label="Cœurs physiques"
          value={fmt(r.totalPhys) + " cœurs"}
          sub={nodes + " nœud(s) · " + sockets + " socket(s) · " + cores + " cœurs/socket"}
          tone="blue"
          th={th}
        />
        <MetricCard
          label="Cœurs facturés"
          value={fmt(r.totalBilled) + " cœurs"}
          sub={licType.toUpperCase() + " · minimum 16 cœurs/socket"}
          tone={r.surcharge ? "warn" : "default"}
          th={th}
        />
        <MetricCard
          label="Coût annuel"
          value={"~ " + fmt(r.annualCost) + " €"}
          sub={fmt(r.totalBilled) + " cœurs × " + pricePerCore + " €/cœur"}
          tone="orange"
          th={th}
        />
        <MetricCard
          label={"Projet " + yearsTotal + " ans"}
          value={"~ " + fmt(r.totalProject) + " €"}
          sub={"Licences + maintenance " + maintenancePct + "%"}
          tone="default"
          th={th}
        />
      </div>

      {/* Recommandation finale intelligente */}
      <div style={{
        background: r.efficiencyPct < 75 ? "rgba(255,85,85,0.06)" : r.efficiencyPct < 90 ? "rgba(255,181,71,0.07)" : "rgba(59,126,246,0.06)",
        border: `1px solid ${r.efficiencyPct < 75 ? "rgba(255,85,85,0.24)" : r.efficiencyPct < 90 ? "rgba(255,181,71,0.25)" : "rgba(59,126,246,0.22)"}`,
        borderRadius: 14,
        padding: "16px 18px",
        marginBottom: 18,
        boxShadow: SHADOW.card
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 12
        }}>
          <div>
            <div style={{
              fontSize: 11,
              color: th.t3,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontFamily:"Inter, sans-serif",
              marginBottom: 6
            }}>
              Recommandation finale intelligente
            </div>

            <div style={{
              fontSize: 18,
              fontWeight: 800,
              color: r.efficiencyPct < 75 ? th.danger : r.efficiencyPct < 90 ? th.warn : th.accent
            }}>
              {r.efficiencyPct < 75
                ? "Configuration à optimiser en priorité"
                : r.efficiencyPct < 90
                ? "Configuration acceptable mais perfectible"
                : "Configuration licensing optimisée"
              }
            </div>
          </div>

          <div style={{
            fontSize: 11,
            fontFamily:"Inter, sans-serif",
            color: r.efficiencyPct < 75 ? th.danger : r.efficiencyPct < 90 ? th.warn : th.accent,
            background: th.cardBg,
            border: `1px solid ${th.border}`,
            borderRadius: 999,
            padding: "6px 10px",
            whiteSpace: "nowrap"
          }}>
            Score {r.efficiencyPct}%
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr",
          gap: 14
        }}>
          <div style={{fontSize: 13, color: th.t2, lineHeight: 1.65}}>
            {r.wastedCores > 0
              ? <>Le design actuel génère <strong style={{color: th.t1}}>{fmt(r.wastedCores)} cœurs facturés non exploités</strong>, soit environ <strong style={{color: th.warn}}>~ {fmt(r.wastedProject)} €</strong> de coût licensing peu valorisé sur {yearsTotal} ans. La première action recommandée est d’aligner les CPU sur <strong style={{color: th.accent}}>16 cœurs/socket</strong> afin d’obtenir plus de puissance à coût VMware équivalent.</>
              : <>Le design CPU est correctement aligné avec le modèle de facturation VMware/Broadcom. La recommandation est de conserver cette base et de concentrer l’analyse sur la consolidation VM, la RAM, le stockage et les besoins HA.</>
            }
          </div>

          <div style={{
            background: th.cardBg,
            border: `1px solid ${th.border}`,
            borderRadius: 10,
            padding: "12px 14px"
          }}>
            <div style={{
              fontSize: 11,
              color: th.t3,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontFamily:"Inter, sans-serif",
              marginBottom: 10
            }}>
              Action proposée
            </div>

            {r.wastedCores > 0 ? (
              <ul style={{margin: 0, paddingLeft: 18, color: th.t2, fontSize: 12, lineHeight: 1.7}}>
                <li>Passer les CPU à 16 cœurs/socket minimum</li>
                <li>Comparer le gain de performance à coût VMware constant</li>
                <li>Présenter Proxmox Premium comme alternative de cadrage budgétaire</li>
              </ul>
            ) : (
              <ul style={{margin: 0, paddingLeft: 18, color: th.t2, fontSize: 12, lineHeight: 1.7}}>
                <li>Conserver le design CPU actuel</li>
                <li>Valider le nombre de sockets et la consolidation VM</li>
                <li>Comparer les scénarios sur le coût par VM</li>
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Optimisation CPU + efficacité visuelle + comparaison */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
        gap: 12,
        marginBottom: 18
      }}>
        {/* Bouton optimiser CPU */}
        <div style={{
          background: th.cardBg,
          border: `1px solid ${th.border}`,
          borderRadius: 14,
          padding: "16px 18px",
          boxShadow: SHADOW.card
        }}>
          <div style={{
            fontSize: 11,
            color: th.t3,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontFamily:"Inter, sans-serif",
            marginBottom: 10
          }}>
            Optimisation CPU
          </div>

          <div style={{fontSize: 13, color: th.t2, lineHeight: 1.55, marginBottom: 14}}>
            {cores < 16
              ? <>CPU sous le seuil Broadcom. En passant à <strong style={{color: th.t1}}>16 cœurs/socket</strong>, le client obtient plus de puissance sans augmenter les cœurs facturés.</>
              : <>La configuration CPU est déjà alignée avec le minimum Broadcom. Aucun ajustement automatique nécessaire.</>
            }
          </div>

          <button
            onClick={() => setCores(16)}
            disabled={cores >= 16}
            style={{
              width: "100%",
              cursor: cores < 16 ? "pointer" : "not-allowed",
              border: `1px solid ${cores < 16 ? th.accent : th.border}`,
              background: cores < 16 ? `${th.accent}18` : th.bg2,
              color: cores < 16 ? th.accent : th.t3,
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 12,
              fontWeight: 700,
              fontFamily:"Inter, sans-serif"
            }}
          >
            {cores < 16 ? "Optimiser à 16 cœurs/socket" : "CPU déjà optimisé"}
          </button>
        </div>

        {/* Graphique efficacité */}
        <div style={{
          background: th.cardBg,
          border: `1px solid ${th.border}`,
          borderRadius: 14,
          padding: "16px 18px",
          boxShadow: SHADOW.card
        }}>
          <div style={{
            fontSize: 11,
            color: th.t3,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontFamily:"Inter, sans-serif",
            marginBottom: 14
          }}>
            Graphique efficacité
          </div>

          <div style={{display: "flex", justifyContent: "space-between", marginBottom: 8}}>
            <span style={{fontSize: 12, color: th.t2}}>Cœurs utilisés</span>
            <strong style={{fontSize: 12, color: th.t1, fontFamily:"Inter, sans-serif"}}>
              {fmt(r.totalPhys)} / {fmt(r.totalBilled)}
            </strong>
          </div>

          <div style={{
            height: 12,
            background: th.bg2,
            borderRadius: 999,
            overflow: "hidden",
            border: `1px solid ${th.border}`,
            marginBottom: 10
          }}>
            <div style={{
              height: "100%",
              width: Math.min(100, r.efficiencyPct) + "%",
              background: r.efficiencyPct < 75 ? th.danger : r.efficiencyPct < 90 ? th.warn : th.accent,
              borderRadius: 999,
              transition: "width 0.2s"
            }} />
          </div>

          <div style={{display: "flex", justifyContent: "space-between"}}>
            <span style={{fontSize: 11, color: th.t3}}>Efficacité licensing</span>
            <span style={{
              fontSize: 13,
              color: r.efficiencyPct < 75 ? th.danger : r.efficiencyPct < 90 ? th.warn : th.accent,
              fontWeight: 800,
              fontFamily:"Inter, sans-serif"
            }}>
              {r.efficiencyPct}%
            </span>
          </div>

          {r.wastedCores > 0 && (
            <div style={{
              marginTop: 10,
              fontSize: 11,
              color: th.warn,
              background: "rgba(255,181,71,0.08)",
              border: "1px solid rgba(255,181,71,0.22)",
              borderRadius: 8,
              padding: "7px 9px"
            }}>
              ⚠ {fmt(r.wastedCores)} cœurs payés mais non exploités
            </div>
          )}
        </div>

        {/* Comparaison VMware vs Proxmox */}
        <div style={{
          background: th.cardBg,
          border: `1px solid ${th.border}`,
          borderRadius: 14,
          padding: "16px 18px",
          boxShadow: SHADOW.card
        }}>
          <div style={{
            fontSize: 11,
            color: th.t3,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontFamily:"Inter, sans-serif",
            marginBottom: 12
          }}>
            Comparaison licence
          </div>

          <div style={{display: "grid", gap: 8}}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 10px",
              borderRadius: 8,
              background: th.bg2,
              border: `1px solid ${th.border}`
            }}>
              <span style={{fontSize: 12, color: th.t2}}>VMware {licType.toUpperCase()}</span>
              <strong style={{fontSize: 13, color: th.t1, fontFamily:"Inter, sans-serif"}}>
                ~ {fmt(r.totalProject)} €
              </strong>
            </div>

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 10px",
              borderRadius: 8,
              background: "rgba(59,126,246,0.06)",
              border: "1px solid rgba(59,126,246,0.22)"
            }}>
              <span style={{fontSize: 12, color: th.t2}}>Proxmox VE Premium</span>
              <strong style={{fontSize: 13, color: th.accent, fontFamily:"Inter, sans-serif"}}>
                ~ {fmt(r.proxmoxProjectCost)} €
              </strong>
            </div>
          </div>

          <div style={{
            marginTop: 12,
            padding: "9px 10px",
            borderRadius: 8,
            background: "rgba(99,102,241,0.06)",
            border: "1px solid rgba(99,102,241,0.18)",
            color: th.accent2,
            fontSize: 12,
            lineHeight: 1.5
          }}>
            Proxmox Premium : {fmt(r.totalSockets)} socket(s) × {fmt(r.proxmoxPremiumPerSocket)} €/an × {yearsTotal} ans.
            <br />
            Écart estimé sur {yearsTotal} ans : <strong>{r.savingsVsProxmoxProject >= 0 ? "~ " + fmt(r.savingsVsProxmoxProject) + " € d'économie" : "~ " + fmt(Math.abs(r.savingsVsProxmoxProject)) + " € de surcoût"}</strong>.
            <br />
            Calcul par socket physique utilisé, indépendamment du nombre de cœurs.
          </div>
        </div>
      </div>

      {/* 3 cards */}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1.5fr",gap:14,marginBottom:14}}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>

        {/* Paramètres */}
        <div style={s.card(th.accent)}>
          <div style={s.secTitle}>Paramètres cluster</div>
          <NF label="Nœuds" value={nodes} onChange={setNodes} min={1} max={32} unit="serveurs"/>
          <NF label="Sockets / nœud" value={sockets} onChange={setSockets} min={1} max={4} unit="sockets" note="1 = mono-proc | 2 = bi-proc"/>
          <NF label="Cœurs physiques / socket" value={cores} onChange={setCores} min={4} max={128} step={2} unit="cœurs" note="Xeon : 16, 24, 32, 48, 64..."/>

          <div style={s.field}>
            <label style={s.label}>Licence</label>
            <select value={licType} onChange={e=>{setLicType(e.target.value);setPricePerCore(LICENSE_PRICES[e.target.value]);}} style={s.select}>
              <option value="vvf">VMware VVF (vSphere Foundation)</option>
              <option value="vcf">VMware VCF (Cloud Foundation)</option>
            </select>
          </div>
        </div>
        {/* Impact financier */}
        <div style={{borderRadius:6,border:`1px solid ${th.border}`,overflow:"hidden",marginBottom:4}}>
          <div onClick={()=>setFinanceOpen(v=>!v)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",cursor:"pointer",background:financeOpen?"rgba(255,107,53,0.08)":th.bg2}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:11,fontWeight:600,color:financeOpen?"#ff6b35":th.t2,textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:"Inter, sans-serif"}}>💰 Impact financier</span>
              {r.showOpt&&<span style={{fontSize:10,background:"rgba(255,181,71,0.15)",color:"#ffb347",border:"1px solid rgba(255,181,71,0.4)",borderRadius:3,padding:"1px 6px",fontFamily:"Inter, sans-serif"}}>⚠️ Surcoût détecté</span>}
            </div>
            <span style={{color:th.t3}}>{financeOpen?"▲":"▼"}</span>
          </div>
          {financeOpen&&<div style={{padding:16}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <NF label="Prix / cœur / an" value={pricePerCore} onChange={setPricePerCore} min={1} max={200} unit="€" note={licType==="vvf"?"Indicatif : ~46 €/cœur/an":"Indicatif : ~66 €/cœur/an"}/>
            <NF label="Durée contrat" value={yearsTotal} onChange={setYearsTotal} min={1} max={5} unit="ans"/>
            <NF label="Maintenance annuelle" value={maintenancePct} onChange={setMaintenancePct} min={0} max={30} unit="%" note="Incluse abonnement Broadcom"/>



          </div>
          <hr style={s.divider}/>
          <RR label="Coût licences / an"         value={"~ "+fmt(r.annualCostEur)+" €"}/>
          <RR label="Maintenance / an"           value={"~ "+fmt(Math.round(r.maintenanceCost))+" €"} color={th.t2}/>
          <RR label="Coût annuel total"          value={"~ "+fmt(r.totalAnnualEur)+" €"} color={th.accent} highlight/>
          <RR label={"Coût total "+yearsTotal+" ans"} value={"~ "+fmt(r.totalProjectEur)+" €"} color={th.accent} highlight/>
          </div>}
        </div>

        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {/* Résultats licensing */}
        <div style={s.card(th.accent2)}>
          <div style={s.secTitle}>Résultats licensing</div>
          {r.surcharge&&(
            <div style={{background:"rgba(255,181,71,0.1)",border:"1px solid rgba(255,181,71,0.3)",borderRadius:4,padding:"8px 12px",marginBottom:12,fontSize:11,color:"#ffb347",fontFamily:"Inter, sans-serif"}}>
              ⚠ {fmt(r.totalBilled)} cœurs facturés — minimum 16/socket appliqué
            </div>
          )}
          <RR label="Total sockets"       value={fmt(r.totalSockets)+" sockets"}/>
          <RR label="Cœurs physiques"     value={fmt(r.totalPhys)+" cœurs"}/>
          <RR label="Min Broadcom/socket" value={fmt(r.billedPerSocket)+" cœurs"}/>
          <RR label="Cœurs facturés"      value={fmt(r.totalBilled)+" cœurs"} color={r.surcharge?"#ffb347":th.accent} highlight/>
          <RR label="Packs 2-cœurs"       value={fmt(r.packs)+" packs"} color={th.accent}/>
        </div>
        <div style={{borderRadius:6,border:`1px solid ${r.showOpt?"rgba(255,181,71,0.4)":th.border}`,padding:"12px 16px",background:r.showOpt?"rgba(255,181,71,0.05)":"rgba(59,126,246,0.04)"}}>
          <div style={{fontSize:10,fontWeight:600,color:th.t2,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10,fontFamily:"Inter, sans-serif"}}>Optimisation licensing</div>
          {r.showOpt?(<div><div style={{fontSize:12,color:"#ffb347",fontFamily:"Inter, sans-serif",fontWeight:600,marginBottom:6}}>CPUs a {cores} coeurs/socket - Broadcom facture 16 minimum</div><div style={{fontSize:11,color:th.t2,marginBottom:8}}>Vous payez {fmt(r.totalBilled)} coeurs pour {fmt(r.totalPhys)} coeurs physiques reels ({r.surPct}% de surcout).</div><div style={{padding:"6px 10px",background:th.bg2,borderRadius:3,fontSize:11,color:th.t1,fontFamily:"Inter, sans-serif"}}>Conseil : choisir des CPUs a 16 coeurs/socket vous donnerait plus de puissance au meme prix Broadcom.</div></div>):(<div style={{fontSize:11,color:th.accent}}>Configuration optimale - coeurs physiques 16/socket, aucun surcout Broadcom</div>)}
        </div>


        </div>
      </div>

    </div>
  );
}


// ─── 2. Windows & SQL ─────────────────────────────────────────────────────────
function WindowsCalc({th, isMobile=false}) {
  const [servers,setServers]=useState(6);
  const [coresPerServer,setCoresPerServer]=useState(32);
  const [vms,setVms]=useState(136);
  const [wsEdition,setWsEdition]=useState("datacenter");
  const [sqlInstances,setSqlInstances]=useState(4);
  const [sqlCores,setSqlCores]=useState(16);
  const [sqlEdition,setSqlEdition]=useState("standard");

  const r = useMemo(()=>{
    const effective=Math.max(coresPerServer,16);
    const packsPerServer=Math.ceil(effective/2);

    let wsLicenses,wsComment,vmCoverage;
    if(wsEdition==="datacenter"){
      wsLicenses=servers*packsPerServer;
      wsComment="Datacenter : VMs illimitées par serveur licencié";
      vmCoverage="Illimitées";
    } else {
      wsLicenses=Math.ceil(vms/2)*packsPerServer;
      wsComment=`Standard : 2 VMs par licence → ${Math.ceil(vms/2)} licences requises`;
      vmCoverage=fmt(vms);
    }

    const sqlPacksPerInst=Math.max(4,Math.ceil(sqlCores/2));
    const sqlLicenses=sqlInstances*sqlPacksPerInst;

    const wsEfficiency = coresPerServer >= 16 ? 100 : Math.round((coresPerServer / 16) * 100);
    const sqlWarn = sqlEdition==="standard" && sqlCores>24;
    const globalStatus = sqlWarn ? "Risque SQL Standard" : wsEfficiency < 100 ? "Optimisation Windows possible" : "Configuration cohérente";

    return {
      effective,packsPerServer,wsLicenses,wsComment,sqlPacksPerInst,sqlLicenses,
      vmCoverage,wsEfficiency,sqlWarn,globalStatus
    };
  },[servers,coresPerServer,vms,wsEdition,sqlInstances,sqlCores,sqlEdition]);

  return (
    <div>
      <div style={{
        display:"grid",
        gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",
        gap:12,
        marginBottom:22
      }}>
        <MetricCard label="Packs Windows" value={fmt(r.wsLicenses)} sub={servers+" serveur(s) · "+coresPerServer+" cœurs/serveur"} tone="blue" th={th} />
        <MetricCard label="Packs SQL" value={fmt(r.sqlLicenses)} sub={sqlInstances+" instance(s) · "+sqlCores+" cœurs/instance"} tone={r.sqlWarn?"danger":"default"} th={th} />
        <MetricCard label="VMs couvertes" value={r.vmCoverage} sub={wsEdition==="datacenter"?"Datacenter · illimité":"Standard · 2 VMs/licence"} tone="default" th={th} />
        <MetricCard label="Statut" value={r.sqlWarn?"⚠ Risque":"✓ OK"} sub={r.globalStatus} tone={r.sqlWarn?"danger":r.wsEfficiency<100?"warn":"default"} th={th} />
      </div>

      <div style={{
        background:r.sqlWarn?"rgba(255,85,85,0.06)":r.wsEfficiency<100?"rgba(255,181,71,0.07)":"rgba(59,126,246,0.06)",
        border:`1px solid ${r.sqlWarn?"rgba(255,85,85,0.24)":r.wsEfficiency<100?"rgba(255,181,71,0.25)":"rgba(59,126,246,0.22)"}`,
        borderRadius:14,
        padding:"16px 18px",
        marginBottom:18,
        boxShadow:SHADOW.card
      }}>
        <div style={{
          display:"flex",
          justifyContent:"space-between",
          alignItems:"flex-start",
          gap:12,
          marginBottom:12
        }}>
          <div>
            <div style={{
              fontSize:11,
              color:th.t3,
              textTransform:"uppercase",
              letterSpacing:"0.08em",
              fontFamily:"Inter, sans-serif",
              marginBottom:6
            }}>
              Recommandation Windows & SQL
            </div>
            <div style={{
              fontSize:18,
              fontWeight:800,
              color:r.sqlWarn?th.danger:r.wsEfficiency<100?th.warn:th.accent
            }}>
              {r.sqlWarn ? "Attention à la limite SQL Standard" : r.wsEfficiency<100 ? "Optimisation licensing Windows possible" : "Configuration licensing cohérente"}
            </div>
          </div>

          <div style={{
            fontSize:11,
            fontFamily:"Inter, sans-serif",
            color:r.sqlWarn?th.danger:r.wsEfficiency<100?th.warn:th.accent,
            background:th.cardBg,
            border:`1px solid ${th.border}`,
            borderRadius:999,
            padding:"6px 10px",
            whiteSpace:"nowrap"
          }}>
            {wsEdition.toUpperCase()} · SQL {sqlEdition.toUpperCase()}
          </div>
        </div>

        <div style={{
          display:"grid",
          gridTemplateColumns:isMobile?"1fr":"1.2fr 1fr",
          gap:14
        }}>
          <div style={{fontSize:13,color:th.t2,lineHeight:1.65}}>
            {r.sqlWarn
              ? <>SQL Server Standard est limité à <strong style={{color:th.t1}}>24 cœurs</strong>. Avec <strong style={{color:th.t1}}>{sqlCores} cœurs</strong> par instance, il faut envisager SQL Enterprise ou réduire le dimensionnement par instance.</>
              : wsEdition==="standard"
              ? <>Windows Server Standard peut devenir coûteux dès que le nombre de VMs augmente. Pour <strong style={{color:th.t1}}>{fmt(vms)} VMs</strong>, Datacenter peut être plus cohérent si la densité de virtualisation est élevée.</>
              : <>Windows Server Datacenter est adapté aux environnements fortement virtualisés. La couverture VM illimitée simplifie le licensing et réduit le risque de sous-dimensionnement contractuel.</>
            }
          </div>

          <div style={{
            background:th.cardBg,
            border:`1px solid ${th.border}`,
            borderRadius:10,
            padding:"12px 14px"
          }}>
            <div style={{
              fontSize:11,
              color:th.t3,
              textTransform:"uppercase",
              letterSpacing:"0.08em",
              fontFamily:"Inter, sans-serif",
              marginBottom:10
            }}>
              Action proposée
            </div>
            <ul style={{margin:0,paddingLeft:18,color:th.t2,fontSize:12,lineHeight:1.7}}>
              {r.sqlWarn ? (
                <>
                  <li>Valider l’édition SQL réellement nécessaire</li>
                  <li>Comparer Standard vs Enterprise</li>
                  <li>Revoir le découpage des instances SQL</li>
                </>
              ) : wsEdition==="standard" ? (
                <>
                  <li>Comparer Windows Standard vs Datacenter</li>
                  <li>Vérifier la densité VM par hôte</li>
                  <li>Anticiper la croissance du nombre de VMs</li>
                </>
              ) : (
                <>
                  <li>Conserver Datacenter si forte densité VM</li>
                  <li>Valider les packs 2-cœurs par serveur</li>
                  <li>Contrôler les besoins SQL séparément</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14}}>
        <Card accent="accent" th={th}>
          <SectionTitle th={th}>Windows Server</SectionTitle>
          <NumField label="Serveurs physiques" value={servers} onChange={setServers} min={1} max={100} unit="serveurs" th={th} />
          <NumField label="Cœurs / serveur" value={coresPerServer} onChange={setCoresPerServer} min={4} max={128} step={2} unit="cœurs" th={th} />
          <NumField label="Nombre de VMs" value={vms} onChange={setVms} min={1} max={5000} unit="VMs" th={th} />
          <SelectField label="Édition Windows Server" value={wsEdition} onChange={setWsEdition} th={th}
            options={[{value:"datacenter",label:"Datacenter (VMs illimitées)"},{value:"standard",label:"Standard (2 VMs / licence)"}]} />

          <hr style={{border:"none",borderTop:`1px solid ${th.border}`,margin:"12px 0"}} />

          <ResultRow label="Cœurs effectifs / serveur" value={fmt(r.effective)+" cœurs"} th={th} />
          <ResultRow label="Packs 2-cœurs / serveur" value={fmt(r.packsPerServer)+" packs"} th={th} />
          <ResultRow label="Packs Windows Server" value={fmt(r.wsLicenses)+" packs"} highlight th={th} />

          <div style={{
            marginTop:12,
            padding:"10px 12px",
            borderRadius:10,
            background:th.bg2,
            border:`1px solid ${th.border}`,
            fontSize:12,
            color:th.t2,
            lineHeight:1.5
          }}>
            {r.wsComment}
          </div>
        </Card>

        <Card accent="accent2" th={th}>
          <SectionTitle th={th}>SQL Server</SectionTitle>
          <NumField label="Instances SQL" value={sqlInstances} onChange={setSqlInstances} min={1} max={100} unit="instances" th={th} />
          <NumField label="Cœurs / instance" value={sqlCores} onChange={setSqlCores} min={4} max={128} step={2} unit="cœurs" th={th} />
          <SelectField label="Édition SQL" value={sqlEdition} onChange={setSqlEdition} th={th}
            options={[{value:"standard",label:"Standard (max 24c, 128 Go RAM)"},{value:"enterprise",label:"Enterprise (illimité)"}]} />

          <hr style={{border:"none",borderTop:`1px solid ${th.border}`,margin:"12px 0"}} />

          <InfoBox type={r.sqlWarn?"alert":"ok"} th={th}>
            {r.sqlWarn ? "SQL Standard limité à 24 cœurs — envisager Enterprise" : "Configuration SQL validée"}
          </InfoBox>

          <ResultRow label="Packs 2-cœurs / instance" value={fmt(r.sqlPacksPerInst)+" packs"} th={th} />
          <ResultRow label="Packs SQL Server total" value={fmt(r.sqlLicenses)+" packs"} highlight th={th} />

          <div style={{
            marginTop:12,
            padding:"10px 12px",
            borderRadius:10,
            background:th.bg2,
            border:`1px solid ${th.border}`,
            fontSize:12,
            color:th.t2,
            lineHeight:1.5
          }}>
            {sqlEdition==="standard"
              ? "Standard : 4 cœurs minimum par instance, limite 24 cœurs et 128 Go RAM."
              : "Enterprise : pas de limite pratique de cœurs ou RAM pour les scénarios avancés."
            }
          </div>
        </Card>
      </div>
    </div>
  );
}


// ─── 3. Microsoft 365 ─────────────────────────────────────────────────────────
const M365_PLANS=[
  {id:"f1",name:"F1",price:2.25,desc:"Terrain / Firstline, pas d'apps desktop"},
  {id:"bp",name:"Business Premium",price:10.50,desc:"PME, sécurité intégrée"},
  {id:"e3",name:"E3",price:32.00,desc:"Entreprise, conformité avancée"},
  {id:"e5",name:"E5",price:55.00,desc:"Sécurité maximale + analytics"},
];

function M365Calc({th, isMobile=false}) {
  const [frontline,setFrontline]=useState(50);
  const [business,setBusiness]=useState(100);
  const [power,setPower]=useState(30);
  const [needsCompliance,setNeedsCompliance]=useState(false);

  const r = useMemo(()=>{
    const fp=M365_PLANS.find(p=>p.id==="f1");
    const bp=M365_PLANS.find(p=>p.id===(needsCompliance?"e3":"bp"));
    const pp=M365_PLANS.find(p=>p.id===(needsCompliance?"e5":"e3"));
    const total=frontline+business+power;
    const monthly=frontline*fp.price+business*bp.price+power*pp.price;
    return {total,monthly,annual:monthly*12,ppu:total>0?monthly/total:0,fp,bp,pp};
  },[frontline,business,power,needsCompliance]);

  const barData=[
    {name:"Terrain",cost:+(frontline*r.fp.price).toFixed(0)},
    {name:"Bureautique",cost:+(business*r.bp.price).toFixed(0)},
    {name:"Avancés",cost:+(power*r.pp.price).toFixed(0)},
  ];
  const tt={background:th.tooltipBg,border:`1px solid ${th.border2}`,borderRadius:4,fontSize:11,color:th.t1};

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(5,1fr)",gap:10,marginBottom:20}}>
        <KpiCard label="Total users" value={fmt(r.total)} sub="licences Microsoft 365" bg="linear-gradient(135deg,#0077cc,#005599)" th={th} />
        <KpiCard label="Budget mensuel" value={fmt(r.monthly,0)+" €"} sub="abonnement mensuel" bg="linear-gradient(135deg,#00a884,#007a60)" th={th} />
        <KpiCard label="Budget annuel" value={fmt(r.annual,0)+" €"} sub="engagement annuel" bg="linear-gradient(135deg,#5a4fcf,#3d35a0)" th={th} />
        <KpiCard label="Coût / user / mois" value={fmt(r.ppu,2)+" €"} sub="coût moyen par utilisateur" bg="linear-gradient(135deg,#0099ff,#0066cc)" th={th} />
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14}}>
        <Card accent="accent" th={th}>
          <SectionTitle th={th}>Profils utilisateurs</SectionTitle>
          <SliderField label="Terrain / Firstline" min={0} max={500} step={5} value={frontline} onChange={setFrontline} display={frontline+" users → "+r.fp.name+" ("+r.fp.price+" €/u/m)"} th={th} />
          <SliderField label="Bureautique" min={0} max={500} step={5} value={business} onChange={setBusiness} display={business+" users → "+r.bp.name+" ("+r.bp.price+" €/u/m)"} th={th} />
          <SliderField label="Avancés / Power users" min={0} max={200} step={5} value={power} onChange={setPower} display={power+" users → "+r.pp.name+" ("+r.pp.price+" €/u/m)"} th={th} />
          <hr style={{border:"none",borderTop:`1px solid ${th.border}`,margin:"12px 0"}} />
          <label style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:th.t2,lineHeight:1.4,cursor:"pointer"}}>
            <input type="checkbox" checked={needsCompliance} onChange={e=>setNeedsCompliance(e.target.checked)} style={{accentColor:th.accent}} />
            Conformité / eDiscovery / Purview (→ E3/E5)
          </label>
        </Card>
        <Card accent="accent2" th={th}>
          <SectionTitle th={th}>Répartition budget mensuel</SectionTitle>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={barData} layout="vertical" barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke={th.border} horizontal={false} />
              <XAxis type="number" tick={{fontSize:10,fill:th.t2}} unit=" €" />
              <YAxis dataKey="name" type="category" tick={{fontSize:10,fill:th.t2}} width={80} />
              <Tooltip contentStyle={tt} formatter={v=>[fmt(v,0)+" €"]} />
              <Bar dataKey="cost" fill={th.accent} radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
          <hr style={{border:"none",borderTop:`1px solid ${th.border}`,margin:"12px 0"}} />
          <ResultRow label={"Terrain ("+frontline+" × "+r.fp.price+" €)"} value={fmt(frontline*r.fp.price,0)+" €/m"} th={th} />
          <ResultRow label={"Bureautique ("+business+" × "+r.bp.price+" €)"} value={fmt(business*r.bp.price,0)+" €/m"} th={th} />
          <ResultRow label={"Avancés ("+power+" × "+r.pp.price+" €)"} value={fmt(power*r.pp.price,0)+" €/m"} th={th} />
          <hr style={{border:"none",borderTop:`1px solid ${th.border}`,margin:"12px 0"}} />
          <ResultRow label="Total mensuel" value={fmt(r.monthly,0)+" €"} highlight th={th} />
          <ResultRow label="Total annuel" value={fmt(r.annual,0)+" €"} highlight th={th} />
        </Card>
      </div>
    </div>
  );
}

// ─── 4. Stockage (avancé) ────────────────────────────────────────────────────
// ─── 4. Stockage (avancé) ────────────────────────────────────────────────────
// ─── 4. Stockage (avancé) ────────────────────────────────────────────────────

const DISK_CATALOG = {
  "3.5": [
    { id:"nlsas-4",   label:"NLSAS 7.2K 4 To",      cap:4,     iops:120,   bw:0.20, type:"NLSAS" },
    { id:"nlsas-8",   label:"NLSAS 7.2K 8 To",      cap:8,     iops:110,   bw:0.20, type:"NLSAS" },
    { id:"nlsas-12",  label:"NLSAS 7.2K 12 To",     cap:12,    iops:100,   bw:0.20, type:"NLSAS" },
    { id:"nlsas-16",  label:"NLSAS 7.2K 16 To",     cap:16,    iops:100,   bw:0.20, type:"NLSAS" },
    { id:"nlsas-16f", label:"NLSAS 7.2K 16 To FIPS",cap:16,    iops:100,   bw:0.20, type:"NLSAS" },
    { id:"nlsas-18",  label:"NLSAS 7.2K 18 To",     cap:18,    iops:95,    bw:0.20, type:"NLSAS" },
    { id:"sas10-12",  label:"SAS 10K 1,2 To",       cap:1.2,   iops:200,   bw:0.30, type:"SAS"   },
    { id:"sas10-24",  label:"SAS 10K 2,4 To",       cap:2.4,   iops:200,   bw:0.30, type:"SAS"   },
    { id:"ssd-096",   label:"SSD RI 960 Go",         cap:0.96,  iops:50000, bw:1.0,  type:"SSD"   },
    { id:"ssd-160",   label:"SSD MU 1,6 To",        cap:1.6,   iops:40000, bw:1.0,  type:"SSD"   },
    { id:"ssd-192",   label:"SSD 1,92 To",           cap:1.92,  iops:45000, bw:1.0,  type:"SSD"   },
    { id:"ssd-384",   label:"SSD 3,84 To",           cap:3.84,  iops:45000, bw:1.0,  type:"SSD"   },
    { id:"ssd-768",   label:"SSD RI 7,68 To",        cap:7.68,  iops:40000, bw:1.0,  type:"SSD"   },
    { id:"nvme-192",  label:"NVMe 1,92 To",          cap:1.92,  iops:200000,bw:6.5,  type:"NVMe"  },
    { id:"nvme-384",  label:"NVMe 3,84 To",          cap:3.84,  iops:200000,bw:6.5,  type:"NVMe"  },
    { id:"nvme-768",  label:"NVMe 7,68 To",          cap:7.68,  iops:180000,bw:6.5,  type:"NVMe"  },
    { id:"nvme-1536", label:"NVMe 15,36 To",         cap:15.36, iops:160000,bw:6.0,  type:"NVMe"  },
    { id:"nvme-3072", label:"NVMe 30,72 To",         cap:30.72, iops:140000,bw:6.0,  type:"NVMe"  },
  ],
  "2.5": [
    { id:"sas10-12",  label:"SAS 10K 1,2 To",       cap:1.2,   iops:200,   bw:0.30, type:"SAS"   },
    { id:"sas10-24",  label:"SAS 10K 2,4 To",       cap:2.4,   iops:200,   bw:0.30, type:"SAS"   },
    { id:"sas10-24f", label:"SAS 10K 2,4 To FIPS",  cap:2.4,   iops:200,   bw:0.30, type:"SAS"   },
    { id:"ssd-096",   label:"SSD RI 960 Go",         cap:0.96,  iops:50000, bw:1.0,  type:"SSD"   },
    { id:"ssd-160",   label:"SSD MU 1,6 To",        cap:1.6,   iops:40000, bw:1.0,  type:"SSD"   },
    { id:"ssd-192",   label:"SSD 1,92 To",           cap:1.92,  iops:45000, bw:1.0,  type:"SSD"   },
    { id:"ssd-192s",  label:"SSD SED 1,92 To",       cap:1.92,  iops:45000, bw:1.0,  type:"SSD"   },
    { id:"ssd-384",   label:"SSD 3,84 To",           cap:3.84,  iops:45000, bw:1.0,  type:"SSD"   },
    { id:"ssd-384f",  label:"SSD FIPS 3,84 To",      cap:3.84,  iops:45000, bw:1.0,  type:"SSD"   },
    { id:"ssd-768",   label:"SSD RI 7,68 To",        cap:7.68,  iops:40000, bw:1.0,  type:"SSD"   },
    { id:"nvme-192",  label:"NVMe 1,92 To",          cap:1.92,  iops:200000,bw:6.5,  type:"NVMe"  },
    { id:"nvme-384",  label:"NVMe 3,84 To",          cap:3.84,  iops:200000,bw:6.5,  type:"NVMe"  },
    { id:"nvme-768",  label:"NVMe 7,68 To",          cap:7.68,  iops:180000,bw:6.5,  type:"NVMe"  },
    { id:"nvme-1536", label:"NVMe 15,36 To",         cap:15.36, iops:160000,bw:6.0,  type:"NVMe"  },
  ],
};

const CHASSIS_TYPES = [
  { id:"3.5-12", label:'12 baies 3,5"', slots:12, form:"3.5" },
  { id:"2.5-24", label:'24 baies 2,5"', slots:24, form:"2.5" },
];

const RAID_OPTIONS = [
  { value:"raid1",  label:"RAID 1",  minDisks:2,  effFn: n => 0.5 },
  { value:"raid5",  label:"RAID 5",  minDisks:3,  effFn: n => (n-1)/n },
  { value:"raid6",  label:"RAID 6",  minDisks:4,  effFn: n => (n-2)/n },
  { value:"raid10", label:"RAID 10", minDisks:4,  effFn: n => 0.5 },
  { value:"none",   label:"JBOD",    minDisks:1,  effFn: n => 1 },
];

const TYPE_COLORS = { NLSAS:"#8b90a0", SAS:"#6366f1", SSD:"#3B7EF6", NVMe:"#ff6b35" };

let _gid = 1;
const newGroup = (form) => ({ id:_gid++, diskId:DISK_CATALOG[form][0].id, count:4, raid:"raid6", hotSpares:0 });
let _cid = 1;
const newChassis = (typeId) => {
  const t = CHASSIS_TYPES.find(c=>c.id===typeId);
  return { id:_cid++, typeId, slots:t.slots, form:t.form, groups:[newGroup(t.form)] };
};

function raidEff(raid, n) {
  const opt = RAID_OPTIONS.find(r=>r.value===raid);
  return opt ? opt.effFn(n) : 0;
}



function calcEffectiveIops(rawIops, raid, workloadProfile = "70r30w") {
  const profiles = {
    "80r20w": { read: 0.8, write: 0.2 },
    "70r30w": { read: 0.7, write: 0.3 },
    "50r50w": { read: 0.5, write: 0.5 },
    "20r80w": { read: 0.2, write: 0.8 },
  };

  const penalties = {
    raid1: 2,
    raid10: 2,
    raid5: 4,
    raid6: 6,
    none: 1,
  };

  const p = profiles[workloadProfile] || profiles["70r30w"];
  const penalty = penalties[raid] || 1;

  return rawIops / (p.read + p.write * penalty);
}

function calcGroup(g, catalog, workloadProfile = "70r30w") {
  const disk = catalog.find(d => d.id === g.diskId) || catalog[0];
  const dataDisks = Math.max(0, g.count - g.hotSpares);
  const eff = raidEff(g.raid, dataDisks);

  const rawIops = dataDisks * disk.iops;
  const effectiveIops = calcEffectiveIops(rawIops, g.raid, workloadProfile);

  return {
    disk,
    physical: g.count * disk.cap,
    usable: dataDisks * disk.cap * eff,
    iops: Math.round(effectiveIops),
    bw: dataDisks * disk.bw,
    eff,
  };
}

function StorageCalc({ th, isMobile=false }) {
  const [workloadProfile, setWorkloadProfile] = useState("70r30w");
  const [showCapacityAdvanced, setShowCapacityAdvanced] = useState(true);
  const [chassisList, setChassisList] = useState([newChassis("3.5-12")]);
  const [dedup, setDedup] = useState(1);
  const [iopsTarget,     setIopsTarget]     = useState(1000);
  const [capacityTarget, setCapacityTarget] = useState(10);
  const [storageTab,     setStorageTab]     = useState('classic'); // 'classic' | 'vendor' | 'hci'
  // HCI états
  const [hciVms,         setHciVms]         = useState(100);
  const [hciVcpu,        setHciVcpu]        = useState(4);
  const [hciRam,         setHciRam]         = useState(16);
  const [hciStorage,     setHciStorage]     = useState(200);
  const [hciGrowth,      setHciGrowth]      = useState(20);
  const [hciTargetVcpu, setHciTargetVcpu] = useState(400);
  const [hciTargetRam,  setHciTargetRam]  = useState(1600);
  const [hciTargetStorage, setHciTargetStorage] = useState(20);
  const [hciRf,          setHciRf]          = useState(2);
  const [hciPlatform,    setHciPlatform]    = useState('vsan');
  const [hciNodeCpu,     setHciNodeCpu]     = useState(32);
  const [hciNodeRam,     setHciNodeRam]     = useState(512);
  const [hciNodeDisk,    setHciNodeDisk]    = useState(12);
  const [hciDiskCap,     setHciDiskCap]     = useState(3.84);
  const [hciDedup,       setHciDedup]       = useState(1.5);
  const [hciOverhead,    setHciOverhead]    = useState(25);
  const [hciSolution,    setHciSolution]    = useState("vsan");
  const [hciResil,       setHciResil]       = useState("ftt1r1");
  const [hciDiskId,      setHciDiskId]      = useState("nvme-384");
  const [hciDisksPerNode,setHciDisksPerNode]= useState(8);
  const [hciDedupEn,     setHciDedupEn]     = useState(false);
  const [hciDedupRatio,  setHciDedupRatio]  = useState(2.0);
  const [hciSrcNodes,    setHciSrcNodes]    = useState(3);
  const [hciSrcRamN,     setHciSrcRamN]     = useState(256);
  const [hciSrcCores,    setHciSrcCores]    = useState(32);
  const [hciHaPolicy,    setHciHaPolicy]    = useState(1);
  const [hciNodes,       setHciNodes]       = useState(3);
  const [hciOvercommit,  setHciOvercommit]  = useState(4);
  const [vendorOpen,     setVendorOpen]     = useState(false);
  const [vVendor,        setVVendor]        = useState("dell");
  const [vModel,         setVModel]         = useState("powerstore");
  const [vRaid,          setVRaid]          = useState("dre_sp_8_1");
  const [vOverhead,      setVOverhead]      = useState(12);
  const [vDisks,         setVDisks]         = useState(24);
  const [vDiskCap,       setVDiskCap]       = useState(3.84);
  const [vTarget,        setVTarget]        = useState(50);
  const [vVendorDedup,   setVVendorDedup]   = useState(true);
  const [vDedupRatio,    setVDedupRatio]    = useState(2.5);

  const addChassis = () => setChassisList(p=>[...p, newChassis("3.5-12")]);
  const removeChassis = (cid) => setChassisList(p=>p.filter(c=>c.id!==cid));
  const updateChassisType = (cid, typeId) => {
    const t = CHASSIS_TYPES.find(x=>x.id===typeId);
    setChassisList(p=>p.map(c=>c.id!==cid?c:{...c,typeId,slots:t.slots,form:t.form,groups:[newGroup(t.form)]}));
  };
  const addGroup = (cid) => setChassisList(p=>p.map(c=>{
    if(c.id!==cid) return c;
    const used = c.groups.reduce((s,g)=>s+g.count,0);
    if(used>=c.slots) return c;
    return {...c,groups:[...c.groups,newGroup(c.form)]};
  }));
  const removeGroup = (cid,gid) => setChassisList(p=>p.map(c=>c.id!==cid?c:{...c,groups:c.groups.filter(g=>g.id!==gid)}));
  const updateGroup = (cid,gid,patch) => setChassisList(p=>p.map(c=>c.id!==cid?c:{...c,groups:c.groups.map(g=>g.id===gid?{...g,...patch}:g)}));

  const optimizeStorageDesign = () => {
    const profiles = {
      "80r20w": { read: 0.8, write: 0.2 },
      "70r30w": { read: 0.7, write: 0.3 },
      "50r50w": { read: 0.5, write: 0.5 },
      "20r80w": { read: 0.2, write: 0.8 },
    };

    const p = profiles[workloadProfile] || profiles["70r30w"];
    const targetRaid = "raid6";
    const penalty = 6;
    const workloadFactor = p.read + p.write * penalty;

    setChassisList(prev => prev.map((chassis, ci) => {
      const catalog = DISK_CATALOG[chassis.form];

      const preferredDisk =
        catalog.find(d => d.id === "ssd-384") ||
        catalog.find(d => d.type === "SSD") ||
        catalog[0];

      return {
        ...chassis,
        groups: chassis.groups.map((g, gi) => {
          if (ci !== 0 || gi !== 0) return g;

          const usableTargetRaw = capacityTarget / Math.max(dedup, 1);
          const disksForCapacity = Math.ceil(usableTargetRaw / preferredDisk.cap) + 2;
          const disksForIops = Math.ceil((iopsTarget * workloadFactor) / preferredDisk.iops);

          const recommendedCount = Math.min(
            chassis.slots,
            Math.max(4, disksForCapacity, disksForIops)
          );

          return {
            ...g,
            diskId: preferredDisk.id,
            raid: targetRaid,
            hotSpares: 0,
            count: recommendedCount,
          };
        })
      };
    }));
  };


  const totals = useMemo(()=>{
    let physical=0,usable=0,iops=0,bw=0;
    chassisList.forEach(c=>{
      const catalog=DISK_CATALOG[c.form];
      c.groups.forEach(g=>{
        const r=calcGroup(g,catalog,workloadProfile);
        physical+=r.physical; usable+=r.usable; iops+=r.iops; bw+=r.bw;
      });
    });
    const effective = usable * dedup;
    let totalSlots=0, usedSlots=0;
    chassisList.forEach(c=>{totalSlots+=c.slots;usedSlots+=c.groups.reduce((s,g)=>s+g.count,0);});
    const freeSlots=totalSlots-usedSlots;
    const capOk=effective>=capacityTarget;
    const capDelta=effective-capacityTarget;
    const iopsDelta=iops-iopsTarget;
    return { physical, usable, effective, iops, bw, iopsOk:iops>=iopsTarget,
             freeSlots, totalSlots, usedSlots, capOk, capDelta, iopsDelta };
  },[chassisList,dedup,iopsTarget,capacityTarget,workloadProfile]);

  // Recommandations automatiques
  const recommendations = useMemo(()=>{
    const recs = [];
    if(dedup<2) {
      const gain = totals.usable * 2 - totals.usable;
      recs.push({ ok:true, text:`Un ratio dédup/compression ×2 permettrait de gagner +${fmt(gain,1)} To effectifs` });
    }
    chassisList.forEach((c,ci)=>{
      const catalog=DISK_CATALOG[c.form];
      c.groups.forEach(g=>{
        const disk=catalog.find(d=>d.id===g.diskId)||catalog[0];
        if(g.raid==="raid6" && g.count>=6) {
          const r5eff = raidEff("raid5", g.count-g.hotSpares);
          const r6eff = raidEff("raid6", g.count-g.hotSpares);
          const gain = (r5eff-r6eff)*g.count*disk.cap;
          recs.push({ ok:true, text:`Chassis ${ci+1} Groupe — RAID 5 offrirait +${fmt(gain,1)} To utiles (+${fmt((gain/((g.count-g.hotSpares)*disk.cap*r6eff))*100,0)}%) avec moins de protection` });
        }
        if(!totals.iopsOk && disk.type==="NLSAS") {
          recs.push({ ok:false, text:`Chassis ${ci+1} — Remplacer les NLSAS par des SSD multiplierait les IOPS par ~400` });
        }
        if(g.hotSpares===0 && g.count>=4) {
          recs.push({ ok:true, text:`Chassis ${ci+1} — Ajouter 1 hot spare protège contre une défaillance matérielle hors RAID` });
        }
      });
    });
    if(!totals.iopsOk) {
      recs.unshift({ ok:false, text:`IOPS insuffisants (${fmt(totals.iops)} / ${fmt(iopsTarget)} requis) — augmenter le nombre de disques ou changer de média` });
    }
    return recs.slice(0,4);
  },[chassisList,dedup,iopsTarget,totals,workloadProfile]);

  const tt = { background:th.tooltipBg, border:`1px solid ${th.border2}`, borderRadius:4, fontSize:11, color:th.t1 };

  const s = {
    card: (accent) => ({ background:th.cardBg, borderTop:`1px solid ${th.border}`,borderRight:`1px solid ${th.border}`,borderBottom:`1px solid ${th.border}`,borderLeft:accent?`2px solid ${accent}`:`1px solid ${th.border}`, borderRadius:6, padding:16, marginBottom:14 }),
    groupRow: { background:th.bg2, border:`1px solid ${th.border}`, borderRadius:4, padding:"10px 14px", marginBottom:8 },
    label: { display:"block", fontSize:10, color:th.t3, fontFamily:"Inter, sans-serif", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 },
    input: { width:"100%", background:th.bg1, border:`1px solid ${th.border}`, borderRadius:4, padding:"6px 8px", color:th.t1, fontFamily:"Inter, sans-serif", fontSize:12, boxSizing:"border-box" },
    select: { width:"100%", background:th.bg1, border:`1px solid ${th.border}`, borderRadius:4, padding:"6px 8px", color:th.t1, fontFamily:"Inter, sans-serif", fontSize:12, boxSizing:"border-box" },
    btn: (color) => ({ cursor:"pointer", fontSize:11, padding:"5px 12px", borderRadius:4, border:`1px solid ${color}44`, background:`${color}11`, color, fontFamily:"Inter, sans-serif" }),
    btnSm: (color) => ({ cursor:"pointer", fontSize:10, padding:"3px 8px", borderRadius:3, border:`1px solid ${color}44`, background:`${color}11`, color, fontFamily:"Inter, sans-serif" }),
    secTitle: { fontSize:10, fontWeight:600, color:th.t2, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12, paddingBottom:8, borderBottom:`1px solid ${th.border}`, fontFamily:"Inter, sans-serif" },
    tag: (color) => ({ display:"inline-block", fontSize:9, padding:"2px 6px", borderRadius:3, background:`${color}22`, color, border:`1px solid ${color}44`, fontFamily:"Inter, sans-serif", marginLeft:6 }),
    divider: { border:"none", borderTop:`1px solid ${th.border}`, margin:"12px 0" },
    miniVal: (color) => ({ fontSize:13, fontWeight:600, fontFamily:"Inter, sans-serif", color:color||th.t1 }),
  };

  return (
    <div>
      {/* Onglets */}
      <div style={{display:"flex",gap:2,marginBottom:16,borderBottom:`2px solid ${th.border}`}}>
        {[
          {id:"classic",  label:"Classic",      icon:"🗄️"},
          {id:"vendor",   label:"Constructeur", icon:"🏭"},
          {id:"hci",      label:"HCI",          icon:"🔲"},
        ].map(tab=>(
          <button key={tab.id} onClick={()=>setStorageTab(tab.id)} style={{
            cursor:"pointer", border:"none", background:"none",
            padding:"8px 18px", fontSize:12, fontFamily:"Inter, sans-serif", fontWeight:600,
            color:storageTab===tab.id?th.accent:th.t3,
            borderBottom:storageTab===tab.id?`2px solid ${th.accent}`:"2px solid transparent",
            marginBottom:-2, transition:"all 0.15s",
            textTransform:"uppercase", letterSpacing:"0.08em",
          }}>{tab.icon} {tab.label}</button>
        ))}
      </div>

      {storageTab==="classic"&&(()=>{
        const capPct = capacityTarget > 0 ? Math.min(100, Math.round((totals.usable / capacityTarget) * 100)) : 100;
        const effPct = capacityTarget > 0 ? Math.min(100, Math.round((totals.effective / capacityTarget) * 100)) : 100;
        const iopsPct = iopsTarget > 0 && Number.isFinite(totals.iops) ? Math.min(100, Math.round((totals.iops / iopsTarget) * 100)) : 0;
        const bwTarget = 2;
        const bwPct = bwTarget > 0 ? Math.min(100, Math.round((totals.bw / bwTarget) * 100)) : 100;
        const globalKo = !totals.capOk || !totals.iopsOk;

        const statusTitle = !totals.capOk && !totals.iopsOk
          ? "Capacité & IOPS insuffisants"
          : !totals.capOk
          ? "Capacité insuffisante"
          : !totals.iopsOk
          ? "IOPS insuffisants"
          : "Design stockage cohérent";

        const mainReco = !totals.capOk && !totals.iopsOk
          ? "Ajouter des disques SSD/NVMe ou augmenter le nombre de spindles"
          : !totals.capOk
          ? "Augmenter la capacité utile ou améliorer le ratio de réduction"
          : !totals.iopsOk
          ? "Passer sur SSD/NVMe ou augmenter le nombre de disques"
          : "Conserver le design et valider la croissance";

        const Progress = ({pct,color}) => (
          <div style={{height:10,background:th.bg2,borderRadius:999,overflow:"hidden",border:`1px solid ${th.border}`}}>
            <div style={{height:"100%",width:Math.min(100,Math.max(0,pct))+"%",background:color,borderRadius:999}}/>
          </div>
        );

        const ObjectiveRow = ({label,current,target,pct,color,unit}) => (
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"150px 1fr 70px",gap:12,alignItems:"center",padding:"9px 0"}}>
            <div style={{fontSize:12,color:th.t2,lineHeight:1.4}}>{label}</div>
            <div>
              <div style={{height:26,position:"relative"}}>
                <div style={{position:"absolute",left:0,right:0,top:8,height:10,borderRadius:999,border:`1px dashed ${th.t3}`,opacity:.7}}/>
                <div style={{position:"absolute",left:0,top:8,height:10,width:pct+"%",background:color,borderRadius:999}}/>
                <div style={{position:"absolute",left:`calc(${pct}% - 26px)`,top:2,fontSize:11,fontWeight:800,color:"#fff",background:color,borderRadius:6,padding:"2px 7px",fontFamily:"Inter, sans-serif"}}>
                  {current}
                </div>
              </div>
            </div>
            <div style={{fontSize:12,color:th.t2,lineHeight:1.4,fontFamily:"Inter, sans-serif",textAlign:"right"}}>{target} {unit}</div>
          </div>
        );

        const Kpi = ({label,value,sub,pct,color,icon}) => (
          <div style={{
            background:`linear-gradient(135deg, ${color}18, ${color}08)`,
            border:`1px solid ${color}35`,
            borderRadius:14,
            padding:"16px 18px",
            boxShadow:SHADOW.card
          }}>
            <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start",marginBottom:10}}>
              <div>
                <div style={{fontSize:11,color:color,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:800,marginBottom:6}}>
                  {label}
                </div>
                <div style={{fontSize:28,fontWeight:900,color:color,letterSpacing:"-0.02em",fontFamily:"Inter, sans-serif"}}>
                  {value}
                </div>
                <div style={{fontSize:12,color:th.t2,lineHeight:1.4,marginTop:4}}>
                  {sub}
                </div>
              </div>
              <div style={{
                width:44,height:44,borderRadius:999,
                display:"flex",alignItems:"center",justifyContent:"center",
                background:`${color}18`,color
              }}>
                {icon}
              </div>
            </div>
            <Progress pct={pct} color={color}/>
            <div style={{fontSize:11,color:th.t2,marginTop:8}}>
              {pct}% de l’objectif
            </div>
          </div>
        );

        return (
          <div>
            {/* Hero décisionnel */}
            <div style={{
              display:"grid",
              gridTemplateColumns:isMobile?"1fr":"1.4fr 1fr",
              gap:16,
              alignItems:"center",
              background:globalKo?"rgba(255,85,85,0.06)":"rgba(59,126,246,0.06)",
              border:`1px solid ${globalKo?"rgba(255,85,85,0.22)":"rgba(59,126,246,0.22)"}`,
              borderRadius:18,
              padding:"22px 26px",
              marginBottom:18,
              boxShadow:SHADOW.card
            }}>
              <div style={{display:"flex",gap:18,alignItems:"center"}}>
                <div style={{
                  width:58,height:58,borderRadius:999,
                  background:globalKo?"#ef4444":th.accent,
                  color:"#fff",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:30,fontWeight:900,
                  boxShadow:"0 12px 30px rgba(0,0,0,0.12)"
                }}>
                  {globalKo ? "!" : "✓"}
                </div>
                <div>
                  <div style={{
                    fontSize:22,
                    fontWeight:900,
                    color:globalKo?th.danger:th.accent,
                    textTransform:"uppercase"
                  }}>
                    {statusTitle}
                  </div>
                  <div style={{fontSize:13,color:th.t2,marginTop:6,lineHeight:1.5}}>
                    La configuration actuelle est évaluée selon la capacité utile, la capacité effective, les IOPS et la bande passante.
                  </div>
                </div>
              </div>

              <div style={{
                background:th.cardBg,
                border:`1px solid ${th.border}`,
                borderRadius:12,
                padding:"14px 16px"
              }}>
                <div style={{fontSize:11,color:th.t3,textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:"Inter, sans-serif",marginBottom:8}}>
                  Recommandation principale
                </div>
                <div style={{fontSize:14,fontWeight:800,color:th.t1,lineHeight:1.45}}>
                  {mainReco}
                </div>
              </div>
            </div>

            {/* KPI visuels */}
            <div style={{
              display:"grid",
              gridTemplateColumns:isMobile?"1fr":"repeat(4,1fr)",
              gap:14,
              marginBottom:18
            }}>
              <Kpi label="Capacité utile après RAID" value={fmt(totals.usable,1)+" To"} sub={"Après RAID · "+fmt(totals.freeSlots)+" slots libres"} pct={capPct} color={th.accent} icon={<HardDrive size={22}/>} />
              <Kpi label="Capacité effective" value={fmt(totals.effective,1)+" To"} sub={"Déduplication ×"+dedup} pct={effPct} color={th.accent2} icon={<Database size={22}/>} />
              <Kpi label="IOPS agrégés" value={fmt(totals.iops)} sub={"Cible : "+fmt(iopsTarget)+" IOPS"} pct={iopsPct} color={totals.iopsOk?th.accent:th.danger} icon={<BarChart2 size={22}/>} />
              <Kpi label="Bande passante totale" value={fmt(totals.bw,1)+" GB/s"} sub={"Référence : "+bwTarget+" GB/s"} pct={bwPct} color="#7c3aed" icon={<Network size={22}/>} />
            </div>

            {/* Configuration avancée châssis / disques */}
            <div style={{
              background:th.cardBg,
              border:`1px solid ${th.border}`,
              borderRadius:14,
              padding:"16px 20px",
              boxShadow:SHADOW.card,
              marginBottom:18
            }}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:showCapacityAdvanced?16:0}}>
                <div>
                  <div style={{fontSize:12,fontWeight:900,color:th.t1,textTransform:"uppercase",letterSpacing:"0.04em"}}>
                    Configuration avancée
                  </div>
                  <div style={{fontSize:12,color:th.t2,lineHeight:1.4,marginTop:4}}>
                    Ajustement des châssis, groupes de disques, RAID et hot spares
                  </div>
                </div>

                <button
                  onClick={()=>setShowCapacityAdvanced(v=>!v)}
                  style={{
                    cursor:"pointer",
                    border:`1px solid ${th.border}`,
                    background:th.bg2,
                    color:th.t2,
                    borderRadius:10,
                    padding:"8px 12px",
                    fontSize:12,
                    fontWeight:700
                  }}
                >
                  {showCapacityAdvanced ? "Masquer" : "Afficher"}
                </button>
              </div>

              {showCapacityAdvanced && (
                <div style={{display:"grid",gap:14}}>
                  <div style={{
                    background:th.bg2,
                    border:`1px solid ${th.border}`,
                    borderRadius:12,
                    padding:"14px 16px"
                  }}>
                    <div style={{
                      fontSize:12,
                      fontWeight:900,
                      color:th.t1,
                      textTransform:"uppercase",
                      letterSpacing:"0.04em",
                      marginBottom:12
                    }}>
                      Paramètres de design globaux
                    </div>

                    <div style={{
                      display:"grid",
                      gridTemplateColumns:isMobile?"1fr":"repeat(4,1fr)",
                      gap:12
                    }}>
                      <div>
                        <label style={s.label}>Profil workload</label>
                        <select value={workloadProfile} onChange={e=>setWorkloadProfile(e.target.value)} style={s.select}>
                          <option value="80r20w">80% read / 20% write</option>
                          <option value="70r30w">70% read / 30% write</option>
                          <option value="50r50w">50% read / 50% write</option>
                          <option value="20r80w">20% read / 80% write</option>
                        </select>
                      </div>

                      <div>
                        <label style={s.label}>IOPS cible</label>
                        <input
                          type="number"
                          min={1000}
                          step={5000}
                          value={iopsTarget}
                          onChange={e=>setIopsTarget(Number(e.target.value))}
                          style={s.input}
                        />
                      </div>

                      <div>
                        <label style={s.label}>Déduplication / Compression</label>
                        <select value={String(dedup)} onChange={e=>setDedup(Number(e.target.value))} style={s.select}>
                          {[["1","1:1 — aucune"],["1.5","1.5:1 — légère"],["2","2:1 — standard"],["3","3:1 — agressive"],["4","4:1 — maximale"],["5","5:1 — extrême"]].map(([v,l])=>
                            <option key={v} value={v}>{l}</option>)}
                        </select>
                      </div>

                      <div>
                        <label style={s.label}>Capacité cible utile</label>
                        <input
                          type="number"
                          min={1}
                          step={10}
                          value={capacityTarget}
                          onChange={e=>setCapacityTarget(Number(e.target.value))}
                          style={s.input}
                        />
                      </div>
                    </div>

                    <div style={{
                      marginTop:12,
                      padding:"9px 11px",
                      borderRadius:10,
                      background:"rgba(99,102,241,0.06)",
                      border:"1px solid rgba(99,102,241,0.18)",
                      fontSize:11,
                      color:th.t2,
                      lineHeight:1.45
                    }}>
                      <strong style={{color:th.accent2}}>Note avant-vente :</strong> les IOPS et la capacité cible doivent idéalement provenir d’un audit RVTools, LiveOptics, de métriques baie ou d’une hypothèse validée avec le client.
                    </div>
                  </div>
                  {chassisList.map((chassis,ci)=>{
                    const catalog=DISK_CATALOG[chassis.form];
                    const usedSlots=chassis.groups.reduce((s,g)=>s+g.count,0);
                    const remain=chassis.slots-usedSlots;

                    return (
                      <div key={chassis.id} style={{
                        background:th.bg2,
                        border:`1px solid ${th.border}`,
                        borderLeft:`3px solid ${th.accent}`,
                        borderRadius:12,
                        padding:"14px 16px"
                      }}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:12}}>
                          <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                            <strong style={{fontSize:13,color:th.t1}}>Châssis {ci+1}</strong>

                            <select value={chassis.typeId} onChange={e=>updateChassisType(chassis.id,e.target.value)} style={{...s.select,width:"auto"}}>
                              {CHASSIS_TYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
                            </select>

                            <span style={{
                              fontSize:11,
                              color:remain<0?th.danger:th.t2,
                              fontFamily:"Inter, sans-serif",
                              background:th.cardBg,
                              border:`1px solid ${th.border}`,
                              borderRadius:999,
                              padding:"4px 8px"
                            }}>
                              {usedSlots}/{chassis.slots} baies
                            </span>
                          </div>

                          <div style={{display:"flex",gap:8}}>
                            <button onClick={()=>addGroup(chassis.id)} style={s.btnSm(th.accent)}>+ Groupe</button>
                            {chassisList.length>1 && (
                              <button onClick={()=>removeChassis(chassis.id)} style={s.btnSm(th.danger)}>Supprimer</button>
                            )}
                          </div>
                        </div>

                        <div style={{display:"grid",gap:10}}>
                          {chassis.groups.map((group,gi)=>{
                            const disk=catalog.find(d=>d.id===group.diskId)||catalog[0];
                            const gr=calcGroup(group,catalog,workloadProfile);

                            return (
                              <div key={group.id} style={{
                                background:th.cardBg,
                                border:`1px solid ${th.border}`,
                                borderRadius:10,
                                padding:"12px 14px"
                              }}>
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:10}}>
                                  <div style={{fontSize:12,fontWeight:800,color:th.t1}}>
                                    Groupe {gi+1}
                                    <span style={{marginLeft:8,fontSize:10,color:TYPE_COLORS[disk.type]||th.t2}}>
                                      {disk.type}
                                    </span>
                                  </div>

                                  {chassis.groups.length>1 && (
                                    <button onClick={()=>removeGroup(chassis.id,group.id)} style={s.btnSm(th.danger)}>✕</button>
                                  )}
                                </div>

                                <div style={{
                                  display:"grid",
                                  gridTemplateColumns:isMobile?"1fr":"2fr 1fr 1fr 1fr",
                                  gap:10,
                                  marginBottom:10
                                }}>
                                  <div>
                                    <label style={s.label}>Type de disque</label>
                                    <select value={group.diskId} onChange={e=>updateGroup(chassis.id,group.id,{diskId:e.target.value})} style={s.select}>
                                      {catalog.map(d=><option key={d.id} value={d.id}>{d.label}</option>)}
                                    </select>
                                  </div>

                                  <div>
                                    <label style={s.label}>Nb disques</label>
                                    <input type="number" min={1} max={chassis.slots} value={group.count}
                                      onChange={e=>updateGroup(chassis.id,group.id,{count:Math.max(1,Number(e.target.value))})}
                                      style={s.input}
                                    />
                                  </div>

                                  <div>
                                    <label style={s.label}>RAID</label>
                                    <select value={group.raid} onChange={e=>updateGroup(chassis.id,group.id,{raid:e.target.value})} style={s.select}>
                                      {RAID_OPTIONS.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
                                    </select>
                                  </div>

                                  <div>
                                    <label style={s.label}>Hot spares</label>
                                    <input type="number" min={0} max={Math.max(0,group.count-1)} value={group.hotSpares}
                                      onChange={e=>updateGroup(chassis.id,group.id,{hotSpares:Math.max(0,Number(e.target.value))})}
                                      style={s.input}
                                    />
                                  </div>
                                </div>

                                <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:8}}>
                                  {[
                                    ["Utile", fmt(gr.usable,1)+" To", th.accent],
                                    ["IOPS", fmt(gr.iops), totals.iopsOk?th.accent:th.danger],
                                    ["BW", fmt(gr.bw,1)+" GB/s", "#7c3aed"],
                                    ["Brut", fmt(gr.physical,1)+" To", th.t1],
                                  ].map(([label,val,color])=>(
                                    <div key={label} style={{
                                      background:th.bg2,
                                      border:`1px solid ${th.border}`,
                                      borderRadius:8,
                                      padding:"8px 10px"
                                    }}>
                                      <div style={{fontSize:10,color:th.t3,textTransform:"uppercase",letterSpacing:"0.06em"}}>{label}</div>
                                      <div style={{fontSize:15,fontWeight:900,color,fontFamily:"Inter, sans-serif",marginTop:3}}>{val}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Résumé châssis compact */}
            <div style={{background:th.cardBg,border:`1px solid ${th.border}`,borderRadius:14,padding:"16px 20px",boxShadow:SHADOW.card,marginBottom:18}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
                <div>
                  <div style={{fontSize:12,fontWeight:900,color:th.t1,textTransform:"uppercase",letterSpacing:"0.04em"}}>
                    Résumé du châssis
                  </div>
                  <div style={{fontSize:12,color:th.t2,lineHeight:1.4,marginTop:4}}>
                    {chassisList.length} châssis · {fmt(totals.usedSlots)} disques utilisés · {fmt(totals.freeSlots)} slots libres
                  </div>
                </div>
                <button onClick={addChassis} style={s.btnSm(th.accent)}>+ Ajouter un châssis</button>
              </div>

              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(6,1fr)",gap:10,marginTop:14}}>
                {[
                  ["Disques", fmt(totals.usedSlots), th.t1],
                  ["Utile", fmt(totals.usable,1)+" To", th.accent],
                  ["Effectif", fmt(totals.effective,1)+" To", th.accent2],
                  ["IOPS", fmt(totals.iops), totals.iopsOk?th.accent:th.danger],
                  ["BW", fmt(totals.bw,1)+" GB/s", "#7c3aed"],
                  ["Slots libres", fmt(totals.freeSlots), th.t1],
                ].map(([label,val,color])=>(
                  <div key={label} style={{background:th.bg2,border:`1px solid ${th.border}`,borderRadius:10,padding:"10px 12px"}}>
                    <div style={{fontSize:10,color:th.t3,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>{label}</div>
                    <div style={{fontSize:18,fontWeight:900,color,fontFamily:"Inter, sans-serif"}}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommandations */}
            <div style={{
              background:th.cardBg,
              border:`1px solid ${th.border}`,
              borderRadius:14,
              padding:"18px 20px",
              boxShadow:SHADOW.card,
              marginBottom:18
            }}>
              <div style={{
                display:"flex",
                justifyContent:"space-between",
                alignItems:"center",
                gap:12,
                marginBottom:14
              }}>
                <div>
                  <div style={{
                    fontSize:12,
                    fontWeight:900,
                    color:th.t1,
                    textTransform:"uppercase",
                    letterSpacing:"0.04em"
                  }}>
                    Recommandations
                  </div>
                  <div style={{fontSize:12,color:th.t2,lineHeight:1.4,marginTop:4}}>
                    Actions proposées selon les objectifs de capacité, IOPS et résilience.
                  </div>
                </div>

                <button
                  onClick={optimizeStorageDesign}
                  style={{
                    cursor:"pointer",
                    border:"none",
                    background:th.accent,
                    color:"#fff",
                    borderRadius:10,
                    padding:"10px 14px",
                    fontSize:13,
                    fontWeight:800
                  }}
                >
                  ⚡ Optimiser automatiquement
                </button>
              </div>

              <div style={{
                display:"grid",
                gridTemplateColumns:isMobile?"1fr":"1fr 1fr",
                gap:10
              }}>
                {recommendations.map((rec,i)=>(
                  <div key={i} style={{
                    display:"flex",
                    gap:10,
                    alignItems:"flex-start",
                    padding:"10px 12px",
                    borderRadius:10,
                    background:rec.ok?"rgba(59,126,246,0.06)":"rgba(255,181,71,0.08)",
                    border:`1px solid ${rec.ok?"rgba(59,126,246,0.18)":"rgba(255,181,71,0.24)"}`
                  }}>
                    <span style={{
                      width:24,
                      height:24,
                      borderRadius:999,
                      display:"flex",
                      alignItems:"center",
                      justifyContent:"center",
                      background:rec.ok?"rgba(59,126,246,0.12)":"rgba(255,181,71,0.14)",
                      color:rec.ok?th.accent:th.warn,
                      flexShrink:0,
                      fontWeight:900
                    }}>
                      {rec.ok?"✓":"!"}
                    </span>
                    <span style={{fontSize:12,color:th.t2,lineHeight:1.4,lineHeight:1.5}}>{rec.text}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        );
      })()}

      {storageTab==="vendor"&&(()=>{
        const VENDORS = {
          dell: {
            label:"Dell", color:"#2563eb",
            models: {
              powerstore: {
                label:"PowerStore",
                protection:"DRE (Dynamic Resilience Engine)",
                overheadMin:10, overheadMax:15, overheadDefault:12,
                hasDedup:true, dedupDefault:2.5,
                raids:[
                  {id:"dre_sp_8_1",label:"DRE SP — 8+1",dataDisks:8,parityDisks:1,spareDisks:1},
                  {id:"dre_dp_8_2",label:"DRE DP — 8+2",dataDisks:8,parityDisks:2,spareDisks:1},
                  {id:"dre_dp_16_2",label:"DRE DP — 16+2",dataDisks:16,parityDisks:2,spareDisks:1},
                ],
                note:"Formule Dell officielle KB000188491."
              },
              powervault: {
                label:"PowerVault",
                protection:"RAID Adapt",
                overheadMin:15, overheadMax:20, overheadDefault:17,
                hasDedup:false, dedupDefault:1.0,
                raids:[{id:"adapt",label:"RAID Adapt",factor:0.17}],
                note:"RAID Adapt dynamique. Pas de déduplication native."
              },
            }
          },
          hpe: {
            label:"HPE", color:"#059669",
            models: {
              alletra: {
                label:"Alletra / Primera",
                protection:"RAID 6 double parité",
                overheadMin:25, overheadMax:30, overheadDefault:27,
                hasDedup:true, dedupDefault:3.0,
                raids:[{id:"r6",label:"RAID 6 (6+2)",factor:2/8},{id:"r6_4",label:"RAID 6 (4+2)",factor:2/6}],
                note:"Déduplication / compression inline."
              },
              nimble: {
                label:"Nimble",
                protection:"RAID triple parité",
                overheadMin:25, overheadMax:30, overheadDefault:27,
                hasDedup:true, dedupDefault:3.5,
                raids:[{id:"r6tp",label:"RAID triple parité",factor:3/9}],
                note:"Architecture CASL, réduction de données efficace."
              },
              msa: {
                label:"MSA",
                protection:"RAID DP+",
                overheadMin:25, overheadMax:25, overheadDefault:25,
                hasDedup:false, dedupDefault:1.0,
                raids:[{id:"rdp",label:"RAID DP+",factor:2/8}],
                note:"Solution entrée de gamme. Pas de déduplication native."
              },
            }
          },
          huawei: {
            label:"Huawei", color:"#dc2626",
            models: {
              dorado: {
                label:"OceanStor Dorado",
                protection:"RAID-TP triple parité",
                overheadMin:20, overheadMax:30, overheadDefault:20,
                hasDedup:true, dedupDefault:3.0,
                raids:[{id:"raidtp",label:"RAID-TP",factor:0}],
                note:"RAID-TP : résistance à 3 pannes simultanées."
              },
              pacific: {
                label:"OceanStor Pacific",
                protection:"Erasure Coding",
                overheadMin:20, overheadMax:33, overheadDefault:25,
                hasDedup:true, dedupDefault:2.0,
                raids:[
                  {id:"ec42",label:"EC 4+2",factor:2/6},
                  {id:"ec82",label:"EC 8+2",factor:2/10},
                  {id:"ec122",label:"EC 12+2",factor:2/14},
                ],
                note:"Erasure Coding configurable pour gros volumes."
              },
            }
          },
        };

        const vendor = VENDORS[vVendor];
        const model = vendor?.models[vModel];
        const raid = model?.raids.find(r=>r.id===vRaid) || model?.raids[0];

        const rawTB = vDisks * vDiskCap;
        const overheadF = vOverhead / 100;

        let usable = 0;
        let pipelineRaidLabel = raid?.label || "Protection";

        if(raid?.dataDisks && raid?.parityDisks) {
          const groupSize = raid.dataDisks + raid.parityDisks;
          const nbGroups = Math.floor(vDisks / groupSize);
          const dreRaw = nbGroups * raid.dataDisks * vDiskCap;
          usable = dreRaw * (1 - overheadF);
        } else {
          usable = rawTB * (1 - overheadF) * (1 - (raid?.factor || 0));
        }

        if(model?.label === "OceanStor Dorado") {
          usable = rawTB * (1 - overheadF);
        }

        const effective = (model?.hasDedup && vVendorDedup) ? usable * vDedupRatio : usable;
        const margin = effective - vTarget;
        const marginPct = vTarget > 0 ? Math.round((margin / vTarget) * 100) : 0;
        const usedPct = effective > 0 ? Math.round((vTarget / effective) * 100) : 0;
        const ok = effective >= vTarget;

        const statusTitle = ok ? "Design validé constructeur" : "Dimensionnement insuffisant";
        const statusText = ok
          ? "Le dimensionnement couvre les objectifs de capacité."
          : "La capacité effective ne couvre pas la cible définie.";

        const recommendation = ok
          ? marginPct > 50
            ? "Le design couvre largement la cible. Une optimisation peut réduire le surdimensionnement."
            : "Le design est cohérent. Conserver la configuration et valider la croissance."
          : "Augmenter le nombre de disques, la capacité unitaire ou le ratio de réduction.";

        const vendorColor = vendor?.color || th.accent;

        const Kpi = ({label,value,sub,color,extra}) => (
          <div style={{
            background:`${color}10`,
            border:`1px solid ${color}30`,
            borderRadius:14,
            padding:"16px 18px",
            boxShadow:SHADOW.card
          }}>
            <div style={{fontSize:11,color,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:800,marginBottom:6}}>
              {label}
            </div>
            <div style={{fontSize:26,fontWeight:900,color,fontFamily:"Inter, sans-serif"}}>
              {value}
            </div>
            <div style={{fontSize:12,color:th.t2,marginTop:4}}>
              {sub}
            </div>
            {extra}
          </div>
        );

        const ResultLine = ({label,value,color=th.t1,sub}) => (
          <div style={{display:"flex",justifyContent:"space-between",gap:14,padding:"10px 0",borderBottom:`1px solid ${th.border}`}}>
            <div>
              <div style={{fontSize:12,color:th.t2}}>{label}</div>
              {sub && <div style={{fontSize:11,color:th.t3,marginTop:2}}>{sub}</div>}
            </div>
            <strong style={{fontSize:13,color,fontFamily:"Inter, sans-serif",whiteSpace:"nowrap"}}>{value}</strong>
          </div>
        );

        return (
          <div>
            {/* Hero constructeur */}
            <div style={{
              display:"grid",
              gridTemplateColumns:isMobile?"1fr":"1.4fr 1fr",
              gap:16,
              alignItems:"center",
              background:ok?"rgba(59,126,246,0.06)":"rgba(255,181,71,0.08)",
              border:`1px solid ${ok?"rgba(59,126,246,0.22)":"rgba(255,181,71,0.25)"}`,
              borderRadius:16,
              padding:"18px 22px",
              marginBottom:18,
              boxShadow:SHADOW.card
            }}>
              <div style={{display:"flex",gap:18,alignItems:"center"}}>
                <div style={{
                  width:64,height:64,borderRadius:999,
                  background:ok?th.accent:th.warn,
                  color:"#fff",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:36,fontWeight:900
                }}>
                  {ok ? "✓" : "!"}
                </div>
                <div>
                  <div style={{fontSize:22,fontWeight:900,color:ok?th.accent:th.warn}}>
                    {statusTitle}
                  </div>
                  <div style={{fontSize:13,color:th.t2,marginTop:6,lineHeight:1.5}}>
                    {statusText}
                  </div>
                  <div style={{fontSize:13,color:ok?th.accent:th.warn,marginTop:10,fontWeight:800}}>
                    {ok ? "Marge disponible : +" + fmt(margin,2) + " TB (" + marginPct + "% au-dessus de la cible)" : "Déficit : " + fmt(Math.abs(margin),2) + " TB"}
                  </div>
                </div>
              </div>

              <div style={{background:th.cardBg,border:`1px solid ${th.border}`,borderRadius:12,padding:"14px 16px"}}>
                <div style={{fontSize:11,color:th.t3,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>
                  Recommandation
                </div>
                <div style={{fontSize:13,color:th.t1,lineHeight:1.55,fontWeight:700}}>
                  {recommendation}
                </div>
                <button
                  onClick={()=>{
                    const targetRaw = vTarget / ((model?.hasDedup && vVendorDedup) ? vDedupRatio : 1);
                    const required = Math.ceil((targetRaw / Math.max(0.1, vDiskCap)) * 1.35);
                    setVDisks(Math.max(4, required));
                  }}
                  style={{
                    marginTop:12,
                    cursor:"pointer",
                    border:`1px solid ${th.border2}`,
                    background:`${th.accent}12`,
                    color:th.accent,
                    borderRadius:10,
                    padding:"9px 12px",
                    fontSize:12,
                    fontWeight:800
                  }}
                >
                  Optimiser le design
                </button>
              </div>
            </div>

            {/* KPIs */}
            <div style={{
              display:"grid",
              gridTemplateColumns:isMobile?"1fr":"repeat(4,1fr)",
              gap:12,
              marginBottom:16
            }}>
              <Kpi label="Capacité physique" value={fmt(rawTB,1)+" TB"} sub={vDisks+" disques × "+vDiskCap+" TB"} color={th.accent2}/>
              <Kpi label="Capacité utile" value={fmt(usable,1)+" TB"} sub={"Après overhead "+vOverhead+"% + RAID"} color="#6d4fc2"/>
              <Kpi label="Capacité effective" value={fmt(effective,1)+" TB"} sub={(model?.hasDedup&&vVendorDedup)?"Dédup ×"+vDedupRatio:"Sans dédup"} color={th.accent}/>
              <Kpi
                label="Objectif atteint"
                value={ok?"✓ Oui":"✗ Non"}
                sub={"Cible : "+fmt(vTarget,0)+" TB"}
                color={ok?th.accent:th.danger}
                extra={ok && <div style={{marginTop:10,fontSize:12,fontWeight:900,color:th.accent}}>+{fmt(margin,1)} TB de marge</div>}
              />
            </div>

            {/* Sélecteurs constructeur */}
            <div style={{
              background:th.cardBg,
              border:`1px solid ${th.border}`,
              borderRadius:14,
              padding:"16px 18px",
              boxShadow:SHADOW.card,
              marginBottom:16
            }}>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(4,1fr)",gap:14}}>
                <div>
                  <label style={s.label}>Constructeur</label>
                  <select value={vVendor} onChange={e=>{
                    setVVendor(e.target.value);
                    const first=Object.keys(VENDORS[e.target.value].models)[0];
                    const m=VENDORS[e.target.value].models[first];
                    setVModel(first); setVRaid(m.raids[0].id); setVOverhead(m.overheadDefault);
                    setVDedupRatio(m.dedupDefault); setVVendorDedup(m.hasDedup);
                  }} style={s.select}>
                    {Object.entries(VENDORS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>

                <div>
                  <label style={s.label}>Modèle de baie</label>
                  <select value={vModel} onChange={e=>{
                    const m=vendor.models[e.target.value];
                    setVModel(e.target.value); setVRaid(m.raids[0].id); setVOverhead(m.overheadDefault);
                    setVDedupRatio(m.dedupDefault); setVVendorDedup(m.hasDedup);
                  }} style={s.select}>
                    {Object.entries(vendor.models).map(([k,m])=><option key={k} value={k}>{m.label}</option>)}
                  </select>
                </div>

                <div>
                  <label style={s.label}>Protection RAID</label>
                  <select value={vRaid} onChange={e=>setVRaid(e.target.value)} style={s.select}>
                    {model?.raids.map(r=><option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                </div>

                <div>
                  <label style={s.label}>Overhead système (%)</label>
                  <input type="number" min={model?.overheadMin||0} max={model?.overheadMax||40} value={vOverhead} onChange={e=>setVOverhead(Number(e.target.value))} style={s.input}/>
                  <div style={{fontSize:10,color:th.t3,marginTop:4}}>Min {model?.overheadMin}% — Max {model?.overheadMax}%</div>
                </div>
              </div>
            </div>

            {/* 3 colonnes principales */}
            <div style={{
              display:"grid",
              gridTemplateColumns:isMobile?"1fr":"1fr 1.25fr 1fr",
              gap:16,
              marginBottom:16
            }}>
              {/* Configuration */}
              <div style={{background:th.cardBg,border:`1px solid ${th.border}`,borderLeft:`3px solid ${vendorColor}`,borderRadius:14,padding:"18px 20px",boxShadow:SHADOW.card}}>
                <div style={{fontSize:13,fontWeight:900,color:vendorColor,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:16}}>
                  A. Configuration
                </div>

                <div style={{display:"grid",gap:12}}>
                  <div>
                    <label style={s.label}>Nombre de disques</label>
                    <input type="number" min={1} max={500} value={vDisks} onChange={e=>setVDisks(Number(e.target.value))} style={s.input}/>
                  </div>

                  <div>
                    <label style={s.label}>Capacité / disque (TB)</label>
                    <input type="number" min={0.5} max={64} step={0.1} value={vDiskCap} onChange={e=>setVDiskCap(Number(e.target.value))} style={s.input}/>
                  </div>

                  <div>
                    <label style={s.label}>Cible capacité nette (TB)</label>
                    <input type="number" min={1} step={5} value={vTarget} onChange={e=>setVTarget(Number(e.target.value))} style={s.input}/>
                  </div>

                  {model?.hasDedup && (
                    <div>
                      <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:12,color:vVendorDedup?th.accent:th.t2,fontWeight:700}}>
                        <input type="checkbox" checked={vVendorDedup} onChange={e=>setVVendorDedup(e.target.checked)} style={{accentColor:th.accent}}/>
                        Dédup / compression actif
                      </label>
                      {vVendorDedup && (
                        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10}}>
                          <input type="range" min={1} max={8} step={0.5} value={vDedupRatio} onChange={e=>setVDedupRatio(Number(e.target.value))} style={{flex:1,accentColor:th.accent}}/>
                          <strong style={{fontSize:12,color:th.accent}}>{vDedupRatio}:1</strong>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{marginTop:8,padding:"10px 12px",background:"rgba(99,102,241,0.06)",border:"1px solid rgba(99,102,241,0.18)",borderRadius:10,fontSize:12,color:th.t2,lineHeight:1.5}}>
                    Ajustez les paramètres : les résultats se mettent à jour automatiquement.
                  </div>
                </div>
              </div>

              {/* Pipeline résultats */}
              {/* Pipeline résultats */}
              <div style={{
                background:th.cardBg,
                border:`1px solid ${th.border}`,
                borderTop:`4px solid #7c3aed`,
                borderRadius:18,
                padding:"20px 22px",
                boxShadow:"0 14px 34px rgba(15,23,42,0.08)"
              }}>
                <div style={{
                  display:"flex",
                  alignItems:"center",
                  gap:10,
                  marginBottom:18
                }}>
                  <div style={{
                    width:34,
                    height:34,
                    borderRadius:10,
                    background:"rgba(124,58,237,0.12)",
                    color:"#7c3aed",
                    display:"flex",
                    alignItems:"center",
                    justifyContent:"center",
                    fontWeight:900
                  }}>
                    B
                  </div>
                  <div>
                    <div style={{
                      fontSize:13,
                      fontWeight:900,
                      color:"#7c3aed",
                      textTransform:"uppercase",
                      letterSpacing:"0.04em"
                    }}>
                      Résultats — pipeline capacité
                    </div>
                    <div style={{fontSize:11,color:th.t3,marginTop:2}}>
                      Lecture progressive du brut vers la capacité effective
                    </div>
                  </div>
                </div>

                {[
                  {
                    icon:<Database size={18}/>,
                    title:"Brut total",
                    sub:"Capacité brute de tous les disques",
                    val:fmt(rawTB,2)+" TB",
                    color:"#2563eb"
                  },
                  {
                    icon:<Cpu size={18}/>,
                    title:"Après overhead système",
                    sub:"Réservé au système / métadonnées",
                    val:fmt(rawTB*(1-overheadF),2)+" TB",
                    color:"#7c3aed"
                  },
                  {
                    icon:<Shield size={18}/>,
                    title:"Après "+pipelineRaidLabel,
                    sub:"Capacité après protection RAID",
                    val:fmt(usable,2)+" TB",
                    color:th.accent2
                  },
                  {
                    icon:<HardDrive size={18}/>,
                    title:model?.hasDedup&&vVendorDedup ? "Effective ×"+vDedupRatio : "Effective",
                    sub:"Capacité disponible après réduction",
                    val:fmt(effective,2)+" TB",
                    color:th.accent
                  },
                  {
                    icon:<CheckCircle size={18}/>,
                    title:"Cible nette",
                    sub:"Objectif de capacité utile",
                    val:fmt(vTarget,0)+" TB",
                    color:ok?th.accent:th.danger
                  },
                ].map((step,i,arr)=>(
                  <div key={step.title} style={{
                    display:"grid",
                    gridTemplateColumns:"42px 1fr auto",
                    gap:12,
                    alignItems:"start",
                    position:"relative",
                    paddingBottom:i<arr.length-1?18:0,
                    marginBottom:i<arr.length-1?2:0
                  }}>
                    {i<arr.length-1 && (
                      <div style={{
                        position:"absolute",
                        left:20,
                        top:40,
                        bottom:0,
                        width:2,
                        background:`linear-gradient(${step.color}, ${arr[i+1].color})`,
                        opacity:.35
                      }}/>
                    )}

                    <div style={{
                      width:42,
                      height:42,
                      borderRadius:999,
                      background:`${step.color}14`,
                      border:`1px solid ${step.color}35`,
                      color:step.color,
                      display:"flex",
                      alignItems:"center",
                      justifyContent:"center",
                      fontWeight:900,
                      zIndex:1
                    }}>
                      {step.icon}
                    </div>

                    <div>
                      <div style={{fontSize:13,fontWeight:850,color:th.t1}}>
                        {step.title}
                      </div>
                      <div style={{fontSize:11,color:th.t3,marginTop:3,lineHeight:1.35}}>
                        {step.sub}
                      </div>
                    </div>

                    <div style={{
                      fontSize:14,
                      fontWeight:900,
                      color:step.color,
                      fontFamily:"Inter, sans-serif",
                      whiteSpace:"nowrap",
                      background:`${step.color}10`,
                      border:`1px solid ${step.color}24`,
                      borderRadius:10,
                      padding:"7px 10px"
                    }}>
                      {step.val}
                    </div>
                  </div>
                ))}

                <div style={{
                  marginTop:18,
                  padding:"13px 14px",
                  borderRadius:12,
                  background:ok?"rgba(59,126,246,0.08)":"rgba(255,85,85,0.08)",
                  border:`1px solid ${ok?"rgba(59,126,246,0.22)":"rgba(255,85,85,0.22)"}`,
                  display:"flex",
                  justifyContent:"space-between",
                  alignItems:"center",
                  gap:12
                }}>
                  <div>
                    <div style={{fontSize:12,fontWeight:900,color:ok?th.accent:th.danger}}>
                      {ok ? "Marge vs cible" : "Déficit vs cible"}
                    </div>
                    <div style={{fontSize:11,color:th.t2,marginTop:3}}>
                      Capacité disponible par rapport à l’objectif
                    </div>
                  </div>
                  <strong style={{fontSize:18,color:ok?th.accent:th.danger,fontFamily:"Inter, sans-serif"}}>
                    {fmt(Math.abs(margin),2)} TB
                  </strong>
                </div>
              </div>

              <div style={{background:th.cardBg,border:`1px solid ${th.border}`,borderLeft:`3px solid ${th.warn}`,borderRadius:14,padding:"18px 20px",boxShadow:SHADOW.card}}>
                <div style={{fontSize:13,fontWeight:900,color:th.warn,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:14}}>
                  C. Analyse constructeur
                </div>

                {[
                  ["Overhead système", vOverhead+" %"],
                  ["Protection RAID", model?.protection],
                  ["Overhead min / max", model?.overheadMin+" % / "+model?.overheadMax+" %"],
                  ["Déduplication", model?.hasDedup ? (vVendorDedup ? "Activée" : "Désactivée") : "Non disponible"],
                  ["Ratio dédup typique", model?.hasDedup ? model?.dedupDefault+":1" : "N/A"],
                  ["Utilisation effective", usedPct+" %"],
                ].map(([label,val])=>(
                  <div key={label} style={{display:"flex",justifyContent:"space-between",gap:12,padding:"9px 0",borderBottom:`1px solid ${th.border}`}}>
                    <span style={{fontSize:12,color:th.t2}}>{label}</span>
                    <strong style={{fontSize:12,color:th.t1,textAlign:"right"}}>{val}</strong>
                  </div>
                ))}

                <div style={{
                  marginTop:14,
                  padding:"10px 12px",
                  borderRadius:10,
                  background:usedPct < 50 ? "rgba(255,181,71,0.08)" : "rgba(59,126,246,0.06)",
                  border:`1px solid ${usedPct < 50 ? "rgba(255,181,71,0.24)" : "rgba(59,126,246,0.18)"}`,
                  fontSize:12,
                  color:th.t2,
                  lineHeight:1.5
                }}>
                  {usedPct < 50
                    ? "Utilisation actuelle faible : optimisation possible pour réduire le surdimensionnement."
                    : "Utilisation cohérente : le design est aligné avec la cible définie."
                  }
                </div>

                <div style={{marginTop:12,padding:"10px 12px",background:th.bg2,border:`1px solid ${th.border}`,borderRadius:10,fontSize:12,color:th.t2,lineHeight:1.5}}>
                  {model?.note}
                </div>
              </div>
            </div>

            {/* Recommandations */}
            <div style={{background:th.cardBg,border:`1px solid ${th.border}`,borderRadius:14,padding:"18px 20px",boxShadow:SHADOW.card}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:14}}>
                <div>
                  <div style={{fontSize:13,fontWeight:900,color:th.t1,textTransform:"uppercase",letterSpacing:"0.04em"}}>
                    Recommandations
                  </div>
                  <div style={{fontSize:12,color:th.t2,marginTop:4}}>
                    Synthèse avant-vente basée sur la cible et la marge disponible.
                  </div>
                </div>
                <button style={{cursor:"pointer",border:`1px solid ${th.border}`,background:th.bg2,color:th.t2,borderRadius:10,padding:"9px 12px",fontSize:12,fontWeight:800}}>
                  Générer le rapport
                </button>
              </div>

              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:12}}>
                <div style={{padding:"12px 14px",border:`1px solid ${ok?"rgba(59,126,246,0.22)":"rgba(255,85,85,0.22)"}`,background:ok?"rgba(59,126,246,0.06)":"rgba(255,85,85,0.06)",borderRadius:12}}>
                  <strong style={{color:ok?th.accent:th.danger,fontSize:13}}>
                    {ok ? "Le design couvre la cible" : "Le design ne couvre pas la cible"}
                  </strong>
                  <div style={{fontSize:12,color:th.t2,marginTop:6,lineHeight:1.5}}>
                    {ok ? "Vous disposez d’une marge confortable." : "Augmenter capacité ou nombre de disques."}
                  </div>
                </div>

                <div style={{padding:"12px 14px",border:"1px solid rgba(255,181,71,0.22)",background:"rgba(255,181,71,0.07)",borderRadius:12}}>
                  <strong style={{color:th.warn,fontSize:13}}>Optimisation possible</strong>
                  <div style={{fontSize:12,color:th.t2,marginTop:6,lineHeight:1.5}}>
                    {marginPct > 50 ? "Réduire le nombre de disques ou la taille disque peut limiter le surdimensionnement." : "La marge est raisonnable pour absorber la croissance."}
                  </div>
                </div>

                <div style={{padding:"12px 14px",border:"1px solid rgba(99,102,241,0.22)",background:"rgba(99,102,241,0.06)",borderRadius:12}}>
                  <strong style={{color:th.accent2,fontSize:13}}>Surveillez la croissance</strong>
                  <div style={{fontSize:12,color:th.t2,marginTop:6,lineHeight:1.5}}>
                    Revalidez le projet à 6 / 12 mois ou lors d’une évolution applicative.
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {storageTab==="hci"&&(()=>{
        const hciProfile  = HCI_PROFILES[hciSolution];
        const hciResilOpt = hciProfile.resiliency.find(r=>r.id===hciResil)||hciProfile.resiliency[0];
        const hciDisk     = HCI_DISKS.find(d=>d.id===hciDiskId)||HCI_DISKS[0];

        const growthF = 1 + hciGrowth/100;
        const reqVcpu = Math.round(hciTargetVcpu * growthF);
        const reqRam  = Math.round(hciTargetRam * growthF);
        const reqSto  = hciTargetStorage * growthF;

        const rawPerNode = hciDisksPerNode * hciDisk.cap;
        const usablePerNode = rawPerNode * (1-hciProfile.overhead) / hciResilOpt.factor * (1-hciProfile.metadataReserve);
        const effPerNode = hciDedupEn ? usablePerNode * hciDedupRatio : usablePerNode;

        const activeNodes = Math.max(hciNodes - hciHaPolicy, 1);
        const totalCpu = hciNodes * hciNodeCpu;
        const totalRam = hciNodes * hciNodeRam;
        const totalRaw = hciNodes * rawPerNode;

        const availVcpu = activeNodes * hciNodeCpu * hciOvercommit;
        const availRam  = activeNodes * hciNodeRam;
        const availSto  = activeNodes * effPerNode;

        const cpuMargin = reqVcpu>0 ? Math.round(((availVcpu-reqVcpu)/reqVcpu)*100) : 0;
        const ramMargin = reqRam>0 ? Math.round(((availRam-reqRam)/reqRam)*100) : 0;
        const stoMargin = reqSto>0 ? Math.round(((availSto-reqSto)/reqSto)*100) : 0;

        const cpuOk = availVcpu >= reqVcpu;
        const ramOk = availRam >= reqRam;
        const stoOk = availSto >= reqSto;
        const hciOk = cpuOk && ramOk && stoOk;
        const growth20Ok =
          availVcpu >= Math.round(hciTargetVcpu * 1.2) &&
          availRam  >= Math.round(hciTargetRam * 1.2) &&
          availSto  >= hciTargetStorage * 1.2;

        const toRam = v => v>=1024 ? (v/1024).toFixed(1)+" To" : fmt(v)+" Go";

        const HciKpi = ({label,value,sub,color,icon,margin}) => (
          <div style={{
            background:`linear-gradient(135deg, ${color}14, ${color}06)`,
            border:`1px solid ${color}28`,
            borderRadius:16,
            padding:"18px 20px",
            boxShadow:"0 12px 30px rgba(15,23,42,0.06)",
            display:"flex",
            alignItems:"center",
            gap:14
          }}>
            <div style={{
              width:52,
              height:52,
              borderRadius:16,
              background:`${color}14`,
              color,
              display:"flex",
              alignItems:"center",
              justifyContent:"center",
              flexShrink:0
            }}>
              {icon}
            </div>
            <div style={{flex:1}}>
              <div style={{
                fontSize:11,
                fontWeight:900,
                color,
                textTransform:"uppercase",
                letterSpacing:"0.06em",
                marginBottom:5
              }}>
                {label}
              </div>
              <div style={{
                fontSize:24,
                fontWeight:900,
                color,
                letterSpacing:"-0.03em",
                fontFamily:"Inter, sans-serif"
              }}>
                {value}
              </div>
              <div style={{fontSize:12,color:th.t2,marginTop:4}}>
                {sub}
              </div>
            </div>
            {margin!==undefined && (
              <div style={{
                fontSize:12,
                fontWeight:900,
                color:margin>=0?th.accent:th.danger,
                background:margin>=0?"rgba(59,126,246,0.10)":"rgba(255,85,85,0.10)",
                border:`1px solid ${margin>=0?"rgba(59,126,246,0.22)":"rgba(255,85,85,0.22)"}`,
                borderRadius:999,
                padding:"5px 8px"
              }}>
                {margin>=0?"+":""}{margin}%
              </div>
            )}
          </div>
        );

        const ResultRow = ({icon,label,value,sub,color=th.t1}) => (
          <div style={{
            display:"grid",
            gridTemplateColumns:"34px 1fr auto",
            gap:12,
            alignItems:"center",
            padding:"11px 0",
            borderBottom:`1px solid ${th.border}`
          }}>
            <div style={{
              width:30,
              height:30,
              borderRadius:10,
              background:`${color}12`,
              color,
              display:"flex",
              alignItems:"center",
              justifyContent:"center"
            }}>
              {icon}
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:750,color:th.t1}}>{label}</div>
              {sub && <div style={{fontSize:11,color:th.t3,marginTop:2}}>{sub}</div>}
            </div>
            <strong style={{fontSize:13,color,fontFamily:"Inter, sans-serif",whiteSpace:"nowrap"}}>{value}</strong>
          </div>
        );

        const RecoCard = ({type="info",title,body}) => {
          const color = type==="warn" ? th.warn : type==="ok" ? th.accent : th.accent2;
          const Icon = type==="warn" ? AlertTriangle : type==="ok" ? CheckCircle : Info;
          return (
            <div style={{
              display:"flex",
              gap:12,
              padding:"14px 16px",
              borderRadius:14,
              background:`${color}08`,
              border:`1px solid ${color}25`
            }}>
              <div style={{
                width:36,
                height:36,
                borderRadius:999,
                background:`${color}14`,
                color,
                display:"flex",
                alignItems:"center",
                justifyContent:"center",
                flexShrink:0
              }}>
                <Icon size={18}/>
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:900,color:th.t1}}>{title}</div>
                <div style={{fontSize:12,color:th.t2,lineHeight:1.5,marginTop:4}}>{body}</div>
              </div>
            </div>
          );
        };

        return (
          <div>
            {/* HERO */}
            <div style={{
              display:"grid",
              gridTemplateColumns:isMobile?"1fr":"1.4fr 1fr",
              gap:18,
              alignItems:"center",
              background:hciOk?"rgba(59,126,246,0.06)":"rgba(255,85,85,0.07)",
              border:`1px solid ${hciOk?"rgba(59,126,246,0.22)":"rgba(255,85,85,0.25)"}`,
              borderRadius:18,
              padding:"22px 26px",
              marginBottom:18,
              boxShadow:"0 12px 32px rgba(15,23,42,0.06)"
            }}>
              <div style={{display:"flex",alignItems:"center",gap:18}}>
                <div style={{
                  width:72,
                  height:72,
                  borderRadius:999,
                  background:hciOk?"linear-gradient(135deg,#10b981,#059669)":"linear-gradient(135deg,#ef4444,#b91c1c)",
                  color:"#fff",
                  display:"flex",
                  alignItems:"center",
                  justifyContent:"center",
                  fontSize:38,
                  fontWeight:900
                }}>
                  {hciOk?"✓":"!"}
                </div>
                <div>
                  <div style={{fontSize:24,fontWeight:900,color:hciOk?th.accent:th.danger,letterSpacing:"-0.03em"}}>
                    {hciOk?"Cluster cohérent":"Cluster sous-dimensionné"}
                  </div>
                  <div style={{fontSize:13,color:th.t2,marginTop:6,lineHeight:1.5}}>
                    {hciOk
                      ? "Le dimensionnement couvre les besoins avec résilience N+"+hciHaPolicy+"."
                      : "Les ressources disponibles ne couvrent pas les besoins avec la politique HA définie."}
                  </div>
                  <div style={{
                    display:"inline-flex",
                    gap:8,
                    marginTop:10,
                    padding:"6px 10px",
                    borderRadius:999,
                    background:hciOk?"rgba(59,126,246,0.10)":"rgba(255,85,85,0.10)",
                    color:hciOk?th.accent:th.danger,
                    fontSize:12,
                    fontWeight:900
                  }}>
                    CPU {cpuMargin>=0?"+":""}{cpuMargin}% · RAM {ramMargin>=0?"+":""}{ramMargin}% · Stockage {stoMargin>=0?"+":""}{stoMargin}%
                  </div>
                </div>
              </div>

              <div style={{
                background:th.cardBg,
                border:`1px solid ${th.border}`,
                borderRadius:14,
                padding:"16px 18px"
              }}>
                <div style={{fontSize:12,fontWeight:900,color:th.accent,marginBottom:8}}>Résumé</div>
                <div style={{fontSize:13,color:th.t2,lineHeight:1.55}}>
                  {hciOk
                    ? "Votre cluster HCI offre une capacité suffisante pour les workloads actuels avec une bonne marge de sécurité."
                    : "Des ajustements sont nécessaires : ajouter un nœud, augmenter CPU/RAM ou revoir la résilience."}
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div style={{
              display:"grid",
              gridTemplateColumns:isMobile?"1fr":"repeat(4,1fr)",
              gap:14,
              marginBottom:18
            }}>
              <HciKpi label="Nœuds cluster" value={hciNodes} sub="Nœuds physiques" color="#2563eb" icon={<Database size={24}/>} />
              <HciKpi label={"CPU disponible N-"+hciHaPolicy} value={fmt(availVcpu)+" vCPU"} sub={"Requis : "+fmt(reqVcpu)+" vCPU"} color={cpuOk?th.accent:th.danger} icon={<Cpu size={24}/>} margin={cpuMargin}/>
              <HciKpi label={"RAM disponible N-"+hciHaPolicy} value={toRam(availRam)} sub={"Requis : "+toRam(reqRam)} color={ramOk?th.accent:"#7c3aed"} icon={<Server size={24}/>} margin={ramMargin}/>
              <HciKpi label="Stockage effectif" value={fmt(availSto,1)+" To"} sub={"Requis : "+fmt(reqSto,1)+" To"} color={stoOk?th.accent:th.danger} icon={<HardDrive size={24}/>} margin={stoMargin}/>
            </div>

            {/* MAIN GRID */}
            <div style={{
              display:"grid",
              gridTemplateColumns:isMobile?"1fr":"1fr 1.25fr 1fr",
              gap:16,
              marginBottom:18
            }}>
              {/* CONFIG */}
              <div style={{display:"grid",gap:16}}>
                <div style={{
                  background:th.cardBg,
                  border:`1px solid ${th.border}`,
                  borderTop:`4px solid ${hciProfile.color}`,
                  borderRadius:16,
                  padding:"18px 20px",
                  boxShadow:"0 12px 30px rgba(15,23,42,0.06)"
                }}>
                  <div style={{fontSize:13,fontWeight:900,color:hciProfile.color,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:14}}>
                    1. Configuration HCI
                  </div>

                  <div style={{display:"grid",gap:12}}>
                    <div>
                      <label style={s.label}>Hyperviseur</label>
                      <select value={hciSolution} onChange={e=>{setHciSolution(e.target.value);setHciResil(HCI_PROFILES[e.target.value].resiliency[0].id);}} style={s.select}>
                        {Object.entries(HCI_PROFILES).map(([k,p])=><option key={k} value={k}>{p.label}</option>)}
                      </select>
                    </div>

                    <div>
                      <label style={s.label}>Résilience</label>
                      <select value={hciResil} onChange={e=>setHciResil(e.target.value)} style={s.select}>
                        {hciProfile.resiliency.map(r=><option key={r.id} value={r.id}>{r.label}</option>)}
                      </select>
                    </div>

                    <div>
                      <label style={s.label}>Nombre de nœuds</label>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <button onClick={()=>setHciNodes(Math.max(2,hciNodes-1))} style={s.btnSm(th.t2)}>-</button>
                        <input type="range" min={2} max={32} value={hciNodes} onChange={e=>setHciNodes(Number(e.target.value))} style={{flex:1,accentColor:hciProfile.color}}/>
                        <button onClick={()=>setHciNodes(hciNodes+1)} style={s.btnSm(th.accent)}>+</button>
                        <strong style={{fontSize:13,color:th.t1,minWidth:24,textAlign:"right"}}>{hciNodes}</strong>
                      </div>
                    </div>

                    <div>
                      <label style={s.label}>Overcommit vCPU</label>
                      <select value={hciOvercommit} onChange={e=>setHciOvercommit(Number(e.target.value))} style={s.select}>
                        {[[1,"1:1 — Sans overcommit"],[2,"2:1"],[3,"3:1"],[4,"4:1 — Standard"],[6,"6:1"],[8,"8:1 — Densité élevée"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>

                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      <div>
                        <label style={s.label}>Politique HA</label>
                        <select value={hciHaPolicy} onChange={e=>setHciHaPolicy(Number(e.target.value))} style={s.select}>
                          <option value={1}>N+1</option>
                          <option value={2}>N+2</option>
                        </select>
                      </div>
                      <div>
                        <label style={s.label}>Dédup/Compression</label>
                        <select value={hciDedupEn} onChange={e=>setHciDedupEn(e.target.value==="true")} style={s.select}>
                          <option value="false">Désactivée</option>
                          <option value="true">Activée</option>
                        </select>
                      </div>
                    </div>

                    <div style={{
                      marginTop:4,
                      paddingTop:12,
                      borderTop:`1px solid ${th.border}`
                    }}>
                      <div style={{
                        fontSize:11,
                        fontWeight:900,
                        color:th.t2,
                        textTransform:"uppercase",
                        letterSpacing:"0.06em",
                        marginBottom:10
                      }}>
                        Modèle de nœud
                      </div>

                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                        <div>
                          <label style={s.label}>CPU cœurs / nœud</label>
                          <input type="number" min={8} step={8} value={hciNodeCpu} onChange={e=>setHciNodeCpu(Number(e.target.value))} style={s.input}/>
                        </div>
                        <div>
                          <label style={s.label}>RAM / nœud (Go)</label>
                          <input type="number" min={64} step={64} value={hciNodeRam} onChange={e=>setHciNodeRam(Number(e.target.value))} style={s.input}/>
                        </div>
                        <div>
                          <label style={s.label}>Disques / nœud</label>
                          <input type="number" min={2} step={2} value={hciDisksPerNode} onChange={e=>setHciDisksPerNode(Number(e.target.value))} style={s.input}/>
                        </div>
                        <div>
                          <label style={s.label}>Modèle disque</label>
                          <select value={hciDiskId} onChange={e=>setHciDiskId(e.target.value)} style={s.select}>
                            {HCI_DISKS.map(d=><option key={d.id} value={d.id}>{d.label}</option>)}
                          </select>
                        </div>
                      </div>

                      <div style={{
                        marginTop:10,
                        padding:"9px 10px",
                        borderRadius:10,
                        background:th.bg2,
                        border:`1px solid ${th.border}`,
                        fontSize:11,
                        color:th.t2,
                        lineHeight:1.45
                      }}>
                        Brut/nœud : <strong>{fmt(rawPerNode,1)} To</strong> · Utile/nœud : <strong>{fmt(usablePerNode,1)} To</strong> · Effectif/nœud : <strong>{fmt(effPerNode,1)} To</strong>
                      </div>
                    </div>

                    {hciDedupEn&&(
                      <div>
                        <label style={s.label}>Ratio dédup</label>
                        <select value={hciDedupRatio} onChange={e=>setHciDedupRatio(Number(e.target.value))} style={s.select}>
                          {[["1.5","1.5:1"],["2","2:1"],["3","3:1"],["4","4:1"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{
                  background:th.cardBg,
                  border:`1px solid ${th.border}`,
                  borderTop:`4px solid ${th.accent}`,
                  borderRadius:16,
                  padding:"18px 20px",
                  boxShadow:"0 12px 30px rgba(15,23,42,0.06)"
                }}>
                  <div style={{fontSize:13,fontWeight:900,color:th.accent,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:14}}>
                    Besoin cluster cible
                  </div>

                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div>
                      <label style={s.label}>vCPU requis</label>
                      <input type="number" min={1} step={10} value={hciTargetVcpu} onChange={e=>setHciTargetVcpu(Number(e.target.value))} style={s.input}/>
                    </div>
                    <div>
                      <label style={s.label}>RAM requise (Go)</label>
                      <input type="number" min={1} step={64} value={hciTargetRam} onChange={e=>setHciTargetRam(Number(e.target.value))} style={s.input}/>
                    </div>
                    <div>
                      <label style={s.label}>Stockage requis (To)</label>
                      <input type="number" min={1} step={1} value={hciTargetStorage} onChange={e=>setHciTargetStorage(Number(e.target.value))} style={s.input}/>
                    </div>
                    <div>
                      <label style={s.label}>Croissance appliquée (%)</label>
                      <input type="number" min={0} step={5} value={hciGrowth} onChange={e=>setHciGrowth(Number(e.target.value))} style={s.input}/>
                    </div>
                  </div>

                  <div style={{
                    marginTop:12,
                    padding:"10px 12px",
                    borderRadius:10,
                    background:"rgba(99,102,241,0.06)",
                    border:"1px solid rgba(99,102,241,0.18)",
                    fontSize:11,
                    color:th.t2,
                    lineHeight:1.45
                  }}>
                    Les valeurs représentent le besoin global attendu du cluster, et non un profil moyen par VM.
                  </div>
                </div>
              </div>

              {/* RESULTATS */}
              <div style={{
                background:th.cardBg,
                border:`1px solid ${th.border}`,
                borderTop:`4px solid #7c3aed`,
                borderRadius:16,
                padding:"18px 20px",
                boxShadow:"0 12px 30px rgba(15,23,42,0.06)"
              }}>
                <div style={{fontSize:13,fontWeight:900,color:"#7c3aed",textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:14}}>
                  2. Capacité & performance
                </div>

                <ResultRow icon={<Cpu size={16}/>} label="VMs → vCPU total" sub="Avec croissance intégrée" value={fmt(reqVcpu)+" vCPUs"} color="#7c3aed"/>
                <ResultRow icon={<Server size={16}/>} label="RAM requise" sub="Avec croissance intégrée" value={toRam(reqRam)} color="#7c3aed"/>
                <ResultRow icon={<HardDrive size={16}/>} label="Stockage requis" sub="Avec croissance intégrée" value={fmt(reqSto,1)+" To"} color="#7c3aed"/>
                <ResultRow icon={<Database size={16}/>} label="Stockage brut / nœud" value={fmt(rawPerNode,1)+" To"} color={th.accent}/>
                <ResultRow icon={<Database size={16}/>} label="Stockage brut total" value={fmt(totalRaw,1)+" To"} color={th.t1}/>
                <ResultRow icon={<Info size={16}/>} label="Overhead plateforme" value={(hciProfile.overhead*100).toFixed(0)+"% + metadata "+(hciProfile.metadataReserve*100).toFixed(0)+"%"} color={th.t2}/>

                <div style={{
                  marginTop:16,
                  padding:"14px 16px",
                  borderRadius:14,
                  background:hciOk?"rgba(59,126,246,0.08)":"rgba(255,85,85,0.08)",
                  border:`1px solid ${hciOk?"rgba(59,126,246,0.22)":"rgba(255,85,85,0.22)"}`,
                  display:"flex",
                  gap:12,
                  alignItems:"center"
                }}>
                  <CheckCircle size={22} color={hciOk?th.accent:th.danger}/>
                  <div>
                    <div style={{fontSize:13,fontWeight:900,color:hciOk?th.accent:th.danger}}>
                      {hciOk?"Capacité suffisante":"Capacité insuffisante"}
                    </div>
                    <div style={{fontSize:12,color:th.t2,marginTop:3,lineHeight:1.5}}>
                      {hciOk?"Toutes les ressources couvrent les besoins avec une marge confortable.":"Ajustez le nombre de nœuds ou le modèle de nœud."}
                    </div>
                  </div>
                </div>
              </div>

              {/* RECOMMANDATIONS */}
              <div style={{
                background:th.cardBg,
                border:`1px solid ${th.border}`,
                borderTop:`4px solid ${th.warn}`,
                borderRadius:16,
                padding:"18px 20px",
                boxShadow:"0 12px 30px rgba(15,23,42,0.06)"
              }}>
                <div style={{fontSize:13,fontWeight:900,color:th.warn,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:14}}>
                  3. Recommandations
                </div>

                <div style={{display:"grid",gap:12}}>
                  {!cpuOk && <RecoCard type="warn" title={"CPU headroom faible ("+cpuMargin+"%)"} body="Ajouter un nœud ou augmenter les vCPU par nœud."/>}
                  {!ramOk && <RecoCard type="warn" title={"RAM headroom faible ("+ramMargin+"%)"} body="Augmenter la RAM par nœud si possible."/>}
                  {!stoOk && <RecoCard type="warn" title={"Stockage proche de la limite ("+stoMargin+"%)"} body="Prévoir un nœud supplémentaire à moyen terme."/>}
                  {hciOk && <RecoCard type="ok" title="Design cohérent" body={"Le cluster couvre les besoins actuels avec résilience N+"+hciHaPolicy+"."}/>}
                  {!growth20Ok && <RecoCard type="warn" title="Croissance 20% non couverte" body="La configuration globale ne couvre pas une croissance de 20% sur vCPU, RAM et stockage. Prévoir un nœud ou augmenter le modèle cible."/>}
                  {growth20Ok && <RecoCard type="ok" title="Croissance 20% couverte" body="Le cluster dispose d’une marge suffisante pour absorber 20% de croissance globale."/>}
                  {!hciDedupEn && <RecoCard type="info" title="Activer la dédup/compression" body="Peut réduire le nombre de nœuds requis selon le profil workload."/>}
                  {hciNodes < hciProfile.minNodes && <RecoCard type="warn" title="Nombre de nœuds inférieur au minimum recommandé" body={hciProfile.label+" recommande au moins "+hciProfile.minNodes+" nœuds."}/>}
                </div>
              </div>
            </div>

            {/* Synthèse globale */}
            <div style={{
              background:th.cardBg,
              border:`1px solid ${th.border}`,
              borderRadius:16,
              padding:"18px 20px",
              boxShadow:"0 12px 30px rgba(15,23,42,0.06)"
            }}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:14}}>
                <div style={{fontSize:13,fontWeight:900,color:th.t1,textTransform:"uppercase",letterSpacing:"0.04em"}}>
                  Synthèse & recommandations globales
                </div>
                <button style={{cursor:"pointer",border:`1px solid ${th.border}`,background:th.bg2,color:th.t2,borderRadius:10,padding:"9px 12px",fontSize:12,fontWeight:800}}>
                  Générer le rapport
                </button>
              </div>

              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:12}}>
                <RecoCard type={hciOk?"ok":"warn"} title={hciOk?"Design cohérent":"Design à renforcer"} body={hciOk?"Le cluster couvre les besoins actuels avec résilience.":"Le cluster nécessite un ajustement avant présentation client."}/>
                <RecoCard type="warn" title="Optimisations possibles" body="Ajuster CPU/RAM ou ajouter un nœud pour augmenter la marge de sécurité."/>
                <RecoCard type="info" title="Anticipation" body="Surveillez la croissance et planifiez l’évolution dans 6 à 12 mois."/>
              </div>
            </div>
          </div>
        );
      })()}

      

    </div>
  );
}


// ─── 5. Veeam ─────────────────────────────────────────────────────────────────
function VeeamCalc({th, isMobile=false}) {
  const [vms,setVms]=useState(50);
  const [vmSizeGb,setVmSizeGb]=useState(200);
  const [changeRate,setChangeRate]=useState(5);
  const [retention,setRetention]=useState(30);
  const [compRatio,setCompRatio]=useState(2);
  const [windowH,setWindowH]=useState(8);
  const [copies,setCopies]=useState(2);
  const [repoType,setRepoType]=useState("sobr");
  const [licType,setLicType]=useState("vul");

  const r = useMemo(()=>{
    const srcTB=(vms*vmSizeGb)/1024;
    const fullComp=srcTB/compRatio;
    const dailyInc=(srcTB*changeRate/100)/compRatio;
    const incTotal=dailyInc*retention;
    const totalRepo=(fullComp+incTotal)*copies;
    const repoMargin=totalRepo*1.2;
    const bwGbps=((srcTB*changeRate/100)*1024*8)/(windowH*3600);
    return {srcTB,fullComp,incTotal,totalRepo,repoMargin,bwGbps,windowOk:bwGbps<10};
  },[vms,vmSizeGb,changeRate,retention,compRatio,windowH,copies]);

  const barData=[
    {name:"Full compressé",value:+r.fullComp.toFixed(2)},
    {name:"Incrémentaux",value:+r.incTotal.toFixed(2)},
    {name:"Total repo",value:+r.totalRepo.toFixed(2)},
    {name:"Repo +20%",value:+r.repoMargin.toFixed(2)},
  ];
  const tt={background:th.tooltipBg,border:`1px solid ${th.border2}`,borderRadius:4,fontSize:11,color:th.t1};

  return (
    <div>
      <InfoBox th={th}>Veeam VBR v12 : sizing repo = Full compressé + (incrémentaux × rétention) × copies. Ajouter 20% de marge opérationnelle.</InfoBox>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(5,1fr)",gap:10,marginBottom:20}}>
        <KpiCard label="Données source" value={fmt(r.srcTB,2)+" To"} sub={vms+" VMs × "+fmt(vmSizeGb)+" Go"} bg="linear-gradient(135deg,#0077cc,#005599)" th={th} />
        <KpiCard label="Stockage repo" value={fmt(r.repoMargin,2)+" To"} sub={"Repo +20% marge opérationnelle"} bg="linear-gradient(135deg,#5a4fcf,#3d35a0)" th={th} />
        <KpiCard label="Fenêtre backup" value={r.windowOk?"✓ OK":"⚠ SERRÉ"} sub={windowH+" h disponibles"} bg={r.windowOk?"linear-gradient(135deg,#00a884,#007a60)":"linear-gradient(135deg,#d97706,#b45309)"} th={th} />
        <KpiCard label="Licences VMs" value={fmt(vms)} sub="Universal License (VUL)" bg="linear-gradient(135deg,#0099ff,#0066cc)" th={th} />
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:14}}>
        <Card accent="accent" th={th}>
          <SectionTitle th={th}>Environnement source</SectionTitle>
          <SliderField label="Nombre de VMs" min={1} max={1000} step={5} value={vms} onChange={setVms} th={th} />
          <NumField label="Taille moyenne / VM" value={vmSizeGb} onChange={setVmSizeGb} min={10} max={5000} step={10} unit="Go" th={th} />
          <SliderField label="Taux de changement journalier" min={1} max={30} value={changeRate} onChange={setChangeRate} display={changeRate+" %"} th={th} />
          <SliderField label="Rétention" min={7} max={365} step={7} value={retention} onChange={setRetention} display={retention+" jours"} th={th} />
          <SelectField label="Type de licence Veeam" value={licType} onChange={setLicType} th={th}
            options={[{value:"vul",label:"VUL (Universal License)"},{value:"socket",label:"Per-Socket"},{value:"vbr",label:"VBR Enterprise Plus"},{value:"baas",label:"BaaS (Cloud Connect)"}]} />
        </Card>
        <Card accent="accent2" th={th}>
          <SectionTitle th={th}>Paramètres backup</SectionTitle>
          <SelectField label="Ratio compression / dédup Veeam" value={String(compRatio)} onChange={v=>setCompRatio(Number(v))} th={th}
            options={[{value:"1",label:"1:1 — aucune compression"},{value:"1.5",label:"1.5:1 — auto"},{value:"2",label:"2:1 — optimal (recommandé)"},{value:"3",label:"3:1 — extrême"}]} />
          <SliderField label="Fenêtre de backup" min={2} max={12} value={windowH} onChange={setWindowH} display={windowH+" h"} th={th} />
          <SliderField label="Copies (GFS / immuables)" min={1} max={5} value={copies} onChange={setCopies} th={th} />
          <SelectField label="Type de repo cible" value={repoType} onChange={setRepoType} th={th}
            options={[{value:"sobr",label:"SOBR (Scale-Out Backup Repo)"},{value:"s3",label:"Object Storage S3 / MinIO"},{value:"vcc",label:"Veeam Cloud Connect (BaaS)"},{value:"xfs",label:"Linux XFS + Immutable Backup"}]} />
          <hr style={{border:"none",borderTop:`1px solid ${th.border}`,margin:"12px 0"}} />
          <InfoBox type={r.windowOk?"ok":"alert"} th={th}>{r.windowOk?"Fenêtre de backup nominale":"Bande passante élevée — backup synthétique recommandé"}</InfoBox>
          <ResultRow label="Données source" value={fmt(r.srcTB,2)+" To"} th={th} />
          <ResultRow label="Full backup compressé" value={fmt(r.fullComp,2)+" To"} th={th} />
          <ResultRow label="Incrémentaux (rétention)" value={fmt(r.incTotal,2)+" To"} th={th} />
          <ResultRow label="Stockage repo total" value={fmt(r.totalRepo,2)+" To"} highlight th={th} />
          <ResultRow label="Repo recommandé (+20%)" value={fmt(r.repoMargin,2)+" To"} highlight th={th} />
          <ResultRow label="Bande passante backup" value={fmt(r.bwGbps,3)+" Gbps"} warn={!r.windowOk} th={th} />
        </Card>
        <Card th={th}>
          <SectionTitle th={th}>Sizing repo</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} layout="vertical" barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke={th.border} horizontal={false} />
              <XAxis type="number" tick={{fontSize:10,fill:th.t2}} unit=" To" />
              <YAxis dataKey="name" type="category" tick={{fontSize:10,fill:th.t2}} width={100} />
              <Tooltip contentStyle={tt} formatter={v=>[fmt(v,2)+" To"]} />
              <Bar dataKey="value" fill={th.accent3} radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{fontSize:10,color:th.t3,marginTop:8,fontFamily:"Inter, sans-serif"}}>Licence : {licType.toUpperCase()} · Repo : {repoType.toUpperCase()} · {copies} copie(s)</div>
        </Card>
      </div>
    </div>
  );
}

// ─── Compute & HCI Planning v3 ───────────────────────────────────────────────

const HCI_PROFILES = {
  vsan:         { label:"VMware vSAN",           color:"#6366f1", overhead:0.25, minNodes:4, metadataReserve:0.07, defaultDedup:2.0,
    resiliency:[{id:"ftt1r1",label:"FTT=1 RAID-1",factor:2},{id:"ftt1r5",label:"FTT=1 RAID-5",factor:1.33},{id:"ftt2r1",label:"FTT=2 RAID-1",factor:3},{id:"ftt2r6",label:"FTT=2 RAID-6",factor:1.5}] },
  nutanix:      { label:"Nutanix AHV",            color:"#3B7EF6", overhead:0.20, minNodes:3, metadataReserve:0.05, defaultDedup:3.0,
    resiliency:[{id:"rf2",label:"RF2 (1 panne)",factor:2},{id:"rf3",label:"RF3 (2 pannes)",factor:3}] },
  azurestackhci:{ label:"Hyper-V / Azure Stack HCI", color:"#ff6b35", overhead:0.25, minNodes:2, metadataReserve:0.08, defaultDedup:2.0,
    resiliency:[{id:"2way",label:"2-way mirror",factor:2},{id:"3way",label:"3-way mirror",factor:3},{id:"rs42",label:"RS 4+2",factor:1.5}] },
  proxmox:      { label:"Proxmox VE",              color:"#e05a20", overhead:0.15, minNodes:2, metadataReserve:0.05, defaultDedup:1.0,
    resiliency:[{id:"zfs_mirror",label:"ZFS + Réplication (x2)",factor:2},{id:"ceph_rf2",label:"Ceph RF2 (x2)",factor:2},{id:"ceph_rf3",label:"Ceph RF3 (x3)",factor:3}] },
};

const HCI_DISKS = [
  {id:"ssd-192",label:"SSD 1,92 To",cap:1.92},{id:"ssd-384",label:"SSD 3,84 To",cap:3.84},
  {id:"ssd-768",label:"SSD 7,68 To",cap:7.68},{id:"nvme-192",label:"NVMe 1,92 To",cap:1.92},
  {id:"nvme-384",label:"NVMe 3,84 To",cap:3.84},{id:"nvme-768",label:"NVMe 7,68 To",cap:7.68},
  {id:"nvme-1536",label:"NVMe 15,36 To",cap:15.36},{id:"nvme-3072",label:"NVMe 30,72 To",cap:30.72},
];


// ─── Switch Fabric ────────────────────────────────────────────────────────────
function SwitchCalc({ th, isMobile=false }) {

  const [serverGroups, setServerGroups] = useState([
    { id:1, label:"Serveurs compute",  qty:1, ports1g:0, ports10g:0, ports25g:0, portsMgmt:0 },
    { id:2, label:"Serveurs stockage", qty:1, ports1g:0, ports10g:0, ports25g:0, portsMgmt:0 },
  ]);
  const [redundancy,    setRedundancy]    = useState(true);
  const [uplinkSpeed,   setUplinkSpeed]   = useState(100);   // Gbps uplink vers core
  const [uplinkQty,     setUplinkQty]     = useState(2);     // uplinks par switch
  const [uplinkWarnPct, setUplinkWarnPct] = useState(150);   // seuil alerte uplink %
  const [oversubRatio,  setOversubRatio]  = useState(3);
  const [usecase,       setUsecase]       = useState("virt");
  const [firewallPorts, setFirewallPorts] = useState(2);
  const [stackTech,     setStackTech]     = useState("mlag"); // mlag | stackwise | irf | none
  const [stpMode,       setStpMode]       = useState("rstp"); // stp | rstp | mstp | none
  const nextId = useRef(3);

  const totals = useMemo(()=>{
    let t1g=0, t10g=0, t25g=0, tMgmt=0, tServers=0;
    serverGroups.forEach(g=>{
      t1g   += g.qty * g.ports1g;
      t10g  += g.qty * g.ports10g;
      t25g  += g.qty * g.ports25g;
      tMgmt += g.qty * g.portsMgmt;
      tServers += g.qty;
    });

    // BW East-West = uniquement ports DATA haute vitesse (10G + 25G)
    // Les ports 1G sont considérés management/backup, pas data path principal
    const bwEW10g = t10g * 10;
    const bwEW25g = t25g * 25;
    const bwEW    = bwEW10g + bwEW25g;

    // Uplinks North-South par switch
    const bwUplink      = uplinkQty * uplinkSpeed;
    const bwUplinkTotal = bwUplink * (redundancy ? 2 : 1);

    // Capacité uplink nécessaire = BW EW / oversubRatio
    const bwUplinkNeeded  = bwEW / oversubRatio;
    const uplinkUtilPct   = bwUplink > 0 ? Math.round((bwUplinkNeeded / bwUplink) * 100) : 0;

    // Ports par switch : total / nb switches, arrondi au pair supérieur
    const sw = redundancy ? 2 : 1;
    const ceilEven = n => { const v = Math.ceil(n / sw); return v % 2 === 0 ? v : v + 1; };
    const portsNeeded1g  = ceilEven(t1g + tMgmt + firewallPorts);
    const portsNeeded10g = ceilEven(t10g);
    const portsNeeded25g = ceilEven(t25g);

    // Switches recommandés (48 ports par switch typiquement)
    const CAP = 48;
    const switchBy25g    = portsNeeded25g > 0 ? Math.ceil(portsNeeded25g / CAP) : 0;
    const switchBy10g    = portsNeeded10g > 0 ? Math.ceil(portsNeeded10g / CAP) : 0;
    const switchBy1g     = portsNeeded1g  > 0 ? Math.ceil(portsNeeded1g  / CAP) : 0;
    const switchesNeeded = Math.max(switchBy25g, switchBy10g, switchBy1g, 1);
    const switchesReco   = redundancy ? switchesNeeded * 2 : switchesNeeded;
    const portUtil       = Math.round(((t10g + t25g) / (switchesReco * CAP)) * 100);

    // Uplink minimum recommandé
    const uplinkMinGbps  = Math.ceil(bwUplinkNeeded / uplinkQty);

    return {
      t1g, t10g, t25g, tMgmt, tServers,
      bwEW, bwEW10g, bwEW25g,
      bwUplink, bwUplinkTotal, bwUplinkNeeded, uplinkUtilPct, uplinkMinGbps,
      portsNeeded1g, portsNeeded10g, portsNeeded25g,
      switchesNeeded, switchesReco, portUtil,
    };
  }, [serverGroups, redundancy, uplinkSpeed, uplinkQty, oversubRatio, firewallPorts]);

  const VLAN_TEMPLATES = {
    virt: [
      {id:10,  name:"Management",  use:"ESXi/Hyp. management",   speed:"1G",    qos:"Assured"},
      {id:20,  name:"vMotion",     use:"Migration live VMs",      speed:"10G",   qos:"Best effort"},
      {id:30,  name:"VM Network",  use:"Trafic VM production",    speed:"10G",   qos:"Best effort"},
      {id:40,  name:"Storage",     use:"NFS/iSCSI/NVMe-oF",      speed:"25G",   qos:"Priority"},
      {id:100, name:"iLO/iDRAC",   use:"Management hors-bande",   speed:"1G",    qos:"Low"},
      {id:200, name:"Uplink/FW",   use:"North-South / Firewall",  speed:"Uplink",qos:"Mixed"},
    ],
    hci: [
      {id:10,  name:"Management",  use:"HCI management + CVM",    speed:"1G",    qos:"Assured"},
      {id:20,  name:"Storage",     use:"Réplication inter-noeuds",speed:"25G",   qos:"Priority"},
      {id:30,  name:"VM Network",  use:"Trafic VM production",    speed:"10G",   qos:"Best effort"},
      {id:100, name:"iLO/iDRAC",   use:"Management hors-bande",   speed:"1G",    qos:"Low"},
      {id:200, name:"Uplink/FW",   use:"North-South / Firewall",  speed:"Uplink",qos:"Mixed"},
    ],
    storage: [
      {id:10,  name:"Management",  use:"Management baies/serveurs",speed:"1G",   qos:"Assured"},
      {id:20,  name:"Storage-A",   use:"Fabric A (iSCSI/NVMe)",   speed:"25G",   qos:"Priority"},
      {id:21,  name:"Storage-B",   use:"Fabric B (redondance)",    speed:"25G",   qos:"Priority"},
      {id:100, name:"iLO/iDRAC",   use:"Management hors-bande",   speed:"1G",    qos:"Low"},
    ],
    mixed: [
      {id:10,  name:"Management",  use:"Management infrastructure",speed:"1G",   qos:"Assured"},
      {id:20,  name:"vMotion",     use:"Migration live VMs",       speed:"10G",  qos:"Best effort"},
      {id:30,  name:"VM Network",  use:"Trafic VM production",     speed:"10G",  qos:"Best effort"},
      {id:40,  name:"Storage",     use:"NFS/iSCSI/NVMe-oF",       speed:"25G",  qos:"Priority"},
      {id:50,  name:"Backup",      use:"Trafic sauvegarde",        speed:"10G",  qos:"Low"},
      {id:100, name:"iLO/iDRAC",   use:"Management hors-bande",   speed:"1G",   qos:"Low"},
      {id:200, name:"Uplink/FW",   use:"North-South / Firewall",  speed:"Uplink",qos:"Mixed"},
    ],
  };
  const vlans = VLAN_TEMPLATES[usecase] || VLAN_TEMPLATES.virt;

  // Recommandations
  const recos = [
    // Uplinks
    totals.uplinkUtilPct > uplinkWarnPct && {type:"warn", msg:"Uplinks saturés ("+totals.uplinkUtilPct+"%) — uplink minimum recommandé : "+totals.uplinkMinGbps+" Gbps/port ou augmenter la quantité"},
    totals.uplinkUtilPct > Math.round(uplinkWarnPct/2) && totals.uplinkUtilPct <= uplinkWarnPct && {type:"info", msg:"Uplinks corrects ("+totals.uplinkUtilPct+"%) — marge acceptable avec oversubscription "+oversubRatio+":1"},
    totals.uplinkUtilPct <= Math.round(uplinkWarnPct/2) && {type:"ok",  msg:"Uplinks bien dimensionnés ("+totals.uplinkUtilPct+"%) — bonne marge"},
    // Redondance
    !redundancy && {type:"warn", msg:"Pas de redondance switch — SPOF réseau — recommander une paire HA"},
    redundancy && stackTech==="mlag" && {type:"ok",  msg:"MLAG recommandé — activer LACP sur les liens serveurs pour load-balancing et failover"},
    redundancy && stackTech==="stackwise" && {type:"ok", msg:"StackWise : interconnexion propriétaire Cisco — pas de port data consommé, latence sub-microseconde"},
    redundancy && stackTech==="irf" && {type:"ok", msg:"IRF (HPE) : stack virtuel — administré comme un seul switch, failover transparent"},
    redundancy && stackTech==="none" && {type:"warn", msg:"Redondance sans stack ni MLAG — risque de boucles STP — configurer RSTP ou MSTP"},
    // BW EW
    totals.bwEW25g > 0 && {type:"info", msg:"Ports 25G détectés — switches ToR avec ASIC faible latence (<1µs) recommandés (ex: Cisco 93180YC, Aruba 8325)"},
    totals.bwEW10g > 0 && totals.bwEW25g === 0 && {type:"info", msg:"Environnement 10G — switches 48×10G + uplinks 100G recommandés"},
    // STP
    stpMode==="stp" && {type:"warn", msg:"STP classique : temps de convergence 30-50s — migrer vers RSTP (802.1w) ou MSTP (802.1s)"},
    stpMode==="rstp" && {type:"ok",  msg:"RSTP (802.1w) : convergence <1s — correct pour la plupart des environnements"},
    stpMode==="mstp" && {type:"ok",  msg:"MSTP (802.1s) : optimal avec plusieurs VLANs — load-balancing par instance STP"},
    stpMode==="none" && stackTech==="mlag" && {type:"ok", msg:"STP désactivé avec MLAG : correct — les boucles sont évitées par le protocole MLAG"},
    stpMode==="none" && stackTech==="none" && {type:"warn", msg:"STP désactivé SANS MLAG/Stack — risque de boucle réseau critique"},
    // Ports et scale
    totals.portUtil > 80 && {type:"warn", msg:"Utilisation ports > 80% — prévoir un switch supplémentaire ou ports d'extension"},
    totals.tServers > 16 && {type:"info", msg:totals.tServers+" serveurs — envisager architecture Spine-Leaf plutôt que ToR"},
    firewallPorts > 0 && {type:"info", msg:firewallPorts+" port(s) firewall — configurer sur trunk avec native VLAN sécurisé et port-security"},
    usecase==="hci" && {type:"info", msg:"HCI : isoler storage sur VLAN dédié QoS Priority — activer jumbo frames (MTU 9000) sur le VLAN storage"},
    usecase==="virt" && totals.t10g === 0 && totals.t25g === 0 && {type:"warn", msg:"vMotion nécessite au moins 10G — les ports 1G seront insuffisants en charge"},
  ].filter(Boolean);

  const updateGroup = (id, patch) => setServerGroups(gs => gs.map(g => g.id===id ? {...g,...patch} : g));
  const addGroup    = () => { setServerGroups(gs=>[...gs, {id:nextId.current++, label:"Nouveau groupe", qty:1, ports1g:0, ports10g:0, ports25g:0, portsMgmt:0}]); };
  const removeGroup = (id) => setServerGroups(gs => gs.filter(g => g.id!==id));

  const s = {
    label:    {display:"block",fontSize:10,color:th.t3,fontFamily:"Inter, sans-serif",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4},
    input:    {width:"100%",background:th.bg2,border:`1px solid ${th.border}`,borderRadius:4,padding:"7px 10px",color:th.t1,fontFamily:"Inter, sans-serif",fontSize:13,boxSizing:"border-box"},
    select:   {width:"100%",background:th.bg2,border:`1px solid ${th.border}`,borderRadius:4,padding:"7px 10px",color:th.t1,fontFamily:"Inter, sans-serif",fontSize:13,boxSizing:"border-box"},
    card:     (accent) => ({background:th.cardBg,borderTop:`1px solid ${th.border}`,borderRight:`1px solid ${th.border}`,borderBottom:`1px solid ${th.border}`,borderLeft:`2px solid ${accent||th.border}`,borderRadius:6,padding:16,marginBottom:14}),
    secTitle: {fontSize:10,fontWeight:600,color:th.t2,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:14,fontFamily:"Inter, sans-serif"},
  };

  const kpis = [
    {label:"Switches recommandés", sub:redundancy?"Paire HA — "+["MLAG","StackWise","IRF","Sans stack"][["mlag","stackwise","irf","none"].indexOf(stackTech)]:"Sans redondance",
     val:totals.switchesReco+"×", bg:"linear-gradient(135deg,#0077cc,#005599)"},
    {label:"Ports 10/25G / switch", sub:totals.portsNeeded10g+"p 10G \u00b7 "+totals.portsNeeded25g+"p 25G \u00b7 pair sup.",
     val:(totals.portsNeeded10g+totals.portsNeeded25g)+" ports",
     bg:"linear-gradient(135deg,#5a4fcf,#3d35a0)"},
    {label:"Ports 1G / switch",     sub:totals.portsNeeded1g+"p 1G \u00b7 mgmt + backup \u00b7 pair sup.",
     val:totals.portsNeeded1g+" ports",
     bg:"linear-gradient(135deg,#2d7a4f,#1a5c38)"},
    {label:"BW East-West",         sub:"10G: "+totals.bwEW10g+"G + 25G: "+totals.bwEW25g+"G",
     val:totals.bwEW+" Gbps", bg:"linear-gradient(135deg,#e05a20,#b84510)"},
    {label:"Uplink nécessaire",    sub:"BW EW / oversubscription "+oversubRatio+":1",
     val:totals.uplinkUtilPct+"%",
     bg:totals.uplinkUtilPct<=Math.round(uplinkWarnPct/2)?"linear-gradient(135deg,#00a884,#007a60)":totals.uplinkUtilPct<=uplinkWarnPct?"linear-gradient(135deg,#d97706,#b45309)":"linear-gradient(135deg,#cc3333,#991111)"},
  ];

  return (
    <div>
      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(5,1fr)",gap:10,marginBottom:14}}>
        {kpis.map(k=>(
          <div key={k.label} style={{background:k.bg,borderRadius:8,padding:"14px 16px"}}>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.6)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>{k.label}</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",marginBottom:4}}>{k.sub}</div>
            <div style={{fontSize:20,fontWeight:700,fontFamily:"Inter, sans-serif",color:"#fff"}}>{k.val}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14}}>

        {/* Col gauche */}
        <div>
          {/* Paramètres réseau */}
          <div style={s.card(th.accent2)}>
            <div style={s.secTitle}>Paramètres réseau</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <div>
                <label style={s.label}>Cas d'usage</label>
                <select value={usecase} onChange={e=>setUsecase(e.target.value)} style={s.select}>
                  <option value="virt">Virtualisation VMware</option>
                  <option value="hci">HCI (vSAN / Nutanix)</option>
                  <option value="storage">Stockage dédié</option>
                  <option value="mixed">Mixte / Générique</option>
                </select>
              </div>
              <div>
                <label style={s.label}>Redondance switch</label>
                <select value={redundancy} onChange={e=>setRedundancy(e.target.value==="true")} style={s.select}>
                  <option value="true">Paire HA</option>
                  <option value="false">Simple (sans HA)</option>
                </select>
              </div>
            </div>

            {/* Stack / interconnexion */}
            <div style={{marginBottom:10}}>
              <label style={s.label}>Technologie de stack / interconnexion</label>
              <select value={stackTech} onChange={e=>setStackTech(e.target.value)} style={s.select}>
                <option value="mlag">MLAG / VPC (liens standards, multi-vendor)</option>
                <option value="stackwise">Cisco StackWise (câbles propriétaires)</option>
                <option value="irf">HPE IRF (stack virtuel)</option>
                <option value="none">Aucune (standalone)</option>
              </select>
              <div style={{fontSize:10,color:th.t3,fontFamily:"Inter, sans-serif",marginTop:3}}>
                {stackTech==="mlag"     &&"MLAG : ports uplink standards — pas de port dédié consommé · LACP recommandé"}
                {stackTech==="stackwise"&&"StackWise : câbles dédiés propriétaires — ports data non consommés · latence <1µs"}
                {stackTech==="irf"      &&"IRF : stack virtuel HPE — administré comme un seul équipement"}
                {stackTech==="none"     &&"Sans stack : risque de boucle — configurer STP correctement"}
              </div>
            </div>

            {/* STP */}
            <div style={{marginBottom:10}}>
              <label style={s.label}>Spanning Tree</label>
              <select value={stpMode} onChange={e=>setStpMode(e.target.value)} style={s.select}>
                <option value="rstp">RSTP 802.1w — convergence &lt;1s (recommandé)</option>
                <option value="mstp">MSTP 802.1s — multi-instances VLAN (optimal)</option>
                <option value="none">Désactivé (MLAG/Stack uniquement)</option>
                <option value="stp">STP classique 802.1d (déconseillé)</option>
              </select>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div>
                <label style={s.label}>Oversubscription</label>
                <select value={oversubRatio} onChange={e=>setOversubRatio(Number(e.target.value))} style={s.select}>
                  {[[1,"1:1 — Non bloquant"],[2,"2:1 — Faible"],[3,"3:1 — Standard"],[4,"4:1 — Élevé"],[8,"8:1 — Best-effort"]].map(([v,l])=>(
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                <div style={{fontSize:9,color:th.t3,fontFamily:"Inter, sans-serif",marginTop:2}}>BW serveurs / BW uplinks</div>
              </div>
              <div>
                <label style={s.label}>Ports firewall réservés</label>
                <input type="number" min={0} max={8} value={firewallPorts} onChange={e=>setFirewallPorts(Number(e.target.value))} style={s.input}/>
              </div>
            </div>
          </div>

          {/* Uplinks vers core */}
          <div style={s.card("#6b7280")}>
            <div style={s.secTitle}>Uplinks vers switch core / agrégation</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div>
                <label style={s.label}>Vitesse uplink</label>
                <select value={uplinkSpeed} onChange={e=>setUplinkSpeed(Number(e.target.value))} style={s.select}>
                  {[[1,"1 Gbps"],[2.5,"2,5 Gbps"],[10,"10 Gbps"],[25,"25 Gbps"],[40,"40 Gbps"],[100,"100 Gbps"],[400,"400 Gbps"]].map(([v,l])=>(
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={s.label}>Nb uplinks / switch</label>
                <input type="number" min={1} max={8} value={uplinkQty} onChange={e=>setUplinkQty(Number(e.target.value))} style={s.input}/>
              </div>
              <div style={{gridColumn:"1/-1"}}>
                <label style={s.label}>Seuil alerte uplink (%)</label>
                <input type="number" min={50} max={500} step={10} value={uplinkWarnPct} onChange={e=>setUplinkWarnPct(Number(e.target.value))} style={s.input}/>
                <div style={{fontSize:10,color:th.t3,marginTop:3}}>Vert &lt; {Math.round(uplinkWarnPct/2)}% · Ambre &lt; {uplinkWarnPct}% · Rouge &ge; {uplinkWarnPct}% — défaut 150%</div>
              </div>
            </div>
            <div style={{marginTop:10,padding:"8px 10px",background:th.bg2,borderRadius:4,fontSize:11,fontFamily:"Inter, sans-serif",color:th.t2}}>
              BW uplink / switch : {totals.bwUplink} Gbps · BW nécessaire : {Math.round(totals.bwUplinkNeeded)} Gbps
              {totals.bwUplinkNeeded > totals.bwUplink
                ? <span style={{color:th.danger}}> ⚠ Insuffisant — augmenter vitesse ou quantité</span>
                : <span style={{color:th.accent}}> ✓ Suffisant</span>}
            </div>
          </div>
        </div>

        {/* Col droite */}
        <div>
          {/* Groupes serveurs */}
          <div style={s.card(th.accent)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={s.secTitle}>Serveurs <span style={{fontSize:9,color:th.t3,fontWeight:400}}>(interfaces par serveur)</span></div>
              <button onClick={addGroup} style={{cursor:"pointer",fontSize:11,padding:"4px 12px",borderRadius:4,border:`1px solid ${th.accent}`,background:`${th.accent}15`,color:th.accent,fontFamily:"Inter, sans-serif"}}>+ Groupe</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"2fr 48px 40px 40px 40px 40px 24px",gap:4,marginBottom:6}}>
              {[{h:"Groupe",align:"left"},{h:"Qté",align:"center"},{h:"1G",align:"center"},{h:"10G",align:"center"},{h:"25G",align:"center"},{h:"Mgmt",align:"center"},{h:"",align:"center"}].map((col,i)=>(
                <div key={i} style={{fontSize:9,color:th.t3,fontFamily:"Inter, sans-serif",textTransform:"uppercase",textAlign:col.align}}>
                  {col.h}
                </div>
              ))}
            </div>
            {serverGroups.map(g=>(
              <div key={g.id} style={{display:"grid",gridTemplateColumns:"2fr 48px 40px 40px 40px 40px 24px",gap:4,marginBottom:6,alignItems:"center"}}>
                <input value={g.label} onChange={e=>updateGroup(g.id,{label:e.target.value})}
                  style={{...s.input,padding:"4px 6px",fontSize:11}}/>
                {["qty","ports1g","ports10g","ports25g","portsMgmt"].map(field=>(
                  <input key={field} type="number" min={0} max={field==="qty"?64:8} value={g[field]}
                    onChange={e=>updateGroup(g.id,{[field]:Number(e.target.value)})}
                    style={{...s.input,padding:"4px 2px",fontSize:11,textAlign:"center"}}/>
                ))}
                {serverGroups.length>1
                  ? <button onClick={()=>removeGroup(g.id)} style={{cursor:"pointer",border:"none",background:"none",color:th.danger,fontSize:14,padding:0}}>✕</button>
                  : <div/>}
              </div>
            ))}
            {/* Totaux ports physiques */}
            <div style={{borderTop:`1px solid ${th.border}`,paddingTop:8,marginTop:4}}>
              <div style={{display:"grid",gridTemplateColumns:"2fr 48px 40px 40px 40px 40px 24px",gap:4}}>
                <div style={{fontSize:10,color:th.t3,fontFamily:"Inter, sans-serif"}}>Total ports</div>
                <div style={{fontSize:11,fontWeight:700,color:th.accent,fontFamily:"Inter, sans-serif",textAlign:"center"}}>{totals.tServers}</div>
                <div style={{fontSize:11,fontWeight:700,color:th.t1,fontFamily:"Inter, sans-serif",textAlign:"center"}}>{totals.t1g}</div>
                <div style={{fontSize:11,fontWeight:700,color:th.accent2,fontFamily:"Inter, sans-serif",textAlign:"center"}}>{totals.t10g}</div>
                <div style={{fontSize:11,fontWeight:700,color:th.accent,fontFamily:"Inter, sans-serif",textAlign:"center"}}>{totals.t25g}</div>
                <div style={{fontSize:11,fontWeight:700,color:th.t1,fontFamily:"Inter, sans-serif",textAlign:"center"}}>{totals.tMgmt}</div>
                <div/>
              </div>
              <div style={{fontSize:10,color:th.t3,fontFamily:"Inter, sans-serif",marginTop:4}}>
                BW data totale : {totals.t10g}×10G + {totals.t25g}×25G = {totals.bwEW} Gbps
              </div>
            </div>
          </div>

          {/* Résumé ports + VLANs */}
          <div style={s.card(th.accent2)}>
            <div style={s.secTitle}>Ports recommandés / switch</div>
            {[
              {label:"Ports 1G (Mgmt + iLO + FW)",  val:Math.ceil(totals.portsNeeded1g/(redundancy?2:1))+" ports", color:th.t2},
              {label:"Ports 10G données",             val:Math.ceil(totals.portsNeeded10g/(redundancy?2:1))+" ports",color:th.accent2},
              {label:"Ports 25G données",             val:Math.ceil(totals.portsNeeded25g/(redundancy?2:1))+" ports",color:th.accent},
              {label:"Uplinks core ("+uplinkSpeed+"G×"+uplinkQty+")", val:uplinkQty+"× "+uplinkSpeed+" Gbps",color:"#e05a20"},
              {label:"BW uplink total / switch",      val:totals.bwUplink+" Gbps",                            color:th.t1},
              {label:"BW EW nécessaire (÷"+oversubRatio+")", val:Math.round(totals.bwUplinkNeeded)+" Gbps",   color:totals.bwUplinkNeeded<=totals.bwUplink?th.accent:th.danger},
            ].map(r=>(
              <div key={r.label} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${th.border}`}}>
                <span style={{fontSize:11,color:th.t2}}>{r.label}</span>
                <span style={{fontFamily:"Inter, sans-serif",fontWeight:600,fontSize:12,color:r.color}}>{r.val}</span>
              </div>
            ))}
          </div>

          {/* Segmentation VLAN */}
          <div style={s.card(th.accent2)}>
            <div style={s.secTitle}>Segmentation réseau</div>
            <div style={{display:"grid",gridTemplateColumns:"40px 1fr 60px 60px",gap:4,marginBottom:4}}>
              {["VLAN","Usage","Vitesse","QoS"].map(h=>(
                <div key={h} style={{fontSize:9,color:th.t3,fontFamily:"Inter, sans-serif",textTransform:"uppercase"}}>{h}</div>
              ))}
            </div>
            {vlans.map(v=>(
              <div key={v.id} style={{display:"grid",gridTemplateColumns:"40px 1fr 60px 60px",gap:4,padding:"5px 0",borderBottom:`1px solid ${th.border}`}}>
                <span style={{fontFamily:"Inter, sans-serif",fontWeight:700,fontSize:11,color:th.accent2}}>{v.id}</span>
                <div>
                  <div style={{fontSize:11,fontWeight:600,color:th.t1}}>{v.name}</div>
                  <div style={{fontSize:10,color:th.t3}}>{v.use}</div>
                </div>
                <span style={{fontSize:10,fontFamily:"Inter, sans-serif",color:th.t2,alignSelf:"center"}}>{v.speed}</span>
                <span style={{fontSize:10,fontFamily:"Inter, sans-serif",alignSelf:"center",
                  color:v.qos==="Priority"?"#e05a20":v.qos==="Assured"?th.accent:v.qos==="Low"?th.t3:th.t2}}>
                  {v.qos}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommandations */}
      <div style={{...s.card("#6b7280"),marginTop:14}}>
        <div style={s.secTitle}>Recommandations</div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:8}}>
          {recos.map((r,i)=>(
            <div key={i} style={{
              display:"flex",alignItems:"flex-start",gap:8,padding:"8px 10px",borderRadius:4,
              background:r.type==="ok"?"rgba(59,126,246,0.06)":r.type==="warn"?"rgba(255,181,71,0.08)":"rgba(99,102,241,0.06)",
              border:`1px solid ${r.type==="ok"?"rgba(59,126,246,0.2)":r.type==="warn"?"rgba(255,181,71,0.25)":"rgba(99,102,241,0.2)"}`,
            }}>
              <span style={{fontSize:13,flexShrink:0}}>{r.type==="ok"?"✓":r.type==="warn"?"⚠":"ℹ"}</span>
              <span style={{fontSize:11,color:th.t1,lineHeight:1.5}}>{r.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ─── App Shell ────────────────────────────────────────────────────────────────
const TOOLS=[
  {id:"presales", label:"Pre-Sales Assistant", icon:FileSearch, section:"PRÉ-VENTE",    comp:PreSalesAssistant, badge:"Pre-Sales", sub:"Qualification · Variantes · Export", fullscreen:true},
  {id:"audit",   label:"Infrastructure Audit", icon:FileSearch, section:"ANALYSE",      comp:AuditCalc,   badge:"Audit",     sub:"RVTools · CVE · Analyse IA"},
  {id:"vmware",  label:"VMware / VCF",         icon:Cpu,        section:"SIZING CIBLE", comp:VMwareCalc,  badge:"VVF / VCF", sub:"VVF · VCF · Licence par cœur"},
  {id:"compute", label:"Compute",              icon:BarChart2,  section:"SIZING CIBLE", comp:ComputeCalc, badge:"Compute",   sub:"Serveurs · HA · Sizing"},
  {id:"storage", label:"Capacity Planning",    icon:HardDrive,  section:"SIZING CIBLE", comp:StorageCalc, badge:"Storage",   sub:"SAN · NAS · IOPS · RAID"},
  {id:"veeam",   label:"Veeam Backup",         icon:Shield,     section:"SIZING CIBLE", comp:VeeamCalc,   badge:"Veeam v12", sub:"VBR · Cloud Connect · BaaS"},
  {id:"windows", label:"Windows & SQL",        icon:Server,     section:"SIZING CIBLE", comp:WindowsCalc, badge:"Microsoft", sub:"Packs 2-cœurs · DC / STD"},
  {id:"m365",    label:"Microsoft 365",        icon:Cloud,      section:"SIZING CIBLE", comp:M365Calc,    badge:"M365",      sub:"Sizing par profil utilisateur"},
];

export default 

function SizingHub() {
  const [active,setActive]=useState("vmware");
  const [dark,setDark]=useState(false);
  const [menuOpen,setMenuOpen]=useState(false);
  const isMobile = useIsMobile();
  const th=dark?DARK:LIGHT;
  const tool=TOOLS.find(t=>t.id===active);
  const ActiveComp=tool.comp;
  const sections=[...new Set(TOOLS.map(t=>t.section))];

  return (
    <div style={{fontFamily:"'Inter',system-ui,sans-serif",background:th.bg0,color:th.t1,height:"100vh",overflow:"hidden",display:"flex",transition:"background 0.2s,color 0.2s",position:"relative"}}>
      {/* Burger button mobile */}
      {isMobile&&(
        <button onClick={()=>setMenuOpen(m=>!m)} style={{position:"fixed",top:12,left:12,zIndex:1000,background:th.bg1,border:`1px solid ${th.border}`,borderRadius:6,padding:"8px",cursor:"pointer",color:th.t1,display:"flex",alignItems:"center",justifyContent:"center"}}>
          {menuOpen?<X size={18}/>:<Menu size={18}/>}
        </button>
      )}

      {/* Overlay mobile */}
      {isMobile&&menuOpen&&(
        <div onClick={()=>setMenuOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:998}}/>
      )}

      {/* Sidebar */}
      <div style={{width:isMobile?232:232,minWidth:isMobile?232:232,background:th.sidebarBg,borderRight:"1px solid rgba(255,255,255,0.08)",display:"flex",flexDirection:"column",padding:"18px 12px",transition:"all 0.3s",position:isMobile?"fixed":"sticky",top:0,left:0,height:"100vh",zIndex:999,transform:isMobile&&!menuOpen?"translateX(-100%)":"translateX(0)",overflowY:"auto",boxSizing:"border-box"}}>
        <div style={{padding:"0 4px 18px",borderBottom:"1px solid rgba(255,255,255,0.08)",marginBottom:14}}>
          <div style={{
            display:"flex",
            alignItems:"center",
            gap:10
          }}>
            <div style={{
              width:34,
              height:34,
              borderRadius:10,
              background:"rgba(79,142,247,0.2)",
              border:"1px solid rgba(79,142,247,0.35)",
              display:"flex",
              alignItems:"center",
              justifyContent:"center",
              color:"#4F8EF7",
              fontWeight:800,
              fontSize:15
            }}>
              S
            </div>
            <div>
              <div style={{
                fontSize:16,
                fontWeight:800,
                color:"#ffffff",
                letterSpacing:"0.02em"
              }}>
                SizingHub
              </div>
              <div style={{
                fontSize:10,
                color:"rgba(255,255,255,0.45)",
                marginTop:2,
                letterSpacing:"0.02em"
              }}>
                Infrastructure Sizing
              </div>
            </div>
          </div>
        </div>
        {sections.map(section=>(
          <div key={section}>
            <div style={{
              padding:"12px 8px 6px",
              fontSize:10,
              color:"rgba(255,255,255,0.35)",
              textTransform:"uppercase",
              letterSpacing:"0.12em",
              fontWeight:700
            }}>
              {section}
            </div>
            {TOOLS.filter(t=>t.section===section).map(t=>(
              <div key={t.id} onClick={()=>{setActive(t.id);if(isMobile)setMenuOpen(false);}} style={{
                display:"flex",
                alignItems:"center",
                gap:10,
                padding:"9px 10px",
                margin:"2px 0",
                cursor:"pointer",
                fontSize:13,
                fontWeight:active===t.id?700:500,
                color:active===t.id?"#ffffff":"rgba(255,255,255,0.6)",
                borderRadius:10,
                background:active===t.id?"rgba(79,142,247,0.18)":"transparent",
                border:`1px solid ${active===t.id?"rgba(79,142,247,0.35)":"transparent"}`,
                position:"relative",
                transition:"all 0.15s"
              }}>
                <span style={{
                  width:28,
                  height:28,
                  borderRadius:8,
                  display:"flex",
                  alignItems:"center",
                  justifyContent:"center",
                  background:active===t.id?"rgba(79,142,247,0.25)":"rgba(255,255,255,0.07)",
                  color:active===t.id?"#4F8EF7":"rgba(255,255,255,0.45)",
                  border:`1px solid ${active===t.id?"rgba(79,142,247,0.4)":"rgba(255,255,255,0.1)"}`,
                  flexShrink:0,
                  flexShrink:0
                }}>
                  <t.icon size={15} strokeWidth={2.1} />
                </span>
                <span style={{lineHeight:1.2}}>{t.label}</span>
              </div>
            ))}
          </div>
        ))}
        {/* Toggle dark/light */}
        <div style={{marginTop:"auto",padding:"14px 4px 0",borderTop:"1px solid rgba(255,255,255,0.08)"}}>
          <button onClick={()=>setDark(d=>!d)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"10px 0",borderRadius:10,cursor:"pointer",fontSize:12,fontWeight:600,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.6)",transition:"all 0.2s"}}>
            {dark?<><Sun size={13}/>Light mode</>:<><Moon size={13}/>Dark mode</>}
          </button>
          <div style={{textAlign:"center",fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:12,letterSpacing:"0.04em"}}>by Francis B.</div>
        </div>
      </div>
      {/* Main */}
      <div style={{flex:1,overflow:"hidden",background:th.bg0,transition:"background 0.2s",marginLeft:isMobile?0:undefined,display:"flex",flexDirection:"column"}}>
        {tool.fullscreen
          ? <ActiveComp th={th} isMobile={isMobile} />
          : <div style={{padding:isMobile?"60px 12px 12px":28,overflowY:"auto",flex:1}}>
              <PageHeader title={tool.label} subtitle={tool.sub} badge={tool.badge} th={th} />
              <ActiveComp th={th} isMobile={isMobile} />
            </div>
        }
      </div>
    </div>
  );
}
