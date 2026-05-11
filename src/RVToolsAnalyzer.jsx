import { useState, useCallback } from "react";
import * as XLSX from "xlsx";

// ─── Constantes sheets RVTools utilisées ───────────────────────────────────
const SHEETS = {
  vInfo:      "vInfo",
  vHost:      "vHost",
  vCPU:       "vCPU",
  vMemory:    "vMemory",
  vDatastore: "vDatastore",
  vDisk:      "vDisk",
  vSC_VMK:    "vSC_VMK",
  vPort:      "vPort",
  vSwitch:    "vSwitch",
  vNIC:       "vNIC",
  vSnapshot:  "vSnapshot",
  vCluster:   "vCluster",
};

// ─── Extraction SheetJS ────────────────────────────────────────────────────
function extractSheets(workbook) {
  const result = {};
  for (const [key, name] of Object.entries(SHEETS)) {
    if (workbook.SheetNames.includes(name)) {
      result[key] = XLSX.utils.sheet_to_json(workbook.Sheets[name], {
        defval: null,
        raw: false,
      });
    }
  }
  return result;
}

// ─── Prompt système ────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Tu es un analyseur d'infrastructure VMware expert.
À partir des données RVTools JSON fournies, génère UNIQUEMENT un objet JSON valide, sans texte autour, sans markdown, sans backticks.

Règles d'interprétation strictes :
- vMotion : cherche dans vSC_VMK les VMkernel dont le Port Group contient "vmotion" (case-insensitive). Si absent, tableau vide + insight warning.
- Statut datastore : sain <60%, warning 60-80%, critique >80% (utilisation = In Use MiB / Capacity MiB)
- Statut RAM host : ok <60%, warning 60-80%, critique >80%
- VM éteinte : colonne "Powerstate" = "poweredOff"
- VM inutilisée : éteinte ET (VMTools Running State != "guestToolsRunning" OU dernière date outils ancienne)
- Oversubscription CPU = total vCPUs alloués (vInfo) / total cores physiques (vHost, colonne "# CPU Cores")
- Oversubscription RAM = RAM totale allouée VMs poweredOn / RAM physique totale cluster
- Distribution OS : grouper par colonne "OS according to the VMware Tools" de vInfo
- Top VMs CPU : trier par "CPUs" décroissant dans vInfo (poweredOn uniquement), top 8
- Top VMs RAM : trier par "Memory" décroissant dans vInfo (poweredOn uniquement), top 8
- VMkernel Management : Port Group contient "management" (case-insensitive)
- VMkernel Storage : Port Group contient "iscsi" ou "nfs" ou "storage" (case-insensitive)
- VMkernel Autres : tout ce qui n'est ni Management, ni vMotion, ni Storage
- Pour les IPs et subnets, déduire le préfixe CIDR depuis le Subnet mask (255.255.255.0 = /24, etc.)
- snapshots : compter depuis vSnapshot, grouper par VM

Schéma JSON attendu (respecte exactement cette structure) :
{
  "cluster": {
    "hosts": number,
    "totalCpuCores": number,
    "totalRamGb": number,
    "vmsTotal": number,
    "vmsActive": number,
    "vmsOff": number,
    "vcpuAlloues": number,
    "ramAlloueeGb": number,
    "oversubCpu": number,
    "oversubRam": number,
    "vcpuPerVm": number,
    "ramPerVmGb": number,
    "cpuUsedPct": number,
    "ramUsedPct": number,
    "storageCapaciteTb": number,
    "storageLibreTb": number,
    "storageUsedPct": number
  },
  "hosts": [
    {
      "ip": string,
      "model": string,
      "cpuCores": number,
      "cpuUsedPct": number,
      "ramTotalGb": number,
      "ramUsedPct": number,
      "ramUsedGb": number,
      "vmCount": number,
      "status": "ok"|"warning"|"critique",
      "esxiVersion": string
    }
  ],
  "compute": {
    "topVmsCpu": [
      { "name": string, "os": string, "host": string, "vcpu": number, "statut": string }
    ]
  },
  "memory": {
    "topVmsRam": [
      { "name": string, "os": string, "host": string, "ramGb": number, "statut": string }
    ]
  },
  "storage": {
    "datastores": [
      {
        "name": string,
        "type": string,
        "capaciteGb": number,
        "utiliseGb": number,
        "libreGb": number,
        "usedPct": number,
        "hosts": number,
        "vms": number,
        "statut": "sain"|"warning"|"critique"
      }
    ]
  },
  "vms": {
    "distributionOs": [
      { "os": string, "count": number, "pct": number }
    ],
    "vmsEteintes": [
      {
        "name": string,
        "host": string,
        "vcpu": number,
        "ramGb": number,
        "derniereMaj": string,
        "vmtoolsActif": boolean
      }
    ],
    "snapshots": [
      { "vm": string, "host": string, "count": number, "oldestDays": number }
    ]
  },
  "network": {
    "vswitches": [
      {
        "name": string,
        "mtu": number,
        "jumboFrames": boolean,
        "portGroups": [{ "name": string, "vlan": number }]
      }
    ],
    "vmkernel": {
      "management": [
        { "device": string, "portGroup": string, "vlan": number|null, "ip": string, "subnet": string, "mtu": number }
      ],
      "vmotion": [],
      "storage": [],
      "autres": []
    },
    "insights": [
      { "type": "error"|"warning"|"info", "message": string }
    ]
  },
  "optimization": {
    "insights": [
      {
        "severity": "error"|"warning"|"info",
        "titre": string,
        "detail": string,
        "recommandation": string
      }
    ]
  }
}`;

// ─── Appel API Claude ──────────────────────────────────────────────────────
async function analyzeWithClaude(sheetsData) {
  // On envoie seulement un résumé des données pour éviter les gros payloads
  // On tronque chaque sheet à 200 lignes max
  const truncated = {};
  for (const [key, rows] of Object.entries(sheetsData)) {
    truncated[key] = Array.isArray(rows) ? rows.slice(0, 200) : rows;
  }

  const userMessage = `Voici les données RVTools extraites (JSON par sheet) :

${JSON.stringify(truncated, null, 2)}

Génère l'objet JSON d'analyse selon le schéma fourni.`;

  const response = await fetch("/api/anthropic", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) throw new Error(`API error: ${response.status}`);
  const data = await response.json();
  const text = data.content?.find(b => b.type === "text")?.text || "";
  
  // Nettoyage et parsing JSON
  const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(clean);
}

// ─── Sous-composants d'affichage ───────────────────────────────────────────

function StatCard({ label, value, sub, color = "#00d4aa" }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 8,
      padding: "14px 16px",
      flex: 1,
      minWidth: 120,
    }}>
      <div style={{ fontSize: 11, color: "#8899aa", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: "monospace" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "#556677", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ children, icon }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      fontSize: 12, fontWeight: 700, color: "#00d4aa",
      textTransform: "uppercase", letterSpacing: "0.08em",
      marginBottom: 12, paddingBottom: 8,
      borderBottom: "1px solid rgba(0,212,170,0.2)",
    }}>
      {icon && <span>{icon}</span>}
      {children}
    </div>
  );
}

function InsightBadge({ severity, titre, detail, recommandation }) {
  const colors = {
    error:   { bg: "rgba(255,80,80,0.08)",   border: "rgba(255,80,80,0.25)",   text: "#ff5555", icon: "🔴" },
    warning: { bg: "rgba(255,181,71,0.08)",  border: "rgba(255,181,71,0.25)",  text: "#ffb347", icon: "🟡" },
    info:    { bg: "rgba(0,212,170,0.06)",   border: "rgba(0,212,170,0.2)",    text: "#00d4aa", icon: "🔵" },
  };
  const c = colors[severity] || colors.info;
  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 6, padding: "10px 14px", marginBottom: 8,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 4 }}>
        {c.icon} {titre}
      </div>
      <div style={{ fontSize: 11, color: "#aabbcc", marginBottom: 4 }}>{detail}</div>
      {recommandation && (
        <div style={{ fontSize: 11, color: "#7788aa", fontStyle: "italic" }}>
          → {recommandation}
        </div>
      )}
    </div>
  );
}

function VMKernelTable({ title, rows, color = "#00d4aa" }) {
  if (!rows || rows.length === 0) {
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 6 }}>{title}</div>
        <div style={{
          fontSize: 11, color: "#556677", fontStyle: "italic",
          padding: "8px 12px", background: "rgba(255,255,255,0.02)",
          borderRadius: 4, border: "1px dashed rgba(255,255,255,0.06)"
        }}>
          Aucune interface détectée
        </div>
      </div>
    );
  }
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 6 }}>
        {title} <span style={{ color: "#556677", fontWeight: 400 }}>({rows.length})</span>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {["Device", "Port Group", "VLAN", "IP", "Subnet", "MTU"].map(h => (
              <th key={h} style={{ textAlign: "left", color: "#556677", padding: "4px 8px", fontWeight: 600 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <td style={{ padding: "5px 8px", color, fontFamily: "monospace" }}>{r.device}</td>
              <td style={{ padding: "5px 8px", color: "#cdd6e0" }}>{r.portGroup}</td>
              <td style={{ padding: "5px 8px", color: "#aabbcc", fontFamily: "monospace" }}>
                {r.vlan !== null && r.vlan !== undefined ? r.vlan : "—"}
              </td>
              <td style={{ padding: "5px 8px", color: "#cdd6e0", fontFamily: "monospace" }}>{r.ip}</td>
              <td style={{ padding: "5px 8px", color: "#8899aa" }}>{r.subnet}</td>
              <td style={{ padding: "5px 8px", color: "#8899aa" }}>{r.mtu}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DatastoreBar({ name, usedPct, capaciteGb, libreGb, vms, hosts, statut }) {
  const color = statut === "critique" ? "#ff5555" : statut === "warning" ? "#ffb347" : "#00d4aa";
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#cdd6e0" }}>{name}</span>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "#556677" }}>{vms} VMs · {hosts} hôtes</span>
          <span style={{ fontSize: 12, fontWeight: 700, color }}>{usedPct}%</span>
        </div>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${usedPct}%`, background: color, borderRadius: 3, transition: "width 0.6s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
        <span style={{ fontSize: 10, color: "#556677" }}>{(capaciteGb / 1024).toFixed(1)} To total</span>
        <span style={{ fontSize: 10, color: "#556677" }}>Libre : {(libreGb / 1024).toFixed(1)} To</span>
      </div>
    </div>
  );
}

// ─── Vue Overview ──────────────────────────────────────────────────────────
function OverviewTab({ data }) {
  const { cluster, optimization } = data;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* KPIs cluster */}
      <div>
        <SectionTitle icon="🖥️">Cluster Overview</SectionTitle>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <StatCard label="Hôtes" value={cluster.hosts} sub="nœuds physiques" />
          <StatCard label="CPU Total" value={`${cluster.totalCpuCores} cores`} sub={`${cluster.cpuUsedPct}% utilisé`} color="#4a9eff" />
          <StatCard label="RAM Total" value={`${cluster.totalRamGb} GB`} sub={`${cluster.ramUsedPct}% utilisée`} color="#9b59b6" />
          <StatCard label="VMs Actives" value={cluster.vmsActive} sub={`${cluster.vmsOff} éteintes`} color="#2ecc71" />
          <StatCard label="vCPU Alloués" value={cluster.vcpuAlloues} sub={`Ratio ${cluster.oversubCpu}:1`} color="#ffb347" />
          <StatCard label="RAM Allouée" value={`${cluster.ramAlloueeGb} GB`} sub={`Ratio ${cluster.oversubRam}:1`} color="#e67e22" />
        </div>
      </div>
      {/* Optimization insights */}
      {optimization?.insights?.length > 0 && (
        <div>
          <SectionTitle icon="⚡">Optimization Insights</SectionTitle>
          {optimization.insights.map((ins, i) => (
            <InsightBadge key={i} {...ins} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Vue Network ───────────────────────────────────────────────────────────
function NetworkTab({ data }) {
  const { network } = data;
  const vmk = network?.vmkernel || {};
  const vmkColors = {
    management: "#4a9eff",
    vmotion:    "#9b59b6",
    storage:    "#ffb347",
    autres:     "#8899aa",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Insights réseau */}
      {network?.insights?.length > 0 && (
        <div>
          <SectionTitle icon="⚠️">Insights Réseau</SectionTitle>
          {network.insights.map((ins, i) => (
            <InsightBadge key={i} severity={ins.type} titre={ins.message} />
          ))}
        </div>
      )}

      {/* VMkernel par catégorie */}
      <div>
        <SectionTitle icon="🔌">Interfaces VMkernel</SectionTitle>
        <VMKernelTable title="VMkernel Management" rows={vmk.management} color={vmkColors.management} />
        <VMKernelTable title="VMkernel vMotion"    rows={vmk.vmotion}    color={vmkColors.vmotion} />
        <VMKernelTable title="VMkernel Stockage"   rows={vmk.storage}    color={vmkColors.storage} />
        <VMKernelTable title="Autres"              rows={vmk.autres}     color={vmkColors.autres} />
      </div>

      {/* vSwitches */}
      {network?.vswitches?.length > 0 && (
        <div>
          <SectionTitle icon="🔀">vSwitches</SectionTitle>
          {network.vswitches.map((sw, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 6, padding: "12px 14px", marginBottom: 8,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#cdd6e0" }}>{sw.name}</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{
                    fontSize: 10, padding: "2px 8px", borderRadius: 10,
                    background: "rgba(255,255,255,0.06)", color: "#8899aa"
                  }}>MTU {sw.mtu}</span>
                  {sw.jumboFrames && (
                    <span style={{
                      fontSize: 10, padding: "2px 8px", borderRadius: 10,
                      background: "rgba(0,212,170,0.1)", color: "#00d4aa"
                    }}>Jumbo Frames</span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {sw.portGroups?.map((pg, j) => (
                  <span key={j} style={{
                    fontSize: 10, padding: "3px 8px", borderRadius: 4,
                    background: "rgba(74,158,255,0.1)", color: "#4a9eff",
                    border: "1px solid rgba(74,158,255,0.2)",
                  }}>
                    {pg.name} <span style={{ color: "#556677" }}>{pg.vlan}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Vue Storage ───────────────────────────────────────────────────────────
function StorageTab({ data }) {
  const { cluster, storage } = data;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <SectionTitle icon="💾">Capacité Globale</SectionTitle>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <StatCard label="Capacité Totale" value={`${cluster.storageCapaciteTb} To`} />
          <StatCard label="Espace Libre" value={`${cluster.storageLibreTb} To`} color="#2ecc71" />
          <StatCard label="Utilisation" value={`${cluster.storageUsedPct}%`}
            color={cluster.storageUsedPct > 80 ? "#ff5555" : cluster.storageUsedPct > 60 ? "#ffb347" : "#00d4aa"} />
        </div>
      </div>
      <div>
        <SectionTitle icon="📦">Datastores</SectionTitle>
        {storage?.datastores?.map((ds, i) => (
          <DatastoreBar key={i} {...ds} />
        ))}
      </div>
    </div>
  );
}

// ─── Vue VMs ───────────────────────────────────────────────────────────────
function VMsTab({ data }) {
  const { vms, cluster } = data;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Distribution OS */}
      <div>
        <SectionTitle icon="💿">Distribution OS ({cluster.vmsTotal} VMs)</SectionTitle>
        {vms?.distributionOs?.map((os, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 11, color: "#cdd6e0" }}>{os.os}</span>
              <span style={{ fontSize: 11, color: "#8899aa" }}>{os.count} VMs ({os.pct}%)</span>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
              <div style={{ height: "100%", width: `${os.pct}%`, background: "#4a9eff", borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>

      {/* VMs éteintes */}
      {vms?.vmsEteintes?.length > 0 && (
        <div>
          <SectionTitle icon="⏸️">VMs Éteintes ({vms.vmsEteintes.length})</SectionTitle>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Nom VM", "Host", "vCPU", "RAM", "Dernière MAJ"].map(h => (
                  <th key={h} style={{ textAlign: "left", color: "#556677", padding: "4px 8px", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vms.vmsEteintes.map((vm, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "5px 8px", color: "#cdd6e0" }}>{vm.name}</td>
                  <td style={{ padding: "5px 8px", color: "#8899aa", fontFamily: "monospace" }}>{vm.host}</td>
                  <td style={{ padding: "5px 8px", color: "#aabbcc" }}>{vm.vcpu}</td>
                  <td style={{ padding: "5px 8px", color: "#aabbcc" }}>{vm.ramGb} Go</td>
                  <td style={{ padding: "5px 8px", color: "#ff9966" }}>{vm.derniereMaj || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Snapshots */}
      {vms?.snapshots?.length > 0 && (
        <div>
          <SectionTitle icon="📷">Snapshots Détectés ({vms.snapshots.length})</SectionTitle>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["VM", "Host", "Nb Snapshots", "Plus ancien (j)"].map(h => (
                  <th key={h} style={{ textAlign: "left", color: "#556677", padding: "4px 8px", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vms.snapshots.map((s, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "5px 8px", color: "#cdd6e0" }}>{s.vm}</td>
                  <td style={{ padding: "5px 8px", color: "#8899aa", fontFamily: "monospace" }}>{s.host}</td>
                  <td style={{ padding: "5px 8px", color: "#ffb347", fontWeight: 700 }}>{s.count}</td>
                  <td style={{ padding: "5px 8px", color: s.oldestDays > 30 ? "#ff5555" : "#aabbcc" }}>{s.oldestDays}j</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Vue Compute ───────────────────────────────────────────────────────────
function ComputeTab({ data }) {
  const { cluster, compute, memory, hosts } = data;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <SectionTitle icon="⚙️">Compute Cluster</SectionTitle>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <StatCard label="Hôtes" value={cluster.hosts} sub="nœuds physiques" />
          <StatCard label="CPU Total" value={`${cluster.totalCpuCores} cores`} color="#4a9eff" />
          <StatCard label="vCPU Alloués" value={cluster.vcpuAlloues} sub={`Ratio ${cluster.oversubCpu}:1`} color="#ffb347" />
          <StatCard label="vCPU / VM" value={cluster.vcpuPerVm} color="#2ecc71" />
        </div>
      </div>

      {/* Hosts CPU */}
      {hosts?.length > 0 && (
        <div>
          <SectionTitle icon="🖥️">Utilisation CPU par Hôte</SectionTitle>
          {hosts.map((h, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: "#cdd6e0", fontFamily: "monospace" }}>{h.ip}</span>
                <span style={{ fontSize: 11, color: "#8899aa" }}>{h.cpuCores} cores physiques</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: h.cpuUsedPct > 80 ? "#ff5555" : h.cpuUsedPct > 60 ? "#ffb347" : "#00d4aa" }}>
                  {h.cpuUsedPct}%
                </span>
              </div>
              <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
                <div style={{
                  height: "100%", borderRadius: 3, transition: "width 0.6s ease",
                  width: `${h.cpuUsedPct}%`,
                  background: h.cpuUsedPct > 80 ? "#ff5555" : h.cpuUsedPct > 60 ? "#ffb347" : "#4a9eff"
                }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top VMs CPU */}
      {compute?.topVmsCpu?.length > 0 && (
        <div>
          <SectionTitle icon="🏆">Top VMs — CPU</SectionTitle>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["#", "VM / OS", "Host", "vCPU", "Statut"].map(h => (
                  <th key={h} style={{ textAlign: "left", color: "#556677", padding: "4px 8px", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compute.topVmsCpu.map((vm, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "5px 8px", color: "#556677" }}>{i + 1}</td>
                  <td style={{ padding: "5px 8px" }}>
                    <div style={{ color: "#cdd6e0", fontWeight: 600 }}>{vm.name}</div>
                    <div style={{ color: "#556677", fontSize: 10 }}>{vm.os}</div>
                  </td>
                  <td style={{ padding: "5px 8px", color: "#8899aa", fontFamily: "monospace" }}>{vm.host}</td>
                  <td style={{ padding: "5px 8px", color: "#ffb347", fontWeight: 700 }}>{vm.vcpu}</td>
                  <td style={{ padding: "5px 8px" }}>
                    <span style={{
                      fontSize: 10, padding: "2px 7px", borderRadius: 4,
                      background: vm.statut === "a_optimiser" ? "rgba(255,85,85,0.12)" : "rgba(0,212,170,0.08)",
                      color: vm.statut === "a_optimiser" ? "#ff5555" : "#00d4aa",
                      border: `1px solid ${vm.statut === "a_optimiser" ? "rgba(255,85,85,0.25)" : "rgba(0,212,170,0.2)"}`,
                    }}>
                      {vm.statut === "a_optimiser" ? "À optimiser" : "Standard"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Top VMs RAM */}
      {memory?.topVmsRam?.length > 0 && (
        <div>
          <SectionTitle icon="🏆">Top VMs — RAM</SectionTitle>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["#", "VM / OS", "Host", "RAM", "Statut"].map(h => (
                  <th key={h} style={{ textAlign: "left", color: "#556677", padding: "4px 8px", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {memory.topVmsRam.map((vm, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "5px 8px", color: "#556677" }}>{i + 1}</td>
                  <td style={{ padding: "5px 8px" }}>
                    <div style={{ color: "#cdd6e0", fontWeight: 600 }}>{vm.name}</div>
                    <div style={{ color: "#556677", fontSize: 10 }}>{vm.os}</div>
                  </td>
                  <td style={{ padding: "5px 8px", color: "#8899aa", fontFamily: "monospace" }}>{vm.host}</td>
                  <td style={{ padding: "5px 8px", color: "#9b59b6", fontWeight: 700 }}>{vm.ramGb} GB</td>
                  <td style={{ padding: "5px 8px" }}>
                    <span style={{
                      fontSize: 10, padding: "2px 7px", borderRadius: 4,
                      background: vm.statut === "ram_elevee" ? "rgba(155,89,182,0.12)" : "rgba(0,212,170,0.08)",
                      color: vm.statut === "ram_elevee" ? "#9b59b6" : "#00d4aa",
                      border: `1px solid ${vm.statut === "ram_elevee" ? "rgba(155,89,182,0.25)" : "rgba(0,212,170,0.2)"}`,
                    }}>
                      {vm.statut === "ram_elevee" ? "RAM élevée" : "Standard"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Composant principal ───────────────────────────────────────────────────
export default function RVToolsAnalyzer({ theme }) {
  const th = theme || {
    bg: "#0d1117", bg2: "#161b22", bg3: "#1c2333",
    t1: "#cdd6e0", t2: "#8899aa", t3: "#556677",
    accent: "#00d4aa", border: "rgba(255,255,255,0.07)",
  };

  const [step, setStep]           = useState("idle"); // idle | parsing | analyzing | done | error
  const [progress, setProgress]   = useState("");
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [dragging, setDragging]   = useState(false);

  const TABS = [
    { id: "overview", label: "Overview",  icon: "🏠" },
    { id: "compute",  label: "Compute",   icon: "⚙️" },
    { id: "storage",  label: "Storage",   icon: "💾" },
    { id: "vms",      label: "VMs",       icon: "💻" },
    { id: "network",  label: "Network",   icon: "🔌" },
  ];

  const processFile = useCallback(async (file) => {
    if (!file) return;
    setStep("parsing");
    setError(null);
    setResult(null);
    setProgress("Lecture du fichier RVTools...");

    try {
      // Lecture XLSX
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const availableSheets = workbook.SheetNames;
      
      setProgress(`${availableSheets.length} sheets détectées — extraction en cours...`);
      const sheetsData = extractSheets(workbook);
      const sheetCount = Object.keys(sheetsData).length;
      
      setStep("analyzing");
      setProgress(`${sheetCount} sheets extraites — analyse Claude en cours...`);
      
      const analysis = await analyzeWithClaude(sheetsData);
      
      setResult(analysis);
      setStep("done");
      setActiveTab("overview");
    } catch (err) {
      console.error("RVTools analysis error:", err);
      setError(err.message || "Erreur inconnue");
      setStep("error");
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const reset = () => { setStep("idle"); setResult(null); setError(null); };

  // ── Drop zone ──────────────────────────────────────────────────────────
  if (step === "idle" || step === "error") {
    return (
      <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: th.t1, marginBottom: 6 }}>
            Infrastructure Audit — RVTools
          </div>
          <div style={{ fontSize: 13, color: th.t2 }}>
            Uploadez un export RVTools (.xlsx) pour analyser automatiquement votre infrastructure VMware.
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          style={{
            border: `2px dashed ${dragging ? th.accent : "rgba(255,255,255,0.15)"}`,
            borderRadius: 12,
            padding: "48px 24px",
            textAlign: "center",
            background: dragging ? "rgba(0,212,170,0.04)" : "rgba(255,255,255,0.02)",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onClick={() => document.getElementById("rvtools-file-input").click()}
        >
          <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: th.t1, marginBottom: 8 }}>
            Glissez votre fichier RVTools ici
          </div>
          <div style={{ fontSize: 12, color: th.t2, marginBottom: 16 }}>
            ou cliquez pour sélectionner un fichier .xlsx
          </div>
          <div style={{
            display: "inline-block", padding: "8px 20px",
            background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.3)",
            borderRadius: 6, fontSize: 12, color: th.accent, cursor: "pointer",
          }}>
            Choisir un fichier
          </div>
          <input
            id="rvtools-file-input"
            type="file"
            accept=".xlsx,.xls"
            style={{ display: "none" }}
            onChange={handleFileInput}
          />
        </div>

        {/* Sheets utilisées */}
        <div style={{ marginTop: 20, padding: 16, background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: th.t2, marginBottom: 8 }}>Sheets analysées :</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {Object.values(SHEETS).map(s => (
              <span key={s} style={{
                fontSize: 10, padding: "2px 8px", borderRadius: 4,
                background: "rgba(74,158,255,0.08)", color: "#4a9eff",
                border: "1px solid rgba(74,158,255,0.15)",
              }}>{s}</span>
            ))}
          </div>
        </div>

        {/* Erreur */}
        {step === "error" && (
          <div style={{
            marginTop: 16, padding: 14, borderRadius: 8,
            background: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.25)",
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#ff5555", marginBottom: 4 }}>❌ Erreur d'analyse</div>
            <div style={{ fontSize: 11, color: th.t2 }}>{error}</div>
          </div>
        )}
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────
  if (step === "parsing" || step === "analyzing") {
    return (
      <div style={{ padding: 24, maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 20, animation: "spin 2s linear infinite" }}>⚙️</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: th.t1, marginBottom: 8 }}>
          {step === "parsing" ? "Lecture du fichier..." : "Analyse en cours..."}
        </div>
        <div style={{ fontSize: 12, color: th.t2 }}>{progress}</div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Résultats ──────────────────────────────────────────────────────────
  if (step === "done" && result) {
    return (
      <div style={{ padding: "16px 24px", maxWidth: 1100, margin: "0 auto" }}>
        {/* Topbar résultats */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 20, paddingBottom: 16,
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: th.t1 }}>Audit Infrastructure</div>
            <div style={{ fontSize: 11, color: th.t2 }}>
              {result.cluster.hosts} hôtes · {result.cluster.vmsTotal} VMs · {result.cluster.totalCpuCores} cores · {result.cluster.totalRamGb} GB
            </div>
          </div>
          <button
            onClick={reset}
            style={{
              padding: "6px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
              color: th.t2,
            }}
          >
            ↑ Nouvel import
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: 0 }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "8px 16px", fontSize: 12, cursor: "pointer", border: "none",
                borderBottom: activeTab === tab.id ? `2px solid ${th.accent}` : "2px solid transparent",
                background: "transparent",
                color: activeTab === tab.id ? th.accent : th.t2,
                fontWeight: activeTab === tab.id ? 700 : 400,
                transition: "all 0.15s",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Contenu tab actif */}
        <div>
          {activeTab === "overview" && <OverviewTab data={result} />}
          {activeTab === "compute"  && <ComputeTab  data={result} />}
          {activeTab === "storage"  && <StorageTab  data={result} />}
          {activeTab === "vms"      && <VMsTab      data={result} />}
          {activeTab === "network"  && <NetworkTab  data={result} />}
        </div>
      </div>
    );
  }

  return null;
}