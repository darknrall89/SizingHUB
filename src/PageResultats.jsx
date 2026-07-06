import React, { useMemo } from "react";
import {
  BarChart2,
  CalendarDays,
  ChevronRight,
  Cpu,
  Edit3,
  Euro,
  Info,
  Layers,
  Scale,
  ShieldCheck,
  TrendingUp,
  Trophy,
  AlertTriangle,
} from "lucide-react";

/**
 * PageResultats.jsx
 *
 * Page de résultats HyperCost.
 *
 * Pré-requis dans le même fichier / même scope :
 * - calcTCO(hvId, sizing, features, years, hasWinEA)
 * - calcScore(hvId, features)
 * - recommendLicense(hvId, sizing, features, hasWinEA)
 * - LICENSES
 * - FEATURES
 * - LOGOS
 * - HV_META
 *
 * Props :
 * {
 *   sizing,
 *   features,
 *   years,
 *   hasWinEA,
 *   onBack,
 *   onOpenDetail,
 *   onShowFinance,
 * }
 */

const HYPERVISORS = ["vmware", "proxmox", "hyperv", "xcpng"];

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function formatCurrency(value) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatPercent(value) {
  return `${Math.round(Number(value || 0))}%`;
}

function getAccentClasses(accent = "blue") {
  const map = {
    blue: {
      text: "text-blue-700 dark:text-blue-300",
      bg: "bg-blue-600",
      lightBg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-200 dark:border-blue-900/60",
      progress: "bg-blue-600 dark:bg-blue-400",
      button:
        "border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900/60 dark:text-blue-300 dark:hover:bg-blue-950/30",
    },
    orange: {
      text: "text-orange-700 dark:text-orange-300",
      bg: "bg-orange-500",
      lightBg: "bg-orange-50 dark:bg-orange-950/30",
      border: "border-orange-200 dark:border-orange-900/60",
      progress: "bg-orange-500 dark:bg-orange-400",
      button:
        "border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-900/60 dark:text-orange-300 dark:hover:bg-orange-950/30",
    },
    violet: {
      text: "text-violet-700 dark:text-violet-300",
      bg: "bg-violet-600",
      lightBg: "bg-violet-50 dark:bg-violet-950/30",
      border: "border-violet-200 dark:border-violet-900/60",
      progress: "bg-violet-600 dark:bg-violet-400",
      button:
        "border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-900/60 dark:text-violet-300 dark:hover:bg-violet-950/30",
    },
    green: {
      text: "text-green-700 dark:text-green-300",
      bg: "bg-green-600",
      lightBg: "bg-green-50 dark:bg-green-950/30",
      border: "border-green-200 dark:border-green-900/60",
      progress: "bg-green-600 dark:bg-green-400",
      button:
        "border-green-200 text-green-700 hover:bg-green-50 dark:border-green-900/60 dark:text-green-300 dark:hover:bg-green-950/30",
    },
    slate: {
      text: "text-slate-700 dark:text-slate-300",
      bg: "bg-slate-700",
      lightBg: "bg-slate-50 dark:bg-slate-900",
      border: "border-slate-200 dark:border-slate-800",
      progress: "bg-slate-600 dark:bg-slate-400",
      button:
        "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900",
    },
    gray: {
      text: "text-slate-700 dark:text-slate-300",
      bg: "bg-slate-700",
      lightBg: "bg-slate-50 dark:bg-slate-900",
      border: "border-slate-200 dark:border-slate-800",
      progress: "bg-slate-600 dark:bg-slate-400",
      button:
        "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900",
    },
  };

  return map[accent] || map.blue;
}

function getLicenseObject(hvId, licId) {
  const list = LICENSES?.[hvId] || [];
  return list.find((lic) => lic.id === licId) || null;
}

function getShortLabel(hvId) {
  const label = HV_META?.[hvId]?.label || hvId;
  if (hvId === "hyperv") return "Hyper-V";
  if (hvId === "proxmox") return "Proxmox";
  if (hvId === "xcpng") return "XCP-ng";
  if (hvId === "vmware") return "VMware";
  return label;
}

function getAttentionText(hvId, data, hasWinEA) {
  if (hvId === "vmware") return "⚠ Coûts élevés et variables";
  if (hvId === "hyperv" && hasWinEA) return "Hypothèse EA/SPLA requise";
  if (hvId === "hyperv") return "Dépendance Windows Server";
  if (hvId === "proxmox") {
    return data.tco.addons?.length ? "Add-ons nécessaires selon besoins" : "Écosystème plus jeune";
  }
  if (hvId === "xcpng") {
    return data.tco.addons?.length ? "Add-ons nécessaires selon design" : "Adoption plus limitée";
  }
  return "À valider selon contexte";
}

function getBadgeForHv(hvId, winners, hasWinEA) {
  if (hvId === "vmware") {
    return {
      label: "Référence",
      cls:
        "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300",
    };
  }

  if (hvId === winners.bestCost) {
    return {
      label: hvId === "hyperv" && hasWinEA ? "Meilleur coût (EA)" : "Meilleur coût",
      cls:
        "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300",
    };
  }

  if (hvId === winners.bestCompromise) {
    return {
      label: "Meilleur compromis",
      cls:
        "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-300",
    };
  }

  if (hvId === winners.bestCompatibility) {
    return {
      label: "Meilleure compatibilité",
      cls:
        "border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300",
    };
  }

  return null;
}

function Stepper() {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="inline-flex h-9 items-center rounded-full border border-slate-200 bg-white px-4 font-semibold text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
        1 Qualification
      </span>
      <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-700" />
      <span className="inline-flex h-9 items-center rounded-full border border-blue-600 bg-blue-600 px-4 font-bold text-white shadow-sm shadow-blue-600/20">
        2 Résultats
      </span>
    </div>
  );
}

function ContextChip({ icon: Icon, label }) {
  return (
    <span className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
      <Icon className="h-4 w-4 text-blue-600 dark:text-blue-300" />
      {label}
    </span>
  );
}

function ProgressBar({ value, accent = "blue", showValue = true }) {
  const a = getAccentClasses(accent);
  const safeValue = Math.max(0, Math.min(100, Number(value || 0)));

  return (
    <div className="flex items-center gap-3">
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={cn("h-full rounded-full transition-all", a.progress)}
          style={{ width: `${safeValue}%` }}
        />
      </div>
      {showValue && (
        <span className={cn("w-11 text-right text-sm font-bold", a.text)}>
          {formatPercent(safeValue)}
        </span>
      )}
    </div>
  );
}

function Logo({ hvId, className = "" }) {
  const src = LOGOS?.[hvId];

  return (
    <img
      src={src}
      alt={HV_META?.[hvId]?.label || hvId}
      className={cn("object-contain object-left", className)}
      onError={(event) => {
        event.currentTarget.style.display = "none";
      }}
    />
  );
}

function SectionTitle({ children, subtitle }) {
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
        {children}
      </h2>
      {subtitle && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sublabel, color = "blue" }) {
  const styles = {
    blue: {
      wrapper: "border-blue-200 bg-blue-50/60 dark:border-blue-900/60 dark:bg-blue-950/25",
      icon: "bg-blue-600 text-white",
      value: "text-blue-700 dark:text-blue-300",
    },
    green: {
      wrapper:
        "border-green-200 bg-green-50/60 dark:border-green-900/60 dark:bg-green-950/25",
      icon: "bg-green-600 text-white",
      value: "text-green-700 dark:text-green-300",
    },
    violet: {
      wrapper:
        "border-violet-200 bg-violet-50/60 dark:border-violet-900/60 dark:bg-violet-950/25",
      icon: "bg-violet-600 text-white",
      value: "text-violet-700 dark:text-violet-300",
    },
  }[color];

  return (
    <div className={cn("rounded-2xl border p-5 shadow-sm", styles.wrapper)}>
      <div className="flex items-center gap-5">
        <div
          className={cn(
            "flex h-16 w-16 shrink-0 items-center justify-center rounded-full",
            styles.icon
          )}
        >
          <Icon className="h-9 w-9" />
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {label}
          </p>
          <p className={cn("mt-1 text-2xl font-bold", styles.value)}>
            {value}
          </p>
          {sublabel && (
            <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-400">
              {sublabel}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function HypervisorCard({ data, winners, hasWinEA, years, vmwareTCO, onOpenDetail }) {
  const { hvId, tco, score, lic } = data;
  const meta = HV_META?.[hvId] || {};
  const accent = meta.accent || "blue";
  const a = getAccentClasses(accent);
  const badge = getBadgeForHv(hvId, winners, hasWinEA);
  const saving =
    hvId !== "vmware" && vmwareTCO > 0 && tco.total < vmwareTCO
      ? Math.round((1 - tco.total / vmwareTCO) * 100)
      : null;

  return (
    <div
      className={cn(
        "flex min-h-[330px] flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-950",
        meta.border || a.border
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-3 px-5 py-4",
          meta.header || a.lightBg
        )}
      >
        <Logo hvId={hvId} className="h-10 max-w-[170px]" />
        {badge && (
          <span
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-xs font-bold",
              badge.cls
            )}
          >
            {badge.label}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Licence proposée par l’outil
          </p>
          <p className="mt-1 text-sm font-bold text-slate-950 dark:text-white">
            {lic?.label || tco.licId}
          </p>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Compatibilité fonctionnelle
            </p>
          </div>
          <ProgressBar value={score} accent={accent} />
        </div>

        <div className="mt-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            TCO {years} ans
          </p>
          <p className={cn("mt-1 text-3xl font-bold", a.text)}>
            {formatCurrency(tco.total)}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {formatCurrency(tco.annual)}/an
          </p>

          {saving !== null && (
            <p className="mt-2 text-sm font-bold text-green-700 dark:text-green-300">
              -{saving}% vs VMware
            </p>
          )}
        </div>

        <div className="mt-4 space-y-2">
          {hvId === "vmware" && (
            <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-300">
              <AlertTriangle className="h-4 w-4" />
              Warning Broadcom : tarifs variables
            </div>
          )}

          {tco.addons?.map((addon) => (
            <div
              key={addon.label}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
            >
              + {addon.label}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onOpenDetail?.(hvId)}
          className={cn(
            "mt-auto flex h-11 items-center justify-center rounded-lg border text-sm font-bold transition",
            meta.btn || a.button
          )}
        >
          Voir le détail
          <ChevronRight className="ml-2 h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function SyntheticTable({ data, years, hasWinEA }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <h3 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">
        Comparatif synthétique
      </h3>

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full min-w-[980px] table-fixed text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900">
              <th className="w-[180px] border-r border-slate-200 px-4 py-3 text-left font-bold text-slate-800 dark:border-slate-800 dark:text-slate-200">
                Critère
              </th>
              {data.map((item) => (
                <th
                  key={item.hvId}
                  className="border-r border-slate-200 px-4 py-3 last:border-r-0 dark:border-slate-800"
                >
                  <div className="flex justify-center">
                    <Logo hvId={item.hvId} className="h-7 max-w-[130px]" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            <tr>
              <td className="border-r border-slate-200 px-4 py-3 font-bold text-slate-800 dark:border-slate-800 dark:text-slate-200">
                Licence
              </td>
              {data.map((item) => (
                <td
                  key={item.hvId}
                  className="border-r border-slate-200 px-4 py-3 text-center text-slate-700 last:border-r-0 dark:border-slate-800 dark:text-slate-300"
                >
                  {item.lic?.label || item.tco.licId}
                </td>
              ))}
            </tr>

            <tr>
              <td className="border-r border-slate-200 px-4 py-3 font-bold text-slate-800 dark:border-slate-800 dark:text-slate-200">
                TCO {years} ans
              </td>
              {data.map((item) => {
                const a = getAccentClasses(HV_META?.[item.hvId]?.accent);
                return (
                  <td
                    key={item.hvId}
                    className={cn(
                      "border-r border-slate-200 px-4 py-3 text-center font-bold last:border-r-0 dark:border-slate-800",
                      a.text
                    )}
                  >
                    {formatCurrency(item.tco.total)}
                  </td>
                );
              })}
            </tr>

            <tr>
              <td className="border-r border-slate-200 px-4 py-3 font-bold text-slate-800 dark:border-slate-800 dark:text-slate-200">
                Compatibilité
              </td>
              {data.map((item) => (
                <td
                  key={item.hvId}
                  className="border-r border-slate-200 px-4 py-3 last:border-r-0 dark:border-slate-800"
                >
                  <ProgressBar
                    value={item.score}
                    accent={HV_META?.[item.hvId]?.accent}
                  />
                </td>
              ))}
            </tr>

            <tr>
              <td className="border-r border-slate-200 px-4 py-3 font-bold text-slate-800 dark:border-slate-800 dark:text-slate-200">
                Add-ons
              </td>
              {data.map((item) => (
                <td
                  key={item.hvId}
                  className="border-r border-slate-200 px-4 py-3 text-center text-slate-700 last:border-r-0 dark:border-slate-800 dark:text-slate-300"
                >
                  {item.tco.addons?.length
                    ? item.tco.addons.map((addon) => addon.label).join(" · ")
                    : "—"}
                </td>
              ))}
            </tr>

            <tr>
              <td className="border-r border-slate-200 px-4 py-3 font-bold text-slate-800 dark:border-slate-800 dark:text-slate-200">
                Point d’attention
              </td>
              {data.map((item) => {
                const text = getAttentionText(item.hvId, item, hasWinEA);
                const critical =
                  item.hvId === "vmware" ||
                  (item.hvId === "hyperv" && hasWinEA) ||
                  item.tco.addons?.length > 0;

                return (
                  <td
                    key={item.hvId}
                    className="border-r border-slate-200 px-4 py-3 text-center text-slate-700 last:border-r-0 dark:border-slate-800 dark:text-slate-300"
                  >
                    <span
                      className={cn(
                        "inline-flex items-center justify-center gap-1",
                        critical && "text-orange-700 dark:text-orange-300"
                      )}
                    >
                      {critical && <AlertTriangle className="h-4 w-4" />}
                      {text}
                    </span>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PageResultats({
  sizing,
  features,
  years,
  hasWinEA,
  onBack,
  onOpenDetail,
  onShowFinance,
}) {
  const results = useMemo(() => {
    const base = HYPERVISORS.map((hvId) => {
      const tco = calcTCO(hvId, sizing, features, years, hasWinEA);
      const score = calcScore(hvId, features);
      const licId = recommendLicense(hvId, sizing, features, hasWinEA);
      const lic = getLicenseObject(hvId, licId || tco.licId);

      return {
        hvId,
        tco,
        score,
        lic,
      };
    });

    const maxTCO = Math.max(...base.map((item) => item.tco.total), 1);
    const minTCO = Math.min(...base.map((item) => item.tco.total));
    const maxScore = Math.max(...base.map((item) => item.score));
    const vmwareTCO =
      base.find((item) => item.hvId === "vmware")?.tco.total || 0;

    const enriched = base.map((item) => ({
      ...item,
      compositeScore: Math.round(item.score * 0.6 - (item.tco.total / maxTCO) * 40),
    }));

    const bestCost = enriched.find((item) => item.tco.total === minTCO)?.hvId;
    const bestCompatibility = enriched.find((item) => item.score === maxScore)?.hvId;
    const bestCompromise = [...enriched].sort(
      (a, b) => b.compositeScore - a.compositeScore
    )[0]?.hvId;

    return {
      data: enriched,
      maxTCO,
      minTCO,
      maxScore,
      vmwareTCO,
      bestCost,
      bestCompatibility,
      bestCompromise,
      bestCostItem: enriched.find((item) => item.hvId === bestCost),
      bestCompatibilityItem: enriched.find((item) => item.hvId === bestCompatibility),
      bestCompromiseItem: enriched.find((item) => item.hvId === bestCompromise),
    };
  }, [sizing, features, years, hasWinEA]);

  const summaryText = useMemo(() => {
    const bestCostName = getShortLabel(results.bestCost);
    const bestCompatibilityName = getShortLabel(results.bestCompatibility);
    const vmwareTCO = results.vmwareTCO;
    const bestCostTCO = results.bestCostItem?.tco.total || 0;
    const savingVsVmware =
      results.bestCost !== "vmware" && vmwareTCO > 0
        ? Math.round((1 - bestCostTCO / vmwareTCO) * 100)
        : 0;

    const parts = [];

    if (results.bestCost) {
      parts.push(
        `${bestCostName} présente le meilleur coût estimé${
          savingVsVmware > 0 ? ` avec ${savingVsVmware}% d’économie vs VMware` : ""
        }.`
      );
    }

    if (
      results.bestCompatibility &&
      results.bestCompatibility !== results.bestCost
    ) {
      parts.push(
        `${bestCompatibilityName} offre la meilleure compatibilité fonctionnelle (${formatPercent(
          results.maxScore
        )}).`
      );
    }

    if (hasWinEA) {
      parts.push(
        "Le contexte EA/SPLA améliore significativement le positionnement économique d’Hyper-V."
      );
    }

    parts.push(
      `${getShortLabel(results.bestCompromise)} ressort comme meilleur compromis coût / couverture selon le score composite.`
    );

    return parts.join(" ");
  }, [results, hasWinEA]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      {/* 1. En-tête page résultats */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-[1800px] px-7 py-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <TrendingUp className="h-9 w-9" />
              </div>

              <div>
                <h1 className="text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
                  HyperCost
                </h1>
                <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
                  Comparateur neutre de coûts et de couverture fonctionnelle hyperviseur
                </p>
              </div>
            </div>

            <Stepper />
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="mx-auto flex max-w-[1800px] flex-col gap-4 px-7 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <ContextChip icon={BarChart2} label={`${sizing.nodes} nœuds`} />
              <ContextChip icon={Layers} label={`${sizing.sockets} sockets`} />
              <ContextChip
                icon={Cpu}
                label={`${sizing.coresPerSocket} cœurs/socket`}
              />
              <ContextChip icon={CalendarDays} label={`${years} ans`} />
              <ContextChip icon={Euro} label="Devise : EUR" />
            </div>

            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              <Edit3 className="h-4 w-4" />
              Modifier
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1800px] px-7 py-8">
        {/* 2. Sous-titre section résultats */}
        <section className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
              <BarChart2 className="h-9 w-9" />
            </div>

            <SectionTitle
              subtitle={`4 hyperviseurs analysés selon vos besoins fonctionnels (${features.length} fonctionnalités sélectionnées) et votre contexte de licences`}
            >
              Résultats — Comparaison neutre hyperviseurs
            </SectionTitle>
          </div>

          <div className="max-w-[620px] rounded-2xl border border-violet-100 bg-violet-50 px-5 py-4 text-sm leading-6 text-violet-900 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-200">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-violet-600 dark:text-violet-300" />
              <p>
                Les coûts sont des estimations indicatives basées sur les tarifs
                publics et peuvent varier selon les remises et accords contractuels.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Synthèse KPIs */}
        <section className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
          <KpiCard
            icon={Trophy}
            label="Meilleur coût"
            value={getShortLabel(results.bestCost)}
            sublabel={formatCurrency(results.bestCostItem?.tco.total)}
            color="blue"
          />

          <KpiCard
            icon={ShieldCheck}
            label="Meilleure compatibilité"
            value={getShortLabel(results.bestCompatibility)}
            sublabel={formatPercent(results.bestCompatibilityItem?.score)}
            color="green"
          />

          <KpiCard
            icon={Scale}
            label="Meilleur compromis"
            value={getShortLabel(results.bestCompromise)}
            sublabel="Coût / couverture équilibré"
            color="violet"
          />
        </section>

        {/* 4. Barre synthèse automatique */}
        <section className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-blue-950 shadow-sm dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-100">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-300" />
            <p className="text-sm leading-6">
              <span className="font-bold">Synthèse automatique :</span>{" "}
              {summaryText}
            </p>
          </div>
        </section>

        {/* 5. Cartes hyperviseurs */}
        <section className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2 2xl:grid-cols-4">
          {results.data.map((item) => (
            <HypervisorCard
              key={item.hvId}
              data={item}
              winners={results}
              hasWinEA={hasWinEA}
              years={years}
              vmwareTCO={results.vmwareTCO}
              onOpenDetail={onOpenDetail}
            />
          ))}
        </section>

        {/* 6. Tableau comparatif synthétique */}
        <section className="mb-7">
          <SyntheticTable data={results.data} years={years} hasWinEA={hasWinEA} />
        </section>

        {/* 7. Bouton résumé financier */}
        <section className="flex flex-col items-center justify-center">
          <button
            type="button"
            onClick={onShowFinance}
            className="inline-flex items-center gap-3 rounded-2xl bg-slate-950 px-7 py-4 text-sm font-bold text-white shadow-lg shadow-slate-950/10 transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            <TrendingUp className="h-5 w-5" />
            Voir le résumé financier complet
          </button>

          <p className="mt-4 text-center text-sm italic text-slate-500 dark:text-slate-400">
            Les prix et estimations sont fournis à titre indicatif et n'ont pas
            de valeur contractuelle.
          </p>
        </section>
      </main>
    </div>
  );
}
