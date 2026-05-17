import { useEffect, useMemo, useState } from "react";

const defaultTh = {
  cardBg: "#fff",
  inputBg: "#f8fafc",
  border: "#e5e7eb",
  accent: "#2563eb",
  t1: "#0f172a",
  t2: "#475569",
  t3: "#94a3b8",
  alertBoxBg: "#fff7ed",
  alertBoxBorder: "#fed7aa",
  alertBoxColor: "#c2410c",
};

const VMWARE_PLANS = {
  ent: { label: "vSphere Enterprise Plus", perCore: 150.99 },
  vvf: { label: "vSphere Foundation (VVF)", perCore: 190.99 },
  vcf: { label: "Cloud Foundation (VCF)", perCore: 381.2 },
};

const PROXMOX_PLANS = {
  community: { label: "Community", perSocket: 120 },
  basic: { label: "Basic", perSocket: 370 },
  standard: { label: "Standard", perSocket: 550 },
  premium: { label: "Premium", perSocket: 1100 },
};

const XCPNG_PLANS = {
  essentialp: { label: "Essential+", flatYear: 4000, perHost: null },
  pro: { label: "Pro", flatYear: null, perHost: 1000 },
  enterprise: { label: "Enterprise", flatYear: null, perHost: 1800 },
};

const XOSTOR = {
  essentialp: { flatYear: 2400, perHost: null },
  pro: { flatYear: null, perHost: 800 },
  enterprise: { flatYear: null, perHost: 1200 },
};

const EASYVIRT = {
  essentialp: { flatYear: 1500, perHost: null },
  pro: { flatYear: null, perHost: 500 },
  enterprise: { flatYear: null, perHost: 700 },
};

const FEATURES = [
  { id: "ha", label: "Cluster HA" },
  { id: "livemig", label: "Live Migration / vMotion" },
  { id: "drs", label: "DRS / Load Balancing automatique" },
  { id: "vsan", label: "vSAN / Stockage HCI" },
  { id: "nsx", label: "NSX / Microsegmentation" },
  { id: "snap", label: "Snapshots VM" },
  { id: "repl", label: "Réplication native" },
  { id: "backup", label: "Backup intégré" },
  { id: "gpu", label: "GPU passthrough" },
  { id: "k8s", label: "Kubernetes" },
];

const MATRIX = {
  ha: {
    label: "Cluster HA",
    vmw: ["ok", "natif"],
    prox: ["ok", "natif"],
    xcp: ["ok", "natif"],
  },
  livemig: {
    label: "Live Migration",
    vmw: ["ok", "vMotion"],
    prox: ["ok", "natif"],
    xcp: ["ok", "XenMotion"],
  },
  drs: {
    label: "DRS / Équilibrage",
    vmw: ["ok", "avancé"],
    prox: ["partial", "Proxcenter"],
    xcp: ["partial", "XO LB"],
  },
  vsan: {
    label: "Stockage HCI",
    vmw: ["ok", "vSAN"],
    prox: ["ok", "Ceph"],
    xcp: ["ok", "Xostor"],
  },
  backup: {
    label: "Backup intégré",
    vmw: ["partial", "VADP"],
    prox: ["ok", "PBS"],
    xcp: ["ok", "XO Backup"],
  },
  repl: {
    label: "Réplication",
    vmw: ["ok", "SRM"],
    prox: ["ok", "natif"],
    xcp: ["partial", "Essential+"],
  },
  nsx: {
    label: "NSX / Réseau SDN",
    vmw: ["ok", "NSX"],
    prox: ["partial", "SDN"],
    xcp: ["partial", "OVS"],
  },
  snap: {
    label: "Snapshots VM",
    vmw: ["ok", "natif"],
    prox: ["ok", "natif"],
    xcp: ["ok", "natif"],
  },
  gpu: {
    label: "GPU passthrough",
    vmw: ["ok", "natif"],
    prox: ["partial", "validation"],
    xcp: ["partial", "validation"],
  },
  k8s: {
    label: "Kubernetes",
    vmw: ["ok", "Tanzu"],
    prox: ["partial", "externe"],
    xcp: ["partial", "externe"],
  },
  capacity: {
    label: "Capacity planning",
    vmw: ["partial", "vROps $$$"],
    prox: ["none", "—"],
    xcp: ["ok", "EasyVirt"],
  },
  green: {
    label: "GreenOps / CO₂",
    vmw: ["none", "—"],
    prox: ["none", "—"],
    xcp: ["ok", "EasyVirt"],
  },
  sovereign: {
    label: "Souveraineté FR",
    vmw: ["none", "—"],
    prox: ["none", "—"],
    xcp: ["ok", "Vates"],
  },
};

const fmt = (n) => Number.isFinite(n) ? n.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €" : "—";
const pct = (target, ref) => ref > 0 ? Math.round(((ref - target) / ref) * 100) : 0;
const autoXcp = (nodes) => nodes >= 4 ? "enterprise" : nodes >= 3 ? "pro" : "essentialp";

function Status({ s }) {
  if (s === "ok") return <span style={{ color: "#22c55e", fontWeight: 900 }}>✓</span>;
  if (s === "partial") return <span style={{ color: "#f59e0b", fontWeight: 900 }}>⚠️</span>;
  return <span style={{ color: "#ef4444", fontWeight: 900 }}>✕</span>;
}

function Badge({ children, color, bg }) {
  return (
    <span style={{
      display: "inline-flex",
      padding: "3px 9px",
      borderRadius: 999,
      background: bg,
      color,
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: ".02em",
    }}>
      {children}
    </span>
  );
}

function Select({ value, onChange, children, th }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        height: 34,
        padding: "0 10px",
        borderRadius: 8,
        border: `1px solid ${th.border}`,
        background: th.inputBg,
        color: th.t1,
        fontSize: 12,
        outline: "none",
      }}
    >
      {children}
    </select>
  );
}

function Check({ checked, onChange, label, sub, th }) {
  return (
    <label style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 7,
      padding: "6px 8px",
      borderRadius: 8,
      border: `1px solid ${checked ? "#bfdbfe" : th.border}`,
      background: checked ? "#eff6ff" : "#fff",
      cursor: "pointer",
      fontSize: 12,
      color: th.t1,
    }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ marginTop: 1 }} />
      <span>
        <strong>{label}</strong>
        {sub && <span style={{ display: "block", color: th.t3, fontSize: 10, marginTop: 2 }}>{sub}</span>}
      </span>
    </label>
  );
}

function HvCard({ hv, th, activeIds }) {
  return (
    <div style={{
      background: th.cardBg,
      border: `1px solid ${th.border}`,
      borderRadius: 14,
      overflow: "hidden",
      minHeight: 720,
      display: "flex",
      flexDirection: "column",
    }}>
      <div style={{ padding: 16, borderBottom: `1px solid ${th.border}`, background: hv.bg }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ fontSize: 34, lineHeight: 1 }}>{hv.logo}</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: hv.color }}>{hv.title}</div>
        </div>
        <Badge color={hv.color} bg={hv.badgeBg}>{hv.badge}</Badge>
      </div>

      <div style={{ padding: 16, borderBottom: `1px solid ${th.border}` }}>
        <div style={{ fontSize: 10, color: th.t3, fontWeight: 800, textTransform: "uppercase", marginBottom: 6 }}>Édition</div>
        {hv.selector}
        <div style={{ fontSize: 10, color: th.t3, fontWeight: 800, textTransform: "uppercase", marginTop: 14, marginBottom: 6 }}>Add-ons</div>
        {hv.addons}
      </div>

      <div style={{ padding: 16, borderBottom: `1px solid ${th.border}` }}>
        <div style={{ fontSize: 10, color: th.t3, fontWeight: 800, textTransform: "uppercase" }}>Coût annuel</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: hv.color, marginTop: 4 }}>
          {fmt(hv.annual)}<span style={{ fontSize: 14, fontWeight: 500, color: th.t2 }}> /an</span>
        </div>
        <div style={{ fontSize: 11, color: th.t3, marginTop: 3 }}>{hv.detail}</div>

        <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: hv.bg, border: `1px solid ${hv.softBorder}` }}>
          <div style={{ fontSize: 10, color: th.t3, fontWeight: 800, textTransform: "uppercase" }}>TCO 3 ans</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: hv.color }}>{fmt(hv.tco)}</div>
        </div>

        {hv.saving > 0 && (
          <div style={{
            display: "inline-flex",
            marginTop: 10,
            padding: "5px 10px",
            borderRadius: 999,
            background: "rgba(34,197,94,.12)",
            color: "#16a34a",
            fontSize: 12,
            fontWeight: 900,
          }}>
            −{hv.saving}% · {fmt(hv.savingValue)} économisés
          </div>
        )}
      </div>

      <div style={{ padding: 16, flex: 1 }}>
        <div style={{ fontSize: 10, color: th.t3, fontWeight: 800, textTransform: "uppercase", marginBottom: 8 }}>Fonctionnalités couvertes</div>
        {activeIds.map((id) => {
          const item = MATRIX[id];
          const [s, note] = item[hv.key];
          return (
            <div key={id} style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              alignItems: "center",
              gap: 10,
              padding: "6px 0",
              borderBottom: `1px solid ${th.border}`,
              fontSize: 12,
            }}>
              <span style={{ color: th.t2 }}>{item.label}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: th.t3 }}>
                <Status s={s} /> {note}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ padding: 16, borderTop: `1px solid ${th.border}` }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "68px 1fr",
          gap: 12,
          alignItems: "center",
          padding: 12,
          background: "#f8fafc",
          border: `1px solid ${th.border}`,
          borderRadius: 12,
        }}>
          <div style={{
            width: 54,
            height: 54,
            borderRadius: "50%",
            border: `6px solid ${hv.color}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            color: hv.color,
          }}>
            {hv.fit}%
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, color: th.t1 }}>FIT INFRASTRUCTURE</div>
            <div style={{ fontSize: 12, color: th.t2 }}>{hv.fitText}</div>
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
          <span style={{ color: th.t3, fontWeight: 800, textTransform: "uppercase" }}>Risque migration</span>
          <span style={{ color: hv.riskColor, fontWeight: 900 }}>● {hv.risk}</span>
        </div>
        <div style={{ marginTop: 6, fontSize: 11, color: th.t3 }}>{hv.riskText}</div>
      </div>
    </div>
  );
}

export default function HyperCost({ th: incomingTh, isMobile = false }) {
  const th = { ...defaultTh, ...(incomingTh || {}) };

  const [nodes, setNodes] = useState(6);
  const [sockets, setSockets] = useState(2);
  const [cores, setCores] = useState(16);
  const [memory, setMemory] = useState(256);
  const [years, setYears] = useState(3);

  const [vmwarePlan, setVmwarePlan] = useState("ent");
  const [proxPlan, setProxPlan] = useState("premium");
  const [xcpPlan, setXcpPlan] = useState(autoXcp(nodes));

  const [addProxcenter, setAddProxcenter] = useState(true);
  const [addXostor, setAddXostor] = useState(true);
  const [addEasyVirt, setAddEasyVirt] = useState(true);

  const [features, setFeatures] = useState({
    ha: true,
    livemig: true,
    drs: true,
    vsan: true,
    nsx: true,
    snap: true,
    repl: true,
    backup: true,
    gpu: true,
    k8s: false,
  });

  useEffect(() => setXcpPlan(autoXcp(nodes)), [nodes]);
  useEffect(() => { if (features.vsan) setAddXostor(true); }, [features.vsan]);

  const activeIds = Object.keys(features).filter((k) => features[k]);

  const calc = useMemo(() => {
    const totalSockets = nodes * sockets;
    const realCores = totalSockets * cores;
    const billable = totalSockets * Math.max(cores, 16);
    const phantom = billable - realCores;

    const vmwAnnual = billable * VMWARE_PLANS[vmwarePlan].perCore;
    const proxAnnual = totalSockets * PROXMOX_PLANS[proxPlan].perSocket + (addProxcenter ? 250 : 0);

    const xcpBase = XCPNG_PLANS[xcpPlan].flatYear || nodes * XCPNG_PLANS[xcpPlan].perHost;
    const xostorCost = addXostor ? (XOSTOR[xcpPlan].flatYear || nodes * XOSTOR[xcpPlan].perHost) : 0;
    const easyCost = addEasyVirt ? (EASYVIRT[xcpPlan].flatYear || nodes * EASYVIRT[xcpPlan].perHost) : 0;
    const xcpAnnual = xcpBase + xostorCost + easyCost;

    return {
      totalSockets,
      realCores,
      billable,
      phantom,
      vmwAnnual,
      proxAnnual,
      xcpAnnual,
      vmwTco: vmwAnnual * years,
      proxTco: proxAnnual * years,
      xcpTco: xcpAnnual * years,
      xostorCost,
      easyCost,
    };
  }, [nodes, sockets, cores, years, vmwarePlan, proxPlan, xcpPlan, addProxcenter, addXostor, addEasyVirt]);

  const maxTco = Math.max(calc.vmwTco, calc.proxTco, calc.xcpTco);
  const proxSaving = pct(calc.proxTco, calc.vmwTco);
  const xcpSaving = pct(calc.xcpTco, calc.vmwTco);

  const solutions = [
    {
      key: "vmw",
      logo: "▣",
      title: "VMware",
      color: "#f97316",
      bg: "#fff7ed",
      badgeBg: "#ffedd5",
      softBorder: "#fed7aa",
      badge: "Compatibilité maximale",
      selector: (
        <Select value={vmwarePlan} onChange={setVmwarePlan} th={th}>
          {Object.entries(VMWARE_PLANS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </Select>
      ),
      addons: <div style={{ color: th.t3, fontSize: 12, fontStyle: "italic" }}>Aucun add-on sélectionné</div>,
      annual: calc.vmwAnnual,
      tco: calc.vmwTco,
      saving: 0,
      savingValue: 0,
      detail: `${calc.billable} cœurs × ${VMWARE_PLANS[vmwarePlan].perCore} €`,
      fit: 96,
      fitText: "Parfaitement aligné avec vos besoins",
      risk: "Faible",
      riskColor: "#16a34a",
      riskText: "Continuité assurée, aucune rupture d’exploitation.",
    },
    {
      key: "prox",
      logo: "✕",
      title: "Proxmox VE",
      color: "#22c55e",
      bg: "#f0fdf4",
      badgeBg: "#dcfce7",
      softBorder: "#bbf7d0",
      badge: "Meilleur coût / fonctionnalités",
      selector: (
        <Select value={proxPlan} onChange={setProxPlan} th={th}>
          {Object.entries(PROXMOX_PLANS).map(([k, v]) => <option key={k} value={k}>{v.label} — {v.perSocket} €/socket</option>)}
        </Select>
      ),
      addons: (
        <Check
          checked={addProxcenter}
          onChange={() => setAddProxcenter(!addProxcenter)}
          label="Proxcenter (DRS-like)"
          sub="250 €/an · équilibrage auto"
          th={th}
        />
      ),
      annual: calc.proxAnnual,
      tco: calc.proxTco,
      saving: proxSaving,
      savingValue: calc.vmwTco - calc.proxTco,
      detail: `${calc.totalSockets} sockets × ${PROXMOX_PLANS[proxPlan].perSocket} €${addProxcenter ? " + Proxcenter" : ""}`,
      fit: features.nsx ? 81 : 86,
      fitText: "Bon alignement · quelques écarts fonctionnels",
      risk: "Moyen",
      riskColor: "#f59e0b",
      riskText: "Apprentissage et intégration à anticiper.",
    },
    {
      key: "xcp",
      logo: "Λ",
      title: "XCP-ng",
      color: "#8b5cf6",
      bg: "#faf5ff",
      badgeBg: "#ede9fe",
      softBorder: "#ddd6fe",
      badge: "Éditeur souverain FR 🇫🇷",
      selector: (
        <Select value={xcpPlan} onChange={setXcpPlan} th={th}>
          {Object.entries(XCPNG_PLANS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label} — {v.flatYear ? `${v.flatYear} €/an` : `${v.perHost} €/host`}
            </option>
          ))}
        </Select>
      ),
      addons: (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Check checked={addXostor} onChange={() => setAddXostor(!addXostor)} label="Xostor (HCI)" sub={`${calc.xostorCost || 0} €/an`} th={th} />
          <Check checked={addEasyVirt} onChange={() => setAddEasyVirt(!addEasyVirt)} label="EasyVirt (Capacity & GreenOps)" sub={`${calc.easyCost || 0} €/an`} th={th} />
        </div>
      ),
      annual: calc.xcpAnnual,
      tco: calc.xcpTco,
      saving: xcpSaving,
      savingValue: calc.vmwTco - calc.xcpTco,
      detail: `${nodes} hosts · ${XCPNG_PLANS[xcpPlan].label} + add-ons`,
      fit: addEasyVirt ? 74 : 69,
      fitText: "Alignement partiel · tests recommandés",
      risk: "Moyen",
      riskColor: "#f59e0b",
      riskText: "Écosystème différent, validation projet conseillée.",
    },
  ];

  return (
    <div style={{ fontFamily: "Inter, sans-serif", color: th.t1 }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900 }}>HyperCost — Comparateur d’hyperviseurs</h1>
        <p style={{ margin: "5px 0 0", color: th.t2, fontSize: 14 }}>Projetez vos coûts et comparez les fonctionnalités pour faire le meilleur choix.</p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "280px 1fr 380px",
        gap: 16,
        alignItems: "start",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: th.cardBg, border: `1px solid ${th.border}`, borderRadius: 14, padding: 16 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 13 }}>▦ Environnement actuel</h3>
            {[
              ["Nombre de nœuds", nodes, setNodes],
              ["Mémoire par serveur", memory, setMemory],
            ].map(([label, val, setter]) => (
              <label key={label} style={{ display: "block", marginBottom: 12, fontSize: 11, color: th.t3 }}>
                {label}
                <input
                  type="number"
                  value={val}
                  onChange={(e) => setter(Number(e.target.value))}
                  style={{ marginTop: 5, width: "100%", height: 34, borderRadius: 8, border: `1px solid ${th.border}`, background: th.inputBg, padding: "0 10px" }}
                />
              </label>
            ))}
            <label style={{ display: "block", marginBottom: 12, fontSize: 11, color: th.t3 }}>
              Sockets / nœud
              <Select value={String(sockets)} onChange={(v) => setSockets(Number(v))} th={th}>
                <option value="1">1 socket</option>
                <option value="2">2 sockets</option>
              </Select>
            </label>
            <label style={{ display: "block", fontSize: 11, color: th.t3 }}>
              Cœurs physiques / socket
              <Select value={String(cores)} onChange={(v) => setCores(Number(v))} th={th}>
                {[8, 12, 16, 24, 32, 48].map((c) => <option key={c} value={c}>{c} cœurs</option>)}
              </Select>
            </label>
          </div>

          <div style={{ background: th.cardBg, border: `1px solid ${th.border}`, borderRadius: 14, padding: 16 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 13 }}>⚙️ Fonctionnalités utilisées</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {FEATURES.map((f) => (
                <Check key={f.id} checked={features[f.id]} onChange={() => setFeatures((x) => ({ ...x, [f.id]: !x[f.id] }))} label={f.label} th={th} />
              ))}
            </div>
            {calc.phantom > 0 && (
              <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: th.alertBoxBg, border: `1px solid ${th.alertBoxBorder}`, color: th.alertBoxColor, fontSize: 12 }}>
                ⚠️ Broadcom : {calc.phantom} cœurs fantômes facturés.
              </div>
            )}
          </div>

          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 14, padding: 16 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 13, color: "#2563eb" }}>📊 Résumé matériel</h3>
            {[
              ["Nœuds", nodes],
              ["Sockets / nœud", sockets],
              ["Cœurs réels / socket", cores],
              ["Cœurs facturés / socket", Math.max(cores, 16)],
              ["Total sockets", calc.totalSockets],
              ["Total cœurs facturés", calc.billable],
            ].map(([a, b]) => (
              <div key={a} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${th.border}`, fontSize: 12 }}>
                <span style={{ color: th.t2 }}>{a}</span><strong>{b}</strong>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 12 }}>
          {solutions.map((s) => <HvCard key={s.title} hv={s} th={th} activeIds={activeIds} />)}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: th.cardBg, border: `1px solid ${th.border}`, borderRadius: 14, padding: 16 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 13 }}>💰 Résumé financier — TCO 3 ans</h3>
            {solutions.map((s) => (
              <div key={s.title} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                  <span>{s.title}</span><strong>{fmt(s.tco)}</strong>
                </div>
                <div style={{ height: 10, borderRadius: 999, background: "#f1f5f9", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.max(5, s.tco / maxTco * 100)}%`, background: s.color }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: "#ecfdf5", border: "1px solid #bbf7d0", color: "#047857", fontSize: 13, fontWeight: 800 }}>
              Économie maximale : {fmt(calc.vmwTco - Math.min(calc.proxTco, calc.xcpTco))}
            </div>
          </div>

          <div style={{ background: th.cardBg, border: `1px solid ${th.border}`, borderRadius: 14, padding: 16 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 13 }}>🔍 Matrice fonctionnelle complète</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 55px 55px 55px", fontSize: 11, color: th.t3, fontWeight: 800, paddingBottom: 8, borderBottom: `1px solid ${th.border}` }}>
              <span>Fonctionnalité</span><span>VMw</span><span>Prox</span><span>XCP</span>
            </div>
            {Object.entries(MATRIX).map(([id, f]) => (
              <div key={id} style={{
                display: "grid",
                gridTemplateColumns: "1fr 55px 55px 55px",
                gap: 4,
                fontSize: 12,
                padding: "8px 0",
                borderBottom: `1px solid ${th.border}`,
                opacity: activeIds.includes(id) || ["capacity", "green", "sovereign"].includes(id) ? 1 : .35,
              }}>
                <span>{f.label}</span>
                <span><Status s={f.vmw[0]} /></span>
                <span><Status s={f.prox[0]} /></span>
                <span><Status s={f.xcp[0]} /></span>
              </div>
            ))}
            <div style={{ marginTop: 10, fontSize: 11, color: th.t3 }}>✓ Natif · ⚠️ Partiel · ✕ Absent</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, background: th.cardBg, border: "1px solid #bfdbfe", borderRadius: 14, padding: 18 }}>
        <h3 style={{ margin: "0 0 12px", color: "#2563eb" }}>🎯 Recommandation finale</h3>
        <p style={{ margin: "0 0 14px", color: th.t2, fontSize: 13 }}>
          Sur la base de votre environnement ({nodes} nœuds · {calc.totalSockets} sockets), chaque solution peut répondre à vos besoins avec des compromis différents.
          Économie potentielle sur 3 ans : <strong style={{ color: "#16a34a" }}>jusqu’à {fmt(calc.vmwTco - Math.min(calc.proxTco, calc.xcpTco))}</strong>.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 12 }}>
          {[
            ["VMware", "#f97316", "Continuité maximale, compatibilité native, faible risque, coût élevé."],
            ["Proxmox", "#22c55e", "Meilleur ROI, Ceph/PBS, idéal si l’équipe maîtrise Linux et open source."],
            ["XCP-ng", "#8b5cf6", "Souveraineté FR, Xen Orchestra, EasyVirt, bon compromis stratégique."],
          ].map(([t, c, d]) => (
            <div key={t} style={{ padding: 14, borderRadius: 12, border: `1px solid ${c}55`, background: `${c}10` }}>
              <div style={{ color: c, fontWeight: 900, marginBottom: 8 }}>{t}</div>
              <div style={{ fontSize: 12, color: th.t2 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
