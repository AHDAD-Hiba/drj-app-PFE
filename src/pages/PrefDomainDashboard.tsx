import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AppLayout } from "@/components/AppLayout";
import { PrefDomainDashboardContent } from "@/components/dashboard/PrefDomainDashboardContent";
import { PrefDomainDashboardSection1, PrefDomainDashboardSection1Alerts } from "@/components/dashboard/PrefDomainDashboardSection1";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Layers, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/common/useAuth";
import { type Domain } from "@/lib/domainData";
import { usePrefDomainDashboardData } from "@/hooks/usePrefDomainDashboardData";

type WorkflowStatus = "NON_COMMENCE" | "EN_COURS" | "TERMINE";

const WORKFLOW_STATUS: Record<WorkflowStatus, { label: string; badge: string; icon: any }> = {
  NON_COMMENCE: { label: "NON COMMENCÉ", badge: "bg-warning/15 text-warning", icon: AlertCircle },
  EN_COURS: { label: "EN COURS", badge: "bg-info/15 text-info", icon: Clock },
  TERMINE: { label: "TERMINÉ", badge: "bg-success/15 text-success", icon: CheckCircle2 },
};

const PrefDomainDashboard = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { utilisateur: profile } = useAuth();

  const [domain, setDomain] = useState<Domain>("JEUNESSE");
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const {
    dashboardData,
    dbDomains,
    activeDomainLabel,
    contentDomain,
    isDomainSynced,
    isLoading,
    isInitialLoading,
  } = usePrefDomainDashboardData(profile?.direction_id, year, domain, {
    enableRealtime: true,
    lang,
  });

  const statusKey = (dashboardData?.status.workflowStatus ?? "NON_COMMENCE") as WorkflowStatus;
  const rawStatus = WORKFLOW_STATUS[statusKey] || WORKFLOW_STATUS.NON_COMMENCE;
  const statusMeta = {
    ...rawStatus,
    label: t(`prefDomainDashboard.status.${(statusKey || "NON_COMMENCE").toLowerCase()}`, rawStatus.label),
  };
  const progressPct = dashboardData?.status.progressPct || 0;

  return (
    <AppLayout>
      {dashboardData && (
        <PrefDomainDashboardSection1Alerts
          reportStatus={dashboardData.status.reportStatus}
          correctionComment={dashboardData.status.correctionComment}
          t={t}
        />
      )}

      <div className="space-y-6 animate-fade-in pb-12">
        <div className="gradient-hero rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                  {t("domain.title", "Tableau de bord préfectoral")}
                </h1>
                <p className="text-sm text-white/80 mt-1">{year}</p>
              </div>
            </div>
          </div>
        </div>

        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {t("common.year", "Année")}
              </label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value) || new Date().getFullYear())}
                className="h-9 bg-card"
                min={2020}
                max={2099}
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                <Layers className="h-3 w-3" /> {t("common.domain", "Domaine")}
              </label>
              <Select value={domain} onValueChange={(value) => setDomain(value as Domain)}>
                <SelectTrigger className="h-9 bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dbDomains.map((dom) => (
                    <SelectItem key={dom.code} value={dom.code}>
                      {lang === "ar" ? dom.nom_ar : dom.nom_fr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {isLoading && !isDomainSynced && dashboardData && (
          <p className="text-sm text-muted-foreground animate-pulse">
            {t("loadingIndicators", "Chargement des indicateurs...") as string}
          </p>
        )}

        {isInitialLoading || !dashboardData ? (
          <div className="p-12 text-center animate-pulse">
            {t("loadingIndicators", "Chargement des indicateurs...") as string}
          </div>
        ) : (
          <>
            <PrefDomainDashboardSection1
              statusMeta={statusMeta}
              progressPct={progressPct}
              activeDomainLabel={activeDomainLabel}
              lastUpdated={dashboardData.status.lastUpdated}
              lang={lang}
              t={t}
            />
            <PrefDomainDashboardContent
              dashboardData={dashboardData}
              domain={contentDomain}
              lang={lang}
              t={t}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default PrefDomainDashboard;
