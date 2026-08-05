import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KPIGrid } from "./KPIGrid";
import { Activity } from "lucide-react";

describe("KPIGrid", () => {
  it("renders the provided KPI cards", () => {
    render(
      <KPIGrid
        metrics={[
          {
            label: "Total des Activités",
            value: "42",
            icon: Activity,
            accentClass: "bg-red-500",
            iconContainerClass: "bg-red-100 text-red-600",
          },
        ]}
        title="Top KPIs principaux"
      />,
    );

    expect(screen.getByText("Top KPIs principaux")).toBeInTheDocument();
    expect(screen.getByText("Total des Activités")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });
});
