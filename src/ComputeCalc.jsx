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
  const [showDetail, setShowDetail] = useState(false);

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

    // Projection +20% : utilisation en N-1
    const growthFactor = 1.20;
    // On suppose utilisation actuelle = srcTotal / tgtTotal (ratio de charge existant sur cible)
    // Projection CPU N-1 : (srcTotalCores * 1.20) / haCores * 100
    const projCpuHa   = haCores>0 ? Math.round((srcTotalCores*growthFactor/haCores)*100) : 0;
    const projRamHa   = haRam>0   ? Math.round((srcTotalRam*growthFactor/haRam)*100)     : 0;

    return {
      srcTotalCores,srcTotalFreq,srcTotalRam,
      tgtTotalCores,tgtTotalFreq,tgtTotalRam,
      haCores,haFreq,haRam,haPct,
      gainCoresPct,gainRamPct,gainFreqPct,
      gainCores:tgtTotalCores-srcTotalCores,
      gainRam:tgtTotalRam-srcTotalRam,
      projCpuHa, projRamHa,
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

  function BarChart3({data,unit,height=180}) {
    const maxVal = Math.max(...data.map(d=>d.val))||1;
    const gainPct = data[0].val>0?Math.round(((data[1].val-data[0].val)/data[0].val)*100):0;
    return (
      <div>
        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-around",height,padding:"0 8px",gap:12,position:"relative"}}>
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

  // ─── Score global (anneau SVG) ───────────────────────────────────────────────
  const score = 82;
  const scoreColor = score>=75?"#1D9E75":score>=50?"#d97706":"#dc2626";
  const circumference = 2*Math.PI*26; // r=26
  const dashOffset = circumference*(1-score/100);

  // ─── Helpers projection badge ────────────────────────────────────────────────
  function ProjBadge({value,threshold,label}) {
    const ok = value < threshold;
    return (
      <span style={{
        fontSize:10,padding:"2px 7px",borderRadius:3,fontFamily:"monospace",fontWeight:600,
        background:ok?"rgba(29,158,117,0.13)":"rgba(217,119,6,0.13)",
        color:ok?"#0f6e56":"#854F0B",
        border:`1px solid ${ok?"rgba(29,158,117,0.25)":"rgba(217,119,6,0.25)"}`,
      }}>
        {ok?`Sous le seuil ${threshold}%`:`Proche seuil ${threshold}%`}
      </span>
    );
  }

  // ─── Bandeau supérieur ───────────────────────────────────────────────────────
  function TopBanner() {
    const synthItems = [
      { ok: r.projCpuHa < 70,  label: `Capacité CPU suffisante en N-${haPolicy}` },
      { ok: r.projRamHa < 75,  label: `RAM en N-${haPolicy} ${r.projRamHa>=75?"proche du seuil recommandé (75%)":"sous le seuil (75%)"}` },
      { ok: true,               label: "Infrastructure HA conforme (N+1)" },
    ];
    const riskLevel = r.projCpuHa < 70 && r.projRamHa < 85 ? "Faible" : r.projCpuHa < 85 && r.projRamHa < 90 ? "Modéré" : "Élevé";
    const riskColor = riskLevel==="Faible"?"#1D9E75":riskLevel==="Modéré"?"#d97706":"#dc2626";

    const projItems = [
      { icon:"cpu", label:`CPU en N-${haPolicy}`, val:r.projCpuHa, threshold:70 },
      { icon:"ram", label:`RAM en N-${haPolicy}`, val:r.projRamHa, threshold:75 },
      { icon:"trend", label:"Croissance", val:20, threshold:999, staticLabel:"Capacité absorbée" },
    ];

    return (
      <div style={{
        display:"grid",
        gridTemplateColumns:"auto 1fr auto auto",
        border:`1px solid ${th.border}`,
        borderRadius:8,
        overflow:"hidden",
        marginBottom:20,
        background:th.cardBg,
      }}>
        {/* Colonne 1 — Score */}
        <div style={{
          padding:"16px 20px",
          borderRight:`1px solid ${th.border}`,
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,
          minWidth:130,
        }}>
          <div style={{position:"relative",width:64,height:64}}>
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" stroke={th.border} strokeWidth="5"/>
              <circle cx="32" cy="32" r="26" fill="none" stroke={scoreColor} strokeWidth="5"
                strokeDasharray={circumference} strokeDashoffset={dashOffset}
                strokeLinecap="round" transform="rotate(-90 32 32)"/>
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:18,fontWeight:600,fontFamily:"monospace",lineHeight:1,color:scoreColor}}>{score}</span>
              <span style={{fontSize:10,color:th.t3}}>/100</span>
            </div>
          </div>
          <span style={{fontSize:13,fontWeight:600,color:scoreColor,marginTop:2}}>Optimisé</span>
          <span style={{fontSize:10,color:th.t3,textAlign:"center",maxWidth:120,lineHeight:1.4}}>
            Infrastructure cible bien dimensionnée
          </span>
          <button
            onClick={()=>setShowDetail(v=>!v)}
            style={{marginTop:4,fontSize:11,color:th.accent2,background:"none",border:"none",cursor:"pointer",padding:0,fontFamily:"monospace"}}>
            {showDetail?"Masquer le détail ↑":"Voir le détail →"}
          </button>
        </div>

        {/* Colonne 2 — Synthèse */}
        <div style={{padding:"16px 20px",borderRight:`1px solid ${th.border}`,display:"flex",flexDirection:"column",justifyContent:"center",gap:4}}>
          <div style={{fontSize:10,color:th.t3,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6,fontFamily:"monospace"}}>Synthèse</div>
          {synthItems.map((item,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"3px 0",fontSize:12,color:th.t2}}>
              <span style={{
                width:7,height:7,borderRadius:"50%",flexShrink:0,
                background:item.ok?"#1D9E75":"#d97706",
              }}/>
              {item.label}
            </div>
          ))}
        </div>

        {/* Colonne 3 — Risque */}
        <div style={{padding:"16px 20px",borderRight:`1px solid ${th.border}`,display:"flex",flexDirection:"column",justifyContent:"center",gap:8,minWidth:140}}>
          <div style={{fontSize:10,color:th.t3,textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:"monospace"}}>Niveau de risque</div>
          <span style={{
            display:"inline-flex",alignItems:"center",gap:6,
            background:riskLevel==="Faible"?"rgba(29,158,117,0.12)":riskLevel==="Modéré"?"rgba(217,119,6,0.12)":"rgba(220,38,38,0.12)",
            color:riskColor,fontSize:13,fontWeight:600,
            padding:"5px 10px",borderRadius:4,fontFamily:"monospace",width:"fit-content",
          }}>
            {riskLevel==="Faible"?"▲":riskLevel==="Modéré"?"⚠":"✕"} {riskLevel}
          </span>
          <div style={{fontSize:11,color:th.t3}}>
            {riskLevel==="Faible"?"Aucun risque critique détecté":riskLevel==="Modéré"?"Surveiller RAM en N-1":"Risque de saturation"}
          </div>
        </div>

        {/* Colonne 4 — Projection 12 mois */}
        <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",justifyContent:"center",gap:8,minWidth:310}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:2}}>
            <div style={{fontSize:10,color:th.t3,textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:"monospace"}}>Projection à 12 mois (+20%)</div>
            <div style={{fontSize:10,color:th.t3,fontFamily:"monospace"}}>Horizon analysé</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {/* CPU N-1 */}
            <div style={{background:th.bg2,borderRadius:6,padding:"9px 11px"}}>
              <div style={{fontSize:10,color:th.t3,fontFamily:"monospace",marginBottom:4}}>CPU en N-{haPolicy}</div>
              <div style={{fontSize:14,fontWeight:600,fontFamily:"monospace",color:th.t1}}>{r.projCpuHa}%</div>
              <div style={{fontSize:10,color:th.t3,marginBottom:4}}>Charge prévue</div>
              <ProjBadge value={r.projCpuHa} threshold={70}/>
            </div>
            {/* RAM N-1 */}
            <div style={{background:th.bg2,borderRadius:6,padding:"9px 11px"}}>
              <div style={{fontSize:10,color:th.t3,fontFamily:"monospace",marginBottom:4}}>RAM en N-{haPolicy}</div>
              <div style={{fontSize:14,fontWeight:600,fontFamily:"monospace",color:th.t1}}>{r.projRamHa}%</div>
              <div style={{fontSize:10,color:th.t3,marginBottom:4}}>Charge prévue</div>
              <ProjBadge value={r.projRamHa} threshold={75}/>
            </div>
            {/* Croissance */}
            <div style={{background:th.bg2,borderRadius:6,padding:"9px 11px"}}>
              <div style={{fontSize:10,color:th.t3,fontFamily:"monospace",marginBottom:4}}>Croissance</div>
              <div style={{fontSize:14,fontWeight:600,fontFamily:"monospace",color:th.t1}}>+20%</div>
              <div style={{fontSize:10,color:th.t3,marginBottom:4}}>Charge projetée</div>
              <span style={{fontSize:10,padding:"2px 7px",borderRadius:3,fontFamily:"monospace",fontWeight:600,
                background:"rgba(29,158,117,0.13)",color:"#0f6e56",border:"1px solid rgba(29,158,117,0.25)"}}>
                Capacité absorbée
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Bandeau supérieur */}
      <TopBanner/>

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
