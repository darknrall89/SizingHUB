import { useState, useMemo, useRef } from "react";
import {
  Server, HardDrive, Cloud, Cpu, Database, Network,
  BarChart2, Shield, CheckCircle, AlertTriangle,
  Info, Sun, Moon, Menu, X
} from "lucide-react";

function useIsMobile() {
  const [w, setW] = useState(window.innerWidth);
  useState(()=>{
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  });
  return w < 768;
}
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";

// ─── Theme ────────────────────────────────────────────────────────────────────
const DARK = {
  bg0:"#0a0b0d", bg1:"#111318", bg2:"#181b22",
  t1:"#e8eaf0", t2:"#8b90a0", t3:"#4a5068",
  border:"rgba(255,255,255,0.07)", border2:"rgba(0,212,170,0.2)",
  accent:"#00d4aa", accent2:"#0099ff", accent3:"#ff6b35",
  warn:"#ffb347", danger:"#ff5555",
  cardBg:"#111318", inputBg:"#181b22",
  infoBoxBg:"rgba(0,153,255,0.08)", infoBoxBorder:"rgba(0,153,255,0.2)", infoBoxColor:"#7ab8ff",
  okBoxBg:"rgba(0,212,170,0.07)", okBoxBorder:"rgba(0,212,170,0.2)", okBoxColor:"#00d4aa",
  alertBoxBg:"rgba(255,107,53,0.08)", alertBoxBorder:"rgba(255,107,53,0.25)", alertBoxColor:"#ffb347",
  tooltipBg:"#181b22",
};
const LIGHT = {
  bg0:"#f0f2f5", bg1:"#ffffff", bg2:"#f4f5f7",
  t1:"#111318", t2:"#5a6072", t3:"#9aa0b0",
  border:"rgba(0,0,0,0.08)", border2:"rgba(0,168,132,0.3)",
  accent:"#00a884", accent2:"#0077cc", accent3:"#e05a20",
  warn:"#d97706", danger:"#dc2626",
  cardBg:"#ffffff", inputBg:"#f4f5f7",
  infoBoxBg:"rgba(0,119,204,0.07)", infoBoxBorder:"rgba(0,119,204,0.2)", infoBoxColor:"#0077cc",
  okBoxBg:"rgba(0,168,132,0.07)", okBoxBorder:"rgba(0,168,132,0.2)", okBoxColor:"#00a884",
  alertBoxBg:"rgba(217,119,6,0.08)", alertBoxBorder:"rgba(217,119,6,0.25)", alertBoxColor:"#d97706",
  tooltipBg:"#ffffff",
};

const fmt = (n, dec=0) => Number.isFinite(n) ? n.toLocaleString("fr-FR",{maximumFractionDigits:dec}) : "—";

// ─── UI primitives ────────────────────────────────────────────────────────────
function KpiCard({label, value, color, sub, bg, th}) {
  const hasBg = !!bg;
  return (
    <div style={{background:hasBg?bg:th.cardBg, border:hasBg?"none":`1px solid ${th.border}`, borderRadius:8, padding:"14px 16px"}}>
      <div style={{fontSize:10, color:hasBg?"rgba(255,255,255,0.6)":th.t3, fontFamily:"monospace", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4}}>{label}</div>
      <div style={{fontSize:22, fontWeight:700, fontFamily:"monospace", color:hasBg?"#fff":(color||th.accent)}}>{value}</div>
      {sub&&<div style={{fontSize:11, color:hasBg?"rgba(255,255,255,0.7)":th.t3, fontFamily:"monospace", marginTop:3}}>{sub}</div>}
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
  return <div style={{fontSize:10, fontWeight:600, color:th.t2, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:14, paddingBottom:8, borderBottom:`1px solid ${th.border}`, fontFamily:"monospace"}}>{children}</div>;
}

function ResultRow({label, value, highlight, warn, danger, th}) {
  const color = danger ? th.danger : warn ? th.warn : highlight ? th.accent : th.t1;
  return (
    <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${th.border}`}}>
      <span style={{fontSize:12, color:th.t2}}>{label}</span>
      <span style={{fontFamily:"monospace", fontWeight:600, fontSize:13, color}}>{value}</span>
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
    <div style={{background:s.bg, border:`1px solid ${s.border}`, borderRadius:4, padding:"8px 12px", fontSize:11, color:s.color, fontFamily:"monospace", marginBottom:12, display:"flex", gap:8, alignItems:"flex-start"}}>
      <Icon size={13} style={{marginTop:1, flexShrink:0}} /><span>{children}</span>
    </div>
  );
}

function SliderField({label, min, max, step=1, value, onChange, display, th}) {
  return (
    <div style={{marginBottom:14}}>
      <label style={{display:"block", fontSize:10, color:th.t3, fontFamily:"monospace", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:5}}>{label}</label>
      <div style={{display:"flex", alignItems:"center", gap:10}}>
        <input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))} style={{flex:1, accentColor:th.accent}} />
        <span style={{fontFamily:"monospace", fontSize:12, color:th.accent, minWidth:60, textAlign:"right"}}>{display||value}</span>
      </div>
    </div>
  );
}

function NumField({label, min, max, step=1, value, onChange, unit, note, th}) {
  return (
    <div style={{marginBottom:14}}>
      <label style={{display:"block", fontSize:10, color:th.t3, fontFamily:"monospace", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:5}}>{label}</label>
      <div style={{display:"flex", gap:8, alignItems:"center"}}>
        <input type="number" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}
          style={{width:"100%", background:th.inputBg, border:`1px solid ${th.border}`, borderRadius:4, padding:"7px 10px", color:th.t1, fontFamily:"monospace", fontSize:13, boxSizing:"border-box"}} />
        {unit && <span style={{fontSize:11, color:th.t3, whiteSpace:"nowrap"}}>{unit}</span>}
      </div>
      {note && <div style={{fontSize:10, color:th.t3, marginTop:3}}>{note}</div>}
    </div>
  );
}

function SelectField({label, value, onChange, options, th}) {
  return (
    <div style={{marginBottom:14}}>
      <label style={{display:"block", fontSize:10, color:th.t3, fontFamily:"monospace", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:5}}>{label}</label>
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{width:"100%", background:th.inputBg, border:`1px solid ${th.border}`, borderRadius:4, padding:"7px 10px", color:th.t1, fontFamily:"monospace", fontSize:12, boxSizing:"border-box"}}>
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
    return {
      totalSockets,totalPhys,billedPerSocket,totalBilled,totalRamTo,
      vcpuTotal,haRam,haCores,haVcpu,haPct,packs,surcharge,surPct,
      annualCost,annualCostEur,maintenanceCost,totalAnnual,totalProject,totalAnnualEur,totalProjectEur,
      annualCostEur,totalAnnualEur,totalProjectEur,
      optBilled,optAnnual,savingsVsOpt,showOpt,
    };
  },[nodes,sockets,cores,ram,overcommit,pricePerCore,maintenancePct,yearsTotal,fxRate]);

  const tt = {background:th.tooltipBg,border:`1px solid ${th.border2}`,borderRadius:4,fontSize:11,color:th.t1};
  const s = {
    card:     (accent)=>({background:th.cardBg,borderTop:`1px solid ${th.border}`,borderRight:`1px solid ${th.border}`,borderBottom:`1px solid ${th.border}`,borderLeft:accent?`2px solid ${accent}`:`1px solid ${th.border}`,borderRadius:6,padding:16}),
    secTitle: {fontSize:10,fontWeight:600,color:th.t2,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:14,paddingBottom:8,borderBottom:`1px solid ${th.border}`,fontFamily:"monospace"},
    label:    {display:"block",fontSize:10,color:th.t3,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:5},
    input:    {width:"100%",background:th.bg2,border:`1px solid ${th.border}`,borderRadius:4,padding:"7px 10px",color:th.t1,fontFamily:"monospace",fontSize:13,boxSizing:"border-box"},
    select:   {width:"100%",background:th.bg2,border:`1px solid ${th.border}`,borderRadius:4,padding:"7px 10px",color:th.t1,fontFamily:"monospace",fontSize:12,boxSizing:"border-box"},
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
        <span style={{fontSize:12,color:th.t2}}>{label}</span>
        <span style={{fontFamily:"monospace",fontWeight:600,fontSize:13,color:color||th.t1}}>{value}</span>
      </div>
    );
  }

  function KpiC({label,value,sub,bg}) {
    return (
      <div style={{background:bg,borderRadius:8,padding:"14px 16px"}}>
        <div style={{fontSize:22,fontWeight:700,fontFamily:"monospace",color:"#fff"}}>{value}</div>
        {sub&&<div style={{fontSize:11,color:"rgba(255,255,255,0.75)",fontFamily:"monospace",marginTop:2}}>{sub}</div>}
        <div style={{fontSize:10,color:"rgba(255,255,255,0.55)",textTransform:"uppercase",letterSpacing:"0.08em",marginTop:4}}>{label}</div>
      </div>
    );
  }

  return (
    <div>
      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(3,1fr)",gap:10,marginBottom:20}}>
        <KpiC label="Cœurs facturés" value={fmt(r.totalBilled)+" cœurs"} sub={licType.toUpperCase()+" · min 16/socket"} bg="linear-gradient(135deg,#e05a20,#b84510)"/>
        <KpiC label="Coût annuel licences" value={"~ "+fmt(r.annualCost)+" €"} sub={licType.toUpperCase()+" · "+fmt(r.totalBilled)+" cœurs × "+pricePerCore+" €"} bg="linear-gradient(135deg,#5a4fcf,#3d35a0)"/>
        <KpiC label={"Coût total "+yearsTotal+" ans"} value={"~ "+fmt(r.totalProject)+" €"} sub={"Licences + maintenance "+maintenancePct+"%"} bg="linear-gradient(135deg,#2d7a4f,#1a5c38)"/>
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
        <div style={s.card("#ff6b35")}>
          <div style={s.secTitle}>Impact financier</div>
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
          <hr style={s.divider}/>
          <div style={{fontSize:10,fontWeight:600,color:th.t2,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10,fontFamily:"monospace"}}>Optimisation licensing</div>
          {r.showOpt?(
            <div style={{background:"rgba(255,181,71,0.08)",border:"1px solid rgba(255,181,71,0.25)",borderRadius:4,padding:"10px 12px"}}>
              <div style={{fontSize:12,color:"#ffb347",fontFamily:"monospace",fontWeight:600,marginBottom:6}}>
                ⚠ CPUs à {cores} cœurs/socket — Broadcom facture 16 minimum
              </div>
              <div style={{fontSize:11,color:th.t2,marginBottom:6}}>
                Vous payez {fmt(r.totalBilled)} cœurs pour {fmt(r.totalPhys)} cœurs physiques réels ({r.surPct}% de surcoût).
              </div>
              <div style={{padding:"6px 10px",background:th.bg2,borderRadius:3,fontSize:11,color:th.t1,fontFamily:"monospace"}}>
                💡 Conseil : choisir des CPUs à 16 cœurs/socket vous donnerait plus de puissance au même prix Broadcom.
              </div>
            </div>
          ):(
            <div style={{background:"rgba(0,212,170,0.07)",border:"1px solid rgba(0,212,170,0.2)",borderRadius:4,padding:"10px 12px",fontSize:11,color:th.accent}}>
              ✓ Configuration optimale — cœurs physiques ≥ 16/socket, aucun surcoût Broadcom
            </div>
          )}
          <div style={{marginTop:10,fontSize:10,color:th.t3,fontFamily:"monospace"}}>
            Minimum commande : 72 cœurs · Renouvellement tardif : +20%
          </div>
        </div>

        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {/* Résultats licensing */}
        <div style={s.card(th.accent2)}>
          <div style={s.secTitle}>Résultats licensing</div>
          {r.surcharge&&(
            <div style={{background:"rgba(255,181,71,0.1)",border:"1px solid rgba(255,181,71,0.3)",borderRadius:4,padding:"8px 12px",marginBottom:12,fontSize:11,color:"#ffb347",fontFamily:"monospace"}}>
              ⚠ {fmt(r.totalBilled)} cœurs facturés — minimum 16/socket appliqué
            </div>
          )}
          <RR label="Total sockets"       value={fmt(r.totalSockets)+" sockets"}/>
          <RR label="Cœurs physiques"     value={fmt(r.totalPhys)+" cœurs"}/>
          <RR label="Min Broadcom/socket" value={fmt(r.billedPerSocket)+" cœurs"}/>
          <RR label="Cœurs facturés"      value={fmt(r.totalBilled)+" cœurs"} color={r.surcharge?"#ffb347":th.accent} highlight/>
          <RR label="Packs 2-cœurs"       value={fmt(r.packs)+" packs"} color={th.accent}/>
        </div>
      {/* Tableau VVF vs VCF */}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14,marginBottom:14}}>
        {[
          {id:"vvf",name:"VMware VVF",sub:"vSphere Foundation",priceRef:50,color:"#0099ff",features:[
            {label:"vSphere (ESXi + vCenter)",ok:true},
            {label:"vSAN (stockage HCI)",ok:false,note:"Add-on payant"},
            {label:"NSX (réseau SDN)",ok:false,note:"Non inclus"},
            {label:"Aria Suite (management)",ok:false,note:"Non inclus"},
            {label:"Tanzu (containers)",ok:false,note:"Non inclus"},
            {label:"vSAN inclus / cœur",ok:false,note:"0 TiB"},
            {label:"Prix public / cœur / an",ok:true,note:"~46 €"},
            {label:"Idéal pour",ok:true,note:"SAN/NAS existant"},
          ]},
          {id:"vcf",name:"VMware VCF",sub:"Cloud Foundation",priceRef:72,color:"#ff6b35",features:[
            {label:"vSphere (ESXi + vCenter)",ok:true},
            {label:"vSAN (stockage HCI)",ok:true,note:"0,25 TiB/cœur inclus"},
            {label:"NSX (réseau SDN)",ok:true,note:"Full stack"},
            {label:"Aria Suite (management)",ok:true,note:"Opérations + Logs"},
            {label:"Tanzu (containers)",ok:true,note:"Kubernetes intégré"},
            {label:"vSAN inclus / cœur",ok:true,note:"0,25 TiB/cœur"},
            {label:"Prix public / cœur / an",ok:true,note:"~66 €"},
            {label:"Idéal pour",ok:true,note:"Stack full SDDC"},
          ]},
        ].map(lic=>{
          const annual = r.totalBilled * (lic.id === licType ? pricePerCore : lic.priceRef);
          const isActive = licType === lic.id;
          return (
            <div key={lic.id} style={{background:th.cardBg,borderRadius:6,padding:16,border:`2px solid ${isActive?lic.color:th.border}`,opacity:isActive?1:0.8}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:lic.color,fontFamily:"monospace"}}>{lic.name}</div>
                  <div style={{fontSize:11,color:th.t3,fontFamily:"monospace"}}>{lic.sub}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:18,fontWeight:700,fontFamily:"monospace",color:lic.color}}>~ {fmt(Math.round(annual))} €</div>
                  <div style={{fontSize:10,color:th.t3,fontFamily:"monospace"}}>/ an · {fmt(r.totalBilled)} cœurs</div>
                </div>
              </div>
              <hr style={s.divider}/>
              {lic.features.map((f,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${th.border}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:12,color:f.ok?th.accent:th.danger,fontWeight:700}}>{f.ok?"✓":"✗"}</span>
                    <span style={{fontSize:12,color:th.t2}}>{f.label}</span>
                  </div>
                  {f.note&&<span style={{fontSize:11,color:f.ok?th.t1:th.t3,fontFamily:"monospace"}}>{f.note}</span>}
                </div>
              ))}
              {isActive&&<div style={{marginTop:10,padding:"6px 10px",background:`${lic.color}15`,borderRadius:4,fontSize:11,color:lic.color,fontFamily:"monospace",textAlign:"center",border:`1px solid ${lic.color}33`}}>← Licence sélectionnée</div>}
            </div>
          );
        })}
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
    let wsLicenses,wsComment;
    if(wsEdition==="datacenter"){wsLicenses=servers*packsPerServer;wsComment="Datacenter : VMs illimitées par serveur licencié";}
    else{wsLicenses=Math.ceil(vms/2)*packsPerServer;wsComment=`Standard : 2 VMs par licence → ${Math.ceil(vms/2)} licences requises`;}
    const sqlPacksPerInst=Math.max(4,Math.ceil(sqlCores/2));
    return {effective,packsPerServer,wsLicenses,wsComment,sqlPacksPerInst,sqlLicenses:sqlInstances*sqlPacksPerInst};
  },[servers,coresPerServer,vms,wsEdition,sqlInstances,sqlCores,sqlEdition]);

  const sqlWarn=sqlEdition==="standard"&&sqlCores>24;
  return (
    <div>
      <InfoBox th={th}>Windows Server vendu par packs de 2 cœurs, minimum 16 cœurs/serveur. Datacenter = VMs illimitées. Standard = 2 VMs/licence.</InfoBox>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(5,1fr)",gap:10,marginBottom:20}}>
        <KpiCard label="Packs WS" value={fmt(r.wsLicenses)} sub={servers+" serveurs × "+coresPerServer+" cœurs"} bg="linear-gradient(135deg,#0077cc,#005599)" th={th} />
        <KpiCard label="Packs SQL" value={fmt(r.sqlLicenses)} sub={sqlInstances+" instances SQL"} bg="linear-gradient(135deg,#5a4fcf,#3d35a0)" th={th} />
        <KpiCard label="VMs couvertes" value={wsEdition==="datacenter"?"Illimitées":fmt(vms)} sub={wsEdition==="datacenter"?"Datacenter":"Standard"} bg="linear-gradient(135deg,#00a884,#007a60)" th={th} />
        <KpiCard label="Statut SQL" value={sqlWarn?"⚠ WARN":"✓ OK"} sub={sqlWarn?"Limite Standard dépassée":"Configuration valide"} bg={sqlWarn?"linear-gradient(135deg,#d97706,#b45309)":"linear-gradient(135deg,#00a884,#007a60)"} th={th} />
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
          <ResultRow label="Cœurs effectifs/serveur" value={fmt(r.effective)+" cœurs"} th={th} />
          <ResultRow label="Packs 2-cœurs/serveur" value={fmt(r.packsPerServer)+" packs"} th={th} />
          <ResultRow label="Packs Windows Server" value={fmt(r.wsLicenses)+" packs"} highlight th={th} />
          <div style={{fontSize:10,color:th.t3,marginTop:8,fontFamily:"monospace"}}>{r.wsComment}</div>
        </Card>
        <Card accent="accent2" th={th}>
          <SectionTitle th={th}>SQL Server</SectionTitle>
          <NumField label="Instances SQL" value={sqlInstances} onChange={setSqlInstances} min={1} max={100} unit="instances" th={th} />
          <NumField label="Cœurs / instance" value={sqlCores} onChange={setSqlCores} min={4} max={128} step={2} unit="cœurs" th={th} />
          <SelectField label="Édition SQL" value={sqlEdition} onChange={setSqlEdition} th={th}
            options={[{value:"standard",label:"Standard (max 24c, 128 Go RAM)"},{value:"enterprise",label:"Enterprise (illimité)"}]} />
          <hr style={{border:"none",borderTop:`1px solid ${th.border}`,margin:"12px 0"}} />
          <InfoBox type={sqlWarn?"alert":"ok"} th={th}>{sqlWarn?"SQL Standard limité à 24 cœurs — envisager Enterprise":"Configuration SQL validée"}</InfoBox>
          <ResultRow label="Packs 2-cœurs / instance" value={fmt(r.sqlPacksPerInst)+" packs"} th={th} />
          <ResultRow label="Packs SQL Server total" value={fmt(r.sqlLicenses)+" packs"} highlight th={th} />
          <div style={{fontSize:10,color:th.t3,marginTop:8,fontFamily:"monospace"}}>{sqlEdition==="standard"?"Standard : 4 cœurs min/instance, max 24c et 128 Go RAM":"Enterprise : pas de limite de cœurs ou RAM"}</div>
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
          <label style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:th.t2,cursor:"pointer"}}>
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

const TYPE_COLORS = { NLSAS:"#8b90a0", SAS:"#0099ff", SSD:"#00d4aa", NVMe:"#ff6b35" };

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

function calcGroup(g, catalog) {
  const disk = catalog.find(d=>d.id===g.diskId)||catalog[0];
  const dataDisks = Math.max(0, g.count - g.hotSpares);
  const eff = raidEff(g.raid, dataDisks);
  const iopsWritePenalty = g.raid==="raid5"?0.75:g.raid==="raid6"?0.65:1;
  return {
    disk,
    physical: g.count * disk.cap,
    usable: dataDisks * disk.cap * eff,
    iops: Math.round(dataDisks * disk.iops * iopsWritePenalty),
    bw: dataDisks * disk.bw,
    eff,
  };
}

function StorageCalc({ th, isMobile=false }) {
  const [chassisList, setChassisList] = useState([newChassis("3.5-12")]);
  const [dedup, setDedup] = useState(1);
  const [iopsTarget,     setIopsTarget]     = useState(50000);
  const [capacityTarget, setCapacityTarget] = useState(100);
  const [storageTab,     setStorageTab]     = useState('classic'); // 'classic' | 'vendor' | 'hci'
  // HCI états
  const [hciVms,         setHciVms]         = useState(100);
  const [hciVcpu,        setHciVcpu]        = useState(4);
  const [hciRam,         setHciRam]         = useState(16);
  const [hciStorage,     setHciStorage]     = useState(200);
  const [hciGrowth,      setHciGrowth]      = useState(20);
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

  const totals = useMemo(()=>{
    let physical=0,usable=0,iops=0,bw=0;
    chassisList.forEach(c=>{
      const catalog=DISK_CATALOG[c.form];
      c.groups.forEach(g=>{
        const r=calcGroup(g,catalog);
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
  },[chassisList,dedup,iopsTarget,capacityTarget]);

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
  },[chassisList,dedup,iopsTarget,totals]);

  const tt = { background:th.tooltipBg, border:`1px solid ${th.border2}`, borderRadius:4, fontSize:11, color:th.t1 };

  const s = {
    card: (accent) => ({ background:th.cardBg, borderTop:`1px solid ${th.border}`,borderRight:`1px solid ${th.border}`,borderBottom:`1px solid ${th.border}`,borderLeft:accent?`2px solid ${accent}`:`1px solid ${th.border}`, borderRadius:6, padding:16, marginBottom:14 }),
    groupRow: { background:th.bg2, border:`1px solid ${th.border}`, borderRadius:4, padding:"10px 14px", marginBottom:8 },
    label: { display:"block", fontSize:10, color:th.t3, fontFamily:"monospace", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 },
    input: { width:"100%", background:th.bg1, border:`1px solid ${th.border}`, borderRadius:4, padding:"6px 8px", color:th.t1, fontFamily:"monospace", fontSize:12, boxSizing:"border-box" },
    select: { width:"100%", background:th.bg1, border:`1px solid ${th.border}`, borderRadius:4, padding:"6px 8px", color:th.t1, fontFamily:"monospace", fontSize:12, boxSizing:"border-box" },
    btn: (color) => ({ cursor:"pointer", fontSize:11, padding:"5px 12px", borderRadius:4, border:`1px solid ${color}44`, background:`${color}11`, color, fontFamily:"monospace" }),
    btnSm: (color) => ({ cursor:"pointer", fontSize:10, padding:"3px 8px", borderRadius:3, border:`1px solid ${color}44`, background:`${color}11`, color, fontFamily:"monospace" }),
    secTitle: { fontSize:10, fontWeight:600, color:th.t2, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12, paddingBottom:8, borderBottom:`1px solid ${th.border}`, fontFamily:"monospace" },
    tag: (color) => ({ display:"inline-block", fontSize:9, padding:"2px 6px", borderRadius:3, background:`${color}22`, color, border:`1px solid ${color}44`, fontFamily:"monospace", marginLeft:6 }),
    divider: { border:"none", borderTop:`1px solid ${th.border}`, margin:"12px 0" },
    miniVal: (color) => ({ fontSize:13, fontWeight:600, fontFamily:"monospace", color:color||th.t1 }),
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
            padding:"8px 18px", fontSize:12, fontFamily:"monospace", fontWeight:600,
            color:storageTab===tab.id?th.accent:th.t3,
            borderBottom:storageTab===tab.id?`2px solid ${th.accent}`:"2px solid transparent",
            marginBottom:-2, transition:"all 0.15s",
            textTransform:"uppercase", letterSpacing:"0.08em",
          }}>{tab.icon} {tab.label}</button>
        ))}
      </div>

      {storageTab==="classic"&&(
        <div>
      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(5,1fr)",gap:10,marginBottom:14}}>
        {[
          {label:"Évolutivité",sub:"Slots disponibles",val:fmt(totals.freeSlots)+" slots",sub2:totals.usedSlots+" / "+totals.totalSlots+" utilisés",bg:"linear-gradient(135deg,#5a4fcf,#3d35a0)"},
          {label:"Capacité utile",sub:"Après RAID",val:fmt(totals.usable,1)+" To",sub2:fmt(totals.physical,1)+" To brut",bg:"linear-gradient(135deg,#0077cc,#005599)"},
          {label:"Capacité effective",sub:"Après dédup",val:fmt(totals.effective,1)+" To",sub2:(totals.capOk?"+":"")+fmt(totals.capDelta,1)+" To vs "+fmt(capacityTarget,0)+" To cible",bg:totals.capOk?"linear-gradient(135deg,#00a884,#007a60)":"linear-gradient(135deg,#cc3333,#991111)"},
          {label:"Conformité IOPS",sub:totals.iopsOk?"✓ Objectif atteint":"⚠ Insuffisant",val:fmt(totals.iops),sub2:(totals.iopsOk?"+":"")+fmt(totals.iopsDelta)+" vs "+fmt(iopsTarget)+" requis",bg:totals.iopsOk?"linear-gradient(135deg,#00a884,#007a60)":"linear-gradient(135deg,#d97706,#b45309)"},
        ].map(k=>(
          <div key={k.label} style={{background:k.bg,borderRadius:8,padding:"14px 16px"}}>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.6)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>{k.label}</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",marginBottom:4}}>{k.sub}</div>
            <div style={{fontSize:20,fontWeight:700,fontFamily:"monospace",color:"#fff"}}>{k.val}</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.7)",fontFamily:"monospace",marginTop:3}}>{k.sub2}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"3fr 2fr",gap:14,alignItems:"start"}}>
        <div>
          <div style={{background:th.cardBg,borderTop:`1px solid ${th.border}`,borderRight:`1px solid ${th.border}`,borderBottom:`1px solid ${th.border}`,borderLeft:`2px solid ${th.accent2}`,borderRadius:6,padding:16,marginBottom:14}}>
            <div style={s.secTitle}>Paramètres du pool</div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:10,marginBottom:12}}>
              <div>
                <label style={s.label}>Capacité cible (To)</label>
                <input type="number" min={1} step={10} value={capacityTarget} onChange={e=>setCapacityTarget(Number(e.target.value))} style={s.input}/>
              </div>
              <div>
                <label style={s.label}>IOPS cibles</label>
                <input type="number" min={1000} step={5000} value={iopsTarget} onChange={e=>setIopsTarget(Number(e.target.value))} style={s.input}/>
              </div>
              <div>
                <label style={s.label}>Déduplication / Compression</label>
                <select value={String(dedup)} onChange={e=>setDedup(Number(e.target.value))} style={s.select}>
                  {[["1","1:1 — aucune"],["1.5","1.5:1 — légère"],["2","2:1 — standard"],["3","3:1 — agressive"],["4","4:1 — maximale"],["5","5:1 — extrême"]].map(([v,l])=>
                    <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <span style={{fontSize:10,color:th.t3,fontFamily:"monospace",textTransform:"uppercase",alignSelf:"center"}}>Simulation :</span>
              <button onClick={()=>setChassisList(prev=>prev.map(c=>({...c,groups:c.groups.map(g=>({...g,count:g.count+2}))})))} style={s.btnSm(th.warn)}>+2 disques/groupe</button>
              <button onClick={()=>setChassisList(prev=>[...prev,{...prev[prev.length-1],id:Date.now()}])} style={s.btnSm(th.accent2)}>+1 chassis</button>
              <button onClick={()=>setChassisList(prev=>prev.map(c=>({...c,groups:c.groups.map(g=>({...g,diskId:"ssd-384"}))})))} style={s.btnSm(th.accent)}>→ SSD 3,84 To</button>
            </div>
          </div>
          {chassisList.map((chassis,ci)=>{
            const catalog=DISK_CATALOG[chassis.form];
            const usedSlots=chassis.groups.reduce((s,g)=>s+g.count,0);
            const remain=chassis.slots-usedSlots;
            return (
              <div key={chassis.id} style={s.card(th.accent)}>
                {/* Header chassis */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                    <span style={{fontSize:13,fontWeight:600,color:th.t1,fontFamily:"monospace"}}>Châssis {ci+1}</span>
                    <select value={chassis.typeId} onChange={e=>updateChassisType(chassis.id,e.target.value)}
                      style={{...s.select,width:"auto"}}>
                      {CHASSIS_TYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                    <span style={{fontSize:10,color:remain<0?th.danger:th.t3,fontFamily:"monospace"}}>
                      {usedSlots}/{chassis.slots} baies
                    </span>
                    {chassis.groups.map(g=>{
                      const disk=catalog.find(d=>d.id===g.diskId)||catalog[0];
                      return <span key={g.id} style={s.tag(TYPE_COLORS[disk.type]||th.t2)}>{disk.type}</span>;
                    })}
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>addGroup(chassis.id)} style={s.btnSm(th.accent)}>+ Groupe</button>
                    {chassisList.length>1 && <button onClick={()=>removeChassis(chassis.id)} style={s.btnSm(th.danger)}>✕</button>}
                  </div>
                </div>

                {/* Groupes */}
                {chassis.groups.map((group,gi)=>{
                  const disk=catalog.find(d=>d.id===group.diskId)||catalog[0];
                  const gr=calcGroup(group,catalog);
                  return (
                    <div key={group.id} style={s.groupRow}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                        <span style={{fontSize:11,fontWeight:600,color:th.t2,fontFamily:"monospace"}}>
                          Groupe {gi+1}
                          <span style={s.tag(TYPE_COLORS[disk.type]||th.t2)}>{disk.type}</span>
                          <span style={{...s.tag(th.t3),marginLeft:4}}>{group.count} disques</span>
                          <span style={{...s.tag(th.accent2),marginLeft:4}}>{group.raid.toUpperCase()}</span>
                        </span>
                        {chassis.groups.length>1 && <button onClick={()=>removeGroup(chassis.id,group.id)} style={s.btnSm(th.danger)}>✕</button>}
                      </div>

                      {/* Saisie groupe */}
                      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:8,marginBottom:10}}>
                        <div>
                          <label style={s.label}>Type de disque</label>
                          <select value={group.diskId} onChange={e=>updateGroup(chassis.id,group.id,{diskId:e.target.value})} style={s.select}>
                            {catalog.map(d=><option key={d.id} value={d.id}>{d.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={s.label}>Nb disques</label>
                          <input type="number" min={1} max={chassis.slots} value={group.count}
                            onChange={e=>updateGroup(chassis.id,group.id,{count:Math.max(1,Number(e.target.value))})} style={s.input} />
                        </div>
                        <div>
                          <label style={s.label}>Niveau RAID</label>
                          <select value={group.raid} onChange={e=>updateGroup(chassis.id,group.id,{raid:e.target.value})} style={s.select}>
                            {RAID_OPTIONS.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={s.label}>Hot spares</label>
                          <input type="number" min={0} max={Math.max(0,group.count-1)} value={group.hotSpares}
                            onChange={e=>updateGroup(chassis.id,group.id,{hotSpares:Math.max(0,Number(e.target.value))})} style={s.input} />
                        </div>
                      </div>

                      {/* Résumé inline groupe */}
                      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
                        {[
                          {label:"Disques",  val:fmt(group.count)+" disques",       color:th.t2},
                          {label:"Utile",    val:fmt(gr.usable,2)+" To",            color:th.accent},
                          {label:"IOPS",     val:fmt(gr.iops),                      color:TYPE_COLORS[disk.type]||th.t1},
                          {label:"BW",       val:fmt(gr.bw,2)+" GB/s",             color:th.accent2},
                        ].map(k=>(
                          <div key={k.label} style={{background:th.bg0,borderRadius:4,padding:"6px 8px",border:`1px solid ${th.border}`}}>
                            <div style={{fontSize:9,color:th.t3,fontFamily:"monospace",textTransform:"uppercase",marginBottom:3}}>{k.label}</div>
                            <div style={s.miniVal(k.color)}>{k.val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          <button onClick={addChassis} style={{...s.btn(th.accent),width:"100%",marginBottom:14}}>+ Ajouter un châssis</button>

          {/* Paramètres globaux */}
          <div style={s.card(th.accent2)}>
            <div style={s.secTitle}>Paramètres globaux du pool</div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14}}>
              <div>
                <label style={s.label}>Ratio déduplication / compression</label>
                <select value={String(dedup)} onChange={e=>setDedup(Number(e.target.value))} style={s.select}>
                  {[["1","1:1 — aucune"],["1.5","1.5:1 — légère"],["2","2:1 — standard"],["3","3:1 — agressive"],["4","4:1 — maximale"],["5","5:1 — extrême"]].map(([v,l])=>
                    <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>IOPS cibles (validation)</label>
                <input type="number" min={1000} step={5000} value={iopsTarget}
                  onChange={e=>setIopsTarget(Number(e.target.value))} style={s.input} />
              </div>
            </div>
          </div>


          {/* Recommandations */}
          {recommendations.length>0 && (
            <div style={s.card()}>
              <div style={s.secTitle}>Recommandations</div>
              {recommendations.map((rec,i)=>(
                <div key={i} style={{
                  display:"flex", alignItems:"flex-start", gap:10, padding:"8px 10px",
                  borderRadius:4, marginBottom:8,
                  background:rec.ok?`rgba(0,212,170,0.06)`:`rgba(255,181,71,0.08)`,
                  border:`1px solid ${rec.ok?"rgba(0,212,170,0.2)":"rgba(255,181,71,0.25)"}`,
                }}>
                  <span style={{fontSize:13,marginTop:1}}>{rec.ok?"✓":"⚠"}</span>
                  <span style={{fontSize:12,color:rec.ok?th.accent:th.warn,lineHeight:1.5}}>{rec.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>


        {/* Colonne droite */}
        <div>
          <div style={{background:th.cardBg,borderTop:`1px solid ${th.border}`,borderRight:`1px solid ${th.border}`,borderBottom:`1px solid ${th.border}`,borderLeft:`2px solid ${th.accent2}`,borderRadius:6,padding:16}}>
            <div style={s.secTitle}>Résultats par pool</div>
            {[
              {label:"Capacité physique brute",   val:fmt(totals.physical,2)+" To",  color:th.t2},
              {label:"Capacité utile après RAID",  val:fmt(totals.usable,2)+" To",   color:th.accent},
              {label:`Effective après dédup ×${dedup}`, val:fmt(totals.effective,2)+" To", color:dedup>1?th.accent:th.t2},
              {label:"IOPS agrégés",              val:fmt(totals.iops),              color:totals.iopsOk?th.t1:th.warn},
              {label:"Validation IOPS cible",     val:totals.iopsOk?"✓ Atteints":"✗ Insuffisants", color:totals.iopsOk?th.accent:th.danger},
              {label:"Bande passante totale",     val:fmt(totals.bw,2)+" GB/s",     color:th.accent2},
            ].map(r=>(
              <div key={r.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${th.border}`}}>
                <span style={{fontSize:12,color:th.t2}}>{r.label}</span>
                <span style={{fontFamily:"monospace",fontWeight:600,fontSize:13,color:r.color}}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
        </div>
      )}

      {storageTab==="vendor"&&(()=>{
          const VENDORS = {
            dell: {
              label:"Dell", color:"#0076CE",
              models: {
                powerstore: {
                  label:"PowerStore", protection:"DRE (Dynamic Resilience Engine)",
                  overheadMin:10, overheadMax:15, overheadDefault:12,
                  hasDedup:true, dedupDefault:2.5, useDreCalc:true,
                  raids:[
                    {id:"dre_sp_8_1",label:"DRE SP — 8+1",dataDisks:8,parityDisks:1,spareDisks:1},
                    {id:"dre_dp_8_2",label:"DRE DP — 8+2",dataDisks:8,parityDisks:2,spareDisks:1},
                    {id:"dre_dp_16_2",label:"DRE DP — 16+2",dataDisks:16,parityDisks:2,spareDisks:1},
                  ],
                  note:"Formule Dell officielle KB000188491."
                },
                powervault: {
                  label:"PowerVault", protection:"RAID Adapt",
                  overheadMin:15, overheadMax:20, overheadDefault:17,
                  hasDedup:false, dedupDefault:1.0,
                  raids:[{id:"adapt",label:"RAID Adapt (dynamique)",factor:0.17}],
                  note:"RAID Adapt : overhead diminue avec le nombre de disques. Pas de dédup natif."
                },
              }
            },
            hpe: {
              label:"HPE", color:"#01A982",
              models: {
                alletra: {
                  label:"Alletra / Primera", protection:"RAID 6 double parité",
                  overheadMin:25, overheadMax:30, overheadDefault:27,
                  hasDedup:true, dedupDefault:3.0,
                  raids:[{id:"r6",label:"RAID 6 (6+2)",factor:2/8},{id:"r6_4",label:"RAID 6 (4+2)",factor:2/6}],
                  note:"Dédup/compression inline. RAID 6 optimisé NVMe."
                },
                nimble: {
                  label:"Nimble", protection:"RAID triple parité",
                  overheadMin:25, overheadMax:30, overheadDefault:27,
                  hasDedup:true, dedupDefault:3.5,
                  raids:[{id:"r6tp",label:"RAID 6 triple parité",factor:3/9}],
                  note:"Dédup/compression inline très efficace. CASL architecture."
                },
                msa: {
                  label:"MSA", protection:"RAID DP+",
                  overheadMin:25, overheadMax:25, overheadDefault:25,
                  hasDedup:false, dedupDefault:1.0,
                  raids:[{id:"rdp",label:"RAID DP+ (double parité)",factor:2/8}],
                  note:"Pas de dédup natif. Overhead fixe 25%. Solution entrée de gamme."
                },
              }
            },
            huawei: {
              label:"Huawei", color:"#CF0A2C",
              models: {
                dorado: {
                  label:"OceanStor Dorado", protection:"RAID-TP triple parité",
                  overheadMin:25, overheadMax:30, overheadDefault:28,
                  hasDedup:true, dedupDefault:3.0,
                  raids:[{id:"raidtp",label:"RAID-TP (triple parité)",factor:3/9}],
                  note:"RAID-TP : résistance à 3 pannes simultanées. Dédup inline toujours actif."
                },
                pacific: {
                  label:"OceanStor Pacific", protection:"Erasure Coding",
                  overheadMin:20, overheadMax:33, overheadDefault:25,
                  hasDedup:true, dedupDefault:2.0,
                  raids:[
                    {id:"ec42",label:"EC 4+2 (overhead 33%)",factor:2/6},
                    {id:"ec82",label:"EC 8+2 (overhead 20%)",factor:2/10},
                    {id:"ec122",label:"EC 12+2 (overhead 14%)",factor:2/14},
                  ],
                  note:"Erasure Coding configurable. Idéal pour gros volumes objets/fichiers."
                },
              }
            },
          };

          const vendor = VENDORS[vVendor];
          const model  = vendor?.models[vModel];
          const raid   = model?.raids.find(r=>r.id===vRaid)||model?.raids[0];

          const rawTB    = vDisks * vDiskCap;
          const overheadF = vOverhead/100;
          let usable; let dreInfo=null;
          if(model?.useDreCalc&&raid?.dataDisks){const tot=raid.dataDisks+raid.parityDisks+raid.spareDisks;const nb=Math.floor(vDisks/tot);const dreRaw=nb*raid.dataDisks*vDiskCap;usable=dreRaw*(1-overheadF);dreInfo={nb,used:nb*tot,unused:vDisks-nb*tot,dreRaw};}
          else{usable=rawTB*(1-overheadF)*(1-(raid?.factor||0));}
          const effective = (model?.hasDedup && vVendorDedup) ? usable * vDedupRatio : usable;
          const savedDedup= (model?.hasDedup && vVendorDedup) ? effective - usable : 0;
          const pctUsed   = vTarget > 0 ? Math.round((vTarget/effective)*100) : 0;
          const ok        = effective >= vTarget;

          // KPIs constructeur
          const vendorKpis = [
            {label:"Capacité physique",sub:`${vDisks} disques × ${vDiskCap} TB`,val:rawTB.toFixed(1)+" TB",bg:"linear-gradient(135deg,#0077cc,#005599)"},
            {label:"Capacité utile",sub:`Après overhead ${vOverhead}%`,val:usable.toFixed(1)+" TB",bg:"linear-gradient(135deg,#5a4fcf,#3d35a0)"},
            {label:"Capacité effective",sub:(model?.hasDedup&&vVendorDedup)?`Dédup ×${vDedupRatio}`:"Sans dédup",val:effective.toFixed(1)+" TB",bg:effective>=vTarget?"linear-gradient(135deg,#00a884,#007a60)":"linear-gradient(135deg,#cc3333,#991111)"},
            {label:"Objectif atteint",sub:`Cible : ${vTarget} TB`,val:effective>=vTarget?"✓ Oui":"✗ Non",bg:effective>=vTarget?"linear-gradient(135deg,#00a884,#007a60)":"linear-gradient(135deg,#d97706,#b45309)"},
          ];
          return (
            <div>
              {/* KPIs */}
              <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(5,1fr)",gap:10,marginBottom:14}}>
                {vendorKpis.map(k=>(
                  <div key={k.label} style={{background:k.bg,borderRadius:8,padding:"14px 16px"}}>
                    <div style={{fontSize:10,color:"rgba(255,255,255,0.6)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>{k.label}</div>
                    <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",marginBottom:4}}>{k.sub}</div>
                    <div style={{fontSize:20,fontWeight:700,fontFamily:"monospace",color:"#fff"}}>{k.val}</div>
                  </div>
                ))}
              </div>
            <div style={{background:th.cardBg,border:`1px solid ${th.border}`,borderRadius:6,padding:16}}>
              {/* Sélecteur constructeur */}
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr 1fr",gap:10,marginBottom:16}}>
                <div>
                  <label style={{display:"block",fontSize:10,color:th.t3,fontFamily:"monospace",textTransform:"uppercase",marginBottom:5}}>Constructeur</label>
                  <select value={vVendor} onChange={e=>{setVVendor(e.target.value);const first=Object.keys(VENDORS[e.target.value].models)[0];setVModel(first);const m=VENDORS[e.target.value].models[first];setVRaid(m.raids[0].id);setVOverhead(m.overheadDefault);setVDedupRatio(m.dedupDefault);setVVendorDedup(m.hasDedup);}} style={{width:"100%",background:th.bg2,border:`1px solid ${th.border}`,borderRadius:4,padding:"7px 10px",color:th.t1,fontFamily:"monospace",fontSize:12,boxSizing:"border-box"}}>
                    {Object.entries(VENDORS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{display:"block",fontSize:10,color:th.t3,fontFamily:"monospace",textTransform:"uppercase",marginBottom:5}}>Modèle de baie</label>
                  <select value={vModel} onChange={e=>{setVModel(e.target.value);const m=vendor.models[e.target.value];setVRaid(m.raids[0].id);setVOverhead(m.overheadDefault);setVDedupRatio(m.dedupDefault);setVVendorDedup(m.hasDedup);}} style={{width:"100%",background:th.bg2,border:`1px solid ${th.border}`,borderRadius:4,padding:"7px 10px",color:th.t1,fontFamily:"monospace",fontSize:12,boxSizing:"border-box"}}>
                    {Object.entries(vendor.models).map(([k,m])=><option key={k} value={k}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{display:"block",fontSize:10,color:th.t3,fontFamily:"monospace",textTransform:"uppercase",marginBottom:5}}>Protection RAID</label>
                  <select value={vRaid} onChange={e=>setVRaid(e.target.value)} style={{width:"100%",background:th.bg2,border:`1px solid ${th.border}`,borderRadius:4,padding:"7px 10px",color:th.t1,fontFamily:"monospace",fontSize:12,boxSizing:"border-box"}}>
                    {model?.raids.map(r=><option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{display:"block",fontSize:10,color:th.t3,fontFamily:"monospace",textTransform:"uppercase",marginBottom:5}}>Overhead système (%)</label>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <input type="number" min={model?.overheadMin||10} max={model?.overheadMax||35} value={vOverhead} onChange={e=>setVOverhead(Number(e.target.value))} style={{width:"100%",background:th.bg2,border:`1px solid ${th.border}`,borderRadius:4,padding:"7px 10px",color:th.t1,fontFamily:"monospace",fontSize:13,boxSizing:"border-box"}}/>
                    <span style={{fontSize:11,color:th.t3}}>%</span>
                  </div>
                  <div style={{fontSize:10,color:th.t3,marginTop:2}}>Min {model?.overheadMin}% — Max {model?.overheadMax}%</div>
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:14}}>

                {/* Config disques */}
                <div style={{background:th.bg2,borderLeft:`2px solid ${VENDORS[vVendor].color}`,borderRadius:4,padding:14}}>
                  <div style={{fontSize:10,fontWeight:600,color:th.t2,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12,fontFamily:"monospace"}}>Configuration disques</div>
                  <div style={{marginBottom:12}}>
                    <label style={{display:"block",fontSize:10,color:th.t3,fontFamily:"monospace",textTransform:"uppercase",marginBottom:5}}>Nombre de disques</label>
                    <input type="number" min={1} max={500} value={vDisks} onChange={e=>setVDisks(Number(e.target.value))} style={{width:"100%",background:th.bg1,border:`1px solid ${th.border}`,borderRadius:4,padding:"7px 10px",color:th.t1,fontFamily:"monospace",fontSize:13,boxSizing:"border-box"}}/>
                  </div>
                  <div style={{marginBottom:12}}>
                    <label style={{display:"block",fontSize:10,color:th.t3,fontFamily:"monospace",textTransform:"uppercase",marginBottom:5}}>Capacité / disque (TB)</label>
                    <input type="number" min={0.5} max={32} step={0.5} value={vDiskCap} onChange={e=>setVDiskCap(Number(e.target.value))} style={{width:"100%",background:th.bg1,border:`1px solid ${th.border}`,borderRadius:4,padding:"7px 10px",color:th.t1,fontFamily:"monospace",fontSize:13,boxSizing:"border-box"}}/>
                  </div>
                  <div style={{marginBottom:12}}>
                    <label style={{display:"block",fontSize:10,color:th.t3,fontFamily:"monospace",textTransform:"uppercase",marginBottom:5}}>Cible capacité nette (TB)</label>
                    <input type="number" min={1} step={5} value={vTarget} onChange={e=>setVTarget(Number(e.target.value))} style={{width:"100%",background:th.bg1,border:`1px solid ${th.border}`,borderRadius:4,padding:"7px 10px",color:th.t1,fontFamily:"monospace",fontSize:13,boxSizing:"border-box"}}/>
                  </div>
                  {model?.hasDedup&&(
                    <div>
                      <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:12,color:vVendorDedup?th.accent:th.t2,fontFamily:"monospace",marginBottom:6}}>
                        <input type="checkbox" checked={vVendorDedup} onChange={e=>setVVendorDedup(e.target.checked)} style={{accentColor:th.accent}}/>
                        {vVendorDedup?`Dédup/compression actif (×${vDedupRatio})`:"Dédup/compression désactivé"}
                      </label>
                      {vVendorDedup&&(
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <input type="range" min={1} max={8} step={0.5} value={vDedupRatio} onChange={e=>setVDedupRatio(Number(e.target.value))} style={{flex:1,accentColor:th.accent}}/>
                          <span style={{fontFamily:"monospace",fontSize:12,color:th.accent,minWidth:36}}>{vDedupRatio}:1</span>
                        </div>
                      )}
                    </div>
                  )}
                  {!model?.hasDedup&&(
                    <div style={{padding:"6px 10px",background:"rgba(255,181,71,0.08)",border:"1px solid rgba(255,181,71,0.2)",borderRadius:4,fontSize:11,color:"#ffb347"}}>
                      ⚠ {model?.label} : pas de dédup/compression natif
                    </div>
                  )}
                </div>

                {/* Résultats */}
                <div style={{background:th.bg2,borderLeft:`2px solid ${th.accent}`,borderRadius:4,padding:14}}>
                  <div style={{fontSize:10,fontWeight:600,color:th.t2,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12,fontFamily:"monospace"}}>Résultats {model?.label}</div>
                  <div style={{marginBottom:10,padding:"6px 10px",borderRadius:4,fontSize:11,fontFamily:"monospace",background:`${VENDORS[vVendor].color}15`,color:VENDORS[vVendor].color,border:`1px solid ${VENDORS[vVendor].color}33`}}>
                    {model?.protection} · Overhead {vOverhead}%
                  </div>
                  {[
                    {label:"Brut total",          val:fmt(rawTB,2)+" TB"},
                    {label:"Après overhead système", val:fmt(rawTB*(1-vOverhead/100),2)+" TB", color:th.t2},
                    {label:"Après "+raid?.label,   val:fmt(usable,2)+" TB", color:th.accent2},
                    ...(model?.hasDedup&&vVendorDedup?[{label:`Effective (×${vDedupRatio} dédup)`, val:fmt(effective,2)+" TB", color:th.accent}]:[]),
                    {label:"Cible nette",           val:fmt(vTarget,0)+" TB"},
                    {label:"Taux d'utilisation",    val:pctUsed+" %", color:ok?th.accent:th.danger},
                  ].map((row,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${th.border}`}}>
                      <span style={{fontSize:12,color:th.t2}}>{row.label}</span>
                      <span style={{fontFamily:"monospace",fontWeight:600,fontSize:13,color:row.color||th.t1}}>{row.val}</span>
                    </div>
                  ))}
                  <div style={{marginTop:10,padding:"8px 10px",borderRadius:4,fontSize:11,
                    background:ok?"rgba(0,212,170,0.07)":"rgba(255,85,85,0.08)",
                    border:`1px solid ${ok?"rgba(0,212,170,0.2)":"rgba(255,85,85,0.2)"}`,
                    color:ok?th.accent:th.danger}}>
                    {ok?`✓ Objectif atteint — marge ${fmt(effective-vTarget,2)} TB`:`⚠ Capacité insuffisante — déficit ${fmt(vTarget-effective,2)} TB`}
                  </div>
                </div>

                {/* Fiche modèle */}
                <div style={{background:th.bg2,borderLeft:`2px solid ${th.warn}`,borderRadius:4,padding:14}}>
                  <div style={{fontSize:10,fontWeight:600,color:th.t2,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12,fontFamily:"monospace"}}>Caractéristiques {model?.label}</div>
                  {[
                    {label:"Constructeur",    val:VENDORS[vVendor].label},
                    {label:"Protection",      val:model?.protection},
                    {label:"Overhead min",    val:model?.overheadMin+"%"},
                    {label:"Overhead max",    val:model?.overheadMax+"%"},
                    {label:"Dédup natif",     val:model?.hasDedup?"✓ Oui":"✗ Non", color:model?.hasDedup?th.accent:th.danger},
                    {label:"Ratio dédup typ.",val:model?.hasDedup?model?.dedupDefault+":1":"N/A"},
                  ].map((row,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${th.border}`}}>
                      <span style={{fontSize:12,color:th.t2}}>{row.label}</span>
                      <span style={{fontFamily:"monospace",fontWeight:600,fontSize:12,color:row.color||th.t1}}>{row.val}</span>
                    </div>
                  ))}
                  <div style={{marginTop:12,padding:"8px 10px",background:th.bg1,borderRadius:4,fontSize:11,color:th.t2,lineHeight:1.6}}>
                    💡 {model?.note}
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

        // Workload cible avec croissance
        const hciGrowthF    = 1 + hciGrowth/100;
        const hciTgtVcpu    = hciVms * hciVcpu * hciGrowthF;
        const hciTgtRam     = hciVms * hciRam * hciGrowthF;
        const hciTgtStorage = hciVms * hciStorage / 1024 * hciGrowthF;

        // Capacité par nœud
        const rawPerNode  = hciDisksPerNode * hciDisk.cap;
        const usablePerN  = rawPerNode * (1-hciProfile.overhead) / hciResilOpt.factor * (1-hciProfile.metadataReserve);
        const effPerNode  = hciDedupEn ? usablePerN*hciDedupRatio : usablePerN;

        // Nœuds nécessaires
        const nodesBySto  = Math.ceil(hciTgtStorage / effPerNode);
        const nodesByRam  = Math.ceil(hciTgtRam / hciNodeRam);
        const nodesByCpu  = Math.ceil(hciTgtVcpu / (hciNodeCpu * 4));
        const nodesMin    = Math.max(nodesBySto, nodesByRam, nodesByCpu, hciProfile.minNodes);
        const nodesReco   = nodesMin + hciHaPolicy;

        // Headroom après HA
        const haN         = nodesReco - hciHaPolicy;
        const cpuHeadroom = Math.round((1 - hciTgtVcpu/(haN*hciNodeCpu*4))*100);
        const ramHeadroom = Math.round((1 - hciTgtRam/(haN*hciNodeRam))*100);
        const stoHeadroom = Math.round((1 - hciTgtStorage/(haN*effPerNode))*100);
        const stoTotal    = nodesReco * effPerNode;
        const rawTotal    = nodesReco * rawPerNode;
        const bottleneck  = nodesBySto>=nodesByRam&&nodesBySto>=nodesByCpu?"Stockage":nodesByRam>=nodesByCpu?"RAM":"CPU";

        // KPIs
        const kpis = [
          {label:"Nœuds recommandés", sub:`N+${hciHaPolicy} HA · contrainte : ${bottleneck}`, val:nodesReco+" nœuds", bg:"linear-gradient(135deg,#0077cc,#005599)"},
          {label:"CPU headroom",       sub:"Après panne (N-"+hciHaPolicy+")",                 val:cpuHeadroom+"%",    bg:cpuHeadroom>=20?"linear-gradient(135deg,#00a884,#007a60)":"linear-gradient(135deg,#d97706,#b45309)"},
          {label:"RAM headroom",       sub:"Après panne (N-"+hciHaPolicy+")",                 val:ramHeadroom+"%",    bg:ramHeadroom>=20?"linear-gradient(135deg,#00a884,#007a60)":"linear-gradient(135deg,#d97706,#b45309)"},
          {label:"Stockage effectif",  sub:`${hciProfile.label} · ${hciResilOpt.label}`,      val:stoTotal.toFixed(1)+" To", bg:stoHeadroom>=10?"linear-gradient(135deg,#5a4fcf,#3d35a0)":"linear-gradient(135deg,#cc3333,#991111)"},
        ];

        return (
          <div>
            {/* KPIs */}
            <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(5,1fr)",gap:10,marginBottom:14}}>
              {kpis.map(k=>(
                <div key={k.label} style={{background:k.bg,borderRadius:8,padding:"14px 16px"}}>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.6)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>{k.label}</div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",marginBottom:4}}>{k.sub}</div>
                  <div style={{fontSize:20,fontWeight:700,fontFamily:"monospace",color:"#fff"}}>{k.val}</div>
                </div>
              ))}
            </div>

            {/* Layout 3 colonnes */}
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:14}}>

              {/* Col 1 — Workload */}
              <div>
                <div style={{background:th.cardBg,borderTop:`1px solid ${th.border}`,borderRight:`1px solid ${th.border}`,borderBottom:`1px solid ${th.border}`,borderLeft:`2px solid ${th.accent}`,borderRadius:6,padding:16,marginBottom:14}}>
                  <div style={s.secTitle}>Workload VM (cible)</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                    {[
                      {label:"Nombre de VMs",unit:"",val:hciVms,set:setHciVms,min:1,step:10},
                      {label:"vCPU / VM",unit:"",val:hciVcpu,set:setHciVcpu,min:1,step:1},
                      {label:"RAM / VM (Go)",unit:"Go",val:hciRam,set:setHciRam,min:4,step:4},
                      {label:"Stockage / VM (Go)",unit:"Go",val:hciStorage,set:setHciStorage,min:10,step:50},
                    ].map(f=>(
                      <div key={f.label}>
                        <label style={s.label}>{f.label}</label>
                        <input type="number" min={f.min} step={f.step} value={f.val} onChange={e=>f.set(Number(e.target.value))} style={s.input}/>
                      </div>
                    ))}
                  </div>
                  <div>
                    <label style={s.label}>Taux de croissance (%)</label>
                    <input type="number" min={0} step={5} value={hciGrowth} onChange={e=>setHciGrowth(Number(e.target.value))} style={s.input}/>
                  </div>
                </div>

                <div style={{background:th.cardBg,borderTop:`1px solid ${th.border}`,borderRight:`1px solid ${th.border}`,borderBottom:`1px solid ${th.border}`,borderLeft:`2px solid ${th.accent2}`,borderRadius:6,padding:16}}>
                  <div style={s.secTitle}>Plateforme HCI</div>
                  <div style={{marginBottom:8}}>
                    <label style={s.label}>Solution</label>
                    <select value={hciSolution} onChange={e=>{setHciSolution(e.target.value);setHciResil(HCI_PROFILES[e.target.value].resiliency[0].id);}} style={s.select}>
                      {Object.entries(HCI_PROFILES).map(([k,p])=><option key={k} value={k}>{p.label}</option>)}
                    </select>
                  </div>
                  <div style={{marginBottom:8}}>
                    <label style={s.label}>Résilience</label>
                    <select value={hciResil} onChange={e=>setHciResil(e.target.value)} style={s.select}>
                      {hciProfile.resiliency.map(r=><option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <div>
                      <label style={s.label}>Politique HA</label>
                      <select value={hciHaPolicy} onChange={e=>setHciHaPolicy(Number(e.target.value))} style={s.select}>
                        <option value={1}>N+1 (1 panne)</option>
                        <option value={2}>N+2 (2 pannes)</option>
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
                  {hciDedupEn&&(
                    <div style={{marginTop:8}}>
                      <label style={s.label}>Ratio dédup</label>
                      <select value={hciDedupRatio} onChange={e=>setHciDedupRatio(Number(e.target.value))} style={s.select}>
                        {[["1.5","1.5:1"],["2","2:1"],["3","3:1"],["4","4:1"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Col 2 — Modèle de nœud */}
              <div>
                <div style={{background:th.cardBg,borderTop:`1px solid ${th.border}`,borderRight:`1px solid ${th.border}`,borderBottom:`1px solid ${th.border}`,borderLeft:`2px solid #e05a20`,borderRadius:6,padding:16,marginBottom:14}}>
                  <div style={s.secTitle}>Modèle de nœud</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
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
                  <div style={{marginTop:10,padding:"8px 10px",background:th.bg2,borderRadius:4,fontSize:11,color:th.t2,fontFamily:"monospace"}}>
                    Brut/nœud : {rawPerNode.toFixed(1)} TB · Utile/nœud : {usablePerN.toFixed(1)} To · Eff/nœud : {effPerNode.toFixed(1)} To
                  </div>
                </div>

                <div style={{background:th.cardBg,borderTop:`1px solid ${th.border}`,borderRight:`1px solid ${th.border}`,borderBottom:`1px solid ${th.border}`,borderLeft:`2px solid ${th.accent2}`,borderRadius:6,padding:16}}>
                  <div style={s.secTitle}>Résultats détaillés</div>
                  {[
                    {label:"VMs → vCPU total (avec croissance)", val:fmt(Math.round(hciTgtVcpu))+" vCPUs"},
                    {label:"RAM requise (avec croissance)",       val:fmt(Math.round(hciTgtRam))+" Go"},
                    {label:"Stockage requis (avec croissance)",   val:hciTgtStorage.toFixed(1)+" To"},
                    {label:"Nœuds : CPU / RAM / Stockage",        val:`${nodesByCpu} / ${nodesByRam} / ${nodesBySto}`, highlight:true},
                    {label:"Stockage brut total",                 val:rawTotal.toFixed(1)+" TB"},
                    {label:"Overhead plateforme",                 val:(hciProfile.overhead*100).toFixed(0)+"% + metadata "+(hciProfile.metadataReserve*100).toFixed(0)+"%"},
                  ].map(r=>(
                    <div key={r.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${th.border}`}}>
                      <span style={{fontSize:11,color:th.t2}}>{r.label}</span>
                      <span style={{fontFamily:"monospace",fontWeight:600,fontSize:12,color:r.highlight?th.accent:th.t1,marginLeft:8}}>{r.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Col 3 — Recommandations */}
              <div>
                <div style={{background:th.cardBg,borderTop:`1px solid ${th.border}`,borderRight:`1px solid ${th.border}`,borderBottom:`1px solid ${th.border}`,borderLeft:`2px solid ${hciProfile.color}`,borderRadius:6,padding:16}}>
                  <div style={s.secTitle}>Recommandations {hciProfile.label}</div>
                  {[
                    cpuHeadroom < 20 && {type:"warn", msg:`CPU headroom faible (${cpuHeadroom}%) — ajouter 1 nœud ou augmenter les cœurs/nœud`},
                    ramHeadroom < 20 && {type:"warn", msg:`RAM headroom faible (${ramHeadroom}%) — augmenter la RAM/nœud`},
                    stoHeadroom < 10 && {type:"warn", msg:`Stockage proche de la limite — prévoir un nœud supplémentaire`},
                    cpuHeadroom >= 20 && ramHeadroom >= 20 && {type:"ok", msg:"Configuration équilibrée — headroom CPU et RAM suffisant"},
                    hciDedupEn && {type:"ok", msg:`Dédup ×${hciDedupRatio} : économie de ${((1-1/hciDedupRatio)*100).toFixed(0)}% d'espace`},
                    !hciDedupEn && {type:"info", msg:"Activer la dédup/compression peut réduire le nombre de nœuds"},
                    hciSolution==="nutanix" && {type:"info", msg:"Overhead CVM inclus dans les calculs ("+((hciProfile.overhead)*100).toFixed(0)+"%)"},
                    hciSolution==="vsan" && hciResil==="ftt1r5" && {type:"ok", msg:"RAID-5 (FTT=1) optimal pour ≥4 nœuds — économise 25% vs RAID-1"},
                    nodesReco > 8 && {type:"info", msg:`${nodesReco} nœuds — envisager un scale-out en 2 clusters`},
                  ].filter(Boolean).map((r,i)=>(
                    <div key={i} style={{
                      display:"flex",alignItems:"flex-start",gap:8,padding:"7px 10px",
                      borderRadius:4,marginBottom:6,
                      background:r.type==="ok"?"rgba(0,212,170,0.06)":r.type==="warn"?"rgba(255,181,71,0.08)":"rgba(0,153,255,0.06)",
                      border:`1px solid ${r.type==="ok"?"rgba(0,212,170,0.2)":r.type==="warn"?"rgba(255,181,71,0.25)":"rgba(0,153,255,0.2)"}`,
                    }}>
                      <span style={{fontSize:13,flexShrink:0}}>{r.type==="ok"?"✓":r.type==="warn"?"⚠":"ℹ"}</span>
                      <span style={{fontSize:11,color:th.t1,lineHeight:1.5}}>{r.msg}</span>
                    </div>
                  ))}
                </div>
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
          <div style={{fontSize:10,color:th.t3,marginTop:8,fontFamily:"monospace"}}>Licence : {licType.toUpperCase()} · Repo : {repoType.toUpperCase()} · {copies} copie(s)</div>
        </Card>
      </div>
    </div>
  );
}

// ─── Compute & HCI Planning v3 ───────────────────────────────────────────────

const HCI_PROFILES = {
  nutanix:      { label:"Nutanix AOS/AHV",   color:"#00d4aa", overhead:0.20, minNodes:3, metadataReserve:0.05, defaultDedup:3.0,
    resiliency:[{id:"rf2",label:"RF2 (1 panne)",factor:2},{id:"rf3",label:"RF3 (2 pannes)",factor:3}] },
  vsan:         { label:"VMware vSAN",        color:"#0099ff", overhead:0.25, minNodes:4, metadataReserve:0.07, defaultDedup:2.0,
    resiliency:[{id:"ftt1r1",label:"FTT=1 RAID-1",factor:2},{id:"ftt1r5",label:"FTT=1 RAID-5",factor:1.33},{id:"ftt2r1",label:"FTT=2 RAID-1",factor:3},{id:"ftt2r6",label:"FTT=2 RAID-6",factor:1.5}] },
  azurestackhci:{ label:"Azure Stack HCI",   color:"#ff6b35", overhead:0.25, minNodes:2, metadataReserve:0.08, defaultDedup:2.0,
    resiliency:[{id:"2way",label:"2-way mirror",factor:2},{id:"3way",label:"3-way mirror",factor:3},{id:"rs42",label:"RS 4+2",factor:1.5}] },
  ceph:         { label:"Ceph",              color:"#ffb347", overhead:0.20, minNodes:3, metadataReserve:0.05, defaultDedup:1.5,
    resiliency:[{id:"rep2",label:"Réplication ×2",factor:2},{id:"rep3",label:"Réplication ×3",factor:3},{id:"ec42",label:"Erasure 4+2",factor:1.5},{id:"ec82",label:"Erasure 8+2",factor:1.25}] },
};

const HCI_DISKS = [
  {id:"ssd-192",label:"SSD 1,92 To",cap:1.92},{id:"ssd-384",label:"SSD 3,84 To",cap:3.84},
  {id:"ssd-768",label:"SSD 7,68 To",cap:7.68},{id:"nvme-192",label:"NVMe 1,92 To",cap:1.92},
  {id:"nvme-384",label:"NVMe 3,84 To",cap:3.84},{id:"nvme-768",label:"NVMe 7,68 To",cap:7.68},
  {id:"nvme-1536",label:"NVMe 15,36 To",cap:15.36},{id:"nvme-3072",label:"NVMe 30,72 To",cap:30.72},
];

function ComputeCalc({ th, isMobile=false }) {
  const [srcNodes,   setSrcNodes]   = useState(3);
  const [srcSockets, setSrcSockets] = useState(2);
  const [srcCores,   setSrcCores]   = useState(16);
  const [srcFreq,    setSrcFreq]    = useState(2.4);
  const [srcRam,     setSrcRam]     = useState(256);
  const [tgtNodes,   setTgtNodes]   = useState(4);
  const [tgtSockets, setTgtSockets] = useState(2);
  const [tgtCores,   setTgtCores]   = useState(32);
  const [tgtFreq,    setTgtFreq]    = useState(3.0);
  const [tgtRam,     setTgtRam]     = useState(512);
  const [haPolicy,   setHaPolicy]   = useState(1);


  const r = useMemo(()=>{
    const srcTotalCores = srcNodes*srcSockets*srcCores;
    const srcTotalFreq  = srcTotalCores*srcFreq;
    const srcTotalRam   = srcNodes*srcRam;
    const tgtTotalCores = tgtNodes*tgtSockets*tgtCores;
    const tgtTotalFreq  = tgtTotalCores*tgtFreq;
    const tgtTotalRam   = tgtNodes*tgtRam;
    const haCores = (tgtNodes-haPolicy)*tgtSockets*tgtCores;
    const haFreq  = haCores*tgtFreq;
    const haRam   = (tgtNodes-haPolicy)*tgtRam;
    const haPct   = tgtNodes>0?(haPolicy/tgtNodes)*100:0;
    const gainCoresPct = srcTotalCores>0?Math.round(((tgtTotalCores-srcTotalCores)/srcTotalCores)*100):0;
    const gainRamPct   = srcTotalRam>0?Math.round(((tgtTotalRam-srcTotalRam)/srcTotalRam)*100):0;
    const gainFreqPct  = srcTotalFreq>0?Math.round(((tgtTotalFreq-srcTotalFreq)/srcTotalFreq)*100):0;
    return {
      srcTotalCores,srcTotalFreq,srcTotalRam,
      tgtTotalCores,tgtTotalFreq,tgtTotalRam,
      haCores,haFreq,haRam,haPct,
      gainCoresPct,gainRamPct,gainFreqPct,
      gainCores:tgtTotalCores-srcTotalCores,
      gainRam:tgtTotalRam-srcTotalRam,
    };
  },[srcNodes,srcSockets,srcCores,srcFreq,srcRam,
     tgtNodes,tgtSockets,tgtCores,tgtFreq,tgtRam,
     haPolicy]);

  const tt = {background:th.tooltipBg,border:`1px solid ${th.border2}`,borderRadius:4,fontSize:11,color:th.t1};

  const s = {
    field:  { marginBottom:12 },
    label:  { display:"block",fontSize:10,color:th.t3,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:5 },
    input:  { width:"100%",background:th.bg2,border:`1px solid ${th.border}`,borderRadius:4,padding:"7px 10px",color:th.t1,fontFamily:"monospace",fontSize:13,boxSizing:"border-box" },
    select: { width:"100%",background:th.bg2,border:`1px solid ${th.border}`,borderRadius:4,padding:"7px 10px",color:th.t1,fontFamily:"monospace",fontSize:12,boxSizing:"border-box" },
    row:    { display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${th.border}` },
    divider:{ border:"none",borderTop:`1px solid ${th.border}`,margin:"12px 0" },
    card:   (accent) => ({background:th.cardBg,borderTop:`1px solid ${th.border}`,borderRight:`1px solid ${th.border}`,borderBottom:`1px solid ${th.border}`,borderLeft:accent?`2px solid ${accent}`:undefined,borderRadius:6,padding:16}),
    secTitle:{ fontSize:10,fontWeight:600,color:th.t2,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:14,paddingBottom:8,borderBottom:`1px solid ${th.border}`,fontFamily:"monospace" },
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

  function SF({label,value,onChange,options}) {
    return (
      <div style={s.field}>
        <label style={s.label}>{label}</label>
        <select value={value} onChange={e=>onChange(e.target.value)} style={s.select}>
          {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    );
  }

  function RR({label,value,color}) {
    return (
      <div style={s.row}>
        <span style={{fontSize:12,color:th.t2}}>{label}</span>
        <span style={{fontFamily:"monospace",fontWeight:600,fontSize:13,color:color||th.t1}}>{value}</span>
      </div>
    );
  }

  // KPI coloré avec fond
  function KpiColored({label,value,sub,bg,textColor}) {
    return (
      <div style={{background:bg,borderRadius:8,padding:"14px 16px",display:"flex",flexDirection:"column",gap:4}}>
        <div style={{fontSize:24,fontWeight:700,fontFamily:"monospace",color:textColor||"#fff"}}>{value}</div>
        {sub && <div style={{fontSize:12,color:textColor||"rgba(255,255,255,0.8)",fontFamily:"monospace"}}>{sub}</div>}
        <div style={{fontSize:10,color:textColor||"rgba(255,255,255,0.6)",textTransform:"uppercase",letterSpacing:"0.08em",marginTop:2}}>{label}</div>
      </div>
    );
  }

  // Ligne comparaison avec flèche et delta
  function CompRow({label,srcVal,tgtVal,unit,gainPct}) {
    const positive = gainPct >= 0;
    return (
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${th.border}`}}>
        <span style={{fontSize:12,color:th.t2,minWidth:100}}>{label}</span>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontFamily:"monospace",fontSize:12,color:th.t3}}>{fmt(srcVal)} {unit}</span>
          <span style={{color:th.t3,fontSize:12}}>→</span>
          <span style={{fontFamily:"monospace",fontSize:13,fontWeight:700,color:th.t1}}>{fmt(tgtVal)} {unit}</span>
          {gainPct!==0 && (
            <span style={{
              fontSize:10,fontFamily:"monospace",fontWeight:600,padding:"2px 6px",borderRadius:3,
              background:positive?"rgba(0,212,170,0.12)":"rgba(255,85,85,0.12)",
              color:positive?th.accent:th.danger,
              border:`1px solid ${positive?"rgba(0,212,170,0.25)":"rgba(255,85,85,0.25)"}`,
            }}>
              {positive?"+":""}{gainPct}%
            </span>
          )}
        </div>
      </div>
    );
  }

  // Graphe barres verticales avec label intégré
  function BarChart3({data,unit,height=180}) {
    const maxVal = Math.max(...data.map(d=>d.val))||1;
    const gainPct = data[0].val>0?Math.round(((data[1].val-data[0].val)/data[0].val)*100):0;
    return (
      <div>
        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-around",height,padding:"0 8px",gap:12,position:"relative"}}>
          {/* Annotation gain */}
          {gainPct!==0 && (
            <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",
              fontSize:12,fontWeight:700,fontFamily:"monospace",
              color:gainPct>=0?th.accent:th.danger,
              background:gainPct>=0?"rgba(0,212,170,0.1)":"rgba(255,85,85,0.1)",
              padding:"2px 8px",borderRadius:3,border:`1px solid ${gainPct>=0?"rgba(0,212,170,0.3)":"rgba(255,85,85,0.3)"}`}}>
              {gainPct>=0?"+":""}{gainPct}%
            </div>
          )}
          {data.map((b,i)=>{
            const h=Math.max(8,Math.round((b.val/maxVal)*(height-70)));
            return (
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <div style={{width:"100%",height:h,background:b.color,borderRadius:"4px 4px 0 0",
                  display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
                  {h>20&&<span style={{fontSize:10,color:"#fff",fontFamily:"monospace",fontWeight:600,
                    padding:"2px 4px",textShadow:"0 1px 2px rgba(0,0,0,0.4)"}}>{fmt(b.val)}</span>}
                </div>
                <span style={{fontSize:10,color:th.t2,fontFamily:"monospace",textAlign:"center",lineHeight:1.3}}>{b.name}</span>
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",justifyContent:"space-around",marginTop:4}}>
          {data.map((b,i)=>(
            <span key={i} style={{fontSize:10,fontFamily:"monospace",color:b.color,fontWeight:600,textAlign:"center",flex:1}}>
              {fmt(b.val)} {unit}
            </span>
          ))}
        </div>
      </div>
    );
  }

  const kpiHaPct = r.haPct<=25?"ok":"warn";

  return (
    <div>
      {/* KPIs colorés */}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(5,1fr)",gap:10,marginBottom:20}}>
        <KpiColored label="Nœuds cible" value={tgtNodes} sub={`${tgtSockets}S/${tgtCores}c/${tgtFreq}GHz`}
          bg="linear-gradient(135deg,#00a884,#007a60)" />
        <KpiColored label="Cœurs cible" value={fmt(r.tgtTotalCores)}
          sub={r.gainCoresPct!==0?(r.gainCoresPct>0?"+":"")+r.gainCoresPct+"% vs existant":undefined}
          bg="linear-gradient(135deg,#0077cc,#005599)" />
        <KpiColored label="GHz agrégés" value={fmt(r.tgtTotalFreq,0)} sub="GHz total cluster"
          bg="linear-gradient(135deg,#0099ff,#0066cc)" />
        <KpiColored label="RAM cible" value={fmt(r.tgtTotalRam)} sub="Go total cluster"
          bg="linear-gradient(135deg,#5a4fcf,#3d35a0)" />
        <KpiColored label="Capacité HA" value={fmt(r.haPct,0)+"% perdu"}
          sub={`N-${haPolicy} — ${fmt(r.haCores)} cœurs dispo`}
          bg={kpiHaPct==="ok"?"linear-gradient(135deg,#00a884,#007a60)":"linear-gradient(135deg,#d97706,#b45309)"}
          textColor={kpiHaPct==="ok"?"#fff":"#fff"} />
      </div>

      {/* Saisie + Comparaison */}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:14,marginBottom:14,alignItems:"start"}}>

        {/* Existant */}
        <div style={{...s.card(th.accent),alignSelf:"start"}}>
          <div style={s.secTitle}>Infrastructure existante</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <NF label="Nœuds" value={srcNodes} onChange={setSrcNodes} min={0} max={200} unit="nœuds"/>
            <NF label="Sockets / nœud" value={srcSockets} onChange={setSrcSockets} min={1} max={8}/>
            <NF label="Cœurs / socket" value={srcCores} onChange={setSrcCores} min={1} max={128} step={2}/>
            <NF label="Fréquence CPU" value={srcFreq} onChange={setSrcFreq} min={0.5} max={5} step={0.1} unit="GHz"/>
            <NF label="RAM / nœud" value={srcRam} onChange={setSrcRam} min={0} max={4096} step={32} unit="Go"/>
          </div>
          <hr style={s.divider}/>
          <RR label="Cœurs totaux" value={fmt(r.srcTotalCores)+" cœurs"} color={th.t3}/>
          <RR label="GHz agrégés"  value={fmt(r.srcTotalFreq,0)+" GHz"} color={th.t3}/>
          <RR label="RAM totale"   value={fmt(r.srcTotalRam)+" Go"} color={th.t3}/>
        </div>

        {/* Cible */}
        <div style={{...s.card(th.accent2),alignSelf:"start"}}>
          <div style={s.secTitle}>Infrastructure cible</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <NF label="Nœuds" value={tgtNodes} onChange={setTgtNodes} min={1} max={200} unit="nœuds"/>
            <NF label="Sockets / nœud" value={tgtSockets} onChange={setTgtSockets} min={1} max={8}/>
            <NF label="Cœurs / socket" value={tgtCores} onChange={setTgtCores} min={1} max={128} step={2}/>
            <NF label="Fréquence CPU" value={tgtFreq} onChange={setTgtFreq} min={0.5} max={5} step={0.1} unit="GHz"/>
            <NF label="RAM / nœud" value={tgtRam} onChange={setTgtRam} min={32} max={4096} step={32} unit="Go"/>
          </div>
          <SF label="Politique HA" value={String(haPolicy)} onChange={v=>setHaPolicy(Number(v))}
            options={[{value:"1",label:"N-1 (1 nœud réservé)"},{value:"2",label:"N-2 (2 nœuds réservés)"}]}/>
          <hr style={s.divider}/>
          <RR label="Cœurs totaux"      value={fmt(r.tgtTotalCores)+" cœurs"} color={th.accent2}/>
          <RR label="GHz agrégés"       value={fmt(r.tgtTotalFreq,0)+" GHz"}  color={th.accent2}/>
          <RR label="RAM totale"        value={fmt(r.tgtTotalRam)+" Go"}      color={th.accent2}/>
          <RR label={"Cœurs HA N-"+haPolicy} value={fmt(r.haCores)+" cœurs"} color={th.accent}/>
          <RR label={"RAM HA N-"+haPolicy}    value={fmt(r.haRam)+" Go"}      color={th.accent}/>
        </div>

        {/* Comparaison & Gains */}
        <div style={{...s.card(),alignSelf:"start"}}>
          <div style={s.secTitle}>Comparaison & Gains</div>
          <CompRow label="Cœurs totaux" srcVal={r.srcTotalCores} tgtVal={r.tgtTotalCores} unit="cœurs" gainPct={r.gainCoresPct}/>
          <CompRow label="GHz agrégés"  srcVal={r.srcTotalFreq}  tgtVal={r.tgtTotalFreq}  unit="GHz"   gainPct={r.gainFreqPct}/>
          <CompRow label="RAM totale"   srcVal={r.srcTotalRam}   tgtVal={r.tgtTotalRam}   unit="Go"    gainPct={r.gainRamPct}/>
          <CompRow label={"Cœurs HA N-"+haPolicy} srcVal={r.srcTotalCores} tgtVal={r.haCores} unit="cœurs" gainPct={0}/>
          <hr style={s.divider}/>
          <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0"}}>
            <span style={{fontSize:12,color:th.t2}}>Capacité perdue HA</span>
            <span style={{fontFamily:"monospace",fontWeight:700,fontSize:13,color:r.haPct<=25?th.accent:th.warn}}>
              {fmt(r.haPct,0)}% perdu
            </span>
          </div>
        </div>
      </div>

      {/* Graphes comparaison */}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:14,marginBottom:14}}>
        {[
          {title:"Cœurs CPU · Existant vs Cible vs HA", unit:"cœurs", data:[
            {name:"Existant",   val:r.srcTotalCores, color:"#8b90a0"},
            {name:"Cible",      val:r.tgtTotalCores, color:th.accent2},
            {name:"HA N-"+haPolicy, val:r.haCores,  color:th.accent},
          ]},
          {title:"GHz agrégés · Existant vs Cible vs HA", unit:"GHz", data:[
            {name:"Existant",   val:+r.srcTotalFreq.toFixed(0), color:"#8b90a0"},
            {name:"Cible",      val:+r.tgtTotalFreq.toFixed(0), color:th.accent2},
            {name:"HA N-"+haPolicy, val:+r.haFreq.toFixed(0),  color:th.accent},
          ]},
          {title:"RAM · Existant vs Cible vs HA", unit:"Go", data:[
            {name:"Existant",   val:r.srcTotalRam, color:"#8b90a0"},
            {name:"Cible",      val:r.tgtTotalRam, color:th.accent2},
            {name:"HA N-"+haPolicy, val:r.haRam,  color:th.accent},
          ]},
        ].map(chart=>(
          <div key={chart.title} style={s.card()}>
            <div style={{...s.secTitle,marginBottom:16}}>{chart.title}</div>
            <BarChart3 data={chart.data} unit={chart.unit} height={200}/>
          </div>
        ))}
      </div>

    </div>
  );
}


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
    label:    {display:"block",fontSize:10,color:th.t3,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4},
    input:    {width:"100%",background:th.bg2,border:`1px solid ${th.border}`,borderRadius:4,padding:"7px 10px",color:th.t1,fontFamily:"monospace",fontSize:13,boxSizing:"border-box"},
    select:   {width:"100%",background:th.bg2,border:`1px solid ${th.border}`,borderRadius:4,padding:"7px 10px",color:th.t1,fontFamily:"monospace",fontSize:13,boxSizing:"border-box"},
    card:     (accent) => ({background:th.cardBg,borderTop:`1px solid ${th.border}`,borderRight:`1px solid ${th.border}`,borderBottom:`1px solid ${th.border}`,borderLeft:`2px solid ${accent||th.border}`,borderRadius:6,padding:16,marginBottom:14}),
    secTitle: {fontSize:10,fontWeight:600,color:th.t2,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:14,fontFamily:"monospace"},
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
            <div style={{fontSize:20,fontWeight:700,fontFamily:"monospace",color:"#fff"}}>{k.val}</div>
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
              <div style={{fontSize:10,color:th.t3,fontFamily:"monospace",marginTop:3}}>
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
                <div style={{fontSize:9,color:th.t3,fontFamily:"monospace",marginTop:2}}>BW serveurs / BW uplinks</div>
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
            <div style={{marginTop:10,padding:"8px 10px",background:th.bg2,borderRadius:4,fontSize:11,fontFamily:"monospace",color:th.t2}}>
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
              <button onClick={addGroup} style={{cursor:"pointer",fontSize:11,padding:"4px 12px",borderRadius:4,border:`1px solid ${th.accent}`,background:`${th.accent}15`,color:th.accent,fontFamily:"monospace"}}>+ Groupe</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"2fr 48px 40px 40px 40px 40px 24px",gap:4,marginBottom:6}}>
              {[{h:"Groupe",align:"left"},{h:"Qté",align:"center"},{h:"1G",align:"center"},{h:"10G",align:"center"},{h:"25G",align:"center"},{h:"Mgmt",align:"center"},{h:"",align:"center"}].map((col,i)=>(
                <div key={i} style={{fontSize:9,color:th.t3,fontFamily:"monospace",textTransform:"uppercase",textAlign:col.align}}>
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
                <div style={{fontSize:10,color:th.t3,fontFamily:"monospace"}}>Total ports</div>
                <div style={{fontSize:11,fontWeight:700,color:th.accent,fontFamily:"monospace",textAlign:"center"}}>{totals.tServers}</div>
                <div style={{fontSize:11,fontWeight:700,color:th.t1,fontFamily:"monospace",textAlign:"center"}}>{totals.t1g}</div>
                <div style={{fontSize:11,fontWeight:700,color:th.accent2,fontFamily:"monospace",textAlign:"center"}}>{totals.t10g}</div>
                <div style={{fontSize:11,fontWeight:700,color:th.accent,fontFamily:"monospace",textAlign:"center"}}>{totals.t25g}</div>
                <div style={{fontSize:11,fontWeight:700,color:th.t1,fontFamily:"monospace",textAlign:"center"}}>{totals.tMgmt}</div>
                <div/>
              </div>
              <div style={{fontSize:10,color:th.t3,fontFamily:"monospace",marginTop:4}}>
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
                <span style={{fontFamily:"monospace",fontWeight:600,fontSize:12,color:r.color}}>{r.val}</span>
              </div>
            ))}
          </div>

          {/* Segmentation VLAN */}
          <div style={s.card(th.accent2)}>
            <div style={s.secTitle}>Segmentation réseau</div>
            <div style={{display:"grid",gridTemplateColumns:"40px 1fr 60px 60px",gap:4,marginBottom:4}}>
              {["VLAN","Usage","Vitesse","QoS"].map(h=>(
                <div key={h} style={{fontSize:9,color:th.t3,fontFamily:"monospace",textTransform:"uppercase"}}>{h}</div>
              ))}
            </div>
            {vlans.map(v=>(
              <div key={v.id} style={{display:"grid",gridTemplateColumns:"40px 1fr 60px 60px",gap:4,padding:"5px 0",borderBottom:`1px solid ${th.border}`}}>
                <span style={{fontFamily:"monospace",fontWeight:700,fontSize:11,color:th.accent2}}>{v.id}</span>
                <div>
                  <div style={{fontSize:11,fontWeight:600,color:th.t1}}>{v.name}</div>
                  <div style={{fontSize:10,color:th.t3}}>{v.use}</div>
                </div>
                <span style={{fontSize:10,fontFamily:"monospace",color:th.t2,alignSelf:"center"}}>{v.speed}</span>
                <span style={{fontSize:10,fontFamily:"monospace",alignSelf:"center",
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
              background:r.type==="ok"?"rgba(0,212,170,0.06)":r.type==="warn"?"rgba(255,181,71,0.08)":"rgba(0,153,255,0.06)",
              border:`1px solid ${r.type==="ok"?"rgba(0,212,170,0.2)":r.type==="warn"?"rgba(255,181,71,0.25)":"rgba(0,153,255,0.2)"}`,
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
  {id:"vmware",  label:"VMware / VCF",     icon:Cpu,      section:"VIRTUALISATION", comp:VMwareCalc,  badge:"VVF / VCF", sub:"VVF · VCF · Licence par cœur"},
  {id:"windows", label:"Windows & SQL",    icon:Server,   section:"MICROSOFT",      comp:WindowsCalc, badge:"Microsoft", sub:"Packs 2-cœurs · DC / STD"},
  {id:"m365",    label:"Microsoft 365",    icon:Cloud,    section:"MICROSOFT",      comp:M365Calc,    badge:"M365",      sub:"Sizing par profil utilisateur"},
  {id:"storage", label:"Capacity Planning",icon:HardDrive,section:"STOCKAGE",       comp:StorageCalc, badge:"Storage",   sub:"SAN · NAS · IOPS · RAID"},
  {id:"veeam",   label:"Veeam Backup",     icon:Shield,   section:"BACKUP",         comp:VeeamCalc,   badge:"Veeam v12", sub:"VBR · Cloud Connect · BaaS"},
  {id:"switch",  label:"Switch Fabric",    icon:Network,  section:"RÉSEAU",         comp:SwitchCalc,  badge:"Switch",    sub:"Fabric · VLAN · QoS"},
  {id:"compute", label:"Compute & HCI",    icon:BarChart2,section:"COMPUTE",        comp:ComputeCalc, badge:"Compute",   sub:"Serveurs · HA · HCI"},
];

export default function SizingHub() {
  const [active,setActive]=useState("vmware");
  const [dark,setDark]=useState(false);
  const [menuOpen,setMenuOpen]=useState(false);
  const isMobile = useIsMobile();
  const th=dark?DARK:LIGHT;
  const tool=TOOLS.find(t=>t.id===active);
  const ActiveComp=tool.comp;
  const sections=[...new Set(TOOLS.map(t=>t.section))];

  return (
    <div style={{fontFamily:"'Inter',system-ui,sans-serif",background:th.bg0,color:th.t1,minHeight:"100vh",display:"flex",transition:"background 0.2s,color 0.2s",position:"relative"}}>
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
      <div style={{width:isMobile?210:210,minWidth:isMobile?210:210,background:th.bg1,borderRight:`1px solid ${th.border}`,display:"flex",flexDirection:"column",padding:"16px 0",transition:"all 0.3s",position:isMobile?"fixed":"relative",top:0,left:0,height:"100vh",zIndex:999,transform:isMobile&&!menuOpen?"translateX(-100%)":"translateX(0)"}}>
        <div style={{padding:"0 16px 16px",borderBottom:`1px solid ${th.border}`,marginBottom:12}}>
          <div style={{fontSize:15,fontWeight:700,color:th.accent,letterSpacing:"0.08em",textTransform:"uppercase"}}>SizingHub</div>
          <div style={{fontSize:10,color:th.t3,fontFamily:"monospace",marginTop:2}}>v2.0 · Infrastructure Sizing</div>
        </div>
        {sections.map(section=>(
          <div key={section}>
            <div style={{padding:"8px 16px 4px",fontSize:9,color:th.t3,textTransform:"uppercase",letterSpacing:"0.12em",fontFamily:"monospace"}}>{section}</div>
            {TOOLS.filter(t=>t.section===section).map(t=>(
              <div key={t.id} onClick={()=>{setActive(t.id);if(isMobile)setMenuOpen(false);}} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px",cursor:"pointer",fontSize:12,color:active===t.id?th.accent:th.t2,borderLeft:`2px solid ${active===t.id?th.accent:"transparent"}`,background:active===t.id?`rgba(0,212,170,0.06)`:"transparent",transition:"all 0.15s"}}>
                <t.icon size={13} />{t.label}
              </div>
            ))}
          </div>
        ))}
        {/* Toggle dark/light */}
        <div style={{marginTop:"auto",padding:"12px 16px",borderTop:`1px solid ${th.border}`}}>
          <button onClick={()=>setDark(d=>!d)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"8px 0",borderRadius:4,cursor:"pointer",fontSize:11,background:th.bg2,border:`1px solid ${th.border}`,color:th.t2,fontFamily:"monospace",transition:"all 0.2s"}}>
            {dark?<><Sun size={13}/>Light mode</>:<><Moon size={13}/>Dark mode</>}
          </button>
          <div style={{textAlign:"center",fontSize:10,color:th.t3,fontFamily:"monospace",marginTop:10,letterSpacing:"0.08em"}}>by Francis B.</div>
        </div>
      </div>
      {/* Main */}
      <div style={{flex:1,overflowY:"auto",background:th.bg0,transition:"background 0.2s",marginLeft:isMobile?0:undefined}}>
        <div style={{padding:isMobile?"60px 12px 12px":28}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
            <div>
              <div style={{fontSize:20,fontWeight:700,color:th.t1}}>{tool.label}</div>
              <div style={{fontSize:11,color:th.t3,fontFamily:"monospace",marginTop:3}}>{tool.sub}</div>
            </div>
            <div style={{fontSize:9,background:dark?"rgba(0,212,170,0.1)":"rgba(0,168,132,0.1)",color:th.accent,padding:"4px 10px",borderRadius:3,fontFamily:"monospace",border:`1px solid ${th.border2}`,textTransform:"uppercase",letterSpacing:"0.08em"}}>{tool.badge}</div>
          </div>
          <ActiveComp th={th} isMobile={isMobile} />
        </div>
      </div>
    </div>
  );
}
