import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardShell } from "./DashboardShell";

describe("DashboardShell", () => {
  it("renders the provided sections in order", () => {
    render(
      <DashboardShell>
        <div>Header</div>
        <div>KPI</div>
        <div>Repartition</div>
        <div>Evolution</div>
        <div>Benchmark</div>
        <div>Details</div>
      </DashboardShell>,
    );

    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("KPI")).toBeInTheDocument();
    expect(screen.getByText("Repartition")).toBeInTheDocument();
    expect(screen.getByText("Evolution")).toBeInTheDocument();
    expect(screen.getByText("Benchmark")).toBeInTheDocument();
    expect(screen.getByText("Details")).toBeInTheDocument();
  });
});
