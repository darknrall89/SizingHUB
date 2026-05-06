import { Server, Network, Shield, Database, ArrowRight, AlertTriangle, CheckCircle } from "lucide-react";

const ROLE_STYLES = {
  management: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    icon: "text-emerald-500",
    line: "bg-emerald-400"
  },
  cluster: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    icon: "text-blue-500",
    line: "bg-blue-400"
  },
  vmotion: {
    bg: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-700",
    icon: "text-violet-500",
    line: "bg-violet-400"
  },
  storage: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    icon: "text-orange-500",
    line: "bg-orange-400"
  },
  vm: {
    bg: "bg-sky-50",
    border: "border-sky-200",
    text: "text-sky-700",
    icon: "text-sky-500",
    line: "bg-sky-400"
  }
};

function FabricNode({ title, subtitle, role="cluster", healthy=true, detail }) {
  const s = ROLE_STYLES[role] || ROLE_STYLES.cluster;

  const Icon =
    role === "management" ? Shield :
    role === "storage" ? Database :
    role === "cluster" ? Server :
    Network;

  return (
    <div className={`relative min-w-[190px] rounded-2xl border ${s.border} ${s.bg} p-4 shadow-sm`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl bg-white border ${s.border} flex items-center justify-center`}>
            <Icon size={20} className={s.icon}/>
          </div>

          <div>
            <div className={`text-sm font-semibold ${s.text}`}>{title}</div>
            <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>
          </div>
        </div>

        {healthy ? (
          <CheckCircle size={16} className="text-emerald-500 mt-1"/>
        ) : (
          <AlertTriangle size={16} className="text-red-500 mt-1"/>
        )}
      </div>

      {detail && (
        <div className="mt-4 rounded-xl bg-white/70 border border-white px-3 py-2 text-xs text-gray-500">
          {detail}
        </div>
      )}
    </div>
  );
}

function Flow({ role="cluster", muted=false }) {
  const s = ROLE_STYLES[role] || ROLE_STYLES.cluster;

  return (
    <div className="hidden xl:flex items-center justify-center w-20">
      <div className={`h-1 flex-1 rounded-full ${muted ? "bg-gray-200 border-t border-dashed border-gray-400" : s.line}`}/>
      <ArrowRight size={16} className={muted ? "text-gray-400 ml-1" : `${s.icon} ml-1`}/>
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <div className="text-lg font-semibold text-gray-800">Network Fabric</div>
          <div className="text-sm text-gray-400 mt-1">
            Vue logique des flux réseau détectés depuis RVTools
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-600">
            {hosts} hosts
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-600">
            {segments} segments
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-xs font-semibold text-emerald-600">
            {redundancyScore}% redondance
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto_1fr_auto_1fr] gap-4 items-stretch">
        <FabricNode
          role="management"
          title="Management"
          subtitle={hasManagement ? "Réseau identifié" : "Non clairement identifié"}
          healthy={hasManagement}
          detail={hasManagement ? "Flux d’administration détectés" : "À qualifier : iDRAC/iLO, ESXi mgmt, bastion"}
        />

        <Flow role="management" muted={!hasManagement}/>

        <FabricNode
          role="cluster"
          title="Cluster VMware"
          subtitle={`${hosts} hosts connectés`}
          healthy={hosts > 0}
          detail={`${portGroups} port groups logiques`}
        />

        <Flow role="vmotion" muted={!hasVmotion}/>

        <FabricNode
          role="vmotion"
          title="vMotion"
          subtitle={hasVmotion ? "Réseau dédié détecté" : "Non détecté"}
          healthy={hasVmotion}
          detail={hasVmotion ? "Isolation vMotion présente" : "Risque : migration à chaud non qualifiée"}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 xl:grid-cols-[1fr_auto_1fr_auto_1fr] gap-4 items-stretch">
        <FabricNode
          role="storage"
          title="Storage"
          subtitle={hasStorage ? "Réseau stockage détecté" : "Non détecté"}
          healthy={hasStorage}
          detail={hasStorage ? "Flux iSCSI/NFS/SAN identifiés" : "Risque : stockage potentiellement mutualisé"}
        />

        <Flow role="storage" muted={!hasStorage}/>

        <FabricNode
          role="vm"
          title="VM Networks"
          subtitle={`${segments} segments applicatifs`}
          healthy={segments > 0}
          detail="Trafic applicatif / production"
        />

        <Flow role="vm"/>

        <FabricNode
          role="cluster"
          title="Résilience"
          subtitle={`${redundancyScore}% hosts avec ≥ 2 NICs`}
          healthy={redundancyScore >= 80}
          detail={redundancyScore >= 80 ? "Redondance réseau cohérente" : "Redondance à vérifier"}
        />
      </div>
    </div>
  );
}
