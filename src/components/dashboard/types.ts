export type DashboardTranslator = (key: string, fallback?: string) => string;

export interface RepartitionRow {
  name: string;
  total: number;
  hommesPct: number;
  femmesPct: number;
  urbainPct: number;
  ruralPct: number;
}

export interface EvolutionRow {
  name: string;
  Camping: number | null;
  Festivals: number | null;
  Formation: number | null;
  Insertion: number | null;
}
