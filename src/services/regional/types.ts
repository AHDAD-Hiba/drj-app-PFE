/**
 * Contrat générique du Dashboard Régional.
 *
 * Chaque domaine conserve ses types métier pour kpis / section3 / evolution /
 * detailed. Ce fichier n'impose que l'enveloppe commune :
 * status, kpis, section3, evolution, comparison, detailed.
 */

export type RegionalStatus = "NON_COMMENCE" | "EN_COURS" | "TERMINE";

export interface RegionalLoadStatus {
  hasData: boolean;
  submittedReports: number;
  completedDirections: number;
  inProgressDirections: number;
  notStartedDirections: number;
}

export interface RegionalDirectionComparison {
  id: string;
  name: string;
  status: RegionalStatus;
  primary: number | null;
  secondary: number | null;
  rank?: number | null;
  score?: number | null;
}

export interface RegionalMetric {
  key: string;
  label: string;
  regionalAverage: number | null;
}

export interface RegionalComparison {
  directions: RegionalDirectionComparison[];
  primary: RegionalMetric;
  secondary: RegionalMetric;
  score?: {
    label: string;
    methodology: string;
  };
}

export interface RegionalDashboardData<TKpis, TSection3, TEvolution, TDetailed = undefined> {
  status: RegionalLoadStatus;
  kpis: TKpis;
  section3: TSection3;
  evolution: TEvolution;
  comparison: RegionalComparison;
  detailed?: TDetailed;
}

export type RegionalDashboardService<
  TData extends RegionalDashboardData<unknown, unknown, unknown, unknown>,
> = (year: number, lang?: string) => Promise<TData>;
