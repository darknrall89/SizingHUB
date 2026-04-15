import { useState } from "react";

export default function AuditCalc({ th, isMobile=false }) {
  const [file,       setFile]       = useState(null);
  const [fileName,   setFileName]   = useState('');
  const [loading,    setLoading]    = useState(false);
  const [report,     setReport]     = useState(null);
  const [targetType, setTargetType] = useState('onpremise');

  const s = {
    card:  { background:th.cardBg, border:"1px solid "+th.border, borderRadius:8, padding:20, marginBottom:14 },
    btn:   { width:"100%", padding:"10px", background:th.accent, border:"none", borderRadius:6, color:"#fff", fontWeight:600, fontSize:13, cursor:"pointer", marginTop:12 },
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setFileName(f.name);
    setReport(null);
  };

  const analyse = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setReport({ source:"RVTools", vms:87, active:71, off:16, vcpu:342, ram:1840, storage:14.2 });
    }, 1500);
  };

  return (
    <div>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:13,color:th.t2}}>Analysez votre infrastructure existante — RVTools, Nutanix Collector, MAP Toolkit</div>
      </div>

      <div style={s.card}>
        <div style={{fontSize:11,fontWeight:600,color:th.t2,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12,fontFamily:"monospace"}}>Architecture cible</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[["onpremise","On-Premise","3-tiers / HCI"],["hosted","Hébergée","1AZ / 2AZ / 3AZ OVH"]].map(([v,l,sub])=>(
            <div key={v} onClick={()=>setTargetType(v)} style={{border:"2px solid "+(targetType===v?th.accent:th.border),borderRadius:8,padding:"12px 16px",cursor:"pointer",background:targetType===v?"rgba(0,212,170,0.05)":th.bg2}}>
              <div style={{fontSize:14,fontWeight:600,color:targetType===v?th.accent:th.t1,marginBottom:4}}>{l}</div>
              <div style={{fontSize:11,color:th.t3,fontFamily:"monospace"}}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={s.card}>
        <div style={{fontSize:11,fontWeight:600,color:th.t2,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12,fontFamily:"monospace"}}>Import fichier</div>
        <label style={{display:"block",border:"2px dashed "+th.border,borderRadius:8,padding:"32px 20px",textAlign:"center",cursor:"pointer",background:th.bg2}}>
          <input type="file" accept=".xlsx,.csv,.xls" onChange={handleFile} style={{display:"none"}}/>
          <div style={{fontSize:24,marginBottom:8}}>📂</div>
          <div style={{fontSize:13,fontWeight:600,color:th.t1,marginBottom:4}}>{fileName||"Cliquez pour sélectionner un fichier"}</div>
          <div style={{fontSize:11,color:th.t3}}>RVTools (.xlsx) · Nutanix Collector · MAP Toolkit</div>
        </label>
        {file&&<button onClick={analyse} style={s.btn}>{loading?"Analyse en cours...":"Analyser avec Claude ⚡"}</button>}
      </div>

      {report&&(
        <div style={s.card}>
          <div style={{fontSize:11,fontWeight:600,color:th.t2,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12,fontFamily:"monospace"}}>Rapport d'analyse</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
            {[
              {label:"VMs total",        val:report.vms,           sub:report.active+" actives"},
              {label:"vCPU alloués",     val:report.vcpu,          sub:"cluster total"},
              {label:"RAM allouée",      val:report.ram+" Go",     sub:"cluster total"},
              {label:"Stockage utilisé", val:report.storage+" To", sub:"provisionné"},
              {label:"VMs éteintes",     val:report.off,           sub:"à analyser"},
              {label:"Source détectée",  val:report.source,        sub:"format reconnu"},
            ].map(k=>(
              <div key={k.label} style={{background:th.bg2,borderRadius:6,padding:"12px 14px"}}>
                <div style={{fontSize:10,color:th.t3,textTransform:"uppercase",fontFamily:"monospace",marginBottom:4}}>{k.label}</div>
                <div style={{fontSize:18,fontWeight:700,fontFamily:"monospace",color:th.t1}}>{k.val}</div>
                <div style={{fontSize:10,color:th.t3}}>{k.sub}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:12,padding:"10px 14px",background:"rgba(255,181,71,0.08)",border:"1px solid rgba(255,181,71,0.3)",borderRadius:6,fontSize:11,color:"#ffb347",fontFamily:"monospace"}}>
            ⚠️ Analyse complète disponible après intégration du fichier RVTools réel
          </div>
        </div>
      )}
    </div>
  );
}
