import { describe, expect, it } from "vitest";
import {
  averageDirectionalKpis,
  filterByRapportIds,
  uniqueIds,
} from "./prefDomainRegionalBenchmark";

describe("averageDirectionalKpis", () => {
  it("returns the arithmetic mean for each KPI across same-region directions", () => {
    const avg = averageDirectionalKpis([
      {
        budgetExecutionRate: 60,
        totalProjetsBtp: 10,
        totalProjetsPartenariat: 20,
        totalProjetsEnSouffrance: 4,
        totalArrieres: 500,
      },
      {
        budgetExecutionRate: 80,
        totalProjetsBtp: 20,
        totalProjetsPartenariat: 30,
        totalProjetsEnSouffrance: 2,
        totalArrieres: 1000,
      },
    ]);

    expect(avg.budgetExecutionRate).toBe(70);
    expect(avg.totalProjetsBtp).toBe(15);
    expect(avg.totalProjetsPartenariat).toBe(25);
    expect(avg.totalProjetsEnSouffrance).toBe(3);
    expect(avg.totalArrieres).toBe(750);
  });

  it("returns a zero-filled object when there is no regional data to average", () => {
    expect(averageDirectionalKpis([] as any)).toEqual({});
  });
});

describe("uniqueIds / filterByRapportIds", () => {
  it("deduplicates ids and drops empty values", () => {
    expect(uniqueIds(["a", "b", "a", "", null, undefined])).toEqual(["a", "b"]);
  });

  it("keeps only rows whose rapport_id is in the local set", () => {
    const rows = [
      { rapport_id: "r1", n: 1 },
      { rapport_id: "r2", n: 2 },
      { rapport_id: null, n: 3 },
    ];
    expect(filterByRapportIds(rows, new Set(["r1"]))).toEqual([{ rapport_id: "r1", n: 1 }]);
  });
});
