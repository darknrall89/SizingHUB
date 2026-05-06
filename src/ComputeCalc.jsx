import { useState, useMemo } from "react";
import {
  Server, Cpu, MemoryStick, Gauge, Shield, AlertTriangle,
  CheckCircle, TrendingUp, BarChart3, Zap, X, RefreshCw
} from "lucide-react";

const fmt = (n) => Number(n || 0).toLocaleString("fr-FR");

export default function ComputeCalc({ th, isMobile=false }) {
  const [compared, setCompared] = useState(false);
  const [chartView, setChartView] = useState("all");
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [targetRatio, setTargetRatio] = useState(4);

  const [existing, setExisting] = useState({
    servers: 3,
    sockets: 2,
    coresPerSocket: 16,
    ghz: 2.4,
    ram: 768,
    vcpus: 519,
  });

  const [target, setTarget] = useState({
    servers: 4,
    sockets: 2,
    coresPerSocket: 32,
    ghz: 3.0,
    ram: 2048,
    growth: 20,
    haLoss: 1,
  });

  const existingCores = existing.servers * existing.sockets * existing.coresPerSocket;
  const targetCores = target.servers * target.sockets * target.coresPerSocket;
  const existingGhz = existingCores * existing.ghz;
  const targetGhz = targetCores * target.ghz;
  const n1Servers = Math.max(target.servers - target.haLoss, 1);
  const n1Ratio = n1Servers / target.servers;
  const n1Cores = Math.round(targetCores * n1Ratio);
  const n1Ghz = Math.round(targetGhz * n1Ratio);
  const n1Ram = Math.round(target.ram * n1Ratio);
  
  const cpuGain = existingCores ? Math.round(((targetCores - existingCores) / existingCores) * 100) : 0;
  const ramGain = existing.ram ? Math.round(((target.ram - existing.ram) / existing.ram) * 100) : 0;
  const ghzGain = existingGhz ? Math.round(((targetGhz - existingGhz) / existingGhz) * 100) : 0;
  
  const cpuOkN1 = n1Cores >= existingCores * (1 + target.growth / 100);
  const ramOkN1 = n1Ram >= existing.ram * (1 + target.growth / 100);
  const globalOk = cpuOkN1 && ramOkN1;

  const score = Math.max(0, Math.min(100,
    60 +
    (cpuOkN1 ? 15 : -15) +
    (ramOkN1 ? 15 : -15) +
    (target.servers >= 3 ? 10 : -10)
  ));

  const input = {
    width:"100%",
    padding:"10px 12px",
    borderRadius:8,
    border:`1px solid ${th.border}`,
    background:th.bg1,
    color:th.t1,
    fontSize:13,
    boxSizing:"border-box"
  };

  const label = {
    fontSize:10,
    color:th.t3,
    textTransform:"uppercase",
    letterSpacing:"0.08em",
    fontWeight:800,
    marginBottom:6
  };

  const Card = ({children}) => (
    <div style={{
      background:th.cardBg,
      border:`1px solid ${th.border}`,
      borderRadius:16,
      padding:18,
      boxShadow:"0 12px 30px rgba(15,23,42,0.06)"
    }}>
      {children}
    </div>
  );

  const Kpi = ({title,value,sub,color,icon}) => (
    <div style={{
      background:`linear-gradient(135deg, ${color}18, ${color}08)`,
      border:`1px solid ${color}30`,
      borderRadius:16,
      padding:"18px 20px",
      color
    }}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:11,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.06em"}}>{title}</div>
          <div style={{fontSize:28,fontWeight:950,marginTop:8}}>{value}</div>
          <div style={{fontSize:12,color:th.t2,marginTop:5}}>{sub}</div>
        </div>
        {icon}
      </div>
    </div>
  );

  const Field = ({title,value,onChange,step=1}) => (
    <div>
      <div style={label}>{title}</div>
      <input type="number" step={step} value={value} onChange={e=>onChange(Number(e.target.value))} style={input}/>
    </div>
  );

  const VerticalChart = ({label,oldv,newv,n1v,unit}) => {
    const max = Math.max(oldv,newv,n1v,1);
    const items = [
      ["Existant", oldv, "#9ca3af"],
      ["Cible", newv, th.accent2],
      ["N-1", n1v, th.accent],
    ];

    return (
      <div style={{
        border:`1px solid ${th.border}`,
        borderRadius:14,
        padding:"14px 14px 12px",
        background:th.bg1
      }}>
        <div style={{fontSize:13,fontWeight:950,color:th.t1,marginBottom:14}}>
          {label}
        </div>

        <div style={{
          display:"flex",
          alignItems:"end",
          justifyContent:"space-around",
          gap:10,
          height:150,
          borderBottom:`1px solid ${th.border}`,
          padding:"0 6px"
        }}>
          {items.map(([name,value,color])=>(
            <div key={name} style={{
              display:"flex",
              flexDirection:"column",
              alignItems:"center",
              justifyContent:"end",
              height:"100%",
              flex:1
            }}>
              <div style={{
                fontSize:11,
                fontWeight:900,
                color,
                marginBottom:6,
                whiteSpace:"nowrap"
              }}>
                {fmt(value)} {unit}
              </div>
              <div style={{
                width:"42%",
                minWidth:24,
                height:`${Math.max(8, Math.round((value/max)*110))}px`,
                background:color,
                borderRadius:"8px 8px 0 0",
                boxShadow:"0 8px 18px rgba(15,23,42,0.12)"
              }}/>
            </div>
          ))}
        </div>

        <div style={{
          display:"grid",
          gridTemplateColumns:"repeat(3,1fr)",
          gap:6,
          marginTop:9
        }}>
          {items.map(([name,,color])=>(
            <div key={name} style={{
              display:"flex",
              alignItems:"center",
              justifyContent:"center",
              gap:5,
              fontSize:10,
              color:th.t2,
              fontWeight:800
            }}>
              <span style={{width:8,height:8,borderRadius:999,background:color}}/>
              {name}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const chartData = {
    cores: ["Cœurs CPU", existingCores, targetCores, n1Cores, ""],
    ghz: ["GHz agrégés", Math.round(existingGhz), Math.round(targetGhz), n1Ghz, "GHz"],
    ram: ["RAM totale", existing.ram, target.ram, n1Ram, "Go"],
    nodes: ["Nœuds", existing.servers, target.servers, n1Servers, ""],
  };

  const chartItems = chartView === "all"
    ? Object.values(chartData)
    : [chartData[chartView]];

  if (!compared) {
    return (
      <div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:18}}>
          <Card>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
              <Server size={22} color={th.accent2}/>
              <div>
                <div style={{fontSize:18,fontWeight:950,color:th.t1}}>Infrastructure existante</div>
                <div style={{fontSize:12,color:th.t2}}>Renseigner la capacité actuelle observée</div>
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <Field title="Nombre de serveurs" value={existing.servers} onChange={v=>setExisting({...existing,servers:v})}/>
              <div>
  <div style={label}>Sockets par nœud</div>
  <select value={existing.sockets}
    onChange={e=>setExisting({...existing, sockets:Number(e.target.value)})}
    style={input}>
    <option value={1}>1 socket</option>
    <option value={2}>2 sockets</option>
    <option value={4}>4 sockets</option>
  </select>
</div>
              <Field title="Cœurs par socket" value={existing.coresPerSocket} onChange={v=>setExisting({...existing,coresPerSocket:v})}/>
              <Field title="Fréquence CPU GHz" step={0.1} value={existing.ghz} onChange={v=>setExisting({...existing,ghz:v})}/>
              <Field title="Mémoire totale Go" value={existing.ram} onChange={v=>setExisting({...existing,ram:v})}/>
            </div>
          </Card>

          <Card>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
              <Shield size={22} color={th.accent}/>
              <div>
                <div style={{fontSize:18,fontWeight:950,color:th.t1}}>Infrastructure cible</div>
                <div style={{fontSize:12,color:th.t2}}>Définir la cible et la résilience attendue</div>
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <Field title="Nombre de serveurs cible" value={target.servers} onChange={v=>setTarget({...target,servers:v})}/>
              <div>
  <div style={label}>Sockets par nœud cible</div>
  <select value={target.sockets}
    onChange={e=>setTarget({...target, sockets:Number(e.target.value)})}
    style={input}>
    <option value={1}>1 socket</option>
    <option value={2}>2 sockets</option>
    <option value={4}>4 sockets</option>
  </select>
</div>
              <Field title="Cœurs par socket cible" value={target.coresPerSocket} onChange={v=>setTarget({...target,coresPerSocket:v})}/>
              <Field title="Fréquence CPU cible GHz" step={0.1} value={target.ghz} onChange={v=>setTarget({...target,ghz:v})}/>
              <Field title="Mémoire cible Go" value={target.ram} onChange={v=>setTarget({...target,ram:v})}/>
              <Field title="Croissance projetée %" value={target.growth} onChange={v=>setTarget({...target,growth:v})}/>
              <Field title="Nœuds perdus en HA" value={target.haLoss} onChange={v=>setTarget({...target,haLoss:v})}/>
            </div>
          </Card>
        </div>

        <button onClick={()=>setCompared(true)} style={{
          marginTop:18,
          width:"100%",
          padding:"14px 18px",
          border:"none",
          borderRadius:14,
          background:th.accent2,
          color:"#fff",
          fontSize:15,
          fontWeight:950,
          cursor:"pointer",
          boxShadow:"0 12px 28px rgba(37,99,235,0.25)"
        }}>
          Comparer les solutions
        </button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={()=>setCompared(false)} style={{
        marginBottom:14,
        padding:"10px 14px",
        borderRadius:10,
        border:`1px solid ${th.border}`,
        background:th.bg2,
        color:th.t2,
        fontWeight:900,
        cursor:"pointer"
      }}>
        ← Retour aux hypothèses
      </button>

      <div style={{
        background:th.cardBg,
        border:`1px solid ${th.border}`,
        borderRadius:16,
        padding:20,
        marginBottom:18,
        display:"grid",
        gridTemplateColumns:isMobile?"1fr":"220px 1fr 220px",
        gap:18,
        alignItems:"center"
      }}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{
            width:92,height:92,borderRadius:999,
            border:`10px solid ${globalOk?th.accent:th.warn}`,
            display:"flex",alignItems:"center",justifyContent:"center",
            flexDirection:"column",fontWeight:950,color:th.t1
          }}>
            <span style={{fontSize:28}}>{score}</span>
            <span style={{fontSize:11}}>/100</span>
          </div>
          <div>
            <div style={{fontSize:20,fontWeight:950,color:globalOk?th.accent:th.warn}}>
              {globalOk?"Optimisé":"À surveiller"}
            </div>
            <div style={{fontSize:12,color:th.t2,lineHeight:1.45}}>
              Comparaison existant, cible et capacité en N-1.
            </div>
          </div>
        </div>

        <div style={{display:"grid",gap:8}}>
          <div style={{display:"flex",gap:8,alignItems:"center",fontSize:13,color:th.t1}}>
            {cpuOkN1?<CheckCircle size={16} color={th.accent}/>:<AlertTriangle size={16} color={th.warn}/>}
            CPU en N-1 {cpuOkN1?"suffisant":"insuffisant"} avec +{target.growth}% de croissance
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center",fontSize:13,color:th.t1}}>
            {ramOkN1?<CheckCircle size={16} color={th.accent}/>:<AlertTriangle size={16} color={th.warn}/>}
            RAM en N-1 {ramOkN1?"suffisante":"proche du seuil"}
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center",fontSize:13,color:th.t1}}>
            <CheckCircle size={16} color={th.accent}/>
            Résilience calculée avec perte de {target.haLoss} nœud
          </div>
        </div>

        <div style={{display:"flex",justifyContent:isMobile?"flex-start":"flex-end"}}>
          <button onClick={()=>setShowFailureModal(true)} style={{
            display:"inline-flex",
            alignItems:"center",
            gap:8,
            padding:"12px 16px",
            borderRadius:12,
            border:`1px solid ${th.accent2}55`,
            background:`linear-gradient(135deg, ${th.accent2}18, ${th.accent}10)`,
            color:th.accent2,
            fontWeight:950,
            cursor:"pointer"
          }}>
            <Zap size={16}/>
            Simuler une panne
          </button>
        </div>

        
      </div>

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(5,1fr)",gap:14,marginBottom:18}}>
        <Kpi title="Nœuds cible" value={target.servers} sub={`${n1Servers} en N-1`} color={th.accent} icon={<Server size={28}/>}/>
        <Kpi title="Cœurs cible" value={fmt(targetCores)} sub={`+${cpuGain}% vs existant`} color={th.accent2} icon={<Cpu size={28}/>}/>
        <Kpi title="Fréquence CPU" value={`${target.ghz} GHz`} sub={`${fmt(Math.round(targetGhz))} GHz agrégés`} color="#3b82f6" icon={<Gauge size={28}/>}/>
        <Kpi title="RAM cible" value={`${fmt(target.ram)} Go`} sub={`+${ramGain}% vs existant`} color="#7c3aed" icon={<MemoryStick size={28}/>}/>
        <Kpi title="Capacité HA" value={`${target.haLoss} perdu`} sub={`${n1Servers} nœuds actifs`} color={globalOk?th.accent:th.warn} icon={<Shield size={28}/>}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"2fr 1fr",gap:18}}>
        <Card>
          <div style={{fontSize:16,fontWeight:950,color:th.t1,marginBottom:16}}>Comparaison des solutions</div>

          <div style={{display:"grid",gridTemplateColumns:"160px repeat(3,1fr)",border:`1px solid ${th.border}`,borderRadius:12,overflow:"hidden"}}>
            {["","Existant","Cible N+1","Cible N-1"].map(h=>(
              <div key={h} style={{padding:14,background:th.bg2,fontWeight:900,color:th.t1}}>{h}</div>
            ))}
            {[
              ["Nœuds", existing.servers, target.servers, n1Servers],
              ["Cœurs CPU", existingCores, targetCores, n1Cores],
                            ["RAM totale", existing.ram+" Go", target.ram+" Go", n1Ram+" Go"],
            ].flatMap(row=>row.map((c,i)=>(
              <div key={row[0]+i} style={{
                padding:14,
                borderTop:`1px solid ${th.border}`,
                color:i===0?th.t2:i===2?th.accent2:i===3?th.accent:th.t1,
                fontWeight:i===0?800:900
              }}>{c}</div>
            )))}
          </div>
        </Card>

        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:16}}>
            <div>
              <div style={{fontSize:16,fontWeight:950,color:th.t1}}>Comparaison & gains</div>
              <div style={{fontSize:12,color:th.t2,marginTop:3}}>Existant vs cible vs capacité en N-1</div>
            </div>

            <select value={chartView} onChange={e=>setChartView(e.target.value)} style={{
              padding:"9px 10px",
              borderRadius:9,
              border:`1px solid ${th.border}`,
              background:th.bg1,
              color:th.t1,
              fontSize:12,
              fontWeight:800
            }}>
              <option value="all">Tous</option>
              <option value="cores">Cœurs CPU</option>
              <option value="ghz">GHz agrégés</option>
              <option value="ram">RAM totale</option>
              <option value="nodes">Nœuds</option>
            </select>
          </div>

          <div style={{
            display:"grid",
            gridTemplateColumns:chartView==="all" ? "1fr 1fr" : "1fr",
            gap:12
          }}>
            {chartItems.map(([label,oldv,newv,n1v,unit])=>(
              <VerticalChart key={label} label={label} oldv={oldv} newv={newv} n1v={n1v} unit={unit}/>
            ))}
          </div>
        </Card>
      </div>

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:18,marginTop:18}}>
        <Card>
          <div style={{fontSize:16,fontWeight:950,color:th.t1,marginBottom:12}}>Projection à 12 mois</div>
          <div style={{fontSize:13,color:th.t2,lineHeight:1.6}}>
            Croissance projetée : <strong>+{target.growth}%</strong><br/>
            CPU N-1 : <strong style={{color:cpuOkN1?th.accent:th.warn}}>{cpuOkN1?"OK":"Attention"}</strong><br/>
            RAM N-1 : <strong style={{color:ramOkN1?th.accent:th.warn}}>{ramOkN1?"OK":"Attention"}</strong>
          </div>
        </Card>

        <Card>
          <div style={{fontSize:16,fontWeight:950,color:th.t1,marginBottom:12}}>Recommandations</div>
          <div style={{fontSize:13,color:th.t2,lineHeight:1.6}}>
            {globalOk
              ? "Infrastructure correctement dimensionnée avec marge de croissance et résilience."
              : "Surveiller la RAM/CPU en N-1 ou augmenter la capacité cible."}
          </div>
        </Card>

        <Card>
          <div style={{fontSize:16,fontWeight:950,color:th.t1,marginBottom:12}}>Synthèse avant-vente</div>
          <div style={{fontSize:13,color:th.t2,lineHeight:1.6}}>
            La cible apporte +{cpuGain}% de cœurs CPU et +{ramGain}% de mémoire par rapport à l’existant.
          </div>
        </Card>
      </div>

      {showFailureModal && (
        <FailureSimulationModal
          th={th}
          isMobile={isMobile}
          existing={existing}
          target={target}
          existingCores={existingCores}
          targetCores={targetCores}
          n1Cores={n1Cores}
          n1Servers={n1Servers}
          n1Ram={n1Ram}
          targetRatio={targetRatio}
          setTargetRatio={setTargetRatio}
          onClose={()=>setShowFailureModal(false)}
        />
      )}
    </div>
  );
}

function FailureSimulationModal({
  th,
  isMobile,
  existing,
  target,
  existingCores,
  targetCores,
  n1Cores,
  n1Servers,
  n1Ram,
  targetRatio,
  setTargetRatio,
  onClose
}) {
  const vcpus = existing.vcpus || 0;
  const [failedHosts, setFailedHosts] = useState(Math.min(Math.max(target.haLoss || 1, 1), Math.max(target.servers - 1, 1)));

  const scenario = useMemo(() => {
    const activeServers = Math.max(target.servers - failedHosts, 1);
    const ratio = target.servers ? activeServers / target.servers : 0;
    return {
      activeServers,
      cores: Math.round(targetCores * ratio),
      ram: Math.round(target.ram * ratio),
    };
  }, [target.servers, target.ram, targetCores, failedHosts]);

  const beforeRatio = existingCores ? vcpus / existingCores : 0;
  const afterRatio = scenario.cores ? vcpus / scenario.cores : 0;

  const beforeRamPct = target.ram ? Math.round((existing.ram / target.ram) * 100) : 0;
  const afterRamPct = scenario.ram ? Math.round((existing.ram / scenario.ram) * 100) : 0;

  const beforeCpuPct = targetCores ? Math.round((existingCores / targetCores) * 100) : 0;
  const afterCpuPct = scenario.cores ? Math.round((existingCores / scenario.cores) * 100) : 0;

  const ratioRisk = afterRatio > targetRatio;
  const ramRisk = afterRamPct >= 85;
  const cpuRisk = afterCpuPct >= 85;

  const statusColor = (risk, warn) => risk ? "#dc2626" : warn ? "#d97706" : th.accent;

  const barValue = (value) => {
    const parsed = Number(String(value).replace(",", ".").replace("%", ""));
    return Number.isFinite(parsed) ? Math.min(parsed, 100) : 0;
  };

  const Bar = ({value, color}) => (
    <div style={{height:9, borderRadius:999, background:th.bg2, overflow:"hidden", marginTop:8}}>
      <div style={{
        width:`${barValue(value)}%`,
        height:"100%",
        background:color,
        borderRadius:999
      }}/>
    </div>
  );

  const ResultCard = ({title, before, after, beforeSub, afterSub, status, color, icon}) => (
    <div style={{
      background:th.cardBg,
      border:`1px solid ${th.border}`,
      borderRadius:16,
      padding:16
    }}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        {icon}
        <div style={{fontSize:15,fontWeight:950,color:th.t1}}>{title}</div>
      </div>

      <div style={{
        display:"grid",
        gridTemplateColumns:isMobile ? "1fr" : "1fr 1fr auto",
        gap:14,
        alignItems:"center"
      }}>
        <div>
          <div style={{fontSize:11,color:th.t3,fontWeight:800}}>Avant panne</div>
          <div style={{fontSize:24,fontWeight:950,color:th.accent2}}>{before}</div>
          <div style={{fontSize:11,color:th.t2}}>{beforeSub}</div>
          <Bar value={before} color={th.accent2}/>
        </div>

        <div>
          <div style={{fontSize:11,color:th.t3,fontWeight:800}}>Après panne N-1</div>
          <div style={{fontSize:24,fontWeight:950,color}}>{after}</div>
          <div style={{fontSize:11,color:th.t2}}>{afterSub}</div>
          <Bar value={after} color={color}/>
        </div>

        <div style={{
          padding:"8px 10px",
          borderRadius:999,
          background:`${color}12`,
          border:`1px solid ${color}35`,
          color,
          fontSize:12,
          fontWeight:950,
          whiteSpace:"nowrap"
        }}>
          {status}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      position:"fixed",
      inset:0,
      background:"rgba(15,23,42,0.55)",
      zIndex:9999,
      display:"flex",
      alignItems:"center",
      justifyContent:"center",
      padding:20
    }}>
      <div style={{
        width:"min(1180px, 96vw)",
        maxHeight:"92vh",
        overflow:"auto",
        background:th.bg1,
        border:`1px solid ${th.border}`,
        borderRadius:22,
        boxShadow:"0 30px 80px rgba(0,0,0,0.28)"
      }}>
        <div style={{
          padding:22,
          borderBottom:`1px solid ${th.border}`,
          display:"flex",
          justifyContent:"space-between",
          alignItems:"flex-start",
          gap:18
        }}>
          <div style={{display:"flex",gap:14,alignItems:"center"}}>
            <div style={{
              width:52,
              height:52,
              borderRadius:16,
              background:`${th.accent2}15`,
              border:`1px solid ${th.accent2}30`,
              display:"flex",
              alignItems:"center",
              justifyContent:"center"
            }}>
              <Zap size={26} color={th.accent2}/>
            </div>
            <div>
              <div style={{fontSize:24,fontWeight:950,color:th.t1}}>Simulation de panne</div>
              <div style={{fontSize:13,color:th.t2,marginTop:4}}>
                Vérifier CPU, mémoire et ratio vCPU/pCore après perte d’un hôte
              </div>
            </div>
          </div>

          <button onClick={onClose} style={{
            border:"none",
            background:"transparent",
            cursor:"pointer",
            color:th.t2
          }}>
            <X size={24}/>
          </button>
        </div>

        <div style={{padding:22}}>
          <div style={{
            display:"grid",
            gridTemplateColumns:isMobile?"1fr":"1fr auto",
            gap:12,
            alignItems:"center",
            marginBottom:18
          }}>
            <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{fontSize:13,fontWeight:900,color:th.t1}}>Scénario</span>
              <select value={failedHosts} onChange={e=>setFailedHosts(Number(e.target.value))} style={{
                padding:"10px 12px",
                borderRadius:10,
                border:`1px solid ${th.border}`,
                background:th.cardBg,
                color:th.t1,
                fontWeight:800,
                cursor:"pointer"
              }}>
                {Array.from({length: Math.max(target.servers - 1, 1)}, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>
                    Perte de {n} {n > 1 ? "hosts" : "host"}
                  </option>
                ))}
              </select>

              <span style={{fontSize:13,fontWeight:900,color:th.t1}}>Ratio cible</span>
              <select value={targetRatio} onChange={e=>setTargetRatio(Number(e.target.value))} style={{
                padding:"10px 12px",
                borderRadius:10,
                border:`1px solid ${th.border}`,
                background:th.cardBg,
                color:th.t1,
                fontWeight:800
              }}>
                <option value={3}>3:1</option>
                <option value={4}>4:1</option>
                <option value={6}>6:1</option>
              </select>
            </div>

            <button style={{
              display:"inline-flex",
              alignItems:"center",
              gap:8,
              padding:"10px 13px",
              borderRadius:10,
              border:`1px solid ${th.accent2}55`,
              background:th.cardBg,
              color:th.accent2,
              fontWeight:950,
              cursor:"pointer"
            }}>
              <RefreshCw size={15}/>
              Relancer
            </button>
          </div>

          <div style={{
            display:"grid",
            gridTemplateColumns:isMobile?"1fr":"1fr 70px 1fr",
            gap:16,
            alignItems:"center",
            marginBottom:18
          }}>
            <div style={{
              background:th.cardBg,
              border:`1px solid ${th.border}`,
              borderRadius:16,
              padding:18
            }}>
              <div style={{fontSize:16,fontWeight:950,color:th.t1,marginBottom:14}}>Avant panne</div>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:12}}>
                <MiniMetric th={th} label="Hosts actifs" value={target.servers} sub={`sur ${target.servers}`}/>
                <MiniMetric th={th} label="Cœurs physiques" value={targetCores} sub="cœurs"/>
                <MiniMetric th={th} label="RAM utile" value={`${target.ram} Go`} sub="cible"/>
                <MiniMetric th={th} label="vCPU" value={vcpus} sub="à absorber"/>
              </div>
            </div>

            {!isMobile && (
              <div style={{fontSize:42,fontWeight:950,color:th.t1,textAlign:"center"}}>→</div>
            )}

            <div style={{
              background:th.cardBg,
              border:`1px solid ${ratioRisk || ramRisk || cpuRisk ? "#fca5a5" : th.border}`,
              borderRadius:16,
              padding:18
            }}>
              <div style={{fontSize:16,fontWeight:950,color:th.t1,marginBottom:14}}>Après panne N-1</div>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:12}}>
                <MiniMetric th={th} label="Hosts actifs" value={scenario.activeServers} sub={`sur ${target.servers}`}/>
                <MiniMetric th={th} label="Cœurs physiques" value={scenario.cores} sub="cœurs"/>
                <MiniMetric th={th} label="RAM utile" value={`${scenario.ram} Go`} sub={`après perte de ${failedHosts}`}/>
                <MiniMetric th={th} label="vCPU" value={vcpus} sub="à absorber"/>
              </div>
            </div>
          </div>

          <div style={{
            display:"grid",
            gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",
            gap:14,
            marginBottom:18
          }}>
            <ResultCard
              title="CPU physique"
              before={`${beforeCpuPct}%`}
              after={`${afterCpuPct}%`}
              beforeSub={`${existingCores} / ${targetCores} cœurs`}
              afterSub={`${existingCores} / ${scenario.cores} cœurs`}
              status={cpuRisk ? "Risque" : afterCpuPct >= 70 ? "Attention" : "OK"}
              color={statusColor(cpuRisk, afterCpuPct >= 70)}
              icon={<Cpu size={20} color={th.accent2}/>}
            />

            <ResultCard
              title="Mémoire"
              before={`${beforeRamPct}%`}
              after={`${afterRamPct}%`}
              beforeSub={`${existing.ram} / ${target.ram} Go`}
              afterSub={`${existing.ram} / ${scenario.ram} Go`}
              status={ramRisk ? "Risque" : afterRamPct >= 75 ? "Attention" : "OK"}
              color={statusColor(ramRisk, afterRamPct >= 75)}
              icon={<MemoryStick size={20} color="#7c3aed"/>}
            />

            <ResultCard
              title="Ratio vCPU / pCore"
              before={`${beforeRatio.toFixed(1)}:1`}
              after={`${afterRatio.toFixed(1)}:1`}
              beforeSub={`${vcpus} vCPU / ${existingCores} cœurs existants`}
              afterSub={`${vcpus} vCPU / ${scenario.cores} cœurs restants`}
              status={ratioRisk ? "Risque" : afterRatio > targetRatio * 0.85 ? "Attention" : "OK"}
              color={statusColor(ratioRisk, afterRatio > targetRatio * 0.85)}
              icon={<Gauge size={20} color={ratioRisk ? "#dc2626" : th.accent2}/>}
            />
          </div>

          <div style={{
            display:"grid",
            gridTemplateColumns:isMobile?"1fr":"1fr 1fr",
            gap:14
          }}>
            <div style={{
              background:th.cardBg,
              border:`1px solid ${th.border}`,
              borderRadius:16,
              padding:18
            }}>
              <div style={{fontSize:16,fontWeight:950,color:th.t1,marginBottom:12}}>Top VM impactantes</div>
              <div style={{fontSize:13,color:th.t2,lineHeight:1.7}}>
                À connecter ensuite avec RVTools : top VM par vCPU, RAM et criticité.
              </div>
            </div>

            <div style={{
              background:"#fffbeb",
              border:"1px solid #fcd34d",
              borderRadius:16,
              padding:18
            }}>
              <div style={{fontSize:16,fontWeight:950,color:"#92400e",marginBottom:10}}>
                Lecture avant-vente
              </div>
              <div style={{fontSize:13,color:"#78350f",lineHeight:1.65}}>
                {ratioRisk || ramRisk || cpuRisk
                  ? `Le scénario N-1 nécessite une attention particulière. Après perte de ${failedHosts} ${failedHosts > 1 ? "hôtes" : "hôte"}, le ratio vCPU/pCore passe à ${afterRatio.toFixed(1)}:1 pour une cible de ${targetRatio}:1, avec une mémoire utilisée estimée à ${afterRamPct}%.`
                  : `Le cluster semble capable d’absorber la perte de ${failedHosts} ${failedHosts > 1 ? "hôtes" : "hôte"} sans saturation immédiate. La marge CPU, mémoire et le ratio vCPU/pCore restent cohérents avec la cible.`}
              </div>
            </div>
          </div>

          <div style={{
            display:"flex",
            justifyContent:"space-between",
            gap:12,
            marginTop:20,
            borderTop:`1px solid ${th.border}`,
            paddingTop:18
          }}>
            <button style={{
              padding:"11px 14px",
              borderRadius:10,
              border:`1px solid ${th.border}`,
              background:th.cardBg,
              color:th.t1,
              fontWeight:900,
              cursor:"pointer"
            }}>
              Exporter le rapport
            </button>

            <div style={{display:"flex",gap:10}}>
              <button onClick={onClose} style={{
                padding:"11px 14px",
                borderRadius:10,
                border:`1px solid ${th.border}`,
                background:th.cardBg,
                color:th.t1,
                fontWeight:900,
                cursor:"pointer"
              }}>
                Fermer
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniMetric({th, label, value, sub}) {
  return (
    <div style={{textAlign:"center"}}>
      <div style={{fontSize:11,color:th.t3,fontWeight:800}}>{label}</div>
      <div style={{fontSize:22,fontWeight:950,color:th.t1,marginTop:4}}>{value}</div>
      <div style={{fontSize:11,color:th.t2,marginTop:2}}>{sub}</div>
    </div>
  );
}
