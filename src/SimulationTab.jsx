import { useState, useMemo } from "react";
import {
  Cpu, Database, HardDrive, Info, Gauge, MemoryStick,
  Minus, Plus, Server, ShieldAlert, TrendingUp, Monitor,
  AlertTriangle, CheckCircle2, ShieldCheck, Shield,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, CartesianGrid,
  XAxis, YAxis, Tooltip, Legend, ReferenceLine,
} from "recharts";

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function cn(...classes) { return classes.filter(Boolean).join(" "); }
function round(v, d = 0) { return Number.isFinite(v) ? Number(v.toFixed(d)) : 0; }
function clamp(v, mn = 0, mx = 140) { return Math.max(mn, Math.min(mx, v)); }
function project(base, rate, year) { return Number((base * Math.pow(1 + rate / 100, year)).toFixed(1)); }

// ─── Logique N-1 ──────────────────────────────────────────────────────────────

function getResilience(maxN1) {
  if (maxN1 > 85) return { label: "Architecture non résiliente", color: "red",    badge: "border-red-200 bg-red-50 text-red-700" };
  if (maxN1 >= 70) return { label: "Résilience moyenne",          color: "orange", badge: "border-orange-200 bg-orange-50 text-orange-700" };
  return                  { label: "Architecture résiliente",      color: "green",  badge: "border-green-200 bg-green-50 text-green-700" };
}

function computeExistingN1(ex) {
  const cpuPerHost   = ex.totalCpuCores / ex.hosts;
  const cpuUsed      = ex.totalCpuCores * ex.avgCpuPct / 100;
  const cpuN1        = cpuUsed / Math.max(ex.totalCpuCores - cpuPerHost, 1) * 100;
  const ramPerHost   = ex.totalRamGb / ex.hosts;
  const ramUsed      = ex.totalRamGb * ex.avgRamPct / 100;
  const ramN1        = ramUsed / Math.max(ex.totalRamGb - ramPerHost, 1) * 100;
  return {
    normalCpu: round(ex.avgCpuPct), normalRam: round(ex.avgRamPct),
    n1Cpu: round(cpuN1), n1Ram: round(ramN1),
    deltaCpu: round(cpuN1 - ex.avgCpuPct), deltaRam: round(ramN1 - ex.avgRamPct),
    resilience: getResilience(Math.max(cpuN1, ramN1)),
  };
}

function computeTargetN1(ex, tgt) {
  const tCores     = tgt.nodes * tgt.sockets * tgt.coresPerSocket;
  const tRam       = tgt.nodes * tgt.ramPerNodeGb;
  const cpuUsed    = ex.totalCpuCores * ex.avgCpuPct / 100;
  const ramUsed    = ex.totalRamGb * ex.avgRamPct / 100;
  const normalCpu  = cpuUsed / Math.max(tCores, 1) * 100;
  const normalRam  = ramUsed / Math.max(tRam, 1) * 100;
  const n1Cpu      = cpuUsed / Math.max(tCores - tCores / tgt.nodes, 1) * 100;
  const n1Ram      = ramUsed / Math.max(tRam - tgt.ramPerNodeGb, 1) * 100;
  return {
    normalCpu: round(normalCpu), normalRam: round(normalRam),
    n1Cpu: round(n1Cpu), n1Ram: round(n1Ram),
    deltaCpu: round(n1Cpu - normalCpu), deltaRam: round(n1Ram - normalRam),
    resilience: getResilience(Math.max(n1Cpu, n1Ram)),
  };
}

// ─── Sous-composants UI ───────────────────────────────────────────────────────

function SectionNumber({ n }) {
  return (
    <div className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
      {n}
    </div>
  );
}

function TogglePill({ selected, onClick, children }) {
  return (
    <button type="button" onClick={onClick}
      className={cn("h-11 flex-1 rounded-lg px-4 text-sm font-bold transition",
        selected ? "bg-blue-600 text-white shadow-sm" : "bg-white text-slate-600 hover:bg-slate-50"
      )}>
      {children}
    </button>
  );
}

function SelectInput({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500">
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function NumberStepper({ value, onChange, min = 1, max = 64 }) {
  return (
    <div className="flex h-11 overflow-hidden rounded-lg border border-slate-300 bg-white">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))}
        className="flex w-12 items-center justify-center border-r border-slate-300 text-slate-700 hover:bg-slate-50">
        <Minus className="h-4 w-4" />
      </button>
      <div className="flex flex-1 items-center justify-center text-xl font-bold text-slate-900">{value}</div>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))}
        className="flex w-12 items-center justify-center border-l border-slate-300 text-slate-700 hover:bg-slate-50">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function MetricTile({ icon: Icon, value, unit, label, sublabel }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
      <Icon className="mb-2 h-8 w-8 text-blue-600" />
      <div className="flex items-end gap-1">
        <span className="text-2xl font-bold text-slate-900">{value}</span>
        {unit && <span className="mb-0.5 text-xs font-bold text-slate-600">{unit}</span>}
      </div>
      <p className="mt-1 text-xs font-medium text-slate-600">{label}</p>
      {sublabel && <p className="mt-0.5 text-xs font-bold text-orange-600">{sublabel}</p>}
    </div>
  );
}

function KpiTile({ icon: Icon, label, value, unit, color = "blue" }) {
  const colors = {
    blue:   "text-blue-600",
    green:  "text-green-600",
    orange: "text-orange-500",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
      <Icon className={cn("mx-auto mb-2 h-6 w-6", colors[color])} />
      <p className="text-xs font-semibold text-slate-700 leading-tight min-h-[2rem]">{label}</p>
      <div className={cn("mt-2 text-2xl font-bold", colors[color])}>{value}</div>
      {unit && <p className="text-xs text-slate-500">{unit}</p>}
    </div>
  );
}

function DoubleBar({ label, normal, n1, normalColor, n1Color }) {
  return (
    <div className="mb-4">
      <div className="mb-1 text-sm font-bold text-slate-800">{label}</div>
      <div className="relative h-6">
        <div className="absolute inset-0 rounded-full bg-slate-200" />
        <div className={cn("absolute left-0 top-0 h-full rounded-full", normalColor)}
          style={{ width: `${Math.min(normal, 100)}%` }} />
        <div className={cn("absolute left-0 top-0 h-full rounded-full border-2", n1Color)}
          style={{ width: `${Math.min(n1, 100)}%`, background: "transparent" }} />
        <span className="absolute right-2 top-0.5 text-xs font-bold text-slate-700">
          {normal}% → {n1}%
        </span>
      </div>
    </div>
  );
}

// ─── Tooltip Recharts ─────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
      <div className="mb-2 text-sm font-semibold text-slate-900">{label}</div>
      <div className="space-y-1 text-sm">
        {payload.map(e => (
          <div key={e.dataKey} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: e.color }} />
              <span className="text-slate-600">{e.name}</span>
            </div>
            <span className="font-medium">{e.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Badges saturation ────────────────────────────────────────────────────────

function SatBadge({ title, icon: Icon, year, horizon }) {
  const urgent  = year && year <= 2;
  const inRange = year && year <= horizon;
  const style   = urgent  ? "border-red-200 bg-red-50 text-red-700"    :
                  inRange ? "border-amber-200 bg-amber-50 text-amber-700" :
                            "border-green-200 bg-green-50 text-green-700";
  const dot     = urgent ? "bg-red-500" : inRange ? "bg-amber-500" : "bg-green-500";
  const main    = year ? `Saturation prévue en année ${year}` : `Aucune saturation sur ${horizon} ans`;
  const sub     = urgent ? "⚠ Extension urgente recommandée" : inRange ? "Capacité à surveiller" : "Confortable sur l'horizon";
  return (
    <div className={cn("rounded-2xl border p-4", style)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
            <Icon className="h-4 w-4" /><span>{title}</span>
          </div>
          <div className="text-base font-bold">{main}</div>
          <div className="mt-1 text-xs opacity-80">{sub}</div>
        </div>
        <span className={cn("mt-1 h-3 w-3 rounded-full", dot)} />
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function SimulationTab({ clusterData = {} }) {

  // Données RVTools existantes
  const ex = useMemo(() => ({
    hosts:         clusterData.hosts?.length        || 6,
    totalCpuCores: clusterData.totalCpuCores        || 144,
    avgCpuPct:     clusterData.avgCpuPct            || 38,
    totalRamGb:    clusterData.totalRamGb           || 4608,
    avgRamPct:     clusterData.avgRamPct            || 52,
    storageTotalTb: clusterData.storageTotalTb      || 130,
    storagePct:    clusterData.storagePct           || 62,
    vmsCount:      clusterData.activeVms            || 136,
  }), [clusterData]);

  // État de saisie
  const [base,           setBase]           = useState("real");
  const [nodes,          setNodes]          = useState(ex.hosts);
  const [sockets,        setSockets]        = useState(2);
  const [coresPerSocket, setCoresPerSocket] = useState(16);
  const [ramPerNodeGb,   setRamPerNodeGb]   = useState(256);
  const [storageTb,      setStorageTb]      = useState(ex.storageTotalTb);
  const [hypervisor,     setHypervisor]     = useState("XCP-ng");
  const [growthRate,     setGrowthRate]     = useState(5);
  const [horizon,        setHorizon]        = useState(3);
  const [activeView,     setActiveView]     = useState("setup"); // setup | n1 | lifecycle

  // Architecture cible
  const tgt = useMemo(() => ({
    nodes, sockets, coresPerSocket, ramPerNodeGb,
    storageTotalTb: storageTb, hypervisor,
  }), [nodes, sockets, coresPerSocket, ramPerNodeGb, storageTb, hypervisor]);

  // Calculs KPIs
  const calc = useMemo(() => {
    const mult    = base === "allocated" ? 2.5 : 1;
    const growth  = Math.pow(1 + growthRate / 100, horizon);
    const tCores  = nodes * sockets * coresPerSocket;
    const tRam    = nodes * ramPerNodeGb;
    const cpuUsed = ex.totalCpuCores * ex.avgCpuPct / 100 * mult * growth;
    const ramUsed = ex.totalRamGb    * ex.avgRamPct  / 100 * mult * growth;
    const cpuR    = cpuUsed / Math.max(tCores, 1) * 100;
    const ramR    = ramUsed / Math.max(tRam, 1)   * 100;
    const cpuN1   = cpuUsed / Math.max(tCores - tCores / nodes, 1) * 100;
    const ramN1   = ramUsed / Math.max(tRam   - ramPerNodeGb,   1) * 100;
    const maxN1   = Math.max(cpuN1, ramN1);
    const status  = maxN1 > 90 ? { label: "Architecture non résiliente", color: "red" }
                  : maxN1 > 80 ? { label: "Risque en cas de panne",       color: "orange" }
                  :              { label: "Architecture résiliente",       color: "green" };
    return {
      tCores, tRam,
      cpuRatio:    round(cpuR),
      ramRatio:    round(ramR),
      cpuHeadroom: round(100 - cpuR),
      ramHeadroom: round(100 - ramR),
      cpuN1: round(cpuN1), ramN1: round(ramN1), status,
    };
  }, [base, nodes, sockets, coresPerSocket, ramPerNodeGb, growthRate, horizon, ex]);

  // N-1
  const exN1  = useMemo(() => computeExistingN1(ex), [ex]);
  const tgtN1 = useMemo(() => computeTargetN1(ex, tgt), [ex, tgt]);
  const improvement = useMemo(() => {
    const eW = Math.max(exN1.n1Cpu, exN1.n1Ram);
    const tW = Math.max(tgtN1.n1Cpu, tgtN1.n1Ram);
    return round(eW - tW);
  }, [exN1, tgtN1]);

  // Projection cycle de vie
  const projRows = useMemo(() => {
    return Array.from({ length: horizon }, (_, i) => {
      const y   = i + 1;
      const cpu = clamp(project(ex.avgCpuPct,   growthRate, y), 0, 120);
      const ram = clamp(project(ex.avgRamPct,    growthRate, y), 0, 120);
      const sto = clamp(project(ex.storagePct,   growthRate, y), 0, 120);
      const cpuN1p = clamp(project(tgtN1.n1Cpu, growthRate, y), 0, 140);
      const ramN1p = clamp(project(tgtN1.n1Ram, growthRate, y), 0, 140);
      const maxP   = Math.max(cpu, ram, sto);
      const status = maxP > 80 ? "🔴 Critique" : maxP > 65 ? "⚠ Surveillance" : "✅ Confortable";
      const stClass= maxP > 80 ? "bg-red-50 text-red-700 border-red-200"
                   : maxP > 65 ? "bg-amber-50 text-amber-700 border-amber-200"
                   :             "bg-green-50 text-green-700 border-green-200";
      return { year: y, label: `An ${y}`, cpuPct: cpu, ramPct: ram, storagePct: sto, cpuN1: cpuN1p, ramN1: ramN1p, status, stClass };
    });
  }, [ex, tgtN1, growthRate, horizon]);

  const satCpu = projRows.find(r => r.cpuPct > 80)?.year || null;
  const satRam = projRows.find(r => r.ramPct > 80)?.year || null;
  const satSto = projRows.find(r => r.storagePct > 80)?.year || null;
  const earliest = [satCpu, satRam, satSto].filter(Boolean);
  const firstSat = earliest.length ? Math.min(...earliest) : null;
  const reco = firstSat
    ? `Votre infrastructure cible couvre vos besoins jusqu'en année ${Math.max(1, firstSat - 1)}. Extension recommandée avant l'année ${firstSat}. Taux de croissance : ${growthRate}%/an.`
    : `Votre infrastructure cible couvre vos besoins sur l'horizon ${horizon} ans. Taux de croissance appliqué : ${growthRate}%/an sur la consommation réelle RVTools.`;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* Tabs internes */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {[
          { id: "setup",     label: "⚙ Configuration" },
          { id: "n1",        label: "🛡 Simulation N-1" },
          { id: "lifecycle", label: "📈 Cycle de vie" },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveView(t.id)}
            className={cn("px-4 py-2 text-sm font-semibold border-b-2 transition",
              activeView === t.id
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── VUE CONFIGURATION ─────────────────────────────────────────────── */}
      {activeView === "setup" && (
        <div className="space-y-4">

          {/* Ligne 1 : Base de calcul + Infrastructure actuelle */}
          <div className="grid gap-4 lg:grid-cols-[380px_1fr]">

            {/* Base de calcul */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center">
                <SectionNumber n="1" />
                <h2 className="text-base font-bold">Base de calcul</h2>
              </div>
              <div className="flex rounded-xl border border-slate-300 bg-slate-50 p-1">
                <TogglePill selected={base === "real"}      onClick={() => setBase("real")}>Consommation réelle</TogglePill>
                <TogglePill selected={base === "allocated"} onClick={() => setBase("allocated")}>Allocation provisionnée</TogglePill>
              </div>
              <div className="mt-4 flex gap-2 text-xs text-slate-500">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                <p>La consommation réelle reflète l'usage effectif. L'allocation provisionnée inclut les ressources réservées non utilisées (souvent 2–3×).</p>
              </div>
            </div>

            {/* Infrastructure actuelle */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center">
                <SectionNumber n="2" />
                <h2 className="text-base font-bold">Infrastructure actuelle <span className="text-sm font-normal text-slate-400">(données RVTools)</span></h2>
              </div>
              <div className="grid grid-cols-7 gap-2">
                <MetricTile icon={Server}     value={ex.hosts}                                      label="Hôtes" />
                <MetricTile icon={Cpu}        value={ex.totalCpuCores}                              label="Cœurs CPU totaux" />
                <MetricTile icon={Gauge}      value={ex.avgCpuPct}      unit="%"                    label="CPU moyen" />
                <MetricTile icon={MemoryStick}value={ex.totalRamGb.toLocaleString("fr-FR")} unit="GB" label="RAM totale" />
                <MetricTile icon={Gauge}      value={ex.avgRamPct}      unit="%"                    label="RAM moyenne" />
                <MetricTile icon={Database}   value={ex.storageTotalTb} unit="To"                  label="Stockage total" sublabel={`${ex.storagePct}% utilisé`} />
                <MetricTile icon={Monitor}    value={ex.vmsCount}                                   label="VMs actives" />
              </div>
            </div>
          </div>

          {/* Architecture cible */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center">
              <SectionNumber n="3" />
              <h2 className="text-base font-bold">Architecture cible</h2>
            </div>
            <div className="grid grid-cols-3 gap-4 lg:grid-cols-6">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Nombre de nœuds</label>
                <NumberStepper value={nodes} onChange={setNodes} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Sockets / nœud</label>
                <SelectInput value={sockets} onChange={v => setSockets(Number(v))}
                  options={[{value:1,label:"1 socket"},{value:2,label:"2 sockets"}]} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Cœurs / socket</label>
                <SelectInput value={coresPerSocket} onChange={v => setCoresPerSocket(Number(v))}
                  options={[8,12,16,24,32,48].map(v => ({value:v, label:`${v} cœurs`}))} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">RAM / nœud</label>
                <SelectInput value={ramPerNodeGb} onChange={v => setRamPerNodeGb(Number(v))}
                  options={[128,256,384,512,768,1024].map(v => ({value:v, label:`${v} GB`}))} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Stockage global (To)</label>
                <input type="number" value={storageTb} onChange={e => setStorageTb(Number(e.target.value))}
                  className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-semibold outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Hyperviseur cible</label>
                <SelectInput value={hypervisor} onChange={setHypervisor}
                  options={["VMware","Proxmox","XCP-ng","Hyper-V"].map(v => ({value:v,label:v}))} />
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  Taux de croissance annuel <Info className="h-4 w-4 text-blue-500" />
                </div>
                <input type="range" min="1" max="20" value={growthRate}
                  onChange={e => setGrowthRate(Number(e.target.value))}
                  className="w-full accent-blue-600" />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>1%</span>
                  <span className="text-lg font-bold text-blue-700">{growthRate}%</span>
                  <span>20%</span>
                </div>
              </div>
              <div>
                <div className="mb-2 text-sm font-semibold text-slate-700">Horizon de projection</div>
                <div className="flex overflow-hidden rounded-lg border border-slate-300">
                  {[3, 5, 7].map(y => (
                    <button key={y} type="button" onClick={() => setHorizon(y)}
                      className={cn("flex-1 h-11 text-sm font-semibold border-r last:border-r-0 border-slate-300 transition",
                        horizon === y ? "bg-blue-600 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
                      )}>{y} ans</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* KPIs calculés */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center">
              <SectionNumber n="4" />
              <h2 className="text-base font-bold">KPIs calculés automatiquement <span className="text-sm font-normal text-slate-400">(temps réel)</span></h2>
            </div>
            <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
              <div className="rounded-2xl bg-blue-50/60 p-3">
                <div className="mb-2 text-center text-sm font-bold text-blue-800">Capacités & ratios</div>
                <div className="grid grid-cols-3 gap-2 lg:grid-cols-6">
                  <KpiTile icon={Cpu}         label="Capacité CPU cible"       value={calc.tCores}        unit="cœurs" color="blue" />
                  <KpiTile icon={MemoryStick} label="Capacité RAM cible"       value={calc.tRam.toLocaleString("fr-FR")} unit="GB" color="blue" />
                  <KpiTile icon={Gauge}       label="Ratio CPU actuel vs cible" value={calc.cpuRatio}      unit="%" color="blue" />
                  <KpiTile icon={Gauge}       label="Ratio RAM actuel vs cible" value={calc.ramRatio}      unit="%" color="blue" />
                  <KpiTile icon={TrendingUp}  label="Headroom CPU disponible"  value={calc.cpuHeadroom}   unit="%" color="green" />
                  <KpiTile icon={MemoryStick} label="Headroom RAM disponible"  value={calc.ramHeadroom}   unit="%" color="green" />
                </div>
                <div className="mt-2 flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-800">
                  <Info className="h-4 w-4 shrink-0" />
                  Ratios calculés sur la base : consommation réelle avec croissance projetée sur {horizon} ans ({growthRate}%/an).
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl bg-orange-50/60 p-3">
                  <div className="mb-2 text-center text-sm font-bold text-orange-800">Simulation N-1 (perte d'un nœud)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <KpiTile icon={Cpu}         label="CPU utilisé en N-1" value={calc.cpuN1} unit="%" color="orange" />
                    <KpiTile icon={MemoryStick} label="RAM utilisée en N-1" value={calc.ramN1} unit="%" color="orange" />
                  </div>
                </div>
                <div className={cn("rounded-2xl border p-3",
                  calc.status.color === "red"    ? "border-red-200 bg-red-50"    :
                  calc.status.color === "orange" ? "border-orange-200 bg-orange-50" :
                  "border-green-200 bg-green-50")}>
                  <div className="flex items-center gap-3">
                    <ShieldAlert className={cn("h-8 w-8",
                      calc.status.color === "red"    ? "text-red-600" :
                      calc.status.color === "orange" ? "text-orange-600" : "text-green-600")} />
                    <div>
                      <p className="text-xs font-semibold text-slate-600">Évaluation N-1</p>
                      <p className={cn("text-sm font-bold",
                        calc.status.color === "red"    ? "text-red-700" :
                        calc.status.color === "orange" ? "text-orange-700" : "text-green-700")}>
                        {calc.status.label}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-blue-50 px-5 py-3 text-blue-900">
            <Info className="h-5 w-5 shrink-0 text-blue-600" />
            <p className="text-sm"><strong>À retenir :</strong> Cette simulation vous aide à dimensionner votre architecture cible en tenant compte de l'utilisation réelle, de la croissance projetée et de la résilience N-1.</p>
          </div>
        </div>
      )}

      {/* ── VUE N-1 ──────────────────────────────────────────────────────────── */}
      {activeView === "n1" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Simulation — Perte d'un nœud (N-1)</h2>
            <p className="text-sm text-slate-500">Impact sur CPU et RAM en cas de panne d'un hôte</p>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {/* Existant */}
            {[
              { label: "Infrastructure actuelle", sub: `${ex.hosts} hôtes`, metrics: exN1, note: "En cas de perte d'un hôte, la charge devient élevée mais reste exploitable.", isTarget: false },
              { label: "Architecture cible",      sub: `${hypervisor} · ${nodes} nœuds`, metrics: tgtN1, note: "La cible absorbe la panne d'un nœud avec la marge configurée.", isTarget: true },
            ].map((col) => (
              <div key={col.label} className={cn("rounded-2xl border p-5 shadow-sm",
                col.isTarget ? "border-blue-200 bg-blue-50/30" : "border-slate-200 bg-white")}>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-base font-bold text-slate-900">{col.label}</div>
                    <div className="text-xs text-slate-500">{col.sub} · VMs : {ex.vmsCount}</div>
                  </div>
                  <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", col.metrics.resilience.badge)}>
                    {col.metrics.resilience.label}
                  </span>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div>
                    <div className="mb-2 text-sm font-semibold text-slate-700">Mode normal</div>
                    {[["CPU", col.metrics.normalCpu, "text-blue-700"], ["RAM", col.metrics.normalRam, "text-violet-700"]].map(([name, val, cls]) => (
                      <div key={name} className="flex items-center justify-between py-1.5">
                        <span className="text-sm text-slate-600">{name}</span>
                        <span className={cn("text-lg font-bold", cls)}>{val}%</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="mb-2 text-sm font-semibold text-slate-700">Mode N-1</div>
                    {[["CPU", col.metrics.n1Cpu, col.metrics.deltaCpu], ["RAM", col.metrics.n1Ram, col.metrics.deltaRam]].map(([name, val, delta]) => (
                      <div key={name} className="flex items-center justify-between py-1.5">
                        <span className="text-sm text-slate-600">{name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-orange-600">{val}%</span>
                          <span className="rounded border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-xs font-semibold text-orange-600">+{delta} pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <DoubleBar label="CPU" normal={col.metrics.normalCpu} n1={col.metrics.n1Cpu} normalColor="bg-blue-600" n1Color="border-orange-500" />
                  <DoubleBar label="RAM" normal={col.metrics.normalRam} n1={col.metrics.n1Ram} normalColor="bg-violet-600" n1Color="border-orange-500" />
                  <div className="flex gap-4 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded-full bg-blue-600" /> Normal</span>
                    <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded border-2 border-orange-500 bg-transparent" /> N-1</span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500">{col.note}</p>
              </div>
            ))}
          </div>

          {/* Synthèse */}
          <div className={cn("flex items-center gap-5 rounded-2xl border p-5",
            improvement > 0 ? "border-green-200 bg-green-50 text-green-900" : "border-orange-200 bg-orange-50 text-orange-900")}>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/70">
              {improvement > 0
                ? <TrendingUp className="h-8 w-8 text-green-700" />
                : <AlertTriangle className="h-8 w-8 text-orange-600" />}
            </div>
            <div>
              <p className="text-base font-bold">
                {improvement > 0
                  ? `L'architecture cible améliore la résilience de ${improvement} points vs l'existant`
                  : "⚠ L'architecture cible est moins résiliente que l'existante"}
              </p>
              <p className="mt-1 text-sm opacity-80">
                {improvement > 0
                  ? "Après perte d'un nœud, la charge CPU et RAM reste plus basse sur la cible, réduisant le risque opérationnel."
                  : "Augmentez le nombre de nœuds, de cœurs ou de RAM pour améliorer la résilience."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── VUE CYCLE DE VIE ──────────────────────────────────────────────── */}
      {activeView === "lifecycle" && (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Projection du cycle de vie</h2>
              <p className="text-sm text-slate-500">Évolution sur {horizon} ans · croissance {growthRate}%/an</p>
            </div>
            <div className="flex gap-3">
              {[
                { label: `${nodes * sockets * coresPerSocket} cœurs`, sub: "CPU cible" },
                { label: `${(nodes * ramPerNodeGb).toLocaleString("fr-FR")} GB`, sub: "RAM cible" },
                { label: `${storageTb} To`, sub: "Stockage cible" },
              ].map(k => (
                <div key={k.sub} className="rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm text-center">
                  <div className="text-xs text-slate-500">{k.sub}</div>
                  <div className="text-base font-bold text-slate-900">{k.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Badges saturation */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <SatBadge title="CPU"      icon={Cpu}       year={satCpu} horizon={horizon} />
            <SatBadge title="RAM"      icon={MemoryStick} year={satRam} horizon={horizon} />
            <SatBadge title="Stockage" icon={HardDrive}  year={satSto} horizon={horizon} />
          </div>

          {/* Graphique */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-1 text-sm font-semibold text-slate-900">Projection graphique des ressources</h3>
            <p className="mb-4 text-xs text-slate-500">Seuil de saturation à 80%</p>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={projRows} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <ReferenceLine y={80} stroke="#EF4444" strokeDasharray="6 6"
                    label={{ value: "Seuil 80%", position: "insideTopRight", fill: "#EF4444", fontSize: 11 }} />
                  <Line type="monotone" dataKey="cpuPct"     name="CPU"      stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="ramPct"     name="RAM"      stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="storagePct" name="Stockage" stroke="#14B8A6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="cpuN1"  name="CPU N-1"  stroke="#F97316" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                  <Line type="monotone" dataKey="ramN1"  name="RAM N-1"  stroke="#FB923C" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tableau */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">Détail année par année</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    {["Année","CPU","RAM","Stockage","Statut"].map(h => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Ligne actuelle */}
                  <tr className="border-t border-slate-100 bg-white">
                    <td className="px-4 py-3 font-medium text-slate-900">Actuel (An 0)</td>
                    <td className="px-4 py-3 text-slate-700">{ex.avgCpuPct}%<div className="text-xs italic text-slate-400">N-1 : {exN1.n1Cpu}%</div></td>
                    <td className="px-4 py-3 text-slate-700">{ex.avgRamPct}%<div className="text-xs italic text-slate-400">N-1 : {exN1.n1Ram}%</div></td>
                    <td className="px-4 py-3 text-slate-700">{ex.storagePct}%</td>
                    <td className="px-4 py-3"><span className="inline-flex rounded-full border px-3 py-1 text-xs font-medium bg-green-50 text-green-700 border-green-200">✅ Confortable</span></td>
                  </tr>
                  {projRows.map(row => (
                    <tr key={row.year} className={cn("border-t border-slate-100",
                      row.cpuPct > 80 || row.ramPct > 80 || row.storagePct > 80 ? "bg-amber-50/60" : "bg-white")}>
                      <td className="px-4 py-3 font-medium text-slate-900">{row.label}</td>
                      <td className="px-4 py-3 text-slate-700">{row.cpuPct}%<div className="text-xs italic text-slate-400">N-1 : {row.cpuN1}%</div></td>
                      <td className="px-4 py-3 text-slate-700">{row.ramPct}%<div className="text-xs italic text-slate-400">N-1 : {row.ramN1}%</div></td>
                      <td className="px-4 py-3 text-slate-700">{row.storagePct}%</td>
                      <td className="px-4 py-3"><span className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-medium", row.stClass)}>{row.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recommandation */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Recommandation finale</div>
            <p className="text-sm leading-6 text-slate-700">{reco}</p>
          </div>
        </div>
      )}
    </div>
  );
}
