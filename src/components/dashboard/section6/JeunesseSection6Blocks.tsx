import type { TFunction } from "i18next";
import {
  Activity,
  ArrowRightLeft,
  Building,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  Handshake,
  HardHat,
  Landmark,
  MapPin,
  Medal,
  Sparkles,
  Target,
  Tent,
  Trophy,
  TreePine,
  TrendingDown,
  TrendingUp,
  UserMinus,
  UserPlus,
  Users,
  Users2,
  Shield,
} from "lucide-react";
import type { Section6Block } from "./types";

type Section6AssociationMovements = {
  entrants?: number;
  sortants?: number;
  benef_entrants?: number;
  benef_sortants?: number;
};

type Section6ActivityData = {
  nombre_associations?: number;
  nombre_clubs?: number;
  nombre_conventions?: number;
  activites_sportives?: number;
  activites_culturelles?: number;
  activites_educatives?: number;
  renforcement_capacites?: number;
};

type Section6CampingData = {
  participants?: {
    total?: number;
    enfants_mre?: number;
    besoins_specifiques?: number;
  };
  encadrement?: {
    ratio?: string;
    total_staff?: number;
    hommes?: number;
    femmes?: number;
  };
  formations?: {
    total_sessions?: number;
    beneficiaires?: number;
  };
};

type Section6ConventionType = {
  type?: string;
  count?: number;
};

type Section6ConventionData = {
  total_conventions?: number;
  total_partenaires?: number;
  repartition?: Section6ConventionType[];
};

type Section6InsertionData = {
  total_activites?: number;
  partenaires_actifs?: number;
  volume_horaire?: string;
  genre?: {
    hommes?: number;
    femmes?: number;
  };
  milieu?: {
    urbain?: number;
    rural?: number;
  };
};

type Section6FestivalsData = {
  total_evenements?: number;
  total_provinces?: number;
  qualifies?: number;
  genre?: {
    hommes?: number;
    femmes?: number;
  };
  milieu?: {
    urbain?: number;
    rural?: number;
  };
};

type Section6Cause = {
  cause?: string;
  count?: number;
};

type Section6EtablissementsData = {
  nouvellement_creees?: number;
  en_cours_realisation?: number;
  fermees?: {
    total?: number;
    causes?: Section6Cause[];
  };
};

type Section6DetailsData = {
  activites?: Section6ActivityData;
  associations?: Section6AssociationMovements;
  camping?: Section6CampingData;
  conventions?: Section6ConventionData;
  insertion?: Section6InsertionData;
  festivals?: Section6FestivalsData;
  etablissements?: Section6EtablissementsData;
};

export type JeunesseSection6DashboardData = {
  detailed?: Section6DetailsData;
  kpis?: {
    activeEstablishments?: number;
  };
};

/**
 * Construit les 5 blocs détaillés du domaine Jeunesse pour Section6.
 * Le JSX et les calculs sont repris à l'identique depuis l'ancien
 * PrefDomainDashboardSection6.tsx — aucune logique métier, aucun calcul
 * et aucun affichage n'ont été modifiés.
 */
export const buildJeunesseSection6Blocks = (
  dashboardData: JeunesseSection6DashboardData,
  lang: string,
  t: TFunction,
): Section6Block[] => {
  const fmt = (n: number) =>
    new Intl.NumberFormat(lang === "ar" ? "ar-MA" : "fr-FR").format(Math.round(n));

  return [
    // 1. Activités (Permanentes & Rayonnantes)
    {
      id: "activites",
      title: t(
        "prefDomainDashboard.details.activities.title",
        "Activités (Permanentes & Rayonnantes)",
      ) as string,
      icon: <Activity className="h-4 w-4 text-blue-500" />,
      content: (() => {
        const act = dashboardData.detailed?.activites || {};
        const totalAnim =
          (act.activites_sportives || 0) +
          (act.activites_educatives || 0) +
          (act.activites_culturelles || 0) +
          (act.renforcement_capacites || 0);
        const pctSport = totalAnim
          ? Math.round(((act.activites_sportives || 0) / totalAnim) * 100)
          : 0;
        const pctEduc = totalAnim
          ? Math.round(((act.activites_educatives || 0) / totalAnim) * 100)
          : 0;
        const pctCult = totalAnim
          ? Math.round(((act.activites_culturelles || 0) / totalAnim) * 100)
          : 0;
        const pctRenf = totalAnim
          ? Math.round(((act.renforcement_capacites || 0) / totalAnim) * 100)
          : 0;

        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  {
                    t(
                      "prefDomainDashboard.details.activities.ecosystem",
                      "Écosystème & Structures",
                    ) as string
                  }
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black text-foreground" dir="ltr">
                      {act.nombre_associations || 0}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground mt-1">
                      {
                        t(
                          "prefDomainDashboard.details.activities.associations",
                          "Associations",
                        ) as string
                      }
                    </span>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black text-foreground" dir="ltr">
                      {act.nombre_clubs || 0}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground mt-1">
                      {
                        t(
                          "prefDomainDashboard.details.activities.activeClubs",
                          "Clubs Actifs",
                        ) as string
                      }
                    </span>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black text-foreground" dir="ltr">
                      {act.nombre_conventions || 0}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground mt-1">
                      {
                        t(
                          "prefDomainDashboard.details.activities.conventions",
                          "Conventions",
                        ) as string
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex justify-between items-end">
                <span>
                  {
                    t(
                      "prefDomainDashboard.details.activities.animationVolume",
                      "Volume d'Animation",
                    ) as string
                  }
                </span>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">
                  {
                    t("prefDomainDashboard.details.activities.totalActions", {
                      count: totalAnim,
                      defaultValue: `Total: ${totalAnim} Actions`,
                    }) as string
                  }
                </span>
              </h4>
              <div className="space-y-3.5">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-foreground">
                      {
                        t(
                          "prefDomainDashboard.details.activities.sportsActivities",
                          "Activités Sportives",
                        ) as string
                      }
                    </span>
                    <span className="font-bold" dir="ltr">
                      {act.activites_sportives || 0}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className="bg-orange-500 h-1.5 rounded-full"
                      style={{ width: `${pctSport}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-foreground">
                      {
                        t(
                          "prefDomainDashboard.details.activities.educActivities",
                          "Activités Éducatives",
                        ) as string
                      }
                    </span>
                    <span className="font-bold" dir="ltr">
                      {act.activites_educatives || 0}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{ width: `${pctEduc}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-foreground">
                      {
                        t(
                          "prefDomainDashboard.details.activities.cultActivities",
                          "Activités Culturelles",
                        ) as string
                      }
                    </span>
                    <span className="font-bold" dir="ltr">
                      {act.activites_culturelles || 0}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className="bg-pink-500 h-1.5 rounded-full"
                      style={{ width: `${pctCult}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-foreground">
                      {
                        t(
                          "prefDomainDashboard.details.activities.capacityBuilding",
                          "Renforcement des capacités",
                        ) as string
                      }
                    </span>
                    <span className="font-bold" dir="ltr">
                      {act.renforcement_capacites || 0}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className="bg-purple-500 h-1.5 rounded-full"
                      style={{ width: `${pctRenf}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })(),
    },

    // 2. Programme National de Camping & Formations
    {
      id: "camping",
      title: t(
        "prefDomainDashboard.details.camping.title",
        "Programme National de Camping & Formations",
      ) as string,
      icon: <Tent className="h-4 w-4 text-emerald-500" />,
      content: (() => {
        const camp = dashboardData.detailed?.camping || {};
        const staffTot = camp.encadrement?.total_staff || 0;
        const staffH = camp.encadrement?.hommes || 0;
        const staffF = camp.encadrement?.femmes || 0;
        const pctStaffH = staffTot ? Math.round((staffH / staffTot) * 100) : 0;
        const pctStaffF = staffTot ? Math.round((staffF / staffTot) * 100) : 0;

        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Users2 className="h-4 w-4" />{" "}
                  {
                    t(
                      "prefDomainDashboard.details.camping.participants",
                      "Bénéficiaires & Participants",
                    ) as string
                  }
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 block">
                        {
                          t(
                            "prefDomainDashboard.details.camping.totalBeneficiaries",
                            "Total Bénéficiaires",
                          ) as string
                        }
                      </span>
                      <span className="text-[10px] text-emerald-600/80">
                        {
                          t(
                            "prefDomainDashboard.details.camping.summerCamps",
                            "Colonies de vacances",
                          ) as string
                        }
                      </span>
                    </div>
                    <span className="text-3xl font-black text-emerald-600" dir="ltr">
                      {fmt(camp.participants?.total || 0)}
                    </span>
                  </div>
                  <div className="p-3 bg-muted/20 rounded-xl border border-border/50">
                    <span className="text-[11px] font-medium text-muted-foreground block mb-1">
                      {
                        t(
                          "prefDomainDashboard.details.camping.mreChildren",
                          "Enfants MRE",
                        ) as string
                      }
                    </span>
                    <span className="text-xl font-bold text-foreground" dir="ltr">
                      {camp.participants?.enfants_mre || 0}
                    </span>
                  </div>
                  <div className="p-3 bg-muted/20 rounded-xl border border-border/50">
                    <span className="text-[11px] font-medium text-muted-foreground block mb-1">
                      {
                        t(
                          "prefDomainDashboard.details.camping.specialNeeds",
                          "Besoins Spécifiques",
                        ) as string
                      }
                    </span>
                    <span className="text-xl font-bold text-foreground" dir="ltr">
                      {camp.participants?.besoins_specifiques || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Shield className="h-4 w-4" />{" "}
                  {
                    t(
                      "prefDomainDashboard.details.camping.staffingDevice",
                      "Dispositif d'Encadrement",
                    ) as string
                  }
                </h4>
                <div className="flex gap-3">
                  <div className="flex-1 p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 flex flex-col justify-center items-center">
                    <span className="text-2xl font-black text-blue-600" dir="ltr">
                      {camp.encadrement?.ratio || "0:0"}
                    </span>
                    <span className="text-[10px] text-blue-600/80 font-medium text-center">
                      {camp.encadrement?.ratio !== "0:0"
                        ? (t("prefDomainDashboard.details.camping.ratioDesc", {
                            count: camp.encadrement?.ratio.split(":")[1],
                            defaultValue: `(1 encadrant pour ${camp.encadrement?.ratio.split(":")[1]} bénéficiaires)`,
                          }) as string)
                        : (t(
                            "prefDomainDashboard.details.camping.noData",
                            "(Aucune donnée saisie)",
                          ) as string)}
                    </span>
                  </div>
                  <div className="flex-[2] p-3 bg-muted/20 rounded-xl border border-border/50 flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {
                          t(
                            "prefDomainDashboard.details.camping.mobilizedStaff",
                            "Staff Mobilisé",
                          ) as string
                        }
                      </span>
                      <span className="text-sm font-bold text-foreground" dir="ltr">
                        {staffTot}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="flex-1 h-2 rounded-full bg-blue-500"
                        style={{ width: `${pctStaffH}%` }}
                        title={
                          t("prefDomainDashboard.details.camping.menCount", {
                            count: staffH,
                            defaultValue: `${staffH} Hommes`,
                          }) as string
                        }
                      ></div>
                      <div
                        className="flex-1 h-2 rounded-full bg-pink-500"
                        style={{ width: `${pctStaffF}%` }}
                        title={
                          t("prefDomainDashboard.details.camping.womenCount", {
                            count: staffF,
                            defaultValue: `${staffF} Femmes`,
                          }) as string
                        }
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>
                        {
                          t("prefDomainDashboard.details.camping.menCount", {
                            count: staffH,
                            defaultValue: `${staffH} Hommes`,
                          }) as string
                        }
                      </span>
                      <span>
                        {
                          t("prefDomainDashboard.details.camping.womenCount", {
                            count: staffF,
                            defaultValue: `${staffF} Femmes`,
                          }) as string
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4" />{" "}
                  {
                    t(
                      "prefDomainDashboard.details.camping.trainings",
                      "Formations (Encadrement)",
                    ) as string
                  }
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/10 flex flex-col justify-center">
                    <span className="text-2xl font-bold text-amber-600" dir="ltr">
                      {camp.formations?.total_sessions || 0}
                    </span>
                    <span className="text-[11px] font-medium text-amber-600/80 mt-1">
                      {
                        t(
                          "prefDomainDashboard.details.camping.organizedSessions",
                          "Sessions Organisées",
                        ) as string
                      }
                    </span>
                  </div>
                  <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/10 flex flex-col justify-center">
                    <span className="text-2xl font-bold text-amber-600" dir="ltr">
                      {camp.formations?.beneficiaires || 0}
                    </span>
                    <span className="text-[11px] font-medium text-amber-600/80 mt-1">
                      {
                        t(
                          "prefDomainDashboard.details.camping.trainedCadres",
                          "Cadres Formés",
                        ) as string
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <ArrowRightLeft className="h-4 w-4" />{" "}
                  {t("prefDomainDashboard.details.camping.movements", "Mouvements de la période")}
                </h4>

                {(() => {
                  const assocEntrants = dashboardData.detailed?.associations?.entrants || 0;
                  const assocSortants = dashboardData.detailed?.associations?.sortants || 0;
                  const benEntrants = dashboardData.detailed?.associations?.benef_entrants || 0;
                  const benSortants = dashboardData.detailed?.associations?.benef_sortants || 0;

                  return (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex flex-col justify-center">
                        <span className="text-emerald-600 font-semibold text-[11px] flex items-center gap-1.5 mb-1">
                          <TrendingUp className="h-3.5 w-3.5" />{" "}
                          {t(
                            "prefDomainDashboard.details.camping.assocEntrants",
                            "Associations Entrantes",
                          )}
                        </span>
                        <span className="text-2xl font-bold text-foreground" dir="ltr">
                          {assocEntrants}
                        </span>
                      </div>

                      <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex flex-col justify-center">
                        <span className="text-emerald-600 font-semibold text-[11px] flex items-center gap-1.5 mb-1">
                          <UserPlus className="h-3.5 w-3.5" />{" "}
                          {t(
                            "prefDomainDashboard.details.camping.benEntrants",
                            "Bénéficiaires Entrants",
                          )}
                        </span>
                        <span className="text-2xl font-bold text-foreground" dir="ltr">
                          {benEntrants}
                        </span>
                      </div>

                      <div className="p-3 bg-orange-500/5 rounded-xl border border-orange-500/10 flex flex-col justify-center">
                        <span className="text-orange-600 font-semibold text-[11px] flex items-center gap-1.5 mb-1">
                          <TrendingDown className="h-3.5 w-3.5" />{" "}
                          {t(
                            "prefDomainDashboard.details.camping.assocSortants",
                            "Associations Sortantes",
                          )}
                        </span>
                        <span className="text-2xl font-bold text-foreground" dir="ltr">
                          {assocSortants}
                        </span>
                      </div>

                      <div className="p-3 bg-orange-500/5 rounded-xl border border-orange-500/10 flex flex-col justify-center">
                        <span className="text-orange-600 font-semibold text-[11px] flex items-center gap-1.5 mb-1">
                          <UserMinus className="h-3.5 w-3.5" />{" "}
                          {t(
                            "prefDomainDashboard.details.camping.benSortants",
                            "Bénéficiaires Sortants",
                          )}
                        </span>
                        <span className="text-2xl font-bold text-foreground" dir="ltr">
                          {benSortants}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        );
      })(),
    },

    // 3. Conventions et Partenariats
    {
      id: "conventions",
      title: t(
        "prefDomainDashboard.details.conventions.title",
        "Conventions et Partenariats",
      ) as string,
      icon: <Handshake className="h-4 w-4 text-emerald-500" />,
      content: (() => {
        const conv = dashboardData.detailed?.conventions || {};
        const repArray = conv.repartition || [];
        const totalConv = conv.total_conventions || 1;
        const translatedTypes = t("prefDomainDashboard.details.conventions.types", {
          returnObjects: true,
        }) as Record<string, string>;

        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
            <div className="space-y-4">
              <h4 className="h-7 text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-4 w-4" />{" "}
                {
                  t(
                    "prefDomainDashboard.details.conventions.summary",
                    "Bilan des Conventions",
                  ) as string
                }
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                      <Handshake className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                      {
                        t(
                          "prefDomainDashboard.details.conventions.totalConventions",
                          "Total Conventions",
                        ) as string
                      }
                    </span>
                  </div>
                  <span
                    className="text-3xl font-black text-emerald-600 dark:text-emerald-400"
                    dir="ltr"
                  >
                    {conv.total_conventions || 0}
                  </span>
                </div>

                <div className="col-span-2 p-4 bg-muted/20 rounded-xl border border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">
                      {
                        t(
                          "prefDomainDashboard.details.conventions.partnerTypes",
                          "Types de Partenaires Engagés",
                        ) as string
                      }
                    </span>
                  </div>
                  <span className="text-xl font-bold text-foreground" dir="ltr">
                    {conv.total_partenaires || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="h-7 text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between items-center">
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" />{" "}
                  {
                    t(
                      "prefDomainDashboard.details.conventions.distributionByType",
                      "Répartition par Type",
                    ) as string
                  }
                </span>
              </h4>

              <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-4">
                {repArray.length === 0 ? (
                  <span className="text-sm text-muted-foreground">
                    {
                      t(
                        "prefDomainDashboard.details.conventions.noData",
                        "Aucune donnée disponible",
                      ) as string
                    }
                  </span>
                ) : (
                  repArray.map((item: Section6ConventionType, index: number) => {
                    const percentage = Math.round(((item.count || 0) / totalConv) * 100);
                    return (
                      <div key={index} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-foreground font-medium">
                            {translatedTypes && translatedTypes[item.type]
                              ? translatedTypes[item.type]
                              : item.type}
                          </span>
                          <span className="text-muted-foreground font-bold" dir="ltr">
                            {item.count}{" "}
                            <span className="text-[10px] font-normal">({percentage}%)</span>
                          </span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );
      })(),
    },

    // 4. Intégration Socio-Économique
    {
      id: "insertion",
      title: t(
        "prefDomainDashboard.details.insertion.title",
        "Intégration Socio-Économique",
      ) as string,
      icon: <Landmark className="h-4 w-4 text-indigo-500" />,
      content: (() => {
        const ins = dashboardData.detailed?.insertion || {};
        const h = ins.genre?.hommes || 0;
        const f = ins.genre?.femmes || 0;
        const totGF = h + f;
        const pctH = totGF ? Math.round((h / totGF) * 100) : 0;
        const pctF = totGF ? Math.round((f / totGF) * 100) : 0;
        const urb = ins.milieu?.urbain || 0;
        const rur = ins.milieu?.rural || 0;
        const totUR = urb + rur;
        const pctUrb = totUR ? Math.round((urb / totUR) * 100) : 0;
        const pctRur = totUR ? Math.round((rur / totUR) * 100) : 0;

        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
            <div className="space-y-4">
              <h4 className="h-7 text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Target className="h-4 w-4" />{" "}
                {
                  t(
                    "prefDomainDashboard.details.insertion.summary",
                    "Bilan des Activités",
                  ) as string
                }
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                      <Landmark className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="font-bold text-indigo-700 dark:text-indigo-400 text-sm">
                      {
                        t(
                          "prefDomainDashboard.details.insertion.activitiesDone",
                          "Activités Réalisées",
                        ) as string
                      }
                    </span>
                  </div>
                  <span
                    className="text-3xl font-black text-indigo-600 dark:text-indigo-400"
                    dir="ltr"
                  >
                    {ins.total_activites || 0}
                  </span>
                </div>
                <div className="p-3 bg-muted/20 rounded-xl border border-border/50 flex flex-col justify-center">
                  <span className="text-muted-foreground font-semibold text-xs flex items-center gap-1.5 mb-1">
                    <Handshake className="h-3.5 w-3.5 text-orange-500" />{" "}
                    {
                      t(
                        "prefDomainDashboard.details.insertion.activePartners",
                        "Partenaires Actifs",
                      ) as string
                    }
                  </span>
                  <span className="text-2xl font-bold text-foreground" dir="ltr">
                    {ins.partenaires_actifs || 0}
                  </span>
                </div>
                <div className="p-3 bg-muted/20 rounded-xl border border-border/50 flex flex-col justify-center">
                  <span className="text-muted-foreground font-semibold text-xs flex items-center gap-1.5 mb-1">
                    <Clock className="h-3.5 w-3.5 text-blue-500" />{" "}
                    {
                      t(
                        "prefDomainDashboard.details.insertion.globalVolume",
                        "Volume Global",
                      ) as string
                    }
                  </span>
                  <span
                    className="text-2xl font-bold text-foreground"
                    dir={lang === "ar" ? "rtl" : "ltr"}
                  >
                    {(() => {
                      const volume = ins.volume_horaire || "0";
                      if (lang === "ar") {
                        return volume.toString().toLowerCase().includes("heures")
                          ? volume.toString().toLowerCase().replace("heures", "ساعات")
                          : `${volume} ساعات`;
                      }
                      return volume;
                    })()}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between items-center">
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />{" "}
                  {
                    t(
                      "prefDomainDashboard.details.insertion.beneficiaries",
                      "Bénéficiaires",
                    ) as string
                  }
                </span>
                <span
                  className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-bold border border-indigo-500/20"
                  dir="ltr"
                >
                  {t("prefDomainDashboard.details.insertion.total", "Total") as string}: {totGF}
                </span>
              </h4>

              <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-5">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-foreground font-bold">
                      {
                        t(
                          "prefDomainDashboard.details.insertion.genderDistribution",
                          "Répartition par Genre",
                        ) as string
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 h-3">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${pctH}%` }}
                      title={`${t("prefDomainDashboard.details.insertion.men", "Hommes")}: ${h}`}
                    ></div>
                    <div
                      className="h-full rounded-full bg-pink-500"
                      style={{ width: `${pctF}%` }}
                      title={`${t("prefDomainDashboard.details.insertion.women", "Femmes")}: ${f}`}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>{" "}
                      {t("prefDomainDashboard.details.insertion.men", "Hommes") as string}:{" "}
                      <span dir="ltr">{h}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      {t("prefDomainDashboard.details.insertion.women", "Femmes") as string}:{" "}
                      <span dir="ltr">{f}</span>{" "}
                      <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                    </span>
                  </div>
                </div>

                <div className="border-t border-border/50 my-2"></div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-foreground font-bold">
                      {
                        t(
                          "prefDomainDashboard.details.insertion.spatialDistribution",
                          "Répartition Spatiale",
                        ) as string
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 h-3">
                    <div
                      className="h-full rounded-full bg-slate-500"
                      style={{ width: `${pctUrb}%` }}
                      title={`${t("prefDomainDashboard.details.insertion.urban", "Urbain")}: ${urb}`}
                    ></div>
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${pctRur}%` }}
                      title={`${t("prefDomainDashboard.details.insertion.rural", "Rural")}: ${rur}`}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                    <span className="flex items-center gap-1">
                      <Building className="h-3 w-3 text-slate-500" />{" "}
                      {t("prefDomainDashboard.details.insertion.urban", "Urbain") as string}:{" "}
                      <span dir="ltr">{urb}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      {t("prefDomainDashboard.details.insertion.rural", "Rural") as string}:{" "}
                      <span dir="ltr">{rur}</span> <TreePine className="h-3 w-3 text-emerald-500" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })(),
    },

    // 5. Festivals de Jeunesse
    {
      id: "festivals",
      title: t("prefDomainDashboard.details.festivals.title", "Festivals de Jeunesse") as string,
      icon: <Trophy className="h-4 w-4 text-purple-500" />,
      content: (() => {
        const fest = dashboardData.detailed?.festivals || {};
        const h = fest.genre?.hommes || 0;
        const f = fest.genre?.femmes || 0;
        const totGF = h + f;
        const pctH = totGF ? Math.round((h / totGF) * 100) : 0;
        const pctF = totGF ? Math.round((f / totGF) * 100) : 0;
        const urb = fest.milieu?.urbain || 0;
        const rur = fest.milieu?.rural || 0;
        const totUR = urb + rur;
        const pctUrb = totUR ? Math.round((urb / totUR) * 100) : 0;
        const pctRur = totUR ? Math.round((rur / totUR) * 100) : 0;

        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
            <div className="space-y-4">
              <h4 className="h-7 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Activity className="h-4 w-4" />{" "}
                {
                  t(
                    "prefDomainDashboard.details.festivals.summary",
                    "Événements & Éliminatoires",
                  ) as string
                }
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 p-4 bg-purple-500/10 rounded-xl border border-purple-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Trophy className="h-5 w-5 text-purple-600" />
                    </div>
                    <span className="font-bold text-purple-700 dark:text-purple-400 text-sm">
                      {
                        t(
                          "prefDomainDashboard.details.festivals.organized",
                          "Festivals Organisés",
                        ) as string
                      }
                    </span>
                  </div>
                  <span className="text-3xl font-black text-purple-600" dir="ltr">
                    {fest.total_evenements || 0}
                  </span>
                </div>
                <div className="p-3 bg-muted/20 rounded-xl border border-border/50 flex flex-col justify-center">
                  <span className="text-muted-foreground font-semibold text-xs flex items-center gap-1.5 mb-1">
                    <MapPin className="h-3.5 w-3.5 text-blue-500" />{" "}
                    {
                      t(
                        "prefDomainDashboard.details.festivals.provinces",
                        "Provinces (Couverture)",
                      ) as string
                    }
                  </span>
                  <span className="text-2xl font-bold text-foreground" dir="ltr">
                    {fest.total_provinces || 0}
                  </span>
                </div>
                <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/20 flex flex-col justify-center">
                  <span className="text-amber-600 font-semibold text-xs flex items-center gap-1.5 mb-1">
                    <Medal className="h-3.5 w-3.5" />{" "}
                    {
                      t(
                        "prefDomainDashboard.details.festivals.qualified",
                        "Qualifiés (Finales)",
                      ) as string
                    }
                  </span>
                  <span className="text-2xl font-bold text-foreground" dir="ltr">
                    {fest.qualifies || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex justify-between items-end">
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />{" "}
                  {
                    t(
                      "prefDomainDashboard.details.festivals.demographics",
                      "Démographie des Participants",
                    ) as string
                  }
                </span>
                <span
                  className="text-[10px] bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded font-bold border border-purple-500/20"
                  dir="ltr"
                >
                  {t("prefDomainDashboard.details.festivals.total", "Total") as string}: {totGF}
                </span>
              </h4>

              <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-5">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-foreground font-bold">
                      {
                        t(
                          "prefDomainDashboard.details.festivals.genderDistribution",
                          "Répartition par Genre",
                        ) as string
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 h-3">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${pctH}%` }}
                      title={`${t("prefDomainDashboard.details.festivals.men", "Hommes")}: ${h}`}
                    ></div>
                    <div
                      className="h-full rounded-full bg-pink-500"
                      style={{ width: `${pctF}%` }}
                      title={`${t("prefDomainDashboard.details.festivals.women", "Femmes")}: ${f}`}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>{" "}
                      {t("prefDomainDashboard.details.festivals.men", "Hommes") as string}:{" "}
                      <span dir="ltr">{h}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      {t("prefDomainDashboard.details.festivals.women", "Femmes") as string}:{" "}
                      <span dir="ltr">{f}</span>{" "}
                      <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                    </span>
                  </div>
                </div>

                <div className="border-t border-border/50 my-2"></div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-foreground font-bold">
                      {
                        t(
                          "prefDomainDashboard.details.festivals.spatialDistribution",
                          "Répartition Spatiale",
                        ) as string
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 h-3">
                    <div
                      className="h-full rounded-full bg-slate-500"
                      style={{ width: `${pctUrb}%` }}
                      title={`${t("prefDomainDashboard.details.festivals.urban", "Urbain")}: ${urb}`}
                    ></div>
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${pctRur}%` }}
                      title={`${t("prefDomainDashboard.details.festivals.rural", "Rural")}: ${rur}`}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                    <span className="flex items-center gap-1">
                      <Building className="h-3 w-3 text-slate-500" />{" "}
                      {t("prefDomainDashboard.details.festivals.urban", "Urbain") as string}:{" "}
                      <span dir="ltr">{urb}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      {t("prefDomainDashboard.details.festivals.rural", "Rural") as string}:{" "}
                      <span dir="ltr">{rur}</span> <TreePine className="h-3 w-3 text-emerald-500" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })(),
    },

    // 6. Établissements & Infrastructures
    {
      id: "etablissements",
      title: t(
        "prefDomainDashboard.details.etablissements.title",
        "Établissements & Infrastructures",
      ) as string,
      icon: <Building2 className="h-4 w-4 text-blue-500" />,
      content: (() => {
        const etab = dashboardData.detailed?.etablissements || {};
        const causesArray = etab.fermees?.causes || [];
        const totFermes = etab.fermees?.total || 0;
        const vraiOperationnels = dashboardData.kpis?.activeEstablishments || 0;
        const vraiTotalParc = vraiOperationnels + totFermes + (etab.en_cours_realisation || 0);
        const divFermes = totFermes > 0 ? totFermes : 1;
        const translatedCauses = t("prefDomainDashboard.details.etablissements.causes", {
          returnObjects: true,
        }) as Record<string, string>;

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex justify-between items-end">
                <span>
                  {
                    t(
                      "prefDomainDashboard.details.etablissements.parcStatus",
                      "Statut du Parc Actuel",
                    ) as string
                  }
                </span>
                <span
                  className="text-[10px] bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded font-bold border border-blue-500/20"
                  dir="ltr"
                >
                  {t("prefDomainDashboard.details.etablissements.total", "Total") as string}:{" "}
                  {vraiTotalParc}
                </span>
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                      {
                        t(
                          "prefDomainDashboard.details.etablissements.operational",
                          "Opérationnels / Actifs",
                        ) as string
                      }
                    </span>
                  </div>
                  <span className="text-3xl font-black text-emerald-600" dir="ltr">
                    {vraiOperationnels}
                  </span>
                </div>

                <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 flex flex-col justify-center">
                  <span className="text-blue-600 font-semibold text-xs flex items-center gap-1.5 mb-1">
                    <Sparkles className="h-3.5 w-3.5" />{" "}
                    {
                      t(
                        "prefDomainDashboard.details.etablissements.newCreation",
                        "Nouvelle création",
                      ) as string
                    }
                  </span>
                  <span className="text-2xl font-bold text-foreground" dir="ltr">
                    {etab.nouvellement_creees || 0}
                  </span>
                </div>

                <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 flex flex-col justify-center">
                  <span className="text-amber-600 font-semibold text-xs flex items-center gap-1.5 mb-1">
                    <HardHat className="h-3.5 w-3.5" />{" "}
                    {
                      t(
                        "prefDomainDashboard.details.etablissements.underRealization",
                        "En réalisation",
                      ) as string
                    }
                  </span>
                  <span className="text-2xl font-bold text-foreground" dir="ltr">
                    {etab.en_cours_realisation || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex justify-between items-end">
                <span>
                  {
                    t(
                      "prefDomainDashboard.details.etablissements.fermeturesAnalysis",
                      "Analyse des Fermetures",
                    ) as string
                  }
                </span>
                <span
                  className="text-[10px] bg-red-500/10 text-red-600 px-2 py-0.5 rounded font-bold border border-red-500/20"
                  dir="ltr"
                >
                  {
                    t(
                      "prefDomainDashboard.details.etablissements.totalFermees",
                      "Total Fermées",
                    ) as string
                  }
                  : {etab.fermees?.total || 0}
                </span>
              </h4>

              <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-4">
                {causesArray.length === 0 ? (
                  <span className="text-sm text-muted-foreground">
                    {
                      t(
                        "prefDomainDashboard.details.etablissements.noFermeture",
                        "Aucune fermeture signalée",
                      ) as string
                    }
                  </span>
                ) : (
                  causesArray.map((item: Section6Cause, index: number) => {
                    const percentage = Math.round(((item.count || 0) / divFermes) * 100);
                    return (
                      <div key={index} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-foreground font-medium flex items-center gap-1.5">
                            {translatedCauses && translatedCauses[item.cause]
                              ? translatedCauses[item.cause]
                              : item.cause}
                          </span>
                          <span className="font-bold text-foreground" dir="ltr">
                            {item.count}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-muted-foreground/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );
      })(),
    },
  ];
};
