import type { TFunction } from "i18next";
import {
  AlertTriangle,
  Banknote,
  Building2,
  Droplets,
  Handshake,
  HardHat,
  Wallet,
  Zap,
} from "lucide-react";
import type { Section6Block } from "./types";
import type { InfrastructureSection6Data } from "@/services/PrefDomainDashboardInfrastructureDataService";

const fmtDH = (n: number, lang: string) =>
  `${new Intl.NumberFormat(lang === "ar" ? "ar-MA" : "fr-FR").format(Math.round(n))} DH`;

const fmtNum = (n: number, lang: string) =>
  new Intl.NumberFormat(lang === "ar" ? "ar-MA" : "fr-FR").format(Math.round(n));

const pct = (n: number) => `${n.toFixed(1)}%`;

/**
 * Construit les 5 blocs détaillés du domaine Infrastructure pour Section6 :
 * Dépenses, Eau & Électricité, Partenariat, BTP, Projets en souffrance.
 * Toute l'agrégation vient déjà faite de PrefDomainDashboardInfrastructureDataService ;
 * ce fichier ne fait que construire le JSX de présentation.
 */
export const buildInfrastructureSection6Blocks = (
  data: InfrastructureSection6Data,
  lang: string,
  t: TFunction,
): Section6Block[] => {
  const tPhase = (phase: string) =>
    (t(`prefDomainDashboard.infrastructure.phases.${phase}`, phase) as string);
  const tCause = (cause: string) =>
    (t(`prefDomainDashboard.infrastructure.causes.${cause}`, cause) as string);

  return [
    // 1. Dépenses
    {
      id: "depenses",
      title: t("prefDomainDashboard.infrastructure.section6.depenses.title", "Dépenses") as string,
      icon: <Wallet className="h-4 w-4 text-blue-500" />,
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          {[
            {
              key: "fonctionnement",
              label: t("prefDomainDashboard.infrastructure.categories.fonctionnement", "Fonctionnement") as string,
              d: data.depenses.fonctionnement,
            },
            {
              key: "investissement",
              label: t("prefDomainDashboard.infrastructure.categories.investissement", "Investissement") as string,
              d: data.depenses.investissement,
            },
          ].map(({ key, label, d }) => (
            <div key={key} className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Banknote className="h-4 w-4" /> {label}
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center">
                  <span className="text-lg font-black text-foreground" dir="ltr">{fmtDH(d.ouverts, lang)}</span>
                  <span className="text-[10px] font-medium text-muted-foreground mt-1">
                    {t("prefDomainDashboard.infrastructure.section6.depenses.ouverts", "Ouverts") as string}
                  </span>
                </div>
                <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center">
                  <span className="text-lg font-black text-foreground" dir="ltr">{fmtDH(d.engages, lang)}</span>
                  <span className="text-[10px] font-medium text-muted-foreground mt-1">
                    {t("prefDomainDashboard.infrastructure.section6.depenses.engages", "Engagés") as string}
                  </span>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex flex-col items-center justify-center text-center">
                  <span className="text-lg font-black text-emerald-600" dir="ltr">{fmtDH(d.payes, lang)}</span>
                  <span className="text-[10px] font-medium text-emerald-600/80 mt-1">
                    {t("prefDomainDashboard.infrastructure.section6.depenses.payes", "Payés") as string}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ),
    },

    // 2. Eau & Électricité
    {
      id: "eauElectricite",
      title: t("prefDomainDashboard.infrastructure.section6.eauElectricite.title", "Eau & Électricité") as string,
      icon: <Droplets className="h-4 w-4 text-sky-500" />,
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Droplets className="h-4 w-4" /> {t("prefDomainDashboard.infrastructure.section6.eauElectricite.consumption", "Consommation") as string}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-sky-500/5 rounded-xl border border-sky-500/10 flex flex-col justify-center">
                <span className="text-sky-600 font-semibold text-xs flex items-center gap-1.5 mb-1">
                  <Droplets className="h-3.5 w-3.5" /> {t("prefDomainDashboard.infrastructure.section6.eauElectricite.water", "Eau") as string}
                </span>
                <span className="text-xl font-bold text-foreground" dir="ltr">{fmtNum(data.eauElectricite.consommationEau, lang)}</span>
              </div>
              <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 flex flex-col justify-center">
                <span className="text-amber-600 font-semibold text-xs flex items-center gap-1.5 mb-1">
                  <Zap className="h-3.5 w-3.5" /> {t("prefDomainDashboard.infrastructure.section6.eauElectricite.electricity", "Électricité") as string}
                </span>
                <span className="text-xl font-bold text-foreground" dir="ltr">{fmtNum(data.eauElectricite.consommationElectricite, lang)}</span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" /> {t("prefDomainDashboard.infrastructure.section6.eauElectricite.arrears", "Arriérés") as string}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 p-4 bg-red-500/10 rounded-xl border border-red-500/20 flex items-center justify-between">
                <span className="font-bold text-red-700 dark:text-red-400 text-sm">
                  {t("prefDomainDashboard.infrastructure.section6.eauElectricite.totalArrears", "Total Arriérés") as string}
                </span>
                <span className="text-2xl font-black text-red-600" dir="ltr">
                  {fmtDH(data.eauElectricite.arrieresEau + data.eauElectricite.arrieresElectricite, lang)}
                </span>
              </div>
              <div className="p-3 bg-muted/20 rounded-xl border border-border/50">
                <span className="text-[11px] font-medium text-muted-foreground block mb-1">
                  {t("prefDomainDashboard.infrastructure.section6.eauElectricite.water", "Eau") as string}
                </span>
                <span className="text-lg font-bold text-foreground" dir="ltr">{fmtDH(data.eauElectricite.arrieresEau, lang)}</span>
              </div>
              <div className="p-3 bg-muted/20 rounded-xl border border-border/50">
                <span className="text-[11px] font-medium text-muted-foreground block mb-1">
                  {t("prefDomainDashboard.infrastructure.section6.eauElectricite.electricity", "Électricité") as string}
                </span>
                <span className="text-lg font-bold text-foreground" dir="ltr">{fmtDH(data.eauElectricite.arrieresElectricite, lang)}</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // 3. Partenariat
    {
      id: "partenariat",
      title: t("prefDomainDashboard.infrastructure.section6.partenariat.title", "Partenariat") as string,
      icon: <Handshake className="h-4 w-4 text-indigo-500" />,
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Handshake className="h-4 w-4" /> {t("prefDomainDashboard.infrastructure.section6.partenariat.summary", "Bilan") as string}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex items-center justify-between">
                <span className="font-bold text-indigo-700 dark:text-indigo-400 text-sm">
                  {t("prefDomainDashboard.infrastructure.section6.partenariat.total", "Total Projets") as string}
                </span>
                <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400" dir="ltr">
                  {data.partenariat.total}
                </span>
              </div>
              <div className="col-span-2 p-3 bg-muted/20 rounded-xl border border-border/50 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {t("prefDomainDashboard.infrastructure.section6.partenariat.avgProgress", "Avancement moyen") as string}
                </span>
                <span className="text-lg font-bold text-foreground" dir="ltr">{pct(data.partenariat.avancementMoyen)}</span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Building2 className="h-4 w-4" /> {t("prefDomainDashboard.infrastructure.section6.partenariat.byPhase", "Répartition par phase") as string}
            </h4>
            <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-4">
              {data.partenariat.parPhase.length === 0 ? (
                <span className="text-sm text-muted-foreground">
                  {t("prefDomainDashboard.infrastructure.section6.partenariat.noData", "Aucune donnée disponible") as string}
                </span>
              ) : (
                data.partenariat.parPhase.map(({ phase, count }) => {
                  const percentage = data.partenariat.total > 0 ? Math.round((count / data.partenariat.total) * 100) : 0;
                  return (
                    <div key={phase} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-foreground font-medium">{tPhase(phase)}</span>
                        <span className="text-muted-foreground font-bold" dir="ltr">
                          {count} <span className="text-[10px] font-normal">({percentage}%)</span>
                        </span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${percentage}%` }}></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ),
    },

    // 4. BTP — Coût, Montant payé, Taux paiement, Avancement affichés clairement
    {
      id: "btp",
      title: t("prefDomainDashboard.infrastructure.section6.btp.title", "BTP") as string,
      icon: <HardHat className="h-4 w-4 text-orange-500" />,
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <HardHat className="h-4 w-4" /> {t("prefDomainDashboard.infrastructure.section6.btp.breakdown", "Répartition") as string}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-foreground" dir="ltr">{data.btp.construction}</span>
                <span className="text-[10px] font-medium text-muted-foreground mt-1">
                  {t("prefDomainDashboard.infrastructure.categories.construction", "Construction") as string}
                </span>
              </div>
              <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-foreground" dir="ltr">{data.btp.amenagement}</span>
                <span className="text-[10px] font-medium text-muted-foreground mt-1">
                  {t("prefDomainDashboard.infrastructure.categories.amenagement", "Aménagement") as string}
                </span>
              </div>
            </div>
          </div>

          {/* Coût / Montant payé / Taux paiement / Avancement — affichés clairement */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Banknote className="h-4 w-4" /> {t("prefDomainDashboard.infrastructure.section6.btp.financials", "Suivi financier") as string}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/20 rounded-xl border border-border/50">
                <span className="text-[11px] font-medium text-muted-foreground block mb-1">
                  {t("prefDomainDashboard.infrastructure.section6.btp.cost", "Coût") as string}
                </span>
                <span className="text-lg font-bold text-foreground" dir="ltr">{fmtDH(data.btp.coutTotal, lang)}</span>
              </div>
              <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                <span className="text-[11px] font-medium text-emerald-600/80 block mb-1">
                  {t("prefDomainDashboard.infrastructure.section6.btp.paidAmount", "Montant payé") as string}
                </span>
                <span className="text-lg font-bold text-emerald-600" dir="ltr">{fmtDH(data.btp.montantPayeTotal, lang)}</span>
              </div>
              <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                <span className="text-[11px] font-medium text-blue-600/80 block mb-1">
                  {t("prefDomainDashboard.infrastructure.section6.btp.paymentRate", "Taux paiement") as string}
                </span>
                <span className="text-lg font-bold text-blue-600" dir="ltr">{pct(data.btp.tauxPaiement)}</span>
              </div>
              <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
                <span className="text-[11px] font-medium text-amber-600/80 block mb-1">
                  {t("prefDomainDashboard.infrastructure.section6.btp.progress", "Avancement") as string}
                </span>
                <span className="text-lg font-bold text-amber-600" dir="ltr">{pct(data.btp.avancementMoyen)}</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // 5. Projets en souffrance
    {
      id: "enSouffrance",
      title: t("prefDomainDashboard.infrastructure.section6.enSouffrance.title", "Projets en souffrance") as string,
      icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20 flex items-center justify-between">
            <span className="font-bold text-red-700 dark:text-red-400 text-sm">
              {t("prefDomainDashboard.infrastructure.section6.enSouffrance.total", "Total Projets Bloqués") as string}
            </span>
            <span className="text-3xl font-black text-red-600" dir="ltr">{data.enSouffrance.total}</span>
          </div>

          <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-4">
            {data.enSouffrance.causes.length === 0 ? (
              <span className="text-sm text-muted-foreground">
                {t("prefDomainDashboard.infrastructure.section6.enSouffrance.noData", "Aucun projet en souffrance signalé") as string}
              </span>
            ) : (
              data.enSouffrance.causes.map(({ cause, count }) => {
                const percentage = data.enSouffrance.total > 0 ? Math.round((count / data.enSouffrance.total) * 100) : 0;
                return (
                  <div key={cause} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-foreground font-medium">{tCause(cause)}</span>
                      <span className="font-bold text-foreground" dir="ltr">{count}</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted-foreground/20 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ),
    },
  ];
};
