import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { Lightbulb } from "lucide-react";

const MOCK_RAPPORT = {
  statut: "EN_COURS",
  progression: 85,
  derniereMaj: "2025-04-18",
  rang: 4,
  totalDirections: 13,
  annee: 2025,
};

const MOCK_KPIS = [
  { label: "Activités totales", value: 142, variance: +12, unit: "" },
  { label: "Participants", value: 3840, variance: +320, unit: "" },
  { label: "Dont femmes", value: 1920, variance: +85, unit: "" },
  { label: "Conventions", value: 18, variance: -2, unit: "" },
  { label: "Associations", value: 34, variance: +5, unit: "" },
];

const MOCK_REGIONAL_AVERAGES = {
  activites: 120,
  participants: 3200,
  tauxCouverture: 42,
};

const MOCK_DIRECTION = {
  activites: 142,
  participants: 3840,
  tauxCouverture: 51,
};

const MOCK_REPARTITION_FH = [
  { name: "Femmes", value: 1920, color: "#8b5cf6" },
  { name: "Hommes", value: 1920, color: "#3b82f6" },
];

const MOCK_EVOLUTION = [
  { quarter: "T1", participants: 820, activites: 32 },
  { quarter: "T2", participants: 1050, activites: 41 },
  { quarter: "T3", participants: 1240, activites: 38 },
  { quarter: "T4", participants: 730, activites: 31 },
];

const MOCK_PROFIL_THEMATIQUE = [
  { subject: "Éducatives", value: 45 },
  { subject: "Culturelles", value: 30 },
  { subject: "Sportives", value: 38 },
  { subject: "Renforcement", value: 29 },
  { subject: "Camping", value: 22 },
  { subject: "Insertion", value: 15 },
];

const MOCK_TABS = {
  activites: [
    { label: "Activités permanentes", value: 98 },
    { label: "Activités rayonnantes", value: 44 },
    { label: "Éducatives", value: 45 },
    { label: "Culturelles", value: 30 },
  ],
  camping: [
    { label: "Total participants", value: 410 },
    { label: "Filles", value: 210 },
    { label: "Garçons", value: 200 },
    { label: "Milieu rural", value: 180 },
  ],
  festivals: [
    { label: "Festivals organisés", value: 6 },
    { label: "Participants", value: 1200 },
    { label: "Régions représentées", value: 8 },
    { label: "Femmes", value: 560 },
  ],
  formation: [
    { label: "Sessions", value: 12 },
    { label: "Bénéficiaires H", value: 140 },
    { label: "Bénéficiaires F", value: 160 },
    { label: "Formateurs", value: 18 },
  ],
  insertion: [
    { label: "Activités insertion", value: 9 },
    { label: "Bénéficiaires H", value: 85 },
    { label: "Bénéficiaires F", value: 110 },
    { label: "Milieu urbain", value: 140 },
  ],
  etablissements: [
    { label: "Établissements actifs", value: 14 },
    { label: "En cours de réalisation", value: 3 },
    { label: "Fermés", value: 2 },
    { label: "Nouveaux", value: 1 },
  ],
};

const MOCK_COMPARISON_TABLE = [
  { name: "Casablanca-Anfa", activites: 168, participants: 4200, taux: 58, isCurrentUser: false },
  { name: "Moulay Rachid", activites: 155, participants: 3990, taux: 55, isCurrentUser: false },
  { name: "Aïn Sebaâ", activites: 149, participants: 3900, taux: 53, isCurrentUser: false },
  { name: "Aïn Chock", activites: 142, participants: 3840, taux: 51, isCurrentUser: true },
  { name: "Hay Hassani", activites: 138, participants: 3700, taux: 48, isCurrentUser: false },
];

const tabLabels = {
  activites: "Activités",
  camping: "Camping",
  festivals: "Festivals",
  formation: "Formation",
  insertion: "Insertion",
  etablissements: "Établissements",
} as const;

type TabKey = keyof typeof tabLabels;

const formatFrenchShortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const Dashboard = () => {
  const { utilisateur } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("activites");

  const comparisonMetrics = [
    {
      label: "Activités",
      value: MOCK_DIRECTION.activites,
      average: MOCK_REGIONAL_AVERAGES.activites,
      max: 200,
      unit: "",
    },
    {
      label: "Participants",
      value: MOCK_DIRECTION.participants,
      average: MOCK_REGIONAL_AVERAGES.participants,
      max: 5000,
      unit: "",
    },
    {
      label: "Taux de couverture",
      value: MOCK_DIRECTION.tauxCouverture,
      average: MOCK_REGIONAL_AVERAGES.tauxCouverture,
      max: 100,
      unit: "%",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 pb-8">
        <div className="flex flex-wrap gap-3 mb-6">
          <Badge
            className={`${MOCK_RAPPORT.statut === "EN_COURS" ? "bg-amber-100 text-amber-700 border-amber-200" : MOCK_RAPPORT.statut === "TERMINE" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-700 border-slate-200"} rounded-full py-2 px-3 text-sm`}
          >
            Statut: {MOCK_RAPPORT.statut.replace("_", " ")}
          </Badge>

          <Card className="min-w-[240px] rounded-2xl border border-border bg-white p-3 shadow-sm">
            <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground mb-2">
              Progression
            </div>
            <Progress value={MOCK_RAPPORT.progression} className="h-2 rounded-full" />
            <div className="mt-2 text-sm font-semibold">{MOCK_RAPPORT.progression}%</div>
          </Card>

          <Badge className="bg-slate-100 text-slate-700 border-slate-200 rounded-full py-2 px-3 text-sm">
            Dernière MAJ: {formatFrenchShortDate(MOCK_RAPPORT.derniereMaj)}
          </Badge>

          <Badge className="bg-slate-100 text-slate-700 border-slate-200 rounded-full py-2 px-3 text-sm">
            🏆 {MOCK_RAPPORT.rang}ème / {MOCK_RAPPORT.totalDirections} directions
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {MOCK_KPIS.map((kpi) => (
            <Card key={kpi.label} className="p-5 border border-border bg-white">
              <div className="text-3xl font-bold tracking-tight tabular-nums">
                {kpi.value}
                {kpi.unit}
              </div>
              <div className="text-sm text-muted-foreground mt-2">{kpi.label}</div>
              <div
                className={`mt-4 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${kpi.variance >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}
              >
                {kpi.variance >= 0 ? "+" : ""}
                {kpi.variance}%
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          <Card className="lg:col-span-7 p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-foreground">
                Direction vs Moyenne régionale
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Comparaison de vos performances par rapport à la moyenne régionale.
              </p>
            </div>

            <div className="space-y-5">
              {comparisonMetrics.map((metric) => {
                const valuePct = Math.round((metric.value / metric.max) * 100);
                const averagePct = Math.min(100, Math.round((metric.average / metric.max) * 100));
                return (
                  <div key={metric.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm font-medium text-foreground">
                      <span>{metric.label}</span>
                      <span className="tabular-nums">
                        {metric.value}
                        {metric.unit} · moy. {metric.average}
                        {metric.unit}
                      </span>
                    </div>
                    <div className="relative h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${valuePct}%` }}
                      />
                      <span
                        className="absolute top-1/2 h-4 w-0.5 bg-slate-400 -translate-y-1/2"
                        style={{ left: `${averagePct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="lg:col-span-5 p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-foreground">Répartition F / H</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Répartition des participantes et participants.
              </p>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={MOCK_REPARTITION_FH}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {MOCK_REPARTITION_FH.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                  }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {MOCK_REPARTITION_FH.map((slice) => (
                <div
                  key={slice.name}
                  className="flex items-center gap-2 rounded-xl bg-slate-50 p-3"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: slice.color }}
                  />
                  <div>
                    <div className="text-sm font-medium text-foreground">{slice.name}</div>
                    <div className="text-xs text-muted-foreground">{slice.value} personnes</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Évolution temporelle (mock)
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={MOCK_EVOLUTION}>
                <XAxis dataKey="quarter" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="participants"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="activites"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Profil Thématique des Activités
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={MOCK_PROFIL_THEMATIQUE}>
                <PolarGrid />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <PolarRadiusAxis angle={30} domain={[0, 60]} tick={false} />
                <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 border-b border-border">
            {(Object.keys(MOCK_TABS) as TabKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`whitespace-nowrap rounded-full pb-2 px-3 text-sm font-medium ${activeTab === key ? "border-b-2 border-blue-600 text-blue-600" : "text-muted-foreground hover:text-foreground"}`}
              >
                {tabLabels[key]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MOCK_TABS[activeTab].map((item) => (
              <Card key={item.label} className="p-5 border border-border bg-white">
                <div className="text-sm text-muted-foreground">{item.label}</div>
                <div className="text-2xl font-bold mt-3">{item.value}</div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 mb-4">
            <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Votre taux de couverture (51%) dépasse la moyenne régionale (42%) ce trimestre.
              </p>
              <p className="text-sm text-muted-foreground mt-1">Continuez sur cette lancée !</p>
            </div>
          </div>

          <Card className="overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                Comparaison des directions (anonymisée)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="ps-6 py-3 text-start">Rang</th>
                    <th className="py-3 text-start">Direction</th>
                    <th className="py-3 text-end">Activités</th>
                    <th className="py-3 text-end">Participants</th>
                    <th className="py-3 text-end">Taux couverture</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_COMPARISON_TABLE.map((row, index) => (
                    <tr key={row.name} className={row.isCurrentUser ? "bg-blue-50" : ""}>
                      <td className="ps-6 py-3 font-medium">{index + 1}</td>
                      <td className="py-3 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <span>{row.name}</span>
                          {row.isCurrentUser && (
                            <Badge
                              variant="outline"
                              className="border-blue-200 text-blue-700 text-[10px]"
                            >
                              Vous
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-end tabular-nums">{row.activites}</td>
                      <td className="py-3 text-end tabular-nums">{row.participants}</td>
                      <td className="py-3 text-end tabular-nums">{row.taux}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-5 pb-5 pt-4 text-xs text-muted-foreground">
              * Les données des autres directions sont anonymisées.
            </p>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
