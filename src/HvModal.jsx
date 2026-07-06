import React from "react";
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  CircleAlert,
  CircleDollarSign,
  CircleHelp,
  CircleUserRound,
  Info,
  Layers,
  Scale,
  ServerCog,
  Settings,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";

/**
 * HvModal.jsx
 *
 * Modale générique de détail hyperviseur pour HyperCost.
 *
 * Dépendances :
 * - React
 * - Tailwind CSS
 * - lucide-react
 *
 * Toutes les données viennent des props.
 * Aucune donnée métier n'est hardcodée dans le composant.
 */

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
      ring: "ring-blue-100 dark:ring-blue-950/40",
      progress: "bg-blue-600 dark:bg-blue-400",
    },
    orange: {
      text: "text-orange-700 dark:text-orange-300",
      bg: "bg-orange-600",
      lightBg: "bg-orange-50 dark:bg-orange-950/30",
      border: "border-orange-200 dark:border-orange-900/60",
      ring: "ring-orange-100 dark:ring-orange-950/40",
      progress: "bg-orange-500 dark:bg-orange-400",
    },
    violet: {
      text: "text-violet-700 dark:text-violet-300",
      bg: "bg-violet-600",
      lightBg: "bg-violet-50 dark:bg-violet-950/30",
      border: "border-violet-200 dark:border-violet-900/60",
      ring: "ring-violet-100 dark:ring-violet-950/40",
      progress: "bg-violet-600 dark:bg-violet-400",
    },
    green: {
      text: "text-green-700 dark:text-green-300",
      bg: "bg-green-600",
      lightBg: "bg-green-50 dark:bg-green-950/30",
      border: "border-green-200 dark:border-green-900/60",
      ring: "ring-green-100 dark:ring-green-950/40",
      progress: "bg-green-600 dark:bg-green-400",
    },
    slate: {
      text: "text-slate-700 dark:text-slate-300",
      bg: "bg-slate-700",
      lightBg: "bg-slate-50 dark:bg-slate-900",
      border: "border-slate-200 dark:border-slate-800",
      ring: "ring-slate-100 dark:ring-slate-900",
      progress: "bg-slate-600 dark:bg-slate-400",
    },
    gray: {
      text: "text-slate-700 dark:text-slate-300",
      bg: "bg-slate-700",
      lightBg: "bg-slate-50 dark:bg-slate-900",
      border: "border-slate-200 dark:border-slate-800",
      ring: "ring-slate-100 dark:ring-slate-900",
      progress: "bg-slate-600 dark:bg-slate-400",
    },
  };

  return map[accent] || map.blue;
}

function getFeatureCoverage(feature, hvId) {
  return feature?.coverage?.[hvId] || feature?.support?.[hvId] || "none";
}

function getFeatureSolution(feature, hvId) {
  return (
    feature?.editors?.[hvId] ||
    feature?.solutions?.[hvId] ||
    feature?.solution?.[hvId] ||
    "—"
  );
}

function CoverageCell({ coverage }) {
  if (coverage === "ok" || coverage === "native" || coverage === "natif") {
    return (
      <span className="inline-flex items-center gap-2 font-semibold text-green-700 dark:text-green-300">
        <CheckCircle2 className="h-4 w-4" />
        Natif
      </span>
    );
  }

  if (coverage === "partial" || coverage === "partiel") {
    return (
      <span className="inline-flex items-center gap-2 font-semibold text-orange-600 dark:text-orange-300">
        <CircleAlert className="h-4 w-4" />
        Partiel
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 font-semibold text-red-600 dark:text-red-300">
      <XCircle className="h-4 w-4" />
      Non disponible
    </span>
  );
}

function ImpactCell({ coverage }) {
  const normalized =
    coverage === "ok" || coverage === "native" || coverage === "natif"
      ? "native"
      : coverage === "partial" || coverage === "partiel"
      ? "partial"
      : "none";

  const cfg = {
    native: {
      dot: "bg-green-500",
      text: "Faible",
      cls: "text-slate-600 dark:text-slate-300",
    },
    partial: {
      dot: "bg-orange-500",
      text: "Moyen",
      cls: "text-slate-600 dark:text-slate-300",
    },
    none: {
      dot: "bg-red-500",
      text: "Élevé",
      cls: "text-slate-600 dark:text-slate-300",
    },
  }[normalized];

  return (
    <span className={cn("inline-flex items-center gap-2", cfg.cls)}>
      <span className={cn("h-2 w-2 rounded-full", cfg.dot)} />
      {cfg.text}
    </span>
  );
}

function AddonIcon({ label = "" }) {
  const lower = label.toLowerCase();

  if (lower.includes("scvmm") || lower.includes("manager")) {
    return <ServerCog className="h-7 w-7 text-slate-500 dark:text-slate-400" />;
  }

  if (lower.includes("drs") || lower.includes("load")) {
    return <Layers className="h-7 w-7 text-slate-500 dark:text-slate-400" />;
  }

  return <Box className="h-7 w-7 text-slate-500 dark:text-slate-400" />;
}

function getAddonExplanation(addon) {
  if (addon?.explanation) return addon.explanation;

  const label = String(addon?.label || "").toLowerCase();

  if (label.includes("scvmm")) {
    return "SCVMM est nécessaire pour l’équilibrage de charge avancé et la gestion centralisée.";
  }

  if (label.includes("drs")) {
    return "Cet add-on est nécessaire pour couvrir le besoin d’équilibrage de charge automatique.";
  }

  if (label.includes("xostor") || label.includes("linstor")) {
    return "Cet add-on est nécessaire pour fournir une couche de stockage distribué compatible avec ce design.";
  }

  return "Cet add-on est nécessaire pour couvrir les fonctionnalités sélectionnées dans la simulation.";
}

function ScoreProgress({ score, accent }) {
  const a = getAccentClasses(accent);
  const value = Math.max(0, Math.min(100, Number(score || 0)));

  return (
    <div className="flex items-center gap-4">
      <div className="h-2.5 w-64 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={cn("h-full rounded-full transition-all", a.progress)}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={cn("text-lg font-bold", a.text)}>{formatPercent(value)}</span>
    </div>
  );
}

function LogoImg({ src, alt, className }) {
  return (
    <img
      src={src}
      alt={alt}
      className={cn("object-contain object-left", className)}
      onError={(event) => {
        event.currentTarget.style.display = "none";
      }}
    />
  );
}

export default function HvModal({
  hvId,
  meta,
  tco,
  score,
  scoreDetail,
  lic,
  saving,
  vmwareTCO,
  years,
  hasWinEA,
  features,
  synthesis,
  hypothesis,
  microsegWarning,
  firewallOptions,
  FEATURES,
  LOGOS,
  HV_COLORS,
  onClose,
}) {
  const accent = getAccentClasses(meta?.accent);
  const logoSrc = LOGOS?.[hvId];
  const selectedFeatures = (FEATURES || []).filter((feature) =>
    features?.includes(feature.id)
  );

  const savedAmount =
    saving && vmwareTCO && tco?.total
      ? Math.max(Number(vmwareTCO || 0) - Number(tco.total || 0), 0)
      : 0;

  const isVmware = hvId === "vmware";
  const scoreNative = Number(scoreDetail?.full || 0);
  const scorePartial = Number(scoreDetail?.part || 0);
  const scoreNone = Number(scoreDetail?.none || 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Détail ${meta?.label || hvId}`}
    >
      <div
        className="max-h-[90vh] w-full max-w-[860px] overflow-y-auto rounded-[28px] bg-white shadow-2xl ring-1 ring-slate-900/10 dark:bg-slate-950 dark:ring-white/10"
        onClick={(event) => event.stopPropagation()}
      >
        {/* 1. En-tête */}
        <header className="flex items-center justify-between gap-5 border-b border-slate-200 px-7 py-6 dark:border-slate-800">
          <div className="flex min-w-0 flex-1 items-center gap-5">
            <div className="flex h-12 w-[130px] shrink-0 items-center">
              <LogoImg
                src={logoSrc}
                alt={meta?.label || hvId}
                className="max-h-10 max-w-[130px]"
              />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                {lic?.label || meta?.label}
              </h2>
              <div className="mt-3">
                <ScoreProgress score={score} accent={meta?.accent} />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-900 dark:hover:text-slate-200"
            aria-label="Fermer"
          >
            <X className="h-6 w-6" />
          </button>
        </header>

        <div className="space-y-6 px-7 py-6">
          {/* 2. Bandeau synthèse */}
          {synthesis && (
            <section className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-blue-950 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-100">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-300" />
                <p className="text-sm leading-6">{synthesis}</p>
              </div>
            </section>
          )}

          {/* 3. Deux colonnes */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Colonne gauche */}
            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Licence proposée par l'outil
              </h3>

              <div
                className={cn(
                  "relative rounded-2xl border bg-white p-5 ring-4 dark:bg-slate-950",
                  accent.border,
                  accent.ring
                )}
              >
                <span className="absolute left-5 top-4 rounded-md bg-blue-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                  Recommandée
                </span>

                <div className="mt-9 flex items-center gap-5">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <LogoImg
                      src={logoSrc}
                      alt={meta?.label || hvId}
                      className="max-h-12 max-w-12"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={cn("text-xl font-bold leading-snug", accent.text)}>
                      {lic?.label}
                    </p>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      {lic?.note}
                    </p>
                  </div>

                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white",
                      accent.bg
                    )}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                </div>
              </div>

              {tco?.addons?.length > 0 && (
                <div className="mt-4 space-y-3">
                  {tco.addons.map((addon, index) => (
                    <div
                      key={`${addon.label}-${index}`}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                          <AddonIcon label={addon.label} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-slate-950 dark:text-white">
                              {addon.label}
                            </p>
                            <span className="rounded-md border border-orange-200 bg-orange-50 px-2 py-1 text-xs font-bold uppercase text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-300">
                              Nécessaire
                            </span>
                          </div>

                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {addon.detail}
                          </p>
                        </div>

                        <p className="shrink-0 text-right text-sm font-bold text-slate-950 dark:text-white">
                          {formatCurrency(addon.pricePerYear)}/an
                        </p>
                      </div>

                      <div className="mt-4 border-t border-slate-200 pt-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                        <div className="flex items-start gap-3">
                          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                          <p>{getAddonExplanation(addon)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Colonne droite */}
            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Détail financier
              </h3>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">
                      Licence / an
                    </span>
                    <span className="font-bold text-slate-950 dark:text-white">
                      {formatCurrency(tco?.licAnnual)}
                    </span>
                  </div>

                  <div className="flex justify-between border-t border-slate-100 pt-4 text-sm dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">
                      Add-ons / an
                    </span>
                    <span className="font-bold text-slate-950 dark:text-white">
                      {formatCurrency(tco?.addonAnnual)}
                    </span>
                  </div>

                  <div className="flex justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                    <span className="text-base text-slate-500 dark:text-slate-400">
                      Total / an
                    </span>
                    <span className={cn("text-3xl font-bold", accent.text)}>
                      {formatCurrency(tco?.annual)}
                    </span>
                  </div>

                  <div className="flex justify-between border-t border-slate-200 pt-5 dark:border-slate-800">
                    <span className="text-base text-slate-500 dark:text-slate-400">
                      TCO {years} ans
                    </span>
                    <span className="text-3xl font-bold text-slate-950 dark:text-white">
                      {formatCurrency(tco?.total)}
                    </span>
                  </div>
                </div>

                {tco?.licDetail && (
                  <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300">
                    <div className="flex items-start gap-2">
                      <Info className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{tco.licDetail}</span>
                    </div>
                  </div>
                )}

                {saving > 0 && (
                  <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-4 text-green-800 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
                        <CircleDollarSign className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-lg font-bold">
                          Économie de {saving}%
                        </p>
                        <p className="text-sm">
                          Soit {formatCurrency(savedAmount)} vs VMware sur {years} ans
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {isVmware && (
                  <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-4 text-orange-800 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-300">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                      <p className="text-sm">
                        Tarifs susceptibles d’évoluer selon le bundle, les remises
                        et les conditions contractuelles applicables.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 4. Bloc score détaillé */}
          <section className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white",
                  accent.bg
                )}
              >
                <CircleUserRound className="h-8 w-8" />
              </div>

              <div>
                <p className="text-base text-slate-700 dark:text-slate-200">
                  <span className="text-xl font-bold text-green-700 dark:text-green-300">
                    {scoreNative}
                  </span>{" "}
                  besoins couverts nativement
                  <span className="mx-2 text-slate-300">·</span>
                  <span className="text-xl font-bold text-orange-600 dark:text-orange-300">
                    {scorePartial}
                  </span>{" "}
                  besoin{scorePartial > 1 ? "s" : ""} couvert
                  {scorePartial > 1 ? "s" : ""} via add-on
                  {scoreNone > 0 && (
                    <>
                      <span className="mx-2 text-slate-300">·</span>
                      <span className="text-xl font-bold text-red-600 dark:text-red-300">
                        {scoreNone}
                      </span>{" "}
                      non couvert{scoreNone > 1 ? "s" : ""}
                    </>
                  )}
                </p>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Score de compatibilité :{" "}
                  <span className={cn("font-bold", accent.text)}>
                    {formatPercent(score)}
                  </span>
                </p>
              </div>
            </div>
          </section>

          {/* 5. Couverture fonctionnelle */}
          <section>
            <h3 className="mb-3 text-lg font-bold text-slate-950 dark:text-white">
              Couverture fonctionnelle
            </h3>

            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                    <th className="px-5 py-3 font-semibold">Besoin</th>
                    <th className="px-5 py-3 font-semibold">Couverture</th>
                    <th className="px-5 py-3 font-semibold">Solution</th>
                    <th className="px-5 py-3 font-semibold">Impact</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-950">
                  {selectedFeatures.map((feature) => {
                    const coverage = getFeatureCoverage(feature, hvId);
                    const solution = getFeatureSolution(feature, hvId);

                    return (
                      <tr key={feature.id}>
                        <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-200">
                          {feature.label}
                        </td>
                        <td className="px-5 py-3">
                          <CoverageCell coverage={coverage} />
                        </td>
                        <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                          {solution}
                        </td>
                        <td className="px-5 py-3">
                          <ImpactCell coverage={coverage} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* 6. Points d’attention */}
          {hypothesis && (
            <section className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 ring-1 ring-slate-200 dark:bg-slate-950 dark:text-slate-400 dark:ring-slate-800">
                  <CircleHelp className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-100">
                    Points d’attention
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {hypothesis}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* 7. Warning microsegmentation */}
          {microsegWarning && (
            <section className="rounded-2xl border border-orange-200 bg-orange-50 p-5 text-orange-900 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600 dark:text-orange-300" />
                <p className="text-sm leading-6">{microsegWarning}</p>
              </div>

              {firewallOptions?.length > 0 && (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {firewallOptions.map((option) => (
                    <div
                      key={option.name}
                      className={cn(
                        "rounded-xl border bg-white p-4 dark:bg-slate-950",
                        option.recommended
                          ? "border-green-200 dark:border-green-900/60"
                          : "border-orange-200 dark:border-orange-900/60"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-slate-950 dark:text-white">
                            {option.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {option.type}
                          </p>
                        </div>

                        {option.recommended && (
                          <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-bold text-green-700 dark:bg-green-950/50 dark:text-green-300">
                            ✓ Recommandé
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-sm font-bold text-green-700 dark:text-green-300">
                        {option.price}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* 8. Pied de modale */}
        <footer className="flex items-center justify-between gap-4 border-t border-slate-200 px-7 py-5 dark:border-slate-800">
          <div>
            {!isVmware && (
              <button
                type="button"
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-200"
              >
                <Scale className="h-5 w-5" />
                Comparer à VMware
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-7 py-3 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            Fermer
          </button>
        </footer>
      </div>
    </div>
  );
}
