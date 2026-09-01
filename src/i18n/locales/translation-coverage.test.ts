import { describe, expect, it } from "vitest";
import fr from "./fr.json";
import ar from "./ar.json";

const requiredKeys = [
  "common.gender.garcons",
  "common.gender.filles",
  "regDomainDashboard.generic.formationRepartitionTitle",
  "regDomainDashboard.generic.kpiRegionalSubtitle",
  "regDomainDashboard.infra.sectionFinance.title",
  "regDomainDashboard.infra.kpis.creditsOuverts",
  "regDomainDashboard.femme.section.title",
  "regDomainDashboard.femme.kpis.inscriptionsFormation",
  "regDomainDashboard.pe.section.title",
  "regDomainDashboard.pe.kpis.beneficiairesPriseEnCharge",
  "regDomainDashboard.creches.section.title",
  "regDomainDashboard.creches.kpis.enfantsPrisEnCharge",
];

const get = (obj: Record<string, any>, path: string) =>
  path.split(".").reduce<Record<string, any> | string | number | undefined>(
    (acc, key) => {
      if (acc && typeof acc === "object") return (acc as Record<string, any>)[key];
      return undefined;
    },
    obj as Record<string, any>,
  );

describe("regional dashboard i18n coverage", () => {
  it("keeps the required regional dashboard keys in both languages", () => {
    for (const key of requiredKeys) {
      expect(get(fr, key), `${key} missing from fr.json`).toBeDefined();
      expect(get(ar, key), `${key} missing from ar.json`).toBeDefined();
    }
  });
});
