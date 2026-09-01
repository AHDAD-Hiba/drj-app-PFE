import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAutoSave } from "./useAutoSave";

describe("useAutoSave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("flushes the pending save immediately when requested", async () => {
    const onSave = vi.fn().mockResolvedValue(true);

    const { result, rerender } = renderHook(
      ({ values }) => useAutoSave(values, onSave, { enabled: true, debounceMs: 1000 }),
      { initialProps: { values: { draft: "A" } } },
    );

    rerender({ values: { draft: "B" } });

    expect(onSave).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.flush();
    });

    expect(onSave).toHaveBeenCalledWith({ draft: "B" });
  });
});
