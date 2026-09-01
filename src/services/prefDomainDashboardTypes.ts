// Contrat générique partagé par les 5 dashboards de domaine (Jeunesse,
// Infrastructure, Affaires Féminines, Protection de l'Enfance, Enfance et
// Crèches). Chaque domaine garde sa propre forme métier pour kpis /
// section3 / evolution / detailed : ce fichier ne fait qu'unifier
// l'enveloppe TypeScript (status / kpis / section3 / evolution / benchmark
// / detailed), sans imposer de structure interne commune.

import type { PrefDomainBenchmarkRow } from "@/components/dashboard/PrefDomainBenchmarkTable";

export interface DashboardStatus {
  workflowStatus: string;
  progressPct: number;
  lastUpdated: string | null;
  correctionComment: string | null;
  reportStatus?: string;
}

export interface DashboardData<TKpis, TSection3, TEvolution, TDetailed> {
  status: DashboardStatus;
  kpis: TKpis;
  section3: TSection3;
  evolution: TEvolution;
  benchmark: PrefDomainBenchmarkRow[];
  detailed: TDetailed;
}

// --- Type union central (ÉTAPE 6) ---
// Représente les données d'un domaine préfectoral, quel qu'il soit. Chaque
// membre reste la forme métier réelle du domaine (aucune structure commune
// n'est imposée au-delà de l'enveloppe DashboardData<...> ci-dessus).
// Import type-only : évite toute dépendance circulaire à l'exécution avec
// les 5 fichiers de service (elle n'existe qu'au niveau des types).
import type { JeunesseDashboardData } from "./PrefDomainDashboardDataService";
import type { InfrastructureDashboardData } from "./PrefDomainDashboardInfrastructureDataService";
import type { AffairesFemininesDashboardData } from "./PrefDomainDashboardAffairesFemininesDataService";
import type { ProtectionEnfanceDashboardData } from "./PrefDomainDashboardProtectionEnfanceDataService";
import type { EnfanceCrechesDashboardData } from "./PrefDomainDashboardEnfanceCrechesDataService";

export type PrefDomainDashboardData =
  | JeunesseDashboardData
  | InfrastructureDashboardData
  | AffairesFemininesDashboardData
  | ProtectionEnfanceDashboardData
  | EnfanceCrechesDashboardData;
