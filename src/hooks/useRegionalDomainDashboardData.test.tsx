import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RegionalDashboardPayload } from "@/services/regional/regionalDashboardServices";
import { useRegionalDomainDashboardData } from "./useRegionalDomainDashboardData";

type Deferred = {
  promise: Promise<RegionalDashboardPayload>;
  resolve: (data: RegionalDashboardPayload) => void;
  reject: (reason: Error) => void;
};

const createDeferred = (): Deferred => {
  let resolve!: (data: RegionalDashboardPayload) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<RegionalDashboardPayload>((success, failure) => {
    resolve = success;
    reject = failure;
  });
  return { promise, resolve, reject };
};

let jeunesseRequest: Deferred;
let infraRequest: Deferred;

vi.mock("@/services/regional/regionalDashboardServices", () => ({
  REGIONAL_DOMAIN_CODES: ["JEUNESSE", "INFRA", "FEMME", "PE", "CRECHES"],
  getRegionalDashboardService: (domain: string) => {
    if (domain === "JEUNESSE") return () => jeunesseRequest.promise;
    if (domain === "INFRA") return () => infraRequest.promise;
    return null;
  },
}));

const jeunessePayload = { kpis: { total_beneficiaires: 1 } } as unknown as RegionalDashboardPayload;
const infrastructurePayload = {
  kpis: { credits_ouverts: 1 },
} as unknown as RegionalDashboardPayload;

beforeEach(() => {
  jeunesseRequest = createDeferred();
  infraRequest = createDeferred();
});

describe("useRegionalDomainDashboardData", () => {
  it("keeps previous data during refresh and ignores an obsolete response", async () => {
    const { result, rerender } = renderHook(
      ({ domain }: { domain: "JEUNESSE" | "INFRA" }) =>
        useRegionalDomainDashboardData(domain, 2040, "fr"),
      { initialProps: { domain: "JEUNESSE" as const } },
    );

    await act(async () => {
      jeunesseRequest.resolve(jeunessePayload);
      await jeunesseRequest.promise;
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    rerender({ domain: "INFRA" });
    expect(result.current.data).toBe(jeunessePayload);
    expect(result.current.contentDomain).toBe("JEUNESSE");
    expect(result.current.isRefreshing).toBe(true);

    await act(async () => {
      infraRequest.resolve(infrastructurePayload);
      await infraRequest.promise;
    });
    await waitFor(() => expect(result.current.contentDomain).toBe("INFRA"));

    await act(async () => {
      jeunesseRequest.resolve(jeunessePayload);
    });
    expect(result.current.data).toBe(infrastructurePayload);
  });

  it("exits loading with an error when the initial request fails", async () => {
    const { result } = renderHook(() => useRegionalDomainDashboardData("JEUNESSE", 2041, "fr"));
    await act(async () => {
      jeunesseRequest.reject(new Error("network"));
      try {
        await jeunesseRequest.promise;
      } catch {
        // The hook owns the rejected promise and exposes it as state.
      }
    });
    await waitFor(() => expect(result.current.error?.message).toBe("network"));
    expect(result.current.loading).toBe(false);
  });
});
