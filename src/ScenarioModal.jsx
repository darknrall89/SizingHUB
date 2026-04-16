import { useState, useEffect } from "react";

// ── Simulation Panne ──────────────────────────────────────────────────────────
function SimulationPanne({ nodes, socketsPerNode, coresPerSocket, ramPerNode, overcommit, haPolicy, th }) {
  const totalCores   = nodes * socketsPerNode * coresPerSocket;
  const totalVcpu    = totalCores * overcommit;
  const totalRam     = nodes * ramPerNode;
  const haCores      = (nodes - haPolicy) * socketsPerNode * coresPerSocket;
  const haVcpu       = haCores * overcommit;
  const haRam        = (nodes - haPolicy) * ramPerNode;
  const cpuDrop      = Math.round((1 - haCores/totalCores)*100);
  const ramDrop      = Math.round((1 - haRam/totalRam)*100);

  const KPI = ({label, normal, degraded, unit, warn}) => (
    <div style={{background:th.bg2,borderRadius:8,padding:"14px 16px"}}>
      <div style={{fontSize:10,color:th.t3,textTransform:"uppercase",fontFamily:"monospace",marginBottom:8}}>{label}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <div style={{background:"rgba(0,212,170,0.08)",border:"1px solid rgba(0,212,170,0.2)",borderRadius:6,padding:"10px 12px"}}>
          <div style={{fontSize:9,color:"#00a884",marginBottom:4,fontFamily:"monospace"}}>NORMAL</div>
          <div style={{fontSize:20,fontWeight:700,fontFamily:"monospace",color:th.t1}}>{normal}</div>
          <div style={{fontSize:9,color:th.t3}}>{unit}</div>
        </div>
        <div style={{background:warn?"rgba(204,51,51,0.08)":"rgba(255,181,71,0.08)",border:"1px solid "+(warn?"rgba(204,51,51,0.3)":"rgba(255,181,71,0.3)"),borderRadius:6,padding:"10px 12px"}}>
          <div style={{fontSize:9,color:warn?"#cc3333":"#ffb347",marginBottom:4,fontFamily:"monospace"}}>DEGRADE N-{haPolicy}</div>
          <div style={{fontSize:20,fontWeight:700,fontFamily:"monospace",color:warn?"#cc3333":"#ffb347"}}>{degraded}</div>
          <div style={{fontSize:9,color:th.t3}}>{unit}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{padding:"10px 14px",background:"rgba(255,181,71,0.08)",border:"1px solid rgba(255,181,71,0.25)",borderRadius:6,marginBottom:14,fontSize:11,color:"#ffb347",fontFamily:"monospace"}}>
        Simulation : {haPolicy} noeud(s) en panne sur {nodes} — impact sur le cluster actif ({nodes-haPolicy} noeuds)
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
        <KPI label="Coeurs physiques" normal={totalCores} degraded={haCores} unit={"cores (-"+cpuDrop+"%)"} warn={cpuDrop>40}/>
        <KPI label={"vCPUs (overcommit "+overcommit+":1)"} normal={totalVcpu} degraded={haVcpu} unit={"vCPUs"} warn={haVcpu<totalVcpu*0.5}/>
        <KPI label="Memoire cluster" normal={totalRam>=1024?(totalRam/1024).toFixed(1)+" To":totalRam+" Go"} degraded={haRam>=1024?(haRam/1024).toFixed(1)+" To":haRam+" Go"} unit={"RAM (-"+ramDrop+"%)"} warn={ramDrop>40}/>
        <KPI label="Noeuds actifs" normal={nodes+" noeuds"} degraded={(nodes-haPolicy)+" noeuds"} unit={"disponibles"} warn={nodes-haPolicy<2}/>
      </div>
    </div>
  );
}

// ── Helpers parsing Claude ───────────────────────────────────────────────────
const parseCores = (str) => {
  if (!str) return 16;
  const m = str.match(/\((\d+)\s*cores?\)/i) || str.match(/(\d+)\s*cores?/i);
  return m ? parseInt(m[1]) : 16;
};
const parseSockets = (str) => {
  if (!str) return 2;
  const m = str.match(/^(\d+)\s*x/i);
  return m ? parseInt(m[1]) : 2;
};
const parseRam = (str) => {
  if (!str) return 256;
  const m = str.match(/(\d+)\s*Go/i) || str.match(/(\d+)\s*GB/i);
  return m ? parseInt(m[1]) : 256;
};
const parseStorage = (str) => {
  if (!str) return 20;
  const m = str.match(/(\d+(?:\.\d+)?)\s*To/i) || str.match(/(\d+)\s*TB/i);
  return m ? parseFloat(m[1]) : 20;
};

// ── Catalogues disques ───────────────────────────────────────────────────────
const DISK_CATALOG = {
  "3.5": [
    {id:"nlsas-8",  label:"NLSAS 7.2K 8 To",  cap:8},
    {id:"nlsas-12", label:"NLSAS 7.2K 12 To", cap:12},
    {id:"nlsas-16", label:"NLSAS 7.2K 16 To", cap:16},
    {id:"nlsas-18", label:"NLSAS 7.2K 18 To", cap:18},
    {id:"sas10-12", label:"SAS 10K 1,2 To",   cap:1.2},
    {id:"ssd-192",  label:"SSD 1,92 To",       cap:1.92},
    {id:"ssd-384",  label:"SSD 3,84 To",       cap:3.84},
    {id:"ssd-768",  label:"SSD RI 7,68 To",    cap:7.68},
    {id:"nvme-384", label:"NVMe 3,84 To",      cap:3.84},
    {id:"nvme-768", label:"NVMe 7,68 To",      cap:7.68},
    {id:"nvme-1536",label:"NVMe 15,36 To",     cap:15.36},
    {id:"nvme-3072",label:"NVMe 30,72 To",     cap:30.72},
  ],
  "2.5": [
    {id:"sas10-12", label:"SAS 10K 1,2 To",   cap:1.2},
    {id:"sas10-24", label:"SAS 10K 2,4 To",   cap:2.4},
    {id:"ssd-096",  label:"SSD RI 960 Go",     cap:0.96},
    {id:"ssd-192",  label:"SSD 1,92 To",       cap:1.92},
    {id:"ssd-384",  label:"SSD 3,84 To",       cap:3.84},
    {id:"ssd-768",  label:"SSD RI 7,68 To",    cap:7.68},
    {id:"nvme-192", label:"NVMe 1,92 To",      cap:1.92},
    {id:"nvme-384", label:"NVMe 3,84 To",      cap:3.84},
    {id:"nvme-768", label:"NVMe 7,68 To",      cap:7.68},
    {id:"nvme-1536",label:"NVMe 15,36 To",     cap:15.36},
  ],
};
const CHASSIS_TYPES = [
  {id:"3.5-12", label:'12 baies 3,5"', slots:12, form:"3.5"},
  {id:"2.5-24", label:'24 baies 2,5"', slots:24, form:"2.5"},
];
const RAID_EFF = {
  raid1:  n=>0.5,
  raid5:  n=>(n-1)/n,
  raid6:  n=>(n-2)/n,
  raid10: n=>0.5,
  raidtp: n=>(n-3)/n,
  none:   n=>1,
};

// ── Modal 3-Tiers ─────────────────────────────────────────────────────────────
export function Modal3Tiers({ scenario, infraData, onClose, th }) {
  const [tab,            setTab]            = useState("compute");
  const [nodes,          setNodes]          = useState(scenario?.noeuds||2);
  const [sockets,        setSockets]        = useState(parseSockets(scenario?.config_noeud?.cpu));
  const [cores,          setCores]          = useState(parseCores(scenario?.config_noeud?.cpu));
  const [ramPerNode,     setRamPerNode]      = useState(parseRam(scenario?.config_noeud?.ram));
  const [overcommit,     setOvercommit]      = useState(4);
  const [haPolicy,       setHaPolicy]        = useState(1);
  const [nicQty,         setNicQty]          = useState(4);
  const [nicSpeed,       setNicSpeed]        = useState(25);
  const [storageUsable,  setStorageUsable]   = useState(parseStorage(scenario?.config_noeud?.stockage)||20);
  const [storageRaid,    setStorageRaid]     = useState("raid5");
  const [chassisId,      setChassisId]       = useState("2.5-24");
  const [diskId,         setDiskId]          = useState("nvme-384");
  const [diskQty,        setDiskQty]         = useState(12);
  const [dedupRatio,     setDedupRatio]      = useState(1);
  const [iopsTarget,     setIopsTarget]      = useState(50000);
  const [uplinkSpeed,    setUplinkSpeed]     = useState(100);
  const [uplinkQty,      setUplinkQty]       = useState(2);

  const totalCores  = nodes * sockets * cores;
  const totalVcpu   = totalCores * overcommit;
  const totalRam    = nodes * ramPerNode;
  const haCores     = (nodes - haPolicy) * sockets * cores;
  const haVcpu      = haCores * overcommit;
  const haRam       = (nodes - haPolicy) * ramPerNode;
  const chassis     = CHASSIS_TYPES.find(c=>c.id===chassisId)||CHASSIS_TYPES[1];
  const disk        = (DISK_CATALOG[chassis.form]||[]).find(d=>d.id===diskId)||(DISK_CATALOG[chassis.form]||[])[0]||{cap:3.84};
  const diskCap     = disk.cap;
  const raidEff     = RAID_EFF[storageRaid]||RAID_EFF.raid5;
  const storageBrut = (diskQty * diskCap).toFixed(1);
  const storageEff  = (diskQty * diskCap * raidEff(diskQty) * 0.93).toFixed(1);
  const diskNeeded  = Math.ceil(storageUsable / diskCap / raidEff(100) / 0.93);
  const storageEffDedup = (parseFloat(storageEff) * dedupRatio).toFixed(1);
  const targetOk    = parseFloat(storageEffDedup) >= storageUsable;
  const capDelta    = (parseFloat(storageEffDedup) - storageUsable).toFixed(1);
  const diskIops    = disk?.iops || 50000;
  const totalIops   = diskQty * diskIops;
  const iopsOk      = totalIops >= iopsTarget;
  const iopsDelta   = totalIops - iopsTarget;
  const freeSlots   = chassis.slots - diskQty;

  const s = {
    card:  {background:th.cardBg,border:"1px solid "+th.border,borderRadius:8,padding:16,marginBottom:12},
    label: {display:"block",fontSize:10,color:th.t3,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:5},
    input: {width:"100%",background:th.bg2,border:"1px solid "+th.border,borderRadius:4,padding:"7px 10px",color:th.t1,fontFamily:"monospace",fontSize:12,boxSizing:"border-box"},
    select:{width:"100%",background:th.bg2,border:"1px solid "+th.border,borderRadius:4,padding:"7px 10px",color:th.t1,fontFamily:"monospace",fontSize:12},
    kpi:   {background:th.bg2,borderRadius:6,padding:"10px 12px"},
    kpiL:  {fontSize:9,color:th.t3,textTransform:"uppercase",fontFamily:"monospace",marginBottom:3},
    kpiV:  {fontSize:18,fontWeight:700,fontFamily:"monospace",color:th.t1},
  };

  const tabs = ["compute","stockage","reseau","panne"];
  const tabLabels = {compute:"Compute",stockage:"Stockage",reseau:"Reseau",panne:"Simulation panne"};

  return (
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.6)",zIndex:1000,display:"flex",alignItems:"flex-start",justifyContent:"center",overflowY:"auto",padding:"20px"}}>
      <div style={{background:th.bg0,borderRadius:12,width:"100%",maxWidth:900,padding:24,position:"relative"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <div style={{fontSize:16,fontWeight:700,color:th.t1}}>Scenario 3-Tiers On-Premise</div>
            <div style={{fontSize:11,color:th.t3,fontFamily:"monospace"}}>{infraData?.fileName||""} · Ajustement manuel</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"1px solid "+th.border,borderRadius:6,padding:"6px 12px",color:th.t2,cursor:"pointer",fontSize:12}}>Fermer</button>
        </div>

        {/* KPIs recap */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>
          {(tab==="stockage"?[
            {label:"Evolutivite",      sub:"Slots disponibles",   val:freeSlots+" slots",             sub2:diskQty+" / "+chassis.slots+" utilises",                                 bg:"linear-gradient(135deg,#5a4fcf,#3d35a0)"},
            {label:"Capacite utile",   sub:"Apres RAID",          val:parseFloat(storageEff).toFixed(1)+" To",  sub2:storageBrut+" To brut",                                       bg:"linear-gradient(135deg,#0077cc,#005599)"},
            {label:"Capacite effective",sub:"Apres dedup x"+dedupRatio, val:storageEffDedup+" To",   sub2:(parseFloat(capDelta)>=0?"+":"")+capDelta+" To vs "+storageUsable+" To cible", bg:targetOk?"linear-gradient(135deg,#00a884,#007a60)":"linear-gradient(135deg,#cc3333,#991111)"},
            {label:"Conformite IOPS",  sub:iopsOk?"Objectif atteint":"Insuffisant",val:totalIops.toLocaleString(), sub2:(iopsDelta>=0?"+":"")+iopsDelta.toLocaleString()+" vs "+iopsTarget.toLocaleString()+" requis", bg:iopsOk?"linear-gradient(135deg,#00a884,#007a60)":"linear-gradient(135deg,#d97706,#b45309)"},
          ]:[
            {label:"Noeuds",            sub:"Cluster compute",     val:nodes,                                                            bg:"linear-gradient(135deg,#0077cc,#005599)"},
            {label:"CPU physiques",     sub:sockets+"S x "+cores+"C x "+nodes+" noeuds", val:totalCores+" cores",                       bg:"linear-gradient(135deg,#e05a20,#b84510)"},
            {label:"vCPU ("+overcommit+":1)", sub:"Avec overcommit",val:totalVcpu+" vCPU",                                              bg:"linear-gradient(135deg,#d97706,#b45309)"},
            {label:"RAM cluster",       sub:ramPerNode+" Go x "+nodes+" noeuds", val:totalRam>=1024?(totalRam/1024).toFixed(1)+" To":totalRam+" Go", bg:"linear-gradient(135deg,#5a4fcf,#3d35a0)"},
          ]).map(k=>(
            <div key={k.label||k.l} style={{background:k.bg||(k.c+"15"),border:k.bg?"none":"1px solid "+k.c+"33",borderRadius:8,padding:"12px 14px"}}>
              <div style={{fontSize:10,color:k.bg?"rgba(255,255,255,0.6)":k.c,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>{k.label||k.l}</div>
              {k.sub&&<div style={{fontSize:10,color:k.bg?"rgba(255,255,255,0.5)":th.t3,marginBottom:4}}>{k.sub}</div>}
              <div style={{fontSize:18,fontWeight:700,fontFamily:"monospace",color:k.bg?"#fff":k.c}}>{k.val||k.v}</div>
              {k.sub2&&<div style={{fontSize:9,color:k.bg?"rgba(255,255,255,0.6)":th.t3,marginTop:2}}>{k.sub2}</div>}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:4,marginBottom:16,borderBottom:"1px solid "+th.border}}>
          {tabs.map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:"8px 16px",background:"none",border:"none",borderBottom:"2px solid "+(tab===t?"#0077cc":"transparent"),color:tab===t?"#0077cc":th.t2,fontWeight:tab===t?600:400,fontSize:12,cursor:"pointer",fontFamily:"monospace"}}>
              {tabLabels[t]}
            </button>
          ))}
        </div>

        {/* COMPUTE */}
        {tab==="compute"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div style={s.card}>
                <div style={{fontSize:11,fontWeight:600,color:th.t2,textTransform:"uppercase",marginBottom:12,fontFamily:"monospace"}}>Serveurs</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[
                    {l:"Nombre de serveurs",v:nodes,set:setNodes,min:1,max:32},
                    {l:"Sockets / serveur",v:sockets,set:setSockets,min:1,max:4},
                    {l:"Coeurs / socket",v:cores,set:setCores,min:4,max:128,step:2},
                    {l:"RAM / noeud (Go)",v:ramPerNode,set:setRamPerNode,min:64,max:6144,step:64},
                  ].map(f=>(
                    <div key={f.l}>
                      <label style={s.label}>{f.l}</label>
                      <input type="number" min={f.min} max={f.max} step={f.step||1} value={f.v} onChange={e=>f.set(Number(e.target.value))} style={s.input}/>
                    </div>
                  ))}
                </div>
              </div>
              <div style={s.card}>
                <div style={{fontSize:11,fontWeight:600,color:th.t2,textTransform:"uppercase",marginBottom:12,fontFamily:"monospace"}}>Virtualisation</div>
                <div style={{marginBottom:8}}>
                  <label style={s.label}>Overcommit vCPU</label>
                  <select value={overcommit} onChange={e=>setOvercommit(Number(e.target.value))} style={s.select}>
                    {[[1,"1:1"],[2,"2:1"],[3,"3:1"],[4,"4:1 Standard"],[6,"6:1"],[8,"8:1"]].map(([v,l])=>(
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div style={{marginBottom:8}}>
                  <label style={s.label}>Politique HA</label>
                  <select value={haPolicy} onChange={e=>setHaPolicy(Number(e.target.value))} style={s.select}>
                    <option value={1}>N+1 (1 panne)</option>
                    <option value={2}>N+2 (2 pannes)</option>
                  </select>
                </div>
                <div style={{marginBottom:8}}>
                  <label style={s.label}>Interfaces reseau / serveur</label>
                  <input type="number" min={2} max={8} value={nicQty} onChange={e=>setNicQty(Number(e.target.value))} style={s.input}/>
                </div>
                <div>
                  <label style={s.label}>Vitesse interfaces</label>
                  <select value={nicSpeed} onChange={e=>setNicSpeed(Number(e.target.value))} style={s.select}>
                    {[[1,"1 Gbps"],[10,"10 Gbps"],[25,"25 Gbps"],[100,"100 Gbps"]].map(([v,l])=>(
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* STOCKAGE */}
        {tab==="stockage"&&(()=>{
          return (
            <div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                <div style={s.card}>
                  <div style={{fontSize:11,fontWeight:600,color:th.t2,textTransform:"uppercase",marginBottom:12,fontFamily:"monospace"}}>Chassis & Disques</div>
                  <div style={{marginBottom:8}}>
                    <label style={s.label}>Format chassis</label>
                    <select value={chassisId} onChange={e=>{setChassisId(e.target.value);setDiskId((DISK_CATALOG[CHASSIS_TYPES.find(c=>c.id===e.target.value)?.form]||[])[0]?.id||"nvme-384");}} style={s.select}>
                      {CHASSIS_TYPES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                    <div style={{fontSize:9,color:th.t3,marginTop:2}}>{chassis.slots} slots disponibles</div>
                  </div>
                  <div style={{marginBottom:8}}>
                    <label style={s.label}>Modele de disque</label>
                    <select value={diskId} onChange={e=>setDiskId(e.target.value)} style={s.select}>
                      {(DISK_CATALOG[chassis.form]||[]).map(d=><option key={d.id} value={d.id}>{d.label}</option>)}
                    </select>
                  </div>
                  <div style={{marginBottom:8}}>
                    <label style={s.label}>Nombre de disques</label>
                    <input type="number" min={1} max={chassis.slots} value={diskQty} onChange={e=>setDiskQty(Number(e.target.value))} style={s.input}/>
                    <div style={{fontSize:9,color:diskQty>chassis.slots?"#cc3333":th.t3,marginTop:2}}>{diskQty}/{chassis.slots} slots ({Math.round(diskQty/chassis.slots*100)}%)</div>
                  </div>
                </div>
                <div style={s.card}>
                  <div style={{fontSize:11,fontWeight:600,color:th.t2,textTransform:"uppercase",marginBottom:12,fontFamily:"monospace"}}>Protection & Cible</div>
                  <div style={{marginBottom:8}}>
                    <label style={s.label}>Niveau RAID</label>
                    <select value={storageRaid} onChange={e=>setStorageRaid(e.target.value)} style={s.select}>
                      <option value="raid1">RAID-1 — Miroir (x2)</option>
                      <option value="raid5">RAID-5 — 1 disque parite</option>
                      <option value="raid6">RAID-6 — 2 disques parite</option>
                      <option value="raid10">RAID-10 — Miroir + Stripe</option>
                      <option value="raidtp">RAID-TP — Triple parite</option>
                    </select>
                  </div>
                  <div style={{marginBottom:8}}>
                    <label style={s.label}>Capacite utile cible (To)</label>
                    <input type="number" min={1} max={1000} step={0.1} value={storageUsable} onChange={e=>setStorageUsable(Number(e.target.value))} style={s.input}/>
                  </div>
                  <div style={{marginBottom:8}}>
                    <label style={s.label}>Ratio dedup / compression</label>
                    <select value={dedupRatio} onChange={e=>setDedupRatio(Number(e.target.value))} style={s.select}>
                      {[[1,"1:1 — Sans dedup"],[1.5,"1.5:1"],[2,"2:1"],[3,"3:1"],[4,"4:1"]].map(([v,l])=>(
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{marginBottom:12}}>
                    <label style={s.label}>IOPS cibles</label>
                    <input type="number" min={0} max={10000000} step={1000} value={iopsTarget} onChange={e=>setIopsTarget(Number(e.target.value))} style={s.input}/>
                  </div>
                  <div style={{padding:"12px 14px",background:targetOk?"rgba(0,212,170,0.08)":"rgba(204,51,51,0.08)",border:"1px solid "+(targetOk?"rgba(0,212,170,0.3)":"rgba(204,51,51,0.3)"),borderRadius:6}}>
                    <div style={{fontSize:9,color:th.t3,fontFamily:"monospace",marginBottom:4}}>DISQUES NECESSAIRES POUR LA CIBLE</div>
                    <div style={{fontSize:22,fontWeight:700,fontFamily:"monospace",color:targetOk?"#00a884":"#cc3333"}}>{diskNeeded} disques</div>
                    <div style={{fontSize:9,color:targetOk?"#00a884":"#cc3333",marginTop:2}}>{targetOk?"Cible atteinte avec la configuration actuelle":"Ajouter des disques pour atteindre la cible"}</div>
                  </div>
                </div>
              </div>

            </div>
          );
        })()}

        {/* RESEAU */}
        {tab==="reseau"&&(
          <div style={s.card}>
            <div style={{fontSize:11,fontWeight:600,color:th.t2,textTransform:"uppercase",marginBottom:12,fontFamily:"monospace"}}>Switch Fabric</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div>
                {[
                  {l:"Uplinks vers core (Gbps)",v:uplinkSpeed,set:setUplinkSpeed,type:"select",opts:[[1,"1G"],[10,"10G"],[25,"25G"],[40,"40G"],[100,"100G"]]},
                  {l:"Nb uplinks / switch",v:uplinkQty,set:setUplinkQty,min:1,max:8},
                ].map(f=>(
                  <div key={f.l} style={{marginBottom:8}}>
                    <label style={s.label}>{f.l}</label>
                    {f.type==="select"?(
                      <select value={f.v} onChange={e=>f.set(Number(e.target.value))} style={s.select}>
                        {f.opts.map(([v,l])=><option key={v} value={v}>{l} Gbps</option>)}
                      </select>
                    ):(
                      <input type="number" min={f.min} max={f.max} value={f.v} onChange={e=>f.set(Number(e.target.value))} style={s.input}/>
                    )}
                  </div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,alignContent:"start"}}>
                {[
                  {l:"BW serveurs total",  v:(nodes*nicQty*nicSpeed)+" Gbps"},
                  {l:"BW uplinks / switch",v:(uplinkQty*uplinkSpeed)+" Gbps"},
                  {l:"Oversubscription",   v:((nodes*nicQty*nicSpeed)/(uplinkQty*uplinkSpeed)).toFixed(1)+":1"},
                  {l:"Interfaces / noeud", v:nicQty+"x "+nicSpeed+"G"},
                ].map(k=>(
                  <div key={k.l} style={{background:"rgba(224,90,32,0.08)",border:"1px solid rgba(224,90,32,0.2)",borderRadius:6,padding:"10px 12px"}}>
                    <div style={s.kpiL}>{k.l}</div>
                    <div style={{...s.kpiV,color:"#e05a20"}}>{k.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SIMULATION PANNE */}
        {tab==="panne"&&(
          <SimulationPanne
            nodes={nodes}
            socketsPerNode={sockets}
            coresPerSocket={cores}
            ramPerNode={ramPerNode}
            overcommit={overcommit}
            haPolicy={haPolicy}
            th={th}
          />
        )}
      </div>
    </div>
  );
}

// ── Modal HCI ─────────────────────────────────────────────────────────────────
export function ModalHCI({ scenario, infraData, onClose, th }) {
  const [tab,           setTab]          = useState("hci");
  const [nodes,         setNodes]        = useState(scenario?.noeuds||3);
  const [sockets,       setSockets]      = useState(2);
  const [cores,         setCores]        = useState(parseCores(scenario?.config_noeud?.cpu));
  const [ramPerNode,    setRamPerNode]   = useState(parseRam(scenario?.config_noeud?.ram));
  const [overcommit,    setOvercommit]   = useState(4);
  const [haPolicy,      setHaPolicy]     = useState(1);
  const [storagePerNode,setStoragePerNode]=useState(parseStorage(scenario?.config_noeud?.stockage)||8);
  const [hyperviseur,   setHyperviseur]  = useState("vsan");
  const [resilience,    setResilience]   = useState("ftt1r1");

  const resFactor = resilience==="ftt1r5"?1.33:resilience==="ftt2r6"?1.5:resilience==="ftt2r1"||resilience==="rf3"?3:2;
  const totalCores  = nodes * sockets * cores;
  const totalVcpu   = totalCores * overcommit;
  const totalRam    = nodes * ramPerNode;
  const storageRaw  = nodes * storagePerNode;
  const storageEff  = (storageRaw / resFactor * 0.9).toFixed(1);
  const haCores     = (nodes-haPolicy) * sockets * cores;
  const haVcpu      = haCores * overcommit;
  const haRam       = (nodes-haPolicy) * ramPerNode;
  const haStorage   = ((nodes-haPolicy)*storagePerNode / resFactor * 0.9).toFixed(1);

  const s = {
    card:  {background:th.cardBg,border:"1px solid "+th.border,borderRadius:8,padding:16,marginBottom:12},
    label: {display:"block",fontSize:10,color:th.t3,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:5},
    input: {width:"100%",background:th.bg2,border:"1px solid "+th.border,borderRadius:4,padding:"7px 10px",color:th.t1,fontFamily:"monospace",fontSize:12,boxSizing:"border-box"},
    select:{width:"100%",background:th.bg2,border:"1px solid "+th.border,borderRadius:4,padding:"7px 10px",color:th.t1,fontFamily:"monospace",fontSize:12},
    kpiL:  {fontSize:9,color:th.t3,textTransform:"uppercase",fontFamily:"monospace",marginBottom:3},
    kpiV:  {fontSize:18,fontWeight:700,fontFamily:"monospace",color:th.t1},
  };

  const tabs = ["hci","panne"];
  const tabLabels = {hci:"Configuration HCI",panne:"Simulation panne"};

  return (
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.6)",zIndex:1000,display:"flex",alignItems:"flex-start",justifyContent:"center",overflowY:"auto",padding:"20px"}}>
      <div style={{background:th.bg0,borderRadius:12,width:"100%",maxWidth:900,padding:24,position:"relative"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <div style={{fontSize:16,fontWeight:700,color:th.t1}}>Scenario HCI On-Premise</div>
            <div style={{fontSize:11,color:th.t3,fontFamily:"monospace"}}>{infraData?.fileName||""} · Ajustement manuel</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"1px solid "+th.border,borderRadius:6,padding:"6px 12px",color:th.t2,cursor:"pointer",fontSize:12}}>Fermer</button>
        </div>

        {/* KPIs recap */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>
          {[
            {l:"Noeuds",          v:nodes,                  c:"#0077cc"},
            {l:"vCPU cluster",    v:totalVcpu+" vCPUs",     c:"#e05a20"},
            {l:"RAM cluster",     v:totalRam>=1024?(totalRam/1024).toFixed(1)+" To":totalRam+" Go", c:"#5a4fcf"},
            {l:"Stockage effectif",v:storageEff+" To",      c:"#2d7a4f"},
          ].map(k=>(
            <div key={k.l} style={{background:k.c+"15",border:"1px solid "+k.c+"33",borderRadius:8,padding:"12px 14px"}}>
              <div style={s.kpiL}>{k.l}</div>
              <div style={{...s.kpiV,color:k.c}}>{k.v}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:4,marginBottom:16,borderBottom:"1px solid "+th.border}}>
          {tabs.map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:"8px 16px",background:"none",border:"none",borderBottom:"2px solid "+(tab===t?"#e05a20":"transparent"),color:tab===t?"#e05a20":th.t2,fontWeight:tab===t?600:400,fontSize:12,cursor:"pointer",fontFamily:"monospace"}}>
              {tabLabels[t]}
            </button>
          ))}
        </div>

        {tab==="hci"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div style={s.card}>
                <div style={{fontSize:11,fontWeight:600,color:th.t2,textTransform:"uppercase",marginBottom:12,fontFamily:"monospace"}}>Configuration noeuds</div>
                <div style={{marginBottom:8}}>
                  <label style={s.label}>Hyperviseur</label>
                  <select value={hyperviseur} onChange={e=>setHyperviseur(e.target.value)} style={s.select}>
                    <option value="vsan">VMware vSAN</option>
                    <option value="nutanix">Nutanix AHV</option>
                    <option value="proxmox">Proxmox VE</option>
                    <option value="hyperv">Hyper-V / Azure Stack HCI</option>
                  </select>
                </div>
                <div style={{marginBottom:8}}>
                  <label style={s.label}>Resilience</label>
                  <select value={resilience} onChange={e=>setResilience(e.target.value)} style={s.select}>
                    {hyperviseur==="vsan"?[
                      ["ftt1r1","FTT=1 RAID-1 (x2)"],["ftt1r5","FTT=1 RAID-5 (x1.33)"],
                      ["ftt2r1","FTT=2 RAID-1 (x3)"],["ftt2r6","FTT=2 RAID-6 (x1.5)"],
                    ]:hyperviseur==="nutanix"?[
                      ["rf2","RF2 (x2)"],["rf3","RF3 (x3)"],
                    ]:[
                      ["rf2","RF2 / Mirror (x2)"],["rf3","RF3 (x3)"],
                    ].map(([v,l])=><option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[
                    {l:"Nombre de noeuds",v:nodes,set:setNodes,min:3,max:32},
                    {l:"Sockets / noeud",v:sockets,set:setSockets,min:1,max:4},
                    {l:"Coeurs / socket",v:cores,set:setCores,min:4,max:128,step:2},
                    {l:"RAM / noeud (Go)",v:ramPerNode,set:setRamPerNode,min:64,max:6144,step:64},
                    {l:"Stockage / noeud (To)",v:storagePerNode,set:setStoragePerNode,min:1,max:100,step:1},
                  ].map(f=>(
                    <div key={f.l}>
                      <label style={s.label}>{f.l}</label>
                      <input type="number" min={f.min} max={f.max} step={f.step||1} value={f.v} onChange={e=>f.set(Number(e.target.value))} style={s.input}/>
                    </div>
                  ))}
                  <div>
                    <label style={s.label}>Overcommit vCPU</label>
                    <select value={overcommit} onChange={e=>setOvercommit(Number(e.target.value))} style={s.select}>
                      {[[1,"1:1"],[2,"2:1"],[3,"3:1"],[4,"4:1"],[6,"6:1"],[8,"8:1"]].map(([v,l])=>(
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div style={s.card}>
                <div style={{fontSize:11,fontWeight:600,color:th.t2,textTransform:"uppercase",marginBottom:12,fontFamily:"monospace"}}>KPIs cluster</div>
                {[
                  {l:"CPU total",       v:totalCores+" cores physiques",    c:"#e05a20"},
                  {l:"vCPU disponibles",v:totalVcpu+" vCPUs ("+overcommit+":1)", c:"#e05a20"},
                  {l:"RAM totale",      v:totalRam>=1024?(totalRam/1024).toFixed(1)+" To":totalRam+" Go", c:"#5a4fcf"},
                  {l:"Stockage brut",   v:storageRaw+" To",                 c:"#2d7a4f"},
                  {l:"Stockage effectif",v:storageEff+" To (apres replication)", c:"#2d7a4f"},
                  {l:"Facteur resilience",v:"x"+resFactor,                  c:"#888"},
                  {l:"CPU N-"+haPolicy, v:haCores+" cores / "+haVcpu+" vCPUs", c:(haCores/totalCores<0.5?"#cc3333":"#ffb347")},
                  {l:"RAM N-"+haPolicy, v:haRam>=1024?(haRam/1024).toFixed(1)+" To":haRam+" Go", c:(haRam/totalRam<0.5?"#cc3333":"#ffb347")},
                ].map(k=>(
                  <div key={k.l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid "+th.border}}>
                    <span style={{fontSize:11,color:th.t2}}>{k.l}</span>
                    <span style={{fontSize:11,fontWeight:600,fontFamily:"monospace",color:k.c}}>{k.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab==="panne"&&(
          <SimulationPanne
            nodes={nodes}
            socketsPerNode={sockets}
            coresPerSocket={cores}
            ramPerNode={ramPerNode}
            overcommit={overcommit}
            haPolicy={haPolicy}
            th={th}
          />
        )}
      </div>
    </div>
  );
}
