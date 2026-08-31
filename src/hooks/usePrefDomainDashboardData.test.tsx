import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { usePrefDomainDashboardData } from "./usePrefDomainDashboardData";

// --- Supabase client mock -------------------------------------------------
// The hook only uses supabase for the domains list and realtime channels;
// neither is relevant to this regression test, so both are stubbed out.
vi.mock("@/integrations/supabase/client", () => {
  const channel = {
    on: vi.fn(function (this: unknown) {
      return this;
    }),
    subscribe: vi.fn(),
  };
  return {
    supabase: {
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
      }),
      channel: () => channel,
      removeChannel: vi.fn(),
    },
  };
});

// --- Domain data services mock --------------------------------------------
// Each domain's loader is a controllable deferred promise so the test can
// assert on the state of the hook *while* a fetch for a newly-selected
// domain is still in flight — that's exactly the window in which the
// original bug rendered domain X with domain Y's payload.
type Deferred<T> = { promise: Promise<T>; resolve: (value: T) => void };
function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

let jeunesseDeferred: Deferred<any>;
let infraDeferred: Deferred<any>;

vi.mock("@/services/PrefDomainDashboardDataService", () => ({
  loadDashboard: (...args: unknown[]) => jeunesseDeferred.promise,
}));
vi.mock("@/services/PrefDomainDashboardInfrastructureDataService", () => ({
  loadInfrastructureDashboard: (...args: unknown[]) => infraDeferred.promise,
}));
vi.mock("@/services/PrefDomainDashboardAffairesFemininesDataService", () => ({
  loadAffairesFemininesDashboard: () => new Promise(() => {}),
}));
vi.mock("@/services/PrefDomainDashboardProtectionEnfanceDataService", () => ({
  loadProtectionEnfanceDashboard: () => new Promise(() => {}),
}));
vi.mock("@/services/PrefDomainDashboardEnfanceCrechesDataService", () => ({
  loadEnfanceCrechesDashboard: () => new Promise(() => {}),
}));

// Payload shapes intentionally mirror reality: the Jeunesse payload has no
// Infrastructure KPI fields (e.g. `budgetExecutionRate`), which is what
// crashed `buildInfrastructureKpiItems` when it was ever handed to it.
const jeunessePayload = {
  __marker: "JEUNESSE",
  kpis: { feminizationRate: 42 },
};
const infraPayload = {
  __marker: "INFRA",
  kpis: { budgetExecutionRate: 55, budgetEngagementRate: 61 },
};

beforeEach(() => {
  jeunesseDeferred = createDeferred();
  infraDeferred = createDeferred();
});

describe("usePrefDomainDashboardData — domain switch safety", () => {
  it("never exposes a payload whose domain differs from the currently selected domain", async () => {
    const { result, rerender } = renderHook(
      ({ domain }: { domain: string }) =>
        usePrefDomainDashboardData("direction-1", 2026, domain),
      { initialProps: { domain: "JEUNESSE" } },
    );

    // Initial Jeunesse fetch resolves.
    await act(async () => {
      jeunesseDeferred.resolve(jeunessePayload);
      await jeunesseDeferred.promise;
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    // `__marker` is a test-only fixture field, not part of the real
    // DashboardData contract — cast is needed here now that `dashboardData`
    // is properly typed as `PrefDomainDashboardData | null`.
    expect((result.current.dashboardData as { __marker?: string } | null)?.__marker).toBe("JEUNESSE");

    // Switch the filter to Infrastructure. The Infrastructure fetch is
    // deliberately left pending here to reproduce the exact window in which
    // the crash used to occur.
    rerender({ domain: "INFRA" });

    // Keep the previous Jeunesse payload visible, but never pair it with
    // the newly selected domain — Content must use `contentDomain`.
    expect((result.current.dashboardData as { __marker?: string } | null)?.__marker).toBe("JEUNESSE");
    expect(result.current.contentDomain).toBe("JEUNESSE");
    expect(result.current.isDomainSynced).toBe(false);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isInitialLoading).toBe(false);

    // Now let the Infrastructure fetch resolve.
    await act(async () => {
      infraDeferred.resolve(infraPayload);
      await infraDeferred.promise;
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect((result.current.dashboardData as { __marker?: string } | null)?.__marker).toBe("INFRA");
  });

  it("keeps Jeunesse working normally on initial load", async () => {
    const { result } = renderHook(() =>
      usePrefDomainDashboardData("direction-1", 2026, "JEUNESSE"),
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.dashboardData).toBeNull();

    await act(async () => {
      jeunesseDeferred.resolve(jeunessePayload);
      await jeunesseDeferred.promise;
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect((result.current.dashboardData as { __marker?: string } | null)?.__marker).toBe("JEUNESSE");
  });
});