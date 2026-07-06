import { useState, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Upload, Info, X, AlertTriangle, CheckCircle2, XCircle,
  AlertCircle, TrendingUp, Server, HardDrive, Network,
  Shield, Database, RefreshCw, Archive, Layers, Box,
  Cpu, ChevronRight, Edit3, Lock, Trophy, Scale,
  ShieldCheck, Wallet, ArrowRight,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function cn(...classes) { return classes.filter(Boolean).join(" "); }
function fmt(n) { return Number(n).toLocaleString("fr-FR"); }

// ─── Logos ────────────────────────────────────────────────────────────────────
const LOGOS = {
  vmware:  "/logos/vmware.png",
  proxmox: "/logos/proxmox.png",
  hyperv:  "/logos/hyperv.png",
  xcpng:   "/logos/xcpng.png",
};

// ─── Couleurs ─────────────────────────────────────────────────────────────────
const HV_META = {
  vmware:  { label: "VMware",           accent: "gray",   border: "border-slate-200",  header: "bg-slate-50",      btn: "border-slate-300 text-slate-700",   badge: "Référence fonctionnelle",  badgeCls: "bg-green-50 text-green-700 border-green-200" },
  proxmox: { label: "Proxmox VE",       accent: "orange", border: "border-orange-200", header: "bg-orange-50/60",  btn: "border-orange-200 text-orange-700", badge: "Open source économique",   badgeCls: "bg-orange-50 text-orange-700 border-orange-200" },
  hyperv:  { label: "Microsoft Hyper-V",accent: "blue",   border: "border-blue-200",   header: "bg-blue-50/60",    btn: "border-blue-200 text-blue-700",     badge: "Meilleur coût",            badgeCls: "bg-blue-50 text-blue-700 border-blue-200" },
  xcpng:   { label: "XCP-ng",           accent: "violet", border: "border-violet-200", header: "bg-violet-50/60",  btn: "border-violet-200 text-violet-700", badge: "Meilleur compromis",       badgeCls: "bg-violet-50 text-violet-700 border-violet-200" },
};

const ACCENT_TEXT = {
  gray:   "text-slate-700",
  orange: "text-orange-600",
  blue:   "text-blue-700",
  violet: "text-violet-700",
  green:  "text-green-700",
};

// ─── Fonctionnalités ──────────────────────────────────────────────────────────
const FEATURES = [
  { id:"ha",          label:"Haute disponibilité (HA)",       icon:Shield,   desc:"Redémarre automatiquement les VMs sur un autre hôte en cas de panne.",        editors:{vmware:"vSphere HA",proxmox:"HA Cluster natif",hyperv:"Failover Clustering",xcpng:"XO HA natif"},        coverage:{vmware:"ok",proxmox:"ok",hyperv:"ok",xcpng:"ok"} },
  { id:"livemig",     label:"Migration à chaud",              icon:RefreshCw,desc:"Déplace une VM d'un hôte à l'autre sans interruption de service.",             editors:{vmware:"vMotion",proxmox:"Live Migration KVM",hyperv:"Live Migration",xcpng:"XenMotion"},              coverage:{vmware:"ok",proxmox:"ok",hyperv:"ok",xcpng:"ok"} },
  { id:"drs",         label:"Équilibrage de charge (DRS)",    icon:Layers,   desc:"Redistribue automatiquement les VMs entre hôtes selon CPU/RAM.",              editors:{vmware:"DRS natif",proxmox:"Proxcenter (+600€/hôte/an)",hyperv:"SCVMM requis",xcpng:"XO Load Balancing"}, coverage:{vmware:"ok",proxmox:"partial",hyperv:"partial",xcpng:"partial"} },
  { id:"microseg",    label:"Microsegmentation / SDN",        icon:Lock,     desc:"Crée des réseaux virtuels isolés et sécurisés entre VMs.",                    editors:{vmware:"NSX / vSphere DS",proxmox:"SDN via OVN",hyperv:"Hyper-V SDN",xcpng:"Non natif — Firewall"},     coverage:{vmware:"ok",proxmox:"partial",hyperv:"partial",xcpng:"none"},
    warnings:{ xcpng:"Microsegmentation non native — pare-feu virtuel requis (OPNsense, pfSense, FortiGate VM).", hyperv:"SDN Hyper-V complexe sans SCVMM — pare-feu externe recommandé." },
    firewallOptions:[{name:"OPNsense",type:"Open source",price:"0 €",recommended:true},{name:"pfSense CE",type:"Open source",price:"0 €",recommended:false},{name:"FortiGate VM",type:"Enterprise",price:"~2 000 €/an",recommended:false}] },
  { id:"hci",         label:"Stockage distribué (HCI)",       icon:HardDrive,desc:"Utilise les disques locaux des nœuds pour créer un stockage partagé HA.",      editors:{vmware:"vSAN Enterprise",proxmox:"Ceph (inclus abonnement)",hyperv:"Storage Spaces Direct",xcpng:"Xostor / LINSTOR"}, coverage:{vmware:"ok",proxmox:"ok",hyperv:"ok",xcpng:"partial"} },
  { id:"backup",      label:"Sauvegarde intégrée",            icon:Archive,  desc:"Sauvegarde les VMs sans outil tiers, avec rétention et déduplication.",       editors:{vmware:"VADP (solution tierce)",proxmox:"Proxmox Backup Server",hyperv:"WSB (basique)",xcpng:"XO Backup natif"}, coverage:{vmware:"partial",proxmox:"ok",hyperv:"partial",xcpng:"ok"} },
  { id:"replication", label:"Réplication / DR",               icon:Database, desc:"Copie les VMs vers un site secondaire pour reprise après sinistre.",           editors:{vmware:"vSphere Replication / SRM",proxmox:"Réplication ZFS natif",hyperv:"Hyper-V Replica natif",xcpng:"XO Replication"}, coverage:{vmware:"ok",proxmox:"ok",hyperv:"ok",xcpng:"ok"} },
  { id:"snapshots",   label:"Snapshots VM",                   icon:Box,      desc:"Crée des points de restauration instantanés des VMs.",                         editors:{vmware:"Natif vSphere",proxmox:"Natif ZFS/qcow2",hyperv:"Natif Hyper-V",xcpng:"Natif XCP-ng"},             coverage:{vmware:"ok",proxmox:"ok",hyperv:"ok",xcpng:"ok"} },
  { id:"k8s",         label:"Kubernetes / Conteneurs",        icon:Cpu,      desc:"Orchestre des conteneurs directement sur l'infrastructure.",                   editors:{vmware:"VMware Tanzu",proxmox:"LXC + K8s",hyperv:"AKS-HCI",xcpng:"Support partiel"},                     coverage:{vmware:"ok",proxmox:"partial",hyperv:"partial",xcpng:"partial"} },
];

const STORAGE_CONN = [
  {id:"iscsi",label:"iSCSI",icon:"💾"},{id:"fc",label:"Fibre Channel",icon:"🔌"},
  {id:"nfs",label:"NFS",icon:"📁"},{id:"local",label:"Stockage local",icon:"🖥"},{id:"smb",label:"SMB / CIFS",icon:"📂"},
];

// ─── Licences ─────────────────────────────────────────────────────────────────
const LICENSES = {
  vmware:  [{id:"vsphere",label:"vSphere Enterprise Plus",pricePerCore:150.99},{id:"vvf",label:"vSphere Foundation (VVF)",pricePerCore:190.99},{id:"vcf",label:"Cloud Foundation (VCF)",pricePerCore:381.20}],
  proxmox: [{id:"basic",label:"Basic",pricePerSocket:120,note:"Support email"},{id:"standard",label:"Standard",pricePerSocket:480,note:"Support 8/5"},{id:"premium",label:"Premium",pricePerSocket:1100,note:"Support 24/7"}],
  hyperv:  [{id:"std_ea",label:"Windows Server Standard (EA/SPLA inclus)",pricePerLicense:0,note:"Coût logiciel 0 €"},{id:"std",label:"Windows Server Standard",pricePerLicense:1069,note:"2 VMs / licence 16 cores"},{id:"dc",label:"Windows Server Datacenter",pricePerLicense:6155,note:"VMs illimitées"}],
  xcpng:   [{id:"essential",label:"Essential",pricePerYear:2000,note:"Pool illimité, support standard"},{id:"enterprise",label:"Enterprise",pricePerHost:1800,note:"Support premium, SLA garanti"}],
};

// ─── Moteur de calcul ─────────────────────────────────────────────────────────
function recommendLicense(hvId, sizing, features, hasWinEA) {
  const { nodes } = sizing;
  const needsDRS = features.includes("drs"), needsHCI = features.includes("hci");
  const needsSDN = features.includes("microseg"), needsK8s = features.includes("k8s");
  if (hvId === "vmware")  return (needsHCI || needsSDN || needsK8s) ? "vcf" : needsDRS ? "vvf" : "vsphere";
  if (hvId === "proxmox") return (nodes >= 4 || needsDRS) ? "premium" : needsHCI ? "standard" : "basic";
  if (hvId === "hyperv")  return hasWinEA ? "std_ea" : "dc";
  if (hvId === "xcpng")   return nodes >= 4 ? "enterprise" : "essential";
}

function calcAddons(hvId, sizing, features) {
  const { nodes } = sizing;
  const addons = [];
  if (hvId === "proxmox") {
    if (features.includes("drs")) addons.push({label:"Proxcenter (DRS-like)",pricePerYear:600*nodes,detail:`${nodes} hôtes × 600 €/an`});
    if (features.includes("hci")) addons.push({label:"Ceph (HCI)",pricePerYear:0,detail:"Inclus dans l'abonnement Proxmox"});
  }
  if (hvId === "xcpng" && features.includes("hci")) addons.push({label:"Xostor / LINSTOR (HCI)",pricePerYear:600*nodes,detail:`${nodes} hôtes × 600 €/an`});
  if (hvId === "hyperv") {
    if (features.includes("drs")) addons.push({label:"SCVMM (DRS/gestion avancée)",pricePerYear:1323*nodes,detail:`${nodes} hôtes × 1 323 €/an`});
    if (features.includes("hci")) addons.push({label:"Storage Spaces Direct",pricePerYear:0,detail:"Inclus dans Windows Server Datacenter"});
  }
  return addons;
}

function calcTCO(hvId, sizing, features, years, hasWinEA) {
  const { nodes, sockets, coresPerSocket } = sizing;
  const totalCores = nodes * sockets * coresPerSocket;
  const totalSockets = nodes * sockets;
  const billedCores = Math.max(totalCores, totalSockets * 16);
  const licId = recommendLicense(hvId, sizing, features, hasWinEA);
  const addons = calcAddons(hvId, sizing, features);
  const addonAnnual = addons.reduce((s,a) => s + (a.pricePerYear||0), 0);
  let licAnnual = 0, licDetail = "";
  if (hvId === "vmware")  { const l = LICENSES.vmware.find(l=>l.id===licId);  licAnnual = billedCores*(l?.pricePerCore||0); licDetail=`${billedCores} cœurs × ${l?.pricePerCore||0} €/core/an`; }
  if (hvId === "proxmox") { const l = LICENSES.proxmox.find(l=>l.id===licId); licAnnual = totalSockets*(l?.pricePerSocket||0); licDetail=`${totalSockets} sockets × ${l?.pricePerSocket||0} €/socket/an`; }
  if (hvId === "hyperv")  { const l = LICENSES.hyperv.find(l=>l.id===licId);  if (licId==="std_ea") { licAnnual=0; licDetail="Licences incluses EA/SPLA"; } else { const cnt=Math.ceil(billedCores/16)*nodes; licAnnual=Math.round(cnt*(l?.pricePerLicense||0)/years); licDetail=`${cnt} licences × ${l?.pricePerLicense||0} € (amorti ${years} ans)`; } }
  if (hvId === "xcpng")   { const l = LICENSES.xcpng.find(l=>l.id===licId);   licAnnual = l?.pricePerYear||(nodes*(l?.pricePerHost||0)); licDetail = l?.pricePerYear ? "Abonnement annuel pool illimité" : `${nodes} hôtes × ${l?.pricePerHost||0} €/hôte/an`; }
  const annual = licAnnual + addonAnnual;
  return { licId, licAnnual, addonAnnual, annual, total: annual*years, licDetail, addons };
}

function calcScore(hvId, features) {
  if (!features.length) return 100;
  const full = features.filter(fId=>FEATURES.find(f=>f.id===fId)?.coverage[hvId]==="ok").length;
  const part = features.filter(fId=>FEATURES.find(f=>f.id===fId)?.coverage[hvId]==="partial").length;
  return Math.round((full+part*0.5)/features.length*100);
}

// ─── Parser RVTools ───────────────────────────────────────────────────────────
function parseRVTools(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb  = XLSX.read(e.target.result, {type:"binary"});
        const get = (n) => { const ws=wb.Sheets[n]; return ws?XLSX.utils.sheet_to_json(ws,{defval:null}):[]};
        const vHost=get("vHost"), vNIC=get("vNIC"), vHBA=get("vHBA"), vCluster=get("vCluster"), vSnap=get("vSnapshot");
        const hosts=[...new Set(vHost.map(h=>h["Host"]||h["Name"]).filter(Boolean))];
        const nodes=hosts.length, fh=vHost[0]||{};
        const sockets=Number(fh["# CPU"]||fh["Sockets"]||2);
        const coresPerSocket=Number(fh["Cores per CPU"]||fh["CPUs"]||16);
        const det=[];
        if (vCluster.some(c=>String(c["HA enabled"]||c["HA Enabled"]||"").toLowerCase()==="true")) det.push("ha");
        if (vCluster.some(c=>String(c["DRS enabled"]||c["DRS Enabled"]||"").toLowerCase()==="true")) det.push("drs");
        if (vNIC.some(n=>String(n["VMKernel type"]||n["Type"]||"").toLowerCase().includes("vmotion"))||nodes>1) det.push("livemig");
        if (vHost.some(h=>String(h["vSAN"]||h["VSAN"]||"").toLowerCase()==="true")) det.push("hci");
        if (vSnap.length>0) det.push("snapshots");
        det.push("backup","replication");
        const sc=[];
        if (vHBA.some(h=>String(h["Type"]||"").toLowerCase().includes("iscsi"))) sc.push("iscsi");
        if (vHBA.some(h=>String(h["Type"]||"").toLowerCase().includes("fibre")||String(h["Type"]||"").toLowerCase().includes("fc"))) sc.push("fc");
        if (!sc.length) sc.push("local");
        resolve({nodes,sockets,coresPerSocket,detectedFeatures:det,storageConn:sc});
      } catch(err){reject(err);}
    };
    reader.onerror=reject;
    reader.readAsBinaryString(file);
  });
}

// ─── Sous-composants UI ───────────────────────────────────────────────────────
function ProgressBar({value,accent="green"}) {
  const color={green:"bg-green-500",orange:"bg-orange-500",blue:"bg-blue-600",violet:"bg-violet-600",gray:"bg-slate-500"}[accent]||"bg-green-500";
  const text={green:"text-green-700",orange:"text-orange-700",blue:"text-blue-700",violet:"text-violet-700",gray:"text-slate-700"}[accent]||"text-green-700";
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className={cn("h-full rounded-full",color)} style={{width:`${Math.min(value,100)}%`}}/>
      </div>
      <span className={cn("w-10 text-right text-sm font-bold",text)}>{value}%</span>
    </div>
  );
}

function CovIcon({status}) {
  if (status==="ok")      return <CheckCircle2 size={14} className="text-green-600 shrink-0"/>;
  if (status==="partial") return <AlertCircle  size={14} className="text-amber-500 shrink-0"/>;
  return                         <XCircle      size={14} className="text-red-400 shrink-0"/>;
}

function InfoTooltip({feature}) {
  const [open,setOpen]=useState(false);
  return (
    <div className="relative inline-block">
      <button type="button" onClick={()=>setOpen(o=>!o)} className="text-blue-400 hover:text-blue-600"><Info size={13}/></button>
      {open&&(
        <div className="absolute z-50 left-6 top-0 w-72 bg-white border border-gray-200 rounded-xl shadow-xl p-4">
          <button onClick={()=>setOpen(false)} className="absolute top-2 right-2 text-gray-300 hover:text-gray-600"><X size={12}/></button>
          <div className="text-xs font-semibold text-gray-700 mb-1">{feature.label}</div>
          <p className="text-xs text-gray-500 mb-3">{feature.desc}</p>
          <table className="w-full text-xs"><thead><tr className="border-b border-gray-100"><th className="text-left text-gray-400 pb-1 font-medium">Éditeur</th><th className="text-left text-gray-400 pb-1 font-medium">Solution</th></tr></thead>
            <tbody>{Object.entries(feature.editors).map(([hv,name])=>(
              <tr key={hv} className="border-b border-gray-50 last:border-0">
                <td className="py-1 text-gray-600 font-medium">{HV_META[hv]?.label||hv}</td>
                <td className="py-1 text-blue-600">{name}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Modale Détail Hyperviseur ────────────────────────────────────────────────
function HvModal({hvId, sizing, features, years, hasWinEA, vmwareTCO, onClose}) {
  const meta = HV_META[hvId];
  const tco  = calcTCO(hvId, sizing, features, years, hasWinEA);
  const score = calcScore(hvId, features);
  const lic   = LICENSES[hvId]?.find(l=>l.id===tco.licId);
  const saving = hvId!=="vmware"&&vmwareTCO>0&&tco.total<vmwareTCO ? Math.round((1-tco.total/vmwareTCO)*100) : null;
  const microsegF = FEATURES.find(f=>f.id==="microseg");
  const microsegWarn = features.includes("microseg") ? microsegF?.warnings?.[hvId] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <img src={LOGOS[hvId]} alt={meta.label} className="h-10 object-contain max-w-[130px]"/>
            <div>
              <div className="text-xs text-gray-400 mb-1">{lic?.label}</div>
              <div className="w-52"><ProgressBar value={score} accent={meta.accent}/></div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20}/></button>
        </div>

        <div className="p-6 space-y-5">
          {hvId==="vmware"&&(
            <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
              <AlertTriangle size={14} className="text-orange-500 mt-0.5 shrink-0"/>
              <p className="text-xs text-orange-800"><strong>Tarifs Broadcom susceptibles d'augmenter</strong> à chaque renouvellement annuel — aucune garantie de prix sur la durée.</p>
            </div>
          )}
          {microsegWarn&&(
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-2 mb-3"><AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0"/><p className="text-xs text-red-800"><strong>Microsegmentation :</strong> {microsegWarn}</p></div>
              <div className="text-xs font-semibold text-gray-600 mb-2">Solutions pare-feu compatibles :</div>
              <div className="grid grid-cols-3 gap-2">
                {microsegF?.firewallOptions?.map(fw=>(
                  <div key={fw.name} className={cn("rounded-lg border p-2 text-xs",fw.recommended?"border-blue-200 bg-blue-50":"border-gray-200 bg-white")}>
                    <div className="font-bold text-gray-800">{fw.name} {fw.recommended&&<span className="text-blue-600 text-[10px]">✓</span>}</div>
                    <div className="text-gray-500">{fw.type}</div>
                    <div className="text-green-700 font-semibold">{fw.price}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Licence recommandée</div>
              <div className={cn("rounded-2xl border p-4 mb-3",meta.border)} style={{background:meta.header.replace("/60","")}}>
                <div className={cn("text-base font-bold mb-1",ACCENT_TEXT[meta.accent])}>{lic?.label}</div>
                <p className="text-xs text-gray-500">{lic?.note}</p>
              </div>
              {tco.addons.length>0&&(
                <div className="space-y-2">
                  {tco.addons.map((a,i)=>(
                    <div key={i} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                      <div><div className="text-xs font-semibold text-gray-800">{a.label}</div><div className="text-xs text-gray-400">{a.detail}</div></div>
                      <div className="text-xs font-bold text-gray-900">{a.pricePerYear===0?"Inclus":`${fmt(a.pricePerYear)} €/an`}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Détail financier</div>
              <div className="rounded-2xl border border-gray-100 p-4 space-y-3">
                <div className="flex justify-between text-xs border-b border-gray-50 pb-2"><span className="text-gray-500">Licence / an</span><span className="font-semibold">{fmt(tco.licAnnual)} €</span></div>
                {tco.addonAnnual>0&&<div className="flex justify-between text-xs border-b border-gray-50 pb-2"><span className="text-gray-500">Add-ons / an</span><span className="font-semibold">{fmt(tco.addonAnnual)} €</span></div>}
                <div className="flex justify-between"><span className="text-sm text-gray-500">Total / an</span><span className={cn("text-xl font-bold",ACCENT_TEXT[meta.accent])}>{fmt(tco.annual)} €</span></div>
                <div className="flex justify-between border-t border-gray-100 pt-3"><span className="text-sm text-gray-500">TCO {years} ans</span><span className="text-2xl font-bold text-gray-900">{fmt(tco.total)} €</span></div>
                <div className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">{tco.licDetail}</div>
                {saving!==null&&saving>0&&(
                  <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2">
                    <div className="text-sm font-bold text-green-700">Économie de {saving}%</div>
                    <div className="text-xs text-green-600">Soit {fmt(vmwareTCO-tco.total)} € vs VMware sur {years} ans</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Couverture fonctionnelle</div>
            <div className="rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-gray-50 border-b border-gray-100"><th className="px-4 py-3 text-left text-gray-500 font-medium">Besoin</th><th className="px-4 py-3 text-left text-gray-500 font-medium">Couverture</th><th className="px-4 py-3 text-left text-gray-500 font-medium">Solution</th></tr></thead>
                <tbody>
                  {features.map(fId=>{
                    const f=FEATURES.find(f=>f.id===fId); if(!f) return null;
                    const st=f.coverage[hvId]||"none";
                    const sl={ok:"Natif",partial:"Partiel",none:"Non disponible"};
                    const sc={ok:"text-green-600",partial:"text-amber-600",none:"text-red-500"};
                    return (<tr key={fId} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{f.label}</td>
                      <td className="px-4 py-2.5"><div className="flex items-center gap-1.5"><CovIcon status={st}/><span className={cn("font-semibold",sc[st])}>{sl[st]}</span></div></td>
                      <td className="px-4 py-2.5 text-gray-500">{f.editors[hvId]}</td>
                    </tr>);
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="px-6 pb-6 flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Fermer</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modale Résumé Financier ──────────────────────────────────────────────────
function FinanceModal({sizing, features, years, hasWinEA, onClose}) {
  const HVS = ["vmware","proxmox","hyperv","xcpng"];
  const data = HVS.map(hvId=>({hvId, tco:calcTCO(hvId,sizing,features,years,hasWinEA), score:calcScore(hvId,features)}));
  const vmwareTCO = data.find(d=>d.hvId==="vmware")?.tco.total||1;
  const maxTCO = Math.max(...data.map(d=>d.tco.total),1);
  const best = [...data].sort((a,b)=>(b.score*0.6-b.tco.total/maxTCO*40)-(a.score*0.6-a.tco.total/maxTCO*40))[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div><div className="text-xl font-bold text-gray-900">Comparaison financière — TCO sur {years} ans</div><div className="text-sm text-gray-400">{sizing.nodes} nœuds · {sizing.sockets} sockets · {sizing.coresPerSocket} cœurs/socket</div></div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20}/></button>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            {data.map(d=>{
              const pct=Math.round(d.tco.total/maxTCO*100);
              const saving=d.hvId!=="vmware"&&vmwareTCO>0?Math.round((1-d.tco.total/vmwareTCO)*100):null;
              const meta=HV_META[d.hvId];
              return (<div key={d.hvId} className="flex items-center gap-4">
                <img src={LOGOS[d.hvId]} alt="" className="h-6 object-contain w-24 shrink-0"/>
                <div className="flex-1">
                  {saving!==null&&saving>0&&<div className="mb-1"><span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-semibold">-{saving}% · {fmt(vmwareTCO-d.tco.total)} €</span></div>}
                  <div className="h-3.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${pct}%`,background:pct>=80?"#717171":pct>=60?"#E57000":pct>=40?"#0078D4":"#3730a3"}}/></div>
                </div>
                <div className="text-right shrink-0 w-28"><div className="text-sm font-bold text-gray-900">{fmt(d.tco.total)} €</div><div className="text-xs text-gray-400">{pct}%</div></div>
              </div>);
            })}
          </div>

          <div className="rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="bg-gray-50 border-b border-gray-100">{["Hyperviseur","Licence","Coût/an",`TCO ${years} ans`,"Compatibilité","Économie"].map(h=><th key={h} className="px-4 py-3 text-left font-semibold text-gray-500">{h}</th>)}</tr></thead>
              <tbody>
                {data.map(d=>{
                  const lic=LICENSES[d.hvId]?.find(l=>l.id===d.tco.licId);
                  const meta=HV_META[d.hvId];
                  const saving=d.hvId!=="vmware"&&vmwareTCO>0?Math.round((1-d.tco.total/vmwareTCO)*100):null;
                  return (<tr key={d.hvId} className={cn("border-b border-gray-50 last:border-0",d.hvId===best.hvId?"bg-green-50/40":"bg-white")}>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><img src={LOGOS[d.hvId]} alt="" className="h-5 object-contain w-14"/>{d.hvId===best.hvId&&<span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">★ Recommandé</span>}</div></td>
                    <td className="px-4 py-3 text-gray-600">{lic?.label}</td>
                    <td className={cn("px-4 py-3 font-semibold",ACCENT_TEXT[meta.accent])}>{fmt(d.tco.annual)} €</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{fmt(d.tco.total)} €</td>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-12 h-1.5 bg-gray-100 rounded-full"><div className="h-full rounded-full bg-blue-500" style={{width:`${d.score}%`}}/></div><span className="font-semibold text-gray-700">{d.score}%</span></div></td>
                    <td className="px-4 py-3 text-xs font-semibold">{saving!==null&&saving>0?<span className="text-green-600">-{saving}%</span>:<span className="text-gray-400">—</span>}</td>
                  </tr>);
                })}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-gray-100 p-4 space-y-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Analyse</div>
            <div className="flex items-start gap-3 rounded-xl bg-green-50 border border-green-100 px-4 py-3">
              <span className="text-base">🏆</span>
              <p className="text-sm text-green-900"><strong>{HV_META[best.hvId].label}</strong> offre le meilleur rapport coût/fonctionnalités pour {sizing.nodes} nœuds{vmwareTCO>0&&best.tco.total<vmwareTCO&&<> avec <strong>{fmt(vmwareTCO-best.tco.total)} €</strong> d'économie vs VMware sur {years} ans</>}.</p>
            </div>
            {hasWinEA&&<div className="flex items-start gap-3 rounded-xl bg-sky-50 border border-sky-100 px-4 py-3"><span className="text-base">🛡</span><p className="text-sm text-sky-900">Hyper-V est pertinent si vos licences Windows Server sont incluses dans votre EA (coût logiciel à 0 €).</p></div>}
            <p className="text-xs text-gray-400 flex items-center gap-1"><Info size={11}/> Prix indicatifs list price. À valider avec les éditeurs selon remises et périmètre exact.</p>
          </div>
        </div>
        <div className="px-6 pb-6 flex justify-end"><button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Fermer</button></div>
      </div>
    </div>
  );
}

// ─── Page Qualification ───────────────────────────────────────────────────────
function PageQualification({sizing,setSizing,features,setFeatures,storageConn,setStorageConn,hasWinEA,setHasWinEA,years,setYears,onCalculate}) {
  const fileRef=useRef();
  const [parsing,setParsing]=useState(false);
  const [msg,setMsg]=useState(null);

  const handleFile=async(e)=>{
    const file=e.target.files[0]; if(!file) return;
    setParsing(true); setMsg(null);
    try {
      const r=await parseRVTools(file);
      setSizing({nodes:r.nodes,sockets:r.sockets,coresPerSocket:r.coresPerSocket});
      setFeatures(r.detectedFeatures); setStorageConn(r.storageConn);
      setMsg({ok:true,text:`RVTools analysé — ${r.nodes} hôtes détectés, ${r.detectedFeatures.length} fonctionnalités identifiées`});
    } catch { setMsg({ok:false,text:"Erreur de lecture — vérifiez que le fichier est un export RVTools valide (.xlsx)"}); }
    finally { setParsing(false); }
  };

  const toggleF=(fId)=>setFeatures(p=>p.includes(fId)?p.filter(f=>f!==fId):[...p,fId]);
  const toggleS=(sId)=>setStorageConn(p=>p.includes(sId)?p.filter(s=>s!==sId):[...p,sId]);
  const billedCores=Math.max(sizing.nodes*sizing.sockets*sizing.coresPerSocket, sizing.nodes*sizing.sockets*16);
  const phantomCores=billedCores-sizing.nodes*sizing.sockets*sizing.coresPerSocket;

  return (
    <div className="space-y-5">
      {/* Upload */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><Upload size={15} className="text-blue-600"/> Import RVTools <span className="text-xs font-normal text-gray-400">(optionnel — pré-remplit le formulaire)</span></div>
        <div onClick={()=>fileRef.current.click()} className="border-2 border-dashed border-blue-200 bg-blue-50/40 rounded-xl px-6 py-8 text-center cursor-pointer hover:bg-blue-50 transition">
          <Upload size={24} className="text-blue-400 mx-auto mb-2"/>
          <div className="text-sm font-semibold text-blue-700">Cliquez pour uploader votre export RVTools</div>
          <div className="text-xs text-blue-400 mt-1">Fichier .xlsx — vHost, vNIC, vHBA, vCluster, vSnapshot</div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile}/>
        </div>
        {parsing&&<div className="mt-3 text-xs text-blue-600 animate-pulse">Analyse en cours...</div>}
        {msg&&<div className={cn("mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs border",msg.ok?"bg-green-50 text-green-700 border-green-200":"bg-red-50 text-red-700 border-red-200")}>{msg.ok?<CheckCircle2 size={13}/>:<AlertTriangle size={13}/>}{msg.text}</div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Sizing */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4"><div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">1</div><span className="text-sm font-bold text-gray-800">Dimensionnement</span></div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Nombre de nœuds</label>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden h-10">
                <button onClick={()=>setSizing(s=>({...s,nodes:Math.max(1,s.nodes-1)}))} className="w-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 border-r border-gray-200 h-full">−</button>
                <div className="flex-1 text-center font-bold text-gray-900">{sizing.nodes}</div>
                <button onClick={()=>setSizing(s=>({...s,nodes:Math.min(64,s.nodes+1)}))} className="w-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 border-l border-gray-200 h-full">+</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Sockets/nœud</label>
                <select value={sizing.sockets} onChange={e=>setSizing(s=>({...s,sockets:Number(e.target.value)}))} className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm font-semibold text-gray-900 outline-none">
                  <option value={1}>1 socket</option><option value={2}>2 sockets</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Cœurs/socket</label>
                <select value={sizing.coresPerSocket} onChange={e=>setSizing(s=>({...s,coresPerSocket:Number(e.target.value)}))} className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm font-semibold text-gray-900 outline-none">
                  {[8,12,16,24,32,48].map(v=><option key={v} value={v}>{v} cœurs</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Durée du support</label>
              <div className="grid grid-cols-3 gap-1">
                {[1,3,5].map(y=><button key={y} onClick={()=>setYears(y)} className={cn("h-9 rounded-lg text-sm font-semibold border transition",years===y?"bg-blue-600 text-white border-blue-600":"bg-white text-gray-600 border-gray-200 hover:bg-gray-50")}>{y} an{y>1?"s":""}</button>)}
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-xs space-y-1">
              {[["Total cœurs réels",sizing.nodes*sizing.sockets*sizing.coresPerSocket],["Total cœurs facturés (min 16/socket)",billedCores],["Total sockets",sizing.nodes*sizing.sockets]].map(([k,v])=>(
                <div key={k} className="flex justify-between"><span className="text-blue-700">{k}</span><span className="font-bold text-blue-900">{v}</span></div>
              ))}
            </div>
            {phantomCores>0&&<div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200"><AlertTriangle size={12}/>{phantomCores} cœurs fantômes facturés (règle min 16 cores/socket Broadcom)</div>}
          </div>
        </div>

        <div className="space-y-4">
          {/* Interconnexion */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3"><div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">2</div><span className="text-sm font-bold text-gray-800">Interconnexion stockage</span></div>
            <div className="grid grid-cols-2 gap-2">
              {STORAGE_CONN.map(s=>(
                <label key={s.id} className={cn("flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition",storageConn.includes(s.id)?"border-blue-300 bg-blue-50":"border-gray-200 bg-white hover:bg-gray-50")}>
                  <input type="checkbox" checked={storageConn.includes(s.id)} onChange={()=>toggleS(s.id)} className="accent-blue-600"/>
                  <span className="text-base">{s.icon}</span>
                  <span className="text-sm font-medium text-gray-800">{s.label}</span>
                </label>
              ))}
            </div>
          </div>
          {/* EA */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3"><div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">3</div><span className="text-sm font-bold text-gray-800">Licences existantes</span></div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={hasWinEA} onChange={e=>setHasWinEA(e.target.checked)} className="mt-0.5 accent-blue-600"/>
              <div><div className="text-sm font-semibold text-gray-800">Licences Windows Server incluses (EA / SPLA)</div><div className="text-xs text-gray-400 mt-0.5">Si coché, le coût Hyper-V sera calculé à 0 €</div></div>
            </label>
          </div>
        </div>
      </div>

      {/* Fonctionnalités */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4"><div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">4</div><span className="text-sm font-bold text-gray-800">Fonctionnalités utilisées / requises</span><span className="text-xs text-gray-400 ml-1">Sélectionnez sans jargon éditeur</span></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {FEATURES.map(f=>{
            const checked=features.includes(f.id); const Icon=f.icon;
            return (
              <label key={f.id} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition",checked?"border-blue-300 bg-blue-50":"border-gray-200 bg-white hover:bg-gray-50")}>
                <input type="checkbox" checked={checked} onChange={()=>toggleF(f.id)} className="accent-blue-600"/>
                <Icon size={14} className={checked?"text-blue-600":"text-gray-400"}/>
                <span className="text-sm font-medium text-gray-800 flex-1">{f.label}</span>
                <InfoTooltip feature={f}/>
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={onCalculate} className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl text-base font-bold shadow-lg hover:bg-blue-700 transition">
          <TrendingUp size={18}/> Calculer ma projection <ChevronRight size={18}/>
        </button>
      </div>
    </div>
  );
}

// ─── Page Résultats (visuel enrichi + données dynamiques) ─────────────────────
function PageResultats({sizing,features,years,hasWinEA,onBack}) {
  const [openModal,setOpenModal]=useState(null);
  const [showFinance,setShowFinance]=useState(false);
  const HVS=["vmware","proxmox","hyperv","xcpng"];

  const data=useMemo(()=>HVS.map(hvId=>({
    hvId, tco:calcTCO(hvId,sizing,features,years,hasWinEA), score:calcScore(hvId,features)
  })),[sizing,features,years,hasWinEA]);

  const vmwareTCO=data.find(d=>d.hvId==="vmware")?.tco.total||1;
  const maxTCO=Math.max(...data.map(d=>d.tco.total),1);
  const bestCost=data.reduce((a,b)=>a.tco.total<b.tco.total?a:b);
  const bestScore=data.reduce((a,b)=>a.score>b.score?a:b);
  const bestCompromise=data.reduce((a,b)=>(b.score*0.6-b.tco.total/maxTCO*40)>(a.score*0.6-a.tco.total/maxTCO*40)?b:a);

  // Synthèse textuelle
  const synthesis=useMemo(()=>{
    const parts=[];
    parts.push(`${HV_META[bestCost.hvId].label} optimise le coût total (${fmt(bestCost.tco.total)} €).`);
    if (bestScore.hvId!==bestCost.hvId) parts.push(`${HV_META[bestScore.hvId].label} offre la meilleure couverture fonctionnelle (${bestScore.score}%).`);
    if (bestCompromise.hvId!==bestCost.hvId&&bestCompromise.hvId!==bestScore.hvId) parts.push(`${HV_META[bestCompromise.hvId].label} représente le meilleur compromis coût / couverture.`);
    if (hasWinEA) parts.push("Hyper-V est particulièrement compétitif si vos licences Windows Server sont incluses dans votre EA.");
    return parts.join(" ");
  },[data,hasWinEA]);

  // Tableau comparatif dynamique
  const tableRows=useMemo(()=>[
    {label:"Licence",   values:data.map(d=>LICENSES[d.hvId]?.find(l=>l.id===d.tco.licId)?.label||"—")},
    {label:`TCO ${years} ans`, values:data.map(d=>`${fmt(d.tco.total)} €`), highlight:data.map(d=>ACCENT_TEXT[HV_META[d.hvId].accent])},
    {label:"Compatibilité", values:data.map(d=>d.score), type:"bar", accents:data.map(d=>HV_META[d.hvId].accent)},
    {label:"Add-ons",   values:data.map(d=>d.tco.addons.length?d.tco.addons.map(a=>a.label).join(", "):"—")},
    {label:"Point d'attention", values:["Tarifs variables Broadcom","Écosystème en croissance","Dépendance Windows Server","Adoption plus limitée"], warning:[true,false,false,false]},
  ],[data,years]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-950">Résultats — Comparaison neutre hyperviseurs</h3>
          <p className="mt-1 text-sm text-slate-500">{sizing.nodes} nœuds · {sizing.sockets} socket{sizing.sockets>1?"s":""} · {sizing.coresPerSocket} cœurs/socket · {years} an{years>1?"s":""}</p>
        </div>
        <button onClick={onBack} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50">
          <Edit3 size={14}/> Modifier
        </button>
      </div>

      {/* KPIs synthèse */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {[
          {icon:Trophy,  label:"Meilleur coût",         value:HV_META[bestCost.hvId].label,      sub:`${fmt(bestCost.tco.total)} €`,  color:"blue"},
          {icon:ShieldCheck,label:"Meilleure compatibilité",value:HV_META[bestScore.hvId].label,  sub:`${bestScore.score} %`,           color:"green"},
          {icon:Scale,   label:"Meilleur compromis",    value:HV_META[bestCompromise.hvId].label, sub:"Coût / couverture équilibré",    color:"violet"},
        ].map(k=>{
          const styles={blue:{wrapper:"border-blue-200 bg-blue-50/60",icon:"bg-blue-600 text-white",value:"text-blue-700"},green:{wrapper:"border-green-200 bg-green-50/60",icon:"bg-green-600 text-white",value:"text-green-700"},violet:{wrapper:"border-violet-200 bg-violet-50/60",icon:"bg-violet-600 text-white",value:"text-violet-700"}}[k.color];
          const Icon=k.icon;
          return (
            <div key={k.label} className={cn("rounded-2xl border p-5 shadow-sm",styles.wrapper)}>
              <div className="flex items-center gap-4">
                <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-full",styles.icon)}><Icon size={28}/></div>
                <div><p className="text-sm font-semibold text-slate-700">{k.label}</p><p className={cn("mt-1 text-xl font-bold",styles.value)}>{k.value}</p><p className="mt-0.5 text-sm font-semibold text-slate-600">{k.sub}</p></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Synthèse automatique */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 flex items-center gap-3 text-sm text-blue-950">
        <Info size={18} className="shrink-0 text-blue-600"/>
        <p><span className="font-bold">Synthèse automatique : </span>{synthesis}</p>
      </div>

      {/* 4 cartes */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 2xl:grid-cols-4">
        {data.map(d=>{
          const meta=HV_META[d.hvId];
          const lic=LICENSES[d.hvId]?.find(l=>l.id===d.tco.licId);
          const saving=d.hvId!=="vmware"&&vmwareTCO>0&&d.tco.total<vmwareTCO?Math.round((1-d.tco.total/vmwareTCO)*100):null;
          const hasMicrosegWarn=features.includes("microseg")&&["xcpng","hyperv"].includes(d.hvId);
          return (
            <div key={d.hvId} className={cn("flex min-h-[320px] flex-col overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-md transition",meta.border)}>
              <div className={cn("flex items-center justify-between px-5 py-4",meta.header)}>
                <img src={LOGOS[d.hvId]} alt={meta.label} className="h-10 max-w-[140px] object-contain object-left"/>
                <span className={cn("rounded-full border px-3 py-1 text-xs font-bold",meta.badgeCls)}>{meta.badge}</span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div>
                  <p className="text-xs text-slate-400">Licence proposée</p>
                  <p className="mt-1 text-sm font-bold text-slate-950">{lic?.label}</p>
                  {d.tco.addons.length>0&&<div className="mt-1 space-y-0.5">{d.tco.addons.map((a,i)=><p key={i} className="text-xs text-slate-500">+ {a.label}</p>)}</div>}
                </div>
                <div className="mt-4"><p className="mb-2 text-xs text-slate-400">Compatibilité</p><ProgressBar value={d.score} accent={meta.accent}/></div>
                <div className="mt-4">
                  <p className="text-xs text-slate-400">TCO {years} ans</p>
                  <p className={cn("mt-1 text-3xl font-bold",ACCENT_TEXT[meta.accent])}>{fmt(d.tco.total)} €</p>
                  <p className="text-xs text-slate-500">{fmt(d.tco.annual)} €/an</p>
                  {saving!==null&&<p className="mt-1 text-xs font-bold text-green-700">-{saving}% vs VMware</p>}
                </div>
                {d.hvId==="vmware"&&<div className="mt-3 flex items-center gap-1.5 text-xs text-orange-700 bg-orange-50 rounded-lg px-3 py-2 border border-orange-100"><AlertTriangle size={11} className="shrink-0"/><span>Tarifs Broadcom variables chaque année</span></div>}
                {hasMicrosegWarn&&<div className="mt-2 flex items-center gap-1.5 text-xs text-red-700 bg-red-50 rounded-lg px-3 py-2 border border-red-100"><AlertTriangle size={11} className="shrink-0"/><span>Firewall requis (microsegmentation)</span></div>}
                <button onClick={()=>setOpenModal(d.hvId)} className={cn("mt-auto flex h-11 items-center justify-center rounded-lg border text-sm font-bold transition",meta.btn)}>
                  Voir le détail <ArrowRight size={14} className="ml-2"/>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tableau comparatif */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-base font-bold text-slate-950">Comparatif synthétique</h3>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full table-fixed text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="w-40 border-r border-slate-200 px-4 py-3 text-left font-bold text-slate-800">Critère</th>
                {data.map(d=><th key={d.hvId} className="border-r border-slate-200 px-4 py-3 last:border-r-0"><div className="flex justify-center"><img src={LOGOS[d.hvId]} alt="" className="h-7 max-w-[100px] object-contain"/></div></th>)}
              </tr>
            </thead>
            <tbody>
              {tableRows.map(row=>(
                <tr key={row.label} className="border-t border-slate-200">
                  <td className="border-r border-slate-200 px-4 py-3 font-bold text-slate-800 text-xs">{row.label}</td>
                  {row.values.map((val,i)=>(
                    <td key={i} className="border-r border-slate-200 px-4 py-3 text-center text-slate-700 last:border-r-0">
                      {row.type==="bar"
                        ? <ProgressBar value={val} accent={row.accents?.[i]}/>
                        : <span className={cn("text-xs",row.highlight?.[i],row.warning?.[i]?"text-orange-700":"")}>
                            {row.warning?.[i]&&<AlertTriangle size={12} className="inline mr-1"/>}{val}
                          </span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Aide à la décision */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-base font-bold text-slate-950">Aide à la décision</h3>
        <div className="space-y-3">
          {[
            {icon:Wallet,    color:"blue",   title:`Choisir ${HV_META[bestCost.hvId].label}`,         text:"Si la priorité est la minimisation du coût total et que l'environnement existant le permet."},
            {icon:Scale,     color:"violet", title:`Choisir ${HV_META[bestCompromise.hvId].label}`,   text:"Si l'équilibre coût / couverture fonctionnelle est la priorité principale."},
            {icon:ShieldCheck,color:"green", title:`Choisir ${HV_META[bestScore.hvId].label}`,        text:"Si la compatibilité fonctionnelle maximale et l'écosystème mature sont non négociables."},
          ].map(k=>{
            const styles={blue:"bg-blue-600 text-white",violet:"bg-violet-600 text-white",green:"bg-green-600 text-white"}[k.color];
            const Icon=k.icon;
            return (
              <div key={k.title} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full",styles)}><Icon size={22}/></div>
                <div className="flex-1 min-w-0"><p className="font-bold text-slate-900">{k.title}</p><p className="mt-1 text-sm text-slate-600">{k.text}</p></div>
                <ChevronRight size={18} className="text-slate-400 shrink-0"/>
              </div>
            );
          })}
          <div className="flex items-start gap-3 rounded-xl bg-blue-50 p-4 text-sm text-blue-900"><Info size={18} className="mt-0.5 shrink-0 text-blue-600"/><p>Les coûts sont indicatifs et doivent être validés selon remises éditeur, support et périmètre exact.</p></div>
        </div>
      </div>

      <div className="flex justify-center">
        <button onClick={()=>setShowFinance(true)} className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-slate-800 flex items-center gap-2">
          <TrendingUp size={15}/> Voir le résumé financier complet
        </button>
      </div>

      {openModal&&<HvModal hvId={openModal} sizing={sizing} features={features} years={years} hasWinEA={hasWinEA} vmwareTCO={vmwareTCO} onClose={()=>setOpenModal(null)}/>}
      {showFinance&&<FinanceModal sizing={sizing} features={features} years={years} hasWinEA={hasWinEA} onClose={()=>setShowFinance(false)}/>}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function HyperCost() {
  const [page,setPage]=useState("qualification");
  const [sizing,setSizing]=useState({nodes:6,sockets:2,coresPerSocket:16});
  const [features,setFeatures]=useState(["ha","livemig","snapshots"]);
  const [storageConn,setStorageConn]=useState(["iscsi"]);
  const [hasWinEA,setHasWinEA]=useState(false);
  const [years,setYears]=useState(3);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h2 className="text-2xl font-bold text-slate-950">HyperCost</h2><p className="text-sm text-slate-500 mt-0.5">Comparateur neutre de coûts et de couverture fonctionnelle hyperviseur</p></div>
        <div className="flex items-center gap-2 text-sm">
          <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold border",page==="qualification"?"border-blue-600 bg-blue-600 text-white":"border-slate-200 bg-white text-slate-500")}>1 Qualification</div>
          <ChevronRight size={14} className="text-slate-300"/>
          <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold border",page==="resultats"?"border-blue-600 bg-blue-600 text-white":"border-slate-200 bg-white text-slate-500")}>2 Résultats</div>
        </div>
      </div>
      {page==="qualification"
        ? <PageQualification sizing={sizing} setSizing={setSizing} features={features} setFeatures={setFeatures} storageConn={storageConn} setStorageConn={setStorageConn} hasWinEA={hasWinEA} setHasWinEA={setHasWinEA} years={years} setYears={setYears} onCalculate={()=>setPage("resultats")}/>
        : <PageResultats sizing={sizing} features={features} years={years} hasWinEA={hasWinEA} onBack={()=>setPage("qualification")}/>
      }
    </div>
  );
}
