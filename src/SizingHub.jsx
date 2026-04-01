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
    return {totalSockets,totalPhys,billedPerSocket,totalBilled,totalRamTo,vcpuTotal,haRam,haCores,haVcpu,haPct,haRamOk:haRam>=4.5,haVcpuOk:haVcpu>=750};
  },[nodes,sockets,cores,ram,overcommit]);

  const chartData=[
    {name:"Normal",RAM:+r.totalRamTo.toFixed(2),vCPU:+(r.vcpuTotal/100).toFixed(1)},
    {name:"HA (N-1)",RAM:+r.haRam.toFixed(2),vCPU:+(r.haVcpu/100).toFixed(1)},
    {name:"Cible CDC",RAM:4.5,vCPU:7.5},
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
          <NumField label="Overcommit vCPU" value={overcommit} onChange={setOvercommit} min={1} max={10} step={0.25} unit="vCPU/cœur" note="CDC CESI : 3,75 recommandé" th={th} />
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
          <SectionTitle th={th}>Normal vs HA vs Cible CDC</SectionTitle>
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
          <div style={{fontSize:10,color:th.t3,marginTop:8,fontFamily:"monospace"}}>Cibles CDC : RAM ≥ 4,5 To · vCPU ≥ 750 · perte &lt; 20 %</div>
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

// ─── 4. Stockage ──────────────────────────────────────────────────────────────
function StorageCalc({th}) {
  const [rawCapacity,setRawCapacity]=useState(230);
  const [raidLevel,setRaidLevel]=useState("raid6");
  const [dedupRatio,setDedupRatio]=useState(1);
  const [driveSize,setDriveSize]=useState(7.68);
  const [driveCount,setDriveCount]=useState(24);
  const [iopsTarget,setIopsTarget]=useState(50000);
  const [iopsPerDrive,setIopsPerDrive]=useState(350000);
  const [bwTarget,setBwTarget]=useState(25);

  const r = useMemo(()=>{
    const RAID={raid1:0.5,raid5:(driveCount-1)/driveCount,raid6:(driveCount-2)/driveCount,raid10:0.5,none:1};
    const overhead=RAID[raidLevel]||1;
    const rawTotal=driveCount*driveSize;
    const usableRaw=rawTotal*overhead;
    const usableWithDedup=usableRaw*dedupRatio;
    const iopsAvail=driveCount*iopsPerDrive;
    const hotSpares=driveCount>12?2:1;
    const usableWithSpares=(driveCount-hotSpares)*driveSize*overhead*dedupRatio;
    const pctUsed=rawCapacity/usableWithDedup*100;
    return {rawTotal,usableRaw,usableWithDedup,usableWithSpares,iopsAvail,hotSpares,overhead:overhead*100,pctUsed,iopsOk:iopsAvail>=iopsTarget,capacityOk:usableWithDedup>=rawCapacity};
  },[rawCapacity,raidLevel,dedupRatio,driveSize,driveCount,iopsTarget,iopsPerDrive]);

  const chartData=[
    {name:"Brut total",value:+r.rawTotal.toFixed(1)},
    {name:"Utile (RAID)",value:+r.usableRaw.toFixed(1)},
    {name:"Utile (dédup)",value:+r.usableWithDedup.toFixed(1)},
    {name:"Cible",value:rawCapacity},
  ];
  const tt={background:th.tooltipBg,border:`1px solid ${th.border2}`,borderRadius:4,fontSize:11,color:th.t1};

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
        <KpiCard label="Capacité brute" value={fmt(r.rawTotal,1)+" To"} th={th} />
        <KpiCard label="Capacité utile" value={fmt(r.usableWithDedup,1)+" To"} color={r.capacityOk?th.accent:th.warn} th={th} />
        <KpiCard label="IOPS disponibles" value={fmt(r.iopsAvail)} color={r.iopsOk?th.t1:th.warn} th={th} />
        <KpiCard label="Efficacité RAID" value={fmt(r.overhead,0)+" %"} color={th.accent2} th={th} />
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
        <Card accent="accent" th={th}>
          <SectionTitle th={th}>Configuration baie</SectionTitle>
          <NumField label="Capacité cible nette" value={rawCapacity} onChange={setRawCapacity} min={1} step={10} unit="To" note="Besoin réel après marge de croissance" th={th} />
          <NumField label="Nombre de disques" value={driveCount} onChange={setDriveCount} min={4} max={500} unit="disques" th={th} />
          <NumField label="Taille par disque" value={driveSize} onChange={setDriveSize} min={0.96} max={100} step={0.96} unit="To" note="NVMe : 3,84 / 7,68 / 15,36 To" th={th} />
          <SelectField label="Niveau RAID" value={raidLevel} onChange={setRaidLevel} th={th}
            options={[{value:"raid1",label:"RAID 1 (miroir, eff. 50%)"},{value:"raid5",label:"RAID 5 (N-1 parité)"},{value:"raid6",label:"RAID 6 (N-2 parités, recommandé)"},{value:"raid10",label:"RAID 10 (miroir+stripe, eff. 50%)"},{value:"none",label:"Sans RAID (raw)"}]} />
          <NumField label="Ratio dédup/compression" value={dedupRatio} onChange={setDedupRatio} min={1} max={10} step={0.1} unit="×" note="1 = pas de dédup" th={th} />
        </Card>
        <Card accent="accent2" th={th}>
          <SectionTitle th={th}>Performances IOPS</SectionTitle>
          <NumField label="IOPS cibles" value={iopsTarget} onChange={setIopsTarget} min={1000} max={10000000} step={5000} unit="IOPS" note="CDC CESI : ≥ 50 000 IOPS" th={th} />
          <NumField label="IOPS par disque" value={iopsPerDrive} onChange={setIopsPerDrive} min={10000} max={2000000} step={50000} unit="IOPS/disque" note="NVMe SSD : 350 000 – 700 000 IOPS" th={th} />
          <NumField label="Bande passante cible" value={bwTarget} onChange={setBwTarget} min={1} max={400} unit="Gbps" note="CDC CESI : 25 Gbps minimum" th={th} />
          <hr style={{border:"none",borderTop:`1px solid ${th.border}`,margin:"12px 0"}} />
          <InfoBox type={r.iopsOk?"ok":"alert"} th={th}>{r.iopsOk?"IOPS suffisants":"IOPS insuffisants — ajouter des disques"}</InfoBox>
          <ResultRow label="IOPS disponibles" value={fmt(r.iopsAvail)} highlight={r.iopsOk} warn={!r.iopsOk} th={th} />
          <ResultRow label="Ratio IOPS dispo/cible" value={fmt(r.iopsAvail/iopsTarget,2)+" ×"} th={th} />
          <ResultRow label="Hot spare(s)" value={fmt(r.hotSpares)+" disque(s)"} th={th} />
          <ResultRow label="Utile avec hot spares" value={fmt(r.usableWithSpares,1)+" To"} highlight={r.usableWithSpares>=rawCapacity} th={th} />
          <ResultRow label="Taux de remplissage" value={fmt(r.pctUsed,1)+" %"} warn={r.pctUsed>80} th={th} />
        </Card>
        <Card th={th}>
          <SectionTitle th={th}>Visualisation capacité</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} layout="vertical" barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke={th.border} horizontal={false} />
              <XAxis type="number" tick={{fontSize:10,fill:th.t2}} unit=" To" />
              <YAxis dataKey="name" type="category" tick={{fontSize:10,fill:th.t2}} width={90} />
              <Tooltip contentStyle={tt} formatter={v=>[fmt(v,1)+" To"]} />
              <Bar dataKey="value" fill={th.accent} radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
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
