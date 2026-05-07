import React from "react";

import {
  Server, Network, Shield, Database, AlertTriangle, CheckCircle,
  Activity, Download, GitBranch, Layers, Info, Monitor, Cpu
} from "lucide-react";

const roleTone = {
  management: { bg:"bg-blue-50", border:"border-blue-200", text:"text-blue-700", icon:"text-blue-500", chip:"bg-blue-100 text-blue-700", line:"#60a5fa" },
  vmotion:    { bg:"bg-violet-50", border:"border-violet-200", text:"text-violet-700", icon:"text-violet-500", chip:"bg-violet-100 text-violet-700", line:"#a78bfa" },
  storage:    { bg:"bg-emerald-50", border:"border-emerald-200", text:"text-emerald-700", icon:"text-emerald-500", chip:"bg-emerald-100 text-emerald-700", line:"#34d399" },
  backup:     { bg:"bg-orange-50", border:"border-orange-200", text:"text-orange-700", icon:"text-orange-500", chip:"bg-orange-100 text-orange-700", line:"#fb923c" },
  vm:         { bg:"bg-cyan-50", border:"border-cyan-200", text:"text-cyan-700", icon:"text-cyan-500", chip:"bg-cyan-100 text-cyan-700", line:"#67e8f9" },
  neutral:    { bg:"bg-slate-50", border:"border-slate-200", text:"text-slate-700", icon:"text-slate-500", chip:"bg-slate-100 text-slate-700", line:"#94a3b8" },
};

function normalize(v) {
  return String(v ?? "").toLowerCase();
}

function getName(x) {
  return x?.name || x?.portGroup || x?.["Port Group"] || x?.network || x?.Network || x?.Name || "N/A";
}

function getVlan(x) {
  const v = x?.vlan ?? x?.VLAN ?? x?.["VLAN ID"] ?? x?.vlanId;
  if (v === "" || v === undefined || v === null) return null;
  return v;
}

function classify(name) {
  const n = normalize(name);

  if (n.includes("management") || n.includes("mgmt") || n.includes("admin")) return "management";
  if (n.includes("vmotion") || n.includes("v-motion") || n.includes("migration")) return "vmotion";
  if (n.includes("iscsi") || n.includes("nfs") || n.includes("san") || n.includes("storage") || n.includes("nas")) return "storage";
  if (n.includes("backup") || n.includes("veeam") || n.includes("sauvegarde")) return "backup";

  return "vm";
}

function Kpi({icon:Icon, label, value, sub, tone="blue"}) {

  const colors = {
    blue:"text-blue-600 bg-blue-50 border-blue-100",
    violet:"text-violet-600 bg-violet-50 border-violet-100",
    emerald:"text-emerald-600 bg-emerald-50 border-emerald-100",
    amber:"text-amber-600 bg-amber-50 border-amber-100",
    slate:"text-slate-600 bg-slate-50 border-slate-100",
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${colors[tone]}`}>
        <Icon size={18}/>
      </div>

      <div>
        <div className="text-xl font-semibold text-gray-900">{value}</div>
        <div className="text-xs font-semibold text-gray-600">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function MiniDonut({ok=0, warn=0, bad=0}) {

  const total = Math.max(ok + warn + bad, 1);

  const okPct = Math.round(ok / total * 100);
  const warnPct = Math.round(warn / total * 100);

  return (
    <div className="flex items-center gap-5">
      <div
        className="relative w-28 h-28 rounded-full"
        style={{
          background:`conic-gradient(
            #22c55e 0 ${okPct}%,
            #f59e0b ${okPct}% ${okPct + warnPct}%,
            #ef4444 ${okPct + warnPct}% 100%
          )`
        }}
      >
        <div className="absolute inset-5 bg-white rounded-full flex items-center justify-center">
          <span className="text-lg font-semibold text-gray-800">{okPct}%</span>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"/>
          Segments OK
          <b className="ml-auto">{ok}</b>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500"/>
          À surveiller
          <b className="ml-auto">{warn}</b>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500"/>
          Problèmes
          <b className="ml-auto">{bad}</b>
        </div>
      </div>
    </div>
  );
}

function SideCard({title, children}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h4 className="text-sm font-semibold text-gray-900 mb-4">{title}</h4>
      {children}
    </div>
  );
}

function RoleColumn({
  role,
  title,
  vlans=[],
  vmks=[],
  hosts=0,
  onSelect
}) {

  const t = roleTone[role] || roleTone.neutral;

  const Icon =
    role === "management" ? Shield :
    role === "storage" ? Database :
    role === "vmotion" ? Activity :
    role === "backup" ? AlertTriangle :
    Network;

  const hostSet = new Set(vmks.map(v => v.host).filter(Boolean));

  const present = hostSet.size || (vlans.length ? hosts : 0);

  const partial =
    hosts > 0 &&
    present > 0 &&
    present < hosts;

  return (
    <div className="min-w-[170px] flex-1">

      <button
        onClick={() => onSelect({role,title,vlans,vmks,present,partial})}
        className={`w-full rounded-2xl border ${t.border} ${t.bg} p-4 text-left shadow-sm hover:shadow-md transition`}
      >

        <div className={`flex items-center justify-center gap-2 text-sm font-bold ${t.text}`}>
          <Icon size={17}/>
          {title}
        </div>

        <div className="mt-3 flex flex-wrap justify-center gap-1.5">

          {vlans.slice(0,4).map((v,i)=>(
            <span
              key={i}
              className={`text-[11px] px-2 py-1 rounded-full font-semibold ${t.chip}`}
            >
              VLAN {v}
            </span>
          ))}

          {vlans.length > 4 && (
            <span className={`text-[11px] px-2 py-1 rounded-full font-semibold ${t.chip}`}>
              +{vlans.length-4}
            </span>
          )}

          {vlans.length === 0 && (
            <span className="text-xs text-gray-400">
              Non détecté
            </span>
          )}

        </div>
      </button>

      <div className={`mt-4 rounded-2xl border ${t.border} bg-white p-4 text-center`}>

        <div className={`text-xs font-semibold ${t.text}`}>
          VMkernel
        </div>

        <div className="mt-2 text-xs text-gray-500 space-y-1">

          {vmks.slice(0,2).map((v,i)=>(
            <div key={i}>
              {v.device || "vmk"} · {v.ip || "IP N/A"}
            </div>
          ))}

          {vmks.length === 0 && (
            <div>Aucun VMkernel</div>
          )}

        </div>
      </div>

      <div className={`mt-4 rounded-2xl border ${partial ? "border-amber-200 bg-amber-50" : t.border + " bg-white"} p-4 text-center`}>

        <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-700">
          <span className={`w-2 h-2 rounded-full ${partial ? "bg-amber-400" : "bg-emerald-400"}`}/>
          {present}/{hosts} hôtes
        </div>

        {partial && (
          <div className="text-[11px] text-amber-700 mt-2">
            Couverture partielle
          </div>
        )}

      </div>
    </div>
  );
}

export default function NetworkFabric({
  hosts=0,
  segments=0,
  redundancyScore=0,
  vmKernel=[],
  segmentList=[],
  portGroupList=[],
}) {

  const vmks = Array.isArray(vmKernel) ? vmKernel : [];

  const rawSegments = Array.isArray(segmentList) ? segmentList : [];

  const rawPGs = Array.isArray(portGroupList) ? portGroupList : [];

  const allObjects = [
    ...rawSegments,
    ...rawPGs,
    ...vmks,
  ];

  const uniqueByName = [
    ...new Map(allObjects.map(x => [getName(x), x])).values()
  ];

  const groups = {
    management:[],
    vmotion:[],
    storage:[],
    backup:[],
    vm:[]
  };

  uniqueByName.forEach(x => {
    const role = classify(getName(x));
    groups[role].push(x);
  });

  const roleVmks = (role) =>
    vmks.filter(v => classify(getName(v)) === role);

  const vlanList = (role) => [
    ...new Set(
      groups[role]
        .map(x => getVlan(x))
        .filter(v => v !== null)
    )
  ];

  const mtuIssues = vmks.filter(v => {
    const role = classify(getName(v));
    return role === "storage" && Number(v.mtu || 0) < 9000;
  });

  const partialCoverage = ["management","vmotion","storage","backup","vm"]
    .filter(role => {
      const hs = new Set(
        roleVmks(role).map(v => v.host).filter(Boolean)
      );

      return hosts > 0 && hs.size > 0 && hs.size < hosts;
    }).length;

  const orphanSegments = uniqueByName.filter(x => {
    const vlan = getVlan(x);

    const hasVmk =
      vmks.some(v => getVlan(v) === vlan);

    return vlan !== null && !hasVmk;
  }).slice(0,5);

  const issueCount =
    mtuIssues.length + partialCoverage;

  const okCount =
    Math.max(
      segments - issueCount - orphanSegments.length,
      0
    );

  const [selected, setSelected] = React.useState({
    role:"storage",
    title:"Storage",
    vlans:vlanList("storage"),
    vmks:roleVmks("storage"),
    present:hosts,
    partial:false
  });

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 lg:p-6">

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">

        <div className="min-w-0">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Topologie logique des réseaux
                </h3>

                <Info size={15} className="text-blue-400"/>
              </div>

              <p className="text-sm text-gray-400 mt-1">
                Vue d'ensemble des relations entre réseaux, VLANs, VMkernel et hôtes
              </p>
            </div>

            <button className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
              <Download size={14}/>
              Exporter
            </button>

          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">

            <Kpi
              icon={GitBranch}
              label="Catégories réseau"
              value="5"
              tone="blue"
            />

            <Kpi
              icon={Layers}
              label="Segments détectés"
              value={segments}
              tone="violet"
            />

            <Kpi
              icon={Shield}
              label="Couverture hôtes"
              value={`${Math.max(hosts-partialCoverage,0)} / ${hosts}`}
              sub={`${hosts ? Math.round(((Math.max(hosts-partialCoverage,0))/hosts)*100) : 0}%`}
              tone="emerald"
            />

            <Kpi
              icon={AlertTriangle}
              label="Incohérences détectées"
              value={issueCount}
              tone={issueCount ? "amber" : "emerald"}
            />

            <Kpi
              icon={Network}
              label="Orphelins à vérifier"
              value={orphanSegments.length}
              tone="slate"
            />

          </div>

          <div className="relative rounded-3xl border border-gray-100 bg-gradient-to-br from-white to-slate-50 p-5 lg:p-7 overflow-hidden">

            <svg
              className="absolute inset-0 w-full h-full pointer-events-none hidden lg:block"
              preserveAspectRatio="none"
            >
              <path d="M50% 16% C50% 25%, 14% 25%, 14% 36%" fill="none" stroke="#bfdbfe" strokeWidth="2" strokeDasharray="6 5"/>
              <path d="M50% 16% C50% 25%, 34% 25%, 34% 36%" fill="none" stroke="#c4b5fd" strokeWidth="2" strokeDasharray="6 5"/>
              <path d="M50% 16% C50% 25%, 50% 25%, 50% 36%" fill="none" stroke="#86efac" strokeWidth="2" strokeDasharray="6 5"/>
              <path d="M50% 16% C50% 25%, 66% 25%, 66% 36%" fill="none" stroke="#fed7aa" strokeWidth="2" strokeDasharray="6 5"/>
              <path d="M50% 16% C50% 25%, 86% 25%, 86% 36%" fill="none" stroke="#a5f3fc" strokeWidth="2" strokeDasharray="6 5"/>
            </svg>

            <div className="relative mx-auto mb-7 w-full max-w-[260px] rounded-2xl border border-blue-100 bg-white shadow-sm p-4 text-center">

              <Server size={26} className="text-blue-500 mx-auto mb-2"/>

              <div className="text-sm font-bold text-gray-900">
                vCenter / Cluster
              </div>

              <div className="text-xs text-gray-500">
                Cluster VMware · {hosts} hôtes ESXi
              </div>

            </div>

            <div className="relative grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">

              <RoleColumn
                role="management"
                title="Management"
                vlans={vlanList("management")}
                vmks={roleVmks("management")}
                hosts={hosts}
                onSelect={setSelected}
              />

              <RoleColumn
                role="vmotion"
                title="vMotion"
                vlans={vlanList("vmotion")}
                vmks={roleVmks("vmotion")}
                hosts={hosts}
                onSelect={setSelected}
              />

              <RoleColumn
                role="storage"
                title="Storage"
                vlans={vlanList("storage")}
                vmks={roleVmks("storage")}
                hosts={hosts}
                onSelect={setSelected}
              />

              <RoleColumn
                role="backup"
                title="Backup"
                vlans={vlanList("backup")}
                vmks={roleVmks("backup")}
                hosts={hosts}
                onSelect={setSelected}
              />

              <RoleColumn
                role="vm"
                title="Réseaux VM"
                vlans={vlanList("vm")}
                vmks={roleVmks("vm")}
                hosts={hosts}
                onSelect={setSelected}
              />

            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">

              <div className="flex items-center gap-2 mb-4">

                <h4 className="text-sm font-semibold text-gray-900">
                  Détails du segment sélectionné
                </h4>

                <span className={`text-[11px] px-2 py-1 rounded-full font-semibold ${(roleTone[selected.role] || roleTone.neutral).chip}`}>
                  {selected.title}
                </span>

              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">

                <div>
                  <div className="text-gray-400">VLANs</div>
                  <div className="font-semibold text-gray-800">
                    {selected.vlans.join(", ") || "N/A"}
                  </div>
                </div>

                <div>
                  <div className="text-gray-400">VMkernel</div>
                  <div className="font-semibold text-gray-800">
                    {selected.vmks.length}
                  </div>
                </div>

                <div>
                  <div className="text-gray-400">Couverture</div>
                  <div className="font-semibold text-gray-800">
                    {selected.present}/{hosts} hôtes
                  </div>
                </div>

                <div>
                  <div className="text-gray-400">MTU</div>
                  <div className="font-semibold text-gray-800">
                    {selected.vmks[0]?.mtu || "N/A"}
                  </div>
                </div>

              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">

              <h4 className="text-sm font-semibold text-gray-900 mb-4">
                Légende
              </h4>

              <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">

                <div className="flex items-center gap-2">
                  <Network size={14} className="text-blue-500"/>
                  Réseau / Catégorie
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"/>
                  Hôte présent
                </div>

                <div className="flex items-center gap-2">
                  <Monitor size={14} className="text-violet-500"/>
                  VLAN
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full border border-dashed border-gray-400"/>
                  Hôte absent
                </div>

                <div className="flex items-center gap-2">
                  <Cpu size={14} className="text-slate-500"/>
                  VMkernel
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-8 border-t border-gray-300"/>
                  Lien logique
                </div>

              </div>
            </div>

          </div>

          <div className="mt-4 rounded-2xl bg-blue-50 border border-blue-100 px-4 py-3 text-xs text-blue-700">
            La topologie est basée sur les données détectées dans RVTools et l'inventaire vCenter.
          </div>

        </div>

        <div className="space-y-4">

          <SideCard title="Résumé de la topologie">
            <MiniDonut
              ok={okCount}
              warn={issueCount}
              bad={orphanSegments.length}
            />
          </SideCard>

          <SideCard title={`Incohérences détectées (${issueCount})`}>

            <div className="space-y-2">

              {mtuIssues.slice(0,3).map((v,i)=>(
                <div
                  key={i}
                  className="rounded-xl border border-amber-100 bg-amber-50/40 p-3"
                >

                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
                    <AlertTriangle size={14}/>
                    MTU incohérent
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    {getName(v)} · MTU {v.mtu}
                  </div>

                </div>
              ))}

              {partialCoverage > 0 && (
                <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3">

                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
                    <AlertTriangle size={14}/>
                    Couverture partielle
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    {partialCoverage} catégorie(s) réseau non présentes sur tous les hôtes
                  </div>

                </div>
              )}

              {issueCount === 0 && (
                <div className="text-sm text-emerald-600 font-semibold">
                  Aucune incohérence majeure détectée
                </div>
              )}

            </div>

          </SideCard>

          <SideCard title={`Segments orphelins (${orphanSegments.length})`}>

            <div className="space-y-3">

              {orphanSegments.map((s,i)=>(
                <div
                  key={i}
                  className="border-b border-gray-100 last:border-0 pb-3 last:pb-0"
                >

                  <div className="text-xs font-semibold text-gray-800">
                    VLAN {getVlan(s)}
                  </div>

                  <div className="text-xs text-gray-400 mt-0.5">
                    {getName(s)}
                  </div>

                </div>
              ))}

              {orphanSegments.length === 0 && (
                <div className="text-sm text-emerald-600 font-semibold">
                  Aucun segment orphelin
                </div>
              )}

            </div>

          </SideCard>

        </div>

      </div>

    </div>
  );
}
