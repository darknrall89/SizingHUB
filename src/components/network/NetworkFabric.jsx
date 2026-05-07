import React from "react";
import {
  Server, Network, Shield, Database, AlertTriangle, Download,
  GitBranch, Layers, Info, Monitor, Cpu, HardDrive, CheckCircle2
} from "lucide-react";

const TONES = {
  management: { bg:"bg-blue-50", border:"border-blue-200", text:"text-blue-700", icon:"text-blue-500", chip:"bg-blue-100 text-blue-700", line:"#93c5fd" },
  vmotion:    { bg:"bg-violet-50", border:"border-violet-200", text:"text-violet-700", icon:"text-violet-500", chip:"bg-violet-100 text-violet-700", line:"#c4b5fd" },
  storage:    { bg:"bg-emerald-50", border:"border-emerald-200", text:"text-emerald-700", icon:"text-emerald-500", chip:"bg-emerald-100 text-emerald-700", line:"#86efac" },
  backup:     { bg:"bg-orange-50", border:"border-orange-200", text:"text-orange-700", icon:"text-orange-500", chip:"bg-orange-100 text-orange-700", line:"#fdba74" },
  vm:         { bg:"bg-cyan-50", border:"border-cyan-200", text:"text-cyan-700", icon:"text-cyan-500", chip:"bg-cyan-100 text-cyan-700", line:"#67e8f9" },
};

function s(v){ return String(v ?? "").trim(); }
function low(v){ return s(v).toLowerCase(); }

function getName(x){
  return s(x?.name || x?.portGroup || x?.["Port Group"] || x?.network || x?.Network || x?.Name || x?.["Network Name"] || "N/A");
}

function getVlan(x){
  const v = x?.vlan ?? x?.VLAN ?? x?.["VLAN ID"] ?? x?.vlanId ?? x?.VlanId;
  if (v === "" || v === undefined || v === null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? v : n;
}

function displayVlan(v){
  if (v === null || v === undefined) return null;
  if (Number(v) === 0) return "UNTAGGED";
  return `VLAN ${v}`;
}

function classifyByText(value){
  const n = low(value);
  if (n.includes("management") || n.includes("mgmt") || n.includes("admin")) return "management";
  if (n.includes("vmotion") || n.includes("v-motion") || n.includes("v motion") || n.includes("migration")) return "vmotion";
  if (n.includes("iscsi") || n.includes("nfs") || n.includes("san") || n.includes("storage") || n.includes("nas") || n.includes("vmfs")) return "storage";
  if (n.includes("backup") || n.includes("veeam") || n.includes("sauvegarde") || n.includes("repo")) return "backup";
  return "vm";
}

function classify(x){
  return classifyByText(Object.values(x || {}).join(" "));
}

function uniq(arr){
  return [...new Set(arr.filter(v => v !== null && v !== undefined && v !== ""))];
}

function iconFor(role){
  if(role === "management") return Shield;
  if(role === "vmotion") return GitBranch;
  if(role === "storage") return Database;
  if(role === "backup") return HardDrive;
  return Network;
}

function Kpi({icon:Icon, label, value, sub, tone="blue"}){
  const colors = {
    blue:"text-blue-600 bg-blue-50 border-blue-100",
    violet:"text-violet-600 bg-violet-50 border-violet-100",
    emerald:"text-emerald-600 bg-emerald-50 border-emerald-100",
    amber:"text-amber-600 bg-amber-50 border-amber-100",
    slate:"text-slate-600 bg-slate-50 border-slate-100",
    red:"text-red-600 bg-red-50 border-red-100",
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${colors[tone] || colors.blue}`}>
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

function MiniDonut({ok=0, warn=0, bad=0}){
  const total = Math.max(ok + warn + bad, 1);
  const okPct = Math.round((ok / total) * 100);
  const warnPct = Math.round((warn / total) * 100);

  return (
    <div className="flex items-center gap-5">
      <div
        className="relative w-28 h-28 rounded-full"
        style={{background:`conic-gradient(#22c55e 0 ${okPct}%, #f59e0b ${okPct}% ${okPct + warnPct}%, #ef4444 ${okPct + warnPct}% 100%)`}}
      >
        <div className="absolute inset-5 bg-white rounded-full flex items-center justify-center">
          <span className="text-lg font-semibold text-gray-800">{okPct}%</span>
        </div>
      </div>
      <div className="space-y-2 text-xs min-w-[120px]">
        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"/>Segments OK <b className="ml-auto">{ok}</b></div>
        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500"/>À surveiller <b className="ml-auto">{warn}</b></div>
        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"/>Problèmes <b className="ml-auto">{bad}</b></div>
      </div>
    </div>
  );
}

function SideCard({title, children}){
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h4 className="text-sm font-semibold text-gray-900 mb-4">{title}</h4>
      {children}
    </div>
  );
}

function HostDots({present=0, total=0, tone}){
  const count = Math.max(total, present, 1);
  return (
    <div className="flex flex-wrap justify-center gap-2 mt-2">
      {Array.from({length:count}).map((_,i)=>(
        <div
          key={i}
          className={`w-6 h-6 rounded-lg border flex items-center justify-center ${
            i < present ? `${tone.chip} border-transparent` : "bg-white border-dashed border-gray-300 text-gray-300"
          }`}
        >
          <Server size={12}/>
        </div>
      ))}
    </div>
  );
}

function TopologyColumn({col, hosts, onSelect}){
  const t = TONES[col.role];
  const Icon = iconFor(col.role);
  const partial = hosts > 0 && col.presentHosts > 0 && col.presentHosts < hosts;
  const hasWarning = partial || col.mtuIssues.length > 0;

  return (
    <div className="relative flex flex-col items-center min-w-[180px] flex-1">
      <div className="hidden lg:block absolute -top-[34px] left-1/2 w-px h-[34px]" style={{background:t.line}}/>
      <div className="hidden lg:block absolute -top-[38px] left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white border-2" style={{borderColor:t.line}}/>

      <button
        onClick={() => onSelect(col)}
        className={`w-full rounded-2xl border ${t.border} ${t.bg} p-4 text-center shadow-sm hover:shadow-md transition`}
      >
        <div className={`flex items-center justify-center gap-2 text-sm font-bold ${t.text}`}>
          <Icon size={17}/>
          {col.title}
        </div>

        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {col.vlans.slice(0,3).map((v,i)=>(
            <span key={i} className={`text-[11px] px-2 py-1 rounded-full font-semibold ${t.chip}`}>
              {displayVlan(v)}
            </span>
          ))}
          {col.vlans.length > 3 && (
            <span className={`text-[11px] px-2 py-1 rounded-full font-semibold ${t.chip}`}>
              +{col.vlans.length - 3}
            </span>
          )}
          {col.vlans.length === 0 && (
            col.fcDetected ? (
              <span className={`text-[11px] px-2 py-1 rounded-full font-semibold ${t.chip}`}>
                Fibre Channel
              </span>
            ) : (
              <span className="text-xs text-gray-400">Non détecté</span>
            )
          )}
        </div>
      </button>

      <div className="w-px h-4" style={{background:t.line}}/>

      <div className={`w-full rounded-2xl border ${t.border} bg-white px-4 py-3 text-center shadow-sm`}>
        <div className={`text-xs font-semibold ${t.text}`}>
          {col.role === "vm"
            ? `Port Groups (${col.portGroups.length})`
            : `VMkernel (${col.vmks.length})`}
        </div>

        <div className="mt-2 min-h-[30px] flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-gray-600 leading-5">
          {col.role === "vm" ? (
            <>
              {col.portGroups.slice(0,3).map((p,i)=>(
                <span key={i} className="inline-flex items-center whitespace-nowrap">
                  {i > 0 && <span className="text-blue-300 mr-2">|</span>}
                  {getName(p)}
                </span>
              ))}

              {col.portGroups.length > 3 && (
                <span className="inline-flex items-center font-semibold text-blue-600 whitespace-nowrap">
                  <span className="text-blue-300 mr-2">|</span>
                  +{col.portGroups.length - 3}
                </span>
              )}

              {col.portGroups.length === 0 && (
                <span className="text-gray-400">Aucun port group</span>
              )}
            </>
          ) : (
            <>
              {col.vmks.slice(0,3).map((v,i)=>(
                <span key={i} className="inline-flex items-center whitespace-nowrap">
                  {i > 0 && <span className="text-blue-300 mr-2">|</span>}
                  <span className="font-medium">{v.device || v.Device || "vmk"}</span>
                  <span className="mx-1 text-gray-300">·</span>
                  <span>{v.ip || v.IP || "IP N/A"}</span>
                </span>
              ))}

              {col.vmks.length > 3 && (
                <span className={`inline-flex items-center font-semibold whitespace-nowrap ${t.text}`}>
                  <span className="text-blue-300 mr-2">|</span>
                  +{col.vmks.length - 3}
                </span>
              )}

              {col.vmks.length === 0 && (
                col.fcDetected ? (
                  <span className="inline-flex items-center justify-center gap-2 text-emerald-700 font-semibold">
                    <span>HBA / FC détecté</span>
                    <span className="text-gray-300">|</span>
                    <span>voir onglet Storage</span>
                  </span>
                ) : (
                  <span className="text-gray-400">Aucun VMkernel</span>
                )
              )}
            </>
          )}
        </div>
      </div>

      <div className="w-px h-4" style={{background:t.line}}/>

      <div className={`w-full rounded-2xl border ${partial ? "border-amber-200 bg-amber-50" : t.border + " bg-white"} p-4 text-center shadow-sm`}>
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-700">
          <span className={`w-2 h-2 rounded-full ${partial ? "bg-amber-400" : "bg-emerald-400"}`}/>
          {col.presentHosts}/{hosts} hôtes
        </div>
        <HostDots present={col.presentHosts} total={hosts} tone={t}/>
      </div>

      {hasWarning && (
        <>
          <div className={`w-px h-4 ${partial ? "bg-amber-300" : "bg-red-300"}`}/>
          <div className="w-full rounded-2xl border border-amber-200 bg-amber-50 p-3 text-center shadow-sm">
            <div className="flex items-center justify-center gap-2 text-[11px] font-semibold text-amber-700">
              <AlertTriangle size={13}/>
              {partial ? `Couverture partielle` : `MTU à vérifier`}
            </div>
            <div className="text-[11px] text-amber-600 mt-1">
              {partial ? `manque sur ${hosts - col.presentHosts} hôte(s)` : `${col.mtuIssues.length} VMkernel concerné(s)`}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function NetworkFabric({
  hosts=0,
  segments=0,
  portGroups=0,
  redundancyScore=0,
  vmKernel=[],
  segmentList=[],
  portGroupList=[],
  hbaRows=[],
}) {
  const vmks = Array.isArray(vmKernel) ? vmKernel : [];
  const segs = Array.isArray(segmentList) ? segmentList : [];
  const pgs = Array.isArray(portGroupList) ? portGroupList : [];
  const hbas = Array.isArray(hbaRows) ? hbaRows : [];

  const roles = ["management","vmotion","storage","backup","vm"];

  const vmksByRole = Object.fromEntries(roles.map(r => [r, vmks.filter(v => classify(v) === r)]));
  const pgsByRole = Object.fromEntries(roles.map(r => [r, pgs.filter(p => classify(p) === r)]));
  const segsByRole = Object.fromEntries(roles.map(r => [r, segs.filter(x => classify(x) === r)]));

  const hbaLikeRows = hbas.filter(x => {
    const t = Object.values(x || {}).join(" ").toLowerCase();
    return (
      t.includes("fibre channel") ||
      t.includes("fiber channel") ||
      t.includes("vmhba") ||
      t.includes("wwn") ||
      t.includes("wwpn") ||
      t.includes("emulex") ||
      t.includes("qlogic") ||
      t.includes("brocade")
    );
  });

  const fcDetected = hbaLikeRows.length > 0;

  const cleanVlans = (values) => {
    const out = uniq(values)
      .filter(v => v !== null && v !== undefined && v !== "");

    const tagged = out.filter(v => Number(v) !== 0);

    // VLAN 0 / UNTAGGED est affiché uniquement s'il n'y a aucun VLAN taggé.
    return tagged.length ? tagged : out;
  };

  const pgKey = (v) => String(v || "").trim().toLowerCase();

  console.log("🔎 NetworkFabric vMotion VMKs", vmks.filter(v => Object.values(v || {}).join(" ").toLowerCase().includes("vmotion")));
  console.log("🔎 NetworkFabric PGs sample", pgs.slice(0,20));
  console.log("🔎 NetworkFabric Segments sample", segs.slice(0,20));
  const portGroupVlanMap = new Map();
  [...pgs, ...segs].forEach(x => {
    const name = getName(x);
    const vlan = getVlan(x);
    if (!name || name === "N/A" || vlan === null || vlan === undefined) return;
    portGroupVlanMap.set(pgKey(name), vlan);
  });

  const subnetOfIp = (ip) => {
    if (!ip || typeof ip !== "string") return null;
    const p = ip.split(".");
    if (p.length !== 4) return null;
    return `${p[0]}.${p[1]}.${p[2]}`;
  };

  const getVmkVlan = (v) => {
    const direct = getVlan(v);
    if (direct !== null && direct !== undefined) return direct;

    const candidates = [
      v?.portGroup,
      v?.["Port Group"],
      v?.network,
      v?.Network,
      v?.name,
      v?.Name,
    ].filter(Boolean);

    for (const c of candidates) {
      const mapped = portGroupVlanMap.get(pgKey(c));
      if (mapped !== undefined && mapped !== null) return mapped;
    }

    // fallback intelligent via subnet
    const vmkSubnet = subnetOfIp(v?.ip);

    if (vmkSubnet) {
      for (const s of segs) {
        const name = String(getName(s) || "").toLowerCase();

        const vlan = getVlan(s);

        if (
          vlan !== null &&
          (
            name.includes("vmotion") ||
            name.includes("migration") ||
            name.includes("v-motion")
          )
        ) {
          return vlan;
        }
      }
    }

    return null;
  };

  const infraPortGroupNames = new Set(
    vmks
      .map(v => getName(v))
      .filter(Boolean)
  );

  const makeCol = (role, title) => {
    const isInfraRole = ["management", "vmotion", "storage", "backup"].includes(role);

    // Règle importante :
    // - Management / vMotion / Storage / Backup = uniquement VMkernel
    // - Réseaux VM = Port Groups / VLANs applicatifs
    const vmkRows = isInfraRole ? (vmksByRole[role] || []) : [];

    const pgRows = role === "vm"
      ? pgs.filter(p => !infraPortGroupNames.has(getName(p)))
      : [];

    const segRows = role === "vm"
      ? segs.filter(s => {
          const vlan = getVlan(s);
          const usedByInfraVmk = vmks.some(v => getVmkVlan(v) === vlan && vlan !== null);
          return !usedByInfraVmk;
        })
      : [];

    const vlans = role === "vm"
      ? cleanVlans([
          ...pgRows.map(getVlan),
          ...segRows.map(getVlan),
        ])
      : cleanVlans([
          ...vmkRows.map(getVmkVlan),
        ]);

    const hostNames = uniq(vmkRows.map(v => v.host || v.Host || v.hostname || v.Hostname));

    const isFcStorageFallback =
      role === "storage" &&
      fcDetected &&
      vmkRows.length === 0 &&
      vlans.length === 0;

    const presentHosts =
      role === "vm"
        ? hosts
        : isFcStorageFallback
          ? hosts
          : hostNames.length;

    const mtuIssues = vmkRows.filter(v =>
      role === "storage" &&
      Number(v.mtu || v.MTU || 0) > 0 &&
      Number(v.mtu || v.MTU || 0) < 9000
    );

    return {
      role,
      title,
      vmks: vmkRows,
      portGroups: pgRows,
      segments: segRows,
      vlans,
      presentHosts,
      mtuIssues,
      fcDetected: isFcStorageFallback,
      hbaCount: isFcStorageFallback ? hbaLikeRows.length : 0,
    };
  };

  const columns = [
    makeCol("management", "Management"),
    makeCol("vmotion", "vMotion"),
    makeCol("storage", "Storage"),
    makeCol("backup", "Backup"),
    makeCol("vm", "Réseaux VM"),
  ].filter(c => {
    if (c.role === "backup") {
      return c.vmks.length > 0;
    }
    return true;
  });

  const partialColumns = columns.filter(c => hosts > 0 && c.presentHosts > 0 && c.presentHosts < hosts);
  const mtuIssues = columns.flatMap(c => c.mtuIssues.map(v => ({...v, role:c.role, title:c.title})));

  const allNetworkItems = [
    ...segs.map(x => ({...x, source:"segment"})),
    ...pgs.map(x => ({...x, source:"pg"})),
  ];

  const seenVmkVlans = new Set(vmks.map(getVmkVlan).filter(v => v !== null));
  const seenPgVlans = new Set(pgs.map(getVlan).filter(v => v !== null));

  const orphanByVlan = new Map();
  allNetworkItems.forEach(x => {
    const vlan = getVlan(x);
    if (vlan === null || vlan === undefined || Number(vlan) === 0) return;
    const hasAnyRelation = seenVmkVlans.has(vlan) || seenPgVlans.has(vlan);
    if (!hasAnyRelation && !orphanByVlan.has(vlan)) orphanByVlan.set(vlan, x);
  });
  const orphanSegments = [...orphanByVlan.values()].slice(0,5);

  const issueCount = partialColumns.length + mtuIssues.length;
  const badCount = orphanSegments.length;
  const totalSegments = segments || segs.length || columns.reduce((a,c)=>a+c.vlans.length,0);
  const okCount = Math.max(totalSegments - issueCount - badCount, 0);

  const defaultSelected = columns.find(c => c.role === "storage") || columns[0];
  const [selected, setSelected] = React.useState(defaultSelected);

  const coverageValue = hosts
    ? `${columns.filter(c => c.presentHosts >= hosts).length} / ${columns.length}`
    : "N/A";

  const coveragePct = hosts && columns.length
    ? Math.round((columns.filter(c => c.presentHosts >= hosts).length / columns.length) * 100)
    : 0;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 lg:p-6">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <div className="min-w-0">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">Topologie logique des réseaux <span className="ml-2 text-[11px] px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">Infra VMkernel + Port Groups VM</span></h3>
                <Info size={15} className="text-blue-400"/>
              </div>
              <p className="text-sm text-gray-400 mt-1">Vue d'ensemble séparant les réseaux d'infrastructure VMkernel et les réseaux VM</p>
            </div>

            <button className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
              <Download size={14}/> Exporter
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
            <Kpi icon={GitBranch} label="Catégories réseau" value={columns.length} tone="blue"/>
            <Kpi icon={Layers} label="Segments détectés" value={totalSegments} tone="violet"/>
            <Kpi icon={Shield} label="Couverture hôtes" value={coverageValue} sub={`${coveragePct}%`} tone={coveragePct >= 80 ? "emerald" : "amber"}/>
            <Kpi icon={AlertTriangle} label="Incohérences détectées" value={issueCount} tone={issueCount ? "amber" : "emerald"}/>
            <Kpi icon={Network} label="Orphelins à vérifier" value={badCount} tone={badCount ? "slate" : "emerald"}/>
          </div>

          <div className="relative rounded-3xl border border-gray-100 bg-gradient-to-br from-white to-slate-50 p-5 lg:p-7 overflow-hidden">
            <div className="relative mx-auto mb-16 w-full max-w-[270px] rounded-2xl border border-blue-100 bg-white shadow-sm p-4 text-center">
              <Server size={27} className="text-blue-500 mx-auto mb-2"/>
              <div className="text-sm font-bold text-gray-900">vCenter / Cluster</div>
              <div className="text-xs text-gray-500">Cluster VMware · {hosts} hôtes ESXi</div>
              <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-1">
                <CheckCircle2 size={12}/> Score réseau {redundancyScore}%
              </div>
            </div>

            <div className="hidden lg:block absolute left-[10%] right-[10%] top-[190px] border-t-2 border-dashed border-slate-300"/>
            <div className="hidden lg:block absolute left-1/2 top-[151px] h-[40px] border-l-2 border-dashed border-slate-300"/>
            <div className="hidden lg:block absolute left-1/2 top-[184px] -translate-x-1/2 w-3 h-3 rounded-full bg-white border-2 border-emerald-400"/>

            <div
              className="relative grid gap-5"
              style={{gridTemplateColumns:`repeat(${columns.length}, minmax(170px, 1fr))`}}
            >
              {columns.map(col => (
                <TopologyColumn
                  key={col.role}
                  col={col}
                  hosts={hosts}
                  onSelect={setSelected}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <h4 className="text-sm font-semibold text-gray-900">Détails du segment sélectionné</h4>
                {selected && (
                  <span className={`text-[11px] px-2 py-1 rounded-full font-semibold ${TONES[selected.role]?.chip}`}>
                    {selected.title}
                  </span>
                )}
              </div>

              {selected ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
                  <div>
                    <div className="text-gray-400">VLANs</div>
                    <div className="font-semibold text-gray-800">{selected.vlans.map(displayVlan).join(", ") || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Type</div>
                    <div className="font-semibold text-gray-800">{selected.fcDetected ? "HBA / Fibre Channel" : selected.role === "vm" ? "Port Groups" : "VMkernel"}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Objets</div>
                    <div className="font-semibold text-gray-800">{selected.fcDetected ? selected.hbaCount : selected.role === "vm" ? selected.portGroups.length : selected.vmks.length}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Couverture</div>
                    <div className="font-semibold text-gray-800">{selected.presentHosts}/{hosts} hôtes</div>
                  </div>
                  <div>
                    <div className="text-gray-400">MTU</div>
                    <div className="font-semibold text-gray-800">{selected.fcDetected ? "N/A - FC" : selected.vmks[0]?.mtu || selected.vmks[0]?.MTU || "N/A"}</div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-400">Cliquez sur un bloc pour afficher les détails.</div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Légende</h4>
              <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-2"><Network size={14} className="text-blue-500"/>Réseau / Catégorie</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400"/>Hôte présent</div>
                <div className="flex items-center gap-2"><Monitor size={14} className="text-violet-500"/>VLAN</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full border border-dashed border-gray-400"/>Hôte absent</div>
                <div className="flex items-center gap-2"><Cpu size={14} className="text-slate-500"/>VMkernel</div>
                <div className="flex items-center gap-2"><span className="w-8 border-t border-dashed border-gray-300"/>Lien logique</div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-blue-50 border border-blue-100 px-4 py-3 text-xs text-blue-700">
            La topologie infrastructure Management / vMotion / Storage / Backup est basée uniquement sur les interfaces VMkernel. Les réseaux VM sont basés sur les Port Groups / VLANs.
          </div>
        </div>

        <div className="space-y-4">
          <SideCard title="Résumé de la topologie">
            <MiniDonut ok={okCount} warn={issueCount} bad={badCount}/>
          </SideCard>

          <SideCard title={`Incohérences détectées (${issueCount})`}>
            <div className="space-y-2">
              {mtuIssues.slice(0,4).map((v,i)=>(
                <div key={i} className="rounded-xl border border-amber-100 bg-amber-50/40 p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
                    <AlertTriangle size={14}/> MTU incohérent
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {getName(v)} · MTU {v.mtu || v.MTU}
                  </div>
                </div>
              ))}

              {partialColumns.slice(0,4).map((c,i)=>(
                <div key={`p-${i}`} className="rounded-xl border border-amber-100 bg-amber-50/40 p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
                    <AlertTriangle size={14}/> Couverture partielle
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {c.title} · présent sur {c.presentHosts}/{hosts} hôtes
                  </div>
                </div>
              ))}

              {issueCount === 0 && (
                <div className="text-sm text-emerald-600 font-semibold">Aucune incohérence majeure détectée</div>
              )}
            </div>
          </SideCard>

          <SideCard title={`Segments orphelins (${badCount})`}>
            <div className="space-y-3">
              {orphanSegments.map((x,i)=>(
                <div key={i} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                  <div className="text-xs font-semibold text-gray-800">{displayVlan(getVlan(x))}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{getName(x)}</div>
                </div>
              ))}

              {badCount === 0 && (
                <div className="text-sm text-emerald-600 font-semibold">Aucun segment orphelin</div>
              )}
            </div>
          </SideCard>
        </div>
      </div>
    </div>
  );
}
