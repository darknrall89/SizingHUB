import { useState } from "react";
import { Upload, CheckCircle, FileSpreadsheet, Sparkles, BarChart3, ShieldCheck } from "lucide-react";

export default function AuditCalc({ th }) {
  const [file, setFile] = useState(null);

  return (
    <div>
      <div style={{
        background:th.cardBg,
        border:`1px solid ${th.border}`,
        borderRadius:18,
        padding:28,
        boxShadow:"0 14px 34px rgba(15,23,42,0.08)"
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
          gridTemplateColumns:"repeat(3,1fr)",
          gap:12,
          marginBottom:22
        }}>
          {[
            [FileSpreadsheet, "RVTools", "Inventaire VMware .xlsx"],
            [BarChart3, "Analyse capacité", "CPU, RAM, stockage"],
            [Sparkles, "Recommandations", "Synthèse exploitable AV"]
          ].map(([Icon,title,sub])=>(
            <div key={title} style={{
              padding:"14px 16px",
              borderRadius:14,
              background:th.bg1,
              border:`1px solid ${th.border}`,
              display:"flex",
              gap:12,
              alignItems:"center"
            }}>
              <Icon size={22} color={th.accent}/>
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
          <Upload size={44} color={th.accent}/>
          <div style={{fontSize:18,fontWeight:950,color:th.t1,marginTop:14}}>
            Glissez votre export RVTools ou cliquez pour sélectionner
          </div>
          <div style={{fontSize:13,color:th.t2,marginTop:7}}>
            Fichiers supportés : .xlsx · restitution KPI · risques · recommandations
          </div>

          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={e=>setFile(e.target.files?.[0] || null)}
            style={{display:"none"}}
          />
        </label>

        {file && (
          <div style={{
            marginTop:18,
            padding:"14px 16px",
            borderRadius:14,
            background:"rgba(0,212,170,0.08)",
            border:"1px solid rgba(0,212,170,0.22)",
            display:"flex",
            alignItems:"center",
            gap:10,
            color:th.accent,
            fontWeight:900
          }}>
            <CheckCircle size={18}/>
            Fichier prêt à analyser : {file.name}
          </div>
        )}
      </div>

      <div style={{
        marginTop:18,
        display:"grid",
        gridTemplateColumns:"repeat(3,1fr)",
        gap:14
      }}>
        {[
          ["Score d’audit", "—", "Disponible après import"],
          ["Risques détectés", "—", "CPU, RAM, snapshots, datastore"],
          ["Plan d’action", "—", "Recommandations priorisées"]
        ].map(([title,value,sub])=>(
          <div key={title} style={{
            background:th.cardBg,
            border:`1px solid ${th.border}`,
            borderRadius:16,
            padding:"18px 20px",
            boxShadow:"0 10px 26px rgba(15,23,42,0.05)"
          }}>
            <div style={{fontSize:11,fontWeight:900,color:th.t3,textTransform:"uppercase",letterSpacing:"0.08em"}}>
              {title}
            </div>
            <div style={{fontSize:30,fontWeight:950,color:th.t1,marginTop:8}}>{value}</div>
            <div style={{fontSize:12,color:th.t2,marginTop:6}}>{sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
