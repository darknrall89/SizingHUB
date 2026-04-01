import { useState, useMemo } from "react";
import {
  Server, HardDrive, Cloud, Cpu, Database,
  BarChart2, Shield, CheckCircle, AlertTriangle,
  Info, Sun, Moon
} from "lucide-react";
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
function KpiCard({label, value, color, th}) {
  return (
    <div style={{background:th.cardBg, border:`1px solid ${th.border}`, borderRadius:6, padding:16}}>
      <div style={{fontSize:10, color:th.t3, fontFamily:"monospace", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6}}>{label}</div>
      <div style={{fontSize:24, fontWeight:600, fontFamily:"monospace", color:color||th.accent}}>{value}</div>
    </div>
  );
}

function Card({children, accent, th}) {
  const accentColors = {accent:th.accent, accent2:th.accent2, accent3:th.accent3, warn:th.warn};
  return (
    <div style={{
      background:th.cardBg, border:`1px solid ${th.border}`, borderRadius:6, padding:18,
      borderLeft: accent ? `2px solid ${accentColors[accent]||th.accent}` : undefined,
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
function VMwareCalc({th}) {
  const [nodes,setNodes]=useState(6);
  const [sockets,setSockets]=useState(1);
  const [cores,setCores]=useState(32);
  const [ram,setRam]=useState(768);
  const [overcommit,setOvercommit]=useState(3.75);

  const r = useMemo(()=>{
    const totalSockets=nodes*sockets;
    const totalPhys=totalSockets*cores;
    const billedPerSocket=Math.max(cores,16);
    const totalBilled=totalSockets*billedPerSocket;
    const totalRamTo=(nodes*ram)/1024;
    const vcpuTotal=totalPhys*overcommit;
    const haRam=((nodes-1)*ram)/1024;
    const haCores=(nodes-1)*sockets*cores;
    const haVcpu=haCores*overcommit;
    const haPct=nodes>0?(1/nodes)*100:0;
    return {totalSockets,totalPhys,billedPerSocket,totalBilled,totalRamTo,vcpuTotal,haRam,haCores,haVcpu,haPct,haRamOk:haRam>0,haVcpuOk:haVcpu>0};
  },[nodes,sockets,cores,ram,overcommit]);

  const chartData=[
    {name:"Normal",RAM:+r.totalRamTo.toFixed(2),vCPU:+(r.vcpuTotal/100).toFixed(1)},
    {name:"HA (N-1)",RAM:+r.haRam.toFixed(2),vCPU:+(r.haVcpu/100).toFixed(1)},
    
  ];
  const tt={background:th.tooltipBg,border:`1px solid ${th.border2}`,borderRadius:4,fontSize:11,color:th.t1};

  return (
    <div>
      <InfoBox th={th}>Broadcom 2024+ : facturation par cœur physique, minimum 16 cœurs par socket.</InfoBox>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
        <KpiCard label="Nœuds" value={nodes} th={th} />
        <KpiCard label="Cœurs facturés" value={fmt(r.totalBilled)} th={th} />
        <KpiCard label="RAM totale" value={fmt(r.totalRamTo,2)+" To"} color={th.t1} th={th} />
        <KpiCard label="Statut HA" value={r.haRamOk&&r.haVcpuOk?"OK":"WARN"} color={r.haRamOk&&r.haVcpuOk?th.accent:th.warn} th={th} />
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
        <Card accent="accent" th={th}>
          <SectionTitle th={th}>Paramètres cluster</SectionTitle>
          <SliderField label="Nœuds" min={2} max={32} value={nodes} onChange={setNodes} th={th} />
          <SliderField label="Sockets / nœud" min={1} max={4} value={sockets} onChange={setSockets} th={th} />
          <SliderField label="Cœurs physiques / socket" min={4} max={64} step={2} value={cores} onChange={setCores} th={th} />
          <NumField label="RAM / nœud" value={ram} onChange={setRam} min={64} max={6144} step={64} unit="Go" note="Xeon typique : 256, 512, 768 Go" th={th} />
          <NumField label="Overcommit vCPU" value={overcommit} onChange={setOvercommit} min={1} max={10} step={0.25} unit="vCPU/cœur" note="Ratio standard recommandé" th={th} />
        </Card>
        <Card accent="accent2" th={th}>
          <SectionTitle th={th}>Résultats licensing</SectionTitle>
          <InfoBox type={r.haRamOk&&r.haVcpuOk?"ok":"alert"} th={th}>{r.haRamOk&&r.haVcpuOk?"Cluster HA validé — N-1 nominal":"Capacité HA insuffisante"}</InfoBox>
          <ResultRow label="Total sockets" value={fmt(r.totalSockets)+" sockets"} th={th} />
          <ResultRow label="Cœurs physiques" value={fmt(r.totalPhys)+" cœurs"} th={th} />
          <ResultRow label="Règle min 16/socket" value={fmt(r.billedPerSocket)+" cœurs"} th={th} />
          <ResultRow label="Cœurs facturés" value={fmt(r.totalBilled)+" cœurs"} highlight th={th} />
          <ResultRow label="Packs 2-cœurs" value={fmt(Math.ceil(r.totalBilled/2))+" packs"} highlight th={th} />
          <hr style={{border:"none",borderTop:`1px solid ${th.border}`,margin:"12px 0"}} />
          <ResultRow label="Cœurs N-1 (HA)" value={fmt(r.haCores)+" cœurs"} th={th} />
          <ResultRow label="RAM N-1 (HA)" value={fmt(r.haRam,2)+" To"} th={th} />
          <ResultRow label="Capacité perdue HA" value={fmt(r.haPct,1)+" %"} warn={r.haPct>20} th={th} />
        </Card>
        <Card th={th}>
          <SectionTitle th={th}>Normal vs HA vs Cible projet</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke={th.border} />
              <XAxis dataKey="name" tick={{fontSize:11,fill:th.t2}} />
              <YAxis tick={{fontSize:10,fill:th.t2}} />
              <Tooltip contentStyle={tt} />
              <Legend wrapperStyle={{fontSize:11,color:th.t2}} />
              <Bar dataKey="RAM" name="RAM (To)" fill={th.accent2} radius={[3,3,0,0]} />
              <Bar dataKey="vCPU" name="vCPU (×100)" fill={th.accent} radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{fontSize:10,color:th.t3,marginTop:8,fontFamily:"monospace"}}>Adapter les seuils selon les besoins du projet</div>
        </Card>
      </div>
    </div>
  );
}

// ─── 2. Windows & SQL ─────────────────────────────────────────────────────────
function WindowsCalc({th}) {
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
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
        <KpiCard label="Packs WS" value={fmt(r.wsLicenses)} th={th} />
        <KpiCard label="Packs SQL" value={fmt(r.sqlLicenses)} color={th.accent2} th={th} />
        <KpiCard label="VMs couvertes" value={wsEdition==="datacenter"?"Illimitées":fmt(vms)} color={th.t1} th={th} />
        <KpiCard label="Statut SQL" value={sqlWarn?"WARN":"OK"} color={sqlWarn?th.warn:th.accent} th={th} />
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
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

function M365Calc({th}) {
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
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
        <KpiCard label="Total users" value={fmt(r.total)} th={th} />
        <KpiCard label="Budget mensuel" value={fmt(r.monthly,0)+" €"} th={th} />
        <KpiCard label="Budget annuel" value={fmt(r.annual,0)+" €"} color={th.t1} th={th} />
        <KpiCard label="Coût / user / mois" value={fmt(r.ppu,2)+" €"} color={th.accent2} th={th} />
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
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

// ─── 4. Stockage (avancé)
// ─── StorageCalc V2 — Capacity Planning avancé ───────────────────────────────
// Drop-in replacement pour StorageCalc dans SizingHubV4.jsx

// Catalogue disques
const DISK_CATALOG = {
  "3.5": [
    { id: "nlsas-4",   label: "NLSAS 7.2K 4 To",   cap: 4,     iops: 120,  bw: 0.20, type: "NLSAS" },
    { id: "nlsas-8",   label: "NLSAS 7.2K 8 To",   cap: 8,     iops: 110,  bw: 0.20, type: "NLSAS" },
    { id: "nlsas-12",  label: "NLSAS 7.2K 12 To",  cap: 12,    iops: 100,  bw: 0.20, type: "NLSAS" },
    { id: "nlsas-16",  label: "NLSAS 7.2K 16 To",  cap: 16,    iops: 100,  bw: 0.20, type: "NLSAS" },
    { id: "nlsas-16f", label: "NLSAS 7.2K 16 To FIPS", cap: 16, iops: 100, bw: 0.20, type: "NLSAS" },
    { id: "nlsas-18",  label: "NLSAS 7.2K 18 To",  cap: 18,    iops: 95,   bw: 0.20, type: "NLSAS" },
    { id: "sas10-12",  label: "SAS 10K 1,2 To",    cap: 1.2,   iops: 200,  bw: 0.30, type: "SAS" },
    { id: "sas10-24",  label: "SAS 10K 2,4 To",    cap: 2.4,   iops: 200,  bw: 0.30, type: "SAS" },
    { id: "ssd-096",   label: "SSD RI 960 Go",      cap: 0.96,  iops: 50000, bw: 1.0, type: "SSD" },
    { id: "ssd-160",   label: "SSD MU 1,6 To",     cap: 1.6,   iops: 40000, bw: 1.0, type: "SSD" },
    { id: "ssd-192",   label: "SSD 1,92 To",        cap: 1.92,  iops: 45000, bw: 1.0, type: "SSD" },
    { id: "ssd-384",   label: "SSD 3,84 To",        cap: 3.84,  iops: 45000, bw: 1.0, type: "SSD" },
    { id: "ssd-768",   label: "SSD RI 7,68 To",     cap: 7.68,  iops: 40000, bw: 1.0, type: "SSD" },
    { id: "nvme-192",  label: "NVMe 1,92 To",       cap: 1.92,  iops: 200000, bw: 6.5, type: "NVMe" },
    { id: "nvme-384",  label: "NVMe 3,84 To",       cap: 3.84,  iops: 200000, bw: 6.5, type: "NVMe" },
    { id: "nvme-768",  label: "NVMe 7,68 To",       cap: 7.68,  iops: 180000, bw: 6.5, type: "NVMe" },
    { id: "nvme-1536", label: "NVMe 15,36 To",      cap: 15.36, iops: 160000, bw: 6.0, type: "NVMe" },
    { id: "nvme-3072", label: "NVMe 30,72 To",      cap: 30.72, iops: 140000, bw: 6.0, type: "NVMe" },
  ],
  "2.5": [
    { id: "sas10-12",  label: "SAS 10K 1,2 To",    cap: 1.2,   iops: 200,   bw: 0.30, type: "SAS" },
    { id: "sas10-24",  label: "SAS 10K 2,4 To",    cap: 2.4,   iops: 200,   bw: 0.30, type: "SAS" },
    { id: "sas10-24f", label: "SAS 10K 2,4 To FIPS",cap: 2.4,  iops: 200,   bw: 0.30, type: "SAS" },
    { id: "ssd-096",   label: "SSD RI 960 Go",      cap: 0.96,  iops: 50000, bw: 1.0,  type: "SSD" },
    { id: "ssd-160",   label: "SSD MU 1,6 To",      cap: 1.6,   iops: 40000, bw: 1.0,  type: "SSD" },
    { id: "ssd-192",   label: "SSD 1,92 To",        cap: 1.92,  iops: 45000, bw: 1.0,  type: "SSD" },
    { id: "ssd-192s",  label: "SSD SED 1,92 To",    cap: 1.92,  iops: 45000, bw: 1.0,  type: "SSD" },
    { id: "ssd-384",   label: "SSD 3,84 To",        cap: 3.84,  iops: 45000, bw: 1.0,  type: "SSD" },
    { id: "ssd-384f",  label: "SSD FIPS 3,84 To",   cap: 3.84,  iops: 45000, bw: 1.0,  type: "SSD" },
    { id: "ssd-768",   label: "SSD RI 7,68 To",     cap: 7.68,  iops: 40000, bw: 1.0,  type: "SSD" },
    { id: "nvme-192",  label: "NVMe 1,92 To",       cap: 1.92,  iops: 200000, bw: 6.5, type: "NVMe" },
    { id: "nvme-384",  label: "NVMe 3,84 To",       cap: 3.84,  iops: 200000, bw: 6.5, type: "NVMe" },
    { id: "nvme-768",  label: "NVMe 7,68 To",       cap: 7.68,  iops: 180000, bw: 6.5, type: "NVMe" },
    { id: "nvme-1536", label: "NVMe 15,36 To",      cap: 15.36, iops: 160000, bw: 6.0, type: "NVMe" },
  ],
};

const CHASSIS_TYPES = [
  { id: "3.5-12", label: '12 baies 3,5"', slots: 12, form: "3.5" },
  { id: "2.5-24", label: '24 baies 2,5"', slots: 24, form: "2.5" },
];

const RAID_OPTIONS = [
  { value: "raid1",  label: "RAID 1",  minDisks: 2 },
  { value: "raid5",  label: "RAID 5",  minDisks: 3 },
  { value: "raid6",  label: "RAID 6",  minDisks: 4 },
  { value: "raid10", label: "RAID 10", minDisks: 4 },
  { value: "none",   label: "JBOD",    minDisks: 1 },
];

const TYPE_COLORS = { NLSAS: "#8b90a0", SAS: "#0099ff", SSD: "#00d4aa", NVMe: "#ff6b35" };

let groupIdCounter = 1;
const newGroup = (form) => ({
  id: groupIdCounter++,
  diskId: DISK_CATALOG[form][0].id,
  count: 4,
  raid: "raid6",
  hotSpares: 0,
});

let chassisIdCounter = 1;
const newChassis = (typeId) => {
  const t = CHASSIS_TYPES.find(c => c.id === typeId);
  return { id: chassisIdCounter++, typeId, label: t.label, slots: t.slots, form: t.form, groups: [newGroup(t.form)] };
};

function raidUsableRatio(raid, n) {
  if (n < 1) return 0;
  switch (raid) {
    case "raid1":  return n >= 2 ? 0.5 : 0;
    case "raid5":  return n >= 3 ? (n - 1) / n : 0;
    case "raid6":  return n >= 4 ? (n - 2) / n : 0;
    case "raid10": return n >= 4 && n % 2 === 0 ? 0.5 : 0;
    case "none":   return 1;
    default:       return 0;
  }
}

function calcGroup(group, catalog) {
  const disk = catalog.find(d => d.id === group.diskId) || catalog[0];
  const dataDisks = Math.max(0, group.count - group.hotSpares);
  const ratio = raidUsableRatio(group.raid, dataDisks);
  const physical = group.count * disk.cap;
  const usable = dataDisks * disk.cap * ratio;
  const iops = dataDisks * disk.iops * (group.raid === "raid5" ? 0.75 : group.raid === "raid6" ? 0.65 : 1);
  const bw = dataDisks * disk.bw;
  return { disk, physical, usable, iops, bw, ratio, dataDisks };
}


function StorageCalc({ th }) {
  

  const [chassisList, setChassisList] = useState([newChassis("3.5-12")]);
  const [dedup, setDedup] = useState(1);
  const [iopsTarget, setIopsTarget] = useState(50000);

  // ── Chassis CRUD ──
  const addChassis = () => setChassisList(prev => [...prev, newChassis("3.5-12")]);
  const removeChassis = (cid) => setChassisList(prev => prev.filter(c => c.id !== cid));
  const updateChassisType = (cid, typeId) => {
    const t = CHASSIS_TYPES.find(x => x.id === typeId);
    setChassisList(prev => prev.map(c => c.id === cid
      ? { ...c, typeId, label: t.label, slots: t.slots, form: t.form, groups: [newGroup(t.form)] }
      : c));
  };

  // ── Group CRUD ──
  const addGroup = (cid) => {
    setChassisList(prev => prev.map(c => {
      if (c.id !== cid) return c;
      const usedSlots = c.groups.reduce((s, g) => s + g.count + g.hotSpares, 0);
      if (usedSlots >= c.slots) return c;
      return { ...c, groups: [...c.groups, newGroup(c.form)] };
    }));
  };
  const removeGroup = (cid, gid) => setChassisList(prev => prev.map(c =>
    c.id !== cid ? c : { ...c, groups: c.groups.filter(g => g.id !== gid) }));
  const updateGroup = (cid, gid, patch) => setChassisList(prev => prev.map(c =>
    c.id !== cid ? c : { ...c, groups: c.groups.map(g => g.id === gid ? { ...g, ...patch } : g) }));

  // ── Totaux ──
  const totals = useMemo(() => {
    let physical = 0, usable = 0, effective = 0, iops = 0, bw = 0;
    chassisList.forEach(c => {
      const catalog = DISK_CATALOG[c.form];
      c.groups.forEach(g => {
        const r = calcGroup(g, catalog);
        physical += r.physical;
        usable += r.usable;
        effective += r.usable * dedup;
        iops += r.iops;
        bw += r.bw;
      });
    });
    return { physical, usable, effective, iops, bw, iopsOk: iops >= iopsTarget };
  }, [chassisList, dedup, iopsTarget]);

  const chartData = [
    { name: "Capacité physique", value: +totals.physical.toFixed(2) },
    { name: "Utile (RAID)", value: +totals.usable.toFixed(2) },
    { name: "Effective (dédup)", value: +totals.effective.toFixed(2) },
  ];

  const s = {
    tag: (color) => ({ display:"inline-block", fontSize:9, padding:"2px 6px", borderRadius:3, background:color+"22", color, border:`1px solid ${color}44`, fontFamily:"monospace", marginLeft:6 }),
    groupCard: { background:th.bg2, border:`1px solid ${th.border}`, borderRadius:4, padding:"12px 14px", marginBottom:10 },
    row: { display:"flex", alignItems:"center", gap:10, marginBottom:8 },
    label: { fontSize:10, color:th.t3, fontFamily:"monospace", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4, display:"block" },
    input: { background:th.bg1, border:`1px solid ${th.border}`, borderRadius:4, padding:"6px 8px", color:th.t1, fontFamily:"monospace", fontSize:12, width:"100%", boxSizing:"border-box" },
    select: { background:th.bg1, border:`1px solid ${th.border}`, borderRadius:4, padding:"6px 8px", color:th.t1, fontFamily:"monospace", fontSize:12, width:"100%", boxSizing:"border-box" },
    btn: (color) => ({ cursor:"pointer", fontSize:11, padding:"5px 12px", borderRadius:4, border:`1px solid ${color}44`, background:color+"11", color, fontFamily:"monospace" }),
    btnSm: (color) => ({ cursor:"pointer", fontSize:10, padding:"3px 8px", borderRadius:3, border:`1px solid ${color}44`, background:color+"11", color, fontFamily:"monospace" }),
    divider: { border:"none", borderTop:`1px solid ${th.border}`, margin:"12px 0" },
    sectionTitle: { fontSize:10, fontWeight:600, color:th.t2, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:14, paddingBottom:8, borderBottom:`1px solid ${th.border}`, fontFamily:"monospace" },
  };

  
  const tt = { background:th.tooltipBg, border:`1px solid ${th.border2}`, borderRadius:4, fontSize:11, color:th.t1 };

  return (
    <div>
      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:20}}>
        {[
          {label:"Capacité physique", val:fmt(totals.physical,2)+" To", color:th.t1},
          {label:"Utile (RAID)", val:fmt(totals.usable,2)+" To", color:th.accent},
          {label:"Effective (dédup)", val:fmt(totals.effective,2)+" To", color:th.accent},
          {label:"IOPS totaux", val:fmt(totals.iops), color:totals.iopsOk?th.accent:th.warn},
          {label:"Bande passante", val:fmt(totals.bw,2)+" GB/s", color:th.accent2},
        ].map(k => (
          <div key={k.label} style={{background:th.cardBg,border:`1px solid ${th.border}`,borderRadius:6,padding:14}}>
            <div style={{fontSize:10,color:th.t3,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>{k.label}</div>
            <div style={{fontSize:20,fontWeight:600,fontFamily:"monospace",color:k.color}}>{k.val}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 380px",gap:14}}>
        {/* Colonne gauche — config chassis */}
        <div>
          {chassisList.map((chassis, ci) => {
            const catalog = DISK_CATALOG[chassis.form];
            const usedSlots = chassis.groups.reduce((s, g) => s + g.count, 0);
            const remainSlots = chassis.slots - usedSlots;

            return (
              <div key={chassis.id} style={{background:th.cardBg,border:`1px solid ${th.border}`,borderLeft:`2px solid ${th.accent}`,borderRadius:6,padding:16,marginBottom:14}}>
                {/* Header chassis */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:12,fontWeight:600,color:th.t1,fontFamily:"monospace"}}>Chassis {ci+1}</span>
                    <select value={chassis.typeId} onChange={e=>updateChassisType(chassis.id,e.target.value)} style={{...s.select,width:"auto"}}>
                      {CHASSIS_TYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                    <span style={{fontSize:10,color:remainSlots<0?th.danger:th.t3,fontFamily:"monospace"}}>
                      {usedSlots}/{chassis.slots} baies utilisées
                    </span>
                    {remainSlots < 0 && <span style={s.tag(th.danger)}>DÉPASSEMENT</span>}
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>addGroup(chassis.id)} style={s.btnSm(th.accent)}>+ Groupe</button>
                    {chassisList.length > 1 && <button onClick={()=>removeChassis(chassis.id)} style={s.btnSm(th.danger)}>✕ Chassis</button>}
                  </div>
                </div>

                {/* Groupes de disques */}
                {chassis.groups.map((group, gi) => {
                  const disk = catalog.find(d=>d.id===group.diskId)||catalog[0];
                  const gr = calcGroup(group, catalog);
                  return (
                    <div key={group.id} style={s.groupCard}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                        <span style={{fontSize:11,fontWeight:600,color:th.t2,fontFamily:"monospace"}}>
                          Groupe {gi+1}
                          <span style={s.tag(TYPE_COLORS[disk.type]||th.t2)}>{disk.type}</span>
                        </span>
                        {chassis.groups.length > 1 && <button onClick={()=>removeGroup(chassis.id,group.id)} style={s.btnSm(th.danger)}>✕</button>}
                      </div>

                      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:8,marginBottom:8}}>
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
                            style={s.input} />
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
                            onChange={e=>updateGroup(chassis.id,group.id,{hotSpares:Math.max(0,Number(e.target.value))})}
                            style={s.input} />
                        </div>
                      </div>

                      {/* Résumé groupe */}
                      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
                        {[
                          {label:"Physique",val:fmt(gr.physical,2)+" To",color:th.t2},
                          {label:"Utile RAID",val:fmt(gr.usable,2)+" To",color:th.accent},
                          {label:"IOPS",val:fmt(gr.iops),color:TYPE_COLORS[disk.type]||th.t1},
                          {label:"BW",val:fmt(gr.bw,2)+" GB/s",color:th.accent2},
                        ].map(k=>(
                          <div key={k.label} style={{background:th.bg0,borderRadius:4,padding:"6px 8px",border:`1px solid ${th.border}`}}>
                            <div style={{fontSize:9,color:th.t3,fontFamily:"monospace",textTransform:"uppercase",marginBottom:3}}>{k.label}</div>
                            <div style={{fontSize:12,fontWeight:600,fontFamily:"monospace",color:k.color}}>{k.val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          <button onClick={addChassis} style={{...s.btn(th.accent),width:"100%",marginBottom:14}}>+ Ajouter un chassis</button>

          {/* Dédup global */}
          <div style={{background:th.cardBg,border:`1px solid ${th.border}`,borderLeft:`2px solid ${th.accent2}`,borderRadius:6,padding:16}}>
            <div style={s.sectionTitle}>Paramètres globaux du pool</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
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
                  onChange={e=>setIopsTarget(Number(e.target.value))}
                  style={s.input} />
              </div>
            </div>
          </div>
        </div>

        {/* Colonne droite — résultats */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{background:th.cardBg,border:`1px solid ${th.border}`,borderLeft:`2px solid ${th.accent2}`,borderRadius:6,padding:16}}>
            <div style={s.sectionTitle}>Récapitulatif pool</div>
            {[
              {label:"Capacité physique brute", val:fmt(totals.physical,2)+" To", color:th.t2},
              {label:"Utile après RAID", val:fmt(totals.usable,2)+" To", color:th.accent},
              {label:"Effective après dédup ×"+dedup, val:fmt(totals.effective,2)+" To", color:th.accent, highlight:true},
              {label:"IOPS totaux agrégés", val:fmt(totals.iops), color:totals.iopsOk?th.accent:th.warn},
              {label:"Bande passante totale", val:fmt(totals.bw,2)+" GB/s", color:th.accent2},
              {label:"Validation IOPS cible", val:totals.iopsOk?"✓ Atteinte":"✗ Insuffisants", color:totals.iopsOk?th.accent:th.danger},
            ].map(r=>(
              <div key={r.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${th.border}`}}>
                <span style={{fontSize:12,color:th.t2}}>{r.label}</span>
                <span style={{fontFamily:"monospace",fontWeight:600,fontSize:13,color:r.color}}>{r.val}</span>
              </div>
            ))}
          </div>

          {/* Graphique capacité */}
          <div style={{background:th.cardBg,border:`1px solid ${th.border}`,borderRadius:6,padding:16,flex:1}}>
            <div style={s.sectionTitle}>Visualisation capacité (To)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke={th.border} horizontal={false} />
                <XAxis type="number" tick={{fontSize:10,fill:th.t2}} unit=" To" />
                <YAxis dataKey="name" type="category" tick={{fontSize:10,fill:th.t2}} width={110} />
                <Tooltip contentStyle={tt} formatter={v=>[fmt(v,2)+" To"]} />
                <Bar dataKey="value" radius={[0,3,3,0]}
                  fill={th.accent}
                  label={{position:"right",fontSize:10,fill:th.t2,formatter:v=>fmt(v,2)+" To"}} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{fontSize:10,color:th.t3,marginTop:8,fontFamily:"monospace",textAlign:"center"}}>
              Ratio dédup ×{dedup} — Gain : +{fmt((totals.effective-totals.usable),2)} To
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── 5. Veeam ─────────────────────────────────────────────────────────────────
function VeeamCalc({th}) {
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
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
        <KpiCard label="Données source" value={fmt(r.srcTB,2)+" To"} th={th} />
        <KpiCard label="Stockage repo" value={fmt(r.repoMargin,2)+" To"} th={th} />
        <KpiCard label="Fenêtre backup" value={r.windowOk?"OK":"SERRÉ"} color={r.windowOk?th.accent:th.warn} th={th} />
        <KpiCard label="Licences VMs" value={fmt(vms)} color={th.accent2} th={th} />
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
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

// ─── App Shell ────────────────────────────────────────────────────────────────
const TOOLS=[
  {id:"vmware",  label:"VMware / VCF",     icon:Cpu,      section:"VIRTUALISATION", comp:VMwareCalc,  badge:"VVF / VCF", sub:"VVF · VCF · Licence par cœur"},
  {id:"windows", label:"Windows & SQL",    icon:Server,   section:"MICROSOFT",      comp:WindowsCalc, badge:"Microsoft", sub:"Packs 2-cœurs · DC / STD"},
  {id:"m365",    label:"Microsoft 365",    icon:Cloud,    section:"MICROSOFT",      comp:M365Calc,    badge:"M365",      sub:"Sizing par profil utilisateur"},
  {id:"storage", label:"Capacity Planning",icon:HardDrive,section:"STOCKAGE",       comp:StorageCalc, badge:"Storage",   sub:"SAN · NAS · IOPS · RAID"},
  {id:"veeam",   label:"Veeam Backup",     icon:Shield,   section:"BACKUP",         comp:VeeamCalc,   badge:"Veeam v12", sub:"VBR · Cloud Connect · BaaS"},
];

export default function SizingHub() {
  const [active,setActive]=useState("vmware");
  const [dark,setDark]=useState(true);
  const th=dark?DARK:LIGHT;
  const tool=TOOLS.find(t=>t.id===active);
  const ActiveComp=tool.comp;
  const sections=[...new Set(TOOLS.map(t=>t.section))];

  return (
    <div style={{fontFamily:"'Inter',system-ui,sans-serif",background:th.bg0,color:th.t1,minHeight:"100vh",display:"flex",transition:"background 0.2s,color 0.2s"}}>
      {/* Sidebar */}
      <div style={{width:210,minWidth:210,background:th.bg1,borderRight:`1px solid ${th.border}`,display:"flex",flexDirection:"column",padding:"16px 0",transition:"background 0.2s"}}>
        <div style={{padding:"0 16px 16px",borderBottom:`1px solid ${th.border}`,marginBottom:12}}>
          <div style={{fontSize:15,fontWeight:700,color:th.accent,letterSpacing:"0.08em",textTransform:"uppercase"}}>SizingHub</div>
          <div style={{fontSize:10,color:th.t3,fontFamily:"monospace",marginTop:2}}>v2.0 · Infrastructure Sizing</div>
        </div>
        {sections.map(section=>(
          <div key={section}>
            <div style={{padding:"8px 16px 4px",fontSize:9,color:th.t3,textTransform:"uppercase",letterSpacing:"0.12em",fontFamily:"monospace"}}>{section}</div>
            {TOOLS.filter(t=>t.section===section).map(t=>(
              <div key={t.id} onClick={()=>setActive(t.id)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px",cursor:"pointer",fontSize:12,color:active===t.id?th.accent:th.t2,borderLeft:`2px solid ${active===t.id?th.accent:"transparent"}`,background:active===t.id?`rgba(0,212,170,0.06)`:"transparent",transition:"all 0.15s"}}>
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
      <div style={{flex:1,overflowY:"auto",background:th.bg0,transition:"background 0.2s"}}>
        <div style={{padding:28}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
            <div>
              <div style={{fontSize:20,fontWeight:700,color:th.t1}}>{tool.label}</div>
              <div style={{fontSize:11,color:th.t3,fontFamily:"monospace",marginTop:3}}>{tool.sub}</div>
            </div>
            <div style={{fontSize:9,background:dark?"rgba(0,212,170,0.1)":"rgba(0,168,132,0.1)",color:th.accent,padding:"4px 10px",borderRadius:3,fontFamily:"monospace",border:`1px solid ${th.border2}`,textTransform:"uppercase",letterSpacing:"0.08em"}}>{tool.badge}</div>
          </div>
          <ActiveComp th={th} />
        </div>
      </div>
    </div>
  );
}
