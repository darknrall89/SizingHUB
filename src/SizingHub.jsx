import { useState, useMemo } from "react";
import {
  Server, HardDrive, Cloud, Users, Sun, Moon,
  CheckCircle, AlertTriangle, Info, ChevronRight,
  Cpu, Database, BarChart2, Settings
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n, dec = 0) =>
  Number.isFinite(n) ? n.toLocaleString("fr-FR", { maximumFractionDigits: dec }) : "—";

const Badge = ({ ok, children }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
    ${ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
    {ok ? <CheckCircle size={11} /> : <AlertTriangle size={11} />}
    {children}
  </span>
);

const Card = ({ title, icon: Icon, children, dark }) => (
  <div className={`rounded-2xl border p-5 shadow-sm
    ${dark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
    {title && (
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon size={16} className="text-indigo-500" />}
        <h3 className={`font-semibold text-sm ${dark ? "text-slate-200" : "text-slate-700"}`}>
          {title}
        </h3>
      </div>
    )}
    {children}
  </div>
);

const Input = ({ label, value, onChange, min, max, step = 1, unit, dark, note }) => (
  <div className="flex flex-col gap-1">
    <label className={`text-xs font-medium ${dark ? "text-slate-400" : "text-slate-500"}`}>
      {label}
    </label>
    <div className="flex items-center gap-2">
      <input
        type="number" value={value} min={min} max={max} step={step}
        onChange={e => onChange(Number(e.target.value))}
        className={`w-full rounded-lg border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400
          ${dark
            ? "bg-slate-700 border-slate-600 text-indigo-300"
            : "bg-indigo-50 border-indigo-200 text-indigo-700"}`}
      />
      {unit && <span className={`text-xs whitespace-nowrap ${dark ? "text-slate-400" : "text-slate-400"}`}>{unit}</span>}
    </div>
    {note && <p className={`text-xs italic ${dark ? "text-slate-500" : "text-slate-400"}`}>{note}</p>}
  </div>
);

const Select = ({ label, value, onChange, options, dark }) => (
  <div className="flex flex-col gap-1">
    <label className={`text-xs font-medium ${dark ? "text-slate-400" : "text-slate-500"}`}>{label}</label>
    <select
      value={value} onChange={e => onChange(e.target.value)}
      className={`rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400
        ${dark ? "bg-slate-700 border-slate-600 text-indigo-300" : "bg-indigo-50 border-indigo-200 text-indigo-700"}`}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const ResultRow = ({ label, value, unit, highlight, dark, ok }) => (
  <div className={`flex items-center justify-between py-2 px-3 rounded-lg
    ${highlight
      ? dark ? "bg-indigo-900/40 border border-indigo-600" : "bg-indigo-50 border border-indigo-200"
      : dark ? "bg-slate-700/40" : "bg-slate-50"}`}>
    <span className={`text-sm ${dark ? "text-slate-300" : "text-slate-600"}`}>{label}</span>
    <div className="flex items-center gap-2">
      <span className={`text-sm font-bold font-mono
        ${highlight
          ? dark ? "text-indigo-300" : "text-indigo-700"
          : dark ? "text-slate-200" : "text-slate-800"}`}>
        {value}
      </span>
      {unit && <span className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>{unit}</span>}
      {ok !== undefined && <Badge ok={ok}>{ok ? "OK" : "Attention"}</Badge>}
    </div>
  </div>
);

const SectionTitle = ({ children, dark }) => (
  <h2 className={`text-lg font-bold mb-4 ${dark ? "text-white" : "text-slate-800"}`}>{children}</h2>
);

// ─── 1. VMware Calculator ─────────────────────────────────────────────────────
function VMwareCalc({ dark }) {
  const [nodes, setNodes] = useState(6);
  const [sockets, setSockets] = useState(1);
  const [cores, setCores] = useState(32);
  const [ram, setRam] = useState(768);
  const [overcommit, setOvercommit] = useState(3.75);
  const MIN_CORES = 16;

  const r = useMemo(() => {
    const totalSockets = nodes * sockets;
    const totalPhysicalCores = totalSockets * cores;
    const billedCoresPerSocket = Math.max(cores, MIN_CORES);
    const totalBilledCores = totalSockets * billedCoresPerSocket;
    const totalRamGo = nodes * ram;
    const totalRamTo = totalRamGo / 1024;
    const vcpuTotal = totalPhysicalCores * overcommit;
    const haRam = (nodes - 1) * ram / 1024;
    const haCores = (nodes - 1) * sockets * cores;
    const haVcpu = haCores * overcommit;
    const haRamOk = haRam >= 4.5;
    const haVcpuOk = haVcpu >= 750;
    const haPct = nodes > 0 ? (1 / nodes) * 100 : 0;
    return {
      totalSockets, totalPhysicalCores, billedCoresPerSocket,
      totalBilledCores, totalRamGo, totalRamTo, vcpuTotal,
      haRam, haCores, haVcpu, haRamOk, haVcpuOk, haPct
    };
  }, [nodes, sockets, cores, ram, overcommit]);

  const chartData = [
    { name: "Normal", RAM: r.totalRamTo, vCPU: r.vcpuTotal / 100 },
    { name: "HA (N-1)", RAM: r.haRam, vCPU: r.haVcpu / 100 },
    { name: "Cible CDC", RAM: 4.5, vCPU: 7.5 },
  ];

  return (
    <div className="space-y-5">
      <SectionTitle dark={dark}>🖥 Licences VMware — Broadcom VVF/VCF</SectionTitle>
      <div className={`flex items-start gap-2 p-3 rounded-xl text-xs
        ${dark ? "bg-blue-900/30 text-blue-300 border border-blue-700" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
        <Info size={14} className="mt-0.5 shrink-0" />
        Modèle Broadcom (2024+) : facturation par cœur physique, minimum 16 cœurs par socket.
        Les cœurs en dessous du seuil sont automatiquement arrondis à 16.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Paramètres Infrastructure" icon={Server} dark={dark}>
          <div className="space-y-3">
            <Input label="Nombre de nœuds" value={nodes} onChange={setNodes} min={1} max={32} unit="serveurs" dark={dark} />
            <Input label="Sockets par nœud" value={sockets} onChange={setSockets} min={1} max={4} unit="sockets" dark={dark} note="1 = mono-proc | 2 = bi-proc" />
            <Input label="Cœurs par socket" value={cores} onChange={setCores} min={4} max={128} step={2} unit="cœurs" dark={dark} note="Modèle Xeon : 16, 24, 32, 36, 48..." />
            <Input label="RAM par nœud" value={ram} onChange={setRam} min={64} max={6144} step={64} unit="Go" dark={dark} />
            <Input label="Overcommit vCPU" value={overcommit} onChange={setOvercommit} min={1} max={10} step={0.25} unit="vCPU/cœur" dark={dark} note="CDC CESI : 3,75 recommandé" />
          </div>
        </Card>

        <Card title="Résultats Licences" icon={Cpu} dark={dark}>
          <div className="space-y-2">
            <ResultRow label="Total sockets" value={fmt(r.totalSockets)} unit="sockets" dark={dark} />
            <ResultRow label="Cœurs physiques" value={fmt(r.totalPhysicalCores)} unit="cœurs" dark={dark} />
            <ResultRow label="Min. Broadcom/socket" value={fmt(r.billedCoresPerSocket)} unit="cœurs" dark={dark} />
            <ResultRow label="⭐ Cœurs facturés VMware" value={fmt(r.totalBilledCores)} unit="cœurs" highlight dark={dark} />
            <div className={`mt-3 pt-3 border-t ${dark ? "border-slate-700" : "border-slate-100"}`}>
              <ResultRow label="RAM totale" value={fmt(r.totalRamTo, 2)} unit="To" dark={dark} />
              <ResultRow label="vCPU cluster" value={fmt(r.vcpuTotal)} unit="vCPU" dark={dark} />
            </div>
          </div>
        </Card>

        <Card title="Analyse HA (N+1)" icon={Settings} dark={dark}>
          <div className="space-y-2">
            <ResultRow label="Hosts disponibles" value={fmt(nodes - 1)} unit="hosts" dark={dark} ok={nodes - 1 >= 1} />
            <ResultRow label="RAM disponible" value={fmt(r.haRam, 2)} unit="To" dark={dark} ok={r.haRamOk} />
            <ResultRow label="Cœurs disponibles" value={fmt(r.haCores)} unit="cœurs" dark={dark} ok={r.haCores >= 100} />
            <ResultRow label="vCPU disponibles" value={fmt(r.haVcpu)} unit="vCPU" dark={dark} ok={r.haVcpuOk} />
            <ResultRow label="Capacité perdue" value={`${fmt(r.haPct, 1)} %`} dark={dark} ok={r.haPct <= 20} />
          </div>
          <div className={`mt-3 p-2 rounded-lg text-xs italic
            ${dark ? "bg-slate-700 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
            Cibles CDC : RAM ≥ 4,5 To · vCPU ≥ 750 · perte &lt; 20 %
          </div>
        </Card>
      </div>

      <Card title="Comparaison Normal vs HA vs Cible CDC" icon={BarChart2} dark={dark}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#334155" : "#e2e8f0"} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: dark ? "#94a3b8" : "#64748b" }} />
            <YAxis tick={{ fontSize: 11, fill: dark ? "#94a3b8" : "#64748b" }} />
            <Tooltip
              contentStyle={{ background: dark ? "#1e293b" : "#fff", border: "1px solid #6366f1", borderRadius: 8 }}
              labelStyle={{ color: dark ? "#e2e8f0" : "#1e293b" }}
            />
            <Legend />
            <Bar dataKey="RAM" name="RAM (To)" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="vCPU" name="vCPU (×100)" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

// ─── 2. Microsoft Windows Server / SQL Server ──────────────────────────────────
function MicrosoftServerCalc({ dark }) {
  const [servers, setServers] = useState(6);
  const [coresPerServer, setCoresPerServer] = useState(32);
  const [vms, setVms] = useState(136);
  const [wsEdition, setWsEdition] = useState("datacenter");
  const [sqlInstances, setSqlInstances] = useState(4);
  const [sqlCores, setSqlCores] = useState(16);
  const [sqlEdition, setSqlEdition] = useState("standard");

  const r = useMemo(() => {
    const coresPerLic = 2; // vendu par pack de 2
    const minCoresPerServer = 16;
    const effectiveCores = Math.max(coresPerServer, minCoresPerServer);
    const corePacksPerServer = Math.ceil(effectiveCores / coresPerLic);

    let wsLicenses, wsComment;
    if (wsEdition === "datacenter") {
      wsLicenses = servers * corePacksPerServer;
      wsComment = "Datacenter : VMs illimitées par serveur licencié";
    } else {
      const licPerServer = Math.ceil(vms / servers / 2);
      const licPacksPerServer = Math.max(corePacksPerServer, licPerServer * corePacksPerServer);
      wsLicenses = servers * Math.max(corePacksPerServer, Math.ceil(vms / 2) * corePacksPerServer / corePacksPerServer);
      wsLicenses = servers * corePacksPerServer * Math.ceil(vms / (servers * 2));
      wsComment = `Standard : 2 VMs par licence serveur → ${Math.ceil(vms / 2)} licences totales requises`;
      wsLicenses = Math.ceil(vms / 2) * corePacksPerServer;
    }

    const sqlCorePacksPerInstance = Math.max(4, Math.ceil(sqlCores / 2));
    let sqlLicenses;
    if (sqlEdition === "standard") {
      sqlLicenses = sqlInstances * sqlCorePacksPerInstance;
    } else {
      sqlLicenses = sqlInstances * Math.max(4, Math.ceil(sqlCores / 2));
    }

    return {
      effectiveCores,
      corePacksPerServer,
      wsLicenses,
      wsComment,
      sqlLicenses,
      sqlCorePacksPerInstance,
      totalCorePacksWs: servers * corePacksPerServer,
    };
  }, [servers, coresPerServer, vms, wsEdition, sqlInstances, sqlCores, sqlEdition]);

  return (
    <div className="space-y-5">
      <SectionTitle dark={dark}>🪟 Licences Microsoft — Windows Server & SQL Server</SectionTitle>
      <div className={`flex items-start gap-2 p-3 rounded-xl text-xs
        ${dark ? "bg-violet-900/30 text-violet-300 border border-violet-700" : "bg-violet-50 text-violet-700 border border-violet-200"}`}>
        <Info size={14} className="mt-0.5 shrink-0" />
        Windows Server : vendu par packs de 2 cœurs, minimum 16 cœurs/serveur (8 packs).
        Datacenter = VMs illimitées. Standard = 2 VMs par licence serveur complète.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Windows Server" icon={Server} dark={dark}>
          <div className="space-y-3 mb-4">
            <Input label="Nombre de serveurs physiques" value={servers} onChange={setServers} min={1} max={100} unit="serveurs" dark={dark} />
            <Input label="Cœurs physiques par serveur" value={coresPerServer} onChange={setCoresPerServer} min={4} max={128} step={2} unit="cœurs" dark={dark} />
            <Input label="Nombre de VMs total" value={vms} onChange={setVms} min={1} max={5000} unit="VMs" dark={dark} />
            <Select label="Édition" value={wsEdition} onChange={setWsEdition} dark={dark}
              options={[
                { value: "datacenter", label: "Datacenter (VMs illimitées)" },
                { value: "standard", label: "Standard (2 VMs / licence)" },
              ]} />
          </div>
          <div className="space-y-2">
            <ResultRow label="Cœurs effectifs/serveur" value={fmt(r.effectiveCores)} unit="cœurs" dark={dark} />
            <ResultRow label="Packs 2-cœurs/serveur" value={fmt(r.corePacksPerServer)} unit="packs" dark={dark} />
            <ResultRow label="⭐ Packs licences Windows Server" value={fmt(r.wsLicenses)} unit="packs de 2c" highlight dark={dark} />
            <div className={`p-2 rounded-lg text-xs italic mt-2
              ${dark ? "bg-slate-700 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
              {r.wsComment}
            </div>
          </div>
        </Card>

        <Card title="SQL Server" icon={Database} dark={dark}>
          <div className="space-y-3 mb-4">
            <Input label="Instances SQL Server" value={sqlInstances} onChange={setSqlInstances} min={1} max={100} unit="instances" dark={dark} />
            <Input label="Cœurs par instance" value={sqlCores} onChange={setSqlCores} min={4} max={128} step={2} unit="cœurs" dark={dark} />
            <Select label="Édition SQL" value={sqlEdition} onChange={setSqlEdition} dark={dark}
              options={[
                { value: "standard", label: "Standard (max 24c, 128 Go RAM)" },
                { value: "enterprise", label: "Enterprise (illimité)" },
              ]} />
          </div>
          <div className="space-y-2">
            <ResultRow label="Packs 2-cœurs/instance" value={fmt(r.sqlCorePacksPerInstance)} unit="packs" dark={dark} />
            <ResultRow label="⭐ Packs licences SQL Server" value={fmt(r.sqlLicenses)} unit="packs de 2c" highlight dark={dark} />
            {sqlEdition === "standard" && sqlCores > 24 && (
              <div className={`flex items-start gap-2 p-2 rounded-lg text-xs
                ${dark ? "bg-amber-900/30 text-amber-300 border border-amber-700" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                SQL Standard est limité à 24 cœurs — envisagez l'édition Enterprise.
              </div>
            )}
            <div className={`p-2 rounded-lg text-xs italic mt-2
              ${dark ? "bg-slate-700 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
              {sqlEdition === "standard"
                ? "Standard : 4 cœurs min/instance, max 24 cœurs et 128 Go RAM"
                : "Enterprise : pas de limite de cœurs ou de RAM"}
            </div>
          </div>
        </Card>
      </div>

      <Card title="Récapitulatif" icon={BarChart2} dark={dark}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Serveurs physiques", value: fmt(servers), sub: "hôtes" },
            { label: "VMs hébergées", value: fmt(vms), sub: "machines virtuelles" },
            { label: "Packs Windows Server", value: fmt(r.wsLicenses), sub: "packs 2-cœurs" },
            { label: "Packs SQL Server", value: fmt(r.sqlLicenses), sub: "packs 2-cœurs" },
          ].map((item, i) => (
            <div key={i} className={`rounded-xl p-4 text-center border
              ${dark ? "bg-slate-700 border-slate-600" : "bg-indigo-50 border-indigo-100"}`}>
              <div className={`text-2xl font-bold ${dark ? "text-indigo-300" : "text-indigo-700"}`}>
                {item.value}
              </div>
              <div className={`text-xs font-medium mt-1 ${dark ? "text-slate-300" : "text-slate-700"}`}>
                {item.label}
              </div>
              <div className={`text-xs mt-0.5 ${dark ? "text-slate-500" : "text-slate-400"}`}>
                {item.sub}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── 3. Microsoft 365 ──────────────────────────────────────────────────────────
const M365_PLANS = [
  { id: "f1",  name: "F1",  price: 2.25,  desc: "Terrain — accès web uniquement",       features: ["Teams", "SharePoint (lecture)", "Exchange 2 Go"] },
  { id: "f3",  name: "F3",  price: 8,     desc: "Terrain + apps Office web",             features: ["Office Web Apps", "Teams", "SharePoint", "Intune (limité)"] },
  { id: "bp",  name: "Business Basic", price: 6, desc: "PME — cloud uniquement",          features: ["Teams", "Exchange 50 Go", "SharePoint", "OneDrive 1 To"] },
  { id: "bs",  name: "Business Standard", price: 12.50, desc: "PME — apps desktop",      features: ["Apps Office desktop", "Teams", "Exchange", "OneDrive"] },
  { id: "bprem", name: "Business Premium", price: 22, desc: "PME — sécurité avancée",    features: ["Tout Business Standard", "Intune", "Entra P1", "Defender"] },
  { id: "e3",  name: "Enterprise E3", price: 36, desc: "Entreprise — conformité",        features: ["Apps Office", "Teams", "Exchange", "Compliance", "Entra P1"] },
  { id: "e5",  name: "Enterprise E5", price: 57, desc: "Entreprise — sécurité maximale", features: ["Tout E3", "Defender P2", "Entra P2", "Purview", "Power BI Pro"] },
];

function M365Calc({ dark }) {
  const [frontline, setFrontline] = useState(50);
  const [business, setBusiness] = useState(150);
  const [power, setPower] = useState(30);
  const [security, setSecurity] = useState(true);
  const [compliance, setCompliance] = useState(false);

  const recommend = useMemo(() => {
    const total = frontline + business + power;
    const recs = {};
    if (frontline > 0) recs.frontline = security ? "f3" : "f1";
    if (business > 0) recs.business = security ? "bprem" : "bs";
    if (power > 0) recs.power = compliance ? "e5" : "e3";
    return { recs, total };
  }, [frontline, business, power, security, compliance]);

  const totalMonthly = useMemo(() => {
    let t = 0;
    const map = { frontline, business, power };
    const counts = { frontline, business, power };
    Object.entries(recommend.recs).forEach(([key, planId]) => {
      const plan = M365_PLANS.find(p => p.id === planId);
      if (plan) t += (counts[key] || 0) * plan.price;
    });
    return t;
  }, [recommend, frontline, business, power]);

  return (
    <div className="space-y-5">
      <SectionTitle dark={dark}>☁️ Licences Microsoft 365</SectionTitle>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Profils Utilisateurs" icon={Users} dark={dark}>
          <div className="space-y-3">
            <Input label="Utilisateurs terrain (Frontline)" value={frontline} onChange={setFrontline} min={0} max={10000} unit="users" dark={dark} note="Sans bureau fixe, accès mobile/web" />
            <Input label="Utilisateurs bureautique" value={business} onChange={setBusiness} min={0} max={10000} unit="users" dark={dark} note="Travail quotidien Office + Teams" />
            <Input label="Utilisateurs avancés / IT" value={power} onChange={setPower} min={0} max={10000} unit="users" dark={dark} note="Besoins conformité, sécurité avancée" />
            <div className={`border-t pt-3 mt-1 space-y-2 ${dark ? "border-slate-700" : "border-slate-100"}`}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={security} onChange={e => setSecurity(e.target.checked)}
                  className="rounded text-indigo-600" />
                <span className={`text-xs ${dark ? "text-slate-300" : "text-slate-600"}`}>
                  Sécurité avancée requise (Intune, Entra P1)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={compliance} onChange={e => setCompliance(e.target.checked)}
                  className="rounded text-indigo-600" />
                <span className={`text-xs ${dark ? "text-slate-300" : "text-slate-600"}`}>
                  Conformité & eDiscovery (Purview, Defender P2)
                </span>
              </label>
            </div>
          </div>
        </Card>

        <Card title="Recommandations" icon={CheckCircle} dark={dark}>
          <div className="space-y-3">
            {[
              { key: "frontline", label: "Terrain", count: frontline },
              { key: "business", label: "Bureautique", count: business },
              { key: "power", label: "Avancés / IT", count: power },
            ].filter(p => p.count > 0).map(profile => {
              const planId = recommend.recs[profile.key];
              const plan = M365_PLANS.find(p => p.id === planId);
              return plan ? (
                <div key={profile.key} className={`rounded-xl p-3 border
                  ${dark ? "bg-slate-700 border-slate-600" : "bg-indigo-50 border-indigo-100"}`}>
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <span className={`text-xs font-medium ${dark ? "text-slate-400" : "text-slate-500"}`}>
                        {profile.label} — {fmt(profile.count)} users
                      </span>
                      <div className={`font-bold text-sm ${dark ? "text-indigo-300" : "text-indigo-700"}`}>
                        M365 {plan.name}
                      </div>
                    </div>
                    <span className={`text-xs font-mono font-bold ${dark ? "text-emerald-400" : "text-emerald-600"}`}>
                      {plan.price.toFixed(2)} €/u/m
                    </span>
                  </div>
                  <p className={`text-xs mb-1 ${dark ? "text-slate-400" : "text-slate-500"}`}>{plan.desc}</p>
                  <div className="flex flex-wrap gap-1">
                    {plan.features.map(f => (
                      <span key={f} className={`text-xs px-1.5 py-0.5 rounded
                        ${dark ? "bg-slate-600 text-slate-300" : "bg-white text-slate-600 border border-slate-200"}`}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null;
            })}
          </div>
        </Card>

        <Card title="Budget mensuel estimé" icon={BarChart2} dark={dark}>
          <div className={`rounded-2xl p-5 text-center mb-4 ${dark ? "bg-indigo-900/40 border border-indigo-700" : "bg-indigo-50 border border-indigo-200"}`}>
            <div className={`text-4xl font-bold font-mono ${dark ? "text-indigo-300" : "text-indigo-700"}`}>
              {fmt(totalMonthly, 0)} €
            </div>
            <div className={`text-xs mt-1 ${dark ? "text-slate-400" : "text-slate-500"}`}>
              / mois · {fmt(recommend.total)} utilisateurs
            </div>
            <div className={`text-sm mt-2 font-medium ${dark ? "text-slate-300" : "text-slate-600"}`}>
              ≈ {fmt(totalMonthly * 12, 0)} € / an
            </div>
          </div>
          <div className="space-y-2">
            {[
              { key: "frontline", label: "Terrain", count: frontline },
              { key: "business", label: "Bureautique", count: business },
              { key: "power", label: "Avancés", count: power },
            ].filter(p => p.count > 0).map(profile => {
              const plan = M365_PLANS.find(p => p.id === recommend.recs[profile.key]);
              const cost = plan ? profile.count * plan.price : 0;
              return (
                <ResultRow key={profile.key}
                  label={`${profile.label} (${profile.count} × ${plan?.price.toFixed(2)} €)`}
                  value={fmt(cost, 0)} unit="€/mois" dark={dark} />
              );
            })}
          </div>
        </Card>
      </div>

      <Card title="Comparatif tous les plans M365" icon={BarChart2} dark={dark}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className={dark ? "text-slate-400" : "text-slate-500"}>
                <th className="text-left py-2 px-2">Plan</th>
                <th className="text-center py-2 px-2">Prix/u/m</th>
                <th className="text-left py-2 px-2">Description</th>
                <th className="text-center py-2 px-2">Recommandé pour</th>
              </tr>
            </thead>
            <tbody>
              {M365_PLANS.map((plan, i) => {
                const isRec = Object.values(recommend.recs).includes(plan.id);
                return (
                  <tr key={plan.id}
                    className={`border-t ${dark ? "border-slate-700" : "border-slate-100"}
                    ${isRec ? dark ? "bg-indigo-900/20" : "bg-indigo-50" : ""}`}>
                    <td className="py-2 px-2">
                      <span className={`font-bold ${isRec ? dark ? "text-indigo-300" : "text-indigo-700" : dark ? "text-slate-300" : "text-slate-700"}`}>
                        M365 {plan.name}
                      </span>
                      {isRec && <span className="ml-1 text-emerald-500">✓</span>}
                    </td>
                    <td className={`py-2 px-2 text-center font-mono font-bold ${dark ? "text-emerald-400" : "text-emerald-600"}`}>
                      {plan.price.toFixed(2)} €
                    </td>
                    <td className={`py-2 px-2 ${dark ? "text-slate-400" : "text-slate-500"}`}>{plan.desc}</td>
                    <td className={`py-2 px-2 text-center ${dark ? "text-slate-400" : "text-slate-500"}`}>
                      {Object.entries(recommend.recs).find(([, v]) => v === plan.id)?.[0] || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── 4. Stockage / Capacity Planning ─────────────────────────────────────────
function StorageCalc({ dark }) {
  const [rawCapacity, setRawCapacity] = useState(230);
  const [raidLevel, setRaidLevel] = useState("raid6");
  const [dedupRatio, setDedupRatio] = useState(1);
  const [driveSize, setDriveSize] = useState(7.68);
  const [driveCount, setDriveCount] = useState(24);
  const [iopsTarget, setIopsTarget] = useState(50000);
  const [iopsPerDrive, setIopsPerDrive] = useState(350000);
  const [bwTarget, setBwTarget] = useState(25);

  const r = useMemo(() => {
    const RAID_OVERHEAD = {
      raid1: 0.5, raid5: (driveCount - 1) / driveCount,
      raid6: (driveCount - 2) / driveCount,
      raid10: 0.5, none: 1
    };
    const overhead = RAID_OVERHEAD[raidLevel] || 1;
    const rawTotal = driveCount * driveSize;
    const usableRaw = rawTotal * overhead;
    const usableWithDedup = usableRaw * dedupRatio;
    const iopsAvail = driveCount * iopsPerDrive;
    const iopsOk = iopsAvail >= iopsTarget;
    const capacityOk = usableWithDedup >= rawCapacity;
    const hotSpares = driveCount > 12 ? 2 : 1;
    const usableWithSpares = (driveCount - hotSpares) * driveSize * overhead * dedupRatio;
    const pctUsed = rawCapacity / usableWithDedup * 100;

    return {
      rawTotal, usableRaw, usableWithDedup, usableWithSpares,
      iopsAvail, iopsOk, capacityOk, hotSpares,
      overhead: overhead * 100, pctUsed
    };
  }, [rawCapacity, raidLevel, dedupRatio, driveSize, driveCount, iopsTarget, iopsPerDrive]);

  const chartData = [
    { name: "Brut total", value: r.rawTotal },
    { name: "Utile (RAID)", value: r.usableRaw },
    { name: "Utile (dédup)", value: r.usableWithDedup },
    { name: "Cible", value: rawCapacity },
  ];

  return (
    <div className="space-y-5">
      <SectionTitle dark={dark}>💾 Capacity Planning Stockage (SAN/NAS)</SectionTitle>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Paramètres Baie" icon={HardDrive} dark={dark}>
          <div className="space-y-3">
            <Input label="Capacité cible nette" value={rawCapacity} onChange={setRawCapacity} min={1} step={10} unit="To" dark={dark} note="Besoin réel après marge de croissance" />
            <Input label="Nombre de disques" value={driveCount} onChange={setDriveCount} min={4} max={500} unit="disques" dark={dark} />
            <Input label="Taille par disque" value={driveSize} onChange={setDriveSize} min={0.96} max={100} step={0.96} unit="To" dark={dark} note="NVMe : 3,84 / 7,68 / 15,36 To" />
            <Select label="Niveau RAID" value={raidLevel} onChange={setRaidLevel} dark={dark}
              options={[
                { value: "raid1", label: "RAID 1 (miroir, eff. 50%)" },
                { value: "raid5", label: "RAID 5 (N-1 parité)" },
                { value: "raid6", label: "RAID 6 (N-2 parités, recommandé)" },
                { value: "raid10", label: "RAID 10 (miroir+stripe, eff. 50%)" },
                { value: "none", label: "Sans RAID (raw)" },
              ]} />
            <Input label="Ratio déduplication/compression" value={dedupRatio} onChange={setDedupRatio} min={1} max={10} step={0.1} unit="×" dark={dark} note="1 = pas de dédup (recommandé CDC)" />
          </div>
        </Card>

        <Card title="Performances" icon={Cpu} dark={dark}>
          <div className="space-y-3 mb-4">
            <Input label="IOPS cibles" value={iopsTarget} onChange={setIopsTarget} min={1000} max={10000000} step={5000} unit="IOPS" dark={dark} note="CDC CESI : ≥ 50 000 IOPS" />
            <Input label="IOPS par disque (NVMe)" value={iopsPerDrive} onChange={setIopsPerDrive} min={10000} max={2000000} step={50000} unit="IOPS/disque" dark={dark} note="NVMe SSD : 350 000 – 700 000 IOPS" />
            <Input label="Bande passante cible" value={bwTarget} onChange={setBwTarget} min={1} max={400} unit="Gbps" dark={dark} note="CDC CESI : 25 Gbps minimum" />
          </div>
          <div className="space-y-2">
            <ResultRow label="IOPS disponibles (total)" value={fmt(r.iopsAvail)} unit="IOPS" dark={dark} ok={r.iopsOk} />
            <ResultRow label="Ratio IOPS dispo / cible" value={`${fmt(r.iopsAvail / iopsTarget, 1)} ×`} dark={dark} ok={r.iopsAvail >= iopsTarget} />
          </div>
        </Card>

        <Card title="Résultats Capacité" icon={Database} dark={dark}>
          <div className="space-y-2">
            <ResultRow label="Capacité brute totale" value={fmt(r.rawTotal, 1)} unit="To" dark={dark} />
            <ResultRow label={`Efficacité RAID (${raidLevel.toUpperCase()})`} value={`${fmt(r.overhead, 0)} %`} dark={dark} />
            <ResultRow label="Capacité utile (RAID)" value={fmt(r.usableRaw, 1)} unit="To" dark={dark} />
            <ResultRow label="Avec dédup/compression" value={fmt(r.usableWithDedup, 1)} unit="To" dark={dark} ok={r.capacityOk} />
            <ResultRow label="Hot spare(s) réservé(s)" value={fmt(r.hotSpares)} unit="disques" dark={dark} />
            <ResultRow label="⭐ Utile avec hot spares" value={fmt(r.usableWithSpares, 1)} unit="To" highlight dark={dark} ok={r.usableWithSpares >= rawCapacity} />
            <ResultRow label="Taux de remplissage" value={`${fmt(r.pctUsed, 1)} %`} dark={dark} ok={r.pctUsed <= 80} />
          </div>
        </Card>
      </div>

      <Card title="Visualisation capacité" icon={BarChart2} dark={dark}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} layout="vertical" barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#334155" : "#e2e8f0"} horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: dark ? "#94a3b8" : "#64748b" }} unit=" To" />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: dark ? "#94a3b8" : "#64748b" }} width={110} />
            <Tooltip
              contentStyle={{ background: dark ? "#1e293b" : "#fff", border: "1px solid #6366f1", borderRadius: 8 }}
              formatter={v => [`${fmt(v, 1)} To`]}
            />
            <Bar dataKey="value" name="Capacité (To)" radius={[0, 4, 4, 0]}
              fill="#6366f1"
              label={{ position: "right", fontSize: 11, fill: dark ? "#94a3b8" : "#64748b", formatter: v => `${fmt(v, 1)} To` }}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────
const TOOLS = [
  { id: "vmware",   label: "VMware",          icon: Cpu,       sub: "Broadcom VVF/VCF",    comp: VMwareCalc },
  { id: "winserver",label: "Windows Server",  icon: Server,    sub: "WS & SQL Server",      comp: MicrosoftServerCalc },
  { id: "m365",     label: "Microsoft 365",   icon: Cloud,     sub: "Plans & Budget",       comp: M365Calc },
  { id: "storage",  label: "Stockage",        icon: HardDrive, sub: "SAN · NAS · IOPS",    comp: StorageCalc },
];

export default function SizingHub() {
  const [active, setActive] = useState("vmware");
  const [dark, setDark] = useState(false);

  const ActiveComp = TOOLS.find(t => t.id === active)?.comp || VMwareCalc;

  return (
    <div className={`flex h-screen overflow-hidden font-sans text-sm
      ${dark ? "bg-slate-900 text-slate-200" : "bg-slate-100 text-slate-800"}`}>

      {/* ── Sidebar ── */}
      <aside className={`w-56 flex flex-col shrink-0 border-r
        ${dark ? "bg-slate-900 border-slate-700" : "bg-slate-900"}`}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <BarChart2 size={16} className="text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-tight">SizingHub</div>
              <div className="text-slate-400 text-xs">Infrastructure Tools</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          <p className="text-slate-500 text-xs uppercase tracking-wider px-2 py-2 font-semibold">
            Calculateurs
          </p>
          {TOOLS.map(tool => {
            const Icon = tool.icon;
            const isActive = active === tool.id;
            return (
              <button key={tool.id} onClick={() => setActive(tool.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all
                  ${isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}>
                <Icon size={16} className={isActive ? "text-white" : "text-slate-500"} />
                <div>
                  <div className={`text-xs font-semibold leading-tight ${isActive ? "text-white" : ""}`}>
                    {tool.label}
                  </div>
                  <div className={`text-xs leading-tight ${isActive ? "text-indigo-200" : "text-slate-600"}`}>
                    {tool.sub}
                  </div>
                </div>
                {isActive && <ChevronRight size={12} className="ml-auto text-indigo-300" />}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 text-xs text-slate-600 text-center">
          SizingHub v1.0 · 2026
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className={`flex items-center justify-between px-6 py-3 border-b shrink-0
          ${dark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
          <div>
            <h1 className={`font-bold text-base ${dark ? "text-white" : "text-slate-800"}`}>
              {TOOLS.find(t => t.id === active)?.label}
            </h1>
            <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
              {TOOLS.find(t => t.id === active)?.sub}
            </p>
          </div>
          <button onClick={() => setDark(d => !d)}
            className={`p-2 rounded-lg border transition-colors
              ${dark
                ? "bg-slate-700 border-slate-600 text-yellow-400 hover:bg-slate-600"
                : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"}`}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <ActiveComp dark={dark} />
        </main>
      </div>
    </div>
  );
}
