import { useState, useCallback } from "react";
import * as XLSX from "xlsx";

export default function AuditCalc({ th, isMobile=false }) {
  const [files,      setFiles]      = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [report,     setReport]     = useState(null);
  const [error,      setError]      = useState(null);
  const [targetType, setTargetType] = useState("onpremise");

  const s = {
    card:    { background:th.cardBg, border:"1px solid "+th.border, borderRadius:8, padding:20, marginBottom:14 },
    title:   { fontSize:11, fontWeight:600, color:th.t2, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12, fontFamily:"monospace" },
    btn:     { width:"100%", padding:"10px", background:th.accent, border:"none", borderRadius:6, color:"#fff", fontWeight:600, fontSize:13, cursor:"pointer", marginTop:12 },
    kpi:     { background:th.bg2, borderRadius:6, padding:"12px 14px" },
    kpiLbl:  { fontSize:10, color:th.t3, textTransform:"uppercase", fontFamily:"monospace", marginBottom:4 },
    kpiVal:  { fontSize:20, fontWeight:700, fontFamily:"monospace", color:th.t1 },
    kpiSub:  { fontSize:10, color:th.t3, marginTop:2 },
  };

  const parseRVTools = (wb) => {
    const getSheet = (name) => {
      const ws = wb.Sheets[name];
      if (!ws) return [];
      return XLSX.utils.sheet_to_json(ws, { defval: null });
    };

    const vInfo    = getSheet("vInfo");
    const vCPU     = getSheet("vCPU");
    const vMemory  = getSheet("vMemory");
    const vDisk    = getSheet("vDisk");
    const vHost    = getSheet("vHost");
    const vTools   = getSheet("vTools");

    // Filtrer les templates
    const vms    = vInfo.filter(r => r["Template"] !== "True" && r["Template"] !== true);
    const vmOn   = vms.filter(r => r["Powerstate"] === "poweredOn");
    const vmOff  = vms.filter(r => r["Powerstate"] === "poweredOff");

    // VMs éteintes depuis longtemps (pas de PowerOn récent)
    const now = new Date();
    const vmOldOff = vmOff.filter(r => {
      if (!r["PowerOn"]) return true;
      const d = new Date(r["PowerOn"]);
      return (now - d) > 90 * 24 * 3600 * 1000;
    });

    // vCPU
    const cpuData = vCPU.filter(r => r["Template"] !== "True" && r["Powerstate"] === "poweredOn");
    const totalVcpu = cpuData.reduce((s,r) => s + (r["CPUs"]||0), 0);

    // vMemory
    const memData = vMemory.filter(r => r["Template"] !== "True" && r["Powerstate"] === "poweredOn");
    const totalRamMib = memData.reduce((s,r) => s + (r["Size MiB"]||0), 0);
    const totalRamGo = Math.round(totalRamMib / 1024);

    // vDisk
    const diskData = vDisk.filter(r => r["Template"] !== "True" && r["Powerstate"] === "poweredOn");
    const totalDiskMib = diskData.reduce((s,r) => s + (r["Capacity MiB"]||0), 0);
    const totalDiskTo = (totalDiskMib / 1024 / 1024).toFixed(1);

    // vHost
    const hosts = vHost.length;
    const esxVersions = [...new Set(vHost.map(r => r["ESX Version"]).filter(Boolean))];
    const cpuModel = vHost[0] ? vHost[0]["CPU Model"] : "N/A";
    const totalHostRam = vHost.reduce((s,r) => s + (r["# Memory"]||0), 0);
    const totalHostRamGo = Math.round(totalHostRam / 1024);
    const totalHostCores = vHost.reduce((s,r) => s + (r["# Cores"]||0), 0);
    const vendor = vHost[0] ? vHost[0]["Vendor"] : "N/A";
    const model  = vHost[0] ? vHost[0]["Model"]  : "N/A";

    // Score consolidation
    const consolidationScore = Math.min(100, Math.round(
      (vmOff.length / Math.max(vms.length, 1)) * 50 +
      (vmOldOff.length / Math.max(vmOff.length + 1, 1)) * 30 +
      (totalVcpu / Math.max(totalHostCores * 4, 1) < 0.5 ? 20 : 0)
    ));

    return {
      source: "RVTools",
      vmsTotal: vms.length,
      vmOn: vmOn.length,
      vmOff: vmOff.length,
      vmOldOff: vmOldOff.length,
      totalVcpu,
      totalRamGo,
      totalDiskTo,
      hosts,
      esxVersions,
      cpuModel,
      totalHostRamGo,
      totalHostCores,
      vendor,
      model,
      consolidationScore,
    };
  };

  const handleFiles = (e) => {
    const fs = Array.from(e.target.files);
    setFiles(fs);
    setReport(null);
    setError(null);
  };

  const analyse = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = [];
      for (const file of files) {
        const buf = await file.arrayBuffer();
        const wb  = XLSX.read(buf, { type:"array", cellDates:true });
        const sheets = wb.SheetNames;
        // Détecter source
        if (sheets.includes("vInfo") && sheets.includes("vHost")) {
          results.push({ fileName: file.name, ...parseRVTools(wb) });
        } else {
          results.push({ fileName: file.name, source: "Inconnu", error: "Format non reconnu" });
        }
      }
      setReport(results);
    } catch(e) {
      setError("Erreur de lecture : " + e.message);
    }
    setLoading(false);
  };

  const r = report && report[0];

  return (
    <div>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:13,color:th.t2}}>Analysez votre infrastructure existante — RVTools, Nutanix Collector, MAP Toolkit</div>
      </div>

      <div style={s.card}>
        <div style={s.title}>Architecture cible</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[["onpremise","On-Premise","3-tiers / HCI"],["hosted","Hebergee","1AZ / 2AZ / 3AZ OVH"]].map(([v,l,sub])=>(
            <div key={v} onClick={()=>setTargetType(v)} style={{border:"2px solid "+(targetType===v?th.accent:th.border),borderRadius:8,padding:"12px 16px",cursor:"pointer",background:targetType===v?"rgba(0,212,170,0.05)":th.bg2}}>
              <div style={{fontSize:14,fontWeight:600,color:targetType===v?th.accent:th.t1,marginBottom:4}}>{l}</div>
              <div style={{fontSize:11,color:th.t3,fontFamily:"monospace"}}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={s.card}>
        <div style={s.title}>Import fichiers</div>
        <label style={{display:"block",border:"2px dashed "+th.border,borderRadius:8,padding:"32px 20px",textAlign:"center",cursor:"pointer",background:th.bg2}}>
          <input type="file" accept=".xlsx,.csv,.xls" multiple onChange={handleFiles} style={{display:"none"}}/>
          <div style={{fontSize:24,marginBottom:8}}>📂</div>
          <div style={{fontSize:13,fontWeight:600,color:th.t1,marginBottom:4}}>
            {files.length>0 ? files.map(f=>f.name).join(", ") : "Cliquez pour selectionner un ou plusieurs fichiers"}
          </div>
          <div style={{fontSize:11,color:th.t3}}>RVTools (.xlsx) · Nutanix Collector · MAP Toolkit</div>
        </label>
        {files.length>0 && (
          <button onClick={analyse} style={s.btn} disabled={loading}>
            {loading ? "Analyse en cours..." : "Analyser avec Claude"}
          </button>
        )}
        {error && <div style={{marginTop:10,color:"#cc3333",fontSize:12,fontFamily:"monospace"}}>{error}</div>}
      </div>

      {r && !r.error && (
        <>
          <div style={s.card}>
            <div style={s.title}>Infrastructure detectee — {r.fileName}</div>
            <div style={{fontSize:11,color:th.t3,fontFamily:"monospace",marginBottom:12}}>
              Source : {r.source} · {r.vendor} {r.model} · {r.esxVersions.join(", ")}
            </div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:8,marginBottom:12}}>
              {[
                {bg:"linear-gradient(135deg,#0077cc,#005599)", label:"VMs actives",      val:r.vmOn,          sub:r.vmOff+" eteintes"},
                {bg:"linear-gradient(135deg,#e05a20,#b84510)", label:"vCPU alloues",     val:r.totalVcpu,     sub:"VMs poweredOn"},
                {bg:"linear-gradient(135deg,#5a4fcf,#3d35a0)", label:"RAM allouee",      val:r.totalRamGo+" Go", sub:"VMs poweredOn"},
                {bg:"linear-gradient(135deg,#2d7a4f,#1a5c38)", label:"Stockage utilise", val:r.totalDiskTo+" To", sub:"VMs poweredOn"},
              ].map(k=>(
                <div key={k.label} style={{background:k.bg,borderRadius:8,padding:"12px 14px"}}>
                  <div style={{fontSize:9,color:"rgba(255,255,255,0.6)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2}}>{k.label}</div>
                  <div style={{fontSize:20,fontWeight:700,fontFamily:"monospace",color:"#fff"}}>{k.val}</div>
                  <div style={{fontSize:9,color:"rgba(255,255,255,0.5)"}}>{k.sub}</div>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(3,1fr)",gap:8}}>
              {[
                {label:"Hosts",              val:r.hosts,               sub:r.cpuModel.split("@")[0].trim()},
                {label:"CPU physiques",      val:r.totalHostCores+" cores", sub:r.hosts+" hosts"},
                {label:"RAM physique",       val:r.totalHostRamGo+" Go",   sub:"cluster total"},
                {label:"VMs eteintes >90j",  val:r.vmOldOff,            sub:"candidates decommission"},
                {label:"Score consolidation",val:r.consolidationScore+"/100", sub:"potentiel optimisation"},
                {label:"Version ESXi",       val:r.esxVersions[0]||"N/A", sub:"analyse CVE disponible"},
              ].map(k=>(
                <div key={k.label} style={s.kpi}>
                  <div style={s.kpiLbl}>{k.label}</div>
                  <div style={s.kpiVal}>{k.val}</div>
                  <div style={s.kpiSub}>{k.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {r.vmOff > 0 && (
            <div style={{...s.card, border:"1px solid rgba(255,181,71,0.4)", background:"rgba(255,181,71,0.05)"}}>
              <div style={s.title}>Alertes consolidation</div>
              <div style={{fontSize:12,color:"#ffb347",fontFamily:"monospace"}}>
                {r.vmOff} VMs eteintes dont {r.vmOldOff} depuis plus de 90 jours.
                Le decommissionnement libererait des ressources significatives.
              </div>
            </div>
          )}

          <div style={{...s.card, border:"1px solid rgba(0,153,255,0.3)", background:"rgba(0,153,255,0.04)"}}>
            <div style={s.title}>Analyse CVE — bientot disponible</div>
            <div style={{fontSize:12,color:th.t2}}>
              Version detectee : {r.esxVersions.join(", ")}<br/>
              L analyse des CVE associees sera disponible dans la prochaine version.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
