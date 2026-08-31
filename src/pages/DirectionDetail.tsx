import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Database } from "@/integrations/supabase/types";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PrefDomainDashboardContent } from "@/components/dashboard/PrefDomainDashboardContent";
import { usePrefDomainDashboardData } from "@/hooks/usePrefDomainDashboardData";
import { useAuth } from "@/hooks/common/useAuth";
import { type Domain } from "@/lib/domainData";
import { DEFAULT_YEAR } from "@/components/YearSwitcher";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  Activity,
  MapPin,
  CalendarDays,
  Layers,
  XCircle,
} from "lucide-react";

type Direction = Database["public"]["Tables"]["directions"]["Row"];

const STATUS_STYLE: Record<string, string> = {
  TERMINE: "bg-success/15 text-success border-success/30",
  EN_COURS: "bg-info/15 text-info border-info/30",
  NON_COMMENCE: "bg-warning/15 text-warning border-warning/30",
  validee: "bg-success/15 text-success border-success/30",
  soumise: "bg-info/15 text-info border-info/30",
};

const VALID_DOMAINS = new Set(["JEUNESSE", "INFRA", "FEMME", "PE", "CRECHES"]);

const resolveDomain = (raw: string | null): Domain => {
  const upper = (raw ?? "JEUNESSE").toUpperCase();
  return VALID_DOMAINS.has(upper) ? upper : "JEUNESSE";
};

const DirectionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { utilisateur, isPrefectoral } = useAuth();

  const selectedDomain = resolveDomain(searchParams.get("domain"));
  const selectedYear = Number(searchParams.get("year")) || DEFAULT_YEAR;

  const [direction, setDirection] = useState<Direction | null>(null);
  const [directionLoading, setDirectionLoading] = useState(true);

  const { dashboardData, isInitialLoading: dashboardLoading, activeDomainLabel, contentDomain } = usePrefDomainDashboardData(
    id,
    selectedYear,
    selectedDomain,
    { lang },
  );

  useEffect(() => {
    if (!id) return;

    (async () => {
      setDirectionLoading(true);
      const { data: dir } = await supabase.from("directions").select("*").eq("id", id).maybeSingle();
      setDirection(dir);
      setDirectionLoading(false);
    })();
  }, [id]);

  const metriquesGlobales = useMemo(() => {
    if (!dashboardData?.status) {
      return { progression: 0, statut: "NON_COMMENCE", lastUpdate: null as string | null };
    }
    return {
      progression: dashboardData.status.progressPct || 0,
      statut: dashboardData.status.workflowStatus || "NON_COMMENCE",
      lastUpdate: dashboardData.status.lastUpdated || null,
    };
  }, [dashboardData]);

  const loading = directionLoading || dashboardLoading;

  if (loading) {
    return (
      <AppLayout>
        <div className="p-12 text-center animate-pulse text-muted-foreground">
          {t("RegDomainDashboard.loadingPrefecture", "Chargement de l'analyse détaillée de la préfecture...")}
        </div>
      </AppLayout>
    );
  }

  if (isPrefectoral && utilisateur?.direction_id && id !== utilisateur.direction_id) {
    return (
      <AppLayout>
        <Card className="p-8 text-center border-border/60">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-bold text-foreground">{t("common.accessDenied", "Accès refusé")}</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {t("directionDetails.prefectoralOnlyOwn", "Vous ne pouvez consulter que votre propre direction.")}
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate("/directions")} className="mt-4 gap-2">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t("detail.back")}
          </Button>
        </Card>
      </AppLayout>
    );
  }

  if (!direction) {
    return (
      <AppLayout>
        <Card className="p-8 text-center border-border/60">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
            <Building2 className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-bold text-foreground">{t("directionDetails.notFound", "Direction introuvable")}</h2>
          <Button variant="outline" size="sm" onClick={() => navigate("/directions")} className="mt-4 gap-2">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t("detail.back")}
          </Button>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <DashboardShell>
        <Card className="overflow-hidden rounded-xl border-border/60 shadow-none">
          <div className="p-5 sm:p-6 border-b border-border bg-gradient-to-br from-primary/5 via-card to-card">
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              <button onClick={() => navigate("/directions")} className="hover:text-primary transition-smooth font-medium">
                {t("nav.directions")}
              </button>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground font-semibold">{lang === "ar" ? direction.nom_ar : direction.nom_fr}</span>
            </nav>

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  {lang === "ar" ? direction.nom_ar : direction.nom_fr}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <Badge variant="outline" className="text-[10px] border-border/60 shadow-none">
                    <Layers className="h-3 w-3 me-1 text-primary" />
                    {activeDomainLabel}
                  </Badge>

                  <Badge variant="outline" className="text-[10px] border-border/60 shadow-none">
                    <CalendarDays className="h-3 w-3 me-1 text-primary" />
                    {t("common.year", "Année")} {selectedYear}
                  </Badge>

                  <Badge variant="outline" className="text-[10px] border-border/60 shadow-none">
                    <MapPin className="h-3 w-3 me-1 text-primary" />
                    {t("directionDetails.region")}
                  </Badge>

                  <Badge
                    variant="outline"
                    className={`text-[10px] shadow-none ${STATUS_STYLE[metriquesGlobales.statut] || STATUS_STYLE["NON_COMMENCE"]}`}
                  >
                    <CheckCircle2 className="h-3 w-3 me-1" />
                    {metriquesGlobales.statut ? t(`status.${metriquesGlobales.statut}`) : t("directionDetails.notStarted")}
                  </Badge>

                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 shadow-none">
                    <Activity className="h-3 w-3 me-1" />
                    {t("directionDetails.progression")} {metriquesGlobales.progression}%
                  </Badge>

                  {metriquesGlobales.lastUpdate && (
                    <Badge variant="outline" className="text-[10px] border-border/60 shadow-none">
                      <CalendarDays className="h-3 w-3 me-1" />
                      {t("directionDetails.lastUpdate")}{" "}
                      {new Date(metriquesGlobales.lastUpdate).toLocaleDateString(lang === "ar" ? "ar-MA" : "fr-FR")}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
                <span>{t("directionDetails.inputProgress")}</span>
                <span className="tabular-nums font-semibold">{metriquesGlobales.progression}%</span>
              </div>
              <Progress value={metriquesGlobales.progression} className="h-2" />
            </div>
          </div>
        </Card>

        {dashboardData && (
          <PrefDomainDashboardContent
            dashboardData={dashboardData}
            domain={contentDomain}
            lang={lang}
            t={t}
          />
        )}
      </DashboardShell>
    </AppLayout>
  );
};

export default DirectionDetail;
