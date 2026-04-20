import { useState } from "react";
import {
  Server, Cpu, HardDrive, AlertTriangle,
  CheckCircle, AlertCircle, Info, TrendingDown,
  Activity, Database, Network, Settings, MemoryStick
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
  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
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
  };
};

const TABS = [
  {id:"overview",     label:"Overview",     icon:Activity},
  {id:"compute",      label:"Compute",      icon:Cpu},
  {id:"memory",       label:"Memory",       icon:MemoryStick},
  {id:"storage",      label:"Storage",      icon:HardDrive},
  {id:"network",      label:"Network",      icon:Network},
  {id:"optimization", label:"Optimization", icon:Settings},
];

export default function ClusterOverviewDashboard({
  platformContext={}, clusterSummary={}, hosts=[], insights=[],
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <KpiCard label="VMs actives"   value={clusterSummary.activeVms}          sub={(clusterSummary.poweredOffVms||0)+" eteintes"}   icon={Server}      gradient="bg-gradient-to-br from-blue-500 to-blue-700"/>
        <KpiCard label="vCPU alloues"  value={clusterSummary.allocatedVcpu}      sub="VMs poweredOn"                                    icon={Cpu}         gradient="bg-gradient-to-br from-orange-400 to-orange-600"/>
        <KpiCard label="RAM allouee"   value={clusterSummary.allocatedRamDisplay} sub="VMs poweredOn"                                   icon={MemoryStick} gradient="bg-gradient-to-br from-violet-500 to-violet-700"/>
        <KpiCard label="Stockage"      value={clusterSummary.usedStorageDisplay}  sub="VMs poweredOn"                                   icon={HardDrive}   gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"/>
      </div>

      <div className="mb-5">
        <InsightBar clusterSummary={clusterSummary} insights={insights}/>
      </div>

      {activeTab==="overview"&&(
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
      )}

      {activeTab==="compute"&&(
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Compute — Detail par host</h3>
          <div className="space-y-3">
            {sortedHosts.map(h=>(
              <div key={h.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50">
                <div className="w-40 text-sm font-semibold text-gray-700 truncate">{h.name}</div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-blue-600 font-medium">CPU</span>
                    <span className={getUsageTone(h.cpuUsagePercent||0).color+" font-semibold"}>{h.cpuUsagePercent||0}%</span>
                  </div>
                  <UsageBar pct={h.cpuUsagePercent||0} color="bg-blue-500"/>
                </div>
                <div className="text-xs text-gray-400 w-20 text-right">{h.totalCpuCores} cores</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab==="memory"&&(
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Memory — Detail par host</h3>
          <div className="space-y-3">
            {sortedHosts.map(h=>(
              <div key={h.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50">
                <div className="w-40 text-sm font-semibold text-gray-700 truncate">{h.name}</div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-orange-500 font-medium">RAM</span>
                    <span className={getUsageTone(h.ramUsagePercent||0).color+" font-semibold"}>{h.ramUsagePercent||0}%</span>
                  </div>
                  <UsageBar pct={h.ramUsagePercent||0} color="bg-orange-400"/>
                </div>
                <div className="text-xs text-gray-400 w-20 text-right">{formatRam(h.totalRamGb)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab==="optimization"&&(
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Optimization Insights</h3>
          {insights.length===0
            ?<div className="text-sm text-gray-400 text-center py-8">Aucune recommandation — infrastructure saine</div>
            :<div className="space-y-3">{[...criticals,...warnings,...infos].map(i=><OptimizationItem key={i.id} insight={i}/>)}</div>
          }
        </div>
      )}

      {["storage","network"].includes(activeTab)&&(
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center py-12">
          <div className="text-gray-400 text-sm">Onglet {activeTab} — disponible prochainement</div>
        </div>
      )}
    </div>
  );
}
