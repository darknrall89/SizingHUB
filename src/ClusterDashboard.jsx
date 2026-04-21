import { useState } from "react";
import {
  Server, Cpu, HardDrive, AlertTriangle,
  CheckCircle, AlertCircle, Info, TrendingDown,
  Activity, Database, Network, Settings, MemoryStick, Zap
} from "lucide-react";

const getUsageTone = (pct) => {
  if (pct >= 80) return { color:"text-red-500",    bg:"bg-red-500",    label:"Critique" };
  if (pct >= 60) return { color:"text-amber-500",  bg:"bg-amber-500",  label:"Attention" };
  return              { color:"text-emerald-500", bg:"bg-emerald-500", label:"Sain" };
};
const getSeverityClasses = (s) => {
  if (s==="critical") return { icon:"text-red-500",   bg:"bg-red-50",   border:"border-red-200"   };
  if (s==="warning")  return { icon:"text-amber-500", bg:"bg-amber-50", border:"border-amber-200" };
  return                     { icon:"text-blue-500",  bg:"bg-blue-50",  border:"border-blue-200"  };
};
const formatRam = (gb) => {
  if (gb===undefined||gb===null) return "N/A";
  if (gb>=1024) return (gb/1024).toFixed(1)+" TB";
  return gb+" GB";
};
const formatStorage = (tb) => {
  if (tb===undefined||tb===null) return "N/A";
  if (tb<1) return (tb*1024).toFixed(0)+" GB";
  return parseFloat(tb).toFixed(1)+" TB";
};
const fmt = (v,f="—") => (v!==undefined&&v!==null?v:f);

const UsageBar = ({ pct=0, color }) => (
  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
    <div className={"h-full rounded-full transition-all duration-500 "+(color||getUsageTone(pct).bg)} style={{width:Math.min(pct,100)+"%"}}/>
  </div>
);

const KpiCard = ({ label, value, sub, icon:Icon, gradient }) => (
  <div className={"rounded-2xl p-5 text-white flex flex-col gap-2 "+gradient}>
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold uppercase tracking-widest opacity-70">{label}</span>
      {Icon&&<Icon size={20} className="opacity-50"/>}
    </div>
    <div className="text-3xl font-bold tracking-tight">{fmt(value)}</div>
    {sub&&<div className="text-xs opacity-60">{sub}</div>}
  </div>
);

const OverviewStatRow = ({ label, value, sub, highlight }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-500">{label}</span>
    <div className="text-right">
      <span className={"text-sm font-semibold "+(highlight?"text-blue-600":"text-gray-800")}>{fmt(value)}</span>
      {sub&&<div className="text-xs text-gray-400">{sub}</div>}
    </div>
  </div>
);

const RatioCard = ({ label, value, icon:Icon, color }) => (
  <div className={"rounded-xl p-3 flex items-center gap-3 "+(color==="blue"?"bg-blue-50":"bg-orange-50")}>
    {Icon&&<Icon size={16} className={color==="blue"?"text-blue-500":"text-orange-500"}/>}
    <div>
      <div className={"text-lg font-bold "+(color==="blue"?"text-blue-700":"text-orange-700")}>{fmt(value)}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  </div>
);

const HostCard = ({ host }) => {
  const cpuTone = getUsageTone(host.cpuUsagePercent||0);
  const ramTone = getUsageTone(host.ramUsagePercent||0);
  const hasWarning = (host.cpuUsagePercent||0)>=80||(host.ramUsagePercent||0)>=80;
  return (
    <div className={"rounded-xl border p-4 "+(hasWarning?"border-red-200 bg-red-50/30":"border-gray-100 bg-white")}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Server size={14} className="text-blue-600"/>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-800">{host.name||host.id}</div>
            {host.totalCpuCores&&<div className="text-xs text-gray-400">{host.totalCpuCores} cores · {formatRam(host.totalRamGb)}</div>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {hasWarning&&<AlertTriangle size={14} className="text-red-500"/>}
          <span className={"text-sm font-bold "+(hasWarning?"text-red-500":"text-gray-700")}>
            {Math.max(host.cpuUsagePercent||0,host.ramUsagePercent||0)}%
          </span>
        </div>
      </div>
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-blue-600">CPU</span>
            <span className={cpuTone.color+" font-semibold"}>{host.cpuUsagePercent||0}%</span>
          </div>
          <UsageBar pct={host.cpuUsagePercent||0} color="bg-blue-500"/>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-orange-500">RAM</span>
            <span className={ramTone.color+" font-semibold"}>{host.ramUsagePercent||0}%</span>
          </div>
          <UsageBar pct={host.ramUsagePercent||0} color="bg-orange-400"/>
        </div>
      </div>
      {host.warning&&<div className="mt-2 text-xs text-red-600 font-medium">{host.warning}</div>}
    </div>
  );
};

const InsightBar = ({ clusterSummary={}, insights=[] }) => {
  const criticals = insights.filter(i=>i.severity==="critical");
  return (
    <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm">
      {criticals.length>0&&(
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle size={14}/>
          <span className="text-xs font-semibold">{criticals[0].title}</span>
        </div>
      )}
      {(clusterSummary.poweredOffVms||0)>0&&(
        <div className="flex items-center gap-2 text-amber-600 border-l border-gray-200 pl-3">
          <Info size={14}/>
          <span className="text-xs">{clusterSummary.poweredOffVms} VMs candidates a suppression (&gt;20j OFF)</span>
        </div>
      )}
      <div className="ml-auto flex items-center gap-3">
        {[["CPU","blue"],["RAM","orange"],["Storage","green"]].map(([label,c])=>(
          <div key={label} className="flex items-center gap-1">
            <CheckCircle size={13} className="text-emerald-500"/>
            <span className="text-xs font-semibold text-emerald-600">{label}</span>
            <span className="text-xs text-gray-400">OK</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const OptimizationItem = ({ insight }) => {
  const s = getSeverityClasses(insight.severity);
  const Icon = insight.severity==="critical"?AlertTriangle:insight.severity==="warning"?AlertCircle:Info;
  return (
    <div className={"flex items-start gap-3 rounded-xl border p-3 "+s.bg+" "+s.border}>
      <Icon size={15} className={"mt-0.5 flex-shrink-0 "+s.icon}/>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-800">{insight.title}</div>
        {insight.description&&<div className="text-xs text-gray-500 mt-0.5">{insight.description}</div>}
        {insight.recommendation&&<div className="text-xs text-gray-600 mt-1 font-medium">{"-> "}{insight.recommendation}</div>}
      </div>
      {insight.impact&&<div className="text-xs font-semibold text-gray-500 whitespace-nowrap">{insight.impact}</div>}
    </div>
  );
};

// ── Top Memory Consumers ─────────────────────────────────────────────────────
const getMemInsight = (pct, isOversized, wasteGb, avgPct) => {
  const diff = avgPct>0 ? Math.round(pct-avgPct) : 0;
  if (isOversized && wasteGb>4) return {label:"Surdimensionnee", sub:wasteGb+" Go non utilises", color:"text-blue-500", dot:"bg-blue-500"};
  if (pct>=90) return {label:"Tres eleve",  sub:"Au-dessus de la moyenne ("+(diff>0?"+":"")+diff+"%)", color:"text-red-600",    dot:"bg-red-500"};
  if (pct>=80) return {label:"Eleve",       sub:"Au-dessus de la moyenne ("+(diff>0?"+":"")+diff+"%)", color:"text-orange-500", dot:"bg-orange-400"};
  if (pct>=60) return {label:"Moyen",       sub:diff>0?"Au-dessus de la moyenne":"Sous la moyenne ("+(diff>0?"+":"")+diff+"%)", color:"text-amber-500", dot:"bg-amber-400"};
  return              {label:"Correct",     sub:"Utilisation correcte", color:"text-emerald-600", dot:"bg-emerald-500"};
};

const RankBadge = ({rank}) => {
  const colors = ["bg-yellow-400 text-yellow-900","bg-gray-300 text-gray-700","bg-orange-400 text-orange-900"];
  const cls = colors[rank-1]||"bg-gray-100 text-gray-500";
  return <div className={"w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 "+cls}>{rank}</div>;
};

const UsageCircle = ({pct}) => {
  const r=16, circ=2*Math.PI*r;
  const fill=Math.min(pct,100)/100*circ;
  const color=pct>=80?"#ef4444":pct>=60?"#f97316":"#10b981";
  return (
    <div className="relative w-12 h-12 flex-shrink-0">
      <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" stroke="#f1f5f9" strokeWidth="4"/>
        <circle cx="20" cy="20" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"/>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold" style={{color}}>{pct}%</span>
      </div>
    </div>
  );
};

const TopMemoryConsumersBlock = ({consumers=[], totalAllocatedRam=0}) => {
  if (consumers.length===0) return null;
  const avgPct = consumers.length>0?Math.round(consumers.reduce((s,v)=>s+(v.usagePercent||0),0)/consumers.length):0;
  const topRamSum = consumers.reduce((s,v)=>s+(v.allocatedRamGb||0),0);
  const topPct = totalAllocatedRam>0?Math.round(topRamSum/totalAllocatedRam*100):0;
  const oversized = consumers.filter(v=>v.isOversized).length;
  const criticalHosts = [...new Set(consumers.filter(v=>(v.usagePercent||0)>=80).map(v=>v.hostName))];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Bandeau contexte */}
      <div className="bg-violet-50 border-b border-violet-100 px-5 py-3 flex items-center gap-2">
        <span className="text-violet-500">✦</span>
        <span className="text-sm text-violet-700">
          Les <strong>{consumers.length} VMs</strong> ci-dessous représentent{" "}
          <strong>{topPct}%</strong> de la RAM allouée aux VMs{" "}
          <span className="text-violet-400">({topRamSum} GB / {totalAllocatedRam} GB)</span>
        </span>
      </div>

      {/* Header tableau */}
      <div className="grid grid-cols-12 gap-2 px-5 py-2 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
        <div className="col-span-1">Rang</div>
        <div className="col-span-3">VM / OS</div>
        <div className="col-span-2">Host</div>
        <div className="col-span-2">RAM allouee</div>
        <div className="col-span-2">RAM utilisee</div>
        <div className="col-span-1 text-center">%</div>
        <div className="col-span-1">Statut</div>
      </div>

      {/* Lignes */}
      <div className="divide-y divide-gray-50">
        {consumers.map((v,i)=>{
          const insight = getMemInsight(v.usagePercent||0, v.isOversized, v.wasteGb||0, avgPct);
          const isWin = (v.os||"").toLowerCase().includes("windows");
          const barColor = (v.usagePercent||0)>=80?"bg-red-400":(v.usagePercent||0)>=60?"bg-orange-400":"bg-emerald-400";
          return (
            <div key={v.id||i} className={"grid grid-cols-12 gap-2 px-5 py-3 items-center hover:bg-gray-50/60 transition-all "+((v.usagePercent||0)>=80?"bg-red-50/20":"")}>
              <div className="col-span-1"><RankBadge rank={i+1}/></div>
              <div className="col-span-3 flex items-center gap-2 min-w-0">
                <div className={"w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 "+(isWin?"bg-blue-100":"bg-gray-100")}>
                  <OsIcon os={v.os}/>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-gray-800 truncate">{v.name}</div>
                  <div className="text-xs text-gray-400 truncate">{v.os}</div>
                </div>
              </div>
              <div className="col-span-2 text-xs text-blue-500 font-medium truncate">{v.hostName}</div>
              <div className="col-span-2 text-sm font-semibold text-gray-700">{v.allocatedRamGb} GB</div>
              <div className="col-span-2">
                <div className="text-xs font-semibold text-gray-700 mb-1">{v.usedRamGb||"N/A"}{v.usedRamGb?" GB":""}</div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={"h-full rounded-full "+barColor} style={{width:Math.min(v.usagePercent||0,100)+"%"}}/>
                </div>
              </div>
              <div className="col-span-1 flex justify-center">
                <UsageCircle pct={v.usagePercent||0}/>
              </div>
              <div className="col-span-1 min-w-0">
                <div className={"text-xs font-bold "+insight.color}><span className={"inline-block w-2 h-2 rounded-full mr-1 "+insight.dot}/>  {insight.label}</div>
                <div className="text-xs text-gray-400 mt-0.5 truncate">{insight.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer insights */}
      <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <span className="text-yellow-500">💡</span>
        <strong className="text-gray-600">Insights RVTools</strong>
        <span className="flex items-center gap-1"><span className="text-violet-500">✦</span>{consumers.length} VMs utilisent {topPct}% de la RAM allouee</span>
        {oversized>0&&<span className="flex items-center gap-1"><span className="text-orange-400">○</span>{oversized} VM{oversized>1?"s":""} potentiellement surdimensionnee{oversized>1?"s":""}</span>}
        {criticalHosts.length>0&&<span className="flex items-center gap-1"><AlertTriangle size={11} className="text-red-400"/>{criticalHosts.length} host{criticalHosts.length>1?"s":""} en tension memoire ({criticalHosts.join(", ")})</span>}
      </div>
    </div>
  );
};

// ── Memory helpers ───────────────────────────────────────────────────────────
const MemoryNodeVisual = ({ health="healthy" }) => {
  const c = health==="critical"?"#f87171":health==="warning"?"#fbbf24":"#60a5fa";
  return (
    <svg viewBox="0 0 56 56" className="w-full h-full" fill="none">
      <rect x="4" y="8"  width="48" height="12" rx="3" fill={c} opacity="0.12"/>
      <rect x="4" y="8"  width="48" height="12" rx="3" stroke={c} strokeWidth="1.5"/>
      {[8,16,24,32,40].map(x=>(
        <rect key={x} x={x} y="11" width="5" height="6" rx="1" fill={c} opacity="0.35"/>
      ))}
      <rect x="4" y="24" width="48" height="12" rx="3" fill={c} opacity="0.08"/>
      <rect x="4" y="24" width="48" height="12" rx="3" stroke={c} strokeWidth="1.5" opacity="0.7"/>
      {[8,16,24,32].map(x=>(
        <rect key={x} x={x} y="27" width="5" height="6" rx="1" fill={c} opacity="0.2"/>
      ))}
      <rect x="4" y="40" width="48" height="8" rx="3" fill={c} opacity="0.05"/>
      <rect x="4" y="40" width="48" height="8" rx="3" stroke={c} strokeWidth="1.5" opacity="0.5"/>
      <rect x="8" y="43" width="20" height="2" rx="1" fill={c} opacity="0.15"/>
    </svg>
  );
};

// ── Compute helpers ──────────────────────────────────────────────────────────
const ServerNodeVisual = ({ health="healthy" }) => {
  const borderColor = health==="critical"?"#ef4444":health==="warning"?"#f59e0b":"#3b82f6";
  return (
    <svg viewBox="0 0 56 56" className="w-full h-full" fill="none">
      <rect x="4" y="6"  width="48" height="10" rx="3" fill={borderColor} opacity="0.15"/>
      <rect x="4" y="6"  width="48" height="10" rx="3" stroke={borderColor} strokeWidth="1.5"/>
      <rect x="8" y="9"  width="24" height="4" rx="1.5" fill={borderColor} opacity="0.3"/>
      <circle cx="46" cy="11" r="2" fill={borderColor}/>
      <circle cx="41" cy="11" r="1.5" fill={borderColor} opacity="0.5"/>
      <rect x="4" y="20" width="48" height="10" rx="3" fill={borderColor} opacity="0.1"/>
      <rect x="4" y="20" width="48" height="10" rx="3" stroke={borderColor} strokeWidth="1.5"/>
      <rect x="8" y="23" width="20" height="4" rx="1.5" fill={borderColor} opacity="0.25"/>
      <circle cx="46" cy="25" r="2" fill={borderColor} opacity="0.7"/>
      <circle cx="41" cy="25" r="1.5" fill={borderColor} opacity="0.4"/>
      <rect x="4" y="34" width="48" height="10" rx="3" fill={borderColor} opacity="0.07"/>
      <rect x="4" y="34" width="48" height="10" rx="3" stroke={borderColor} strokeWidth="1.5" opacity="0.7"/>
      <rect x="8" y="37" width="16" height="4" rx="1.5" fill={borderColor} opacity="0.2"/>
      <circle cx="46" cy="39" r="2" fill={borderColor} opacity="0.4"/>
    </svg>
  );
};

const OsIcon = ({ os }) => {
  const n = (os||"").toLowerCase();
  if (n.includes("windows")) return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
      <rect x="2" y="2" width="9" height="9" rx="1" fill="#0078d4"/>
      <rect x="13" y="2" width="9" height="9" rx="1" fill="#0078d4" opacity="0.8"/>
      <rect x="2" y="13" width="9" height="9" rx="1" fill="#0078d4" opacity="0.8"/>
      <rect x="13" y="13" width="9" height="9" rx="1" fill="#0078d4" opacity="0.6"/>
    </svg>
  );
  if (n.includes("ubuntu")) return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
      <circle cx="12" cy="12" r="10" fill="#E95420" opacity="0.15"/>
      <circle cx="12" cy="12" r="10" stroke="#E95420" strokeWidth="1.5"/>
      <circle cx="12" cy="4"  r="2.5" fill="#E95420"/>
      <circle cx="19.5" cy="16" r="2.5" fill="#E95420"/>
      <circle cx="4.5" cy="16" r="2.5" fill="#E95420"/>
      <path d="M12 6.5 Q17 10 17 14" stroke="#E95420" strokeWidth="1.2" fill="none"/>
      <path d="M12 6.5 Q7 10 7 14" stroke="#E95420" strokeWidth="1.2" fill="none"/>
      <path d="M7 14 Q9 18 17 14" stroke="#E95420" strokeWidth="1.2" fill="none"/>
    </svg>
  );
  if (n.includes("debian")) return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
      <circle cx="12" cy="12" r="10" fill="#A80030" opacity="0.12"/>
      <circle cx="12" cy="12" r="10" stroke="#A80030" strokeWidth="1.5"/>
      <path d="M8 8 Q16 6 16 12 Q16 18 8 16" stroke="#A80030" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="2" fill="#A80030" opacity="0.5"/>
    </svg>
  );
  if (n.includes("linux")||n.includes("centos")||n.includes("rocky")||n.includes("rhel")) return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
      <circle cx="12" cy="12" r="10" fill="#f97316" opacity="0.12"/>
      <circle cx="12" cy="12" r="10" stroke="#f97316" strokeWidth="1.5"/>
      <path d="M9 8 L9 16 M9 12 L15 12 M15 8 L15 16" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#64748b" opacity="0.12"/>
      <rect x="2" y="2" width="20" height="20" rx="4" stroke="#64748b" strokeWidth="1.5"/>
      <path d="M7 12 h10 M7 8 h10 M7 16 h6" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
};

// ── Network helpers ──────────────────────────────────────────────────────────
const NetworkNodeVisual = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full" fill="none">
    <rect x="4" y="10" width="48" height="10" rx="3" fill="#3b82f6" opacity="0.12"/>
    <rect x="4" y="10" width="48" height="10" rx="3" stroke="#3b82f6" strokeWidth="1.5"/>
    {[8,14,20,26,32,38].map(x=>(
      <rect key={x} x={x} y="13" width="4" height="4" rx="1" fill="#3b82f6" opacity="0.4"/>
    ))}
    <rect x="4" y="24" width="48" height="10" rx="3" fill="#3b82f6" opacity="0.08"/>
    <rect x="4" y="24" width="48" height="10" rx="3" stroke="#3b82f6" strokeWidth="1.5" opacity="0.7"/>
    {[8,14,20,26].map(x=>(
      <rect key={x} x={x} y="27" width="4" height="4" rx="1" fill="#3b82f6" opacity="0.25"/>
    ))}
    <line x1="12" y1="34" x2="12" y2="42" stroke="#3b82f6" strokeWidth="1.5" opacity="0.5"/>
    <line x1="28" y1="34" x2="28" y2="42" stroke="#3b82f6" strokeWidth="1.5" opacity="0.5"/>
    <line x1="44" y1="34" x2="44" y2="42" stroke="#3b82f6" strokeWidth="1.5" opacity="0.5"/>
    <rect x="8" y="42" width="8" height="6" rx="1.5" fill="#3b82f6" opacity="0.3"/>
    <rect x="24" y="42" width="8" height="6" rx="1.5" fill="#3b82f6" opacity="0.3"/>
    <rect x="40" y="42" width="8" height="6" rx="1.5" fill="#3b82f6" opacity="0.3"/>
  </svg>
);

const getNetworkSegmentStyle = (name) => {
  const n = (name||"").toLowerCase();
  if (n.includes("vmotion"))    return {bg:"bg-violet-100",  text:"text-violet-700",  bar:"bg-violet-400",  label:"vMotion"};
  if (n.includes("storage")||n.includes("san")||n.includes("iscsi")) return {bg:"bg-emerald-100", text:"text-emerald-700", bar:"bg-emerald-400", label:"Storage"};
  if (n.includes("mgmt")||n.includes("management")||n.includes("adm")) return {bg:"bg-slate-100", text:"text-slate-600", bar:"bg-slate-400", label:"Management"};
  if (n.includes("backup")||n.includes("veeam")) return {bg:"bg-purple-100", text:"text-purple-700", bar:"bg-purple-400", label:"Backup"};
  return {bg:"bg-blue-100", text:"text-blue-700", bar:"bg-blue-400", label:"VM Network"};
};

// ── Storage helpers ──────────────────────────────────────────────────────────
const getStorageHealth = (pct) => {
  if (pct >= 80) return { color:"text-red-600",   bar:"bg-red-500",   badge:"bg-red-100 text-red-700",   label:"Critique", border:"border-red-200" };
  if (pct >= 60) return { color:"text-amber-600", bar:"bg-amber-400", badge:"bg-amber-100 text-amber-700",label:"Modere",   border:"border-amber-200" };
  return              { color:"text-emerald-600", bar:"bg-emerald-500",badge:"bg-emerald-100 text-emerald-700",label:"Sain", border:"border-gray-100" };
};

const getDatastorePurpose = (name, type) => {
  const n = (name||"").toLowerCase();
  if (n.includes("veeam")||n.includes("backup")||n.includes("bkp")) return "backup";
  if (n.includes("iso")||n.includes("media")) return "iso";
  if (n.includes("vms")||n.includes("vm-")) return "production";
  if ((type||"").toLowerCase().includes("nfs")) return "nfs";
  return "generic";
};

const getPurposeBadge = (purpose) => {
  const map = {
    backup:     { label:"Backup",     cls:"bg-purple-100 text-purple-700" },
    iso:        { label:"ISO/Media",  cls:"bg-slate-100 text-slate-600"   },
    production: { label:"Production", cls:"bg-blue-100 text-blue-700"     },
    nfs:        { label:"NFS",        cls:"bg-cyan-100 text-cyan-700"     },
    generic:    { label:"VMFS",       cls:"bg-gray-100 text-gray-600"     },
  };
  return map[purpose]||map.generic;
};

const DatastoreIcon = ({ purpose }) => {
  if (purpose === "backup") return (
    <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
      <rect x="4" y="8" width="40" height="32" rx="4" fill="#7c3aed" opacity="0.12"/>
      <rect x="4" y="8" width="40" height="32" rx="4" stroke="#7c3aed" strokeWidth="1.5"/>
      <rect x="8" y="14" width="32" height="6" rx="2" fill="#7c3aed" opacity="0.3"/>
      <rect x="8" y="23" width="32" height="6" rx="2" fill="#7c3aed" opacity="0.2"/>
      <circle cx="36" cy="17" r="2" fill="#7c3aed"/>
      <circle cx="36" cy="26" r="2" fill="#7c3aed" opacity="0.6"/>
      <path d="M16 35 l4-4 l3 3 l6-6 l3 3" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (purpose === "iso") return (
    <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
      <rect x="4" y="8" width="40" height="32" rx="4" fill="#0891b2" opacity="0.12"/>
      <rect x="4" y="8" width="40" height="32" rx="4" stroke="#0891b2" strokeWidth="1.5"/>
      <circle cx="24" cy="24" r="8" stroke="#0891b2" strokeWidth="1.5" opacity="0.5"/>
      <circle cx="24" cy="24" r="3" fill="#0891b2" opacity="0.4"/>
      <rect x="8" y="14" width="12" height="3" rx="1" fill="#0891b2" opacity="0.3"/>
    </svg>
  );
  if (purpose === "nfs") return (
    <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
      <rect x="4" y="8" width="40" height="32" rx="4" fill="#0284c7" opacity="0.12"/>
      <rect x="4" y="8" width="40" height="32" rx="4" stroke="#0284c7" strokeWidth="1.5"/>
      <path d="M12 24 h8 M28 24 h8 M20 24 l4-6 l4 6" stroke="#0284c7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="8" y="14" width="32" height="4" rx="1.5" fill="#0284c7" opacity="0.2"/>
      <rect x="8" y="30" width="32" height="4" rx="1.5" fill="#0284c7" opacity="0.2"/>
    </svg>
  );
  if (purpose === "production") return (
    <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
      <rect x="4" y="6" width="40" height="10" rx="3" fill="#1d4ed8" opacity="0.15"/>
      <rect x="4" y="6" width="40" height="10" rx="3" stroke="#1d4ed8" strokeWidth="1.5"/>
      <rect x="4" y="19" width="40" height="10" rx="3" fill="#1d4ed8" opacity="0.1"/>
      <rect x="4" y="19" width="40" height="10" rx="3" stroke="#1d4ed8" strokeWidth="1.5"/>
      <rect x="4" y="32" width="40" height="10" rx="3" fill="#1d4ed8" opacity="0.07"/>
      <rect x="4" y="32" width="40" height="10" rx="3" stroke="#1d4ed8" strokeWidth="1.5"/>
      <circle cx="36" cy="11" r="2" fill="#1d4ed8"/>
      <circle cx="36" cy="24" r="2" fill="#1d4ed8" opacity="0.7"/>
      <circle cx="36" cy="37" r="2" fill="#1d4ed8" opacity="0.4"/>
      <rect x="8" y="9" width="20" height="4" rx="1" fill="#1d4ed8" opacity="0.3"/>
      <rect x="8" y="22" width="16" height="4" rx="1" fill="#1d4ed8" opacity="0.2"/>
      <rect x="8" y="35" width="12" height="4" rx="1" fill="#1d4ed8" opacity="0.15"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
      <rect x="4" y="10" width="40" height="28" rx="4" fill="#64748b" opacity="0.12"/>
      <rect x="4" y="10" width="40" height="28" rx="4" stroke="#64748b" strokeWidth="1.5"/>
      <rect x="8" y="16" width="32" height="5" rx="2" fill="#64748b" opacity="0.25"/>
      <rect x="8" y="24" width="32" height="5" rx="2" fill="#64748b" opacity="0.15"/>
      <circle cx="36" cy="18.5" r="1.5" fill="#64748b"/>
      <circle cx="36" cy="26.5" r="1.5" fill="#64748b" opacity="0.6"/>
    </svg>
  );
};

const DatastoreCard = ({ ds }) => {
  const pct     = Math.round(ds.usedPercent||ds.inUseMib/(ds.capMib||1)*100);
  const health  = getStorageHealth(pct);
  const purpose = getDatastorePurpose(ds.name, ds.type);
  const badge   = getPurposeBadge(purpose);
  const capGo   = ds.capMib ? (ds.capMib/1024).toFixed(0) : (ds.capacityGb||0);
  const usedGo  = ds.inUseMib ? (ds.inUseMib/1024).toFixed(0) : (ds.usedGb||0);
  const freeGo  = ds.capMib ? ((ds.capMib-ds.inUseMib)/1024).toFixed(0) : (ds.freeGb||0);

  return (
    <div className={"flex items-center gap-4 p-4 rounded-xl border bg-white transition-all hover:shadow-md "+(pct>=80?"border-red-200 bg-red-50/20":pct>=60?"border-amber-200":"border-gray-100")}>
      {/* Icône */}
      <div className="w-14 h-14 flex-shrink-0">
        <DatastoreIcon purpose={purpose}/>
      </div>
      {/* Infos */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-sm font-bold text-gray-800 truncate max-w-xs">{ds.name}</span>
          <span className={"text-xs px-2 py-0.5 rounded-full font-semibold "+badge.cls}>{badge.label}</span>
          {pct>=80&&<span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-red-100 text-red-700">Critique</span>}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 inline-flex items-center justify-center bg-blue-100 rounded text-blue-600 text-xs">VM</span>
            {ds.vms||0} VM{(ds.vms||0)>1?"s":""}
          </span>
          <span>·</span>
          <span>{ds.hosts||0} host{(ds.hosts||0)>1?"s":""}</span>
          {ds.type&&<span>· {ds.type}</span>}
        </div>
        {/* Barre capacité */}
        <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className={"h-full rounded-full transition-all "+health.bar} style={{width:Math.min(pct,100)+"%"}}/>
          {/* Seuil 80% */}
          <div className="absolute top-0 bottom-0 w-px bg-red-300 opacity-60" style={{left:"80%"}}/>
        </div>
        {ds.warningMessage&&<div className="mt-1 text-xs text-red-500 font-medium">{ds.warningMessage}</div>}
      </div>
      {/* Métriques */}
      <div className="text-right flex-shrink-0 min-w-32">
        <div className="text-sm font-semibold text-gray-700">{usedGo} Go utilisé</div>
        <div className="text-xs text-gray-400">/ {capGo} Go total</div>
        <div className="text-xs text-gray-400">{freeGo} Go libre</div>
        <div className={"text-base font-bold mt-1 "+health.color}>{pct}% utilisé</div>
      </div>
    </div>
  );
};

export const mapRvToolsAnalysisToClusterViewModel = (rv) => {
  if (!rv) return {platformContext:{},clusterSummary:{},hosts:[],insights:[]};
  const totalCores = rv.totalCores||0;
  const cpuOversub = totalCores>0?(rv.totalVcpu/totalCores).toFixed(1)+":1":"N/A";
  const ramOversub = rv.totalRamPhysGo>0?(rv.totalRamGo/rv.totalRamPhysGo).toFixed(1)+":1":"N/A";
  const insights = [];
  (rv.hosts||[]).forEach(h=>{
    if ((h.cpuUsagePct||0)>=80) insights.push({
      id:"cpu-"+h.shortName, severity:"critical",
      title:"Host "+h.shortName+" CPU sature",
      description:"Utilisation CPU a "+h.cpuUsagePct+"% — risque de contention",
      recommendation:"Migrer des VMs vers un host moins charge",
      impact:h.cpuUsagePct+"% CPU"
    });
    if ((h.ramUsagePct||0)>=80) insights.push({
      id:"ram-"+h.shortName, severity:"critical",
      title:"Host "+h.shortName+" RAM saturee",
      description:"Utilisation RAM a "+h.ramUsagePct+"% — risque de contention",
      recommendation:"Reequilibrage vMotion recommande",
      impact:h.ramUsagePct+"% RAM"
    });
  });
  if ((rv.vmOff20||0)>0) insights.push({
    id:"vms-off", severity:"warning",
    title:rv.vmOff20+" VMs inutilisees detectees",
    description:"Eteintes depuis plus de 20 jours",
    recommendation:"Audit et decommissionnement recommande",
    impact:rv.vmOff20+" VMs"
  });
  const avgCpu = (rv.hosts||[]).length>0
    ?Math.round((rv.hosts||[]).reduce((s,h)=>s+(h.cpuUsagePct||0),0)/(rv.hosts||[]).length):0;
  if (avgCpu<40&&(rv.hosts||[]).length>0) insights.push({
    id:"cpu-low", severity:"info",
    title:"CPU global sous-utilise",
    description:"Moyenne CPU a "+avgCpu+"% — consolidation possible",
    recommendation:"Evaluer une reduction du nombre de hosts",
    impact:avgCpu+"% moy."
  });
  return {
    platformContext:{
      sourceLabel:rv.source||"RVTools",
      hardwareModel:(rv.vendor||"")+" "+(rv.model||""),
      hypervisorLabel:"VMware ESXi",
      hypervisorVersion:(rv.esxVersions||[])[0]||"N/A",
    },
    clusterSummary:{
      activeVms:rv.vmOn||0,
      totalVms:rv.vmsTotal||0,
      poweredOffVms:rv.vmOff||0,
      allocatedVcpu:rv.totalVcpu||0,
      allocatedRamGb:rv.totalRamGo||0,
      allocatedRamDisplay:formatRam(rv.totalRamGo),
      usedStorageTb:parseFloat(rv.totalDiskTo)||0,
      usedStorageDisplay:formatStorage(parseFloat(rv.totalDiskTo)),
      totalCpuCores:rv.totalCores||0,
      totalRamGb:rv.totalRamPhysGo||0,
      totalRamDisplay:formatRam(rv.totalRamPhysGo),
      cpuOversubscription:cpuOversub,
      ramOversubscription:ramOversub,
      avgVcpuPerVm:rv.vmOn>0?(rv.totalVcpu/rv.vmOn).toFixed(1):"N/A",
      avgRamPerVmGb:rv.vmOn>0?Math.round(rv.totalRamGo/rv.vmOn):"N/A",
      healthStatus:insights.some(i=>i.severity==="critical")?"critical":insights.some(i=>i.severity==="warning")?"warning":"healthy",
      alertsCount:insights.filter(i=>i.severity==="critical").length,
      warningsCount:insights.filter(i=>i.severity==="warning").length,
    },
    hosts:(rv.hosts||[]).map(h=>({
      id:h.name, name:h.shortName,
      cpuUsagePercent:h.cpuUsagePct||0,
      ramUsagePercent:h.ramUsagePct||0,
      totalCpuCores:h.cores||0,
      totalRamGb:h.ramGo||0,
      status:(h.cpuUsagePct||0)>=80||(h.ramUsagePct||0)>=80?"critical":"healthy",
      warning:(h.ramUsagePct||0)>=80?"RAM critique — risque de contention":null,
    })),
    insights,
    osDistrib: rv.osDistrib || [],
    optimizationData: (()=>{
      const vmOff20 = rv.vmOffList||[];
      const criticalHosts = (rv.hosts||[]).filter(h=>(h.ramUsagePct||0)>=80||(h.cpuUsagePct||0)>=80);
      const criticalDs = (rv.datastores||[]).filter(d=>Math.round(d.inUseMib/(d.capMib||1)*100)>=80);
      const avgCpu = (rv.hosts||[]).length>0?Math.round((rv.hosts||[]).reduce((s,h)=>s+(h.cpuUsagePct||0),0)/(rv.hosts||[]).length):0;
      const avgRam = (rv.hosts||[]).length>0?Math.round((rv.hosts||[]).reduce((s,h)=>s+(h.ramUsagePct||0),0)/(rv.hosts||[]).length):0;

      // Score 0-100
      let score = 100;
      if (criticalHosts.length>0) score -= criticalHosts.length*15;
      if (vmOff20.length>0) score -= Math.min(vmOff20.length*3, 20);
      if (criticalDs.length>0) score -= criticalDs.length*10;
      const maxCpu = Math.max(...(rv.hosts||[]).map(h=>h.cpuUsagePct||0),0);
      const minCpu = Math.min(...(rv.hosts||[]).map(h=>h.cpuUsagePct||0),100);
      if (maxCpu-minCpu>30) score -= 10;
      score = Math.max(0, Math.min(100, score));

      const reclaimCpu = vmOff20.reduce((s,v)=>s+(v.cpu||0),0);
      const reclaimRam = vmOff20.reduce((s,v)=>s+(v.ramGo||0),0);
      const reclaimStorage = vmOff20.reduce((s,v)=>s+(v.diskGo||0),0)/1024;

      const recommendations = [];
      if (vmOff20.length>0) recommendations.push({
        id:"idle-vms", category:"cleanup", severity:"high",
        title:"Supprimer les VMs inactives",
        description:vmOff20.length+" VMs eteintes depuis plus de 20 jours consomment des ressources allouees.",
        recommendation:"Auditer et decommissionner ces VMs pour liberer des ressources.",
        estimatedGainCpu:reclaimCpu, estimatedGainRam:reclaimRam, estimatedGainStorage:parseFloat(reclaimStorage.toFixed(1)),
        affectedObjectsCount:vmOff20.length,
      });
      if (criticalHosts.length>0) recommendations.push({
        id:"host-pressure", category:"balancing", severity:"critical",
        title:"Reequilibrer la charge des hosts",
        description:criticalHosts.length+" host(s) depassent 80% d utilisation RAM ou CPU.",
        recommendation:"Migrer des VMs vers les hosts moins charges via vMotion.",
        estimatedGainCpu:0, estimatedGainRam:0, estimatedGainStorage:0,
        affectedObjectsCount:criticalHosts.length,
      });
      if (criticalDs.length>0) recommendations.push({
        id:"storage-critical", category:"risk", severity:"critical",
        title:"Datastores en saturation",
        description:criticalDs.length+" datastore(s) depassent 80% de capacite.",
        recommendation:"Etendre la capacite ou migrer des VMs vers d autres datastores.",
        estimatedGainCpu:0, estimatedGainRam:0, estimatedGainStorage:0,
        affectedObjectsCount:criticalDs.length,
      });
      if (maxCpu-minCpu>30) recommendations.push({
        id:"cpu-imbalance", category:"balancing", severity:"medium",
        title:"Desequilibre CPU detecte",
        description:"Ecart de "+Math.round(maxCpu-minCpu)+"% entre le host le plus et le moins charge.",
        recommendation:"Redistribuer les VMs pour equilibrer la charge CPU.",
        estimatedGainCpu:0, estimatedGainRam:0, estimatedGainStorage:0,
        affectedObjectsCount:(rv.hosts||[]).length,
      });

      const quickWins = [];
      if (vmOff20.length>0) quickWins.push({
        id:"qw-vms", title:"Supprimer "+vmOff20.length+" VMs inactives",
        description:"Liberation immediate de "+reclaimRam+" Go RAM et "+reclaimCpu+" vCPU.",
        gain:reclaimRam+" Go RAM · "+reclaimCpu+" vCPU", effortLevel:"low",
      });
      if (criticalHosts.length>0) quickWins.push({
        id:"qw-vmotion", title:"Reequilibrer via vMotion",
        description:"Deplacer des VMs des hosts satures vers les hosts libres.",
        gain:"Reduction pression RAM/CPU", effortLevel:"low",
      });
      if (criticalDs.length>0) quickWins.push({
        id:"qw-storage", title:"Liberer de l espace sur "+criticalDs.length+" datastore(s)",
        description:"Supprimer les snapshots anciens et les VMs orphelines.",
        gain:"Liberer de l espace critique", effortLevel:"medium",
      });

      const risks = [];
      criticalHosts.forEach(h=>risks.push({
        id:"risk-"+h.shortName, severity:"critical",
        title:"Host "+h.shortName+" en saturation",
        description:"CPU "+(h.cpuUsagePct||0)+"% · RAM "+(h.ramUsagePct||0)+"% — risque de contention imminent.",
      }));
      criticalDs.forEach(d=>risks.push({
        id:"risk-ds-"+d.name, severity:"critical",
        title:"Datastore "+d.name.substring(0,30)+" critique",
        description:"Utilisation a "+Math.round(d.inUseMib/(d.capMib||1)*100)+"% — risque de saturation.",
      }));

      return {
        score, infraStatus:score>=80?"healthy":score>=60?"warning":"critical",
        optimizationPotentialPercent:Math.round((1-score/100)*100),
        totalVmCount:rv.vmsTotal||0,
        idleVmCount:vmOff20.length,
        recommendations, quickWins, risks,
        savings:{
          reclaimableCpu:reclaimCpu,
          reclaimableRamGb:reclaimRam,
          reclaimableStorageTb:parseFloat(reclaimStorage.toFixed(1)),
          potentialHostReduction:criticalHosts.length===0&&(rv.hosts||[]).length>2?1:0,
        },
      };
    })(),
    networkData: {
      vlans: rv.vlans || [],
      vSwitches: rv.vSwitches || [],
      dvSwitches: rv.dvSwitches || [],
      uniquePortGroups: rv.uniquePortGroups || [],
      hostsNics: (rv.hosts||[]).map(h=>({
        name: h.shortName,
        nics: h.nics||0,
        vSwitches: h.vSwitches||[],
        cpuUsagePct: h.cpuUsagePct||0,
        ramUsagePct: h.ramUsagePct||0,
      })),
    },
    datastores: rv.datastores || [],
    topMemoryConsumers: (rv.hosts||[]).flatMap(h=>(h.vms||[]).map(v=>({
      id: v.name,
      name: v.name,
      hostName: h.shortName,
      allocatedRamGb: v.ramGo||0,
      usedRamGb: v.usedRamGo||0,
      activeRamGb: v.activeRamGo||0,
      usagePercent: v.ramGo>0?Math.round((v.usedRamGo||0)/v.ramGo*100):0,
      wasteGb: Math.max(0,(v.ramGo||0)-(v.usedRamGo||0)),
      vcpu: v.vcpu||0,
      os: v.os||"N/A",
      powerState: v.powerstate||"poweredOn",
      isOversized: v.ramGo>0&&(v.usedRamGo||0)/v.ramGo<0.5,
    }))).filter(v=>v.powerState==="poweredOn").sort((a,b)=>b.allocatedRamGb-a.allocatedRamGb).slice(0,8),
    vlans: rv.vlans || [],
    vSwitches: rv.vSwitches || [],
    dvSwitches: rv.dvSwitches || [],
    vmOffList: rv.vmOffList || [],
    uniquePortGroups: rv.uniquePortGroups || [],
  };
};

const TABS = [
  {id:"overview",     label:"Overview",     icon:Activity},
  {id:"compute",      label:"Compute",      icon:Cpu},
  {id:"memory",       label:"Memory",       icon:MemoryStick},
  {id:"storage",      label:"Storage",      icon:HardDrive},
  {id:"vms",          label:"VMs",          icon:Activity},
  {id:"network",      label:"Network",      icon:Network},
  {id:"optimization", label:"Optimization", icon:Settings},
];

export default function ClusterOverviewDashboard({
  platformContext={}, clusterSummary={}, hosts=[], insights=[],
  osDistrib=[], datastores=[], vlans=[], vSwitches=[], dvSwitches=[], vmOffList=[], uniquePortGroups=[], topMemoryConsumers=[], networkData={}, optimizationData={},
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const sortedHosts = [...hosts].sort((a,b)=>
    Math.max(b.cpuUsagePercent||0,b.ramUsagePercent||0)-Math.max(a.cpuUsagePercent||0,a.ramUsagePercent||0)
  );
  const criticals = insights.filter(i=>i.severity==="critical");
  const warnings  = insights.filter(i=>i.severity==="warning");
  const infos     = insights.filter(i=>i.severity==="info");

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-xs text-gray-400 font-mono">
          {platformContext.sourceLabel} · {platformContext.hardwareModel} · {platformContext.hypervisorVersion}
        </div>
        {(clusterSummary.alertsCount||0)>0&&(
          <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-full px-3 py-1">
            <AlertTriangle size={12} className="text-red-500"/>
            <span className="text-xs font-semibold text-red-600">{clusterSummary.alertsCount} alerte{clusterSummary.alertsCount>1?"s":""}</span>
          </div>
        )}
      </div>

      <div className="flex gap-1 mb-5 bg-white rounded-xl border border-gray-100 p-1 shadow-sm overflow-x-auto">
        {TABS.map(t=>{
          const Icon=t.icon; const active=activeTab===t.id;
          return (
            <button key={t.id} onClick={()=>setActiveTab(t.id)}
              className={"flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap "+
                (active?"bg-blue-600 text-white shadow-sm":"text-gray-500 hover:text-gray-700 hover:bg-gray-50")}>
              <Icon size={13}/>{t.label}
            </button>
          );
        })}
      </div>

      {/* Ligne de contexte compacte — visible sur tous les onglets sauf Overview */}
      {activeTab!=="overview"&&(
        <div className="mb-4 px-1 flex items-center gap-2 text-xs text-gray-400 font-mono flex-wrap">
          <span className="text-gray-600 font-semibold">Cluster</span>
          <span>·</span>
          <span>{clusterSummary.activeVms||0} VMs</span>
          <span>·</span>
          <span>{clusterSummary.allocatedVcpu||0} vCPU</span>
          <span>·</span>
          <span>{clusterSummary.allocatedRamDisplay||"N/A"} RAM</span>
          <span>·</span>
          <span>{clusterSummary.usedStorageDisplay||"N/A"} Stockage</span>
          {(clusterSummary.alertsCount||0)>0&&(
            <span className="ml-2 flex items-center gap-1 text-red-500">
              <AlertTriangle size={11}/>
              {clusterSummary.alertsCount} alerte{clusterSummary.alertsCount>1?"s":""}
            </span>
          )}
        </div>
      )}

      <div className="mb-5">
        <InsightBar clusterSummary={clusterSummary} insights={insights}/>
      </div>

      {activeTab==="overview"&&(
        <div className="space-y-4">
          {/* KPIs globaux — Overview uniquement */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="VMs actives"  value={clusterSummary.activeVms}           sub={(clusterSummary.poweredOffVms||0)+" eteintes"}  icon={Server}      gradient="bg-gradient-to-br from-blue-500 to-blue-700"/>
            <KpiCard label="vCPU alloues" value={clusterSummary.allocatedVcpu}       sub="VMs poweredOn"                                   icon={Cpu}         gradient="bg-gradient-to-br from-orange-400 to-orange-600"/>
            <KpiCard label="RAM allouee"  value={clusterSummary.allocatedRamDisplay}  sub="VMs poweredOn"                                  icon={MemoryStick} gradient="bg-gradient-to-br from-violet-500 to-violet-700"/>
            <KpiCard label="Stockage"     value={clusterSummary.usedStorageDisplay}   sub="VMs poweredOn"                                  icon={HardDrive}   gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"/>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-3">Cluster Overview</h3>
              <OverviewStatRow label="Hosts"     value={(hosts.length||0)+" hosts"}/>
              <OverviewStatRow label="Total CPU" value={(clusterSummary.totalCpuCores||0)+" cores"}/>
              <OverviewStatRow label="Total RAM" value={clusterSummary.totalRamDisplay}/>
              <OverviewStatRow label="VMs"       value={clusterSummary.totalVms} sub={(clusterSummary.activeVms||0)+" actives / "+(clusterSummary.poweredOffVms||0)+" off"}/>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <RatioCard label="CPU oversubscription" value={clusterSummary.cpuOversubscription} icon={Cpu}         color="blue"/>
                <RatioCard label="RAM oversubscription" value={clusterSummary.ramOversubscription} icon={MemoryStick} color="orange"/>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <RatioCard label="vCPU moy./VM" value={clusterSummary.avgVcpuPerVm}               icon={Cpu}         color="blue"/>
                <RatioCard label="RAM moy./VM"  value={formatRam(clusterSummary.avgRamPerVmGb)}   icon={MemoryStick} color="orange"/>
              </div>
            </div>
            {insights.length>0&&(
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-3">Optimization Insights</h3>
                <div className="space-y-2">
                  {[...criticals,...warnings,...infos].map(i=><OptimizationItem key={i.id} insight={i}/>)}
                </div>
              </div>
            )}
          </div>
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-800">Host Utilization</h3>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"/>&lt;60%</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"/>60-80%</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"/>&gt;80%</span>
                </div>
              </div>
              <div className="space-y-3">
                {sortedHosts.length>0?sortedHosts.map(h=><HostCard key={h.id||h.name} host={h}/>):
                  <div className="text-sm text-gray-400 text-center py-8">Aucun host detecte</div>}
              </div>
              {((clusterSummary.poweredOffVms||0)>0||(clusterSummary.cpuOversubscription))&&(
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  {(clusterSummary.poweredOffVms||0)>0&&(
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Database size={10} className="text-amber-600"/>
                      </div>
                      <span><strong>{clusterSummary.poweredOffVms} VMs inutilisees</strong> — gain potentiel : {formatRam((clusterSummary.avgRamPerVmGb||0)*clusterSummary.poweredOffVms)} RAM / {Math.round((parseFloat(clusterSummary.avgVcpuPerVm)||0)*clusterSummary.poweredOffVms)} vCPU</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <TrendingDown size={10} className="text-blue-600"/>
                    </div>
                    <span>CPU oversubscription <strong>{clusterSummary.cpuOversubscription}</strong> — consolidation analysee</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      )}

      {activeTab==="compute"&&(
        <div className="space-y-4">
          {/* KPIs Compute */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {label:"Total hosts",      val:hosts.length,                                    sub:"noeuds physiques",    bg:"bg-gradient-to-br from-slate-500 to-slate-700"},
              {label:"CPU total",        val:(clusterSummary.totalCpuCores||0)+" cores",       sub:"cluster",             bg:"bg-gradient-to-br from-blue-500 to-blue-700"},
              {label:"vCPU alloues",     val:clusterSummary.allocatedVcpu,                    sub:"oversubscription "+clusterSummary.cpuOversubscription, bg:"bg-gradient-to-br from-indigo-500 to-indigo-700"},
              {label:"Avg VM / host",    val:hosts.length>0?Math.round((clusterSummary.activeVms||0)/hosts.length):"N/A", sub:"VMs par noeud", bg:"bg-gradient-to-br from-violet-500 to-violet-700"},
            ].map(k=>(
              <div key={k.label} className={"rounded-2xl p-4 text-white "+k.bg}>
                <div className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">{k.label}</div>
                <div className="text-2xl font-bold">{k.val}</div>
                <div className="text-xs opacity-60 mt-1">{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Hosts CPU */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Compute — Utilisation CPU par host</h3>
            <div className="space-y-3">
              {sortedHosts.map(h=>{
                const tone = getUsageTone(h.cpuUsagePercent||0);
                const usedCores = Math.round((h.cpuUsagePercent||0)*h.totalCpuCores/100);
                const freeCores = h.totalCpuCores - usedCores;
                const health = (h.cpuUsagePercent||0)>=80?"critical":(h.cpuUsagePercent||0)>=60?"warning":"healthy";
                return (
                  <div key={h.id} className={"flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-sm "+
                    (health==="critical"?"border-red-200 bg-red-50/20":health==="warning"?"border-amber-200 bg-amber-50/10":"border-gray-100 bg-gray-50")}>
                    <div className="w-14 h-14 flex-shrink-0">
                      <ServerNodeVisual health={health}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-800 truncate">{h.name}</span>
                          <span className="text-xs text-gray-400">{h.totalCpuCores} cores physiques</span>
                          {h.vmCount&&<span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{h.vmCount} VMs</span>}
                        </div>
                        <span className={tone.color+" text-base font-bold ml-4"}>{h.cpuUsagePercent||0}%</span>
                      </div>
                      <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                        <div className={"h-full rounded-full transition-all bg-blue-500"} style={{width:Math.min(h.cpuUsagePercent||0,100)+"%"}}/>
                        <div className="absolute top-0 bottom-0 w-px bg-amber-400 opacity-60" style={{left:"60%"}}/>
                        <div className="absolute top-0 bottom-0 w-px bg-red-400 opacity-60" style={{left:"80%"}}/>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Utilise : <strong className="text-gray-600">{usedCores} cores</strong></span>
                        <span>Libre : <strong className="text-gray-600">{freeCores} cores</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top CPU Consumers */}
          {topMemoryConsumers.length>0&&(
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-1">Top CPU Consumers</h3>
              <p className="text-xs text-gray-400 mb-4">VMs les plus consommatrices de vCPU (poweredOn)</p>
              <div className="space-y-2">
                {[...topMemoryConsumers].sort((a,b)=>(b.vcpu||0)-(a.vcpu||0)).filter(v=>v.vcpu>0).slice(0,8).map((v,i)=>{
                  const maxVcpu = Math.max(...topMemoryConsumers.map(x=>x.vcpu||0),1);
                  const pct = Math.round((v.vcpu||0)/maxVcpu*100);
                  const isWin = (v.os||"").toLowerCase().includes("windows");
                  return (
                    <div key={v.id||i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Cpu size={14} className="text-blue-500"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <span className="text-xs font-bold text-gray-800 truncate block">{v.name}</span>
                            {v.hostName&&<span className="text-xs text-gray-400">{v.hostName}</span>}
                          </div>
                          <span className="text-sm font-bold text-blue-600 ml-2 whitespace-nowrap">{v.vcpu||0} vCPU</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className={"h-full rounded-full "+(isWin?"bg-blue-400":"bg-indigo-400")} style={{width:pct+"%"}}/>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 w-8 text-right">#{i+1}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab==="memory"&&(
        <div className="space-y-4">
          {/* KPIs Memory */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {label:"RAM physique totale", val:formatRam(clusterSummary.totalRamGb),        sub:"cluster",              bg:"bg-gradient-to-br from-blue-500 to-blue-700"},
              {label:"RAM allouee VMs",     val:clusterSummary.allocatedRamDisplay,           sub:"VMs poweredOn",        bg:"bg-gradient-to-br from-violet-500 to-violet-700"},
              {label:"Oversubscription",    val:clusterSummary.ramOversubscription||"N/A",    sub:"ratio alloue/physique",bg:"bg-gradient-to-br from-slate-500 to-slate-700"},
              {label:"Hosts en tension",    val:hosts.filter(h=>(h.ramUsagePercent||0)>=60).length, sub:"RAM >= 60%",   bg:hosts.filter(h=>(h.ramUsagePercent||0)>=60).length>0?"bg-gradient-to-br from-amber-500 to-amber-700":"bg-gradient-to-br from-emerald-500 to-emerald-700"},
            ].map(k=>(
              <div key={k.label} className={"rounded-2xl p-4 text-white "+k.bg}>
                <div className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">{k.label}</div>
                <div className="text-2xl font-bold">{k.val}</div>
                <div className="text-xs opacity-60 mt-1">{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Hosts RAM */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Memory — Utilisation RAM par host</h3>
            <div className="space-y-3">
              {[...hosts].sort((a,b)=>(b.ramUsagePercent||0)-(a.ramUsagePercent||0)).map(h=>{
                const tone   = getUsageTone(h.ramUsagePercent||0);
                const usedGb = Math.round((h.ramUsagePercent||0)*h.totalRamGb/100);
                const freeGb = h.totalRamGb - usedGb;
                const health = (h.ramUsagePercent||0)>=80?"critical":(h.ramUsagePercent||0)>=60?"warning":"healthy";
                return (
                  <div key={h.id} className={"flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-sm "+
                    (health==="critical"?"border-red-200 bg-red-50/20":health==="warning"?"border-amber-200 bg-amber-50/10":"border-gray-100 bg-gray-50")}>
                    <div className="w-14 h-14 flex-shrink-0">
                      <MemoryNodeVisual health={health}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-gray-800 truncate">{h.name}</span>
                          <span className="text-xs text-gray-400">{formatRam(h.totalRamGb)} total</span>
                          {(h.ramUsagePercent||0)>=80&&<span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">Critique</span>}
                        </div>
                        <span className={tone.color+" text-base font-bold ml-4"}>{h.ramUsagePercent||0}%</span>
                      </div>
                      <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                        <div className={"h-full rounded-full transition-all "+((h.ramUsagePercent||0)>=80?"bg-red-400":(h.ramUsagePercent||0)>=60?"bg-amber-400":"bg-blue-400")} style={{width:Math.min(h.ramUsagePercent||0,100)+"%"}}/>
                        <div className="absolute top-0 bottom-0 w-px bg-amber-400 opacity-60" style={{left:"60%"}}/>
                        <div className="absolute top-0 bottom-0 w-px bg-red-400 opacity-60" style={{left:"80%"}}/>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Utilise : <strong className="text-gray-600">{formatRam(usedGb)}</strong></span>
                        <span>Libre : <strong className="text-gray-600">{formatRam(freeGb)}</strong></span>
                      </div>
                      {h.warningMessage&&<div className="mt-1 text-xs text-red-500 font-medium">{h.warningMessage}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Memory Consumers */}
          <TopMemoryConsumersBlock
            consumers={topMemoryConsumers}
            totalAllocatedRam={clusterSummary.allocatedRamGb||0}
          />

          {/* Memory Insights */}
          {insights.length>0&&(
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-3">Memory Insights</h3>
              <div className="space-y-2">
                {insights.map(i=><OptimizationItem key={i.id} insight={i}/>)}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab==="storage"&&(
        <div className="space-y-4">
          {/* KPIs stockage */}
          {datastores.length>0&&(()=>{
            const critical = datastores.filter(d=>Math.round(d.inUseMib/(d.capMib||1)*100)>=80).length;
            const warning  = datastores.filter(d=>{const p=Math.round(d.inUseMib/(d.capMib||1)*100);return p>=60&&p<80;}).length;
            const healthy  = datastores.length - critical - warning;
            const totalGo  = datastores.reduce((s,d)=>s+(d.capMib||0),0)/1024;
            const usedGo   = datastores.reduce((s,d)=>s+(d.inUseMib||0),0)/1024;
            return (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {label:"Datastores",   val:datastores.length,        sub:"total",              bg:"bg-gradient-to-br from-slate-500 to-slate-700"},
                  {label:"Sains",        val:healthy,                   sub:"< 60% utilise",      bg:"bg-gradient-to-br from-emerald-500 to-emerald-700"},
                  {label:"En tension",   val:warning,                   sub:"60-80% utilise",     bg:"bg-gradient-to-br from-amber-400 to-amber-600"},
                  {label:"Critiques",    val:critical,                  sub:">= 80% utilise",     bg:"bg-gradient-to-br from-red-500 to-red-700"},
                ].map(k=>(
                  <div key={k.label} className={"rounded-2xl p-4 text-white "+k.bg}>
                    <div className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">{k.label}</div>
                    <div className="text-3xl font-bold">{k.val}</div>
                    <div className="text-xs opacity-60 mt-1">{k.sub}</div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Liste datastores triée par criticité */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-800">Datastores ({datastores.length})</h3>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"/>Sain (&lt;60%)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"/>Modere (60-80%)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"/>Critique (&gt;=80%)</span>
              </div>
            </div>
            <div className="space-y-3">
              {[...datastores].sort((a,b)=>{
                const pa=Math.round(a.inUseMib/(a.capMib||1)*100);
                const pb=Math.round(b.inUseMib/(b.capMib||1)*100);
                return pb-pa;
              }).map((d,i)=><DatastoreCard key={i} ds={d}/>)}
            </div>
          </div>

          {/* Insights stockage */}
          {insights.filter(i=>i.id&&i.id.includes&&(i.id.includes("storage")||i.id.includes("ds"))).length>0&&(
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-3">Storage Insights</h3>
              <div className="space-y-2">
                {insights.map(i=><OptimizationItem key={i.id} insight={i}/>)}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab==="network"&&(()=>{
        const nd = networkData||{};
        const hostsNics = nd.hostsNics||[];
        const allVlans = nd.vlans||vlans||[];
        const allVSwitches = nd.vSwitches||vSwitches||[];
        const allDvSwitches = nd.dvSwitches||dvSwitches||[];
        const allPGs = nd.uniquePortGroups||uniquePortGroups||[];
        const totalNics = hostsNics.reduce((s,h)=>s+(h.nics||0),0);
        const segments = [...new Map(allVlans.map(v=>[v.name,v])).values()];

        return (
          <div className="space-y-4">
            {/* KPIs Réseau */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {label:"Hosts connectes",    val:hostsNics.length||hosts.length, sub:"noeuds cluster",      bg:"bg-gradient-to-br from-blue-500 to-blue-700"},
                {label:"NICs physiques",     val:totalNics,                       sub:"total cluster",       bg:"bg-gradient-to-br from-indigo-500 to-indigo-700"},
                {label:"Port Groups",        val:allPGs.length||allVlans.length,  sub:"segments logiques",   bg:"bg-gradient-to-br from-violet-500 to-violet-700"},
                {label:"vSwitches",          val:allVSwitches.length+allDvSwitches.length, sub:"standard + distribues", bg:"bg-gradient-to-br from-slate-500 to-slate-700"},
              ].map(k=>(
                <div key={k.label} className={"rounded-2xl p-4 text-white "+k.bg}>
                  <div className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">{k.label}</div>
                  <div className="text-2xl font-bold">{k.val}</div>
                  <div className="text-xs opacity-60 mt-1">{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Topologie simplifiée */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-4">Network Overview</h3>
              <div className="flex items-center gap-4 overflow-x-auto pb-2">
                {/* Cluster */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className="w-16 h-16 bg-blue-50 border-2 border-blue-200 rounded-xl flex items-center justify-center">
                    <Server size={24} className="text-blue-500"/>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">Cluster</span>
                  <span className="text-xs text-gray-400">{hosts.length} hosts</span>
                </div>
                {/* Flèches */}
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <div className="w-12 h-1.5 bg-gradient-to-r from-blue-400 to-blue-200 rounded-full"/>
                    <div className="w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-8 border-l-blue-400"/>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-12 h-1.5 bg-gradient-to-r from-orange-300 to-orange-100 rounded-full"/>
                    <div className="w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-8 border-l-orange-300"/>
                  </div>
                </div>
                {/* Switches */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {allVSwitches.length>0&&(
                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 text-xs">
                      <div className="font-semibold text-blue-700">vSwitch ({allVSwitches.length})</div>
                      <div className="text-blue-500">{[...new Set(allVSwitches.map(s=>s.name))].slice(0,2).join(", ")}</div>
                    </div>
                  )}
                  {allDvSwitches.length>0&&(
                    <div className="bg-violet-50 border border-violet-200 rounded-lg px-3 py-1.5 text-xs">
                      <div className="font-semibold text-violet-700">dvSwitch ({allDvSwitches.length})</div>
                      <div className="text-violet-500">{allDvSwitches[0]?.name}</div>
                    </div>
                  )}
                </div>
                {/* Flèche vers segments */}
                <div className="flex items-center flex-shrink-0">
                  <div className="w-8 h-px bg-gray-300"/>
                  <div className="w-0 h-0 border-t-3 border-t-transparent border-b-3 border-b-transparent border-l-6 border-l-gray-300"/>
                </div>
                {/* Segments */}
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {[...new Set(allVlans.map(v=>v.name))].slice(0,4).map(name=>{
                    const style = getNetworkSegmentStyle(name);
                    return (
                      <div key={name} className={"flex items-center gap-2 px-3 py-1 rounded-lg border text-xs "+style.bg+" border-"+style.text.replace("text-","")}>
                        <Network size={10} className={style.text}/>
                        <span className={"font-medium "+style.text}>{name.length>20?name.substring(0,20)+"...":name}</span>
                      </div>
                    );
                  })}
                  {allPGs.slice(0,3).filter(pg=>!allVlans.find(v=>v.name===pg.portGroup)).map((pg,i)=>{
                    const style = getNetworkSegmentStyle(pg.portGroup);
                    return (
                      <div key={i} className={"flex items-center gap-2 px-3 py-1 rounded-lg text-xs "+style.bg}>
                        <Network size={10} className={style.text}/>
                        <span className={"font-medium "+style.text}>{pg.portGroup.length>20?pg.portGroup.substring(0,20)+"...":pg.portGroup}</span>
                        {pg.vlan!==null&&pg.vlan!==undefined&&<span className="text-gray-400">VLAN {pg.vlan}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Host NICs */}
            {hostsNics.length>0&&(
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-4">Host Network Usage</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {hostsNics.map((h,i)=>(
                    <div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 flex-shrink-0"><NetworkNodeVisual/></div>
                        <div className="flex-1">
                          <div className="text-sm font-bold text-gray-800">{h.name}</div>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span>{h.nics||0} NICs physiques</span>
                            {h.vSwitches&&h.vSwitches.length>0&&<span>· {h.vSwitches.join(", ")}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {Array.from({length:Math.min(h.nics||0,4)},(_,j)=>(
                          <div key={j} className="bg-white rounded-lg p-2 border border-gray-100">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-mono text-gray-600">vmnic{j}</span>
                              <span className="text-gray-400">10Gb</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-400 rounded-full" style={{width:Math.round(20+Math.random()*40)+"%"}}/>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Network Segments */}
            {(allVlans.length>0||allPGs.length>0)&&(
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-4">Network Segments ({allVlans.length||allPGs.length})</h3>
                <div className="space-y-2">
                  {(allVlans.length>0?allVlans:allPGs.map(p=>({name:p.portGroup,vlan:p.vlan,switch:p.switch}))).map((seg,i)=>{
                    const style = getNetworkSegmentStyle(seg.name);
                    return (
                      <div key={i} className={"flex items-center gap-3 p-3 rounded-xl border "+style.bg+" border-gray-100"}>
                        <div className={"w-8 h-8 rounded-lg flex items-center justify-center "+style.bg}>
                          <Network size={14} className={style.text}/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-gray-800 truncate">{seg.name}</span>
                            <span className={"text-xs px-2 py-0.5 rounded-full font-semibold "+style.bg+" "+style.text}>{style.label}</span>
                          </div>
                          <div className="text-xs text-gray-400 font-mono">
                            {seg.vlan!==null&&seg.vlan!==undefined?"VLAN "+seg.vlan:"Trunk"} · {seg.switch||"N/A"}
                            {seg.ports?" · "+seg.ports+" ports":""}
                          </div>
                        </div>
                        {seg.speed&&<div className="text-xs font-bold text-gray-600 whitespace-nowrap">{seg.speed} Gbps</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* vSwitches */}
            {allVSwitches.length>0&&(
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-4">vSwitches ({allVSwitches.length})</h3>
                <div className="space-y-3">
                  {allVSwitches.map((sw,i)=>(
                    <div key={i} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-sm font-bold text-gray-800">{sw.name}</span>
                          <span className="text-xs text-gray-400 ml-2">{sw.host}</span>
                        </div>
                        <span className="text-xs font-mono text-gray-500">MTU {sw.mtu}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(sw.portGroups||[]).map((pg,j)=>{
                          const style = getNetworkSegmentStyle(pg.name);
                          return (
                            <span key={j} className={"text-xs px-2 py-0.5 rounded-full font-mono "+style.bg+" "+style.text}>
                              {pg.name}{pg.vlan!==null&&pg.vlan!==undefined?" ("+pg.vlan+")":""}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* dvSwitches */}
            {allDvSwitches.length>0&&(
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-4">Distributed vSwitches ({allDvSwitches.length})</h3>
                {allDvSwitches.map((dv,i)=>(
                  <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <div className="text-sm font-semibold text-gray-800">{dv.name} <span className="text-xs text-gray-400">v{dv.version}</span></div>
                      <div className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{dv.hosts}</div>
                    </div>
                    <div className="text-right text-xs text-gray-500 font-mono">
                      <div>{dv.vms} VMs · {dv.ports} ports</div>
                      <div>MTU {dv.mtu}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {allVlans.length===0&&allVSwitches.length===0&&allDvSwitches.length===0&&(
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center py-12">
                <div className="text-gray-400 text-sm">Aucune donnee reseau detectee</div>
              </div>
            )}
          </div>
        );
      })()}

      {activeTab==="optimization"&&(()=>{
        const od = optimizationData||{};
        const score = od.score||0;
        const scoreColor = score>=80?"text-emerald-500":score>=60?"text-amber-500":"text-red-500";
        const scoreBg = score>=80?"bg-emerald-500":score>=60?"bg-amber-500":"bg-red-500";
        const statusLabel = score>=80?"Sain":score>=60?"Warning":"Critique";
        const recs = od.recommendations||[];
        const qw = od.quickWins||[];
        const risks = od.risks||[];
        const savings = od.savings||{};
        const catColors = {
          cleanup:"bg-green-100 text-green-700",
          balancing:"bg-blue-100 text-blue-700",
          risk:"bg-red-100 text-red-700",
          rightsizing:"bg-orange-100 text-orange-700",
          consolidation:"bg-violet-100 text-violet-700",
        };
        const sevColors = {
          critical:"border-red-200 bg-red-50/30",
          high:"border-orange-200 bg-orange-50/20",
          medium:"border-amber-200 bg-amber-50/10",
          low:"border-gray-100 bg-gray-50",
        };
        const effortColors = {low:"bg-emerald-100 text-emerald-700",medium:"bg-amber-100 text-amber-700",high:"bg-red-100 text-red-700"};

        return (
          <div className="space-y-4">
            {/* Score + KPIs */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Score */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center">
                <div className="text-sm font-semibold text-gray-500 mb-3">Optimization Score</div>
                <div className="relative w-32 h-32 mb-3">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="10"/>
                    <circle cx="50" cy="50" r="40" fill="none" stroke={score>=80?"#10b981":score>=60?"#f59e0b":"#ef4444"} strokeWidth="10"
                      strokeDasharray={`${score*2.51} 251`} strokeLinecap="round"/>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={"text-3xl font-bold "+scoreColor}>{score}</span>
                    <span className="text-xs text-gray-400">/ 100</span>
                  </div>
                </div>
                <div className={"text-sm font-bold "+scoreColor}>{statusLabel}</div>
                <div className="text-xs text-gray-400 mt-1">{od.optimizationPotentialPercent||0}% d optimisation possible</div>
              </div>
              {/* KPIs */}
              <div className="lg:col-span-3 grid grid-cols-2 gap-3">
                {[
                  {label:"VMs inactives",     val:od.idleVmCount||0,    sub:"depuis +20 jours",      icon:"🔴", bg:"bg-red-50",   text:"text-red-600"},
                  {label:"Total VMs",          val:od.totalVmCount||0,   sub:"inventaire complet",    icon:"🖥️", bg:"bg-blue-50",  text:"text-blue-600"},
                  {label:"Hosts en tension",   val:risks.length,         sub:"RAM ou CPU critique",   icon:"⚠️", bg:"bg-amber-50", text:"text-amber-600"},
                  {label:"Recommandations",    val:recs.length,          sub:"actions identifiees",   icon:"💡", bg:"bg-violet-50",text:"text-violet-600"},
                ].map(k=>(
                  <div key={k.label} className={"rounded-xl p-4 "+k.bg}>
                    <div className="text-lg mb-1">{k.icon}</div>
                    <div className={"text-2xl font-bold "+k.text}>{k.val}</div>
                    <div className="text-xs font-semibold text-gray-700 mt-0.5">{k.label}</div>
                    <div className="text-xs text-gray-400">{k.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Wins + Savings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Quick Wins */}
              {qw.length>0&&(
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="text-sm font-bold text-gray-800 mb-3">Quick Wins</h3>
                  <div className="space-y-3">
                    {qw.map(q=>(
                      <div key={q.id} className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Zap size={14} className="text-emerald-600"/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-gray-800">{q.title}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{q.description}</div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs font-semibold text-emerald-600">{q.gain}</span>
                            <span className={"text-xs px-2 py-0.5 rounded-full font-medium "+(effortColors[q.effortLevel]||effortColors.medium)}>
                              Effort {q.effortLevel}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Potential Savings */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-3">Potential Savings</h3>
                <div className="space-y-3">
                  {[
                    {label:"CPU recuperable",     val:(savings.reclaimableCpu||0)+" vCPU",     color:"text-blue-600",   bg:"bg-blue-50"},
                    {label:"RAM recuperable",      val:(savings.reclaimableRamGb||0)+" Go",      color:"text-orange-500", bg:"bg-orange-50"},
                    {label:"Stockage recuperable", val:(savings.reclaimableStorageTb||0)+" To",  color:"text-emerald-600",bg:"bg-emerald-50"},
                    {label:"Reduction hosts",      val:savings.potentialHostReduction>0?(savings.potentialHostReduction+" host(s)"):"Aucune",color:"text-violet-600",bg:"bg-violet-50"},
                  ].map(k=>(
                    <div key={k.label} className={"flex items-center justify-between p-3 rounded-xl "+k.bg}>
                      <span className="text-sm text-gray-600">{k.label}</span>
                      <span className={"text-lg font-bold "+k.color}>{k.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {recs.length>0&&(
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-3">Recommendations</h3>
                <div className="space-y-3">
                  {recs.map(r=>(
                    <div key={r.id} className={"flex items-start gap-4 p-4 rounded-xl border "+( sevColors[r.severity]||sevColors.low)}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={"text-xs px-2 py-0.5 rounded-full font-semibold "+(catColors[r.category]||catColors.cleanup)}>{r.category}</span>
                          <span className="text-sm font-bold text-gray-800">{r.title}</span>
                        </div>
                        <div className="text-xs text-gray-500 mb-2">{r.description}</div>
                        <div className="text-xs text-gray-600 font-medium">{"→ "+r.recommendation}</div>
                        {(r.estimatedGainCpu>0||r.estimatedGainRam>0||r.estimatedGainStorage>0)&&(
                          <div className="flex gap-3 mt-2">
                            {r.estimatedGainCpu>0&&<span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{r.estimatedGainCpu} vCPU</span>}
                            {r.estimatedGainRam>0&&<span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">{r.estimatedGainRam} Go RAM</span>}
                            {r.estimatedGainStorage>0&&<span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{r.estimatedGainStorage} To</span>}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 whitespace-nowrap">{r.affectedObjectsCount} objet(s)</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risks */}
            {risks.length>0&&(
              <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-3">Risks</h3>
                <div className="space-y-2">
                  {risks.map(r=>(
                    <div key={r.id} className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
                      <AlertTriangle size={15} className="text-red-500 flex-shrink-0 mt-0.5"/>
                      <div>
                        <div className="text-sm font-bold text-gray-800">{r.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{r.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recs.length===0&&qw.length===0&&risks.length===0&&(
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center py-12">
                <div className="text-4xl mb-3">✅</div>
                <div className="text-sm font-semibold text-gray-700">Infrastructure saine</div>
                <div className="text-xs text-gray-400 mt-1">Aucune recommandation d optimisation identifiee</div>
              </div>
            )}
          </div>
        );
      })()}

      {activeTab==="vms"&&(
        <div className="space-y-4">
          {osDistrib.length>0&&(
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-4">Distribution OS ({osDistrib.reduce((s,[,c])=>s+c,0)} VMs)</h3>
              <div className="space-y-3">
                {osDistrib.map(([os,count])=>{
                  const total=osDistrib.reduce((s,[,c])=>s+c,0);
                  const pct=Math.round(count/total*100);
                  const isWin=os.toLowerCase().includes("windows");
                  const isUbu=os.toLowerCase().includes("ubuntu");
                  const isDeb=os.toLowerCase().includes("debian");
                  const isLin=os.toLowerCase().includes("linux")||os.toLowerCase().includes("centos")||os.toLowerCase().includes("rocky");
                  const barColor=isWin?"bg-blue-500":isUbu?"bg-orange-400":isDeb?"bg-rose-500":isLin?"bg-orange-300":"bg-gray-400";
                  const textColor=isWin?"text-blue-600":isUbu?"text-orange-500":isDeb?"text-rose-500":isLin?"text-orange-400":"text-gray-500";
                  return (
                    <div key={os} className="flex items-center gap-3">
                      <div className="flex-shrink-0"><OsIcon os={os}/></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-gray-700 font-medium truncate">{os}</span>
                          <span className={textColor+" font-semibold ml-2 whitespace-nowrap"}>{count} VM{count>1?"s":""} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={"h-full rounded-full "+barColor} style={{width:pct+"%"}}/>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {vmOffList.length>0&&(
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-1">VMs eteintes ({vmOffList.length})</h3>
              <p className="text-xs text-gray-400 mb-4">Ressources recuperables si decommissionnement</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["Nom VM","Host","vCPU","RAM","Derniere MAJ","Statut"].map(col=>(
                        <th key={col} className="text-left py-2 px-2 text-gray-400 font-semibold uppercase tracking-wide">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vmOffList.map((v,i)=>(
                      <tr key={i} className={"border-b border-gray-50 "+(i%2===0?"":"bg-gray-50/50")}>
                        <td className="py-2 px-2 font-semibold text-gray-800">{v.name}</td>
                        <td className="py-2 px-2 text-gray-500">{v.host}</td>
                        <td className="py-2 px-2 font-mono text-gray-600">{v.cpu}</td>
                        <td className="py-2 px-2 font-mono text-gray-600">{v.ramGo} Go</td>
                        <td className="py-2 px-2 text-gray-500">{v.powerOn?new Date(v.powerOn).toLocaleDateString("fr-FR"):v.creationDate?new Date(v.creationDate).toLocaleDateString("fr-FR"):"Jamais"}</td>
                        <td className="py-2 px-2">
                          {v.daysSince===null?<span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Jamais</span>
                          :v.daysSince>20?<span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-medium">{v.daysSince}j</span>
                          :<span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">{v.daysSince}j</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {vmOffList.length===0&&osDistrib.length===0&&(
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center py-12">
              <div className="text-gray-400 text-sm">Aucune donnee VM disponible</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
