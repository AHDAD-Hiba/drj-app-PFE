import type { TFunction } from "i18next";
import {
  GraduationCap,
  Handshake,
  HeartHandshake,
  Megaphone,
  TrendingUp,
  Users,
} from "lucide-react";
import type { KpiItem } from "./types";
import type { AffairesFemininesKpisRaw } from "@/services/PrefDomainDashboardAffairesFemininesDataService";

/**
 * Construit les 6 KPIs du domaine Affaires Féminines pour Section2.
 * Les icônes et couleurs sont propres à ce domaine — Section2 ne
 * décide jamais quelle icône utiliser.
 *
 * IMPORTANT — Robustesse `.toFixed()` : les valeurs numériques sont
 * garanties par le service (toujours des nombres, jamais undefined/null).
 * On applique de plus ?? 0 pour couvrir tout cas limite.
 */
export const buildAffairesFemininesKpiItems = (
  kpis: AffairesFemininesKpisRaw,
  t: TFunction,
  lang: string,
): KpiItem[] => {
  const fmtNum = (n: number) =>
    new Intl.NumberFormat(lang === "ar" ? "ar-MA" : "fr-FR").format(Math.round(n));

  return [
    // 1. Inscriptions Formation (Clubs + OFPPT)
    {
      id: "totalInscriptionsFormation",
      icon: <GraduationCap className="h-5 w-5" />,
      value: kpis.totalInscriptionsFormation ?? 0,
      format: "number",
      label: t(
        "prefDomainDashboard.affairesFeminines.kpis.totalInscriptionsFormation",
        "Inscriptions Formation",
      ),
      color: {
        accentBarClassName: "bg-[hsl(var(--kpi-1))]",
        iconWrapperClassName: "bg-[hsl(var(--kpi-1-soft))] text-[hsl(var(--kpi-1))]",
      },
    },
    // 2. Taux d'intégration des lauréates
    {
      id: "tauxIntegrationLaureates",
      icon: <TrendingUp className="h-5 w-5" />,
      value: `${(kpis.tauxIntegrationLaureates ?? 0).toFixed(1)}%`,
      format: "text",
      label: t(
        "prefDomainDashboard.affairesFeminines.kpis.tauxIntegrationLaureates",
        "Taux d'intégration des lauréates",
      ),
      color: {
        accentBarClassName: "bg-[hsl(var(--kpi-2))]",
        iconWrapperClassName: "bg-[hsl(var(--kpi-2-soft))] text-[hsl(var(--kpi-2))]",
      },
    },
    // 3. Bénéficiaires Sensibilisation & Portes Ouvertes
    {
      id: "totalBeneficiairesSensibilisationPortesOuvertes",
      icon: <Megaphone className="h-5 w-5" />,
      value: fmtNum(kpis.totalBeneficiairesSensibilisationPortesOuvertes ?? 0),
      format: "text",
      label: t(
        "prefDomainDashboard.affairesFeminines.kpis.totalBeneficiairesSensibilisationPortesOuvertes",
        "Bénéficiaires Sensibilisation & Portes Ouvertes",
      ),
      color: {
        accentBarClassName: "bg-[hsl(var(--kpi-3))]",
        iconWrapperClassName: "bg-[hsl(var(--kpi-3-soft))] text-[hsl(var(--kpi-3))]",
      },
    },
    // 4. Bénéficiaires AGR
    {
      id: "totalBeneficiairesAgr",
      icon: <Users className="h-5 w-5" />,
      value: kpis.totalBeneficiairesAgr ?? 0,
      format: "number",
      label: t(
        "prefDomainDashboard.affairesFeminines.kpis.totalBeneficiairesAgr",
        "Bénéficiaires AGR",
      ),
      color: {
        accentBarClassName: "bg-[hsl(var(--kpi-4))]",
        iconWrapperClassName: "bg-[hsl(var(--kpi-4-soft))] text-[hsl(var(--kpi-4))]",
      },
    },
    // 5. Partenariats suivis
    {
      id: "totalPartenariatsSuivis",
      icon: <Handshake className="h-5 w-5" />,
      value: kpis.totalPartenariatsSuivis ?? 0,
      format: "number",
      label: t(
        "prefDomainDashboard.affairesFeminines.kpis.totalPartenariatsSuivis",
        "Partenariats suivis",
      ),
      color: {
        accentBarClassName: "bg-[hsl(var(--kpi-5))]",
        iconWrapperClassName: "bg-[hsl(var(--kpi-5-soft))] text-[hsl(var(--kpi-5))]",
      },
    },
    // 6. Séances Centres d'Écoute
    {
      id: "totalSeancesCentresEcoute",
      icon: <HeartHandshake className="h-5 w-5" />,
      value: kpis.totalSeancesCentresEcoute ?? 0,
      format: "number",
      label: t(
        "prefDomainDashboard.affairesFeminines.kpis.totalSeancesCentresEcoute",
        "Séances Centres d'Écoute",
      ),
      color: {
        accentBarClassName: "bg-[hsl(var(--kpi-6))]",
        iconWrapperClassName: "bg-[hsl(var(--kpi-6-soft))] text-[hsl(var(--kpi-6))]",
      },
    },
  ];
};
