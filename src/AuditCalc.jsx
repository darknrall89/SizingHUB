import { useState } from "react";
import ClusterOverviewDashboard, { mapRvToolsAnalysisToClusterViewModel } from "./ClusterDashboard.jsx";
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


          {/* Cluster Dashboard */}
          {(()=>{
            const vm = mapRvToolsAnalysisToClusterViewModel(r);
            return (
              <ClusterOverviewDashboard
                platformContext={vm.platformContext}
                clusterSummary={vm.clusterSummary}
                hosts={vm.hosts}
                insights={vm.insights}
                osDistrib={vm.osDistrib}
                datastores={vm.datastores}
                vlans={vm.vlans}
                vSwitches={vm.vSwitches}
                dvSwitches={vm.dvSwitches}
                vmOffList={vm.vmOffList}
                uniquePortGroups={vm.uniquePortGroups}
                topMemoryConsumers={vm.topMemoryConsumers}
                networkData={vm.networkData}
                optimizationData={vm.optimizationData}
              />
            );
          })()}
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
