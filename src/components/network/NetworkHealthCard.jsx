import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info
} from "lucide-react";

function ScoreRing({ score }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * score) / 100;

  const color =
    score >= 85
      ? "#22c55e"
      : score >= 70
      ? "#f59e0b"
      : "#ef4444";

  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      <svg className="w-40 h-40 -rotate-90">
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke="#e5e7eb"
          strokeWidth="10"
          fill="none"
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-5xl font-bold text-gray-900">{score}</div>
        <div className="text-sm text-gray-400 font-medium">/100</div>
      </div>
    </div>
  );
}

function Finding({ severity, text }) {
  const styles = {
    ok: {
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100"
    },
    warning: {
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100"
    },
    critical: {
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-100"
    },
    info: {
      icon: Info,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100"
    }
  };

  const s = styles[severity] || styles.info;
  const Icon = s.icon;

  return (
    <div className={`rounded-xl border px-4 py-3 ${s.bg} ${s.border}`}>
      <div className="flex items-start gap-3">
        <Icon size={18} className={s.color}/>
        <div className={`text-sm font-medium ${s.color}`}>
          {text}
        </div>
      </div>
    </div>
  );
}

export default function NetworkHealthCard({
  score=0,
  hasVmotion=false,
  hasStorage=false,
  hasManagement=false,
  redundancyScore=0
}) {

  const findings = [];

  if (hasManagement) {
    findings.push({
      severity: "ok",
      text: "Réseau d’administration détecté"
    });
  } else {
    findings.push({
      severity: "warning",
      text: "Aucun réseau Management clairement identifié"
    });
  }

  if (!hasVmotion) {
    findings.push({
      severity: "warning",
      text: "Aucun réseau vMotion dédié détecté"
    });
  }

  if (!hasStorage) {
    findings.push({
      severity: "critical",
      text: "Aucun réseau stockage dédié détecté"
    });
  }

  if (redundancyScore >= 80) {
    findings.push({
      severity: "ok",
      text: "Bonne redondance réseau des hosts"
    });
  }

  const status =
    score >= 85
      ? "Architecture réseau robuste"
      : score >= 70
      ? "Architecture cohérente"
      : "Architecture à risque";

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
          <ShieldCheck size={22} className="text-blue-600"/>
        </div>

        <div>
          <div className="text-lg font-semibold text-gray-900">
            Network Health
          </div>

          <div className="text-sm text-gray-400">
            Analyse cohérence & résilience réseau
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[220px_1fr] gap-8 items-center">
        <div className="flex flex-col items-center">
          <ScoreRing score={score} />

          <div className="mt-4 text-center">
            <div className="text-lg font-semibold text-gray-800">
              {status}
            </div>

            <div className="text-sm text-gray-400 mt-1">
              Basé sur segmentation, isolation et redondance
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {findings.map((f, idx) => (
            <Finding
              key={idx}
              severity={f.severity}
              text={f.text}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
