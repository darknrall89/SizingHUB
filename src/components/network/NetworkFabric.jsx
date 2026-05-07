import {
  Server, Network, Shield, Database, AlertTriangle,
  CheckCircle, Activity, Download
} from "lucide-react";

const tone = {
  management: { bg:"bg-emerald-50", border:"border-emerald-200", text:"text-emerald-700", icon:"text-emerald-500", line:"#10b981" },
  cluster:    { bg:"bg-blue-50",    border:"border-blue-200",    text:"text-blue-700",    icon:"text-blue-500",    line:"#3b82f6" },
  vmotion:    { bg:"bg-violet-50",  border:"border-violet-200",  text:"text-violet-700",  icon:"text-violet-500",  line:"#8b5cf6" },
  storage:    { bg:"bg-orange-50",  border:"border-orange-200",  text:"text-orange-700",  icon:"text-orange-500",  line:"#f97316" },
  vm:         { bg:"bg-sky-50",     border:"border-sky-200",     text:"text-sky-700",     icon:"text-sky-500",     line:"#2563eb" },
};

function subnetToCidr(mask) {
  if (!mask) return "24";
  return mask.split(".").map(Number).reduce((acc,b) => acc + b.toString(2).split("").filter(c=>c==="1").length, 0);
}

function ipToSubnet(ip, mask) {
  if (!ip) return null;
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  const cidr = subnetToCidr(mask);
  return `${parts[0]}.${parts[1]}.${parts[2]}.0/${cidr}`;
}

function SummaryTag({ subnet, vlan, device, mtu, warn }) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-mono bg-white/80 border border-white rounded-lg px-2.5 py-1.5 text-gray-700">
      <span className="font-semibold">{subnet}</span>
      {vlan != null && <span className="text-gray-400">· VLAN {vlan}</span>}
      {device && <span className="text-gray-400">· {device}</span>}
      {warn && <span className="text-amber-500 font-sans font-medium">⚠ MTU {mtu}</span>}
    </div>
  );
}

function FabricBox({ role, title, subtitle, detail, healthy=true, summaries=[] }) {
  const s = tone[role] || tone.cluster;
  const Icon =
    role === "management" ? Shield :
    role === "storage"    ? Database :
    role === "cluster"    ? Server :
    role === "vmotion"    ? Activity :
    Network;

  return (
    <div className={`relative rounded-2xl border ${s.border} ${s.bg} p-4 min-h-[112px] shadow-sm`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 rounded-xl bg-white border ${s.border} flex items-center justify-center`}>
            <Icon size={20} className={s.icon}/>
          </div>
          <div>
            <div className={`text-sm font-semibold ${s.text}`}>{title}</div>
            <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
          </div>
        </div>
        {healthy
          ? <CheckCircle size={16} className="text-emerald-500 flex-shrink-0"/>
          : <AlertTriangle size={16} className="text-red-500 flex-shrink-0"/>
        }
      </div>

      <div className="mt-3 rounded-xl bg-white/70 border border-white px-3 py-2 text-xs text-gray-500">
        {detail}
      </div>

      {summaries.length > 0 && (
        <div className="mt-2 flex flex-col gap-1">
          {summaries.map((s, i) => <SummaryTag key={i} {...s} />)}
        </div>
      )}
    </div>
  );
}

function Legend({ color, label, dashed=false }) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <span className="inline-block w-9 border-t-2" style={{ borderColor:color, borderStyle:dashed?"dashed":"solid" }}/>
      {label}
    </div>
  );
}

export default function NetworkFabric({
  hosts=0, segments=0, portGroups=0,
  hasManagement=false, hasVmotion=false, hasStorage=false,
  redundancyScore=0, vmKernel=[]
}) {
  // Grouper par rôle et dédupliquer par subnet
  const byRole = (role) => {
    const entries = vmKernel.filter(e => {
      const pg = (e.portGroup || "").toLowerCase();
      if (role === "management") return pg.includes("management") || pg.includes("mgmt");
      if (role === "vmotion")    return pg.includes("vmotion") || pg.includes("v-motion");
      if (role === "storage")    return pg.includes("iscsi") || pg.includes("san") || pg.includes("nfs") || pg.includes("storage");
      return false;
    });

    // Dédupliquer par subnet
    const subnets = new Map();
    entries.forEach(e => {
      const subnet = ipToSubnet(e.ip, e.subnet);
      if (!subnet) return;
      if (!subnets.has(subnet)) {
        subnets.set(subnet, {
          subnet,
          vlan: e.vlan ?? null,
          device: e.device,
          mtu: e.mtu,
          warn: e.mtu && e.mtu < 9000 && (role === "storage"),
        });
      }
    });
    return [...subnets.values()];
  };

  const mgmtSummaries    = byRole("management");
  const vmotionSummaries = byRole("vmotion");
  const storageSummaries = byRole("storage");

  const hasJumbo    = vmKernel.filter(e => (e.portGroup||"").toLowerCase().includes("iscsi")).some(e => e.mtu >= 9000);
  const storagePaths = vmKernel.filter(e => (e.portGroup||"").toLowerCase().includes("iscsi") || (e.portGroup||"").toLowerCase().includes("san")).length;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-7">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-lg font-semibold text-gray-900">Network Fabric</div>
            <span className="text-xs text-gray-400">(Vue logique)</span>
          </div>
          <div className="text-sm text-gray-400 mt-1">
            Cartographie des rôles réseau, des flux critiques et des segments détectés.
          </div>
        </div>
        <button className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
          Exporter le schéma <Download size={14}/>
        </button>
      </div>

      <div className="relative rounded-3xl border border-gray-100 bg-gradient-to-br from-white to-slate-50 p-6 overflow-hidden">
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
          <line x1="18%" y1="38%" x2="47%" y2="50%" stroke={tone.management.line} strokeWidth="3"/>
          <line x1="18%" y1="67%" x2="47%" y2="55%" stroke={tone.storage.line} strokeWidth="3" strokeDasharray={hasStorage?0:8}/>
          <line x1="53%" y1="50%" x2="82%" y2="38%" stroke={tone.vmotion.line} strokeWidth="3" strokeDasharray={hasVmotion?0:8}/>
          <line x1="53%" y1="55%" x2="82%" y2="67%" stroke={tone.vm.line} strokeWidth="3"/>
        </svg>

        <div className="relative grid grid-cols-1 xl:grid-cols-3 gap-6 items-center">
          {/* Colonne gauche */}
          <div className="space-y-5">
            <FabricBox
              role="management"
              title="Management"
              subtitle={hasManagement ? "Réseau identifié" : "Non clairement identifié"}
              healthy={hasManagement}
              detail={hasManagement ? "Flux d'administration détectés" : "À qualifier : iDRAC/iLO, ESXi mgmt, bastion"}
              summaries={mgmtSummaries}
            />
            <FabricBox
              role="storage"
              title="Storage"
              subtitle={hasStorage ? `Réseau dédié · ${storagePaths} chemin${storagePaths>1?"s":""}` : "Non détecté"}
              healthy={hasStorage}
              detail={hasStorage
                ? `Flux iSCSI/NFS/SAN identifiés${!hasJumbo && storagePaths > 0 ? " · ⚠ MTU 1500" : ""}`
                : "Risque : stockage potentiellement mutualisé"}
              summaries={storageSummaries}
            />
          </div>

          {/* Centre */}
          <div className="flex justify-center">
            <div className="w-full max-w-[260px] rounded-3xl border border-blue-200 bg-blue-50 p-5 shadow-sm text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-white border border-blue-200 flex items-center justify-center mb-4">
                <Server size={30} className="text-blue-600"/>
              </div>
              <div className="text-base font-semibold text-blue-800">Cluster VMware</div>
              <div className="text-sm text-blue-600 mt-1">{hosts} hosts</div>
              <div className="mt-4 rounded-xl bg-white/80 border border-white px-3 py-2 text-xs text-gray-500">
                {portGroups} port groups · {segments} segments
              </div>
            </div>
          </div>

          {/* Colonne droite */}
          <div className="space-y-5">
            <FabricBox
              role="vmotion"
              title="vMotion"
              subtitle={hasVmotion ? "Réseau dédié détecté" : "Non détecté"}
              healthy={hasVmotion}
              detail={hasVmotion ? "Isolation vMotion présente" : "Risque : migration à chaud non qualifiée"}
              summaries={vmotionSummaries}
            />
            <FabricBox
              role="vm"
              title="VM Networks"
              subtitle={`${segments} segments applicatifs`}
              healthy={segments > 0}
              detail="Trafic applicatif / production"
              summaries={[]}
            />
          </div>
        </div>

        <div className="relative mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-4">
          <div className="flex flex-wrap gap-5">
            <Legend color={tone.management.line} label="Management"/>
            <Legend color={tone.vmotion.line} label={hasVmotion?"vMotion":"vMotion absent"} dashed={!hasVmotion}/>
            <Legend color={tone.storage.line} label={hasStorage?"Storage":"Storage absent"} dashed={!hasStorage}/>
            <Legend color={tone.vm.line} label="VM Traffic"/>
          </div>
          <div className="text-xs text-gray-500">
            Redondance réseau : <span className="font-semibold text-emerald-600">{redundancyScore}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
