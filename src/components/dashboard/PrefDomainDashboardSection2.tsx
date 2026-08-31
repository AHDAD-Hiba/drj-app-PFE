import type { TFunction } from "i18next";
import { Card } from "@/components/ui/card";
import { KpiCard } from "./KpiCard";
import type { KpiItem } from "./section2/types";

interface PrefDomainDashboardSection2Props {
  /** Liste des KPIs à afficher, déjà construite par le domaine (icônes, couleurs, labels). */
  items: KpiItem[];
  lang: string;
  t: TFunction;
}

const KPIS_PER_ROW = 3;

const chunkItems = (items: KpiItem[], size: number): KpiItem[][] => {
  const rows: KpiItem[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
};

const formatKpiValue = (item: KpiItem, lang: string): string => {
  if (item.format === "text") {
    return String(item.value);
  }
  // format "number" (par défaut) : formatage générique selon la langue
  const numericValue = typeof item.value === "number" ? item.value : Number(item.value) || 0;
  return new Intl.NumberFormat(lang === "ar" ? "ar-MA" : "fr-FR").format(Math.round(numericValue));
};

/**
 * Section2 générique : affiche une grille de cartes KPI.
 * Ce composant ne connaît aucun domaine (Jeunesse, Infrastructure, ...).
 * Il ne décide jamais quelle icône ou quelle couleur utiliser : tout provient
 * des items fournis par la config du domaine (ex: JeunesseKpiConfig).
 */
export const PrefDomainDashboardSection2 = ({
  items,
  lang,
  t,
}: PrefDomainDashboardSection2Props) => {
  const rows = chunkItems(items, KPIS_PER_ROW);

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base sm:text-lg font-bold text-foreground">
          {t("prefDomainDashboard.kpis.title", "Top KPIs principaux")}
        </h2>
      </div>
      <Card className="p-4 sm:p-5">
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${rowIndex > 0 ? "mt-4" : ""}`}
          >
            {row.map((item) => (
              <KpiCard
                key={item.id}
                icon={item.icon}
                value={formatKpiValue(item, lang)}
                label={item.label}
                accentBarClassName={item.color.accentBarClassName}
                iconWrapperClassName={item.color.iconWrapperClassName}
              />
            ))}
          </div>
        ))}
      </Card>
    </section>
  );
};
