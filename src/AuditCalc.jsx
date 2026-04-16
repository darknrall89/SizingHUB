import { useState } from "react";
import { Modal3Tiers, ModalHCI } from "./ScenarioModal.jsx";
import * as XLSX from "xlsx";

export default function AuditCalc({ th, isMobile=false }) {
  const [files,      setFiles]      = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [report,     setReport]     = useState(null);
  const [error,      setError]      = useState(null);
  const [targetType, setTargetType] = useState("onpremise");
  const [activeTab,  setActiveTab]  = useState("overview");
  const [activeHost,   setActiveHost]   = useState(0);
  const [projectName,  setProjectName]  = useState("");
  const [generating,   setGenerating]   = useState(false);
  const [scenarios,    setScenarios]    = useState(null);
  const [scenarioErr,  setScenarioErr]  = useState(null);
  const [activeModal,  setActiveModal]  = useState(null);

  const s = {
    card:  { background:th.cardBg, border:"1px solid "+th.border, borderRadius:8, padding:20, marginBottom:14 },
    title: { fontSize:11, fontWeight:600, color:th.t2, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12, fontFamily:"monospace" },
    btn:   { padding:"8px 16px", background:th.accent, border:"none", borderRadius:6, color:"#fff", fontWeight:600, fontSize:12, cursor:"pointer" },
    kpi:   { background:th.bg2, borderRadius:6, padding:"12px 14px" },
    kpiL:  { fontSize:9, color:th.t3, textTransform:"uppercase", fontFamily:"monospace", marginBottom:4 },
    kpiV:  { fontSize:18, fontWeight:700, fontFamily:"monospace", color:th.t1 },
    kpiS:  { fontSize:9, color:th.t3, marginTop:2 },
  };

  const Gauge = ({pct, label, sub}) => {
    const c = pct > 80 ? "#cc3333" : pct > 60 ? "#d97706" : "#00a884";
    return (
      <div style={{marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
          <span style={{fontSize:11,color:th.t2}}>{label}</span>
          <span style={{fontSize:11,fontWeight:700,fontFamily:"monospace",color:c}}>{pct}%</span>
        </div>
        <div style={{background:th.bg2,borderRadius:4,height:8,overflow:"hidden"}}>
          <div style={{width:pct+"%",height:"100%",background:c,borderRadius:4,transition:"width 0.5s"}}/>
        </div>
        {sub&&<div style={{fontSize:9,color:th.t3,marginTop:2}}>{sub}</div>}
      </div>
    );
  };

  const parseRVTools = (wb, fileName) => {
    const getJson = (name) => {
      const ws = wb.Sheets[name];
      return ws ? XLSX.utils.sheet_to_json(ws, {defval:null}) : [];
    };
    const vInfo      = getJson("vInfo");
    const vHost      = getJson("vHost");
    const vDatastore = getJson("vDatastore");

    const vms   = vInfo.filter(r => r["Template"] !== "True" && r["Template"] !== true);
    const vmOn  = vms.filter(r => r["Powerstate"] === "poweredOn");
    const vmOff = vms.filter(r => r["Powerstate"] === "poweredOff");
    const now   = new Date();
    const vmOff20 = vmOff.filter(r => {
      if (!r["PowerOn"]) return true;
      return (now - new Date(r["PowerOn"])) > 20*24*3600*1000;
    });

    const totalVcpu   = vmOn.reduce((s,r)=>s+(r["CPUs"]||0),0);
    const totalRamGo  = Math.round(vmOn.reduce((s,r)=>s+(r["Memory"]||0),0)/1024);
    const totalDiskTo = (vmOn.reduce((s,r)=>s+(r["Total disk capacity MiB"]||0),0)/1024/1024).toFixed(1);

    const osCount = {};
    vms.forEach(r=>{
      const os = r["OS according to the VMware Tools"]||r["OS according to the configuration file"]||"Unknown";
      osCount[os]=(osCount[os]||0)+1;
    });
    const osDistrib = Object.entries(osCount).sort((a,b)=>b[1]-a[1]);

    const vSwitchData = getJson("vSwitch");
    const hosts = vHost.map(h=>{
      const hostVms = vmOn.filter(v=>v["Host"]===h["Host"]);
      return {
        name: h["Host"],
        shortName: (h["Host"]||"").split(".")[0],
        cpuModel: (h["CPU Model"]||"").replace(/\(R\)/g,"").replace(/\(TM\)/g,""),
        cores: h["# Cores"]||0,
        cpuUsagePct: h["CPU usage %"]||0,
        ramGo: Math.round((h["# Memory"]||0)/1024),
        ramUsagePct: h["Memory usage %"]||0,
        vmsCount: h["# VMs"]||0,
        esxVersion: h["ESX Version"]||"N/A",
        vendor: h["Vendor"]||"N/A",
        model: h["Model"]||"N/A",
        nics: h["# NICs"]||0,
        vSwitches: vSwitchData.filter(sw=>(sw["Host"]||"")===(h["Host"]||"")).map(sw=>sw["Switch"]||""),
        vms: hostVms.map(v=>({
          name: v["VM"],
          vcpu: v["CPUs"]||0,
          ramGo: Math.round((v["Memory"]||0)/1024),
          os: v["OS according to the VMware Tools"]||"N/A",
          diskGo: Math.round((v["Total disk capacity MiB"]||0)/1024),
          powerstate: v["Powerstate"],
        })),
      };
    });

    const datastores = getJson("vDatastore").map(d=>({
      name: d["Name"]||"N/A",
      type: d["Type"]||"N/A",
      capMib: d["Capacity MiB"]||0,
      inUseMib: d["In Use MiB"]||0,
      freePct: d["Free %"]||0,
      vms: d["# VMs"]||0,
      hosts: d["# Hosts"]||0,
    })).filter(d=>d.capMib>0);

    const vmOffList = vmOff.map(v => ({
      name: v["VM"],
      powerOn: v["PowerOn"] ? new Date(v["PowerOn"]) : null,
      creationDate: v["Creation date"] ? new Date(v["Creation date"]) : null,
      daysSince: v["PowerOn"] ? Math.round((now - new Date(v["PowerOn"])) / (24*3600*1000)) : null,
      cpu: v["CPUs"]||0,
      ramGo: Math.round((v["Memory"]||0)/1024),
      diskGo: Math.round((v["Total disk capacity MiB"]||0)/1024),
      os: v["OS according to the VMware Tools"]||"N/A",
      host: (v["Host"]||"").split(".")[0],
    })).sort((a,b)=>(b.daysSince||999)-(a.daysSince||999));
    const dvPort = getJson("dvPort");
    const dvVlans = dvPort.filter(d=>d["VLAN"]!==null&&d["VLAN"]!==undefined).map(d=>({
      name: d["Port"]||"N/A", vlan:d["VLAN"], switch:d["Switch"]||"N/A", ports:d["# Ports"]||0, speed:d["Speed"]||0, type:"dvSwitch"
    }));
    const vPortData2 = getJson("vPort");
    const vsVlans = vPortData2.filter(d=>d["VLAN"]!==null&&d["VLAN"]!==undefined).map(d=>({
      name: d["Port Group"]||"N/A", vlan:d["VLAN"], switch:d["Switch"]||"N/A", ports:0, speed:0, type:"vSwitch"
    }));
    const allVlans = dvVlans.length>0 ? dvVlans : vsVlans;
    const vlans = [...new Map(allVlans.map(v=>[v.name+v.vlan,v])).values()].sort((a,b)=>(a.vlan||0)-(b.vlan||0));
    const vPortData = getJson("vPort");
    const uniquePortGroups = [...new Map(vPortData.map(p=>[p["Port Group"]+p["VLAN"],{host:(p["Host"]||"").split(".")[0],portGroup:p["Port Group"]||"N/A",switch:p["Switch"]||"N/A",vlan:p["VLAN"]}])).values()];
    // vSwitch avec port groups
    const vPortAll = getJson("vPort");
    const vSwitches = vSwitchData.map(sw=>({
      host: (sw["Host"]||"").split(".")[0],
      name: sw["Switch"]||"N/A",
      ports: sw["# Ports"]||0,
      freePorts: sw["Free Ports"]||0,
      mtu: sw["MTU"]||0,
      portGroups: vPortAll.filter(p=>p["Switch"]===sw["Switch"]&&(p["Host"]||"").split(".")[0]===(sw["Host"]||"").split(".")[0]).map(p=>({
        name: p["Port Group"]||"N/A",
        vlan: p["VLAN"],
      })),
    }));

    // dvSwitch
    const dvSwitchData = getJson("dvSwitch");
    const dvSwitches = dvSwitchData.map(dv=>({
      name: dv["Name"]||dv["Switch"]||"N/A",
      version: dv["Version"]||"N/A",
      hosts: dv["Host members"]||"N/A",
      ports: dv["# Ports"]||0,
      vms: dv["# VMs"]||0,
      mtu: dv["Max MTU"]||0,
    }));

    const vNetData = getJson("vNetwork");
    const vmNics = {};
    vNetData.filter(r=>r["Template"]!=="True"&&r["Powerstate"]==="poweredOn").forEach(r=>{
      if (!vmNics[r["VM"]]) vmNics[r["VM"]]=[];
      vmNics[r["VM"]].push({nic:r["NIC label"]||"",network:r["Network"]||"N/A",ip:r["IPv4 Address"]||"N/A",switch:r["Switch"]||"N/A"});
    });
    const esxVersions = [...new Set(vHost.map(r=>r["ESX Version"]).filter(Boolean))];
    return {
      fileName, source:"RVTools",
      vendor: vHost[0]?.["Vendor"]||"N/A",
      model:  vHost[0]?.["Model"]||"N/A",
      esxVersions,
      vmsTotal:vms.length, vmOn:vmOn.length, vmOff:vmOff.length, vmOff20:vmOff20.length,
      totalVcpu, totalRamGo, totalDiskTo,
      hosts, osDistrib, datastores,
      hostsCount: vHost.length,
      totalCores: vHost.reduce((s,h)=>s+(h["# Cores"]||0),0),
      totalRamPhysGo: Math.round(vHost.reduce((s,h)=>s+(h["# Memory"]||0),0)/1024),
      vmOffList, vlans, uniquePortGroups, vmNics, vSwitches, dvSwitches,
    };
  };

  const generateScenarios = async () => {
    if (!r) return;
    setGenerating(true);
    setScenarioErr(null);
    setScenarios(null);

    const growthFactor   = 1.3;
    const overcommit     = 4;
    const haNodes        = 1;
    const minNodes       = 3;
    const vcpuTarget     = Math.ceil(r.totalVcpu * growthFactor);
    const ramTarget      = Math.ceil(r.totalRamGo * growthFactor);
    const stoTarget      = Math.ceil(parseFloat(r.totalDiskTo) * growthFactor);
    const coresNeeded    = Math.ceil(vcpuTarget / overcommit);
    const activeNodes    = minNodes - haNodes;
    const coresPerNode   = Math.ceil(coresNeeded / activeNodes);
    const coresPerSocket = Math.ceil(coresPerNode / 2);
    const VALID_CORES    = [8,10,12,14,16,20,24,28,32,36,40,48,56,64,96,128,192];
    const recCoresSocket = VALID_CORES.find(c => c >= coresPerSocket) || 16;
    const recCoresNode   = recCoresSocket * 2;
    const recRamNode     = Math.ceil(ramTarget / activeNodes / 64) * 64;
    const recNodes       = minNodes;
    const prompt = `Tu es un architecte infrastructure IT expert en avant-vente.
Voici les donnees EXACTES de l infrastructure existante (source RVTools) :

INFRASTRUCTURE ACTUELLE :
- Constructeur actuel : ${r.vendor} ${r.model}
- Hyperviseur : ${r.esxVersions[0]||"VMware"}
- Nombre de hosts : ${r.hostsCount} hosts
- CPU par host : ${r.hosts[0]?.cpuModel||"N/A"} — ${r.hosts[0]?.cores||0} cores physiques/host
- RAM par host : ${r.hosts[0]?.ramGo||0} Go/host
- Total CPU physique : ${r.totalCores} cores
- Total RAM physique : ${r.totalRamPhysGo} Go
- VMs actives : ${r.vmOn} VMs
- vCPU alloues : ${r.totalVcpu} vCPU
- RAM allouee : ${r.totalRamGo} Go
- Stockage utilise : ${r.totalDiskTo} To

CIBLE DE SIZING (avec 30% de croissance) :
- vCPU necessaires : ${vcpuTarget} vCPU (overcommit 4:1 recommande)
- RAM necessaire : ${ramTarget} Go
- Stockage necessaire : ${stoTarget} To
- Politique HA : N+1 obligatoire (1 noeud peut tomber sans impact)

CONTRAINTES DE SIZING STRICTES :
- Minimum 3 noeuds OBLIGATOIRE pour tous les scenarios
- En mode N+1, les noeuds restants doivent absorber ${vcpuTarget} vCPU et ${ramTarget} Go RAM
- Choisir des CPU avec 16 a 32 cores par socket maximum
- Adapter le nombre de noeuds plutot que sur-dimensionner les CPU

FORMAT STRICT DES CHAMPS JSON — VALEURS IMPOSEES :
- "noeuds" : ${recNodes} — NE PAS MODIFIER
- "cpu" : "2x [choisir un vrai CPU avec exactement ${recCoresSocket} cores/socket] (${recCoresNode} cores)" — NbCoresTotal DOIT ETRE ${recCoresNode}
- "ram" : "${recRamNode} Go DDR4" — NE PAS MODIFIER
- "stockage" : "${stoTarget} To NVMe" — NE PAS MODIFIER
- Choisir un modele de CPU Intel Xeon ou AMD EPYC existant avec ${recCoresSocket} cores par socket

Genere exactement 3 scenarios d architecture pour migrer cette infrastructure, au format JSON strict :
{
  "scenarios": [
    {
      "id": "3tiers",
      "titre": "3-Tiers On-Premise",
      "description": "...",
      "noeuds": 2,
      "config_noeud": {"cpu": "...", "ram": "...", "stockage": "..."},
      "stockage": "...",
      "reseau": "...",
      "avantages": ["...", "..."],
      "inconvenients": ["...", "..."],
      "points_attention": ["...", "..."],
      "constructeurs_suggeres": ["..."]
    },
    {
      "id": "hci",
      "titre": "HCI On-Premise",
      "description": "...",
      "noeuds": 3,
      "config_noeud": {"cpu": "...", "ram": "...", "stockage": "..."},
      "stockage": "Distribue (vSAN/Ceph/Nutanix)",
      "reseau": "...",
      "avantages": ["...", "..."],
      "inconvenients": ["...", "..."],
      "points_attention": ["...", "..."],
      "constructeurs_suggeres": ["..."]
    },
    {
      "id": "heberge",
      "titre": "Heberge OVH",
      "description": "...",
      "noeuds": 3,
      "config_noeud": {"cpu": "...", "ram": "...", "stockage": "..."},
      "stockage": "...",
      "reseau": "3AZ ou 2AZ selon criticite",
      "avantages": ["...", "..."],
      "inconvenients": ["...", "..."],
      "points_attention": ["...", "..."],
      "constructeurs_suggeres": ["OVH"]
    }
  ]
}
Reponds UNIQUEMENT avec le JSON, sans markdown ni explication.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {"Content-Type":"application/json","x-api-key":import.meta.env.VITE_ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [{role:"user", content:prompt}]
        })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text||"";
      const clean = text.replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(clean);
      setScenarios(parsed.scenarios);
    } catch(e) {
      setScenarioErr("Erreur generation : "+e.message);
    }
    setGenerating(false);
  };

  const handleFiles = (e) => { setFiles(Array.from(e.target.files)); setReport(null); setError(null); setScenarios(null); };

  const analyse = async () => {
    setLoading(true); setError(null);
    try {
      const results = [];
      for (const file of files) {
        const buf = await file.arrayBuffer();
        const wb  = XLSX.read(buf,{type:"array",cellDates:true});
        if (wb.SheetNames.includes("vInfo")&&wb.SheetNames.includes("vHost")) {
          results.push(parseRVTools(wb, file.name));
        } else {
          results.push({fileName:file.name, error:"Format non reconnu"});
        }
      }
      setReport(results); setActiveTab("overview"); setActiveHost(0);
    } catch(e) { setError("Erreur : "+e.message); }
    setLoading(false);
  };

  const r = report&&report[0];
  const tabs = ["overview","hosts","os","stockage","vms-off","reseau"];
  const tabLabels = {overview:"Vue globale",hosts:"Par hyperviseur",os:"Systemes OS",stockage:"Stockage","vms-off":"VMs eteintes",reseau:"Reseau"};

  return (
    <div>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:13,color:th.t2}}>Analysez votre infrastructure existante — RVTools, Nutanix Collector, MAP Toolkit</div>
      </div>

      <div style={s.card}>
        <div style={s.title}>Import fichiers</div>
        <label style={{display:"block",border:"2px dashed "+th.border,borderRadius:8,padding:"28px 20px",textAlign:"center",cursor:"pointer",background:th.bg2}}>
          <input type="file" accept=".xlsx,.csv,.xls" multiple onChange={handleFiles} style={{display:"none"}}/>
          <div style={{fontSize:22,marginBottom:6}}>📂</div>
          <div style={{fontSize:13,fontWeight:600,color:th.t1,marginBottom:4}}>
            {files.length>0?files.map(f=>f.name).join(", "):"Cliquez pour selectionner un ou plusieurs fichiers"}
          </div>
          <div style={{fontSize:11,color:th.t3}}>RVTools (.xlsx) · Nutanix Collector · MAP Toolkit</div>
        </label>
        {files.length>0&&(
          <button onClick={analyse} disabled={loading} style={{...s.btn,width:"100%",marginTop:12,padding:"10px"}}>
            {loading?"Analyse en cours...":"Analyser avec Claude"}
          </button>
        )}
        {error&&<div style={{marginTop:10,color:"#cc3333",fontSize:12,fontFamily:"monospace"}}>{error}</div>}
      </div>

      {r&&!r.error&&(
        <>
          <div style={{...s.card,borderLeft:"3px solid "+th.accent}}>
            <div style={{fontSize:11,color:th.t3,fontFamily:"monospace",marginBottom:8}}>
              {r.source} · {r.vendor} {r.model} · {r.esxVersions.join(", ")}
            </div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:8}}>
              {[
                {bg:"linear-gradient(135deg,#0077cc,#005599)",l:"VMs actives",    v:r.vmOn,             s:r.vmOff+" eteintes"},
                {bg:"linear-gradient(135deg,#e05a20,#b84510)",l:"vCPU alloues",   v:r.totalVcpu,        s:"VMs poweredOn"},
                {bg:"linear-gradient(135deg,#5a4fcf,#3d35a0)",l:"RAM allouee",    v:r.totalRamGo+" Go", s:"VMs poweredOn"},
                {bg:"linear-gradient(135deg,#2d7a4f,#1a5c38)",l:"Stockage",       v:r.totalDiskTo+" To",s:"VMs poweredOn"},
              ].map(k=>(
                <div key={k.l} style={{background:k.bg,borderRadius:8,padding:"12px 14px"}}>
                  <div style={{fontSize:9,color:"rgba(255,255,255,0.6)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2}}>{k.l}</div>
                  <div style={{fontSize:20,fontWeight:700,fontFamily:"monospace",color:"#fff"}}>{k.v}</div>
                  <div style={{fontSize:9,color:"rgba(255,255,255,0.5)"}}>{k.s}</div>
                </div>
              ))}
            </div>
            {r.vmOff20>0&&(
              <div style={{marginTop:10,padding:"8px 12px",background:"rgba(255,181,71,0.08)",border:"1px solid rgba(255,181,71,0.3)",borderRadius:6,fontSize:11,color:"#ffb347",fontFamily:"monospace"}}>
                {r.vmOff20} VM(s) eteintes depuis plus de 20 jours — candidates au decommissionnement
              </div>
            )}
          </div>

          <div style={{display:"flex",gap:4,marginBottom:14,borderBottom:"1px solid "+th.border}}>
            {tabs.map(t=>(
              <button key={t} onClick={()=>setActiveTab(t)} style={{padding:"8px 16px",background:"none",border:"none",borderBottom:"2px solid "+(activeTab===t?th.accent:"transparent"),color:activeTab===t?th.accent:th.t2,fontWeight:activeTab===t?600:400,fontSize:12,cursor:"pointer",fontFamily:"monospace"}}>
                {tabLabels[t]}
              </button>
            ))}
          </div>

          {activeTab==="overview"&&(
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14}}>
              <div style={s.card}>
                <div style={s.title}>Cluster</div>
                {[
                  {l:"Hosts",v:r.hostsCount+" hosts",s:r.model},
                  {l:"CPU physiques",v:r.totalCores+" cores",s:r.hosts[0]?.cpuModel||""},
                  {l:"RAM physique",v:r.totalRamPhysGo+" Go",s:"cluster total"},
                  {l:"VMs totales",v:r.vmsTotal,s:r.vmOn+" actives · "+r.vmOff+" eteintes"},
                  {l:"ESXi",v:r.esxVersions[0]||"N/A",s:"version detectee"},
                ].map(k=>(
                  <div key={k.l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid "+th.border}}>
                    <span style={{fontSize:11,color:th.t2}}>{k.l}</span>
                    <div style={{textAlign:"right"}}>
                      <span style={{fontSize:12,fontWeight:600,fontFamily:"monospace",color:th.t1}}>{k.v}</span>
                      {k.s&&<div style={{fontSize:9,color:th.t3}}>{k.s}</div>}
                    </div>
                  </div>
                ))}
              </div>
              <div style={s.card}>
                <div style={s.title}>Utilisation cluster</div>
                {r.hosts.map(h=>(
                  <div key={h.name} style={{marginBottom:16}}>
                    <div style={{fontSize:11,fontWeight:600,color:th.t1,marginBottom:6}}>{h.shortName}</div>
                    <Gauge pct={h.cpuUsagePct} label={"CPU ("+h.cores+" cores)"} sub={h.cpuUsagePct+"% utilise"}/>
                    <Gauge pct={h.ramUsagePct} label={"RAM ("+h.ramGo+" Go)"} sub={h.ramUsagePct+"% utilise"}/>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab==="hosts"&&(
            <div>
              <div style={{display:"flex",gap:8,marginBottom:14}}>
                {r.hosts.map((h,i)=>(
                  <button key={i} onClick={()=>setActiveHost(i)} style={{padding:"6px 14px",background:activeHost===i?th.accent:th.bg2,border:"1px solid "+(activeHost===i?th.accent:th.border),borderRadius:6,color:activeHost===i?"#fff":th.t1,fontSize:11,cursor:"pointer",fontFamily:"monospace"}}>
                    {h.shortName}
                  </button>
                ))}
              </div>
              {r.hosts[activeHost]&&(()=>{
                const h=r.hosts[activeHost];
                return (
                  <div>
                    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14,marginBottom:14}}>
                      <div style={s.card}>
                        <div style={s.title}>Informations host</div>
                        {[
                          {l:"Modele",v:h.vendor+" "+h.model},
                          {l:"CPU",v:h.cores+" cores",s:h.cpuModel},
                          {l:"RAM",v:h.ramGo+" Go"},
                          {l:"ESXi",v:h.esxVersion},
                          {l:"VMs",v:h.vmsCount+" VMs"},
                        ].map(k=>(
                          <div key={k.l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid "+th.border}}>
                            <span style={{fontSize:11,color:th.t2}}>{k.l}</span>
                            <div style={{textAlign:"right"}}>
                              <span style={{fontSize:12,fontWeight:600,fontFamily:"monospace",color:th.t1}}>{k.v}</span>
                              {k.s&&<div style={{fontSize:9,color:th.t3}}>{k.s}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={s.card}>
                        <div style={s.title}>Utilisation</div>
                        <Gauge pct={h.cpuUsagePct} label={"CPU — "+h.cores+" cores physiques"} sub={Math.round(h.cores*h.cpuUsagePct/100)+" cores utilises"}/>
                        <Gauge pct={h.ramUsagePct} label={"RAM — "+h.ramGo+" Go"} sub={Math.round(h.ramGo*h.ramUsagePct/100)+" Go utilises"}/>
                        <div style={{marginTop:12,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                          <div style={s.kpi}>
                            <div style={s.kpiL}>vCPU alloues</div>
                            <div style={s.kpiV}>{h.vms.reduce((s,v)=>s+v.vcpu,0)}</div>
                            <div style={s.kpiS}>ratio {(h.vms.reduce((s,v)=>s+v.vcpu,0)/h.cores).toFixed(1)}:1</div>
                          </div>
                          <div style={s.kpi}>
                            <div style={s.kpiL}>RAM allouee</div>
                            <div style={s.kpiV}>{h.vms.reduce((s,v)=>s+v.ramGo,0)} Go</div>
                            <div style={s.kpiS}>/ {h.ramGo} Go physique</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={s.card}>
                      <div style={s.title}>VMs sur ce host ({h.vms.length})</div>
                      <div style={{overflowX:"auto"}}>
                        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                          <thead>
                            <tr style={{borderBottom:"1px solid "+th.border}}>
                              {["Nom","vCPU","RAM","Stockage","OS","Etat"].map(col=>(
                                <th key={col} style={{padding:"6px 8px",textAlign:"left",color:th.t3,fontFamily:"monospace",fontSize:9,textTransform:"uppercase"}}>{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {h.vms.map((v,i)=>(
                              <tr key={i} style={{borderBottom:"1px solid "+th.border,background:i%2===0?"transparent":th.bg2+"44"}}>
                                <td style={{padding:"6px 8px",fontWeight:600,color:th.t1}}>{v.name}</td>
                                <td style={{padding:"6px 8px",fontFamily:"monospace",color:th.t2}}>{v.vcpu}</td>
                                <td style={{padding:"6px 8px",fontFamily:"monospace",color:th.t2}}>{v.ramGo} Go</td>
                                <td style={{padding:"6px 8px",fontFamily:"monospace",color:th.t2}}>{v.diskGo} Go</td>
                                <td style={{padding:"6px 8px",color:th.t3,fontSize:10}}>{v.os}</td>
                                <td style={{padding:"6px 8px"}}>
                                  <span style={{fontSize:9,padding:"2px 6px",borderRadius:3,background:v.powerstate==="poweredOn"?"rgba(0,212,170,0.15)":"rgba(255,100,100,0.15)",color:v.powerstate==="poweredOn"?th.accent:"#cc3333"}}>
                                    {v.powerstate==="poweredOn"?"ON":"OFF"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab==="os"&&(
            <div style={s.card}>
              <div style={s.title}>Distribution OS ({r.vmsTotal} VMs)</div>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14}}>
                <div>
                  {r.osDistrib.map(([os,count])=>{
                    const pct=Math.round(count/r.vmsTotal*100);
                    const isWin=os.toLowerCase().includes("windows");
                    const isLinux=os.toLowerCase().includes("linux")||os.toLowerCase().includes("ubuntu")||os.toLowerCase().includes("debian");
                    const color=isWin?"#0078d4":isLinux?"#e05a20":"#888";
                    return (
                      <div key={os} style={{marginBottom:10}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                          <span style={{fontSize:11,color:th.t1}}>{os}</span>
                          <span style={{fontSize:11,fontWeight:700,fontFamily:"monospace",color:th.t2}}>{count} ({pct}%)</span>
                        </div>
                        <div style={{background:th.bg2,borderRadius:4,height:8,overflow:"hidden"}}>
                          <div style={{width:pct+"%",height:"100%",background:color,borderRadius:4}}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div>
                  {[
                    {label:"Windows",color:"#0078d4",filter:os=>os.toLowerCase().includes("windows")},
                    {label:"Linux",  color:"#e05a20",filter:os=>os.toLowerCase().includes("linux")||os.toLowerCase().includes("ubuntu")||os.toLowerCase().includes("debian")},
                    {label:"Autre",  color:"#888",   filter:os=>!os.toLowerCase().includes("windows")&&!os.toLowerCase().includes("linux")&&!os.toLowerCase().includes("ubuntu")&&!os.toLowerCase().includes("debian")},
                  ].map(item=>{
                    const count=r.osDistrib.filter(([os])=>item.filter(os)).reduce((s,[,c])=>s+c,0);
                    return (
                      <div key={item.label} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:th.bg2,borderRadius:8,marginBottom:8}}>
                        <div style={{width:12,height:12,borderRadius:2,background:item.color,flexShrink:0}}/>
                        <div>
                          <div style={{fontSize:13,fontWeight:600,color:th.t1}}>{item.label}</div>
                          <div style={{fontSize:11,color:th.t3}}>{count} VM{count>1?"s":""} — {Math.round(count/r.vmsTotal*100)}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab==="stockage"&&(
            <div style={s.card}>
              <div style={s.title}>Datastores detectes</div>
              {r.datastores.length===0?(
                <div style={{fontSize:12,color:th.t3}}>Aucun datastore avec capacite detecte</div>
              ):r.datastores.map((d,i)=>{
                const usedPct=Math.round(d.inUseMib/(d.capMib||1)*100);
                return (
                  <div key={i} style={{padding:"12px 0",borderBottom:"1px solid "+th.border}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                      <div>
                        <div style={{fontSize:12,fontWeight:600,color:th.t1}}>{d.name}</div>
                        <div style={{fontSize:10,color:th.t3,fontFamily:"monospace"}}>{d.type} · {d.vms} VMs · {d.hosts} host(s)</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:12,fontWeight:600,fontFamily:"monospace",color:th.t1}}>{(d.capMib/1024).toFixed(0)} Go</div>
                        <div style={{fontSize:10,color:th.t3}}>{usedPct}% utilise</div>
                      </div>
                    </div>
                    <div style={{background:th.bg2,borderRadius:4,height:6,overflow:"hidden"}}>
                      <div style={{width:usedPct+"%",height:"100%",background:usedPct>80?"#cc3333":usedPct>60?"#d97706":th.accent,borderRadius:4}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {activeTab==="vms-off"&&(
            <div style={s.card}>
              <div style={s.title}>VMs eteintes ({r.vmOff} total · {r.vmOff20} depuis plus de 20 jours)</div>
              {r.vmOffList.length===0?(
                <div style={{fontSize:12,color:th.t3,fontFamily:"monospace"}}>Aucune VM eteinte detectee</div>
              ):(
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                    <thead>
                      <tr style={{borderBottom:"1px solid "+th.border}}>
                        {["Nom VM","Host","vCPU","RAM","Disque","OS","Derniere mise sous tension","Jours eteinte"].map(col=>(
                          <th key={col} style={{padding:"6px 8px",textAlign:"left",color:th.t3,fontFamily:"monospace",fontSize:9,textTransform:"uppercase"}}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {r.vmOffList.map((v,i)=>(
                        <tr key={i} style={{borderBottom:"1px solid "+th.border,background:i%2===0?"transparent":th.bg2+"44"}}>
                          <td style={{padding:"6px 8px",fontWeight:600,color:th.t1}}>{v.name}</td>
                          <td style={{padding:"6px 8px",fontSize:10,color:th.t3}}>{v.host}</td>
                          <td style={{padding:"6px 8px",fontFamily:"monospace",color:th.t2}}>{v.cpu}</td>
                          <td style={{padding:"6px 8px",fontFamily:"monospace",color:th.t2}}>{v.ramGo} Go</td>
                          <td style={{padding:"6px 8px",fontFamily:"monospace",color:th.t2}}>{v.diskGo} Go</td>
                          <td style={{padding:"6px 8px",fontSize:10,color:th.t3}}>{v.os}</td>
                          <td style={{padding:"6px 8px",fontSize:10,color:th.t2}}>{v.powerOn?v.powerOn.toLocaleDateString("fr-FR"):v.creationDate?("Cree le "+v.creationDate.toLocaleDateString("fr-FR")):"Jamais"}</td>
                          <td style={{padding:"6px 8px"}}>
                            {v.daysSince===null?(<span style={{fontSize:9,padding:"2px 6px",borderRadius:3,background:"rgba(204,51,51,0.15)",color:"#cc3333"}}>Jamais</span>
                            ):v.daysSince>20?(<span style={{fontSize:9,padding:"2px 6px",borderRadius:3,background:"rgba(255,181,71,0.15)",color:"#ffb347"}}>{v.daysSince}j</span>
                            ):(<span style={{fontSize:9,padding:"2px 6px",borderRadius:3,background:"rgba(0,212,170,0.15)",color:th.accent}}>{v.daysSince}j</span>)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab==="reseau"&&(
            <div>
              <div style={s.card}>
                <div style={s.title}>VLANs detectes ({r.vlans.length})</div>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                    <thead>
                      <tr style={{borderBottom:"1px solid "+th.border}}>
                        {["Port Group","Switch","VLAN ID","Ports","Vitesse"].map(col=>(
                          <th key={col} style={{padding:"6px 8px",textAlign:"left",color:th.t3,fontFamily:"monospace",fontSize:9,textTransform:"uppercase"}}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {r.vlans.map((v,i)=>(
                        <tr key={i} style={{borderBottom:"1px solid "+th.border,background:i%2===0?"transparent":th.bg2+"44"}}>
                          <td style={{padding:"6px 8px",fontWeight:600,color:th.t1}}>{v.name}</td>
                          <td style={{padding:"6px 8px",fontFamily:"monospace",color:th.t2}}>{v.switch}</td>
                          <td style={{padding:"6px 8px"}}><span style={{fontSize:10,padding:"2px 8px",borderRadius:3,background:"rgba(0,153,255,0.1)",color:th.accent2,fontFamily:"monospace",border:"1px solid rgba(0,153,255,0.2)"}}>{v.vlan===0?"Trunk/Access":v.vlan}</span></td>
                          <td style={{padding:"6px 8px",fontFamily:"monospace",color:th.t2}}>{v.ports}</td>
                          <td style={{padding:"6px 8px",fontFamily:"monospace",color:th.t2}}>{v.speed} Gbps</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div style={s.card}>
                <div style={s.title}>Port Groups ({r.uniquePortGroups.length})</div>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                    <thead>
                      <tr style={{borderBottom:"1px solid "+th.border}}>
                        {["Port Group","Switch","VLAN"].map(col=>(
                          <th key={col} style={{padding:"6px 8px",textAlign:"left",color:th.t3,fontFamily:"monospace",fontSize:9,textTransform:"uppercase"}}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {r.uniquePortGroups.map((p,i)=>(
                        <tr key={i} style={{borderBottom:"1px solid "+th.border,background:i%2===0?"transparent":th.bg2+"44"}}>
                          <td style={{padding:"6px 8px",fontWeight:600,color:th.t1}}>{p.portGroup}</td>
                          <td style={{padding:"6px 8px",fontFamily:"monospace",color:th.t2}}>{p.switch}</td>
                          <td style={{padding:"6px 8px"}}><span style={{fontSize:10,padding:"2px 8px",borderRadius:3,background:"rgba(90,79,207,0.1)",color:"#5a4fcf",fontFamily:"monospace"}}>{p.vlan===0?"0 (Access)":p.vlan}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {activeTab==="reseau"&&r.vSwitches&&r.vSwitches.length>0&&(
            <div style={s.card}>
              <div style={s.title}>vSwitches ({r.vSwitches.length})</div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                  <thead>
                    <tr style={{borderBottom:"1px solid "+th.border}}>
                      {["Host","Switch","Ports","MTU","Port Groups / VLANs"].map(col=>(
                        <th key={col} style={{padding:"6px 8px",textAlign:"left",color:th.t3,fontFamily:"monospace",fontSize:9,textTransform:"uppercase"}}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {r.vSwitches.map((sw,i)=>(
                      <tr key={i} style={{borderBottom:"1px solid "+th.border,background:i%2===0?"transparent":th.bg2+"44"}}>
                        <td style={{padding:"6px 8px",fontSize:10,color:th.t3}}>{sw.host}</td>
                        <td style={{padding:"6px 8px",fontWeight:600,color:th.t1}}>{sw.name}</td>
                        <td style={{padding:"6px 8px",fontFamily:"monospace",color:th.t2}}>{sw.ports}</td>
                        <td style={{padding:"6px 8px",fontFamily:"monospace",color:th.t2}}>{sw.mtu}</td>
                        <td style={{padding:"6px 8px"}}>
                          {sw.portGroups.map((pg,j)=>(
                            <span key={j} style={{display:"inline-block",margin:"1px 3px 1px 0",fontSize:9,padding:"1px 6px",borderRadius:3,background:"rgba(0,153,255,0.08)",color:th.accent2,border:"1px solid rgba(0,153,255,0.2)",fontFamily:"monospace"}}>
                              {pg.name}{pg.vlan!==null&&pg.vlan!==undefined?" (VLAN "+pg.vlan+")":""}
                            </span>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab==="reseau"&&r.dvSwitches&&r.dvSwitches.length>0&&(
            <div style={s.card}>
              <div style={s.title}>Distributed vSwitches ({r.dvSwitches.length})</div>
              {r.dvSwitches.map((dv,i)=>(
                <div key={i} style={{padding:"10px 0",borderBottom:"1px solid "+th.border}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <div style={{fontWeight:600,fontSize:12,color:th.t1}}>{dv.name} <span style={{fontSize:10,color:th.t3,fontWeight:400}}>v{dv.version}</span></div>
                    <div style={{fontSize:11,fontFamily:"monospace",color:th.t2}}>{dv.vms} VMs · {dv.ports} ports · MTU {dv.mtu}</div>
                  </div>
                  <div style={{fontSize:10,color:th.t3}}>Hosts membres : {dv.hosts}</div>
                </div>
              ))}
            </div>
          )}
          {/* Mode Projet */}
          <div style={{...s.card, marginTop:14, borderLeft:"3px solid "+th.accent2}}>
            <div style={s.title}>Generer les propositions d architecture</div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"2fr 1fr",gap:10,marginBottom:12}}>
              <div>
                <label style={{display:"block",fontSize:10,color:th.t3,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:5}}>Nom du projet</label>
                <input type="text" value={projectName} onChange={e=>setProjectName(e.target.value)} placeholder="Ex: Migration Hydrostadium 2025" style={{width:"100%",background:th.bg2,border:"1px solid "+th.border,borderRadius:4,padding:"8px 10px",color:th.t1,fontFamily:"monospace",fontSize:12,boxSizing:"border-box"}}/>
              </div>
              <div style={{display:"flex",alignItems:"flex-end"}}>
                <button onClick={generateScenarios} disabled={generating} style={{...s.btn,width:"100%",padding:"9px",opacity:generating?0.7:1}}>
                  {generating?"Generation en cours...":"Generer avec Claude"}
                </button>
              </div>
            </div>
            <div style={{fontSize:10,color:th.t3}}>3 scenarios generes : 3-tiers On-Premise · HCI On-Premise · Heberge OVH</div>
            {scenarioErr&&<div style={{marginTop:8,color:"#cc3333",fontSize:11,fontFamily:"monospace"}}>{scenarioErr}</div>}
          </div>

          {scenarios&&(
            <div>
              <div style={{fontSize:13,fontWeight:600,color:th.t1,marginBottom:14,marginTop:4}}>
                Propositions d architecture — {projectName||r.fileName}
              </div>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:14}}>
                {scenarios.map((sc,i)=>{
                  const colors = ["#0077cc","#e05a20","#00a884"];
                  const c = colors[i]||th.accent;
                  return (
                    <div key={sc.id} style={{background:th.cardBg,border:"1px solid "+th.border,borderTop:"3px solid "+c,borderRadius:8,padding:16}}>
                      <div style={{fontSize:13,fontWeight:700,color:c,marginBottom:4}}>{sc.titre}</div>
                      <div style={{fontSize:11,color:th.t2,marginBottom:12}}>{sc.description}</div>
                      <div style={{background:th.bg2,borderRadius:6,padding:"10px 12px",marginBottom:12}}>
                        <div style={{fontSize:10,color:th.t3,textTransform:"uppercase",fontFamily:"monospace",marginBottom:6}}>Configuration recommandee</div>
                        <div style={{fontSize:11,color:th.t1,marginBottom:2}}><b>{sc.noeuds} noeuds</b></div>
                        <div style={{fontSize:11,color:th.t2}}>CPU : {sc.config_noeud?.cpu||"N/A"}</div>
                        <div style={{fontSize:11,color:th.t2}}>RAM : {sc.config_noeud?.ram||"N/A"}</div>
                        <div style={{fontSize:11,color:th.t2}}>Stockage : {sc.config_noeud?.stockage||"N/A"}</div>
                        {sc.stockage&&<div style={{fontSize:11,color:th.t2,marginTop:4}}>SAN/HCI : {sc.stockage}</div>}
                        {sc.reseau&&<div style={{fontSize:11,color:th.t2}}>Reseau : {sc.reseau}</div>}
                      </div>
                      {sc.constructeurs_suggeres?.length>0&&(
                        <div style={{marginBottom:10}}>
                          {sc.constructeurs_suggeres.map((cstr,j)=>(
                            <span key={j} style={{display:"inline-block",margin:"2px 3px 2px 0",fontSize:9,padding:"2px 7px",borderRadius:3,background:c+"15",color:c,border:"1px solid "+c+"33",fontFamily:"monospace"}}>{cstr}</span>
                          ))}
                        </div>
                      )}
                      <div style={{marginBottom:8}}>
                        <div style={{fontSize:10,color:"#00a884",fontWeight:600,marginBottom:4}}>Avantages</div>
                        {sc.avantages?.map((a,j)=><div key={j} style={{fontSize:10,color:th.t2,marginBottom:2}}>✓ {a}</div>)}
                      </div>
                      <div style={{marginBottom:8}}>
                        <div style={{fontSize:10,color:"#d97706",fontWeight:600,marginBottom:4}}>Inconvenients</div>
                        {sc.inconvenients?.map((a,j)=><div key={j} style={{fontSize:10,color:th.t2,marginBottom:2}}>— {a}</div>)}
                      </div>
                      {sc.points_attention?.length>0&&(
                        <div style={{padding:"8px 10px",background:"rgba(255,181,71,0.08)",border:"1px solid rgba(255,181,71,0.25)",borderRadius:4}}>
                          <div style={{fontSize:10,color:"#ffb347",fontWeight:600,marginBottom:4}}>Points d attention</div>
                          {sc.points_attention.map((p,j)=><div key={j} style={{fontSize:10,color:th.t2,marginBottom:2}}>⚠ {p}</div>)}
                        </div>
                      )}
                      <button onClick={()=>setActiveModal(sc)} style={{marginTop:12,width:"100%",padding:"8px",background:"none",border:"1px solid "+c,borderRadius:6,color:c,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"monospace"}}>
                        Ajuster cette proposition
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
      {activeModal&&activeModal.id==="3tiers"&&(
        <Modal3Tiers scenario={activeModal} infraData={r} onClose={()=>setActiveModal(null)} th={th}/>
      )}
      {activeModal&&activeModal.id==="hci"&&(
        <ModalHCI scenario={activeModal} infraData={r} onClose={()=>setActiveModal(null)} th={th}/>
      )}
    </div>
  );
}
