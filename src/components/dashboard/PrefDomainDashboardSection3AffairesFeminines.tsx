import type { TFunction } from "i18next";
import { Card } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  AffairesFemininesFormationSecteurDatum,
  AffairesFemininesUrbainRuralDatum,
} from "@/services/PrefDomainDashboardAffairesFemininesDataService";

interface PrefDomainDashboardSection3AffairesFemininesProps {
  formationParSecteur: AffairesFemininesFormationSecteurDatum[];
  urbainRural: AffairesFemininesUrbainRuralDatum[];
  lang: string;
  t: TFunction;
}

const SECTEUR_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#0ea5e9",
  "#f43f5e",
  "#6366f1",
];

const fmtNum = (n: number, lang: string) =>
  new Intl.NumberFormat(lang === "ar" ? "ar-MA" : "fr-FR").format(Math.round(n));

/**
 * Section3 Affaires Féminines : 2 cartes uniquement.
 * 1. Formation professionnelle par secteur (Horizontal Bar, tri décroissant)
 * 2. Répartition des bénéficiaires Urbain / Rural (Stacked Bar, une barre globale)
 */
export const PrefDomainDashboardSection3AffairesFeminines = ({
  formationParSecteur,
  urbainRural,
  lang,
  t,
}: PrefDomainDashboardSection3AffairesFemininesProps) => {
  // Une seule barre globale pour la répartition urbain/rural
  const singleUrbainRural = urbainRural.length > 0 ? [urbainRural[0]] : [];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-foreground">
          {t(
            "prefDomainDashboard.affairesFeminines.section3.title",
            "Formation & Territorial",
          )}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Carte 1 : Formation professionnelle par secteur (Horizontal Bar) */}
        <Card className="p-5 flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-foreground">
              {t(
                "prefDomainDashboard.affairesFeminines.section3.formationSecteurTitle",
                "Formation professionnelle par secteur",
              )}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t(
                "prefDomainDashboard.affairesFeminines.section3.formationSecteurSubtitle",
                "Inscriptions OFPPT par secteur de formation",
              )}
            </p>
          </div>
          <div className="h-[250px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={formationParSecteur}
                layout="vertical"
                margin={{ top: 10, right: 20, left: lang === "ar" ? 80 : 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                  tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v: number) => fmtNum(v, lang)}
                />
                <YAxis
                  type="category"
                  dataKey="nom"
                  orientation="left"
                  axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                  tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                  width={110}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", dx: lang === "ar" ? -25 : 0 }}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted)/0.4)" }}
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
                  formatter={(value: number) => [fmtNum(value, lang), t("prefDomainDashboard.affairesFeminines.section3.inscriptions", "Inscriptions")]}
                />
                <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={40}>
                  {formationParSecteur.map((entry, idx) => (
                    <Cell
                      key={entry.secteurId}
                      fill={SECTEUR_COLORS[idx % SECTEUR_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Carte 2 : Répartition Urbain / Rural (Stacked Bar) */}
        <Card className="p-5 flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-foreground">
              {t(
                "prefDomainDashboard.affairesFeminines.section3.urbainRuralTitle",
                "Répartition des bénéficiaires Urbain / Rural",
              )}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t(
                "prefDomainDashboard.affairesFeminines.section3.urbainRuralSubtitle",
                "Bénéficiaires des activités de sensibilisation",
              )}
            </p>
          </div>
          <div className="h-[250px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={singleUrbainRural}
                margin={{ top: 10, right: lang === "ar" ? 45 : 10, left: lang === "ar" ? 10 : 30, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                  tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  dy={10}
                  interval={0}
                  height={36}
                  tickFormatter={() =>
                    t("prefDomainDashboard.affairesFeminines.section3.total", "Total")
                  }
                />
                <YAxis
                  orientation="left"
                  axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                  tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                  width={45}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", dx: lang === "ar" ? -18 : 0 }}
                  tickFormatter={(v: number) => fmtNum(v, lang)}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted)/0.4)" }}
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
                  formatter={(value: number, name) =>
                    `${fmtNum(value, lang)} (${t(
                      "prefDomainDashboard.affairesFeminines.section3.urbainRuralPct",
                      "part",
                    )} ${urbanRuralPct(name, singleUrbainRural).toFixed(1)}%)`
                  }
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} iconType="square" />
                <Bar
                  dataKey="urbain"
                  name={t("prefDomainDashboard.affairesFeminines.urbain", "Urbain")}
                  stackId="a"
                  fill="#f59e0b"
                  radius={[0, 0, 4, 4]}
                  maxBarSize={60}
                />
                <Bar
                  dataKey="rural"
                  name={t("prefDomainDashboard.affairesFeminines.rural", "Rural")}
                  stackId="a"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </section>
  );
};

// Calcule le pourcentage (urbain ou rural) sur la barre globale unique
const urbanRuralPct = (name: string | number, data: AffairesFemininesUrbainRuralDatum[]): number => {
  const row = data[0];
  if (!row || row.total === 0) return 0;
  if (name === "urbain") return (row.urbain / row.total) * 100;
  if (name === "rural") return (row.rural / row.total) * 100;
  return 0;
};
