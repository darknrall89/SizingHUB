import { useState, useMemo } from "react";

const fmt = (v, dec=0) => v==null?"—":Number(v).toLocaleString("fr-FR",{maximumFractionDigits:dec});

export default function ComputeCalc({ th, isMobile=false }) {
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
