import type { ReactNode } from "react";

/**
 * Comment la valeur du KPI doit être affichée par le composant générique.
 * - "number"  : formatage via Intl.NumberFormat selon la langue (ex: 1 234)
 * - "text"    : la valeur est déjà formatée par le domaine (ex: "45.2%")
 */
export type KpiFormat = "number" | "text";

export interface KpiColorTheme {
  /** Classe de la barre d'accent à gauche de la carte */
  accentBarClassName: string;
  /** Classe du fond + couleur de l'icône */
  iconWrapperClassName: string;
}

/**
 * Un KPI générique affiché par PrefDomainDashboardSection2.
 * L'icône et les couleurs sont toujours fournies par le domaine
 * (ex: JeunesseKpiConfig) — Section2 ne choisit jamais une icône.
 */
export interface KpiItem {
  /** Identifiant unique et stable du KPI (clé React) */
  id: string;
  /** Icône déjà instanciée par le domaine (ex: <Activity className="h-5 w-5" />) */
  icon: ReactNode;
  /** Libellé affiché sous la valeur */
  label: string;
  /** Valeur brute (nombre) ou déjà formatée (string) selon `format` */
  value: number | string;
  /** Stratégie de formatage à appliquer par Section2. Défaut: "number" */
  format?: KpiFormat;
  /** Thème de couleur de la carte */
  color: KpiColorTheme;
}
