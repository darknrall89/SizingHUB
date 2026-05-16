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
  const [showQuality, setShowQuality] = useState(false);
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
    // Detection des onglets disponibles
    const REQUIRED_SHEETS = [
      {id:"vInfo",      label:"vInfo",      desc:"Inventaire VMs",        required:true},
      {id:"vHost",      label:"vHost",      desc:"Hyperviseurs / hosts",  required:true},
      {id:"vMemory",    label:"vMemory",    desc:"RAM consommee par VM",  required:false},
      {id:"vCPU",       label:"vCPU",       desc:"CPU Readiness",         required:false},
      {id:"vDatastore", label:"vDatastore", desc:"Datastores / stockage", required:false},
      {id:"vPort",      label:"vPort",      desc:"Port groups reseau",    required:false},
      {id:"dvPort",     label:"dvPort",     desc:"VLANs distribues",      required:false},
      {id:"vSwitch",    label:"vSwitch",    desc:"vSwitches",             required:false},
      {id:"vHBA",       label:"vHBA",       desc:"HBA / FC / WWN",       required:false},
      {id:"vNIC",       label:"vNIC",       desc:"NIC physiques / vitesse", required:false},
      {id:"dvSwitch",   label:"dvSwitch",   desc:"Distributed vSwitches", required:false},
    ];
    const sheetQuality = REQUIRED_SHEETS.map(s=>({
      ...s,
      available: wb.SheetNames.includes(s.id),
      rowCount: wb.SheetNames.includes(s.id)?XLSX.utils.sheet_to_json(wb.Sheets[s.id]).length:0,
    }));
    const qualityScore = Math.round(sheetQuality.filter(s=>s.available).length/REQUIRED_SHEETS.length*100);

    const vInfo      = getJson("vInfo");
    const vHost      = getJson("vHost");
    const vDatastore = getJson("vDatastore");
      const vHBA = getJson("vHBA");
    const vNIC = getJson("vNIC");
    const vMemoryData = getJson("vMemory");
    const vCpuData = getJson("vCPU");
    const vmCpuMap = {};
    vCpuData.forEach(r => {
      if (r["VM"]) vmCpuMap[r["VM"]] = {
        cpus: r["CPUs"]||0,
        overall: r["Overall"]||0,
        entitlement: r["Entitlement"]||0,
      };
    });
    const vmMemMap = {};
    vMemoryData.forEach(r => {
      if (r["VM"]) vmMemMap[r["VM"]] = {
        consumed: Math.round((r["Consumed"]||0)/1024),
        active:   Math.round((r["Active"]||0)/1024),
      };
    });

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
    const vNetData = getJson("vNetwork");
    const vmNics = {};
    vNetData.filter(r=>r["Template"]!=="True"&&r["Powerstate"]==="poweredOn").forEach(r=>{
      if (!vmNics[r["VM"]]) vmNics[r["VM"]]=[];
      vmNics[r["VM"]].push({nic:r["NIC label"]||"",network:r["Network"]||"N/A",ip:r["IPv4 Address"]||"N/A",switch:r["Switch"]||"N/A"});
    });
    const hosts = vHost.map(h=>{
      const hostVms = vmOn.filter(v=>v["Host"]===h["Host"]);
      return {
        name: h["Host"],
        shortName: (() => { const h2 = h["Host"]||""; const first = h2.split(".")[0]; return /^\d+$/.test(first) ? h2 : first; })(),
        cpuModel: (h["CPU Model"]||"").replace(/\(R\)/g,"").replace(/\(TM\)/g,""),
        cores: h["# Cores"]||0,
        sockets: h["# CPU"]||0,
        coresPerSocket: h["# CPU"]>0 ? Math.round((h["# Cores"]||0)/(h["# CPU"]||1)) : 0,
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
          usedRamGo: vmMemMap[v["VM"]]?.consumed||0,
          activeRamGo: vmMemMap[v["VM"]]?.active||0,
          cpuOverallMhz: vmCpuMap[v["VM"]]?.overall||0,
          cpuReadinessPct: vmCpuMap[v["VM"]]?.readiness||0,
          os: v["OS according to the VMware Tools"]||"N/A",
          diskGo: Math.round((v["Total disk capacity MiB"]||0)/1024),
          powerstate: v["Powerstate"],
          portGroup: vmNics[v["VM"]]?.[0]?.network||"N/A",
          nicCount: (vmNics[v["VM"]]||[]).length||1,
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
      host: (()=>{const _h=v["Host"]||"";const _f=_h.split(".")[0];return /^\d+$/.test(_f)?_h:_f;})(),
    })).sort((a,b)=>(b.daysSince||999)-(a.daysSince||999));
      const dvPort = getJson("dvPort");
      const vPortData2 = getJson("vPort");
      const vmKernelData = getJson("vSC_VMK").map(r=>({
        host: (()=>{const _h=r["Host"]||"";const _f=_h.split(".")[0];return /^\d+$/.test(_f)?_h:_f;})(),
        device: r["Device"] || r["VMkernel"] || r["Name"] || "",
        portGroup: r["Port Group"] || r["Network"] || r["Portgroup"] || "",
        ip: r["IP Address"] || r["IPv4 Address"] || "",
        subnet: r["Subnet mask"] || r["Subnet Mask"] || r["Netmask"] || "",
        mtu: r["MTU"] || null,
        mac: r["Mac Address"] || r["MAC Address"] || "",
        iqn: r["iSCSI Name"] || r["IQN"] || r["iqn"] || null,
      }));

      const getNetworkRole = (name="") => {
        const n = String(name).toLowerCase();
        if (n.includes("vmotion") || n.includes("v-motion") || n.includes("v motion")) return "vmotion";
        if (n.includes("iscsi") || n.includes("san") || n.includes("storage") || n.includes("nfs") || n.includes("vmfs")) return "storage";
        if (n.includes("management") || n.includes("mgmt") || n.includes("admin") || n.includes("adm")) return "management";
        return "vm";
      };

      const dvVlans = dvPort.filter(d=>d["VLAN"]!==null&&d["VLAN"]!==undefined).map(d=>({
        name: d["Port"]||"N/A",
        vlan:d["VLAN"],
        switch:d["Switch"]||"N/A",
        ports:d["# Ports"]||0,
        speed:d["Speed"]||0,
        type:"dvSwitch",
        role:getNetworkRole(d["Port"]||"")
      }));

      const vsVlans = vPortData2.filter(d=>d["VLAN"]!==null&&d["VLAN"]!==undefined).map(d=>({
        name: d["Port Group"]||"N/A",
        vlan:d["VLAN"],
        switch:d["Switch"]||"N/A",
        ports:0,
        speed:0,
        type:"vSwitch",
        role:getNetworkRole(d["Port Group"]||"")
      }));

      const vmkVlans = vmKernelData.map(vmk=>{
        const pg = vmk.portGroup || "N/A";
        const match = vPortData2.find(p =>
          (p["Port Group"]||"").toLowerCase() === pg.toLowerCase() &&
          ((()=>{const _h=p["Host"]||"";const _f=_h.split(".")[0];return /^\d+$/.test(_f)?_h:_f;})()) === vmk.host
        );
        return {
          name: pg,
          vlan: match?.["VLAN"] ?? null,
          switch: match?.["Switch"] || "VMkernel",
          ports:1,
          speed:0,
          type:"VMkernel",
          role:getNetworkRole(pg),
          host: vmk.host,
          device: vmk.device,
          ip: vmk.ip,
          mtu: vmk.mtu
        };
      }).filter(v=>v.name && v.name !== "N/A");

      const normalizePg = (v="") => String(v).toLowerCase().trim();

      const vmKernelEnriched = vmKernelData.map(vmk => {
        const pg = normalizePg(vmk.portGroup);
        const match =
          vPortData2.find(p => normalizePg(p["Port Group"]) === pg && ((()=>{const _h=p["Host"]||"";const _f=_h.split(".")[0];return /^\d+$/.test(_f)?_h:_f;})()) === vmk.host) ||
          vPortData2.find(p => normalizePg(p["Port Group"]) === pg) ||
          dvPort.find(p => normalizePg(p["Port"]||p["Port Group"]||"") === pg && ((()=>{const _h=p["Host"]||"";const _f=_h.split(".")[0];return /^\d+$/.test(_f)?_h:_f;})()) === vmk.host) ||
          dvPort.find(p => normalizePg(p["Port"]||p["Port Group"]||"") === pg);
        let inferredVlan = null;
        if (!match && vmk.ip) {
          const parts = vmk.ip.split(".");
          if (parts.length === 4) {
            const oct3 = parseInt(parts[2]);
            if (oct3 > 0 && oct3 < 4096) inferredVlan = oct3;
          }
        }
        return {
          ...vmk,
          vlan: match?.["VLAN"] !== undefined ? match["VLAN"] : inferredVlan,
          vlanInferred: !match && inferredVlan !== null,
          switch: match?.["Switch"] || "VMkernel",
          role: getNetworkRole(vmk.portGroup)
        };
      });
      const allVlans = [...dvVlans, ...vsVlans, ...vmkVlans];
      const vlans = [...new Map(allVlans.map(v=>[(v.name||"")+(v.vlan??"")+"-"+(v.type||"")+"-"+(v.host||""),v])).values()]
        .sort((a,b)=>(a.vlan||0)-(b.vlan||0));

      const vPortData = getJson("vPort");
      const uniquePortGroups = [...new Map([...vPortData.map(p=>({
        host:(()=>{const _h=p["Host"]||"";const _f=_h.split(".")[0];return /^\d+$/.test(_f)?_h:_f;})(),
        portGroup:p["Port Group"]||"N/A",
        switch:p["Switch"]||"N/A",
        vlan:p["VLAN"],
        role:getNetworkRole(p["Port Group"]||"")
      })), ...vmkVlans.map(v=>({
        host:v.host,
        portGroup:v.name,
        switch:v.switch,
        vlan:v.vlan,
        role:v.role,
        device:v.device,
        ip:v.ip,
        mtu:v.mtu
      }))].map(p=>[p.portGroup+p.vlan+p.host,p])).values()];
    // vSwitch avec port groups
    const vPortAll = getJson("vPort");
    const vSwitches = vSwitchData.map(sw=>({
      host: (()=>{const _h=sw["Host"]||"";const _f=_h.split(".")[0];return /^\d+$/.test(_f)?_h:_f;})(),
      name: sw["Switch"]||"N/A",
      ports: sw["# Ports"]||0,
      freePorts: sw["Free Ports"]||0,
      mtu: sw["MTU"]||0,
      portGroups: vPortAll.filter(p=>p["Switch"]===sw["Switch"]&&(()=>{const _h=p["Host"]||"";const _f=_h.split(".")[0];return /^\d+$/.test(_f)?_h:_f;})()===(()=>{const _h=sw["Host"]||"";const _f=_h.split(".")[0];return /^\d+$/.test(_f)?_h:_f;})()).map(p=>({
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
        vmOffList, vlans, uniquePortGroups, vmNics, vSwitches,
      vHBA,
      hostsNics: (() => {
        const byHost = {};
        (vNIC||[]).forEach(n => {
          const host = (n["Host"]||n["host"]||"").split(".")[0];
          if (!host) return;
          if (!byHost[host]) byHost[host] = {name:host, adapters:[]};
          byHost[host].adapters.push({
            device: n["Device"]||n["device"]||"",
            speed: Number(n["Speed"]||n["Link Speed"]||n["LinkSpeed"]||0),
            mac: n["MAC"]||n["mac"]||"",
            driver: n["Driver"]||n["driver"]||"",
          });
        });
        return Object.values(byHost).map(h => ({
          ...h,
          nicCount: h.adapters.length,
          nics10g: h.adapters.filter(a => a.speed >= 10000).length,
          nics1g: h.adapters.filter(a => a.speed >= 1000 && a.speed < 10000).length,
        }));
      })(), dvSwitches,
      hostsNics: (() => {
        const byHost = {};
        (vNIC||[]).forEach(n => {
          const host = (n["Host"]||n["host"]||"").split(".")[0];
          if (!host) return;
          if (!byHost[host]) byHost[host] = {name:host, adapters:[]};
          byHost[host].adapters.push({
            device: n["Device"]||n["device"]||"",
            speed: Number(n["Speed"]||n["Link Speed"]||n["LinkSpeed"]||0),
            mac: n["MAC"]||n["mac"]||"",
            driver: n["Driver"]||n["driver"]||"",
          });
        });
        return Object.values(byHost).map(h => ({
          ...h,
          nicCount: h.adapters.length,
          nics10g: h.adapters.filter(a => a.speed >= 10000).length,
          nics1g: h.adapters.filter(a => a.speed >= 1000 && a.speed < 10000).length,
        }));
      })(),
        vmKernel: vmKernelEnriched,
        // DEBUG
        _debug_vmk: (() => { console.log("vmKernelEnriched sample:", JSON.stringify(vmKernelEnriched.slice(0,3))); return null; })(),
      sheetQuality, qualityScore,
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
      const res = await fetch("/api/anthropic", {
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
          const parsed = parseRVTools(wb, file.name);
          // Enrichissement réseau via Claude — inférence vMotion et rôles VMkernel
          try {
            const vmkSample = parsed.vmKernel?.slice(0,30) || [];
            const vportSample = (XLSX.utils.sheet_to_json(wb.Sheets["vPort"]||{})||[]).slice(0,50);
            const enrichPrompt = `Tu es un expert VMware. Analyse ces interfaces VMkernel et port groups et retourne UNIQUEMENT un JSON sans markdown.
VMkernel interfaces: ${JSON.stringify(vmkSample)}
Port groups (vPort): ${JSON.stringify(vportSample)}
Retourne exactement ce JSON:
{
  "vmotion": { "detected": boolean, "vlan": number|null, "device": string|null, "portGroup": string|null, "note": string },
  "management": { "vlan": number|null },
  "storage": { "vlan": number|null, "mtu": number|null },
  "insights": [{ "type": "warning"|"info"|"error", "message": string }]
}
Si aucun VMkernel vMotion dédié, detected=false et explique dans note.`;
            const enrichRes = await fetch("/api/anthropic", {
              method: "POST",
              headers: {"Content-Type":"application/json","x-api-key":import.meta.env.VITE_ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
              body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, messages:[{role:"user",content:enrichPrompt}] })
            });
            const enrichData = await enrichRes.json();
            const enrichText = enrichData.content?.[0]?.text||"{}";
            const enrichJson = JSON.parse(enrichText.replace(/```json|```/g,"").trim());
            parsed.networkInsights = enrichJson;
          } catch(e) {
            parsed.networkInsights = { vmotion:{detected:false,vlan:null,note:"Analyse indisponible"}, insights:[] };
          }
          // Enrichissement CPU via Claude — architecture, sockets, cores/socket
          try {
            const uniqueCpus = [...new Set((parsed.hosts||[]).map(h=>h.cpuModel).filter(Boolean))];
            if (uniqueCpus.length > 0) {
              const cpuPrompt = `Tu es un expert en processeurs serveur. Pour chaque modèle CPU listé, retourne UNIQUEMENT un JSON sans markdown ni explication.
Modèles: ${JSON.stringify(uniqueCpus)}
Retourne exactement ce format:
{
  "<modele_cpu_exact>": {
    "architecture": "<nom_microarchitecture ex: Ice Lake, Sapphire Rapids, Genoa, Milan, Rome>",
    "cores_per_socket": <nombre entier>,
    "typical_sockets": <1 ou 2>,
    "tdp_watts": <nombre entier>
  }
}`;
              const cpuRes = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {"Content-Type":"application/json","x-api-key":import.meta.env.VITE_ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
                body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, messages:[{role:"user",content:cpuPrompt}] })
              });
              const cpuData = await cpuRes.json();
              const cpuText = cpuData.content?.[0]?.text||"{}";
              const cpuJson = JSON.parse(cpuText.replace(/```json|```/g,"").trim());
              parsed.cpuEnrichment = cpuJson;
              // Enrichit les hosts avec les données CPU
              parsed.hosts = (parsed.hosts||[]).map(h => {
                const enriched = cpuJson[h.cpuModel] || {};
                const coresPerSocket = enriched.cores_per_socket || h.coresPerSocket || 0;
                const sockets = coresPerSocket > 0 ? Math.round(h.cores / coresPerSocket) : (enriched.typical_sockets || h.sockets || 0);
                return {
                  ...h,
                  architecture: enriched.architecture || "N/A",
                  coresPerSocket: coresPerSocket || h.coresPerSocket,
                  sockets: sockets || h.sockets,
                  tdpWatts: enriched.tdp_watts || 0,
                };
              });
            }
          } catch(e) {
            console.warn("CPU enrichment failed:", e);
          }
          results.push(parsed);
        } else {
          results.push({fileName:file.name, error:"Format non reconnu"});
        }
      }
      setReport(results); setActiveTab("overview"); setActiveHost(0);
    } catch(e) { setError("Erreur : "+e.message); }
    setLoading(false);
  };

  const r = report&&report[0];
  const hasResult = report && report.length > 0;
  const tabs = ["overview","hosts","os","stockage","vms-off","reseau"];
  const tabLabels = {overview:"Vue globale",hosts:"Par hyperviseur",os:"Systemes OS",stockage:"Stockage","vms-off":"VMs eteintes",reseau:"Reseau"};

  return (
    <div>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:13,color:th.t2}}>Analysez votre infrastructure existante — RVTools, Nutanix Collector, MAP Toolkit</div>
      </div>

        {!hasResult ? (
          <div style={{
            background:th.cardBg,
            border:`1px solid ${th.border}`,
            borderRadius:18,
            padding:28,
            boxShadow:"0 14px 34px rgba(15,23,42,0.08)",
            marginBottom:18
          }}>
            <div style={{display:"flex",justifyContent:"space-between",gap:20,alignItems:"center",marginBottom:22}}>
              <div>
                <div style={{fontSize:24,fontWeight:950,color:th.t1}}>Audit intelligent d’infrastructure</div>
                <div style={{fontSize:13,color:th.t2,marginTop:6}}>
                  Import RVTools, Nutanix Collector ou MAP Toolkit pour générer une restitution avant-vente.
                </div>
              </div>
              <div style={{
                padding:"7px 12px",
                borderRadius:999,
                background:`${th.accent}12`,
                border:`1px solid ${th.border2}`,
                color:th.accent,
                fontSize:12,
                fontWeight:900
              }}>
                AUDIT
              </div>
            </div>

            <div style={{
              display:"grid",
              gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",
              gap:12,
              marginBottom:22
            }}>
              {[
                ["RVTools", "Inventaire VMware .xlsx"],
                ["Analyse capacité", "CPU, RAM, stockage"],
                ["Recommandations", "Synthèse exploitable AV"]
              ].map(([title,sub])=>(
                <div key={title} style={{
                  padding:"14px 16px",
                  borderRadius:14,
                  background:th.bg1,
                  border:`1px solid ${th.border}`,
                  display:"flex",
                  gap:12,
                  alignItems:"center"
                }}>
                  <div style={{
                    width:34,
                    height:34,
                    borderRadius:10,
                    background:`${th.accent}12`,
                    color:th.accent,
                    display:"flex",
                    alignItems:"center",
                    justifyContent:"center",
                    fontWeight:950
                  }}>
                    ✓
                  </div>
                  <div>
                    <div style={{fontSize:13,fontWeight:900,color:th.t1}}>{title}</div>
                    <div style={{fontSize:12,color:th.t2,marginTop:3}}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <label style={{
              display:"block",
              border:`2px dashed ${th.border2}`,
              borderRadius:18,
              padding:"44px 26px",
              textAlign:"center",
              background:th.bg2,
              cursor:"pointer"
            }}>
              <input type="file" accept=".xlsx,.csv,.xls" multiple onChange={handleFiles} style={{display:"none"}}/>

              <div style={{
                width:58,
                height:58,
                borderRadius:18,
                background:`${th.accent}12`,
                color:th.accent,
                display:"flex",
                alignItems:"center",
                justifyContent:"center",
                margin:"0 auto 14px",
                fontSize:34,
                fontWeight:950
              }}>
                ↑
              </div>

              <div style={{fontSize:18,fontWeight:950,color:th.t1}}>
                {files.length>0 ? files.map(f=>f.name).join(", ") : "Glissez votre export RVTools ou cliquez pour sélectionner"}
              </div>
              <div style={{fontSize:13,color:th.t2,marginTop:7}}>
                Fichiers supportés : .xlsx · .xls · .csv · restitution KPI · risques · recommandations
              </div>
            </label>

            {files.length>0&&(
              <div style={{
                marginTop:18,
                display:"flex",
                justifyContent:"space-between",
                alignItems:"center",
                gap:14,
                padding:"14px 16px",
                borderRadius:14,
                background:"rgba(0,212,170,0.08)",
                border:"1px solid rgba(0,212,170,0.22)"
              }}>
                <div style={{
                  color:th.accent,
                  fontWeight:900,
                  fontSize:13,
                  lineHeight:1.5
                }}>
                  ✓ {files.length} fichier(s) prêt(s) à analyser
                </div>

                <button onClick={analyse} disabled={loading} style={{
                  border:"none",
                  borderRadius:10,
                  padding:"11px 16px",
                  background:loading?"#94a3b8":th.accent,
                  color:"#fff",
                  fontWeight:900,
                  cursor:loading?"not-allowed":"pointer",
                  whiteSpace:"nowrap",
                  boxShadow:"0 10px 22px rgba(0,212,170,0.22)"
                }}>
                  {loading?"Analyse en cours...":"Lancer l’analyse"}
                </button>
              </div>
            )}

            {error&&<div style={{marginTop:10,color:"#cc3333",fontSize:12,fontFamily:"monospace"}}>{error}</div>}
          </div>
        ) : (
          <div style={{
            display:"flex",
            justifyContent:"space-between",
            alignItems:"center",
            marginBottom:16,
            padding:"12px 16px",
            borderRadius:14,
            background:th.cardBg,
            border:`1px solid ${th.border}`,
            boxShadow:"0 6px 18px rgba(15,23,42,0.06)"
          }}>
            <button
              onClick={()=>{
                setReport(null);
                setFiles([]);
                setError(null);
                setScenarios(null);
              }}
              style={{
                border:"none",
                background:"transparent",
                fontWeight:800,
                cursor:"pointer",
                color:th.accent,
                fontSize:13
              }}
            >
              ← Nouvelle analyse
            </button>

            <div style={{
              fontSize:13,
              fontWeight:800,
              color:th.t1
            }}>
              Audit RVTools — {files.length} fichier(s)
            </div>

            <div style={{
              fontSize:12,
              fontWeight:800,
              color:"#00a884"
            }}>
              ✔ Analyse terminée
            </div>
          </div>
        )}

      {r&&!r.error&&(
        <>


            {/* Qualite du fichier RVTools */}
            {r.sheetQuality&&(
              <div style={{
                background:th.cardBg,
                border:"1px solid "+th.border,
                borderRadius:12,
                padding:14,
                marginBottom:14
              }}>
                <div
                  onClick={()=>setShowQuality(!showQuality)}
                  style={{
                    display:"flex",
                    alignItems:"center",
                    justifyContent:"space-between",
                    gap:12,
                    cursor:"pointer"
                  }}
                >
                  <div>
                    <div style={{
                      fontSize:11,
                      fontWeight:800,
                      color:th.t2,
                      textTransform:"uppercase",
                      letterSpacing:"0.08em"
                    }}>
                      Qualité du fichier RVTools
                    </div>
                    <div style={{
                      fontSize:12,
                      fontWeight:800,
                      color:r.qualityScore>=80?"#00a884":r.qualityScore>=50?"#d97706":"#cc3333",
                      marginTop:4
                    }}>
                      {r.qualityScore}% complet
                    </div>
                  </div>

                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:90,height:7,background:th.bg2,borderRadius:99,overflow:"hidden"}}>
                      <div style={{
                        width:r.qualityScore+"%",
                        height:"100%",
                        background:r.qualityScore>=80?"#00a884":r.qualityScore>=50?"#d97706":"#cc3333",
                        borderRadius:99
                      }}/>
                    </div>
                    <div style={{fontSize:12,fontWeight:900,color:th.accent}}>
                      {showQuality ? "Masquer" : "Voir détails"}
                    </div>
                  </div>
                </div>

                {!showQuality && r.qualityScore<100&&(
                  <div style={{
                    marginTop:10,
                    padding:"7px 10px",
                    background:"rgba(255,181,71,0.08)",
                    border:"1px solid rgba(255,181,71,0.25)",
                    borderRadius:8,
                    fontSize:11,
                    color:"#d97706"
                  }}>
                    ⚠ Analyse partielle — certains onglets RVTools sont manquants.
                  </div>
                )}

                {showQuality&&(
                  <div style={{
                    display:"grid",
                    gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",
                    gap:6,
                    marginTop:12
                  }}>
                    {r.sheetQuality.map(s=>(
                      <div key={s.id} style={{
                        display:"flex",
                        alignItems:"center",
                        gap:6,
                        padding:"6px 8px",
                        background:th.bg2,
                        borderRadius:8,
                        border:"1px solid "+(s.available?"rgba(0,168,132,0.2)":s.required?"rgba(204,51,51,0.2)":"rgba(150,150,150,0.15)")
                      }}>
                        <span style={{fontSize:11}}>{s.available?"✅":s.required?"❌":"⚠️"}</span>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{
                            fontSize:10,
                            fontWeight:700,
                            color:s.available?th.t1:s.required?"#cc3333":th.t3
                          }}>
                            {s.label}
                          </div>
                          <div style={{
                            fontSize:9,
                            color:th.t3,
                            whiteSpace:"nowrap",
                            overflow:"hidden",
                            textOverflow:"ellipsis"
                          }}>
                            {s.available?s.rowCount+" lignes":s.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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
                topCpuConsumers={vm.topCpuConsumers}
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
