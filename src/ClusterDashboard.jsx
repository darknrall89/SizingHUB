import { useState } from "react";
import {
  Server, Cpu, HardDrive, AlertTriangle, Shield,
  CheckCircle, AlertCircle, Info, TrendingDown,
  Activity, Database, Network, Settings, MemoryStick, Zap
} from "lucide-react";
import NetworkFabric from "./components/network/NetworkFabric.jsx";



const GlobalClusterMiniMetric = ({icon, value, label}) => {
  const icons = {
    hosts: "▦",
    vm: "▣",
    cpu: "⚙",
    ram: "▤",
    storage: "◉",
  };

  return (
    <div className="flex items-center gap-3 min-w-[120px]">
      <div className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-600 text-sm shadow-sm">
        {icons[icon] || "▦"}
      </div>
      <div>
        <div className="text-lg font-semibold text-slate-900 leading-tight">{value}</div>
        <div className="text-xs text-slate-500 leading-tight">{label}</div>
      </div>
    </div>
  );
};


const GlobalClusterStackIcon = () => (
  <div className="w-36 h-36 rounded-[28px] border border-slate-100 bg-white flex items-center justify-center shadow-sm shrink-0">
    <svg viewBox="0 0 120 120" className="w-24 h-24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="23" y="22" width="74" height="20" rx="6" fill="#1E293B"/>
      <rect x="23" y="50" width="74" height="20" rx="6" fill="#334155"/>
      <rect x="23" y="78" width="74" height="20" rx="6" fill="#475569"/>
      <circle cx="35" cy="32" r="3" fill="#34D399"/>
      <circle cx="46" cy="32" r="3" fill="#60A5FA"/>
      <rect x="60" y="29" width="24" height="5" rx="2.5" fill="#CBD5E1"/>
      <circle cx="35" cy="60" r="3" fill="#34D399"/>
      <circle cx="46" cy="60" r="3" fill="#60A5FA"/>
      <rect x="60" y="57" width="24" height="5" rx="2.5" fill="#CBD5E1"/>
      <circle cx="35" cy="88" r="3" fill="#34D399"/>
      <circle cx="46" cy="88" r="3" fill="#60A5FA"/>
      <rect x="60" y="85" width="24" height="5" rx="2.5" fill="#CBD5E1"/>
    </svg>
  </div>
);


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
    <div className="text-3xl font-medium tracking-tight">{fmt(value)}</div>
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
      <div className={"text-lg font-medium "+(color==="blue"?"text-blue-700":"text-orange-700")}>{fmt(value)}</div>
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
          <span className={"text-sm font-medium "+(hasWarning?"text-red-500":"text-gray-700")}>
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

// ── Top CPU Consumers ────────────────────────────────────────────────────────
const getCpuInsight = (vcpu, readinessPct, isOverprovisioned, avgVcpu) => {
  if (isOverprovisioned) return {label:"Surprovisionnee", sub:"vCPU eleve / usage faible", color:"text-blue-500", dot:"bg-blue-400"};
  if (readinessPct>10)   return {label:"Contention CPU",  sub:"Readiness "+readinessPct+"% — attente CPU", color:"text-red-600",    dot:"bg-red-500"};
  if (readinessPct>5)    return {label:"Sous pression",   sub:"Readiness "+readinessPct+"% — a surveiller", color:"text-orange-500", dot:"bg-orange-400"};
  if (vcpu>avgVcpu*1.5)  return {label:"Eleve",           sub:"Au-dessus de la moyenne",  color:"text-amber-500",  dot:"bg-amber-400"};
  return                        {label:"Normal",           sub:"Utilisation normale",       color:"text-emerald-600", dot:"bg-emerald-500"};
};

const TopCpuConsumersBlock = ({ consumers = [], totalVcpu = 0 }) => {
  if (!consumers.length) return null;

  const top = consumers.slice(0, 8);
  const totalTop = top.reduce((s,v)=>s+(Number(v.vcpu)||0),0);
  const topPct = totalVcpu > 0 ? Math.round((totalTop / totalVcpu) * 100) : 0;

  const oversized = top.filter(v=>v.isOverprovisioned).length;
  const potentialGain = top
    .filter(v=>v.isOverprovisioned)
    .reduce((s,v)=>s+Math.max(0, (Number(v.vcpu)||0)-4),0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Top VMs — Consommation CPU</h3>
          <p className="text-xs text-gray-400 mt-1">
            Analyse basée sur l’allocation vCPU issue de RVTools
          </p>
        </div>
      </div>

      <div className="mx-5 mb-4 rounded-2xl border border-gray-100 bg-gray-50 grid grid-cols-1 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 overflow-hidden">
        <div className="p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 text-xl">⚙️</div>
          <div>
            <div className="text-2xl font-semibold text-blue-600">{top.length} VMs</div>
            <div className="text-sm text-gray-600">représentent</div>
            <div className="text-sm font-medium text-gray-800">{topPct}% des vCPU alloués</div>
            <div className="text-xs text-gray-400">({totalTop} vCPU / {totalVcpu} vCPU)</div>
          </div>
        </div>

        <div className="p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 text-xl">↗</div>
          <div>
            <div className="text-2xl font-semibold text-emerald-600">{totalTop} vCPU</div>
            <div className="text-sm text-gray-600">alloués par ces VMs</div>
            <div className="text-xs text-gray-400">sur {totalVcpu} vCPU total</div>
          </div>
        </div>

        <div className="p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 text-xl">⚠️</div>
          <div>
            <div className="text-2xl font-semibold text-amber-600">{oversized} VMs</div>
            <div className="text-sm text-gray-600">potentiellement</div>
            <div className="text-sm font-medium text-gray-800">surdimensionnées</div>
          </div>
        </div>

        <div className="p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 text-xl">💾</div>
          <div>
            <div className="text-2xl font-semibold text-purple-600">-{potentialGain} vCPU</div>
            <div className="text-sm text-gray-600">gain potentiel estimé</div>
            <div className="text-xs text-gray-400">{totalVcpu>0 ? Math.round((potentialGain/totalVcpu)*100) : 0}% des vCPU</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 px-5 py-3 bg-gray-50 border-y border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
        <div className="col-span-1">Rang</div>
        <div className="col-span-4">VM / OS</div>
        <div className="col-span-2">Host</div>
        <div className="col-span-3">vCPU alloués</div>
        <div className="col-span-2">Statut</div>
      </div>

      <div className="divide-y divide-gray-100">
        {top.map((vm, i)=>(
          <div key={vm.id || vm.name || i} className="grid grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-gray-50/70 transition">
            <div className="col-span-1">
              <div className={
                "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium " +
                (i===0 ? "bg-yellow-300 text-gray-900" : i===1 ? "bg-gray-200 text-gray-700" : i===2 ? "bg-orange-300 text-gray-900" : "bg-gray-100 text-gray-500")
              }>
                {i+1}
              </div>
            </div>

            <div className="col-span-4 flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-blue-100 grid grid-cols-2 gap-1 p-1 flex-shrink-0">
                <span className="bg-blue-500 rounded-sm"/><span className="bg-blue-400 rounded-sm"/>
                <span className="bg-blue-400 rounded-sm"/><span className="bg-blue-500 rounded-sm"/>
              </div>
              <div className="min-w-0">
                <div className="font-medium text-gray-900 truncate">{vm.name}</div>
                <div className="text-xs text-gray-400 truncate">{vm.os || "OS non renseigné"}</div>
              </div>
            </div>

            <div className="col-span-2 text-blue-600 text-xs font-medium truncate">{vm.hostName || vm.host || "N/A"}</div>

            <div className="col-span-3">
              <div className="text-sm font-semibold text-gray-900">{vm.vcpu} vCPU</div>
              <div className="h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{width:Math.min(100, (Number(vm.vcpu)||0)*8)+"%"}}/>
              </div>
            </div>

            <div className="col-span-2">
              {vm.isOverprovisioned ? (
                <>
                  <div className="text-xs font-medium text-amber-600">● À optimiser</div>
                  <div className="text-xs text-gray-400 mt-1 truncate">vCPU élevé</div>
                </>
              ) : (
                <>
                  <div className="text-xs font-medium text-emerald-600">● Allocation standard</div>
                  <div className="text-xs text-gray-400 mt-1 truncate">Aucune alerte</div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="m-5 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-5 text-sm text-gray-600">
          <span className="font-medium text-gray-800">💡 Insights CPU</span>
          <span>⚡ {top.length} VMs utilisent {topPct}% des vCPU alloués</span>
          <span>⚠️ {oversized} VMs potentiellement surdimensionnées</span>
          <span>↗ Gain potentiel : -{potentialGain} vCPU</span>
        </div>

        <button className="px-4 py-2 rounded-lg border border-blue-200 bg-white text-blue-600 text-sm font-medium hover:bg-blue-50 transition">
          Voir les recommandations
        </button>
      </div>
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
  return <div className={"w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium flex-shrink-0 "+cls}>{rank}</div>;
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
        <span className="text-xs font-medium" style={{color}}>{pct}%</span>
      </div>
    </div>
  );
};

const TopMemoryConsumersBlock = ({ consumers = [], totalAllocatedRam = 0 }) => {
  if (!consumers.length) return null;

  const top = consumers.slice(0, 8);
  const topRamSum = top.reduce((s,v)=>s+(Number(v.allocatedRamGb)||0),0);
  const topPct = totalAllocatedRam > 0 ? Math.round((topRamSum / totalAllocatedRam) * 100) : 0;

  const highRam = top.filter(v=>(Number(v.allocatedRamGb)||0) >= 32).length;
  const critical = top.filter(v=>(Number(v.usagePercent)||0) >= 80).length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-4">
        <h3 className="text-lg font-semibold text-gray-900">Top VMs — principales consommatrices mémoire</h3>
        <p className="text-xs text-gray-400 mt-1">
          Analyse basée sur l’allocation RAM issue de RVTools
        </p>
      </div>

      <div className="mx-5 mb-4 rounded-2xl border border-gray-100 bg-gray-50 grid grid-cols-1 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 overflow-hidden">
        <div className="p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 text-xl">▣</div>
          <div>
            <div className="text-2xl font-semibold text-purple-600">{top.length} VMs</div>
            <div className="text-sm text-gray-600">représentent</div>
            <div className="text-sm font-medium text-gray-800">{topPct}% de la RAM allouée</div>
            <div className="text-xs text-gray-400">({topRamSum} GB / {totalAllocatedRam} GB)</div>
          </div>
        </div>

        <div className="p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 text-xl">↗</div>
          <div>
            <div className="text-2xl font-semibold text-emerald-600">{topRamSum} GB</div>
            <div className="text-sm text-gray-600">RAM allouée</div>
            <div className="text-xs text-gray-400">sur {totalAllocatedRam} GB total</div>
          </div>
        </div>

        <div className="p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 text-xl">⚠️</div>
          <div>
            <div className="text-2xl font-semibold text-amber-600">{highRam} VMs</div>
            <div className="text-sm text-gray-600">fortement</div>
            <div className="text-sm font-medium text-gray-800">dimensionnées</div>
          </div>
        </div>

        <div className="p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600 text-xl">●</div>
          <div>
            <div className="text-2xl font-semibold text-red-600">{critical}</div>
            <div className="text-sm text-gray-600">VMs avec</div>
            <div className="text-sm font-medium text-gray-800">RAM élevée</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 px-5 py-3 bg-gray-50 border-y border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
        <div className="col-span-1">Rang</div>
        <div className="col-span-4">VM / OS</div>
        <div className="col-span-2">Host</div>
        <div className="col-span-3">RAM allouée</div>
        <div className="col-span-2">Statut</div>
      </div>

      <div className="divide-y divide-gray-100">
        {top.map((vm, i)=> {
          const ram = Number(vm.allocatedRamGb)||0;
          const usage = Number(vm.usagePercent)||0;

          const isCritical = usage >= 80;
          const isLarge = ram >= 32;

          return (
            <div key={vm.id || vm.name || i} className="grid grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-gray-50/70 transition">
              <div className="col-span-1">
                <div className={
                  "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium " +
                  (i===0 ? "bg-yellow-300 text-gray-900" : i===1 ? "bg-gray-200 text-gray-700" : i===2 ? "bg-orange-300 text-gray-900" : "bg-gray-100 text-gray-500")
                }>
                  {i+1}
                </div>
              </div>

              <div className="col-span-4 flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-purple-100 grid grid-cols-2 gap-1 p-1 flex-shrink-0">
                  <span className="bg-purple-500 rounded-sm"/><span className="bg-purple-400 rounded-sm"/>
                  <span className="bg-purple-400 rounded-sm"/><span className="bg-purple-500 rounded-sm"/>
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 truncate">{vm.name}</div>
                  <div className="text-xs text-gray-400 truncate">{vm.os || "OS non renseigné"}</div>
                </div>
              </div>

              <div className="col-span-2 text-blue-600 text-xs font-medium truncate">{vm.hostName || vm.host || "N/A"}</div>

              <div className="col-span-3">
                <div className="text-sm font-medium text-gray-900">{ram} GB</div>
                <div className="h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
                  <div
                    className={"h-full rounded-full "+(isCritical?"bg-red-400":isLarge?"bg-amber-400":"bg-purple-500")}
                    style={{width:Math.min(100, totalAllocatedRam>0 ? (ram/totalAllocatedRam)*100*3 : ram*2)+"%"}}
                  />
                </div>
              </div>

              <div className="col-span-2">
                {isCritical ? (
                  <>
                    <div className="text-xs font-medium text-red-600">● RAM élevée</div>
                    <div className="text-xs text-gray-400 mt-1 truncate">À vérifier</div>
                  </>
                ) : isLarge ? (
                  <>
                    <div className="text-xs font-medium text-amber-600">● À analyser</div>
                    <div className="text-xs text-gray-400 mt-1 truncate">Forte allocation</div>
                  </>
                ) : (
                  <>
                    <div className="text-xs font-medium text-emerald-600">● Allocation standard</div>
                    <div className="text-xs text-gray-400 mt-1 truncate">Aucune alerte</div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="m-5 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 flex flex-wrap items-center gap-5 text-sm text-gray-600">
        <span className="font-medium text-gray-800">💡 Insights mémoire</span>
        <span>▣ {top.length} VMs utilisent {topPct}% de la RAM allouée</span>
        <span>⚠️ {highRam} VMs fortement dimensionnées</span>
        <span>● {critical} VMs avec usage élevé</span>
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

// ── Focus Réseau Nœud ────────────────────────────────────────────────────────


function FocusReseauNoeud({ vmkRows=[], hostsNics=[], claudeInsights=null }) {
  const hostsList = [...new Set([
    ...hostsNics.map(h=>h.name).filter(Boolean),
    ...vmkRows.map(v=>v.host).filter(Boolean)
  ])];

  const [selHost, setSelHost] = useState(hostsList[0] || "");

  const hostVmks = vmkRows.filter(v => v.host === selHost);
  const hostNic  = hostsNics.find(h => h.name === selHost);

  const getRole = (vmk) => {
    const n = ((vmk.portGroup||"")+" "+(vmk.device||"")).toLowerCase();

    if (n.includes("management") || n.includes("mgmt") || n.includes("admin") || n.includes("adm") || n.includes("vmk0")) return "Management";
    if (n.includes("vmotion") || n.includes("v-motion") || n.includes("v motion")) return "vMotion";
    if (n.includes("iscsi") || n.includes("san") || n.includes("nfs") || n.includes("storage")) return "Storage";
    return "Autres";
  };

  const cidr = (mask) => {
    if (!mask) return null;
    if (String(mask).startsWith("/")) return String(mask);
    const parts = String(mask).split(".").map(Number);
    if (parts.length !== 4 || parts.some(Number.isNaN)) return null;
    return "/" + parts.reduce((a,b)=>a+b.toString(2).split("").filter(c=>c==="1").length,0);
  };

  const grouped = {
    Management: hostVmks.filter(v => getRole(v) === "Management"),
    vMotion: hostVmks.filter(v => getRole(v) === "vMotion"),
    Storage: hostVmks.filter(v => getRole(v) === "Storage"),
    Autres: hostVmks.filter(v => getRole(v) === "Autres"),
  };

  const storageMtuWarn = grouped.Storage.some(v => v.mtu && Number(v.mtu) < 9000);

  const groupConfig = {
    Management: {
      title: "VMkernel Management",
      color: "emerald",
      icon: Shield,
      empty: "Aucune interface Management détectée",
    },
    vMotion: {
      title: "VMkernel vMotion",
      color: "violet",
      icon: Activity,
      empty: "Aucune interface vMotion détectée",
    },
    Storage: {
      title: "VMkernel Stockage",
      color: "orange",
      icon: Database,
      empty: "Aucune interface stockage détectée",
    },
    Autres: {
      title: "Autres",
      color: "blue",
      icon: Network,
      empty: "Aucune autre interface VMkernel détectée",
    },
  };

  const colorClasses = {
    emerald: {
      box: "border-emerald-100",
      header: "bg-emerald-50 border-emerald-100",
      text: "text-emerald-700",
      iconBox: "bg-white border-emerald-200",
      icon: "text-emerald-600",
    },
    violet: {
      box: "border-violet-100",
      header: "bg-violet-50 border-violet-100",
      text: "text-violet-700",
      iconBox: "bg-white border-violet-200",
      icon: "text-violet-600",
    },
    orange: {
      box: "border-orange-100",
      header: "bg-orange-50 border-orange-100",
      text: "text-orange-700",
      iconBox: "bg-white border-orange-200",
      icon: "text-orange-600",
    },
    blue: {
      box: "border-blue-100",
      header: "bg-blue-50 border-blue-100",
      text: "text-blue-700",
      iconBox: "bg-white border-blue-200",
      icon: "text-blue-600",
    },
  };

  const VmKernelGroup = ({ type, rows }) => {
    const cfg = groupConfig[type];
    const cls = colorClasses[cfg.color];
    const Icon = cfg.icon;

    return (
      <div className={`rounded-2xl border ${cls.box} overflow-hidden`}>
        <div className={`flex items-center justify-between px-4 py-4 border-b ${cls.header}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${cls.iconBox}`}>
              <Icon size={18} className={cls.icon}/>
            </div>

            <div className={`text-base font-semibold ${cls.text}`}>
              {cfg.title}
            </div>
          </div>

          <div className="text-sm text-gray-500">
            {rows.length} interface{rows.length > 1 ? "s" : ""}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
                <colgroup>
                  <col className="w-[14%]" />
                  <col className="w-[28%]" />
                  <col className="w-[10%]" />
                  <col className="w-[20%]" />
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                </colgroup>
            <thead>
              <tr className="border-b border-gray-100 bg-white">
                {["Device","Port Group","VLAN","IP","Subnet","MTU"].map(h => (
                  <th key={h} className="text-left text-gray-400 font-semibold py-3 px-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-sm text-gray-400">
                    {type === "vMotion" && claudeInsights?.vmotion ? (
                      <div className="text-center py-2">
                        <div className="text-sm text-gray-400 mb-1">{cfg.empty}</div>
                        {claudeInsights.vmotion.note && (
                          <div className="inline-flex items-center gap-2 text-xs bg-violet-50 border border-violet-200 text-violet-700 rounded-lg px-3 py-1.5 mt-1">
                            <span>⚠️</span>
                            <span>{claudeInsights.vmotion.note}</span>
                          </div>
                        )}
                        {claudeInsights.vmotion.vlan !== null && claudeInsights.vmotion.vlan !== undefined && (
                          <div className="text-xs text-gray-400 mt-1">
                            VLAN inféré : <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{claudeInsights.vmotion.vlan}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span>{cfg.empty}</span>
                    )}
                  </td>
                </tr>
              ) : rows.map((vmk, i) => {
                const mtuWarn = type === "Storage" && vmk.mtu && Number(vmk.mtu) < 9000;

                return (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-blue-600 font-semibold whitespace-nowrap">{vmk.device || "—"}</td>
                    <td className="py-3 px-4 text-gray-800 whitespace-nowrap">{vmk.portGroup || "—"}</td>

                    <td className="py-3 px-4">
                      {vmk.vlan != null
                        ? <span className="font-mono bg-gray-100 px-2 py-1 rounded-lg text-gray-700">{vmk.vlan}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>

                    <td className="py-3 px-4 font-mono text-gray-900 whitespace-nowrap">{vmk.ip || "—"}</td>
                    <td className="py-3 px-4 font-mono text-gray-600 whitespace-nowrap">{cidr(vmk.subnet) || "—"}</td>

                    <td className="py-3 px-4">
                      {vmk.mtu
                        ? <span className={mtuWarn ? "text-orange-600 font-semibold" : "text-gray-700"}>
                            {vmk.mtu}{mtuWarn ? " ⚠" : ""}
                          </span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <Network size={24} className="text-blue-600"/>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900">Focus réseau nœud</h3>
            <p className="text-sm text-gray-400 mt-0.5">Interfaces VMkernel par host</p>
          </div>
        </div>

        <select
          value={selHost}
          onChange={e => setSelHost(e.target.value)}
          className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:border-blue-400"
        >
          {hostsList.map((h,i) => <option key={i} value={h}>{h}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-6">
        <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 p-6 flex flex-col justify-start">
          <div className="w-full h-24 mt-2 mb-8 flex items-center justify-center">
            <ServerRackVisual health="healthy"/>
          </div>

          <div className="text-xl font-semibold text-gray-900">
            {selHost || "Host"}
          </div>

          <div className="text-sm text-gray-400 mt-2">
            {(hostNic?.nics || 0)} NICs physiques · {hostVmks.length} VMkernel
          </div>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="rounded-xl bg-white border border-gray-100 p-3">
              <div className="text-xs text-gray-400">vSwitches</div>
              <div className="text-lg font-semibold text-blue-600">{(hostNic?.vSwitches||[]).length}</div>
            </div>

            <div className="rounded-xl bg-white border border-gray-100 p-3">
              <div className="text-xs text-gray-400">MTU warning</div>
              <div className={"text-lg font-semibold "+(storageMtuWarn?"text-amber-600":"text-emerald-600")}>
                {storageMtuWarn ? "Oui" : "Non"}
              </div>
            </div>
          </div>

          <div className="mt-5 inline-flex w-fit items-center px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold">
            Connectivité analysée
          </div>
        </div>

        <div className="space-y-4 xl:pt-10">
          <VmKernelGroup type="Management" rows={grouped.Management}/>
          <VmKernelGroup type="vMotion" rows={grouped.vMotion}/>
          <VmKernelGroup type="Storage" rows={grouped.Storage}/>
          <VmKernelGroup type="Autres" rows={grouped.Autres}/>
        </div>
      </div>

      {storageMtuWarn && (
        <div className="mt-5 flex items-center gap-3 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
          <AlertTriangle size={18}/>
          <span>MTU 1500 sur les interfaces iSCSI — jumbo frames MTU 9000 recommandés pour optimiser les performances stockage.</span>
        </div>
      )}
    </div>
  );
}


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

// ── Network Segments View ────────────────────────────────────────────────────
const SEGMENT_TYPES = [
  {id:"vmotion",    label:"vMotion",          desc:"Reseaux dedies au trafic vMotion",            color:"violet", match:n=>n.includes("vmotion")},
  {id:"management", label:"Management",        desc:"Reseaux de gestion et d administration",       color:"slate",  match:n=>n.includes("mgmt")||n.includes("management")||n.includes("adm")},
  {id:"storage",    label:"Storage Networks",  desc:"Reseaux dedies au stockage (iSCSI, NFS, FC...)",color:"emerald",match:n=>n.includes("storage")||n.includes("san")||n.includes("iscsi")||n.includes("nfs")},
  {id:"mirror",     label:"Mirror / Monitoring",desc:"Reseaux de monitoring / duplication de trafic",color:"orange", match:n=>n.includes("mirror")||n.includes("monitor")||n.includes("backup")},
  {id:"vm",         label:"VM Networks",       desc:"Reseaux utilises par les machines virtuelles", color:"blue",   match:()=>true},
];

const classifySegment = (name) => {
  const n = (name||"").toLowerCase();
  for (const t of SEGMENT_TYPES) {
    if (t.id!=="vm"&&t.match(n)) return t.id;
  }
  return "vm";
};

const TYPE_STYLES = {
  vmotion:    {bg:"bg-violet-50",  border:"border-violet-200", title:"text-violet-700",  badge:"bg-violet-100 text-violet-700",  icon:"text-violet-500"},
  management: {bg:"bg-slate-50",   border:"border-slate-200",  title:"text-slate-700",   badge:"bg-slate-100 text-slate-600",    icon:"text-slate-500"},
  storage:    {bg:"bg-emerald-50", border:"border-emerald-200",title:"text-emerald-700", badge:"bg-emerald-100 text-emerald-700",icon:"text-emerald-500"},
  mirror:     {bg:"bg-orange-50",  border:"border-orange-200", title:"text-orange-700",  badge:"bg-orange-100 text-orange-700",  icon:"text-orange-500"},
  vm:         {bg:"bg-blue-50",    border:"border-blue-200",   title:"text-blue-700",    badge:"bg-blue-100 text-blue-700",      icon:"text-blue-500"},
};


const NetworkSegmentsView = ({segments=[], totalHosts=0}) => {
  const [showAll, setShowAll] = useState({});

  const grouped = {};
  SEGMENT_TYPES.forEach(t=>{ grouped[t.id]=[]; });
  segments.forEach(seg=>{
    const type = classifySegment(seg.name);
    grouped[type].push(seg);
  });

  const totalSegs = segments.length;

  const getSegmentHostCount = (seg) => {
    if (Array.isArray(seg.hosts)) return seg.hosts.length;
    if (seg.hostCount !== undefined) return Number(seg.hostCount) || 0;
    if (seg.hostsCount !== undefined) return Number(seg.hostsCount) || 0;
    if (seg.host) return 1;
    return totalHosts || 0;
  };

  const getSegmentMtus = (seg) => {
    if (Array.isArray(seg.mtus)) return seg.mtus.filter(Boolean).map(Number);
    if (seg.mtu !== undefined && seg.mtu !== null) return [Number(seg.mtu)];
    return [];
  };

  const isOrphanSegment = (seg) => {
    const name = String(seg.name||"").toLowerCase();
    const ports = Number(seg.ports||0);
    const hostCount = getSegmentHostCount(seg);
    const hasUsageHint =
      name.includes("vmotion") ||
      name.includes("management") ||
      name.includes("mgmt") ||
      name.includes("iscsi") ||
      name.includes("nfs") ||
      name.includes("storage") ||
      name.includes("san") ||
      name.includes("backup") ||
      name.includes("veeam");

    return ports === 0 && hostCount === 0 && !hasUsageHint;
  };

  const getSegmentFindings = (seg) => {
    const findings = [];
    const hostCount = getSegmentHostCount(seg);
    const mtus = [...new Set(getSegmentMtus(seg))];

    if (seg.vlan===null || seg.vlan===undefined) {
      findings.push({type:"warning", label:"VLAN absent"});
    }

    if (mtus.length > 1) {
      findings.push({type:"warning", label:"MTU incohérent"});
    }

    if (totalHosts > 0 && hostCount > 0 && hostCount < totalHosts) {
      findings.push({type:"warning", label:`Couverture ${hostCount}/${totalHosts}`});
    }

    if (isOrphanSegment(seg)) {
      findings.push({type:"critical", label:"Segment orphelin"});
    }

    return findings;
  };

  const segmentFindings = segments.flatMap(seg => getSegmentFindings(seg));
  const mtuInconsistencies = segments.filter(seg => [...new Set(getSegmentMtus(seg))].length > 1).length;
  const partialCoverage = segments.filter(seg => {
    const c = getSegmentHostCount(seg);
    return totalHosts > 0 && c > 0 && c < totalHosts;
  }).length;
  const orphanSegments = segments.filter(isOrphanSegment).length;

  const inconsistencies = segments.filter(s=>s.vlan===null||s.vlan===undefined).length + mtuInconsistencies + partialCoverage + orphanSegments;

  const criticalTypes = SEGMENT_TYPES.filter(t=>["management","vmotion","storage"].includes(t.id));
  const optionalTypes = SEGMENT_TYPES.filter(t=>!["management","vmotion","storage","vm"].includes(t.id));
  const vmType = SEGMENT_TYPES.find(t=>t.id==="vm");

  const visibleOptionalTypes = optionalTypes.filter(t => (grouped[t.id]||[]).length > 0);

  const StatCard = ({label, value, sub, iconColor="text-blue-500"}) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
      <Network size={18} className={iconColor+" flex-shrink-0"}/>
      <div>
        <div className="text-xl font-semibold text-gray-900">{value}</div>
        <div className="text-xs font-semibold text-gray-600">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );

  const SegmentCard = ({t, compact=false}) => {
    const segs = grouped[t.id] || [];
    const style = TYPE_STYLES[t.id];
    const isExpanded = showAll[t.id];
    const displayed = isExpanded ? segs : segs.slice(0, compact ? 4 : 2);

    return (
      <div className={"rounded-2xl border "+style.bg+" "+style.border+" "+(compact?"p-4":"p-4")}>
        <div className="flex items-center justify-between mb-1">
          <div className={"text-sm font-semibold "+style.title}>{t.label}</div>
          <span className={"text-xs px-2 py-0.5 rounded-full font-semibold "+style.badge}>
            {segs.length} segment{segs.length>1?"s":""}
          </span>
        </div>

        <div className="text-xs text-gray-400 mb-3">{t.desc}</div>

        {segs.length===0 ? (
          <div className="rounded-xl bg-white/60 border border-white px-3 py-4 text-center">
            <Network size={22} className={style.icon+" opacity-30 mx-auto mb-2"}/>
            <div className="text-xs font-semibold text-gray-500">Non détecté</div>
            <div className="text-xs text-gray-400 mt-0.5">{t.desc.split("(")[0]}</div>
          </div>
        ) : (
          <div className={compact ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3" : "space-y-2"}>
            {displayed.map((seg,i)=>(
              <div key={i} className="bg-white rounded-xl p-3 border border-white/80 shadow-sm">
                <div className="flex items-start justify-between mb-1 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={"w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 "+style.badge.split(" ")[0]}>
                      <Network size={12} className={style.icon}/>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-gray-800 truncate">{seg.name}</div>
                      <div className="text-xs text-gray-400 truncate">{seg.switch||seg.vSwitchName||"N/A"}</div>
                    </div>
                  </div>

                  {seg.vlan!==null&&seg.vlan!==undefined&&(
                    <span className={"text-xs px-2 py-0.5 rounded-full font-mono font-semibold flex-shrink-0 "+style.badge}>
                      VLAN {seg.vlan===0?"0":seg.vlan}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"/>
                    {totalHosts}/{totalHosts} hosts
                  </span>
                  {seg.mtu&&<span>MTU {seg.mtu}</span>}
                  {seg.ports&&<span>{seg.ports} ports</span>}
                </div>

                {getSegmentFindings(seg).length>0&&(
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {getSegmentFindings(seg).map((f,idx)=>(
                      <span
                        key={idx}
                        className={
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold " +
                          (f.type==="critical"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-amber-50 text-amber-700 border-amber-200")
                        }
                      >
                        {f.type==="critical" ? "!" : "⚠"} {f.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {segs.length>(compact ? 4 : 2)&&(
          <button
            onClick={()=>setShowAll(s=>({...s,[t.id]:!s[t.id]}))}
            className={"text-xs font-semibold w-full text-center py-2 mt-2 "+style.title}
          >
            {isExpanded ? "Masquer ▲" : "Voir "+segs.length+" segments ▼"}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Network Segments ({totalSegs})</h3>
        <p className="text-xs text-gray-400">Vue logique des réseaux détectés</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Segments réseau" value={totalSegs} sub="détectés" iconColor="text-blue-500"/>
        <StatCard label="Management" value={(grouped.management||[]).length} sub="réseaux critiques" iconColor="text-slate-500"/>
        <StatCard label="vMotion" value={(grouped.vmotion||[]).length} sub="mobilité VMware" iconColor="text-violet-500"/>
        <StatCard label="Storage" value={(grouped.storage||[]).length} sub="iSCSI / NFS / SAN" iconColor="text-emerald-500"/>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          {inconsistencies===0
            ? <CheckCircle size={18} className="text-emerald-500 flex-shrink-0"/>
            : <AlertTriangle size={18} className="text-amber-500 flex-shrink-0"/>}
          <div>
            <div className={"text-xs font-semibold "+(inconsistencies===0?"text-emerald-600":"text-amber-600")}>Segmentation</div>
            <div className={"text-xl font-semibold "+(inconsistencies===0?"text-emerald-600":"text-amber-600")}>
              {inconsistencies===0?"OK":"⚠"}
            </div>
            <div className="text-xs text-gray-400">{inconsistencies===0?"Aucune incohérence":inconsistencies+" à vérifier"}</div>
          </div>
        </div>
      </div>

      <div className={"flex items-center justify-between p-3 rounded-2xl border "+(inconsistencies===0?"bg-blue-50 border-blue-100":"bg-amber-50 border-amber-100")}>
        <div className="flex items-center gap-2">
          <Info size={14} className={inconsistencies===0?"text-blue-500":"text-amber-500"}/>
          <div>
            <div className={"text-xs font-semibold "+(inconsistencies===0?"text-blue-700":"text-amber-700")}>
              {inconsistencies===0 ? "Tous les segments sont présents sur "+totalHosts+"/"+totalHosts+" hosts." : "Des incohérences ont été détectées."}
            </div>
            <div className="text-xs text-gray-500">
              {inconsistencies===0 ? "Bonne couverture réseau sur l’ensemble du cluster." : inconsistencies+" segment(s) présentent des problèmes."}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-widest text-gray-400">MTU</div>
          <div className={"text-lg font-semibold mt-1 "+(mtuInconsistencies===0?"text-emerald-600":"text-amber-600")}>
            {mtuInconsistencies===0 ? "Cohérent" : mtuInconsistencies+" incohérence(s)"}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-widest text-gray-400">Couverture</div>
          <div className={"text-lg font-semibold mt-1 "+(partialCoverage===0?"text-emerald-600":"text-amber-600")}>
            {partialCoverage===0 ? "Complète" : partialCoverage+" partielle(s)"}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-widest text-gray-400">Segments orphelins</div>
          <div className={"text-lg font-semibold mt-1 "+(orphanSegments===0?"text-emerald-600":"text-red-600")}>
            {orphanSegments===0 ? "Aucun" : orphanSegments+" détecté(s)"}
          </div>
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-3">
          Réseaux infrastructure critiques
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {criticalTypes.map(t=><SegmentCard key={t.id} t={t}/>)}
        </div>
      </div>

      {visibleOptionalTypes.length>0 && (
        <div>
          <div className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-3">
            Réseaux optionnels détectés
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {visibleOptionalTypes.map(t=><SegmentCard key={t.id} t={t}/>)}
          </div>
        </div>
      )}

      {vmType && (
        <div>
          <div className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-3">
            Réseaux applicatifs
          </div>
          <SegmentCard t={vmType} compact/>
        </div>
      )}

      <div className={"flex items-center justify-between p-4 rounded-2xl border "+(inconsistencies===0?"bg-emerald-50 border-emerald-100":"bg-amber-50 border-amber-100")}>
        <div className="flex items-center gap-3">
          {inconsistencies===0
            ? <CheckCircle size={18} className="text-emerald-500"/>
            : <AlertTriangle size={18} className="text-amber-500"/>}
          <div>
            <div className={"text-sm font-semibold "+(inconsistencies===0?"text-emerald-700":"text-amber-700")}>
              {inconsistencies===0 ? "Réseau bien segmenté" : "Problèmes de segmentation détectés"}
            </div>
            <div className="text-xs text-gray-500">
              {inconsistencies===0 ? "Aucune incohérence critique détectée sur les segments réseau." : inconsistencies+" segment(s) présentent des problèmes."}
            </div>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-1"><CheckCircle size={12} className="text-emerald-500"/>Couverture <strong>{totalHosts}/{totalHosts} hosts</strong></div>
          <div className="flex items-center gap-1"><Network size={12}/>Isolation <strong>{(grouped.vmotion||[]).length>0?"Bonne":"À vérifier"}</strong></div>
        </div>
      </div>
    </div>
  );
};


// ── vSwitch View ─────────────────────────────────────────────────────────────
const getPortGroupStyle = (name) => {
  const n = (name||"").toLowerCase();
  if (n.includes("vmotion"))   return {bg:"bg-violet-100", text:"text-violet-700", border:"border-violet-200"};
  if (n.includes("mgmt")||n.includes("management")) return {bg:"bg-slate-100", text:"text-slate-600", border:"border-slate-200"};
  if (n.includes("storage")||n.includes("san")) return {bg:"bg-emerald-100", text:"text-emerald-700", border:"border-emerald-200"};
  if (n.includes("mirror")||n.includes("backup")) return {bg:"bg-orange-100", text:"text-orange-700", border:"border-orange-200"};
  return {bg:"bg-blue-100", text:"text-blue-700", border:"border-blue-200"};
};

const groupVSwitches = (vSwitches) => {
  const map = {};
  (vSwitches||[]).forEach(sw => {
    const key = sw.name;
    if (!map[key]) {
      map[key] = {
        name: sw.name,
        mtu: sw.mtu||1500,
        isJumbo: (sw.mtu||1500)>=9000,
        hosts: [],
        portGroups: [],
        mtus: [],
      };
    }
    if (!map[key].hosts.includes(sw.host)) map[key].hosts.push(sw.host);
    if (!map[key].mtus.includes(sw.mtu||1500)) map[key].mtus.push(sw.mtu||1500);
    (sw.portGroups||[]).forEach(pg => {
      if (!map[key].portGroups.find(p=>p.name===pg.name)) {
        map[key].portGroups.push(pg);
      }
    });
  });
  return Object.values(map).map(sw=>({
    ...sw,
    consistencyStatus: sw.mtus.length>1?"warning":"ok",
    hostsCount: sw.hosts.length,
  }));
};

const VSwitchesView = ({vSwitches=[], totalHosts=0}) => {
  const [search, setSearch] = useState("");
  const [filterMtu, setFilterMtu] = useState("all");
  const [expanded, setExpanded] = useState({});

  const grouped = groupVSwitches(vSwitches);
  const jumboCount = grouped.filter(s=>s.isJumbo).length;
  const inconsistencies = grouped.filter(s=>s.consistencyStatus!=="ok").length;
  const totalPGs = grouped.reduce((s,sw)=>s+sw.portGroups.length,0);

  const filtered = grouped.filter(sw => {
    const matchSearch = !search || sw.name.toLowerCase().includes(search.toLowerCase()) ||
      sw.portGroups.some(pg=>pg.name.toLowerCase().includes(search.toLowerCase()));
    const matchMtu = filterMtu==="all" || (filterMtu==="9000"&&sw.isJumbo) || (filterMtu==="1500"&&!sw.isJumbo);
    return matchSearch && matchMtu;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-800">vSwitches ({grouped.length})</h3>
          <p className="text-xs text-gray-400">Vue logique regroupee par vSwitch</p>
        </div>
      </div>

      {/* KPIs summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          {icon:"🔀", label:"vSwitches logiques", val:grouped.length,   sub:vSwitches.length+" instances au total"},
          {icon:"🖥️", label:"Hosts couverts",      val:totalHosts,       sub:"100% des hosts"},
          {icon:"🔌", label:"Port groups",          val:totalPGs,         sub:"assignes"},
          {icon:"⚡", label:"MTU 9000",             val:jumboCount,       sub:"Jumbo Frames actives"},
          {icon:inconsistencies>0?"⚠️":"✅", label:"Incoherences", val:inconsistencies, sub:inconsistencies===0?"Configurations coherentes":"A verifier"},
        ].map(k=>(
          <div key={k.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex items-center gap-3">
            <span className="text-xl">{k.icon}</span>
            <div>
              <div className="text-lg font-medium text-gray-800">{k.val}</div>
              <div className="text-xs font-semibold text-gray-600">{k.label}</div>
              <div className="text-xs text-gray-400">{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Rechercher un vSwitch ou port group..."
          className="flex-1 min-w-48 text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 outline-none focus:border-blue-300"/>
        <select value={filterMtu} onChange={e=>setFilterMtu(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-600 outline-none">
          <option value="all">Tous les MTU</option>
          <option value="1500">MTU 1500</option>
          <option value="9000">MTU 9000</option>
        </select>
      </div>

      {/* Cartes vSwitch */}
      <div className="space-y-3">
        {filtered.map((sw,i)=>{
          const isExpanded = expanded[sw.name];
          const borderColor = sw.isJumbo?"border-l-emerald-400":sw.consistencyStatus!=="ok"?"border-l-amber-400":"border-l-blue-400";
          const rawInstances = (vSwitches||[]).filter(s=>s.name===sw.name);

          return (
            <div key={sw.name} className={"bg-white rounded-2xl border border-gray-100 shadow-sm border-l-4 "+borderColor}>
              <div className="p-4">
                <div className="grid grid-cols-12 gap-4 items-start">
                  {/* Identité */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={"w-9 h-9 rounded-xl flex items-center justify-center "+(sw.isJumbo?"bg-emerald-100":"bg-blue-100")}>
                        <Network size={16} className={sw.isJumbo?"text-emerald-600":"text-blue-600"}/>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">{sw.name}</div>
                        <span className={"text-xs px-2 py-0.5 rounded-full font-semibold "+(sw.isJumbo?"bg-amber-100 text-amber-700":"bg-gray-100 text-gray-500")}>{sw.isJumbo?"Jumbo Frames":"Standard"}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mb-2">Present sur {sw.hostsCount} host{sw.hostsCount>1?"s":""}</div>
                    <div className="flex gap-1 flex-wrap">
                      {sw.hosts.slice(0,4).map((h,j)=>(
                        <div key={j} className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                          <Server size={10} className="text-blue-500"/>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* MTU */}
                  <div className="col-span-2">
                    <div className="text-xs text-gray-400 mb-1">MTU</div>
                    <div className={"text-2xl font-medium "+(sw.isJumbo?"text-emerald-600":"text-gray-800")}>{sw.mtu}</div>
                    {sw.isJumbo&&<div className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold mt-1 inline-block">Jumbo Actif</div>}
                    {sw.consistencyStatus!=="ok"&&<div className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold mt-1 inline-block">MTU incoherent</div>}
                  </div>

                  {/* Port Groups */}
                  <div className="col-span-4">
                    <div className="text-xs text-gray-400 mb-2">Port groups ({sw.portGroups.length})</div>
                    <div className="flex flex-wrap gap-1">
                      {sw.portGroups.map((pg,j)=>{
                        const style = getPortGroupStyle(pg.name);
                        return (
                          <div key={j} className={"flex items-center gap-1 text-xs px-2 py-1 rounded-lg border font-medium "+style.bg+" "+style.text+" "+style.border}>
                            <Network size={9}/>
                            <span>{pg.name}</span>
                            {pg.vlan!==null&&pg.vlan!==undefined&&<span className="bg-white/60 px-1 rounded text-xs">{pg.vlan}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hosts */}
                  <div className="col-span-2">
                    <div className="text-xs text-gray-400 mb-2">Hosts ({sw.hostsCount})</div>
                    <div className="flex flex-wrap gap-1">
                      {sw.hosts.slice(0,3).map((h,j)=>(
                        <span key={j} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">{h}</span>
                      ))}
                      {sw.hosts.length>3&&<span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">+{sw.hosts.length-3}</span>}
                    </div>
                  </div>

                  {/* Statut + expand */}
                  <div className="col-span-1 flex flex-col items-end gap-2">
                    {sw.consistencyStatus==="ok"
                      ?<CheckCircle size={16} className="text-emerald-500"/>
                      :<AlertTriangle size={16} className="text-amber-500"/>}
                    <button onClick={()=>setExpanded(e=>({...e,[sw.name]:!e[sw.name]}))}
                      className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                      {isExpanded?"▲":"▼"}
                    </button>
                  </div>
                </div>

                {/* Détail dépliable */}
                {isExpanded&&(
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-1">
                      <Info size={11}/>Détails par host pour {sw.name}
                    </div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {["Host","MTU","Port groups presents","Statut"].map(col=>(
                            <th key={col} className="text-left py-1.5 px-2 text-gray-400 font-semibold uppercase tracking-wide text-xs">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rawInstances.map((inst,j)=>(
                          <tr key={j} className="border-b border-gray-50">
                            <td className="py-2 px-2 font-medium text-gray-700">{inst.host}</td>
                            <td className="py-2 px-2">
                              <span className={"font-mono font-medium "+((inst.mtu||1500)>=9000?"text-emerald-600":"text-gray-600")}>{inst.mtu||1500}</span>
                            </td>
                            <td className="py-2 px-2">
                              <div className="flex flex-wrap gap-1">
                                {(inst.portGroups||[]).map((pg,k)=>{
                                  const style = getPortGroupStyle(pg.name);
                                  return <span key={k} className={"text-xs px-1.5 py-0.5 rounded font-mono "+style.bg+" "+style.text}>{pg.name} ({pg.vlan})</span>;
                                })}
                              </div>
                            </td>
                            <td className="py-2 px-2">
                              <span className="flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                                <CheckCircle size={11}/>Conforme
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer global */}
      <div className={"flex items-center justify-between p-4 rounded-xl border "+(inconsistencies===0?"bg-blue-50 border-blue-100":"bg-amber-50 border-amber-100")}>
        <div className="flex items-center gap-2">
          <Info size={14} className={inconsistencies===0?"text-blue-500":"text-amber-500"}/>
          <div>
            <div className={"text-sm font-semibold "+(inconsistencies===0?"text-blue-700":"text-amber-700")}>
              {inconsistencies===0?"Tous les vSwitches sont coherents sur l ensemble des hosts.":"Des incoherences ont ete detectees."}
            </div>
            <div className="text-xs text-gray-500">
              {inconsistencies===0?"Aucune incoherence de MTU ou de port groups detectee.":inconsistencies+" vSwitch(es) presentent des incoherences."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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
    <div className={"flex flex-col lg:flex-row lg:items-center gap-4 p-4 rounded-xl border bg-white transition-all hover:shadow-md "+(pct>=80?"border-red-200 bg-red-50/20":pct>=60?"border-amber-200":"border-gray-100")}>
        {/* Visuel datastore premium */}
        <div className="w-full lg:w-[170px] h-[64px] flex-shrink-0 flex items-center justify-center">
          <div className={
            "relative w-[112px] h-[46px] rounded-xl border shadow-sm flex items-center justify-center " +
            (purpose==="backup" ? "bg-purple-50 border-purple-200" :
             purpose==="iso" ? "bg-sky-50 border-sky-200" :
             purpose==="prod" ? "bg-blue-50 border-blue-200" :
             "bg-slate-50 border-slate-200")
          }>
            <div className={
              "absolute left-2 top-2 bottom-2 w-2 rounded-full " +
              (pct>=80 ? "bg-red-400" : pct>=60 ? "bg-amber-400" : "bg-emerald-400")
            }/>

            <div className="flex gap-1.5">
              {[0,1,2].map(i=>(
                <div key={i} className={
                  "w-5 h-7 rounded-md border flex flex-col items-center justify-center gap-0.5 " +
                  (purpose==="backup" ? "bg-white border-purple-200" :
                   purpose==="iso" ? "bg-white border-sky-200" :
                   purpose==="prod" ? "bg-white border-blue-200" :
                   "bg-white border-slate-200")
                }>
                  <span className="w-2.5 h-0.5 rounded-full bg-slate-300"/>
                  <span className="w-2.5 h-0.5 rounded-full bg-slate-200"/>
                  <span className={
                    "w-1.5 h-1.5 rounded-full mt-0.5 " +
                    (pct>=80 ? "bg-red-400" : pct>=60 ? "bg-amber-400" : "bg-emerald-400")
                  }/>
                </div>
              ))}
            </div>

            <div className="absolute -right-2 -top-2 px-2 py-0.5 rounded-full bg-white border border-gray-100 shadow-sm text-[10px] font-semibold text-gray-500">
              {ds.type || "DS"}
            </div>
          </div>
        </div>
      {/* Infos */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-sm font-medium text-gray-800 truncate max-w-xs">{ds.name}</span>
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
      <div className="text-left lg:text-right flex-shrink-0 w-full lg:w-auto lg:min-w-32">
        <div className="text-sm font-semibold text-gray-700">{usedGo} Go utilisé</div>
        <div className="text-xs text-gray-400">/ {capGo} Go total</div>
        <div className="text-xs text-gray-400">{freeGo} Go libre</div>
        <div className={"text-base font-medium mt-1 "+health.color}>{pct}% utilisé</div>
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
      cpuUsagePct:h.cpuUsagePct||0,
      ramUsagePct:h.ramUsagePct||0,
      totalCpuCores:h.cores||0,
      totalRamGb:h.ramGo||0,
      model:h.model||"N/A",
      esxVersion:h.esxVersion||"N/A",
      cpuModel:h.cpuModel||"N/A",
      vmsCount:h.vmsCount||0,
      vendor:h.vendor||"N/A",
      sockets:h.sockets||0,
      coresPerSocket:h.coresPerSocket||0,
      architecture:h.architecture||"N/A",
      tdpWatts:h.tdpWatts||0,
      vms:h.vms||[],
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
      vmKernel: rv.vmKernel || [],
      claudeInsights: rv.networkInsights || null,
      hbaRows: (() => {
        const direct = rv.vHBA || rv.vhba || rv.VHBA || rv.hba || rv.HBA || rv.vhbaRows;
        if (Array.isArray(direct) && direct.length) return direct;

        const match = Object.entries(rv || {}).find(([key, value]) => {
          const k = String(key || "").toLowerCase();
          return Array.isArray(value) && (
            k.includes("vhba") ||
            k.includes("hba") ||
            k.includes("wwn") ||
            k.includes("wwpn")
          );
        });

        return match ? match[1] : [];
      })(),
      hostsNics: (() => {
        const fromVnic = rv.hostsNics || [];
        return (rv.hosts||[]).map(h => {
          const vnicEntry = fromVnic.find(n =>
            String(n.name||"").toLowerCase() === String(h.shortName||"").toLowerCase()
          ) || {};
          return {
            name: h.shortName,
            nics: vnicEntry.nicCount || h.nics || 0,
            nics10g: vnicEntry.nics10g ?? 0,
            nics1g: vnicEntry.nics1g ?? 0,
            adapters: vnicEntry.adapters || [],
            vSwitches: h.vSwitches||[],
            cpuUsagePct: h.cpuUsagePct||0,
            ramUsagePct: h.ramUsagePct||0,
          };
        });
      })(),
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
      cpuOverallMhz: v.cpuOverallMhz||0,
      cpuReadinessPct: v.cpuReadinessPct||0,
      os: v.os||"N/A",
      powerState: v.powerstate||"poweredOn",
      isOversized: v.ramGo>0&&(v.usedRamGo||0)/v.ramGo<0.5,
    }))).filter(v=>v.powerState==="poweredOn").sort((a,b)=>b.allocatedRamGb-a.allocatedRamGb).slice(0,8),
    topCpuConsumers: (rv.hosts||[]).flatMap(h=>(h.vms||[]).map(v=>({
      id: v.name,
      name: v.name,
      hostName: h.shortName,
      vcpu: v.vcpu||0,
      cpuOverallMhz: v.cpuOverallMhz||0,
      cpuReadinessPct: v.cpuReadinessPct||0,
      cpuUsagePct: v.vcpu>0&&v.cpuOverallMhz>0 ? Math.min(99,Math.round(v.cpuOverallMhz/(v.vcpu*2500)*100)) : 0,
      ramGb: v.ramGo||0,
      os: v.os||"N/A",
      powerState: v.powerstate||"poweredOn",
      isOverprovisioned: v.vcpu>8&&(v.cpuOverallMhz||0)<1000,
    }))).filter(v=>v.powerState==="poweredOn").sort((a,b)=>b.vcpu-a.vcpu).slice(0,8),
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






const ServerRackVisual = ({ health="healthy", compact=false }) => {
  const led =
    health === "critical" ? "bg-red-400" :
    health === "warning" ? "bg-amber-400" :
    "bg-emerald-400";

  return (
    <div className="relative w-[260px] h-[42px] rounded-lg bg-gradient-to-b from-slate-600 via-slate-800 to-slate-950 border border-slate-500 shadow-md overflow-hidden">

      {/* Rack gauche */}
      <div className="absolute left-2 top-1 bottom-1 w-4 rounded bg-black border border-slate-600 flex flex-col items-center justify-around">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"/>
        <span className={"w-1.5 h-1.5 rounded-full "+led}/>
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"/>
      </div>

      {/* Disques / slots */}
      <div className="absolute left-8 right-8 top-1.5 bottom-1.5 grid grid-cols-10 gap-1">
        {[...Array(10)].map((_,i)=>(
          <div key={i} className="rounded bg-black/50 border border-slate-700 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle,#64748b_1px,transparent_1px)] [background-size:4px_4px] opacity-70"/>
            <div className={"absolute bottom-0.5 right-0.5 w-1 h-1 rounded-full "+led}/>
          </div>
        ))}
      </div>

      {/* Rack droit */}
      <div className="absolute right-2 top-1 bottom-1 w-4 rounded bg-black border border-slate-600 flex flex-col items-center justify-around">
        <span className={"w-1.5 h-1.5 rounded-full "+led}/>
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"/>
      </div>

    </div>
  );
};






const VmSlideOver = ({ vm, onClose }) => {
  if (!vm) return null;
  const isWin = (os) => (os||"").toLowerCase().includes("win");
  const isActive = vm.powerState === "poweredOn";
  const ramUsedPct = vm.ramGb > 0 && vm.usedRamGb > 0 ? Math.round(vm.usedRamGb/vm.ramGb*100) : 0;
  const isOversized = vm.ramGb > 0 && vm.usedRamGb > 0 && vm.usedRamGb/vm.ramGb < 0.5;
  const recommendedRam = isOversized ? Math.max(1, Math.round(vm.usedRamGb * 1.5)) : null;
  const recommendedVcpu = vm.cpuUsagePct < 20 && vm.vcpu > 2 ? Math.max(1, Math.round(vm.vcpu/2)) : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose}/>
      <div className="relative w-[480px] h-full bg-white shadow-2xl overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-5 z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-gray-900 truncate">{vm.name}</h2>
              <div className="flex items-center gap-2 mt-1.5">
                <i className={`ti ${isWin(vm.os)?"ti-brand-windows text-blue-500":"ti-terminal-2 text-orange-500"} text-base`}/>
                <span className="text-xs text-gray-500 truncate">{vm.os||"OS inconnu"}</span>
              </div>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold border ${isActive?"bg-emerald-50 text-emerald-700 border-emerald-100":"bg-gray-50 text-gray-500 border-gray-200"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive?"bg-emerald-500":"bg-gray-400"}`}/>
                  {isActive?"Active":"Éteinte"}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <i className="ti ti-server text-gray-400"/>
                  {vm.hostName||"N/A"}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 flex-shrink-0">
              <i className="ti ti-x text-base"/>
            </button>
          </div>
        </div>

        <div className="flex-1 px-6 py-5 space-y-6">
          {/* Compute */}
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">1. Compute</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-gray-100 p-4 text-center">
                <div className="text-xs text-gray-500 mb-2">vCPU alloués</div>
                <div className="text-3xl font-semibold text-blue-600">{vm.vcpu||0}</div>
                <div className="text-xs text-gray-400 mt-1">alloués</div>
              </div>
              <div className="rounded-2xl border border-gray-100 p-4 text-center">
                <div className="text-xs text-gray-500 mb-2">CPU utilisé</div>
                <div className={`text-3xl font-semibold ${vm.cpuUsagePct>=80?"text-red-600":vm.cpuUsagePct>=50?"text-amber-600":"text-blue-600"}`}>{vm.cpuUsagePct||0}%</div>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{width:Math.min(100,vm.cpuUsagePct||0)+"%"}}/>
                </div>
              </div>
            </div>
          </div>

          {/* Mémoire */}
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">2. Mémoire</div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="rounded-2xl border border-gray-100 p-3 text-center">
                <div className="text-[10px] text-gray-500 mb-1">RAM allouée</div>
                <div className="text-xl font-semibold text-violet-600">{vm.ramGb||0} GB</div>
              </div>
              <div className="rounded-2xl border border-gray-100 p-3 text-center">
                <div className="text-[10px] text-gray-500 mb-1">RAM utilisée</div>
                <div className="text-xl font-semibold text-violet-600">{vm.usedRamGb||0} GB</div>
                {vm.usedRamGb>0&&(
                  <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full" style={{width:ramUsedPct+"%"}}/>
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-gray-100 p-3 text-center">
                <div className="text-[10px] text-gray-500 mb-1">RAM active</div>
                <div className="text-xl font-semibold text-violet-400">{vm.activeRamGb||"N/A"}{vm.activeRamGb?" GB":""}</div>
              </div>
            </div>
            {isOversized&&(
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 flex items-start gap-2">
                <i className="ti ti-alert-triangle text-amber-500 text-base flex-shrink-0 mt-0.5"/>
                <div className="text-xs text-amber-700">
                  <span className="font-semibold">VM surdimensionnée</span> — RAM allouée {Math.round(vm.ramGb/(vm.usedRamGb||1))}× supérieure à l'utilisation réelle. Recommandation : réduire à {recommendedRam} GB
                </div>
              </div>
            )}
          </div>

          {/* Stockage */}
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">3. Stockage</div>
            <div className="rounded-2xl border border-gray-100 overflow-hidden">
              {[
                {icon:"ti-database", label:"Disque total alloué", value:`${vm.diskGb||"N/A"}${vm.diskGb?" GB":""}`},
                {icon:"ti-layers-subtract", label:"Datastore", value:vm.datastore||"N/A"},
              ].map((r,i)=>(
                <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <i className={`ti ${r.icon} text-gray-400`}/>
                    {r.label}
                  </div>
                  <span className="text-xs font-semibold text-gray-800">{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Réseau */}
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">4. Réseau</div>
            <div className="rounded-2xl border border-gray-100 overflow-hidden">
              {[
                {icon:"ti-network", label:"vNIC", value:`${vm.nicCount||1} interface${(vm.nicCount||1)>1?"s":""}`},
                {icon:"ti-topology-star-3", label:"Port group", value:vm.portGroup||"N/A"},
              ].map((r,i)=>(
                <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <i className={`ti ${r.icon} text-gray-400`}/>
                    {r.label}
                  </div>
                  <span className="text-xs font-semibold text-gray-800">{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rightsizing */}
          {(isOversized||recommendedVcpu)&&(
            <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <i className="ti ti-trending-down text-amber-600"/>
                <div className="text-sm font-semibold text-amber-700">5. Recommandation rightsizing</div>
              </div>
              <div className="space-y-2">
                {[
                  {icon:"ti-current-location", label:"Actuel", value:`RAM ${vm.ramGb} GB / CPU ${vm.vcpu} vCPU`},
                  {icon:"ti-target", label:"Recommandé", value:`RAM ${recommendedRam||vm.ramGb} GB / CPU ${recommendedVcpu||vm.vcpu} vCPU`},
                  {icon:"ti-coin", label:"Gain potentiel", value:`${isOversized?`${vm.ramGb-(recommendedRam||vm.ramGb)} GB RAM récupérables`:""}${isOversized&&recommendedVcpu?" · ":""}${recommendedVcpu?`${vm.vcpu-(recommendedVcpu||vm.vcpu)} vCPU libérables`:""}`},
                ].map((r,i)=>(
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-amber-600">
                      <i className={`ti ${r.icon}`}/>
                      {r.label}
                    </div>
                    <span className="font-semibold text-amber-800">{r.value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-xs mt-1 pt-2 border-t border-amber-200">
                  <span className="text-amber-600">Impact</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold">Faible risque</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-3 flex items-center justify-between">
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <i className="ti ti-clock text-gray-300"/>
            Données issues du dernier export RVTools
          </span>
        </div>
      </div>
    </div>
  );
};

export default function ClusterOverviewDashboard({
  platformContext={}, clusterSummary={}, hosts=[], insights=[],
  osDistrib=[], datastores=[], vlans=[], vSwitches=[], dvSwitches=[], vmOffList=[], uniquePortGroups=[], topMemoryConsumers=[], topCpuConsumers=[], networkData={}, optimizationData={},
}) {
  const [selectedOverviewHostId, setSelectedOverviewHostId] = useState("");
  const [growthRate, setGrowthRate] = useState(20);
  const [activeTab, setActiveTab] = useState("overview");
  const [vmFilter, setVmFilter] = useState("toutes");
  const [vmSearch, setVmSearch] = useState("");
  const [showAllVms, setShowAllVms] = useState(false);
  const [selectedVm, setSelectedVm] = useState(null);
  const sortedHosts = [...hosts].sort((a,b)=>
    Math.max(b.cpuUsagePercent||0,b.ramUsagePercent||0)-Math.max(a.cpuUsagePercent||0,a.ramUsagePercent||0)
  );
  const criticals = insights.filter(i=>i.severity==="critical");
  const warnings  = insights.filter(i=>i.severity==="warning");
  const infos     = insights.filter(i=>i.severity==="info");

  return (
    <>
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

          {(()=>{
            const hostList = hosts || [];
            const nd = networkData || {};
            const vmkRows = nd.vmKernel || nd.vmk || nd.vmkernels || nd.vmkernel || nd.vSC_VMK || [];
            const hbaRows = nd.hbaRows || nd.vHBA || nd.vhba || nd.hba || [];
            const hostsNics = nd.hostsNics || [];

            const selectedId = selectedOverviewHostId || hostList[0]?.id || hostList[0]?.name;
            const selectedHost =
              hostList.find(h => h.id === selectedId || h.name === selectedId) ||
              hostList[0] ||
              {};

            const selectedName = selectedHost.name || selectedHost.id || "N/A";

            const sameHost = (row) => {
              const h = String(row?.host || row?.Host || row?.hostname || row?.Hostname || row?.["Host Name"] || "").toLowerCase();
              const sel = String(selectedName || "").toLowerCase();
              const selFull = String(selectedHost.name || selectedHost.id || "").toLowerCase();
              return h === sel || h === selFull || h.startsWith(sel+".") || sel.startsWith(h+".");
            };

            const nodeVmks = vmkRows.filter(sameHost);
            const nodeHbas = hbaRows.filter(sameHost);
            
            const nodeNic = hostsNics.find(h =>
              String(h.name || h.host || h.Host || "").toLowerCase() === String(selectedName || "").toLowerCase()
            ) || {};

            const mgmtVmk = nodeVmks.find(v => {
              const t = Object.values(v || {}).join(" ").toLowerCase();
              return t.includes("management") || t.includes("mgmt") || t.includes("vmk0");
            }) || nodeVmks[0];

            const totalCpu = clusterSummary.totalCpuCores || 0;
            const allocatedVcpu = clusterSummary.allocatedVcpu || 0;
            const totalRam = clusterSummary.totalRamGb || 0;
            const allocatedRam = clusterSummary.allocatedRamGb || 0;
            const activeVms = clusterSummary.activeVms || clusterSummary.vms || 0;

            const avgCpuPct = hostList.length
              ? Math.round(hostList.reduce((s,h)=>s+(Number(h.cpuUsagePct)||Number(h.cpuUsagePercent)||0),0)/hostList.length)
              : 0;

            const avgRamPct = hostList.length
              ? Math.round(hostList.reduce((s,h)=>s+(Number(h.ramUsagePct)||Number(h.ramUsagePercent)||0),0)/hostList.length)
              : 0;

            const totalStorageMib = datastores.reduce((s,d)=>s+(d.capMib||0),0);
            const usedStorageMib = datastores.reduce((s,d)=>s+(d.inUseMib||0),0);
            const storagePct = totalStorageMib ? Math.round(usedStorageMib/totalStorageMib*100) : 0;
            const storageTotalTb = (totalStorageMib/1024/1024).toFixed(1);
            const storageUsedTb = (usedStorageMib/1024/1024).toFixed(1);

            const cpuOversub = clusterSummary.cpuOversubscription || (totalCpu ? (allocatedVcpu/totalCpu).toFixed(1)+":1" : "N/A");
            const ramOversub = clusterSummary.ramOversubscription || (totalRam ? (allocatedRam/totalRam).toFixed(1)+":1" : "N/A");
            const avgVcpuPerVm = clusterSummary.avgVcpuPerVm || (activeVms ? (allocatedVcpu/activeVms).toFixed(1) : "N/A");
            const avgRamPerVm = clusterSummary.avgRamPerVmGb || (activeVms ? Math.round(allocatedRam/activeVms) : "N/A");

            const hostVmCount =
              selectedHost.vmsCount ||
              selectedHost.vmCount ||
              selectedHost.vms ||
              selectedHost.poweredOnVms ||
              0;

            const hostCpuPct = selectedHost.cpuUsagePct || selectedHost.cpuUsagePercent || 0;
            const hostRamPct = selectedHost.ramUsagePct || selectedHost.ramUsagePercent || 0;

            const fcHbas = nodeHbas.filter(h => {
              const t = Object.values(h || {}).join(" ").toLowerCase();
              return t.includes("fibre channel") || t.includes("fiber channel") || t.includes("wwn") || t.includes("wwpn");
            });

            const iscsiHbas = nodeHbas.filter(h => {
              const t = Object.values(h || {}).join(" ").toLowerCase();
              return t.includes("iscsi") || t.includes("iqn");
            });

            const getHbaId = h => h.Device || h.device || h.HBA || h.hba || h.Name || h.name || "HBA";
            const getHbaType = h => h.Type || h.type || h.Model || h.model || "N/A";
            const getHbaAddress = h => {
              const type = (h.Type||h.type||'').toLowerCase();
              if (type.includes('iscsi')) {
                const iqnFromHba = h.IQN || h.iqn || h["iSCSI Name"] || h["iSCSIName"];
                if (iqnFromHba) return iqnFromHba;
                const iqnFromVmk = nodeVmks.find(v => v.iqn)?.iqn;
                return iqnFromVmk || "N/A";
              }
              return h.WWN || h.wwn || h.WWPN || h.wwpn || "N/A";
            };
            const getHbaState = h => h.Status || h.status || h.State || h.state || "Actif";

            const physicalNics = Number(nodeNic.nicCount || nodeNic.nics || selectedHost.nics || selectedHost.nicCount || 0);
            const nicRows = Array.isArray(nodeNic.adapters) ? nodeNic.adapters : [];
            const nics10g = nodeNic.nics10g ?? nicRows.filter(n => Number(n.speed||0) >= 10000).length;
            const nics1g  = nodeNic.nics1g  ?? nicRows.filter(n => Number(n.speed||0) >= 1000 && Number(n.speed||0) < 10000).length;

            const nodeDatastores = datastores.slice(0,3);

            const globalHealth =
              avgCpuPct >= 80 || avgRamPct >= 80 || storagePct >= 80 ? "Infrastructure sous tension" :
              avgCpuPct >= 60 || avgRamPct >= 60 || storagePct >= 60 ? "Infrastructure à surveiller" :
              "Infrastructure saine";

            const globalTone =
              globalHealth.includes("tension") ? "red" :
              globalHealth.includes("surveiller") ? "amber" :
              "emerald";

            const toneClasses = {
              emerald: {
                bg:"bg-emerald-50 border-emerald-100",
                text:"text-emerald-700",
                bar:"bg-emerald-500",
              },
              amber: {
                bg:"bg-amber-50 border-amber-100",
                text:"text-amber-700",
                bar:"bg-amber-500",
              },
              red: {
                bg:"bg-red-50 border-red-100",
                text:"text-red-700",
                bar:"bg-red-500",
              },
            };

            const t = toneClasses[globalTone];

            const MiniBar = ({label,value,total,pct,color="bg-blue-500",sub}) => (
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{label}</div>
                    <div className="text-xs text-gray-400 mt-1">{value} / {total}</div>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900">{pct}%</div>
                </div>
                <div className="mt-4 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={color+" h-full rounded-full"} style={{width:Math.min(100,pct)+"%"}}/>
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-gray-400">
                  <span>0%</span><span>50%</span><span>100%</span>
                </div>
                {sub && <div className="text-xs text-gray-500 mt-2">{sub}</div>}
              </div>
            );

            const InfoRow = ({label,value}) => (
              <div className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-b-0">
                <span className="text-xs text-gray-500">{label}</span>
                <strong className="text-xs text-gray-800 text-right">{value || "N/A"}</strong>
              </div>
            );

            const SoftMetric = ({label,value,sub,tone="blue",icon=null}) => {
              const styles = {
                blue:"bg-blue-50 text-blue-700 border-blue-100",
                orange:"bg-orange-50 text-orange-700 border-orange-100",
                violet:"bg-violet-50 text-violet-700 border-violet-100",
                emerald:"bg-emerald-50 text-emerald-700 border-emerald-100",
                slate:"bg-slate-50 text-slate-700 border-slate-100",
              };

              
const ClusterStackIcon = () => (
  <div className="w-36 h-36 rounded-[28px] border border-slate-100 bg-white flex items-center justify-center shadow-sm shrink-0">
    <svg viewBox="0 0 120 120" className="w-24 h-24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="23" y="22" width="74" height="20" rx="6" fill="#1E293B"/>
      <rect x="23" y="50" width="74" height="20" rx="6" fill="#334155"/>
      <rect x="23" y="78" width="74" height="20" rx="6" fill="#475569"/>

      <circle cx="35" cy="32" r="3" fill="#34D399"/>
      <circle cx="46" cy="32" r="3" fill="#60A5FA"/>
      <rect x="60" y="29" width="24" height="5" rx="2.5" fill="#CBD5E1"/>

      <circle cx="35" cy="60" r="3" fill="#34D399"/>
      <circle cx="46" cy="60" r="3" fill="#60A5FA"/>
      <rect x="60" y="57" width="24" height="5" rx="2.5" fill="#CBD5E1"/>

      <circle cx="35" cy="88" r="3" fill="#34D399"/>
      <circle cx="46" cy="88" r="3" fill="#60A5FA"/>
      <rect x="60" y="85" width="24" height="5" rx="2.5" fill="#CBD5E1"/>
    </svg>
  </div>
);

const ClusterMiniMetric = ({icon, value, label}) => {
  const icons = {
    hosts: "🖥️",
    vm: "🧩",
    cpu: "⚙️",
    ram: "💾",
    storage: "🗄️",
  };

  return (
    <div className="flex items-center gap-3 min-w-[130px]">
      <div className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-base shadow-sm">
        {icons[icon]}
      </div>

      <div>
        <div className="text-xl font-semibold text-slate-900 leading-none">
          {value}
        </div>

        <div className="text-xs text-slate-500 mt-1">
          {label}
        </div>
      </div>
    </div>
  );
};


return (
                <div className={"rounded-2xl border p-4 "+(styles[tone]||styles.blue)}>
                  <div className="flex items-center gap-2 mb-2">
                    {icon && <i className={"ti "+icon+" text-base opacity-70"}/>}
                    <div className="text-xs font-semibold opacity-80">{label}</div>
                  </div>
                  <div className="text-2xl font-semibold">{value}</div>
                  {sub && <div className="text-xs opacity-70 mt-1">{sub}</div>}
                </div>
              );
            };

            return (
              <>
                <div className={"rounded-3xl border shadow-sm p-6 "+t.bg}>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                    <div className="flex items-center gap-5">
                      <div className="w-20 h-20 rounded-full bg-white border border-white shadow-sm flex flex-col items-center justify-center">
                        <div className={"text-3xl font-bold "+t.text}>{clusterSummary.auditScore || 100}</div>
                        <div className="text-[10px] text-gray-400">/100</div>
                      </div>

                      <div>
                        <div className="text-xs uppercase tracking-widest text-gray-400">Score global d'audit</div>
                        <div className={"text-2xl font-semibold "+t.text}>{globalHealth}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          CPU moyen {avgCpuPct}% · RAM moyenne {avgRamPct}% · Stockage {storagePct}%
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 w-full lg:w-[560px]">
                      <div className="bg-white/80 rounded-2xl px-6 py-4 text-center">
                        <div className="text-xl font-semibold text-blue-600">{avgCpuPct}%</div>
                        <div className="text-xs text-gray-500">CPU moyen</div>
                      </div>
                      <div className="bg-white/80 rounded-2xl px-6 py-4 text-center">
                        <div className="text-xl font-semibold text-violet-600">{avgRamPct}%</div>
                        <div className="text-xs text-gray-500">RAM moyenne</div>
                      </div>
                      <div className="bg-white/80 rounded-2xl px-6 py-4 text-center">
                        <div className={(storagePct>=80?"text-red-600":storagePct>=60?"text-amber-600":"text-emerald-600")+" text-xl font-semibold"}>
                          {storagePct>=80?"À risque":storagePct>=60?"À surveiller":"OK"}
                        </div>
                        <div className="text-xs text-gray-500">Stockage</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-4">
                  <div className="space-y-4">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-900">Cluster Overview</h3>

                      <div className="mt-5 grid grid-cols-1 lg:grid-cols-[170px_1fr] gap-6 items-center">
                        <div className="flex justify-center">
                          <GlobalClusterStackIcon />
                        </div>

                        <div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="text-2xl font-semibold text-gray-900">
                              {clusterSummary.name || clusterSummary.clusterName || platformContext?.clusterName || "Cluster VMware"}
                            </div>
                            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold">Sain</span>
                          </div>

                          <div className="text-sm text-gray-500 mt-1">VMware vSphere Cluster</div>

                          <div className="mt-5 flex flex-wrap items-center gap-x-10 gap-y-5">
                            <GlobalClusterMiniMetric icon="hosts" value={hostList.length} label="Hosts"/>
                            <GlobalClusterMiniMetric icon="vm" value={activeVms} label="VMs actives"/>
                            <GlobalClusterMiniMetric icon="cpu" value={totalCpu} label="Cores"/>
                            <GlobalClusterMiniMetric icon="ram" value={formatRam(totalRam)} label="RAM totale"/>
                            <GlobalClusterMiniMetric icon="storage" value={`${storageTotalTb} To`} label="Stockage total"/>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
                        <SoftMetric label="CPU oversubscription" value={cpuOversub} tone="blue"/>
                        <SoftMetric label="RAM oversubscription" value={ramOversub} tone="orange"/>
                        <SoftMetric label="vCPU moyen / VM" value={avgVcpuPerVm} tone="blue"/>
                        <SoftMetric label="RAM moyenne / VM" value={`${avgRamPerVm} GB`} tone="orange"/>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                      <div className="flex items-center justify-between gap-4 mb-5">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Cluster Utilization</h3>
                          <p className="text-sm text-gray-400 mt-1">Consommation globale au niveau du cluster</p>
                        </div>
                        <div className="hidden lg:flex items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"/> &lt;60%</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"/> 60-80%</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"/> &gt;80%</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <MiniBar
                          label="CPU Cluster"
                          value={`${Math.round(totalCpu*avgCpuPct/100)} cores`}
                          total={`${totalCpu} cores`}
                          pct={avgCpuPct}
                          color="bg-blue-500"
                          sub="Utilisation confortable au niveau cluster."
                        />

                        <MiniBar
                          label="RAM Cluster"
                          value={formatRam(Math.round(totalRam*avgRamPct/100))}
                          total={formatRam(totalRam)}
                          pct={avgRamPct}
                          color="bg-violet-500"
                          sub="Utilisation confortable au niveau cluster."
                        />

                        <MiniBar
                          label="Storage Cluster"
                          value={`${storageUsedTb} To`}
                          total={`${storageTotalTb} To`}
                          pct={storagePct}
                          color={storagePct>=80?"bg-red-500":storagePct>=60?"bg-amber-400":"bg-emerald-500"}
                          sub={storagePct>=80?"Capacité à risque.":storagePct>=60?"Surveillance recommandée.":"Capacité confortable."}
                        />
                      </div>
                    </div>

                    {insights.length>0&&(
                      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimization Insights</h3>
                        <div className="space-y-2">
                          {insights.slice(0,3).map(i=><OptimizationItem key={i.id} insight={i}/>)}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Focus nœud Hardware</h3>
                        <p className="text-sm text-gray-400 mt-1">Analyse détaillée d'un hôte depuis RVTools</p>
                      </div>

                      <select
                        value={selectedId || ""}
                        onChange={e=>setSelectedOverviewHostId(e.target.value)}
                        className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 outline-none"
                      >
                        {hostList.map(h=>(
                          <option key={h.id || h.name} value={h.id || h.name}>{h.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-start gap-5 mb-6 pb-5 border-b border-gray-100">
                      <ServerRackVisual health={hostCpuPct>=80||hostRamPct>=80?"critical":hostCpuPct>=60||hostRamPct>=60?"warning":"healthy"}/>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0">
                          <div className="text-xl font-semibold text-gray-900">{selectedName}</div>
                          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold">
                            {hostCpuPct>=80||hostRamPct>=80?"Critique":hostCpuPct>=60||hostRamPct>=60?"À surveiller":"Confortable"}
                          </span>
                        </div>
                      </div>
                    </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-gray-100 p-5 min-h-[190px]">
                          <div className="text-sm font-semibold text-gray-800 mb-">Informations générales</div>
                          <InfoRow label="Nom d'hôte" value={selectedName}/>
                          <InfoRow label="Adresse IP" value={mgmtVmk?.ip || mgmtVmk?.IP || selectedHost.ip}/>
                          <InfoRow label="Modèle" value={selectedHost.model || selectedHost.cpuModel || selectedHost.serverModel || selectedHost.hardwareModel}/>
                          <InfoRow label="Version ESXi" value={selectedHost.esxVersion || selectedHost.version || selectedHost.esxiVersion}/>
                          <InfoRow label="Nombre de VMs" value={hostVmCount}/>
                        <InfoRow label="Modèle CPU" value={selectedHost.cpuModel}/>
                        <InfoRow label="Architecture" value={selectedHost.architecture||"N/A"}/>
                        <InfoRow label="Sockets" value={selectedHost.sockets||"N/A"}/>
                        <InfoRow label="Cores / socket" value={selectedHost.coresPerSocket||"N/A"}/>
                        <InfoRow label="Total cores" value={selectedHost.totalCpuCores||"N/A"}/>
                        {selectedHost.tdpWatts>0&&<InfoRow label="TDP" value={selectedHost.tdpWatts+" W"}/>}
                        </div>

                        <div className="rounded-2xl border border-gray-100 p-5 min-h-[190px]">
                          <div className="text-sm font-semibold text-gray-800 mb-">Ressources</div>

                          <div className="mb-4">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-gray-500">CPU utilisé</span>
                              <strong className="text-gray-800">{hostCpuPct}%</strong>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{width:Math.min(100,hostCpuPct)+"%"}}/>
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-gray-500">RAM utilisée</span>
                              <strong className="text-gray-800">{hostRamPct}%</strong>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-violet-500 rounded-full" style={{width:Math.min(100,hostRamPct)+"%"}}/>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                        <div className="rounded-2xl border border-gray-100 p-5 min-h-[190px]">
                          <div className="text-sm font-semibold text-gray-800 mb-">Réseau physique</div>
                          <InfoRow label="Interfaces physiques" value={physicalNics || "N/A"}/>
                          <InfoRow label="Interfaces 10 Gbps" value={nics10g || "N/A"}/>
                          <InfoRow label="Interfaces 1 Gbps" value={nics1g || "N/A"}/>
                          <InfoRow label="VMkernel" value={nodeVmks.length}/>
                        </div>

                        <div className="rounded-2xl border border-gray-100 p-5 min-h-[190px]">
                          <div className="text-sm font-semibold text-gray-800 mb-">Stockage — HBA / IQN</div>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                                <div className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Fibre Channel</div>
                                <div className="text-2xl font-semibold text-gray-900">{fcHbas.length}</div>
                                <div className="text-xs text-gray-500 mt-1">HBA détectés</div>
                              </div>

                              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                                <div className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">iSCSI / IQN</div>
                                <div className="text-2xl font-semibold text-gray-900">{iscsiHbas.length}</div>
                                <div className="text-xs text-gray-500 mt-1">IQN déclarés</div>
                              </div>
                            </div>

                        </div>
                      </div>

                    <div className="mt-4 rounded-2xl border border-gray-100 overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-800">
                        HBA associés
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-gray-100">
                              {["HBA","Type","WWN / IQN","État"].map(h=>(
                                <th key={h} className="text-left text-gray-400 font-medium px-4 py-2 whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {nodeHbas.slice(0,6).map((h,i)=>(
                              <tr key={i} className="border-b border-gray-50 last:border-0">
                                <td className="px-4 py-2 font-semibold text-gray-700">{getHbaId(h)}</td>
                                <td className="px-4 py-2 text-gray-600">{getHbaType(h)}</td>
                                <td className="px-4 py-2 text-gray-600 font-mono">{getHbaAddress(h)}</td>
                                <td className="px-4 py-2">
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold">
                                    {getHbaState(h)}
                                  </span>
                                </td>
                              </tr>
                            ))}

                            {nodeHbas.length===0&&(
                              <tr>
                                <td colSpan="4" className="px-4 py-6 text-center text-gray-400">
                                  Aucun HBA / IQN détecté pour ce nœud dans l'export RVTools.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

        </div>
      )}

{activeTab==="compute"&&(
        <div className="space-y-4">
          {(()=>{
            const hostList = hosts || [];
            const totalCpu = clusterSummary.totalCpuCores || 0;
            const allocatedVcpu = clusterSummary.allocatedVcpu || 0;
            const activeVms = clusterSummary.activeVms || 0;
            const totalRam = clusterSummary.totalRamGb || 0;
            const allocatedRam = clusterSummary.allocatedRamGb || 0;

            const avgCpuPct = hostList.length ? Math.round(hostList.reduce((s,h)=>s+(Number(h.cpuUsagePct||h.cpuUsagePercent)||0),0)/hostList.length) : 0;
            const avgRamPct = hostList.length ? Math.round(hostList.reduce((s,h)=>s+(Number(h.ramUsagePct||h.ramUsagePercent)||0),0)/hostList.length) : 0;
            const oversubRatio = totalCpu > 0 ? (allocatedVcpu/totalCpu).toFixed(1) : "N/A";
            const avgVmPerHost = hostList.length ? Math.round(activeVms/hostList.length) : 0;

            // Compute Score
            const oversubScore = allocatedVcpu/totalCpu < 3 ? 30 : allocatedVcpu/totalCpu < 5 ? 20 : 10;
            const cpuScore = avgCpuPct < 50 ? 35 : avgCpuPct < 70 ? 25 : avgCpuPct < 85 ? 15 : 5;
            const balanceScore = (() => {
              if (hostList.length < 2) return 15;
              const cpus = hostList.map(h=>Number(h.cpuUsagePct||h.cpuUsagePercent)||0);
              const max = Math.max(...cpus), min = Math.min(...cpus);
              return max-min < 20 ? 35 : max-min < 40 ? 25 : max-min < 60 ? 15 : 5;
            })();
            const computeScore = Math.min(100, oversubScore + cpuScore + balanceScore);
            const scoreLabel = computeScore >= 80 ? "Bon équilibre global" : computeScore >= 60 ? "Équilibre acceptable" : computeScore >= 40 ? "Optimisation recommandée" : "Cluster sous tension";
            const scoreSubLabel = computeScore >= 80 ? "Cluster sain et optimisable" : computeScore >= 60 ? "Quelques ajustements possibles" : "Action corrective conseillée";

            // Hosts needed
            const totalUsedCores = hostList.reduce((s,h)=>s+(Math.round((Number(h.cpuUsagePct||h.cpuUsagePercent)||0)/100*(h.totalCpuCores||0))),0);
            const totalUsedRamGb = hostList.reduce((s,h)=>s+(Math.round((Number(h.ramUsagePct||h.ramUsagePercent)||0)/100*(h.totalRamGb||0))),0);
            const maxCoresPerHost = hostList.length ? Math.max(...hostList.map(h=>h.totalCpuCores||0)) : 0;
            const maxRamPerHost = hostList.length ? Math.max(...hostList.map(h=>h.totalRamGb||0)) : 0;
            const avgCoresPerHost = hostList.length ? totalCpu/hostList.length : 0;
            const minHostsByCpu = maxCoresPerHost > 0 ? Math.ceil(totalUsedCores/maxCoresPerHost) : hostList.length;
            const minHostsByRam = maxRamPerHost > 0 ? Math.ceil(totalUsedRamGb/maxRamPerHost) : hostList.length;
            const minHostsNeeded = Math.max(minHostsByCpu, minHostsByRam, 1);
            const savedHosts = Math.max(0, hostList.length - minHostsNeeded);
            const savedCores = savedHosts * Math.round(avgCoresPerHost);
            const savedRam = savedHosts * Math.round(totalRam/hostList.length);

            // N-1 projection
            const worstHost = [...hostList].sort((a,b)=>(Number(b.cpuUsagePct||b.cpuUsagePercent)||0)-(Number(a.cpuUsagePct||a.cpuUsagePercent)||0))[0];
            const remainingHosts = hostList.filter(h=>h.name !== worstHost?.name);
            const worstCpuCores = worstHost?.totalCpuCores || Math.round(totalCpu/hostList.length);
            const worstRamGb = worstHost?.totalRamGb || Math.round(totalRam/hostList.length);
            const remainCpu = totalCpu - worstCpuCores;
            const remainRam = totalRam - worstRamGb;
            const totalUsedCpu = totalCpu * avgCpuPct / 100;
            const totalUsedRam = totalRam * avgRamPct / 100;
            const n1CpuPct = remainCpu > 0 ? Math.min(99, Math.round(totalUsedCpu / remainCpu * 100)) : 99;
            const n1RamPct = remainRam > 0 ? Math.min(99, Math.round(totalUsedRam / remainRam * 100)) : 99;

            // Timeline
            const gr = (growthRate||20)/100;
            const timeline = [3,6,12].map(m=>({
              months: m,
              cpu: Math.min(99, Math.round(avgCpuPct * (1 + gr * m/12))),
              ram: Math.min(99, Math.round(avgRamPct * (1 + gr * m/12))),
            }));

            // Host N-1 per host
            const hostWithN1 = hostList.map(h => {
              const others = hostList.filter(x=>x.name!==h.name);
              const otherCpu = others.reduce((s,x)=>s+(x.totalCpuCores||0),0);
              const usedCpu = hostList.reduce((s,x)=>s+(Math.round((Number(x.cpuUsagePct||x.cpuUsagePercent)||0)/100*(x.totalCpuCores||0))),0);
              const n1c = otherCpu > 0 ? Math.min(99,Math.round(usedCpu/otherCpu*100)) : 0;
              const otherRam = others.reduce((s,x)=>s+(x.totalRamGb||0),0);
              const usedRam = hostList.reduce((s,x)=>s+(Math.round((Number(x.ramUsagePct||x.ramUsagePercent)||0)/100*(x.totalRamGb||0))),0);
              const n1r = otherRam > 0 ? Math.min(99,Math.round(usedRam/otherRam*100)) : 0;
              const cpuPct = Number(h.cpuUsagePct||h.cpuUsagePercent)||0;
              const ramPct = Number(h.ramUsagePct||h.ramUsagePercent)||0;
              const freeCores = Math.round((1-cpuPct/100)*(h.totalCpuCores||0));
              const oversub = (h.totalCpuCores||0) > 0 ? (allocatedVcpu/hostList.length/(h.totalCpuCores||1)).toFixed(1)+":1" : "N/A";
              const status = cpuPct>=85||ramPct>=85?"critical":cpuPct>=70||ramPct>=70?"warning":cpuPct>=50||ramPct>=50?"watch":"healthy";
              return {...h, n1CpuPct:n1c, n1RamPct:n1r, freeCores, oversub, status, cpuPct, ramPct};
            });

            const statusBadge = (s) => {
              if (s==="critical") return <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-100 font-semibold"><i className="ti ti-alert-triangle"/>Critique</span>;
              if (s==="warning") return <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 font-semibold"><i className="ti ti-alert-circle"/>Surveillance</span>;
              if (s==="watch") return <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-100 font-semibold"><i className="ti ti-eye"/>Tension</span>;
              return <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold"><i className="ti ti-shield-check"/>Confortable</span>;
            };

            const pctColor = (p) => p>=85?"text-red-600":p>=70?"text-amber-600":p>=50?"text-orange-500":"text-emerald-600";
            const barColor = (p) => p>=85?"bg-red-500":p>=70?"bg-amber-400":p>=50?"bg-orange-400":"bg-blue-500";
            const barColorRam = (p) => p>=85?"bg-red-500":p>=70?"bg-amber-400":p>=50?"bg-orange-400":"bg-violet-500";

            return (
              <>
                {/* KPI Bar */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  {[
                    {icon:"ti-server-2", label:"TOTAL HOSTS", value:hostList.length, sub:"nœuds physiques", badge:<span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"/>Tous en ligne</span>},
                    {icon:"ti-cpu", label:"CPU TOTAL", value:`${totalCpu} cores`, sub:`${allocatedVcpu} vCPU alloués (ratio ${oversubRatio}:1)`},
                    {icon:"ti-brand-databricks", label:"VCPU ALLOUÉS", value:allocatedVcpu, sub:`oversubscription ${oversubRatio}:1`},
                    {icon:"ti-layout-grid", label:"AVG VM / HOST", value:avgVmPerHost, sub:"VMs par nœud"},
                  ].map((k,i)=>(
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                          <i className={`ti ${k.icon} text-blue-600 text-base`}/>
                        </div>
                        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{k.label}</div>
                      </div>
                      <div className="text-2xl font-semibold text-gray-900">{k.value}</div>
                      <div className="text-xs text-gray-500 mt-1">{k.sub}</div>
                      {k.badge}
                    </div>
                  ))}
                  {/* Compute Score */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3"/>
                        <circle cx="18" cy="18" r="15.9" fill="none"
                          stroke={computeScore>=80?"#10b981":computeScore>=60?"#f59e0b":"#ef4444"}
                          strokeWidth="3"
                          strokeDasharray={`${computeScore} ${100-computeScore}`}
                          strokeLinecap="round"/>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-900">{computeScore}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">COMPUTE SCORE</div>
                      <div className="text-sm font-semibold text-gray-900 mt-1">{scoreLabel}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{scoreSubLabel}</div>
                    </div>
                  </div>
                </div>

                {/* Optimization Banner */}
                {savedHosts > 0 && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center gap-5">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <i className="ti ti-trending-up text-emerald-600 text-xl"/>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-emerald-700">Cluster optimisable</div>
                        <div className="text-sm text-emerald-600">Sous-utilisation CPU importante — consolidation possible</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="text-sm font-semibold text-gray-700">{minHostsNeeded} hôte{minHostsNeeded>1?"s":""} suffira{minHostsNeeded>1?"ient":"it"} actuellement</div>
                      <span className="text-xs px-3 py-1 rounded-full bg-white border border-emerald-200 text-emerald-700 font-semibold">−{savedHosts} serveur{savedHosts>1?"s":""}</span>
                      <span className="text-xs px-3 py-1 rounded-full bg-white border border-blue-200 text-blue-700 font-semibold">{savedCores} cores libérés</span>
                      <span className="text-xs px-3 py-1 rounded-full bg-white border border-violet-200 text-violet-700 font-semibold">~{savedRam} GB RAM libérée</span>
                    </div>
                    <div className="flex gap-4">
                      <div className="text-center">
                        <div className="text-xl font-semibold text-blue-600">{avgCpuPct}%</div>
                        <div className="text-xs text-gray-500">CPU moyen</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-semibold text-violet-600">{avgRamPct}%</div>
                        <div className="text-xs text-gray-500">RAM moyenne</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4 items-stretch">
                  {/* Host cards */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Utilisation par hôte</h3>
                    </div>
                    {hostWithN1.map((h,i)=>(
                      <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                          <div className="grid grid-cols-1 lg:grid-cols-[270px_1fr_190px] gap-4 items-center">
                             {/* Left: identity */}
                             <div className="flex flex-col items-center gap-2">
                               <ServerRackVisual
                                 compact
                                 health={h.status==="critical"?"critical":h.status==="warning"?"warning":"healthy"}
                               />
                               <div className="text-center">
                                 <div className="font-semibold text-gray-900 text-sm truncate max-w-[240px]">{h.name}</div>
                                 <div className="flex items-center justify-center gap-1 text-xs text-emerald-600 mt-0.5">
                                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"/>En ligne
                                 </div>
                                 <div className="text-xs text-gray-500 mt-1">{h.totalCpuCores||0} cores · {h.vmsCount||0} VMs</div>
                               </div>
                             </div>
                           {/* Middle: bars */}
                           <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-500">CPU utilisé</span>
                                <span className={`font-semibold ${pctColor(h.cpuPct)}`}>{h.cpuPct}%</span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${barColor(h.cpuPct)}`} style={{width:Math.min(100,h.cpuPct)+"%"}}/>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-500">RAM utilisée</span>
                                <span className={`font-semibold ${pctColor(h.ramPct)}`}>{h.ramPct}%</span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${barColorRam(h.ramPct)}`} style={{width:Math.min(100,h.ramPct)+"%"}}/>
                              </div>
                            </div>
                          </div>
                          {/* Right: metrics + badge */}
                          <div className="flex flex-col justify-center gap-3">
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="rounded-xl bg-gray-50 border border-gray-100 p-2.5 text-center">
                                <div className={`text-sm font-semibold ${h.freeCores<=2?"text-red-600":h.freeCores<=5?"text-amber-600":"text-emerald-600"}`}>{h.freeCores} cores</div>
                                <div className="text-[10px] text-gray-400 mt-0.5">Libre</div>
                              </div>
                              <div className="rounded-xl bg-gray-50 border border-gray-100 p-2.5 text-center">
                                <div className={`text-sm font-semibold ${pctColor(h.n1CpuPct)}`}>{h.n1CpuPct}%</div>
                                <div className="text-[10px] text-gray-400 mt-0.5">N-1 CPU</div>
                              </div>
                              <div className="rounded-xl bg-gray-50 border border-gray-100 p-2.5 text-center">
                                <div className="text-sm font-semibold text-gray-700">{h.oversub}</div>
                                <div className="text-[10px] text-gray-400 mt-0.5">Oversub.</div>
                              </div>
                            </div
>
                            {statusBadge(h.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                    {/* Right column */}
                    <div className="space-y-4 xl:pt-10">
                      {/* Équilibrage */}
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-semibold text-gray-900">Équilibrage cluster (CPU)</h3>
                          <i className="ti ti-info-circle text-gray-300 text-base"/>
                        </div>

                        <div className="space-y-3">
                          {[...hostWithN1].sort((a,b)=>b.cpuPct-a.cpuPct).map((h,i)=>(
                            <div key={i}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-gray-700">{h.name}</span>
                                <span className={`font-semibold ${pctColor(h.cpuPct)}`}>{h.cpuPct}%</span>
                              </div>
                              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${barColor(h.cpuPct)}`} style={{width:Math.min(100,h.cpuPct)+"%"}}/>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between text-[10px] text-gray-300 mt-3">
                          <span>0%</span><span>50%</span><span>70%</span><span>85%</span><span>100%</span>
                        </div>
                      </div>

                      {/* N-1 Projection */}
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-semibold text-gray-900">Projection N-1 (perte d'un hôte)</h3>
                          <i className="ti ti-info-circle text-gray-300 text-base"/>
                        </div>

                        <div className="grid grid-cols-1 gap-3 mb-3">
                          <div className="rounded-xl bg-gray-50 p-3 text-center">
                            <div className="text-xs text-gray-500 mb-1">CPU projeté</div>
                            <div className={`text-2xl font-semibold ${pctColor(n1CpuPct)}`}>{n1CpuPct}%</div>
                            <div className={`text-xs font-semibold mt-1 ${pctColor(n1CpuPct)}`}>
                              {n1CpuPct>=85?"● Critique":n1CpuPct>=70?"● Tension":n1CpuPct>=50?"● Surveillance":"● Confortable"}
                            </div>
                          </div>
                        </div>

                        <div className="text-xs text-gray-400 text-center">
                          {n1CpuPct>=85||n1RamPct>=85?"Cluster sous forte pression en cas de perte d'un hôte.":"Cluster résilient en cas de perte d'un hôte."}
                        </div>
                      </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900">Timeline saturation <span className="font-normal text-gray-400">(estimation)</span></h3>
                        <i className="ti ti-info-circle text-gray-300 text-base"/>
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs text-gray-500">Croissance :</span>
                        {[10,20,30].map(r=>(
                          <button key={r}
                            onClick={()=>setGrowthRate(r)}
                            className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-colors ${growthRate===r?"bg-blue-50 border-blue-200 text-blue-700":"border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                            {r}%/an
                          </button>
                        ))}
                      </div>

                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left text-gray-400 font-medium pb-2">Horizon</th>
                            <th className="text-center text-gray-400 font-medium pb-2">CPU</th>
                            <th className="text-center text-gray-400 font-medium pb-2">RAM</th>
                          </tr>
                        </thead>
                        <tbody>
                          {timeline.map((t,i)=>(
                            <tr key={i} className="border-b border-gray-50 last:border-0">
                              <td className="py-2 font-medium text-gray-700">{t.months} mois</td>
                              <td className="py-2 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${barColor(t.cpu)}`} style={{width:Math.min(100,t.cpu)+"%"}}/>
                                  </div>
                                  <span className={`font-semibold ${pctColor(t.cpu)}`}>{t.cpu}%</span>
                                </div>
                              </td>
                              <td className="py-2 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${barColorRam(t.ram)}`} style={{width:Math.min(100,t.ram)+"%"}}/>
                                  </div>
                                  <span className={`font-semibold ${pctColor(t.ram)}`}>{t.ram}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="text-[10px] text-gray-300 italic mt-3">
                        Projection basée sur un taux de croissance estimé — ajustable
                      </div>
                    </div>
                    </div>
                </div>

                  {/* Bottom: Timeline + Recommandations + Top VMs */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {/* Recommandations */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Recommandations d'optimisation</h3>
                      <div className="space-y-3">
                        {(insights||[]).filter(i=>i.severity==="critical"||i.severity==="warning"||i.severity==="info").slice(0,4).map((ins,i)=>{
                          const dot = ins.severity==="critical"?"bg-red-500":ins.severity==="warning"?"bg-amber-400":"bg-blue-400";
                          const badge = ins.severity==="critical"?"bg-red-50 text-red-700 border-red-100":ins.severity==="warning"?"bg-amber-50 text-amber-700 border-amber-100":"bg-blue-50 text-blue-700 border-blue-100";
                          return (
                            <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                              <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dot}`}/>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-gray-700">{ins.recommendation||ins.title}</div>
                              </div>
                              {ins.impact && (
                                <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold flex-shrink-0 ${badge}`}>{ins.impact}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Top VMs */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Top VMs — Consommation CPU</h3>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left text-gray-400 font-medium pb-2">VM</th>
                            <th className="text-center text-gray-400 font-medium pb-2">vCPU</th>
                            <th className="text-left text-gray-400 font-medium pb-2">Utilisation CPU</th>
                            <th className="text-right text-gray-400 font-medium pb-2">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...(topCpuConsumers||[])].sort((a,b)=>(Number(b.cpuUsagePct||b.cpuOverallMhz)||0)-(Number(a.cpuUsagePct||a.cpuOverallMhz)||0)).slice(0,5).map((vm,i)=>{
                            const pct = Number(vm.cpuUsagePct||vm.cpuReadinessPct||vm.cpuPercent||0);
                            const isWin = (vm.os||"").toLowerCase().includes("win");
                            return (
                              <tr key={i} className="border-b border-gray-50 last:border-0">
                                <td className="py-2">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-base ${isWin?"text-blue-500":"text-orange-500"}`}>
                                      <i className={`ti ${isWin?"ti-brand-windows":"ti-terminal-2"}`}/>
                                    </span>
                                    <span className="font-medium text-gray-700 truncate max-w-[120px]">{vm.name||vm.id}</span>
                                  </div>
                                </td>
                                <td className="py-2 text-center text-gray-600">{vm.vcpu||vm.vCpu||0}</td>
                                <td className="py-2">
                                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-full">
                                    <div className={`h-full rounded-full ${barColor(pct)}`} style={{width:Math.min(100,pct)+"%"}}/>
                                  </div>
                                </td>
                                <td className={`py-2 text-right font-semibold ${pctColor(pct)}`}>{pct}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
              </>
            );
          })()}
        </div>
      )}

{activeTab==="memory"&&(
        <div className="space-y-4">
          {(()=>{
            const hostList = hosts || [];
            const totalRam = clusterSummary.totalRamGb || 0;
            const allocatedRam = clusterSummary.allocatedRamGb || 0;
            const activeVms = clusterSummary.activeVms || 0;

            const avgRamPct = hostList.length ? Math.round(hostList.reduce((s,h)=>s+(Number(h.ramUsagePct||h.ramUsagePercent)||0),0)/hostList.length) : 0;
            const overcommitRatio = totalRam > 0 ? (allocatedRam/totalRam).toFixed(1) : "N/A";
            const avgRamPerVm = activeVms > 0 ? Math.round(allocatedRam/activeVms) : 0;

            // Memory Score
            const oversubScore = allocatedRam/totalRam < 1.5 ? 30 : allocatedRam/totalRam < 2.5 ? 20 : 10;
            const ramScore = avgRamPct < 50 ? 35 : avgRamPct < 70 ? 25 : avgRamPct < 85 ? 15 : 5;
            const balanceScore = (() => {
              if (hostList.length < 2) return 35;
              const rams = hostList.map(h=>Number(h.ramUsagePct||h.ramUsagePercent)||0);
              const max = Math.max(...rams), min = Math.min(...rams);
              return max-min < 20 ? 35 : max-min < 40 ? 25 : max-min < 60 ? 15 : 5;
            })();
            const memScore = Math.min(100, oversubScore + ramScore + balanceScore);
            const memScoreLabel = memScore >= 80 ? "Bonne gestion mémoire" : memScore >= 60 ? "Gestion acceptable" : "Optimisation requise";
            const memScoreSub = memScore >= 80 ? "Quelques optimisations possibles" : memScore >= 60 ? "Rightsizing recommandé" : "Action corrective urgente";

            // Oversized VMs
            const oversizedVms = (topMemoryConsumers||[]).filter(v=>v.ramGb>0&&v.usedRamGb>0&&v.ramGb>2*v.usedRamGb);
            const recoverableRam = Math.round(oversizedVms.reduce((s,v)=>s+(v.ramGb-v.usedRamGb*1.2),0));

            // Min hosts by RAM
            const totalUsedRam = hostList.reduce((s,h)=>s+(Math.round((Number(h.ramUsagePct||h.ramUsagePercent)||0)/100*(h.totalRamGb||0))),0);
            const maxRamPerHost = hostList.length ? Math.max(...hostList.map(h=>h.totalRamGb||0)) : 0;
            const minHostsByRam = maxRamPerHost > 0 ? Math.max(1, Math.ceil(totalUsedRam/maxRamPerHost)) : hostList.length;
            const savedHostsRam = Math.max(0, hostList.length - minHostsByRam);
            const savedRamGb = savedHostsRam * Math.round(totalRam/hostList.length);

            // N-1 RAM
            const worstRamHost = [...hostList].sort((a,b)=>(Number(b.ramUsagePct||b.ramUsagePercent)||0)-(Number(a.ramUsagePct||a.ramUsagePercent)||0))[0];
            const worstRamGb = worstRamHost?.totalRamGb || Math.round(totalRam/hostList.length);
            const remainRam = totalRam - worstRamGb;
            const n1RamPct = remainRam > 0 ? Math.min(99, Math.round(totalUsedRam/remainRam*100)) : 99;

            // Timeline
            const gr = (growthRate||20)/100;
            const timeline = [3,6,12].map(m=>({
              months: m,
              ram: Math.min(99, Math.round(avgRamPct*(1+gr*m/12))),
            }));

            // Host with N-1
            const hostWithN1 = hostList.map(h => {
              const others = hostList.filter(x=>x.name!==h.name);
              const otherRam = others.reduce((s,x)=>s+(x.totalRamGb||0),0);
              const usedRam = hostList.reduce((s,x)=>s+(Math.round((Number(x.ramUsagePct||x.ramUsagePercent)||0)/100*(x.totalRamGb||0))),0);
              const n1r = otherRam > 0 ? Math.min(99,Math.round(usedRam/otherRam*100)) : 0;
              const ramPct = Number(h.ramUsagePct||h.ramUsagePercent)||0;
              const allocPct = totalRam > 0 ? Math.round((h.totalRamGb||0)/totalRam*allocatedRam/(h.totalRamGb||1)*100) : 0;
              const freeRamGb = Math.round((1-ramPct/100)*(h.totalRamGb||0));
              const oversub = (h.totalRamGb||0) > 0 ? ((allocatedRam/hostList.length)/(h.totalRamGb||1)).toFixed(1)+":1" : "N/A";
              const status = ramPct>=85?"critical":ramPct>=70?"warning":ramPct>=50?"watch":"healthy";
              return {...h, n1RamPct:n1r, freeRamGb, oversub, status, ramPct, allocPct};
            });

            const pctColor = (p) => p>=85?"text-red-600":p>=70?"text-amber-600":p>=50?"text-orange-500":"text-emerald-600";
            const barColorRam = (p) => p>=85?"bg-red-500":p>=70?"bg-amber-400":p>=50?"bg-orange-400":"bg-violet-500";

            const statusBadge = (s) => {
              if (s==="critical") return <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-100 font-semibold"><i className="ti ti-alert-triangle"/>Critique</span>;
              if (s==="warning") return <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 font-semibold"><i className="ti ti-alert-circle"/>Surveillance</span>;
              if (s==="watch") return <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-100 font-semibold"><i className="ti ti-eye"/>Tension</span>;
              return <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold"><i className="ti ti-shield-check"/>Confortable</span>;
            };

            return (
              <>
                {/* KPI Bar */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  {[
                    {icon:"ti-database", label:"TOTAL RAM PHYSIQUE", value:formatRam(totalRam), sub:`${hostList.length} hôtes physiques`},
                    {icon:"ti-layers-intersect", label:"RAM ALLOUÉE", value:formatRam(allocatedRam), sub:`ratio d'allocation ${overcommitRatio}:1`},
                    {icon:"ti-arrows-exchange", label:"OVERCOMMIT RATIO", value:`${overcommitRatio}:1`, sub:"allocation vs physique"},
                    {icon:"ti-device-desktop", label:"AVG RAM / VM", value:`${avgRamPerVm} GB`, sub:"par VM active"},
                  ].map((k,i)=>(
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                          <i className={`ti ${k.icon} text-violet-600 text-base`}/>
                        </div>
                        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{k.label}</div>
                      </div>
                      <div className="text-2xl font-semibold text-gray-900">{k.value}</div>
                      <div className="text-xs text-gray-500 mt-1">{k.sub}</div>
                    </div>
                  ))}
                  {/* Memory Score */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3"/>
                        <circle cx="18" cy="18" r="15.9" fill="none"
                          stroke={memScore>=80?"#8b5cf6":memScore>=60?"#f59e0b":"#ef4444"}
                          strokeWidth="3"
                          strokeDasharray={`${memScore} ${100-memScore}`}
                          strokeLinecap="round"/>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-900">{memScore}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">MEMORY SCORE</div>
                      <div className="text-sm font-semibold text-gray-900 mt-1">{memScoreLabel}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{memScoreSub}</div>
                    </div>
                  </div>
                </div>

                {/* Optimization Banner */}
                <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center gap-5">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <i className="ti ti-trending-up text-violet-600 text-xl"/>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-violet-700">Mémoire optimisable</div>
                      <div className="text-sm text-violet-600">~{recoverableRam} GB récupérables sur VMs surdimensionnées</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {savedHostsRam > 0 && <>
                      <div className="text-sm font-semibold text-gray-700">{minHostsByRam} hôte{minHostsByRam>1?"s":""} suffira{minHostsByRam>1?"ient":"it"} pour la charge RAM actuelle</div>
                      <span className="text-xs px-3 py-1 rounded-full bg-white border border-violet-200 text-violet-700 font-semibold">−{savedHostsRam} serveur{savedHostsRam>1?"s":""}</span>
                      <span className="text-xs px-3 py-1 rounded-full bg-white border border-blue-200 text-blue-700 font-semibold">{savedRamGb} GB libérés</span>
                    </>}
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <div className="text-xl font-semibold text-violet-600">{avgRamPct}%</div>
                      <div className="text-xs text-gray-500">RAM moyenne</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-semibold text-emerald-600">0 GB</div>
                      <div className="text-xs text-gray-500">Balloon/Swap</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
                  {/* Host cards */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">Utilisation RAM par hôte</h3>
                    {hostWithN1.map((h,i)=>(
                      <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="grid grid-cols-1 lg:grid-cols-[270px_1fr_190px] gap-4 items-center">
                          {/* Left: identity */}
                          <div className="flex flex-col items-center gap-2">
                            <ServerRackVisual compact health={h.status==="critical"?"critical":h.status==="warning"?"warning":"healthy"}/>
                            <div className="text-center">
                              <div className="font-semibold text-gray-900 text-sm truncate max-w-[240px]">{h.name}</div>
                              <div className="flex items-center justify-center gap-1 text-xs text-emerald-600 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"/>En ligne
                              </div>
                              <div className="text-xs text-gray-500 mt-1">{h.totalRamGb||0} GB · {h.vmsCount||0} VMs</div>
                            </div>
                          </div>
                          {/* Middle: bars */}
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-500">RAM utilisée</span>
                                <span className={`font-semibold ${pctColor(h.ramPct)}`}>{h.ramPct}%</span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${barColorRam(h.ramPct)}`} style={{width:Math.min(100,h.ramPct)+"%"}}/>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-500">RAM allouée</span>
                                <span className="font-semibold text-blue-600">{h.allocPct}%</span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-blue-400" style={{width:Math.min(100,h.allocPct)+"%"}}/>
                              </div>
                            </div>
                          </div>
                          {/* Right: metrics + badge */}
                          <div className="flex flex-col justify-center gap-3">
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="rounded-xl bg-gray-50 border border-gray-100 p-2.5 text-center">
                                <div className={`text-sm font-semibold ${h.freeRamGb<=10?"text-red-600":h.freeRamGb<=30?"text-amber-600":"text-emerald-600"}`}>{h.freeRamGb}GB</div>
                                <div className="text-[10px] text-gray-400 mt-0.5">Libre</div>
                              </div>
                              <div className="rounded-xl bg-gray-50 border border-gray-100 p-2.5 text-center">
                                <div className={`text-sm font-semibold ${pctColor(h.n1RamPct)}`}>{h.n1RamPct}%</div>
                                <div className="text-[10px] text-gray-400 mt-0.5">N-1 RAM</div>
                              </div>
                              <div className="rounded-xl bg-gray-50 border border-gray-100 p-2.5 text-center">
                                <div className="text-sm font-semibold text-gray-700">{h.oversub}</div>
                                <div className="text-[10px] text-gray-400 mt-0.5">Oversub.</div>
                              </div>
                            </div>
                            {statusBadge(h.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Right column */}
                  <div className="space-y-4 xl:pt-10">
                    {/* Équilibrage RAM */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-900">Équilibrage cluster (RAM)</h3>
                        <i className="ti ti-info-circle text-gray-300 text-base"/>
                      </div>
                      <div className="space-y-3">
                        {[...hostWithN1].sort((a,b)=>b.ramPct-a.ramPct).map((h,i)=>(
                          <div key={i}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-medium text-gray-700">{h.name}</span>
                              <span className={`font-semibold ${pctColor(h.ramPct)}`}>{h.ramPct}%</span>
                            </div>
                            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${barColorRam(h.ramPct)}`} style={{width:Math.min(100,h.ramPct)+"%"}}/>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-300 mt-3">
                        <span>0%</span><span>50%</span><span>70%</span><span>85%</span><span>100%</span>
                      </div>
                    </div>

                    {/* N-1 RAM */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-900">Projection N-1 (perte d'un hôte)</h3>
                        <i className="ti ti-info-circle text-gray-300 text-base"/>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-4 text-center mb-3">
                        <div className="text-xs text-gray-500 mb-1">RAM projetée</div>
                        <div className={`text-3xl font-semibold ${pctColor(n1RamPct)}`}>{n1RamPct}%</div>
                        <div className={`text-xs font-semibold mt-1 ${pctColor(n1RamPct)}`}>
                          {n1RamPct>=85?"● Critique":n1RamPct>=70?"● Tension":n1RamPct>=50?"● Surveillance":"● Confortable"}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 text-center">
                        {n1RamPct>=85?"Cluster sous forte pression en cas de perte d'un hôte.":"Cluster résilient en cas de perte d'un hôte."}
                      </div>
                      <div className="text-[10px] text-gray-300 text-center mt-1">Basé sur redistribution de la charge RAM</div>
                    </div>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">Timeline saturation RAM <span className="font-normal text-gray-400">(estimation)</span></h3>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs text-gray-500">Croissance :</span>
                      {[10,20,30].map(r=>(
                        <button key={r}
                          onClick={()=>setGrowthRate(r)}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-colors ${growthRate===r?"bg-violet-50 border-violet-200 text-violet-700":"border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                          {r}%/an
                        </button>
                      ))}
                    </div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left text-gray-400 font-medium pb-2">Horizon</th>
                          <th className="text-center text-gray-400 font-medium pb-2">RAM</th>
                        </tr>
                      </thead>
                      <tbody>
                        {timeline.map((t,i)=>(
                          <tr key={i} className="border-b border-gray-50 last:border-0">
                            <td className="py-2 font-medium text-gray-700">{t.months} mois</td>
                            <td className="py-2 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${barColorRam(t.ram)}`} style={{width:Math.min(100,t.ram)+"%"}}/>
                                </div>
                                <span className={`font-semibold ${pctColor(t.ram)}`}>{t.ram}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="text-[10px] text-gray-300 italic mt-3">Projection basée sur un taux de croissance estimé — ajustable</div>
                  </div>
                  </div>
                </div>

                {/* Bottom section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Timeline RAM */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">VMs surdimensionnées <span className="font-normal text-gray-400">(RAM)</span></h3>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left text-gray-400 font-medium pb-2">VM</th>
                          <th className="text-center text-gray-400 font-medium pb-2">Allouée</th>
                          <th className="text-center text-gray-400 font-medium pb-2">Utilisée</th>
                          <th className="text-center text-gray-400 font-medium pb-2">Gaspillage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {oversizedVms.slice(0,5).map((vm,i)=>{
                          const waste = Math.round(vm.ramGb - vm.usedRamGb);
                          const wastePct = vm.ramGb > 0 ? Math.round(waste/vm.ramGb*100) : 0;
                          return (
                            <tr key={i} className="border-b border-gray-50 last:border-0">
                              <td className="py-2 font-medium text-gray-700 truncate max-w-[100px]">{vm.name||vm.id}</td>
                              <td className="py-2 text-center text-gray-600">{vm.ramGb}GB</td>
                              <td className="py-2 text-center text-gray-600">{vm.usedRamGb}GB</td>
                              <td className="py-2 text-center">
                                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 font-semibold">{waste}GB ({wastePct}%)</span>
                              </td>
                            </tr>
                          );
                        })}
                        {oversizedVms.length===0&&(
                          <tr><td colSpan="4" className="py-6 text-center text-gray-400">Aucune VM surdimensionnée détectée.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Indicateurs mémoire */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Indicateurs mémoire</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-gray-50 p-3 text-center">
                        <div className="text-xs text-gray-500 mb-1">Balloon mémoire</div>
                        <div className="text-xl font-semibold text-emerald-600">0 GB</div>
                        <div className="text-[10px] text-emerald-500 mt-0.5">● Aucun balloon actif</div>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-3 text-center">
                        <div className="text-xs text-gray-500 mb-1">Swap utilisé</div>
                        <div className="text-xl font-semibold text-emerald-600">0 GB</div>
                        <div className="text-[10px] text-emerald-500 mt-0.5">● Aucun swap actif</div>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-3 text-center">
                        <div className="text-xs text-gray-500 mb-1">VMs oversizées</div>
                        <div className={`text-xl font-semibold ${oversizedVms.length>0?"text-amber-600":"text-emerald-600"}`}>{oversizedVms.length}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">allouée &gt; 2× utilisée</div>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-3 text-center">
                        <div className="text-xs text-gray-500 mb-1">RAM récupérable</div>
                        <div className="text-xl font-semibold text-blue-600">~{recoverableRam} GB</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">si rightsizing appliqué</div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

{activeTab==="storage"&&(
        <div className="space-y-4">
          {(()=>{
            const dsList = datastores || [];
            const totalCapMib = dsList.reduce((s,d)=>s+(d.capMib||0),0);
            const totalUsedMib = dsList.reduce((s,d)=>s+(d.inUseMib||0),0);
            const totalFreeMib = totalCapMib - totalUsedMib;
            const avgUsedPct = totalCapMib > 0 ? Math.round(totalUsedMib/totalCapMib*100) : 0;
            const totalCapTb = (totalCapMib/1024/1024).toFixed(1);
            const totalUsedTb = (totalUsedMib/1024/1024).toFixed(1);
            const totalFreeTb = (totalFreeMib/1024/1024).toFixed(1);

            const criticalDs = dsList.filter(d=>d.capMib>0&&Math.round(d.inUseMib/d.capMib*100)>=80);
            const warningDs = dsList.filter(d=>d.capMib>0&&Math.round(d.inUseMib/d.capMib*100)>=60&&Math.round(d.inUseMib/d.capMib*100)<80);

            const storageScore = (() => {
              if (avgUsedPct >= 85) return 30;
              if (avgUsedPct >= 70) return 55;
              if (avgUsedPct >= 60) return 70;
              return 85;
            })();
            const scoreLabel = storageScore >= 80 ? "Stockage sain" : storageScore >= 60 ? "Surveillance recommandée" : storageScore >= 40 ? "Capacité critique" : "Action urgente";
            const scoreSub = storageScore >= 80 ? "Capacité confortable" : storageScore >= 60 ? "Capacité à surveiller" : "Migration recommandée";

            const gr = (growthRate||20)/100;
            const daysToSat = totalFreeMib > 0 && totalUsedMib > 0
              ? Math.round(totalFreeMib / (totalUsedMib * gr / 365))
              : 999;

            const timeline = [3,6,12].map(m=>({
              months: m,
              pct: Math.min(99, Math.round(avgUsedPct*(1+gr*m/12))),
            }));

            const vmfsDs = dsList.filter(d=>(d.type||"").toUpperCase().includes("VMFS"));
            const nfsDs = dsList.filter(d=>(d.type||"").toUpperCase().includes("NFS"));
            const vmfsCap = (vmfsDs.reduce((s,d)=>s+(d.capMib||0),0)/1024/1024).toFixed(1);
            const nfsCap = (nfsDs.reduce((s,d)=>s+(d.capMib||0),0)/1024/1024).toFixed(1);

            const pctColor = (p) => p>=80?"text-red-600":p>=60?"text-amber-600":"text-emerald-600";
            const barColor = (p) => p>=80?"bg-red-500":p>=60?"bg-amber-400":"bg-emerald-500";

            const fmtMib = (mib) => {
              if (mib >= 1024*1024) return (mib/1024/1024).toFixed(1)+" To";
              return (mib/1024).toFixed(0)+" GB";
            };

            const dsWithPct = dsList.map(d=>({
              ...d,
              pct: d.capMib>0 ? Math.round(d.inUseMib/d.capMib*100) : 0,
            })).sort((a,b)=>b.pct-a.pct);

            const topCritical = dsWithPct.slice(0,4);

            return (
              <>
                {/* KPI Bar */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  {[
                    {icon:"ti-database", label:"TOTAL CAPACITÉ", value:`${totalCapTb} To`, sub:"cluster total"},
                    {icon:"ti-chart-pie", label:"CAPACITÉ UTILISÉE", value:`${totalUsedTb} To`, sub:`${avgUsedPct}% du total`, color:"text-amber-600"},
                    {icon:"ti-circle-check", label:"CAPACITÉ LIBRE", value:`${totalFreeTb} To`, sub:"disponible", color:"text-emerald-600"},
                    {icon:"ti-layers-subtract", label:"DATASTORES", value:dsList.length, sub:"volumes montés"},
                  ].map((k,i)=>(
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                          <i className={`ti ${k.icon} text-emerald-600 text-base`}/>
                        </div>
                        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{k.label}</div>
                      </div>
                      <div className={`text-2xl font-semibold ${k.color||"text-gray-900"}`}>{k.value}</div>
                      <div className={`text-xs mt-1 ${k.color?"font-semibold "+k.color:"text-gray-500"}`}>{k.sub}</div>
                    </div>
                  ))}
                  {/* Storage Score */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3"/>
                        <circle cx="18" cy="18" r="15.9" fill="none"
                          stroke={storageScore>=80?"#10b981":storageScore>=60?"#f59e0b":"#ef4444"}
                          strokeWidth="3"
                          strokeDasharray={`${storageScore} ${100-storageScore}`}
                          strokeLinecap="round"/>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-900">{storageScore}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">STORAGE SCORE</div>
                      <div className={`text-sm font-semibold mt-1 ${storageScore>=80?"text-emerald-600":storageScore>=60?"text-amber-600":"text-red-600"}`}>{scoreLabel}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{scoreSub}</div>
                    </div>
                  </div>
                </div>

                {/* Banner */}
                <div className={`border rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center gap-5 ${criticalDs.length>0?"bg-amber-50 border-amber-100":"bg-emerald-50 border-emerald-100"}`}>
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${criticalDs.length>0?"bg-amber-100":"bg-emerald-100"}`}>
                      <i className={`ti ${criticalDs.length>0?"ti-alert-triangle text-amber-600":"ti-shield-check text-emerald-600"} text-xl`}/>
                    </div>
                    <div>
                      <div className={`text-lg font-semibold ${criticalDs.length>0?"text-amber-700":"text-emerald-700"}`}>
                        {criticalDs.length>0?"Stockage sous surveillance":"Stockage sain"}
                      </div>
                      <div className={`text-sm ${criticalDs.length>0?"text-amber-600":"text-emerald-600"}`}>
                        {criticalDs.length>0?`${criticalDs.length} datastore${criticalDs.length>1?"s":""} dépassent 80% de capacité`:"Tous les datastores sont dans les limites acceptables"}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-white/80 rounded-xl px-5 py-3 text-center">
                      <div className={`text-xl font-semibold ${pctColor(avgUsedPct)}`}>{avgUsedPct}%</div>
                      <div className="text-xs text-gray-500">Utilisation moyenne</div>
                    </div>
                    <div className="bg-white/80 rounded-xl px-5 py-3 text-center">
                      <div className={`text-xl font-semibold ${daysToSat<60?"text-red-600":daysToSat<120?"text-amber-600":"text-emerald-600"}`}>
                        {daysToSat>=999?"∞":daysToSat+"j"}
                      </div>
                      <div className="text-xs text-gray-500">Jours avant saturation</div>
                    </div>
                  </div>
                </div>

                {/* Main grid */}
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
                  {/* Datastores table */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <i className="ti ti-database text-gray-400 text-lg"/>
                      <h3 className="text-lg font-semibold text-gray-900">Datastores</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-100">
                            {["Nom","Type","Capacité","Utilisé","Libre","Utilisation","Hôtes","VMs"].map(h=>(
                              <th key={h} className="text-left text-gray-400 font-medium pb-3 pr-3 whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {dsWithPct.map((d,i)=>(
                            <tr key={i} className="border-b border-gray-50 last:border-0">
                              <td className="py-2.5 pr-3 font-semibold text-gray-800 whitespace-nowrap">{d.name}</td>
                              <td className="py-2.5 pr-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${(d.type||"").toUpperCase().includes("NFS")?"bg-violet-50 text-violet-700 border border-violet-100":"bg-blue-50 text-blue-700 border border-blue-100"}`}>
                                  {d.type||"VMFS"}
                                </span>
                              </td>
                              <td className="py-2.5 pr-3 text-gray-600">{fmtMib(d.capMib)}</td>
                              <td className="py-2.5 pr-3 text-gray-600">{fmtMib(d.inUseMib)}</td>
                              <td className="py-2.5 pr-3 text-gray-600">{fmtMib(d.capMib-d.inUseMib)}</td>
                              <td className="py-2.5 pr-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${barColor(d.pct)}`} style={{width:Math.min(100,d.pct)+"%"}}/>
                                  </div>
                                  <span className={`font-semibold ${pctColor(d.pct)}`}>{d.pct}%</span>
                                </div>
                              </td>
                              <td className="py-2.5 pr-3 text-gray-600 text-center">{d.hosts||0}</td>
                              <td className="py-2.5 text-gray-600 text-center">{d.vms||0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right column */}
                  <div className="space-y-4">
                    {/* Répartition par type */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Répartition par type</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-center">
                          <div className="text-2xl font-semibold text-blue-700">{vmfsDs.length}</div>
                          <div className="text-xs font-semibold text-blue-600 mt-1">VMFS</div>
                          <div className="text-xs text-blue-500 mt-0.5">{vmfsCap} To</div>
                        </div>
                        <div className="rounded-xl bg-violet-50 border border-violet-100 p-3 text-center">
                          <div className="text-2xl font-semibold text-violet-700">{nfsDs.length}</div>
                          <div className="text-xs font-semibold text-violet-600 mt-1">NFS</div>
                          <div className="text-xs text-violet-500 mt-0.5">{nfsCap} To</div>
                        </div>
                      </div>
                    </div>

                    {/* Top critiques */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Top datastores critiques</h3>
                      <div className="space-y-3">
                        {topCritical.map((d,i)=>(
                          <div key={i}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-medium text-gray-700 truncate max-w-[160px]">{d.name}</span>
                              <span className={`font-semibold ${pctColor(d.pct)}`}>{d.pct}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${barColor(d.pct)}`} style={{width:Math.min(100,d.pct)+"%"}}/>
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{fmtMib(d.capMib-d.inUseMib)} libre</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Timeline stockage */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Timeline saturation <span className="font-normal text-gray-400">(estimation)</span></h3>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs text-gray-500">Croissance :</span>
                        {[10,20,30].map(r=>(
                          <button key={r}
                            onClick={()=>setGrowthRate(r)}
                            className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-colors ${growthRate===r?"bg-emerald-50 border-emerald-200 text-emerald-700":"border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                            {r}%/an
                          </button>
                        ))}
                      </div>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left text-gray-400 font-medium pb-2">Horizon</th>
                            <th className="text-center text-gray-400 font-medium pb-2">Utilisation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {timeline.map((t,i)=>(
                            <tr key={i} className="border-b border-gray-50 last:border-0">
                              <td className="py-2 font-medium text-gray-700">{t.months} mois</td>
                              <td className="py-2 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${barColor(t.pct)}`} style={{width:Math.min(100,t.pct)+"%"}}/>
                                  </div>
                                  <span className={`font-semibold ${pctColor(t.pct)}`}>{t.pct}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="text-[10px] text-gray-300 italic mt-3">Projection basée sur un taux de croissance estimé — ajustable</div>
                    </div>
                  </div>
                </div>

                {/* Bottom */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* VMs par datastore */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">VMs par datastore <span className="font-normal text-gray-400">(Top 5)</span></h3>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left text-gray-400 font-medium pb-2">Datastore</th>
                          <th className="text-center text-gray-400 font-medium pb-2">VMs hébergées</th>
                          <th className="text-right text-gray-400 font-medium pb-2">Espace moyen/VM</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dsWithPct.filter(d=>d.vms>0).slice(0,5).map((d,i)=>{
                          const avgPerVm = d.vms>0 ? Math.round(d.inUseMib/d.vms/1024) : 0;
                          return (
                            <tr key={i} className="border-b border-gray-50 last:border-0">
                              <td className="py-2.5 font-medium text-gray-700 truncate max-w-[150px]">{d.name}</td>
                              <td className="py-2.5 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-blue-400" style={{width:Math.min(100,d.vms/Math.max(...dsWithPct.map(x=>x.vms||0))*100)+"%"}}/>
                                  </div>
                                  <span className="text-gray-700 font-semibold">{d.vms}</span>
                                </div>
                              </td>
                              <td className="py-2.5 text-right text-gray-600">{avgPerVm} GB</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Recommandations stockage */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Recommandations stockage</h3>
                    <div className="space-y-3">
                      {criticalDs.slice(0,2).map((d,i)=>(
                        <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50">
                          <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-red-500"/>
                          <div className="flex-1">
                            <div className="text-xs font-semibold text-gray-800">{d.name} critique — migration recommandée</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">Le datastore dépasse {d.pct}% de capacité.</div>
                          </div>
                          <span className="text-[11px] px-2 py-0.5 rounded-full border bg-red-50 text-red-700 border-red-100 font-semibold flex-shrink-0">Impact: Élevé</span>
                        </div>
                      ))}
                      {warningDs.slice(0,2).map((d,i)=>(
                        <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50">
                          <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-amber-400"/>
                          <div className="flex-1">
                            <div className="text-xs font-semibold text-gray-800">{d.name} à surveiller</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">Utilisation à {d.pct}% — prévoir extension.</div>
                          </div>
                          <span className="text-[11px] px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-100 font-semibold flex-shrink-0">Impact: Moyen</span>
                        </div>
                      ))}
                      {daysToSat<120&&(
                        <div className="flex items-start gap-3 py-2">
                          <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-blue-400"/>
                          <div className="flex-1">
                            <div className="text-xs font-semibold text-gray-800">Prévoir extension capacité dans {daysToSat}j</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">La tendance indique un dépassement à ~{daysToSat} jours.</div>
                          </div>
                          <span className="text-[11px] px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-100 font-semibold flex-shrink-0">Planification</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

{activeTab==="network"&&(()=>{
        const nd = networkData||{};
          const claudeInsights = nd.claudeInsights || null;
          console.log("🔎 SizingHUB networkData keys:", Object.keys(nd || {}));
          console.log("🔎 SizingHUB hbaRows:", nd.hbaRows);
          console.log("🔎 SizingHUB networkData full:", nd);
        const hostsNics = nd.hostsNics||[];
          const hbaRows = nd.hbaRows || nd.vHBA || nd.vhba || nd.hba || [];
        const allVlans = nd.vlans||vlans||[];
        const allVSwitches = nd.vSwitches||vSwitches||[];
        const allDvSwitches = nd.dvSwitches||dvSwitches||[];
        const allPGs = nd.uniquePortGroups||uniquePortGroups||[];
        const totalNics = hostsNics.reduce((s,h)=>s+(h.nics||0),0);
        const segments = [...new Map(allVlans.map(v=>[v.name,v])).values()];

          const vmkRows = nd.vmKernel || nd.vmk || nd.vmkernels || nd.vmkernel || nd.vSC_VMK || [];
          const datastoreRows = nd.datastores || datastores || [];

          const networkText = [
            ...segments.map(s=>s.name||""),
            ...allPGs.map(p=>p.portGroup||p.name||p.network||""),
            ...allVSwitches.map(sw=>sw.name||""),
            ...allDvSwitches.map(sw=>sw.name||""),
            ...vmkRows.map(v=>Object.values(v||{}).join(" "))
          ].join(" ").toLowerCase();

          const datastoreText = datastoreRows
            .map(d=>Object.values(d||{}).join(" "))
            .join(" ")
            .toLowerCase();

          const vmotionNetworks = [...new Set(vmkRows
            .filter(v=>{
              const t = Object.values(v||{}).join(" ").toLowerCase();
              return t.includes("vmotion") || t.includes("v-motion") || t.includes("v motion") || t.includes("migration");
            })
            .map(v=>v.portGroup || v["Port Group"] || v.network || v["Network"] || v.name || v["Name"])
            .filter(Boolean)
          )];

          const storageNetworks = [...new Set(vmkRows
            .filter(v=>{
              const t = Object.values(v||{}).join(" ").toLowerCase();
              return t.includes("iscsi") || t.includes("nfs") || t.includes("storage") || t.includes("san") || t.includes("vmfs");
            })
            .map(v=>v.portGroup || v["Port Group"] || v.network || v["Network"] || v.name || v["Name"])
            .filter(Boolean)
          )];

          const hasVmotion =
            vmotionNetworks.length > 0 ||
            networkText.includes("vmotion") ||
            networkText.includes("v-motion") ||
            networkText.includes("v motion") ||
            networkText.includes("migration");

          const hasStorage =
            storageNetworks.length > 0 ||
            networkText.includes("iscsi") ||
            networkText.includes("nfs") ||
            networkText.includes("storage") ||
            networkText.includes("san") ||
            networkText.includes("vmfs") ||
            datastoreText.includes("iscsi") ||
            datastoreText.includes("nfs") ||
            datastoreText.includes("vmfs") ||
            datastoreText.includes("vsan");

          const hasManagement = segments.some(seg=>{
            const n=(seg.name||"").toLowerCase();
            return n.includes("mgmt")||n.includes("management")||n.includes("adm");
          });

          const redundancyScore = hostsNics.length===0 ? 0 : Math.round(
            hostsNics.filter(h=>(h.nics||0)>=2).length / hostsNics.length * 100
          );

          let networkScore = 55;
          if(hasVmotion) networkScore += 10;
          if(hasStorage) networkScore += 15;
          if(hasManagement) networkScore += 10;
          if(redundancyScore>=80) networkScore += 10;
          networkScore = Math.min(networkScore,100);

          const networkStatus =
            networkScore>=85 ? "Architecture réseau robuste" :
            networkScore>=70 ? "Architecture cohérente" :
            "Architecture à surveiller";

          const networkStatusColor =
            networkScore>=85 ? "text-emerald-600" :
            networkScore>=70 ? "text-amber-600" :
            "text-red-600";

          const networkStatusBg =
            networkScore>=85 ? "bg-emerald-50 border-emerald-100" :
            networkScore>=70 ? "bg-amber-50 border-amber-100" :
            "bg-red-50 border-red-100";

          const networkInsights = [];
          if(!hasVmotion) networkInsights.push({severity:"warning", text:"Aucun réseau vMotion dédié détecté."});
          if(!hasStorage) networkInsights.push({severity:"critical", text:"Aucun réseau stockage dédié détecté."});
          if(!hasManagement) networkInsights.push({severity:"warning", text:"Aucun réseau de management clairement identifié."});

        return (
          <div className="space-y-4">
              {/* NETWORK HEALTH */}
              <div className={"rounded-3xl border shadow-sm p-6 "+networkStatusBg}>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="relative w-28 h-28 flex-shrink-0">
                      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                        <circle cx="60" cy="60" r="48" fill="none" stroke="#e5e7eb" strokeWidth="10"/>
                        <circle
                          cx="60"
                          cy="60"
                          r="48"
                          fill="none"
                          stroke={networkScore>=85 ? "#10b981" : networkScore>=70 ? "#f59e0b" : "#ef4444"}
                          strokeWidth="10"
                          strokeLinecap="round"
                          strokeDasharray={301}
                          strokeDashoffset={301 - (301 * networkScore / 100)}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className={"text-3xl font-bold "+networkStatusColor}>{networkScore}</div>
                        <div className="text-xs text-gray-400">/100</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-widest text-gray-400 mb-1">Network Health</div>
                      <div className={"text-2xl font-semibold "+networkStatusColor}>{networkStatus}</div>
                      <div className="text-sm text-gray-500 mt-2 max-w-xl">
                        Analyse de segmentation, résilience réseau, isolation des flux et cohérence VMware.
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 text-center">
                      <div className="text-2xl font-semibold text-blue-600">{segments.length}</div>
                      <div className="text-xs text-gray-500 mt-1">Segments</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 text-center">
                      <div className="text-2xl font-semibold text-indigo-600">{totalNics}</div>
                      <div className="text-xs text-gray-500 mt-1">NICs</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 text-center">
                      <div className="text-2xl font-semibold text-emerald-600">{redundancyScore}%</div>
                      <div className="text-xs text-gray-500 mt-1">Redondance</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 text-center">
                      <div className={"text-2xl font-semibold "+(hasStorage?"text-emerald-600":"text-red-600")}>{hasStorage ? "OK" : "NON"}</div>
                      <div className="text-xs text-gray-500 mt-1">Stockage dédié</div>
                    </div>
                  </div>
                </div>

                {networkInsights.length>0&&(
                  <div className="mt-5 pt-5 border-t border-white/60">
                    <div className="text-xs uppercase tracking-widest text-gray-400 mb-3">Insights réseau détectés</div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                      {networkInsights.map((i,idx)=>(
                        <div key={idx} className={"rounded-2xl border px-4 py-3 flex items-start gap-3 "+(i.severity==="critical"?"bg-red-50 border-red-100":"bg-amber-50 border-amber-100")}>
                          {i.severity==="critical"
                            ? <AlertTriangle size={16} className="text-red-500 mt-0.5"/>
                            : <Info size={16} className="text-amber-500 mt-0.5"/>}
                          <div className={(i.severity==="critical"?"text-red-700":"text-amber-700")+" text-sm"}>{i.text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* KPIs Réseau Premium */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <div className="text-xs uppercase tracking-widest text-gray-400 mb-2">Hosts</div>
                  <div className="text-3xl font-semibold text-gray-800">{hosts.length}</div>
                  <div className="text-sm text-gray-500 mt-1">Noeuds connectés</div>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <div className="text-xs uppercase tracking-widest text-gray-400 mb-2">NICs physiques</div>
                  <div className="text-3xl font-semibold text-blue-600">{totalNics}</div>
                  <div className="text-sm text-gray-500 mt-1">Interfaces réseau</div>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <div className="text-xs uppercase tracking-widest text-gray-400 mb-2">Segments réseau</div>
                  <div className="text-3xl font-semibold text-violet-600">{segments.length}</div>
                  <div className="text-sm text-gray-500 mt-1">VLANs / Port Groups</div>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <div className="text-xs uppercase tracking-widest text-gray-400 mb-2">Redondance</div>
                  <div className={"text-3xl font-semibold "+(redundancyScore>=80?"text-emerald-600":"text-amber-600")}>{redundancyScore}%</div>
                  <div className="text-sm text-gray-500 mt-1">Résilience réseau</div>
                </div>
              </div>

              <NetworkFabric
                  hosts={hosts.length}
                  segments={segments.length}
                  portGroups={allPGs.length}
                  hasManagement={hasManagement}
                  hasVmotion={hasVmotion}
                  hasStorage={hasStorage}
                  redundancyScore={redundancyScore}
                  vmKernel={vmkRows}
                  segmentList={segments}
                  portGroupList={allPGs}
                  hostsNics={hostsNics}
                  hbaRows={hbaRows}
                />

            {/* Host NICs */}
            {/* Focus réseau nœud */}
            {hostsNics.length > 0 && (
              <FocusReseauNoeud vmkRows={vmkRows} hostsNics={hostsNics} claudeInsights={claudeInsights} />
            )}



            {/* VMkernel Adapters */}
            {vmkRows.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-800">VMkernel Adapters</h3>
                  <span className="text-xs text-gray-400">{vmkRows.length} adaptateur{vmkRows.length > 1 ? "s" : ""} détecté{vmkRows.length > 1 ? "s" : ""}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {["Host","Device","Port Group","VLAN","IP","Subnet","MTU","Rôle"].map(h => (
                          <th key={h} className="text-left text-gray-400 font-medium pb-2 pr-4 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {vmkRows.map((vmk, i) => {
                        const pg = (vmk.portGroup || "").toLowerCase();
                        const role =
                          pg.includes("vmotion") || pg.includes("v-motion") ? "vMotion" :
                          pg.includes("iscsi") || pg.includes("san") || pg.includes("nfs") || pg.includes("storage") ? "Storage" :
                          pg.includes("management") || pg.includes("mgmt") ? "Management" : "VM";
                        const roleStyle =
                          role === "vMotion"    ? "bg-violet-50 text-violet-700 border-violet-200" :
                          role === "Storage"    ? "bg-orange-50 text-orange-700 border-orange-200" :
                          role === "Management" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          "bg-sky-50 text-sky-700 border-sky-200";
                        const mtuWarn = role === "Storage" && vmk.mtu && vmk.mtu < 9000;
                        const cidr = vmk.subnet ? vmk.subnet.split(".").map(Number).reduce((a,b) => a + b.toString(2).split("").filter(c=>c==="1").length, 0) : null;
                        return (
                          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="py-2 pr-4 font-mono text-gray-700 whitespace-nowrap">{vmk.host || "—"}</td>
                            <td className="py-2 pr-4 font-mono text-blue-600 whitespace-nowrap">{vmk.device || "—"}</td>
                            <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">{vmk.portGroup || "—"}</td>
                            <td className="py-2 pr-4">
                              {vmk.vlan != null
                                ? <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{vmk.vlan}</span>
                                : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="py-2 pr-4 font-mono text-gray-800 whitespace-nowrap">{vmk.ip || "—"}</td>
                            <td className="py-2 pr-4 font-mono text-gray-500">{cidr ? `/${cidr}` : "—"}</td>
                            <td className="py-2 pr-4">
                              {vmk.mtu
                                ? <span className={mtuWarn ? "text-amber-600 font-semibold" : "text-gray-600"}>{vmk.mtu}{mtuWarn ? " ⚠" : ""}</span>
                                : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="py-2 pr-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${roleStyle}`}>
                                {role}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {vmkRows.some(v => (v.portGroup||"").toLowerCase().includes("iscsi") && v.mtu && v.mtu < 9000) && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                    <span>⚠</span>
                    <span>MTU 1500 détecté sur les interfaces iSCSI — jumbo frames (MTU 9000) recommandés pour optimiser les performances stockage</span>
                  </div>
                )}
              </div>
            )}
            {/* Network Segments - vue logique par type */}
            {(allVlans.length>0||allPGs.length>0)&&(
              <NetworkSegmentsView
                segments={(allVlans.length>0?allVlans:allPGs.map(p=>({name:p.portGroup,vlan:p.vlan,switch:p.switch,mtu:null}))).map(s=>({...s,vSwitchName:s.switch}))}
                totalHosts={hosts.length}
              />
            )}

            {/* vSwitches - vue logique regroupée */}
            {allVSwitches.length>0&&(
              <VSwitchesView
                vSwitches={allVSwitches}
                totalHosts={hosts.length}
              />
            )}

            {/* dvSwitches */}
            {allDvSwitches.length>0&&(
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-medium text-gray-800 mb-4">Distributed vSwitches ({allDvSwitches.length})</h3>
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
                    <span className={"text-3xl font-medium "+scoreColor}>{score}</span>
                    <span className="text-xs text-gray-400">/ 100</span>
                  </div>
                </div>
                <div className={"text-sm font-medium "+scoreColor}>{statusLabel}</div>
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
                    <div className={"text-2xl font-medium "+k.text}>{k.val}</div>
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
                  <h3 className="text-sm font-medium text-gray-800 mb-3">Quick Wins</h3>
                  <div className="space-y-3">
                    {qw.map(q=>(
                      <div key={q.id} className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Zap size={14} className="text-emerald-600"/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-800">{q.title}</div>
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
                <h3 className="text-sm font-medium text-gray-800 mb-3">Potential Savings</h3>
                <div className="space-y-3">
                  {[
                    {label:"CPU recuperable",     val:(savings.reclaimableCpu||0)+" vCPU",     color:"text-blue-600",   bg:"bg-blue-50"},
                    {label:"RAM recuperable",      val:(savings.reclaimableRamGb||0)+" Go",      color:"text-orange-500", bg:"bg-orange-50"},
                    {label:"Stockage recuperable", val:(savings.reclaimableStorageTb||0)+" To",  color:"text-emerald-600",bg:"bg-emerald-50"},
                    {label:"Reduction hosts",      val:savings.potentialHostReduction>0?(savings.potentialHostReduction+" host(s)"):"Aucune",color:"text-violet-600",bg:"bg-violet-50"},
                  ].map(k=>(
                    <div key={k.label} className={"flex items-center justify-between p-3 rounded-xl "+k.bg}>
                      <span className="text-sm text-gray-600">{k.label}</span>
                      <span className={"text-lg font-medium "+k.color}>{k.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {recs.length>0&&(
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-medium text-gray-800 mb-3">Recommendations</h3>
                <div className="space-y-3">
                  {recs.map(r=>(
                    <div key={r.id} className={"flex items-start gap-4 p-4 rounded-xl border "+( sevColors[r.severity]||sevColors.low)}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={"text-xs px-2 py-0.5 rounded-full font-semibold "+(catColors[r.category]||catColors.cleanup)}>{r.category}</span>
                          <span className="text-sm font-medium text-gray-800">{r.title}</span>
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
                <h3 className="text-sm font-medium text-gray-800 mb-3">Risks</h3>
                <div className="space-y-2">
                  {risks.map(r=>(
                    <div key={r.id} className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
                      <AlertTriangle size={15} className="text-red-500 flex-shrink-0 mt-0.5"/>
                      <div>
                        <div className="text-sm font-medium text-gray-800">{r.title}</div>
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
          {(()=>{
            const activeVmsFromHosts = (hosts||[]).flatMap(h=>(h.vms||[]).map(v=>({
              name: v.name,
              hostName: h.shortName,
              vcpu: v.vcpu||0,
              ramGb: v.ramGo||0,
              usedRamGb: v.usedRamGo||0,
              os: v.os||"N/A",
              powerState: v.powerstate||"poweredOn",
              cpuUsagePct: v.vcpu>0&&v.cpuOverallMhz>0?Math.min(99,Math.round(v.cpuOverallMhz/(v.vcpu*2500)*100)):0,
              isOversized: v.ramGo>0&&v.usedRamGo>0&&v.usedRamGo/v.ramGo<0.5,
              wasteGb: Math.max(0,(v.ramGo||0)-(v.usedRamGo||0)),
              diskGb: v.diskGo||0,
              activeRamGb: v.activeRamGo||0,
              portGroup: v.portGroup||"N/A",
              nicCount: v.nicCount||1,
              datastore: v.datastore||"N/A",
            })));
            const offVmsFromList = (vmOffList||[]).map(v=>({
              name: v.name,
              hostName: v.host||"N/A",
              vcpu: v.cpu||0,
              ramGb: v.ramGo||0,
              usedRamGb: 0,
              os: v.os||"N/A",
              powerState: "poweredOff",
              cpuUsagePct: 0,
              isOversized: false,
              wasteGb: 0,
              daysSince: v.daysSince||null,
            }));
            const allVms = [...activeVmsFromHosts, ...offVmsFromList];

            const offVms = vmOffList||[];
            const activeVmsList = allVms.filter(v=>v.powerState==="poweredOn");
            const offVmsList = allVms.filter(v=>v.powerState!=="poweredOn");
            const oversizedVms = allVms.filter(v=>v.isOversized);

            const totalVms = (clusterSummary.totalVms||0) || allVms.length || (clusterSummary.activeVms||0)+(offVms.length||0);
            const activeCount = clusterSummary.activeVms||activeVmsList.length||0;
            const offCount = clusterSummary.poweredOffVms||offVmsList.length||offVms.length||0;
            const candidatesCount = offVms.filter(v=>(v.daysSince||0)>=20).length;
            const avgVcpu = activeCount>0?(clusterSummary.allocatedVcpu||0)/activeCount:0;
            const avgRam = activeCount>0?(clusterSummary.allocatedRamGb||0)/activeCount:0;

            const recoverableRam = Math.round(oversizedVms.reduce((s,v)=>s+v.wasteGb,0));
            const recoverableVcpu = offVms.filter(v=>(v.daysSince||0)>=20).reduce((s,v)=>s+(v.cpu||0),0);

            // OS distrib
            const osDistribData = osDistrib||[];
            const winCount = osDistribData.filter(o=>(o.os||o.name||"").toLowerCase().includes("win")).reduce((s,o)=>s+(o.count||1),0)||
              allVms.filter(v=>(v.os||"").toLowerCase().includes("win")).length;
            const linCount = osDistribData.filter(o=>{const n=(o.os||o.name||"").toLowerCase();return n.includes("linux")||n.includes("ubuntu")||n.includes("centos")||n.includes("red hat")||n.includes("debian");}).reduce((s,o)=>s+(o.count||1),0)||
              allVms.filter(v=>{const n=(v.os||"").toLowerCase();return n.includes("linux")||n.includes("ubuntu")||n.includes("centos");}).length;
            const otherCount = Math.max(0, totalVms - winCount - linCount);

            // vCPU distribution
            const vcpuBuckets = [
              {label:"1 vCPU", count: allVms.filter(v=>v.vcpu===1).length},
              {label:"2 vCPU", count: allVms.filter(v=>v.vcpu===2).length},
              {label:"4 vCPU", count: allVms.filter(v=>v.vcpu===4).length},
              {label:"8 vCPU", count: allVms.filter(v=>v.vcpu===8).length},
              {label:"16+ vCPU", count: allVms.filter(v=>v.vcpu>=16).length},
            ];
            const maxVcpuCount = Math.max(...vcpuBuckets.map(b=>b.count), 1);

            // RAM distribution
            const ramBuckets = [
              {label:"< 4 GB", count: allVms.filter(v=>v.ramGb<4).length, color:"text-gray-600", bg:"bg-gray-100"},
              {label:"4–16 GB", count: allVms.filter(v=>v.ramGb>=4&&v.ramGb<=16).length, color:"text-blue-700", bg:"bg-blue-50"},
              {label:"16–64 GB", count: allVms.filter(v=>v.ramGb>16&&v.ramGb<=64).length, color:"text-violet-700", bg:"bg-violet-50"},
              {label:"> 64 GB", count: allVms.filter(v=>v.ramGb>64).length, color:"text-amber-700", bg:"bg-amber-50"},
            ];


            const filteredVms = allVms.filter(v=>{
              const matchSearch = !vmSearch || (v.name||"").toLowerCase().includes(vmSearch.toLowerCase()) || (v.hostName||"").toLowerCase().includes(vmSearch.toLowerCase());
              const matchFilter = vmFilter==="toutes" || (vmFilter==="actives"&&v.powerState==="poweredOn") || (vmFilter==="eteintes"&&v.powerState!=="poweredOn") || (vmFilter==="oversizees"&&v.isOversized);
              return matchSearch && matchFilter;
            });

            const isWin = (os) => (os||"").toLowerCase().includes("win");

            return (
              <>
                {/* KPI Bar */}
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                  {[
                    {icon:"ti-device-desktop", label:"TOTAL VMs", value:totalVms, sub:"inventaire complet", color:"text-gray-900"},
                    {icon:"ti-player-play", label:"VMs ACTIVES", value:activeCount, sub:"poweredOn", color:"text-emerald-600", dot:"bg-emerald-500"},
                    {icon:"ti-player-stop", label:"VMs ÉTEINTES", value:offCount, sub:"poweredOff", color:"text-gray-500", dot:"bg-gray-400"},
                    {icon:"ti-alert-triangle", label:"CANDIDATES SUPPRESSION", value:candidatesCount, sub:"OFF > 20 jours", color:"text-amber-600"},
                    {icon:"ti-cpu", label:"vCPU MOYEN/VM", value:avgVcpu.toFixed(1), sub:"allocation moyenne", color:"text-blue-600"},
                    {icon:"ti-circuit-board", label:"RAM MOYENNE/VM", value:`${Math.round(avgRam)} GB`, sub:"allocation moyenne", color:"text-violet-600"},
                  ].map((k,i)=>(
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                          <i className={`ti ${k.icon} text-gray-500 text-sm`}/>
                        </div>
                        <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide leading-tight">{k.label}</div>
                      </div>
                      <div className={`text-2xl font-semibold ${k.color}`}>
                        {k.dot&&<span className={`inline-block w-2 h-2 rounded-full ${k.dot} mr-1.5 mb-0.5`}/>}
                        {k.value}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{k.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Banner */}
                {candidatesCount>0&&(
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center gap-5">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <i className="ti ti-alert-triangle text-amber-600 text-xl"/>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-amber-700">{candidatesCount} VMs inutilisées détectées</div>
                        <div className="text-sm text-amber-600">Éteintes depuis plus de 20 jours — audit et décommissionnement recommandé</div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="bg-white/80 rounded-xl px-5 py-3 text-center">
                        <div className="text-xl font-semibold text-violet-600">~{recoverableRam} GB</div>
                        <div className="text-xs text-gray-500">RAM récupérable</div>
                      </div>
                      <div className="bg-white/80 rounded-xl px-5 py-3 text-center">
                        <div className="text-xl font-semibold text-blue-600">~{recoverableVcpu} vCPU</div>
                        <div className="text-xs text-gray-500">libérables</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
                  {/* Inventaire VMs */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventaire VMs</h3>
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                      <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                        <i className="ti ti-search text-gray-400 text-sm"/>
                        <input
                          type="text"
                          placeholder="Rechercher une VM, un hôte..."
                          value={vmSearch}
                          onChange={e=>setVmSearch(e.target.value)}
                          className="bg-transparent text-xs text-gray-700 outline-none flex-1"
                        />
                      </div>
                      <div className="flex gap-1">
                        {[["toutes","Toutes"],["actives","Actives"],["eteintes","Éteintes"],["oversizees","Oversizées"]].map(([val,label])=>(
                          <button key={val} onClick={()=>setVmFilter(val)}
                            className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-colors ${vmFilter===val?"bg-blue-50 border-blue-200 text-blue-700":"border-gray-200 text-gray-500 hover:bg-gray-50"} ${val==="oversizees"&&vmFilter!==val?"text-amber-600 border-amber-200":""}`}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-100">
                            {["VM","OS","Host","vCPU","RAM allouée","RAM utilisée","État","Uptime"].map(h=>(
                              <th key={h} className="text-left text-gray-400 font-medium pb-3 pr-3 whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(showAllVms?filteredVms:filteredVms.slice(0,10)).map((v,i)=>(
                            <tr key={i} onClick={()=>setSelectedVm(v)} className={`border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 ${v.isOversized?"border-l-2 border-l-amber-300":""}`}>
                              <td className="py-2.5 pr-3 font-semibold text-gray-800 truncate max-w-[140px]">{v.name}</td>
                              <td className="py-2.5 pr-3">
                                <i className={`ti ${isWin(v.os)?"ti-brand-windows text-blue-500":"ti-terminal-2 text-orange-500"} text-base`}/>
                              </td>
                              <td className="py-2.5 pr-3 text-gray-500 truncate max-w-[100px]">{v.hostName}</td>
                              <td className="py-2.5 pr-3 text-gray-700 font-medium">{v.vcpu}</td>
                              <td className="py-2.5 pr-3 text-gray-700">{v.ramGb} GB</td>
                              <td className="py-2.5 pr-3">
                                {v.usedRamGb>0?(
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${v.usedRamGb/v.ramGb>0.7?"bg-violet-500":"bg-violet-300"}`} style={{width:Math.min(100,Math.round(v.usedRamGb/v.ramGb*100))+"%"}}/>
                                    </div>
                                    <span className="text-gray-600">{v.usedRamGb} GB</span>
                                  </div>
                                ):<span className="text-gray-300">N/A</span>}
                              </td>
                              <td className="py-2.5 pr-3">
                                {v.powerState==="poweredOn"?
                                  <span className="flex items-center gap-1 text-emerald-600 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"/>Active</span>:
                                  <span className="flex items-center gap-1 text-gray-400 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-gray-300"/>Éteinte</span>
                                }
                              </td>
                              <td className="py-2.5 text-gray-500">
                                {v.powerState==="poweredOn"?"—":"—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-3 text-xs text-gray-400">
                      {filteredVms.length > 10 && <span>{filteredVms.length - 10} autres VMs — </span>}
                      <button onClick={()=>setShowAllVms(!showAllVms)} className="text-blue-500 hover:underline">{showAllVms?"Réduire ↑":"Voir toutes les VMs →"}</button>
                    </div>
                  </div>

                  {/* Right column */}
                  <div className="space-y-4">
                    {/* Répartition OS */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Répartition OS</h3>
                      <div className="space-y-3">
                        {[
                          {label:"Windows Server", count:winCount, color:"bg-blue-500", text:"text-blue-700"},
                          {label:"Linux", count:linCount, color:"bg-orange-400", text:"text-orange-700"},
                          {label:"Autre", count:otherCount, color:"bg-gray-300", text:"text-gray-600"},
                        ].map((o,i)=>{
                          const pct = totalVms>0?Math.round(o.count/totalVms*100):0;
                          return (
                            <div key={i}>
                              <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="font-medium text-gray-700">{o.label}</span>
                                <div className="flex items-center gap-2">
                                  <span className={`font-semibold ${o.text}`}>{o.count} VMs</span>
                                  <span className="text-gray-400">{pct}%</span>
                                </div>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${o.color}`} style={{width:pct+"%"}}/>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Distribution vCPU */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Distribution vCPU</h3>
                      <div className="flex items-end gap-2 h-24">
                        {vcpuBuckets.map((b,i)=>(
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div className="text-[10px] font-semibold text-blue-700">{b.count}</div>
                            <div className="w-full bg-blue-500 rounded-t-sm" style={{height:Math.max(4,Math.round(b.count/maxVcpuCount*64))+"px"}}/>
                            <div className="text-[9px] text-gray-400 text-center leading-tight">{b.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Top VMs oversizées */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Top VMs oversizées <span className="font-normal text-gray-400">(RAM)</span></h3>
                      <div className="space-y-3">
                        {oversizedVms.slice(0,4).map((v,i)=>{
                          const wastePct = v.ramGb>0?Math.round(v.wasteGb/v.ramGb*100):0;
                          return (
                            <div key={i} className="border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold text-gray-800 truncate max-w-[160px]">{v.name}</span>
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 font-semibold flex-shrink-0">{wastePct}% gaspillé</span>
                              </div>
                              <div className="text-[10px] text-gray-400 mb-1">Allouée: {v.ramGb} GB / Utilisée: {v.usedRamGb} GB</div>
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-amber-400" style={{width:Math.min(100,100-wastePct)+"%"}}/>
                              </div>
                            </div>
                          );
                        })}
                        {oversizedVms.length===0&&<div className="text-xs text-gray-400 text-center py-4">Aucune VM surdimensionnée détectée.</div>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* VMs candidates suppression */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">VMs candidates à suppression</h3>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {["VM","Host","RAM allouée","OFF depuis","Action"].map(h=>(
                            <th key={h} className="text-left text-gray-400 font-medium pb-2 pr-3">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {offVms.filter(v=>(v.daysSince||0)>=20).slice(0,5).map((v,i)=>(
                          <tr key={i} className="border-b border-gray-50 last:border-0">
                            <td className="py-2.5 pr-3 font-semibold text-gray-800 truncate max-w-[120px]">{v.name}</td>
                            <td className="py-2.5 pr-3 text-gray-500">{v.host}</td>
                            <td className="py-2.5 pr-3 text-gray-700">{v.ramGo} GB</td>
                            <td className="py-2.5 pr-3">
                              <span className={`font-semibold ${(v.daysSince||0)>60?"text-red-600":(v.daysSince||0)>30?"text-amber-600":"text-gray-600"}`}>{v.daysSince||"?"} jours</span>
                            </td>
                            <td className="py-2.5">
                              <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-100 font-semibold text-[10px]">Décommissionner</span>
                            </td>
                          </tr>
                        ))}
                        {offVms.filter(v=>(v.daysSince||0)>=20).length===0&&(
                          <tr><td colSpan="5" className="py-6 text-center text-gray-400">Aucune VM candidate à suppression.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Distribution RAM */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Distribution RAM par VM</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {ramBuckets.map((b,i)=>(
                        <div key={i} className={`rounded-xl border p-4 ${b.bg} border-opacity-50`}>
                          <div className="text-xs text-gray-500 mb-1">{b.label}</div>
                          <div className={`text-2xl font-semibold ${b.color}`}>{b.count}</div>
                          <div className="text-xs text-gray-400 mt-1">VMs</div>
                          <div className={`text-xs font-semibold mt-0.5 ${b.color}`}>
                            {totalVms>0?Math.round(b.count/totalVms*100):0}% du total
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {activeTab==="network"&&(()=>{
        const nd = networkData||{};
          const claudeInsights = nd.claudeInsights || null;
          console.log("🔎 SizingHUB networkData keys:", Object.keys(nd || {}));
          console.log("🔎 SizingHUB hbaRows:", nd.hbaRows);
          console.log("🔎 SizingHUB networkData full:", nd);
        const hostsNics = nd.hostsNics||[];
          const hbaRows = nd.hbaRows || nd.vHBA || nd.vhba || nd.hba || [];
        const allVlans = nd.vlans||vlans||[];
        const allVSwitches = nd.vSwitches||vSwitches||[];
        const allDvSwitches = nd.dvSwitches||dvSwitches||[];
        const allPGs = nd.uniquePortGroups||uniquePortGroups||[];
        const totalNics = hostsNics.reduce((s,h)=>s+(h.nics||0),0);
        const segments = [...new Map(allVlans.map(v=>[v.name,v])).values()];

          const vmkRows = nd.vmKernel || nd.vmk || nd.vmkernels || nd.vmkernel || nd.vSC_VMK || [];
          const datastoreRows = nd.datastores || datastores || [];

          const networkText = [
            ...segments.map(s=>s.name||""),
            ...allPGs.map(p=>p.portGroup||p.name||p.network||""),
            ...allVSwitches.map(sw=>sw.name||""),
            ...allDvSwitches.map(sw=>sw.name||""),
            ...vmkRows.map(v=>Object.values(v||{}).join(" "))
          ].join(" ").toLowerCase();

          const datastoreText = datastoreRows
            .map(d=>Object.values(d||{}).join(" "))
            .join(" ")
            .toLowerCase();

          const vmotionNetworks = [...new Set(vmkRows
            .filter(v=>{
              const t = Object.values(v||{}).join(" ").toLowerCase();
              return t.includes("vmotion") || t.includes("v-motion") || t.includes("v motion") || t.includes("migration");
            })
            .map(v=>v.portGroup || v["Port Group"] || v.network || v["Network"] || v.name || v["Name"])
            .filter(Boolean)
          )];

          const storageNetworks = [...new Set(vmkRows
            .filter(v=>{
              const t = Object.values(v||{}).join(" ").toLowerCase();
              return t.includes("iscsi") || t.includes("nfs") || t.includes("storage") || t.includes("san") || t.includes("vmfs");
            })
            .map(v=>v.portGroup || v["Port Group"] || v.network || v["Network"] || v.name || v["Name"])
            .filter(Boolean)
          )];

          const hasVmotion =
            vmotionNetworks.length > 0 ||
            networkText.includes("vmotion") ||
            networkText.includes("v-motion") ||
            networkText.includes("v motion") ||
            networkText.includes("migration");

          const hasStorage =
            storageNetworks.length > 0 ||
            networkText.includes("iscsi") ||
            networkText.includes("nfs") ||
            networkText.includes("storage") ||
            networkText.includes("san") ||
            networkText.includes("vmfs") ||
            datastoreText.includes("iscsi") ||
            datastoreText.includes("nfs") ||
            datastoreText.includes("vmfs") ||
            datastoreText.includes("vsan");

          const hasManagement = segments.some(seg=>{
            const n=(seg.name||"").toLowerCase();
            return n.includes("mgmt")||n.includes("management")||n.includes("adm");
          });

          const redundancyScore = hostsNics.length===0 ? 0 : Math.round(
            hostsNics.filter(h=>(h.nics||0)>=2).length / hostsNics.length * 100
          );

          let networkScore = 55;
          if(hasVmotion) networkScore += 10;
          if(hasStorage) networkScore += 15;
          if(hasManagement) networkScore += 10;
          if(redundancyScore>=80) networkScore += 10;
          networkScore = Math.min(networkScore,100);

          const networkStatus =
            networkScore>=85 ? "Architecture réseau robuste" :
            networkScore>=70 ? "Architecture cohérente" :
            "Architecture à surveiller";

          const networkStatusColor =
            networkScore>=85 ? "text-emerald-600" :
            networkScore>=70 ? "text-amber-600" :
            "text-red-600";

          const networkStatusBg =
            networkScore>=85 ? "bg-emerald-50 border-emerald-100" :
            networkScore>=70 ? "bg-amber-50 border-amber-100" :
            "bg-red-50 border-red-100";

          const networkInsights = [];
          if(!hasVmotion) networkInsights.push({severity:"warning", text:"Aucun réseau vMotion dédié détecté."});
          if(!hasStorage) networkInsights.push({severity:"critical", text:"Aucun réseau stockage dédié détecté."});
          if(!hasManagement) networkInsights.push({severity:"warning", text:"Aucun réseau de management clairement identifié."});

        return (
          <div className="space-y-4">
              {/* NETWORK HEALTH */}
              <div className={"rounded-3xl border shadow-sm p-6 "+networkStatusBg}>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="relative w-28 h-28 flex-shrink-0">
                      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                        <circle cx="60" cy="60" r="48" fill="none" stroke="#e5e7eb" strokeWidth="10"/>
                        <circle
                          cx="60"
                          cy="60"
                          r="48"
                          fill="none"
                          stroke={networkScore>=85 ? "#10b981" : networkScore>=70 ? "#f59e0b" : "#ef4444"}
                          strokeWidth="10"
                          strokeLinecap="round"
                          strokeDasharray={301}
                          strokeDashoffset={301 - (301 * networkScore / 100)}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className={"text-3xl font-bold "+networkStatusColor}>{networkScore}</div>
                        <div className="text-xs text-gray-400">/100</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-widest text-gray-400 mb-1">Network Health</div>
                      <div className={"text-2xl font-semibold "+networkStatusColor}>{networkStatus}</div>
                      <div className="text-sm text-gray-500 mt-2 max-w-xl">
                        Analyse de segmentation, résilience réseau, isolation des flux et cohérence VMware.
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 text-center">
                      <div className="text-2xl font-semibold text-blue-600">{segments.length}</div>
                      <div className="text-xs text-gray-500 mt-1">Segments</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 text-center">
                      <div className="text-2xl font-semibold text-indigo-600">{totalNics}</div>
                      <div className="text-xs text-gray-500 mt-1">NICs</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 text-center">
                      <div className="text-2xl font-semibold text-emerald-600">{redundancyScore}%</div>
                      <div className="text-xs text-gray-500 mt-1">Redondance</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 text-center">
                      <div className={"text-2xl font-semibold "+(hasStorage?"text-emerald-600":"text-red-600")}>{hasStorage ? "OK" : "NON"}</div>
                      <div className="text-xs text-gray-500 mt-1">Stockage dédié</div>
                    </div>
                  </div>
                </div>

                {networkInsights.length>0&&(
                  <div className="mt-5 pt-5 border-t border-white/60">
                    <div className="text-xs uppercase tracking-widest text-gray-400 mb-3">Insights réseau détectés</div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                      {networkInsights.map((i,idx)=>(
                        <div key={idx} className={"rounded-2xl border px-4 py-3 flex items-start gap-3 "+(i.severity==="critical"?"bg-red-50 border-red-100":"bg-amber-50 border-amber-100")}>
                          {i.severity==="critical"
                            ? <AlertTriangle size={16} className="text-red-500 mt-0.5"/>
                            : <Info size={16} className="text-amber-500 mt-0.5"/>}
                          <div className={(i.severity==="critical"?"text-red-700":"text-amber-700")+" text-sm"}>{i.text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* KPIs Réseau Premium */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <div className="text-xs uppercase tracking-widest text-gray-400 mb-2">Hosts</div>
                  <div className="text-3xl font-semibold text-gray-800">{hosts.length}</div>
                  <div className="text-sm text-gray-500 mt-1">Noeuds connectés</div>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <div className="text-xs uppercase tracking-widest text-gray-400 mb-2">NICs physiques</div>
                  <div className="text-3xl font-semibold text-blue-600">{totalNics}</div>
                  <div className="text-sm text-gray-500 mt-1">Interfaces réseau</div>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <div className="text-xs uppercase tracking-widest text-gray-400 mb-2">Segments réseau</div>
                  <div className="text-3xl font-semibold text-violet-600">{segments.length}</div>
                  <div className="text-sm text-gray-500 mt-1">VLANs / Port Groups</div>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <div className="text-xs uppercase tracking-widest text-gray-400 mb-2">Redondance</div>
                  <div className={"text-3xl font-semibold "+(redundancyScore>=80?"text-emerald-600":"text-amber-600")}>{redundancyScore}%</div>
                  <div className="text-sm text-gray-500 mt-1">Résilience réseau</div>
                </div>
              </div>

              <NetworkFabric
                  hosts={hosts.length}
                  segments={segments.length}
                  portGroups={allPGs.length}
                  hasManagement={hasManagement}
                  hasVmotion={hasVmotion}
                  hasStorage={hasStorage}
                  redundancyScore={redundancyScore}
                  vmKernel={vmkRows}
                  segmentList={segments}
                  portGroupList={allPGs}
                  hostsNics={hostsNics}
                  hbaRows={hbaRows}
                />

            {/* Host NICs */}
            {/* Focus réseau nœud */}
            {hostsNics.length > 0 && (
              <FocusReseauNoeud vmkRows={vmkRows} hostsNics={hostsNics} claudeInsights={claudeInsights} />
            )}



            {/* VMkernel Adapters */}
            {vmkRows.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-800">VMkernel Adapters</h3>
                  <span className="text-xs text-gray-400">{vmkRows.length} adaptateur{vmkRows.length > 1 ? "s" : ""} détecté{vmkRows.length > 1 ? "s" : ""}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {["Host","Device","Port Group","VLAN","IP","Subnet","MTU","Rôle"].map(h => (
                          <th key={h} className="text-left text-gray-400 font-medium pb-2 pr-4 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {vmkRows.map((vmk, i) => {
                        const pg = (vmk.portGroup || "").toLowerCase();
                        const role =
                          pg.includes("vmotion") || pg.includes("v-motion") ? "vMotion" :
                          pg.includes("iscsi") || pg.includes("san") || pg.includes("nfs") || pg.includes("storage") ? "Storage" :
                          pg.includes("management") || pg.includes("mgmt") ? "Management" : "VM";
                        const roleStyle =
                          role === "vMotion"    ? "bg-violet-50 text-violet-700 border-violet-200" :
                          role === "Storage"    ? "bg-orange-50 text-orange-700 border-orange-200" :
                          role === "Management" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          "bg-sky-50 text-sky-700 border-sky-200";
                        const mtuWarn = role === "Storage" && vmk.mtu && vmk.mtu < 9000;
                        const cidr = vmk.subnet ? vmk.subnet.split(".").map(Number).reduce((a,b) => a + b.toString(2).split("").filter(c=>c==="1").length, 0) : null;
                        return (
                          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="py-2 pr-4 font-mono text-gray-700 whitespace-nowrap">{vmk.host || "—"}</td>
                            <td className="py-2 pr-4 font-mono text-blue-600 whitespace-nowrap">{vmk.device || "—"}</td>
                            <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">{vmk.portGroup || "—"}</td>
                            <td className="py-2 pr-4">
                              {vmk.vlan != null
                                ? <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{vmk.vlan}</span>
                                : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="py-2 pr-4 font-mono text-gray-800 whitespace-nowrap">{vmk.ip || "—"}</td>
                            <td className="py-2 pr-4 font-mono text-gray-500">{cidr ? `/${cidr}` : "—"}</td>
                            <td className="py-2 pr-4">
                              {vmk.mtu
                                ? <span className={mtuWarn ? "text-amber-600 font-semibold" : "text-gray-600"}>{vmk.mtu}{mtuWarn ? " ⚠" : ""}</span>
                                : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="py-2 pr-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${roleStyle}`}>
                                {role}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {vmkRows.some(v => (v.portGroup||"").toLowerCase().includes("iscsi") && v.mtu && v.mtu < 9000) && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                    <span>⚠</span>
                    <span>MTU 1500 détecté sur les interfaces iSCSI — jumbo frames (MTU 9000) recommandés pour optimiser les performances stockage</span>
                  </div>
                )}
              </div>
            )}
            {/* Network Segments - vue logique par type */}
            {(allVlans.length>0||allPGs.length>0)&&(
              <NetworkSegmentsView
                segments={(allVlans.length>0?allVlans:allPGs.map(p=>({name:p.portGroup,vlan:p.vlan,switch:p.switch,mtu:null}))).map(s=>({...s,vSwitchName:s.switch}))}
                totalHosts={hosts.length}
              />
            )}

            {/* vSwitches - vue logique regroupée */}
            {allVSwitches.length>0&&(
              <VSwitchesView
                vSwitches={allVSwitches}
                totalHosts={hosts.length}
              />
            )}

            {/* dvSwitches */}
            {allDvSwitches.length>0&&(
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-medium text-gray-800 mb-4">Distributed vSwitches ({allDvSwitches.length})</h3>
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
                    <span className={"text-3xl font-medium "+scoreColor}>{score}</span>
                    <span className="text-xs text-gray-400">/ 100</span>
                  </div>
                </div>
                <div className={"text-sm font-medium "+scoreColor}>{statusLabel}</div>
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
                    <div className={"text-2xl font-medium "+k.text}>{k.val}</div>
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
                  <h3 className="text-sm font-medium text-gray-800 mb-3">Quick Wins</h3>
                  <div className="space-y-3">
                    {qw.map(q=>(
                      <div key={q.id} className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Zap size={14} className="text-emerald-600"/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-800">{q.title}</div>
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
                <h3 className="text-sm font-medium text-gray-800 mb-3">Potential Savings</h3>
                <div className="space-y-3">
                  {[
                    {label:"CPU recuperable",     val:(savings.reclaimableCpu||0)+" vCPU",     color:"text-blue-600",   bg:"bg-blue-50"},
                    {label:"RAM recuperable",      val:(savings.reclaimableRamGb||0)+" Go",      color:"text-orange-500", bg:"bg-orange-50"},
                    {label:"Stockage recuperable", val:(savings.reclaimableStorageTb||0)+" To",  color:"text-emerald-600",bg:"bg-emerald-50"},
                    {label:"Reduction hosts",      val:savings.potentialHostReduction>0?(savings.potentialHostReduction+" host(s)"):"Aucune",color:"text-violet-600",bg:"bg-violet-50"},
                  ].map(k=>(
                    <div key={k.label} className={"flex items-center justify-between p-3 rounded-xl "+k.bg}>
                      <span className="text-sm text-gray-600">{k.label}</span>
                      <span className={"text-lg font-medium "+k.color}>{k.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {recs.length>0&&(
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-medium text-gray-800 mb-3">Recommendations</h3>
                <div className="space-y-3">
                  {recs.map(r=>(
                    <div key={r.id} className={"flex items-start gap-4 p-4 rounded-xl border "+( sevColors[r.severity]||sevColors.low)}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={"text-xs px-2 py-0.5 rounded-full font-semibold "+(catColors[r.category]||catColors.cleanup)}>{r.category}</span>
                          <span className="text-sm font-medium text-gray-800">{r.title}</span>
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
                <h3 className="text-sm font-medium text-gray-800 mb-3">Risks</h3>
                <div className="space-y-2">
                  {risks.map(r=>(
                    <div key={r.id} className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
                      <AlertTriangle size={15} className="text-red-500 flex-shrink-0 mt-0.5"/>
                      <div>
                        <div className="text-sm font-medium text-gray-800">{r.title}</div>
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
              <h3 className="text-sm font-medium text-gray-800 mb-4">Distribution OS ({osDistrib.reduce((s,[,c])=>s+c,0)} VMs)</h3>
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
              <h3 className="text-sm font-medium text-gray-800 mb-1">VMs eteintes ({vmOffList.length})</h3>
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
    {selectedVm&&<VmSlideOver vm={selectedVm} onClose={()=>setSelectedVm(null)}/>}
    </>
  );
}
