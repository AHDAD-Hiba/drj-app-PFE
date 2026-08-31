import { supabase } from "@/integrations/supabase/client";

export const averageDirectionalKpis = <T extends object>(directionKpis: T[]) => {
  if (directionKpis.length === 0) {
    return {} as Partial<Record<keyof T, number>>;
  }

  const keys = new Set<string>();
  directionKpis.forEach((kpis) => Object.keys(kpis as Record<string, unknown>).forEach((key) => keys.add(key)));

  const averages = {} as Record<string, number>;
  keys.forEach((key) => {
    const values = directionKpis
      .map((kpis) => Number((kpis as Record<string, unknown>)[key] ?? 0))
      .filter((value) => Number.isFinite(value));
    averages[key] = values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
  });

  return averages as Partial<Record<keyof T, number>>;
};

export const loadRegionalDirectionIds = async (directionId: string): Promise<string[]> => {
  const { data: direction } = await supabase.from("directions").select("region").eq("id", directionId).maybeSingle();
  const region = direction?.region;

  if (region === null || region === undefined || region === "") {
    return [directionId];
  }

  const { data: regionalDirections } = await supabase.from("directions").select("id").eq("region", region);
  const ids = (regionalDirections ?? []).map((row) => row.id);

  return ids.length > 0 ? ids : [directionId];
};

export const loadRegionalReportsForDirectionIds = async (directionIds: string[], year: number) => {
  if (directionIds.length === 0) {
    return [] as Array<{ id: string; direction_id: string | null; trimestre: string | null }>;
  }

  const { data } = await supabase
    .from("rapports")
    .select("id, direction_id, trimestre")
    .eq("annee", year)
    .in("direction_id", directionIds);

  return (data ?? []) as Array<{ id: string; direction_id: string | null; trimestre: string | null }>;
};

export const uniqueIds = (ids: Array<string | null | undefined>) =>
  Array.from(new Set(ids.filter((id): id is string => typeof id === "string" && id.length > 0)));

export const filterByRapportIds = <T extends { rapport_id?: string | null }>(
  rows: T[],
  rapportIds: Set<string>,
) => {
  if (rapportIds.size === 0) return [] as T[];
  return rows.filter((row) => !!row.rapport_id && rapportIds.has(row.rapport_id));
};
