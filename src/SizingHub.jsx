import { useState, useMemo } from "react";
import {
  Server, HardDrive, Cloud, Users, Cpu,
  Database, BarChart2, Settings, Shield,
  CheckCircle, AlertTriangle, Info, ChevronRight,
  Sun, Moon
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from "recharts";

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg0: "#0a0b0d", bg1: "#111318", bg2: "#181b22", bg3: "#1e2230",
  accent: "#00d4aa", accent2: "#0099ff", accent3: "#ff6b35",
  warn: "#ffb347", danger: "#ff5555",
  t1: "#e8eaf0", t2: "#8b90a0", t3: "#4a5068",
  border: "rgba(255,255,255,0.07)", border2: "rgba(0,212,170,0.2)",
};

const theme = (dark) => ({
  bg0: dark ? "#0a0b0d" : "#f4f5f7",
  bg1: dark ? "#111318" : "#ffffff",
  bg2: dark ? "#181b22" : "#f0f2f5",
  bg3: dark ? "#1e2230" : "#e8eaed",
  t1:  dark ? "#e8eaf0" : "#1a1d23",
  t2:  dark ? "#8b90a0" : "#5a6072",
  t3:  dark ? "#4a5068" : "#9aa0b0",
  border: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
  border2: dark ? "rgba(0,212,170,0.2)" : "rgba(0,168,132,0.3)",
});

const css = {
  root: { fontFamily: "'Inter', system-ui, sans-serif", background: T.bg0, color: T.t1, minHeight: "100vh", display: "flex" },
  sidebar: { width: 210, minWidth: 210, background: T.bg1, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", padding: "16px 0" },
  logo: { padding: "0 16px 16px", borderBottom: `1px solid ${T.border}`, marginBottom: 12 },
  logoTitle: { fontSize: 15, fontWeight: 700, color: T.accent, letterSpacing: "0.08em", textTransform: "uppercase" },
  logoSub: { fontSize: 10, color: T.t3, fontFamily: "monospace", marginTop: 2 },
  navSection: { padding: "8px 16px 4px", fontSize: 9, color: T.t3, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "monospace" },
  main: { flex: 1, overflowY: "auto", padding: 28 },
  topbar: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  pageTitle: { fontSize: 20, fontWeight: 700, color: T.t1 },
  pageSub: { fontSize: 11, color: T.t3, fontFamily: "monospace", marginTop: 3 },
  badge: { fontSize: 9, background: "rgba(0,212,170,0.1)", color: T.accent, padding: "4px 10px", borderRadius: 3, fontFamily: "monospace", border: `1px solid ${T.border2}`, textTransform: "uppercase", letterSpacing: "0.08em" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 },
  grid4: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 },
  card: { background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 6, padding: 18 },
  cardAccent: { borderLeft: `2px solid ${T.accent}` },
  cardAccent2: { borderLeft: `2px solid ${T.accent2}` },
  cardAccent3: { borderLeft: `2px solid ${T.accent3}` },
  cardWarn: { borderLeft: `2px solid ${T.warn}` },
  sectionTitle: { fontSize: 10, fontWeight: 600, color: T.t2, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${T.border}`, fontFamily: "monospace" },
  kpiLabel: { fontSize: 10, color: T.t3, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 },
  kpiVal: (color = T.t1) => ({ fontSize: 24, fontWeight: 600, fontFamily: "monospace", color }),
  kpiSub: { fontSize: 10, color: T.t3, fontFamily: "monospace", marginTop: 3 },
  field: { marginBottom: 14 },
  label: { display: "block", fontSize: 10, color: T.t3, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 },
  input: { width: "100%", background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 4, padding: "7px 10px", color: T.t1, fontFamily: "monospace", fontSize: 13, boxSizing: "border-box" },
  select: { width: "100%", background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 4, padding: "7px 10px", color: T.t1, fontFamily: "monospace", fontSize: 12, boxSizing: "border-box" },
  resultRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.border}` },
  resultLabel: { fontSize: 12, color: T.t2 },
  infoBox: { background: "rgba(0,153,255,0.08)", border: `1px solid rgba(0,153,255,0.2)`, borderRadius: 4, padding: "8px 12px", fontSize: 11, color: "#7ab8ff", fontFamily: "monospace", marginBottom: 14, display: "flex", gap: 8, alignItems: "flex-start" },
  alertBox: { background: "rgba(255,107,53,0.08)", border: `1px solid rgba(255,107,53,0.25)`, borderRadius: 4, padding: "8px 12px", fontSize: 11, color: T.warn, fontFamily: "monospace", marginBottom: 12, display: "flex", gap: 8, alignItems: "flex-start" },
  okBox: { background: "rgba(0,212,170,0.07)", border: `1px solid rgba(0,212,170,0.2)`, borderRadius: 4, padding: "8px 12px", fontSize: 11, color: T.accent, fontFamily: "monospace", marginBottom: 12, display: "flex", gap: 8, alignItems: "flex-start" },
  divider: { border: "none", borderTop: `1px solid ${T.border}`, margin: "14px 0" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n, dec = 0) => Number.isFinite(n) ? n.toLocaleString("fr-FR", { maximumFractionDigits: dec }) : "—";

function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 8, padding: "8px 16px",
      cursor: "pointer", fontSize: 12, color: active ? T.accent : T.t2,
      borderLeft: `2px solid ${active ? T.accent : "transparent"}`,
      background: active ? "rgba(0,212,170,0.06)" : "transparent",
      transition: "all 0.15s",
    }}>
      <Icon size={13} />
      {label}
    </div>
  );
}

function KpiCard({ label, value, color, sub }) {
  return (
    <div style={css.card}>
      <div style={css.kpiLabel}>{label}</div>
      <div style={css.kpiVal(color || T.accent)}>{value}</div>
      {sub && <div style={css.kpiSub}>{sub}</div>}
    </div>
  );
}

function ResultRow({ label, value, highlight, warn, danger }) {
  const color = danger ? T.danger : warn ? T.warn : highlight ? T.accent : T.t1;
  return (
    <div style={{ ...css.resultRow }}>
      <span style={css.resultLabel}>{label}</span>
      <span style={{ fontFamily: "monospace", fontWeight: 600, fontSize: 13, color }}>{value}</span>
    </div>
  );
}

function Field({ label, children }) {
  return <div style={css.field}><label style={css.label}>{label}</label>{children}</div>;
}

function SliderField({ label, min, max, step = 1, value, onChange, display }) {
  return (
    <Field label={label}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{ flex: 1, accentColor: T.accent }} />
        <span style={{ fontFamily: "monospace", fontSize: 12, color: T.accent, minWidth: 50, textAlign: "right" }}>
          {display || value}
        </span>
      </div>
    </Field>
  );
}

function NumField({ label, min, max, step = 1, value, onChange, unit, note }) {
  return (
    <Field label={label}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="number" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={css.input} />
        {unit && <span style={{ fontSize: 11, color: T.t3, whiteSpace: "nowrap" }}>{unit}</span>}
      </div>
      {note && <div style={{ fontSize: 10, color: T.t3, marginTop: 3 }}>{note}</div>}
    </Field>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <Field label={label}>
      <select value={value} onChange={e => onChange(e.target.value)} style={css.select}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  );
}

const tooltipStyle = { background: T.bg2, border: `1px solid ${T.border2}`, borderRadius: 4, fontSize: 11 };

// ─── 1. VMware ────────────────────────────────────────────────────────────────
function VMwareCalc() {
  const [nodes, setNodes] = useState(6);
  const [sockets, setSockets] = useState(1);
  const [cores, setCores] = useState(32);
  const [ram, setRam] = useState(768);
  const [overcommit, setOvercommit] = useState(3.75);

  const r = useMemo(() => {
    const totalSockets = nodes * sockets;
    const totalPhys = totalSockets * cores;
    const billedPerSocket = Math.max(cores, 16);
    const totalBilled = totalSockets * billedPerSocket;
    const totalRamTo = (nodes * ram) / 1024;
    const vcpuTotal = totalPhys * overcommit;
    const haRam = ((nodes - 1) * ram) / 1024;
    const haCores = (nodes - 1) * sockets * cores;
    const haVcpu = haCores * overcommit;
    const haPct = nodes > 0 ? (1 / nodes) * 100 : 0;
    return { totalSockets, totalPhys, billedPerSocket, totalBilled, totalRamTo, vcpuTotal, haRam, haCores, haVcpu, haPct, haRamOk: haRam >= 4.5, haVcpuOk: haVcpu >= 750 };
  }, [nodes, sockets, cores, ram, overcommit]);

  const chartData = [
    { name: "Normal", RAM: +r.totalRamTo.toFixed(2), vCPU: +(r.vcpuTotal / 100).toFixed(1) },
    { name: "HA (N-1)", RAM: +r.haRam.toFixed(2), vCPU: +(r.haVcpu / 100).toFixed(1) },
    { name: "Cible CDC", RAM: 4.5, vCPU: 7.5 },
  ];

  return (
    <div>
      <div style={{ ...css.infoBox }}>
        <Info size={13} style={{ marginTop: 1, flexShrink: 0 }} />
        Broadcom 2024+ : facturation par cœur physique, minimum 16 cœurs par socket.
      </div>
      <div style={css.grid4}>
        <KpiCard label="Nœuds" value={nodes} />
        <KpiCard label="Cœurs facturés" value={fmt(r.totalBilled)} />
        <KpiCard label="RAM totale" value={fmt(r.totalRamTo, 2) + " To"} color={T.t1} />
        <KpiCard label="Statut HA" value={r.haRamOk && r.haVcpuOk ? "OK" : "WARN"} color={r.haRamOk && r.haVcpuOk ? T.accent : T.warn} />
      </div>
      <div style={css.grid3}>
        <div style={{ ...css.card, ...css.cardAccent }}>
          <div style={css.sectionTitle}>Paramètres cluster</div>
          <SliderField label="Nœuds" min={2} max={32} value={nodes} onChange={setNodes} />
          <SliderField label="Sockets / nœud" min={1} max={4} value={sockets} onChange={setSockets} />
          <SliderField label="Cœurs physiques / socket" min={4} max={64} step={2} value={cores} onChange={setCores} />
          <NumField label="RAM / nœud" value={ram} onChange={setRam} min={64} max={6144} step={64} unit="Go" note="Xeon typique : 256, 512, 768 Go" />
          <NumField label="Overcommit vCPU" value={overcommit} onChange={setOvercommit} min={1} max={10} step={0.25} unit="vCPU/cœur" note="CDC CESI : 3,75 recommandé" />
        </div>
        <div style={{ ...css.card, ...css.cardAccent2 }}>
          <div style={css.sectionTitle}>Résultats licensing</div>
          {r.haRamOk && r.haVcpuOk
            ? <div style={css.okBox}><CheckCircle size={13} />Cluster HA validé — N-1 nominal</div>
            : <div style={css.alertBox}><AlertTriangle size={13} />Capacité HA insuffisante</div>}
          <ResultRow label="Total sockets" value={fmt(r.totalSockets) + " sockets"} />
          <ResultRow label="Cœurs physiques totaux" value={fmt(r.totalPhys) + " cœurs"} />
          <ResultRow label="Règle min 16/socket" value={fmt(r.billedPerSocket) + " cœurs"} />
          <ResultRow label="Cœurs facturés VMware" value={fmt(r.totalBilled) + " cœurs"} highlight />
          <ResultRow label="Packs 2-cœurs" value={fmt(Math.ceil(r.totalBilled / 2)) + " packs"} highlight />
          <hr style={css.divider} />
          <ResultRow label="Cœurs N-1 (HA)" value={fmt(r.haCores) + " cœurs"} />
          <ResultRow label="RAM N-1 (HA)" value={fmt(r.haRam, 2) + " To"} />
          <ResultRow label="vCPU N-1" value={fmt(r.haVcpu) + " vCPU"} />
          <ResultRow label="Capacité perdue HA" value={fmt(r.haPct, 1) + " %"} warn={r.haPct > 20} />
        </div>
        <div style={{ ...css.card }}>
          <div style={css.sectionTitle}>Normal vs HA vs Cible CDC</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.t2 }} />
              <YAxis tick={{ fontSize: 10, fill: T.t2 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, color: T.t2 }} />
              <Bar dataKey="RAM" name="RAM (To)" fill={T.accent2} radius={[3, 3, 0, 0]} />
              <Bar dataKey="vCPU" name="vCPU (×100)" fill={T.accent} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 10, color: T.t3, marginTop: 8, fontFamily: "monospace" }}>
            Cibles CDC : RAM ≥ 4,5 To · vCPU ≥ 750 · perte &lt; 20 %
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 2. Windows Server & SQL ──────────────────────────────────────────────────
function WindowsCalc() {
  const [servers, setServers] = useState(6);
  const [coresPerServer, setCoresPerServer] = useState(32);
  const [vms, setVms] = useState(136);
  const [wsEdition, setWsEdition] = useState("datacenter");
  const [sqlInstances, setSqlInstances] = useState(4);
  const [sqlCores, setSqlCores] = useState(16);
  const [sqlEdition, setSqlEdition] = useState("standard");

  const r = useMemo(() => {
    const effective = Math.max(coresPerServer, 16);
    const packsPerServer = Math.ceil(effective / 2);
    let wsLicenses, wsComment;
    if (wsEdition === "datacenter") {
      wsLicenses = servers * packsPerServer;
      wsComment = "Datacenter : VMs illimitées par serveur licencié";
    } else {
      wsLicenses = Math.ceil(vms / 2) * packsPerServer;
      wsComment = `Standard : 2 VMs par licence → ${Math.ceil(vms / 2)} licences requises`;
    }
    const sqlPacksPerInst = Math.max(4, Math.ceil(sqlCores / 2));
    const sqlLicenses = sqlInstances * sqlPacksPerInst;
    return { effective, packsPerServer, wsLicenses, wsComment, sqlPacksPerInst, sqlLicenses };
  }, [servers, coresPerServer, vms, wsEdition, sqlInstances, sqlCores, sqlEdition]);

  const sqlWarn = sqlEdition === "standard" && sqlCores > 24;

  return (
    <div>
      <div style={css.infoBox}>
        <Info size={13} style={{ marginTop: 1, flexShrink: 0 }} />
        Windows Server vendu par packs de 2 cœurs, minimum 16 cœurs/serveur. Datacenter = VMs illimitées. Standard = 2 VMs/licence.
      </div>
      <div style={css.grid4}>
        <KpiCard label="Packs WS" value={fmt(r.wsLicenses)} />
        <KpiCard label="Packs SQL" value={fmt(r.sqlLicenses)} color={T.accent2} />
        <KpiCard label="VMs couvertes" value={wsEdition === "datacenter" ? "Illimitées" : fmt(vms)} color={T.t1} />
        <KpiCard label="Statut SQL" value={sqlWarn ? "WARN" : "OK"} color={sqlWarn ? T.warn : T.accent} />
      </div>
      <div style={css.grid2}>
        <div style={{ ...css.card, ...css.cardAccent }}>
          <div style={css.sectionTitle}>Windows Server</div>
          <NumField label="Serveurs physiques" value={servers} onChange={setServers} min={1} max={100} unit="serveurs" />
          <NumField label="Cœurs / serveur" value={coresPerServer} onChange={setCoresPerServer} min={4} max={128} step={2} unit="cœurs" />
          <NumField label="Nombre de VMs" value={vms} onChange={setVms} min={1} max={5000} unit="VMs" />
          <SelectField label="Édition Windows Server" value={wsEdition} onChange={setWsEdition}
            options={[{ value: "datacenter", label: "Datacenter (VMs illimitées)" }, { value: "standard", label: "Standard (2 VMs / licence)" }]} />
          <hr style={css.divider} />
          <ResultRow label="Cœurs effectifs/serveur" value={fmt(r.effective) + " cœurs"} />
          <ResultRow label="Packs 2-cœurs/serveur" value={fmt(r.packsPerServer) + " packs"} />
          <ResultRow label="Packs Windows Server" value={fmt(r.wsLicenses) + " packs"} highlight />
          <div style={{ fontSize: 10, color: T.t3, marginTop: 8, fontFamily: "monospace" }}>{r.wsComment}</div>
        </div>
        <div style={{ ...css.card, ...css.cardAccent2 }}>
          <div style={css.sectionTitle}>SQL Server</div>
          <NumField label="Instances SQL" value={sqlInstances} onChange={setSqlInstances} min={1} max={100} unit="instances" />
          <NumField label="Cœurs / instance" value={sqlCores} onChange={setSqlCores} min={4} max={128} step={2} unit="cœurs" />
          <SelectField label="Édition SQL" value={sqlEdition} onChange={setSqlEdition}
            options={[{ value: "standard", label: "Standard (max 24c, 128 Go RAM)" }, { value: "enterprise", label: "Enterprise (illimité)" }]} />
          <hr style={css.divider} />
          {sqlWarn
            ? <div style={css.alertBox}><AlertTriangle size={13} />SQL Standard limité à 24 cœurs — envisager Enterprise</div>
            : <div style={css.okBox}><CheckCircle size={13} />Configuration SQL validée</div>}
          <ResultRow label="Packs 2-cœurs / instance" value={fmt(r.sqlPacksPerInst) + " packs"} />
          <ResultRow label="Packs SQL Server total" value={fmt(r.sqlLicenses) + " packs"} highlight />
          <div style={{ fontSize: 10, color: T.t3, marginTop: 8, fontFamily: "monospace" }}>
            {sqlEdition === "standard" ? "Standard : 4 cœurs min/instance, max 24c et 128 Go RAM" : "Enterprise : pas de limite de cœurs ou RAM"}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 3. Microsoft 365 ─────────────────────────────────────────────────────────
const M365_PLANS = [
  { id: "f1", name: "F1", price: 2.25, desc: "Terrain / Firstline, pas d'apps desktop", features: ["Teams", "SharePoint", "Exchange basique"] },
  { id: "bp", name: "Business Premium", price: 10.50, desc: "PME, sécurité intégrée", features: ["Apps Office", "Intune", "Defender"] },
  { id: "e3", name: "E3", price: 32.00, desc: "Entreprise, conformité avancée", features: ["Apps Office", "Purview", "eDiscovery"] },
  { id: "e5", name: "E5", price: 55.00, desc: "Sécurité maximale + analytics", features: ["Defender P2", "Sentinel", "Power BI Pro"] },
];

function M365Calc() {
  const [frontline, setFrontline] = useState(50);
  const [business, setBusiness] = useState(100);
  const [power, setPower] = useState(30);
  const [needsCompliance, setNeedsCompliance] = useState(false);
  const [needsAdvSec, setNeedsAdvSec] = useState(false);

  const r = useMemo(() => {
    const frontPlan = M365_PLANS.find(p => p.id === "f1");
    const bizPlan = M365_PLANS.find(p => p.id === (needsCompliance ? "e3" : needsAdvSec ? "bp" : "bp"));
    const powerPlan = M365_PLANS.find(p => p.id === (needsCompliance ? "e5" : "e3"));
    const total = frontline + business + power;
    const monthly = frontline * frontPlan.price + business * bizPlan.price + power * powerPlan.price;
    return { total, monthly, annual: monthly * 12, ppu: total > 0 ? monthly / total : 0, frontPlan, bizPlan, powerPlan };
  }, [frontline, business, power, needsCompliance, needsAdvSec]);

  const barData = [
    { name: "Terrain (F1)", cost: +(frontline * r.frontPlan.price).toFixed(0) },
    { name: "Bureautique", cost: +(business * r.bizPlan.price).toFixed(0) },
    { name: "Avancés", cost: +(power * r.powerPlan.price).toFixed(0) },
  ];

  return (
    <div>
      <div style={css.grid4}>
        <KpiCard label="Total users" value={fmt(r.total)} />
        <KpiCard label="Budget mensuel" value={fmt(r.monthly, 0) + " €"} />
        <KpiCard label="Budget annuel" value={fmt(r.annual, 0) + " €"} color={T.t1} />
        <KpiCard label="Coût / user / mois" value={fmt(r.ppu, 2) + " €"} color={T.accent2} />
      </div>
      <div style={css.grid2}>
        <div style={{ ...css.card, ...css.cardAccent }}>
          <div style={css.sectionTitle}>Profils utilisateurs</div>
          <SliderField label="Terrain / Firstline" min={0} max={500} step={5} value={frontline} onChange={setFrontline} display={frontline + " users → " + r.frontPlan.name + " (" + r.frontPlan.price + " €/u/m)"} />
          <SliderField label="Bureautique" min={0} max={500} step={5} value={business} onChange={setBusiness} display={business + " users → " + r.bizPlan.name + " (" + r.bizPlan.price + " €/u/m)"} />
          <SliderField label="Avancés / Power users" min={0} max={200} step={5} value={power} onChange={setPower} display={power + " users → " + r.powerPlan.name + " (" + r.powerPlan.price + " €/u/m)"} />
          <hr style={css.divider} />
          <div style={css.sectionTitle}>Besoins additionnels</div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: T.t2, marginBottom: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={needsCompliance} onChange={e => setNeedsCompliance(e.target.checked)} style={{ accentColor: T.accent }} />
            Conformité / eDiscovery / Purview (→ E3/E5)
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: T.t2, cursor: "pointer" }}>
            <input type="checkbox" checked={needsAdvSec} onChange={e => setNeedsAdvSec(e.target.checked)} style={{ accentColor: T.accent }} />
            Sécurité avancée / Intune / Defender
          </label>
        </div>
        <div style={{ ...css.card, ...css.cardAccent2 }}>
          <div style={css.sectionTitle}>Répartition budget mensuel</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={barData} layout="vertical" barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: T.t2 }} unit=" €" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: T.t2 }} width={100} />
              <Tooltip contentStyle={tooltipStyle} formatter={v => [fmt(v, 0) + " €"]} />
              <Bar dataKey="cost" fill={T.accent} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <hr style={css.divider} />
          <ResultRow label={"Terrain (" + frontline + " × " + r.frontPlan.price + " €)"} value={fmt(frontline * r.frontPlan.price, 0) + " €/m"} />
          <ResultRow label={"Bureautique (" + business + " × " + r.bizPlan.price + " €)"} value={fmt(business * r.bizPlan.price, 0) + " €/m"} />
          <ResultRow label={"Avancés (" + power + " × " + r.powerPlan.price + " €)"} value={fmt(power * r.powerPlan.price, 0) + " €/m"} />
          <hr style={css.divider} />
          <ResultRow label="Total mensuel" value={fmt(r.monthly, 0) + " €"} highlight />
          <ResultRow label="Total annuel" value={fmt(r.annual, 0) + " €"} highlight />
        </div>
      </div>
    </div>
  );
}

// ─── 4. Stockage ──────────────────────────────────────────────────────────────
function StorageCalc() {
  const [rawCapacity, setRawCapacity] = useState(230);
  const [raidLevel, setRaidLevel] = useState("raid6");
  const [dedupRatio, setDedupRatio] = useState(1);
  const [driveSize, setDriveSize] = useState(7.68);
  const [driveCount, setDriveCount] = useState(24);
  const [iopsTarget, setIopsTarget] = useState(50000);
  const [iopsPerDrive, setIopsPerDrive] = useState(350000);
  const [bwTarget, setBwTarget] = useState(25);

  const r = useMemo(() => {
    const RAID = { raid1: 0.5, raid5: (driveCount - 1) / driveCount, raid6: (driveCount - 2) / driveCount, raid10: 0.5, none: 1 };
    const overhead = RAID[raidLevel] || 1;
    const rawTotal = driveCount * driveSize;
    const usableRaw = rawTotal * overhead;
    const usableWithDedup = usableRaw * dedupRatio;
    const iopsAvail = driveCount * iopsPerDrive;
    const hotSpares = driveCount > 12 ? 2 : 1;
    const usableWithSpares = (driveCount - hotSpares) * driveSize * overhead * dedupRatio;
    const pctUsed = rawCapacity / usableWithDedup * 100;
    return {
      rawTotal, usableRaw, usableWithDedup, usableWithSpares, iopsAvail,
      hotSpares, overhead: overhead * 100, pctUsed,
      iopsOk: iopsAvail >= iopsTarget, capacityOk: usableWithDedup >= rawCapacity
    };
  }, [rawCapacity, raidLevel, dedupRatio, driveSize, driveCount, iopsTarget, iopsPerDrive]);

  const chartData = [
    { name: "Brut total", value: +r.rawTotal.toFixed(1) },
    { name: "Utile (RAID)", value: +r.usableRaw.toFixed(1) },
    { name: "Utile (dédup)", value: +r.usableWithDedup.toFixed(1) },
    { name: "Cible", value: rawCapacity },
  ];

  return (
    <div>
      <div style={css.grid4}>
        <KpiCard label="Capacité brute" value={fmt(r.rawTotal, 1) + " To"} />
        <KpiCard label="Capacité utile" value={fmt(r.usableWithDedup, 1) + " To"} color={r.capacityOk ? T.accent : T.warn} />
        <KpiCard label="IOPS disponibles" value={fmt(r.iopsAvail)} color={r.iopsOk ? T.t1 : T.warn} />
        <KpiCard label="Efficacité RAID" value={fmt(r.overhead, 0) + " %"} color={T.accent2} />
      </div>
      <div style={css.grid3}>
        <div style={{ ...css.card, ...css.cardAccent }}>
          <div style={css.sectionTitle}>Configuration baie</div>
          <NumField label="Capacité cible nette" value={rawCapacity} onChange={setRawCapacity} min={1} step={10} unit="To" note="Besoin réel après marge de croissance" />
          <NumField label="Nombre de disques" value={driveCount} onChange={setDriveCount} min={4} max={500} unit="disques" />
          <NumField label="Taille par disque" value={driveSize} onChange={setDriveSize} min={0.96} max={100} step={0.96} unit="To" note="NVMe : 3,84 / 7,68 / 15,36 To" />
          <SelectField label="Niveau RAID" value={raidLevel} onChange={setRaidLevel}
            options={[
              { value: "raid1", label: "RAID 1 (miroir, eff. 50%)" },
              { value: "raid5", label: "RAID 5 (N-1 parité)" },
              { value: "raid6", label: "RAID 6 (N-2 parités, recommandé)" },
              { value: "raid10", label: "RAID 10 (miroir+stripe, eff. 50%)" },
              { value: "none", label: "Sans RAID (raw)" },
            ]} />
          <NumField label="Ratio déduplication/compression" value={dedupRatio} onChange={setDedupRatio} min={1} max={10} step={0.1} unit="×" note="1 = pas de dédup" />
        </div>
        <div style={{ ...css.card, ...css.cardAccent2 }}>
          <div style={css.sectionTitle}>Performances IOPS</div>
          <NumField label="IOPS cibles" value={iopsTarget} onChange={setIopsTarget} min={1000} max={10000000} step={5000} unit="IOPS" note="CDC CESI : ≥ 50 000 IOPS" />
          <NumField label="IOPS par disque" value={iopsPerDrive} onChange={setIopsPerDrive} min={10000} max={2000000} step={50000} unit="IOPS/disque" note="NVMe SSD : 350 000 – 700 000 IOPS" />
          <NumField label="Bande passante cible" value={bwTarget} onChange={setBwTarget} min={1} max={400} unit="Gbps" note="CDC CESI : 25 Gbps minimum" />
          <hr style={css.divider} />
          {r.iopsOk
            ? <div style={css.okBox}><CheckCircle size={13} />IOPS suffisants</div>
            : <div style={css.alertBox}><AlertTriangle size={13} />IOPS insuffisants — ajouter des disques</div>}
          <ResultRow label="IOPS disponibles" value={fmt(r.iopsAvail)} highlight={r.iopsOk} warn={!r.iopsOk} />
          <ResultRow label="Ratio IOPS dispo/cible" value={fmt(r.iopsAvail / iopsTarget, 2) + " ×"} />
          <ResultRow label="Hot spare(s)" value={fmt(r.hotSpares) + " disque(s)"} />
          <ResultRow label="Utile avec hot spares" value={fmt(r.usableWithSpares, 1) + " To"} highlight={r.usableWithSpares >= rawCapacity} />
          <ResultRow label="Taux de remplissage" value={fmt(r.pctUsed, 1) + " %"} warn={r.pctUsed > 80} />
        </div>
        <div style={css.card}>
          <div style={css.sectionTitle}>Visualisation capacité</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} layout="vertical" barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: T.t2 }} unit=" To" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: T.t2 }} width={90} />
              <Tooltip contentStyle={tooltipStyle} formatter={v => [fmt(v, 1) + " To"]} />
              <Bar dataKey="value" fill={T.accent} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── 5. Veeam Backup ─────────────────────────────────────────────────────────
function VeeamCalc() {
  const [vms, setVms] = useState(50);
  const [vmSizeGb, setVmSizeGb] = useState(200);
  const [changeRate, setChangeRate] = useState(5);
  const [retention, setRetention] = useState(30);
  const [compRatio, setCompRatio] = useState(2);
  const [windowH, setWindowH] = useState(8);
  const [copies, setCopies] = useState(2);
  const [repoType, setRepoType] = useState("sobr");
  const [licType, setLicType] = useState("vul");

  const r = useMemo(() => {
    const srcTB = (vms * vmSizeGb) / 1024;
    const fullComp = srcTB / compRatio;
    const dailyInc = (srcTB * changeRate / 100) / compRatio;
    const incTotal = dailyInc * retention;
    const totalRepo = (fullComp + incTotal) * copies;
    const dataMoved = srcTB * changeRate / 100;
    const bwGbps = (dataMoved * 1024 * 8) / (windowH * 3600);
    const windowOk = bwGbps < 10;
    const repoMargin = totalRepo * 1.2;
    return { srcTB, fullComp, dailyInc, incTotal, totalRepo, repoMargin, bwGbps, windowOk };
  }, [vms, vmSizeGb, changeRate, retention, compRatio, windowH, copies]);

  const barData = [
    { name: "Full compressé", value: +r.fullComp.toFixed(2) },
    { name: "Incrémentaux", value: +r.incTotal.toFixed(2) },
    { name: "Total repo", value: +r.totalRepo.toFixed(2) },
    { name: "Repo +20%", value: +r.repoMargin.toFixed(2) },
  ];

  return (
    <div>
      <div style={css.infoBox}>
        <Info size={13} style={{ marginTop: 1, flexShrink: 0 }} />
        Veeam VBR v12 : sizing repo = Full compressé + (incrémentiaux × rétention) × copies. Ajouter 20% de marge opérationnelle.
      </div>
      <div style={css.grid4}>
        <KpiCard label="Données source" value={fmt(r.srcTB, 2) + " To"} />
        <KpiCard label="Stockage repo" value={fmt(r.repoMargin, 2) + " To"} color={T.accent} />
        <KpiCard label="Fenêtre backup" value={r.windowOk ? "OK" : "SERRÉ"} color={r.windowOk ? T.accent : T.warn} />
        <KpiCard label="Licences VMs" value={fmt(vms)} color={T.accent2} />
      </div>
      <div style={css.grid3}>
        <div style={{ ...css.card, ...css.cardAccent }}>
          <div style={css.sectionTitle}>Environnement source</div>
          <SliderField label="Nombre de VMs" min={1} max={1000} step={5} value={vms} onChange={setVms} />
          <NumField label="Taille moyenne / VM" value={vmSizeGb} onChange={setVmSizeGb} min={10} max={5000} step={10} unit="Go" />
          <SliderField label="Taux de changement journalier" min={1} max={30} value={changeRate} onChange={setChangeRate} display={changeRate + " %"} />
          <SliderField label="Rétention" min={7} max={365} step={7} value={retention} onChange={setRetention} display={retention + " jours"} />
          <SelectField label="Type de licence Veeam" value={licType} onChange={setLicType}
            options={[
              { value: "vul", label: "VUL (Universal License)" },
              { value: "socket", label: "Per-Socket" },
              { value: "vbr", label: "VBR Enterprise Plus" },
              { value: "baas", label: "BaaS (Cloud Connect)" },
            ]} />
        </div>
        <div style={{ ...css.card, ...css.cardAccent2 }}>
          <div style={css.sectionTitle}>Paramètres backup</div>
          <SelectField label="Ratio compression / dédup Veeam" value={String(compRatio)} onChange={v => setCompRatio(Number(v))}
            options={[
              { value: "1", label: "1:1 — aucune compression" },
              { value: "1.5", label: "1.5:1 — auto (dédup désactivée)" },
              { value: "2", label: "2:1 — optimal (recommandé)" },
              { value: "3", label: "3:1 — extrême" },
            ]} />
          <SliderField label="Fenêtre de backup" min={2} max={12} value={windowH} onChange={setWindowH} display={windowH + " h"} />
          <SliderField label="Copies (GFS / immuables)" min={1} max={5} value={copies} onChange={setCopies} />
          <SelectField label="Type de repo cible" value={repoType} onChange={setRepoType}
            options={[
              { value: "sobr", label: "SOBR (Scale-Out Backup Repo)" },
              { value: "s3", label: "Object Storage S3 / MinIO" },
              { value: "vcc", label: "Veeam Cloud Connect (BaaS)" },
              { value: "xfs", label: "Linux XFS + Immutable Backup" },
            ]} />
          <hr style={css.divider} />
          {r.windowOk
            ? <div style={css.okBox}><CheckCircle size={13} />Fenêtre de backup nominale</div>
            : <div style={css.alertBox}><AlertTriangle size={13} />Bande passante élevée — backup synthétique recommandé</div>}
          <ResultRow label="Données source" value={fmt(r.srcTB, 2) + " To"} />
          <ResultRow label="Full backup compressé" value={fmt(r.fullComp, 2) + " To"} />
          <ResultRow label="Incrémentaux (rétention)" value={fmt(r.incTotal, 2) + " To"} />
          <ResultRow label="Stockage repo total" value={fmt(r.totalRepo, 2) + " To"} highlight />
          <ResultRow label="Repo recommandé (+20%)" value={fmt(r.repoMargin, 2) + " To"} highlight />
          <ResultRow label="Bande passante backup" value={fmt(r.bwGbps, 3) + " Gbps"} warn={!r.windowOk} />
        </div>
        <div style={css.card}>
          <div style={css.sectionTitle}>Sizing repo</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} layout="vertical" barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: T.t2 }} unit=" To" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: T.t2 }} width={100} />
              <Tooltip contentStyle={tooltipStyle} formatter={v => [fmt(v, 2) + " To"]} />
              <Bar dataKey="value" fill={T.accent3} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 10, color: T.t3, marginTop: 8, fontFamily: "monospace" }}>
            Licence : {licType.toUpperCase()} · Repo : {repoType.toUpperCase()} · {copies} copie(s)
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────
const TOOLS = [
  { id: "vmware",   label: "VMware / VCF",      icon: Cpu,      section: "VIRTUALISATION", comp: VMwareCalc,  badge: "VVF / VCF",   sub: "VVF · VCF · Licence par cœur" },
  { id: "windows",  label: "Windows & SQL",      icon: Server,   section: "MICROSOFT",      comp: WindowsCalc, badge: "Microsoft",   sub: "Packs 2-cœurs · DC / STD" },
  { id: "m365",     label: "Microsoft 365",      icon: Cloud,    section: "MICROSOFT",      comp: M365Calc,    badge: "M365",        sub: "Sizing par profil utilisateur" },
  { id: "storage",  label: "Capacity Planning",  icon: HardDrive,section: "STOCKAGE",       comp: StorageCalc, badge: "Storage",     sub: "SAN · NAS · IOPS · RAID" },
  { id: "veeam",    label: "Veeam Backup",       icon: Shield,   section: "BACKUP",         comp: VeeamCalc,   badge: "Veeam v12",   sub: "VBR · Cloud Connect · BaaS" },
];

export default function SizingHub() {
  const [active, setActive] = useState("vmware");
  const [dark, setDark] = useState(true);
  const th = theme(dark);
  const tool = TOOLS.find(t => t.id === active);
  const ActiveComp = tool.comp;

  const sections = [...new Set(TOOLS.map(t => t.section))];

  return (
    <div style={css.root}>
      {/* Sidebar */}
      <div style={css.sidebar}>
        <div style={css.logo}>
          <div style={css.logoTitle}>SizingHub</div>
          <div style={css.logoSub}>v2.0 · Infrastructure Sizing</div>
        </div>
        {sections.map(section => (
          <div key={section}>
            <div style={css.navSection}>{section}</div>
            {TOOLS.filter(t => t.section === section).map(t => (
              <NavItem key={t.id} icon={t.icon} label={t.label} active={active === t.id} onClick={() => setActive(t.id)} />
            ))}
          </div>
        ))}
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={css.main}>
          <div style={css.topbar}>
            <div>
              <div style={css.pageTitle}>{tool.label}</div>
              <div style={css.pageSub}>{tool.sub}</div>
            </div>
            <div style={css.badge}>{tool.badge}</div>
          </div>
          <ActiveComp />
        </div>
      </div>
    </div>
  );
}
