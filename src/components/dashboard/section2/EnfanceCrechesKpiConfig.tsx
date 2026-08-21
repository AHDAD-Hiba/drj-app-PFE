import type { TFunction } from "i18next";
import { Baby, BriefcaseBusiness, Clock3, HousePlus, ShieldCheck, Users } from "lucide-react";
import type { KpiItem } from "./types";
import type { EnfanceCrechesKpisRaw } from "@/services/PrefDomainDashboardEnfanceCrechesDataService";

export const buildEnfanceCrechesKpiItems = (
  kpis: EnfanceCrechesKpisRaw,
  t: TFunction,
): KpiItem[] => [
  {
    id: "enfantsPrisesEnCharge",
    icon: <Users className="h-5 w-5" />,
    value: kpis.enfantsPrisesEnCharge,
    format: "number",
    label: t("prefDomainDashboard.enfanceCreches.kpis.enfantsPrisesEnCharge", "Enfants pris en charge"),
    color: { accentBarClassName: "bg-[hsl(var(--kpi-1))]", iconWrapperClassName: "bg-[hsl(var(--kpi-1-soft))] text-[hsl(var(--kpi-1))]" },
  },
  {
    id: "demandesLicencesTraitees",
    icon: <ShieldCheck className="h-5 w-5" />,
    value: kpis.demandesLicencesTraitees,
    format: "number",
    label: t("prefDomainDashboard.enfanceCreches.kpis.demandesLicencesTraitees", "Demandes de licences traitées"),
    color: { accentBarClassName: "bg-[hsl(var(--kpi-2))]", iconWrapperClassName: "bg-[hsl(var(--kpi-2-soft))] text-[hsl(var(--kpi-2))]" },
  },
  {
    id: "delaiMoyenTraitementJours",
    icon: <Clock3 className="h-5 w-5" />,
    value: `${kpis.delaiMoyenTraitementJours.toFixed(1)} j`,
    format: "text",
    label: t("prefDomainDashboard.enfanceCreches.kpis.delaiMoyenTraitement", "Délai moyen de traitement (jours)"),
    color: { accentBarClassName: "bg-[hsl(var(--kpi-3))]", iconWrapperClassName: "bg-[hsl(var(--kpi-3-soft))] text-[hsl(var(--kpi-3))]" },
  },
  {
    id: "cadresAssermentes",
    icon: <BriefcaseBusiness className="h-5 w-5" />,
    value: kpis.cadresAssermentes,
    format: "number",
    label: t("prefDomainDashboard.enfanceCreches.kpis.cadresAssermentes", "Cadres assermentés"),
    color: { accentBarClassName: "bg-[hsl(var(--kpi-4))]", iconWrapperClassName: "bg-[hsl(var(--kpi-4-soft))] text-[hsl(var(--kpi-4))]" },
  },
  {
    id: "crechesLabelliseesQualite",
    icon: <HousePlus className="h-5 w-5" />,
    value: kpis.crechesLabelliseesQualite,
    format: "number",
    label: t("prefDomainDashboard.enfanceCreches.kpis.crechesLabelliseesQualite", "Crèches labellisées qualité (obtenues)"),
    color: { accentBarClassName: "bg-[hsl(var(--kpi-5))]", iconWrapperClassName: "bg-[hsl(var(--kpi-5-soft))] text-[hsl(var(--kpi-5))]" },
  },
  {
    id: "fermeturesCrechesSignalees",
    icon: <Baby className="h-5 w-5" />,
    value: kpis.fermeturesCrechesSignalees,
    format: "number",
    label: t("prefDomainDashboard.enfanceCreches.kpis.fermeturesCreches", "Fermetures de crèches signalées"),
    color: { accentBarClassName: "bg-[hsl(var(--kpi-6))]", iconWrapperClassName: "bg-[hsl(var(--kpi-6-soft))] text-[hsl(var(--kpi-6))]" },
  },
];
