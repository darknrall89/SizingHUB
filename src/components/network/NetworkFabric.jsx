import {
  Server, Network, Shield, Database, AlertTriangle,
  CheckCircle, Activity, Download
} from "lucide-react";

const tone = {
  management: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    icon: "text-emerald-500",
    line: "#10b981"
  },
  cluster: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    icon: "text-blue-500",
    line: "#3b82f6"
  },
  vmotion: {
    bg: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-700",
    icon: "text-violet-500",
    line: "#8b5cf6"
  },
  storage: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    icon: "text-orange-500",
    line: "#f97316"
  },
  vm: {
    bg: "bg-sky-50",
    border: "border-sky-200",
    text: "text-sky-700",
    icon: "text-sky-500",
    line: "#2563eb"
  }
};

function FabricBox({ role, title, subtitle, detail, healthy=true }) {
  const s = tone[role] || tone.cluster;
  const Icon =
    role === "management" ? Shield :
    role === "storage" ? Database :
    role === "cluster" ? Server :
    role === "vmotion" ? Activity :
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

        {healthy ? (
          <CheckCircle size={16} className="text-emerald-500"/>
        ) : (
          <AlertTriangle size={16} className="text-red-500"/>
        )}
      </div>

      <div className="mt-4 rounded-xl bg-white/70 border border-white px-3 py-2 text-xs text-gray-500">
        {detail}
      </div>
    </div>
  );
}

function Legend({ color, label, dashed=false }) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <span
        className="inline-block w-9 border-t-2"
        style={{
          borderColor: color,
          borderStyle: dashed ? "dashed" : "solid"
        }}
      />
      {label}
    </div>
  );
}

export default function NetworkFabric({
  hosts=0,
  segments=0,
  portGroups=0,
  hasManagement=false,
  hasVmotion=false,
  hasStorage=false,
  redundancyScore=0
}) {
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
          Exporter le schéma
          <Download size={14}/>
        </button>
      </div>

      <div className="relative rounded-3xl border border-gray-100 bg-gradient-to-br from-white to-slate-50 p-6 overflow-hidden">
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
          <line x1="18%" y1="38%" x2="47%" y2="50%" stroke={tone.management.line} strokeWidth="3"/>
          <line x1="18%" y1="67%" x2="47%" y2="55%" stroke={tone.storage.line} strokeWidth="3" strokeDasharray={8}/>
          <line x1="53%" y1="50%" x2="82%" y2="38%" stroke={tone.vmotion.line} strokeWidth="3" strokeDasharray={8}/>
          <line x1="53%" y1="55%" x2="82%" y2="67%" stroke={tone.vm.line} strokeWidth="3"/>
        </svg>

        <div className="relative grid grid-cols-1 xl:grid-cols-3 gap-6 items-center">
          <div className="space-y-5">
            <FabricBox
              role="management"
              title="Management"
              subtitle={hasManagement ? "Réseau identifié" : "Non clairement identifié"}
              healthy={hasManagement}
              detail={hasManagement ? "Flux d’administration détectés" : "À qualifier : iDRAC/iLO, ESXi mgmt, bastion"}
            />

            <FabricBox
              role="storage"
              title="Storage"
              subtitle={hasStorage ? "Réseau dédié détecté" : "Non détecté"}
              healthy={hasStorage}
              detail={hasStorage ? "Flux iSCSI/NFS/SAN identifiés" : "Risque : stockage potentiellement mutualisé"}
            />
          </div>

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

          <div className="space-y-5">
            <FabricBox
              role="vmotion"
              title="vMotion"
              subtitle={hasVmotion ? "Réseau dédié détecté" : "Non détecté"}
              healthy={hasVmotion}
              detail={hasVmotion ? "Isolation vMotion présente" : "Risque : migration à chaud non qualifiée"}
            />

            <FabricBox
              role="vm"
              title="VM Networks"
              subtitle={`${segments} segments applicatifs`}
              healthy={segments > 0}
              detail="Trafic applicatif / production"
            />
          </div>
        </div>

        <div className="relative mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-4">
          <div className="flex flex-wrap gap-5">
            <Legend color={tone.management.line} label="Management"/>
            <Legend color={tone.vmotion.line} label="vMotion absent" dashed/>
            <Legend color={tone.storage.line} label="Storage absent" dashed/>
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
