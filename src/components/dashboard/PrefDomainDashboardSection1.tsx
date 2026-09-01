import type { TFunction } from "i18next";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, CheckCircle2 } from "lucide-react";

export interface PrefDomainDashboardSection1StatusMeta {
  label: string;
  badge: string;
  icon: any;
}

interface PrefDomainDashboardSection1AlertsProps {
  reportStatus: string;
  correctionComment?: string | null;
  t: TFunction;
}

/**
 * Encarts "Retour de correction" / "Rapport validé".
 * Rendu identique au bloc précédemment inline dans PrefDomainDashboard.tsx,
 * juste après l'ouverture de <AppLayout> (avant le HERO HEADER).
 */
export const PrefDomainDashboardSection1Alerts = ({
  reportStatus,
  correctionComment,
  t,
}: PrefDomainDashboardSection1AlertsProps) => {
  return (
    <>
      {reportStatus === "RETOUR_CORRECTION" && (
        <Card className="mb-5 border-orange-500 bg-orange-50">
          <CardContent className="p-4">
            <h3 className="font-bold text-orange-700">
              {t("prefDomainDashboard.section1Alerts.correctionTitle", "⚠ Retour de correction")}
            </h3>

            <p className="mt-2 text-sm">
              {t(
                "prefDomainDashboard.section1Alerts.correctionBody",
                "L'équipe régionale demande des modifications.",
              )}
            </p>

            {correctionComment && (
              <div className="mt-3 rounded border bg-white p-3">{correctionComment}</div>
            )}
          </CardContent>
        </Card>
      )}

      {reportStatus === "VALIDE" && (
        <Card className="mb-5 border-green-500 bg-green-50">
          <CardContent className="p-4">
            <h3 className="font-bold text-green-700 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />{" "}
              {t("prefDomainDashboard.section1Alerts.validatedTitle", "Rapport validé")}
            </h3>

            <p className="mt-2 text-sm">
              {t(
                "prefDomainDashboard.section1Alerts.validatedBody",
                "Votre rapport a été validé par l'équipe régionale.",
              )}
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
};

interface PrefDomainDashboardSection1Props {
  statusMeta: PrefDomainDashboardSection1StatusMeta;
  progressPct: number;
  activeDomainLabel: string;
  lastUpdated: string | null | undefined;
  lang: string;
  t: TFunction;
}

/**
 * Section 1 — Suivi du rapport.
 * Statut / Domaine Filtré / Dernière mise à jour / Barre de progression.
 * Rendu identique au bloc <section> "SECTION 1" précédemment inline
 * dans PrefDomainDashboard.tsx. Composant purement présentationnel :
 * toutes les données/valeurs déjà calculées sont reçues via props.
 */
export const PrefDomainDashboardSection1 = ({
  statusMeta,
  progressPct,
  activeDomainLabel,
  lastUpdated,
  lang,
  t,
}: PrefDomainDashboardSection1Props) => {
  const StatusIcon = statusMeta.icon;

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-base sm:text-lg font-bold text-foreground">
          {t("prefDomainDashboard.workflow.title", "Suivi du rapport")}
        </h2>
      </div>
      <Card className="p-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 items-center">
          {/* Statut */}
          <div
            className={`rounded-xl p-4 ${statusMeta.badge} bg-opacity-30 ring-1 ring-current/20`}
          >
            <div className="flex items-center gap-2">
              <StatusIcon className="h-4 w-4" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                {t("prefDomainDashboard.workflow.status", "Statut")}
              </span>
            </div>
            <div className="text-lg font-extrabold mt-1">{statusMeta.label}</div>
          </div>

          {/* Domaine Filtré */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("prefDomainDashboard.workflow.filteredDomain", "Domaine Filtré")}
            </div>
            <div className="text-lg font-bold text-foreground mt-1">{activeDomainLabel}</div>
          </div>

          {/* Dernière mise à jour */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("prefDomainDashboard.workflow.lastUpdate", "Dernière mise à jour")}
            </div>
            <div className="text-lg font-bold text-foreground mt-1 flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              {lastUpdated
                ? new Date(lastUpdated).toLocaleDateString(lang === "ar" ? "ar-MA" : "fr-FR")
                : "-"}
            </div>
          </div>

          {/* Progression */}
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("prefDomainDashboard.workflow.progress", "Progression")}
              </span>
              <span className="text-sm font-bold tabular-nums text-foreground">{progressPct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
};
