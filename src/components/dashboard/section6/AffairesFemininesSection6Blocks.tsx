import type { TFunction } from "i18next";
import {
  Building2,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Megaphone,
  TrendingUp,
  Users,
} from "lucide-react";
import type { Section6Block } from "./types";
import type { AffairesFemininesSection6Data } from "@/services/PrefDomainDashboardAffairesFemininesDataService";

const fmtNum = (n: number, lang: string) =>
  new Intl.NumberFormat(lang === "ar" ? "ar-MA" : "fr-FR").format(Math.round(n));

const pct = (n: number) => `${n.toFixed(1)}%`;

/**
 * Construit les 6 blocs détaillés du domaine Affaires Féminines pour Section6.
 * Toute l'agrégation vient déjà faite de PrefDomainDashboardAffairesFemininesDataService ;
 * ce fichier ne fait que construire le JSX de présentation.
 */
export const buildAffairesFemininesSection6Blocks = (
  data: AffairesFemininesSection6Data,
  lang: string,
  t: TFunction,
): Section6Block[] => {
  const tTypeReseau = (type: string) =>
    t(`prefDomainDashboard.affairesFeminines.reseau.types.${type}`, type) as string;
  const tTypeSoutien = (type: string) =>
    t(`prefDomainDashboard.affairesFeminines.ecoute.types.${type}`, type) as string;

  return [
    // 1. Formation Professionnelle
    {
      id: "formationProfessionnelle",
      title: t(
        "prefDomainDashboard.affairesFeminines.section6.formation.title",
        "Formation Professionnelle",
      ) as string,
      icon: <GraduationCap className="h-4 w-4 text-blue-500" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-blue-600" dir="ltr">
                {fmtNum(data.formationProfessionnelle.totalInscriptionsClubs, lang)}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground mt-1">
                {
                  t(
                    "prefDomainDashboard.affairesFeminines.section6.formation.clubs",
                    "Clubs",
                  ) as string
                }
              </span>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-indigo-600" dir="ltr">
                {fmtNum(data.formationProfessionnelle.totalInscriptionsOfppt, lang)}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground mt-1">
                {
                  t(
                    "prefDomainDashboard.affairesFeminines.section6.formation.ofppt",
                    "OFPPT",
                  ) as string
                }
              </span>
            </div>
          </div>

          {(data.formationProfessionnelle.parFiliere.length > 0 ||
            data.formationProfessionnelle.parSecteur.length > 0 ||
            data.formationProfessionnelle.parNiveau.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
              {data.formationProfessionnelle.parFiliere.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {
                      t(
                        "prefDomainDashboard.affairesFeminines.section6.formation.parFiliere",
                        "Par filière",
                      ) as string
                    }
                  </h4>
                  {data.formationProfessionnelle.parFiliere.map(({ filiere, inscriptions }) => (
                    <div key={filiere} className="flex justify-between items-center text-xs">
                      <span className="text-foreground font-medium">{filiere}</span>
                      <span className="text-muted-foreground font-bold" dir="ltr">
                        {fmtNum(inscriptions, lang)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {data.formationProfessionnelle.parSecteur.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {
                      t(
                        "prefDomainDashboard.affairesFeminines.section6.formation.parSecteur",
                        "Par secteur",
                      ) as string
                    }
                  </h4>
                  {data.formationProfessionnelle.parSecteur.map(({ secteur, inscriptions }) => (
                    <div key={secteur} className="flex justify-between items-center text-xs">
                      <span className="text-foreground font-medium">{secteur}</span>
                      <span className="text-muted-foreground font-bold" dir="ltr">
                        {fmtNum(inscriptions, lang)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {data.formationProfessionnelle.parNiveau.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {
                      t(
                        "prefDomainDashboard.affairesFeminines.section6.formation.parNiveau",
                        "Niveau OFPPT",
                      ) as string
                    }
                  </h4>
                  {data.formationProfessionnelle.parNiveau.map(({ niveau, inscriptions }) => (
                    <div key={niveau} className="flex justify-between items-center text-xs">
                      <span className="text-foreground font-medium">{niveau}</span>
                      <span className="text-muted-foreground font-bold" dir="ltr">
                        {fmtNum(inscriptions, lang)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ),
    },

    // 2. Insertion & AGR
    {
      id: "insertionAgr",
      title: t(
        "prefDomainDashboard.affairesFeminines.section6.insertionAgr.title",
        "Insertion & AGR",
      ) as string,
      icon: <TrendingUp className="h-4 w-4 text-emerald-500" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-black text-foreground" dir="ltr">
                {fmtNum(data.insertionAgr.totalLaureates, lang)}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground mt-1">
                {t("prefDomainDashboard.affairesFeminines.laureates", "Lauréates") as string}
              </span>
            </div>
            <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-black text-foreground" dir="ltr">
                {fmtNum(data.insertionAgr.totalIntegrees, lang)}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground mt-1">
                {t("prefDomainDashboard.affairesFeminines.integrees", "Intégrées") as string}
              </span>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-black text-emerald-600" dir="ltr">
                {pct(data.insertionAgr.tauxIntegration)}
              </span>
              <span className="text-[10px] font-medium text-emerald-600/80 mt-1">
                {
                  t(
                    "prefDomainDashboard.affairesFeminines.section6.insertionAgr.taux",
                    "Taux intégration",
                  ) as string
                }
              </span>
            </div>
            <div className="p-3 bg-teal-500/10 rounded-xl border border-teal-500/20 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-black text-teal-600" dir="ltr">
                {fmtNum(data.insertionAgr.beneficiairesAgr, lang)}
              </span>
              <span className="text-[10px] font-medium text-teal-600/80 mt-1">
                {
                  t(
                    "prefDomainDashboard.affairesFeminines.section6.insertionAgr.benefAgr",
                    "Bénéficiaires AGR",
                  ) as string
                }
              </span>
            </div>
          </div>

          {data.insertionAgr.partenairesAgr.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {
                  t(
                    "prefDomainDashboard.affairesFeminines.section6.insertionAgr.partenaires",
                    "Partenaires",
                  ) as string
                }
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.insertionAgr.partenairesAgr.map((p) => (
                  <span
                    key={p}
                    className="text-xs px-2 py-1 rounded-full bg-muted/30 border border-border/50"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    },

    // 3. Sensibilisation & Portes Ouvertes
    {
      id: "sensibilisationPortesOuvertes",
      title: t(
        "prefDomainDashboard.affairesFeminines.section6.sensibilisation.title",
        "Sensibilisation & Portes Ouvertes",
      ) as string,
      icon: <Megaphone className="h-4 w-4 text-amber-500" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-black text-foreground" dir="ltr">
                {fmtNum(data.sensibilisationPortesOuvertes.totalActivites, lang)}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground mt-1">
                {
                  t(
                    "prefDomainDashboard.affairesFeminines.section6.sensibilisation.activites",
                    "Activités",
                  ) as string
                }
              </span>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-black text-amber-600" dir="ltr">
                {fmtNum(data.sensibilisationPortesOuvertes.totalUrbain, lang)}
              </span>
              <span className="text-[10px] font-medium text-amber-600/80 mt-1">
                {t("prefDomainDashboard.affairesFeminines.urbain", "Urbain") as string}
              </span>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-black text-emerald-600" dir="ltr">
                {fmtNum(data.sensibilisationPortesOuvertes.totalRural, lang)}
              </span>
              <span className="text-[10px] font-medium text-emerald-600/80 mt-1">
                {t("prefDomainDashboard.affairesFeminines.rural", "Rural") as string}
              </span>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-black text-indigo-600" dir="ltr">
                {fmtNum(data.sensibilisationPortesOuvertes.totalBeneficiairesPortesOuvertes, lang)}
              </span>
              <span className="text-[10px] font-medium text-indigo-600/80 mt-1">
                {
                  t(
                    "prefDomainDashboard.affairesFeminines.section6.sensibilisation.portesOuvertesBenef",
                    "Bénéf. Portes Ouvertes",
                  ) as string
                }
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {
                  t(
                    "prefDomainDashboard.affairesFeminines.section6.sensibilisation.portesOuvertes",
                    "Portes ouvertes",
                  ) as string
                }
              </span>
              <span className="text-lg font-bold text-foreground" dir="ltr">
                {fmtNum(data.sensibilisationPortesOuvertes.totalPortesOuvertes, lang)}
              </span>
            </div>
            <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {
                  t(
                    "prefDomainDashboard.affairesFeminines.section6.sensibilisation.totalBenef",
                    "Total bénéficiaires",
                  ) as string
                }
              </span>
              <span className="text-lg font-bold text-foreground" dir="ltr">
                {fmtNum(data.sensibilisationPortesOuvertes.totalBeneficiaires, lang)}
              </span>
            </div>
          </div>
        </div>
      ),
    },

    // 4. Centres d'Écoute
    {
      id: "centresEcoute",
      title: t(
        "prefDomainDashboard.affairesFeminines.section6.ecoute.title",
        "Centres d'Écoute",
      ) as string,
      icon: <HeartHandshake className="h-4 w-4 text-pink-500" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-pink-500/10 rounded-xl border border-pink-500/20 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-pink-600" dir="ltr">
                {fmtNum(data.centresEcoute.totalSeances, lang)}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground mt-1">
                {t("prefDomainDashboard.affairesFeminines.seances", "Séances") as string}
              </span>
            </div>
            <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-rose-600" dir="ltr">
                {fmtNum(data.centresEcoute.totalCas, lang)}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground mt-1">
                {
                  t(
                    "prefDomainDashboard.affairesFeminines.section6.ecoute.cas",
                    "Cas traités",
                  ) as string
                }
              </span>
            </div>
          </div>

          {data.centresEcoute.parTypeSoutien.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {
                  t(
                    "prefDomainDashboard.affairesFeminines.section6.ecoute.parType",
                    "Type de soutien",
                  ) as string
                }
              </h4>
              {data.centresEcoute.parTypeSoutien.map(({ type, count }) => (
                <div key={type} className="flex justify-between items-center text-xs">
                  <span className="text-foreground font-medium">{tTypeSoutien(type)}</span>
                  <span className="text-muted-foreground font-bold" dir="ltr">
                    {fmtNum(count, lang)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },

    // 5. Ressources Humaines & Cadres
    {
      id: "ressourcesHumainesCadres",
      title: t(
        "prefDomainDashboard.affairesFeminines.section6.rh.title",
        "Ressources Humaines & Cadres",
      ) as string,
      icon: <Users className="h-4 w-4 text-slate-500" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-black text-emerald-600" dir="ltr">
                {fmtNum(data.ressourcesHumainesCadres.ressourcesDisponibles, lang)}
              </span>
              <span className="text-[10px] font-medium text-emerald-600/80 mt-1">
                {
                  t(
                    "prefDomainDashboard.affairesFeminines.section6.rh.disponibles",
                    "Disponibles",
                  ) as string
                }
              </span>
            </div>
            <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-black text-red-600" dir="ltr">
                {fmtNum(data.ressourcesHumainesCadres.ressourcesBesoin, lang)}
              </span>
              <span className="text-[10px] font-medium text-red-600/80 mt-1">
                {
                  t(
                    "prefDomainDashboard.affairesFeminines.section6.rh.besoins",
                    "Besoins",
                  ) as string
                }
              </span>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-black text-blue-600" dir="ltr">
                {fmtNum(data.ressourcesHumainesCadres.cadresFormes, lang)}
              </span>
              <span className="text-[10px] font-medium text-blue-600/80 mt-1">
                {
                  t(
                    "prefDomainDashboard.affairesFeminines.section6.rh.cadresFormes",
                    "Cadres formés",
                  ) as string
                }
              </span>
            </div>
          </div>

          {(data.ressourcesHumainesCadres.parProfil.length > 0 ||
            data.ressourcesHumainesCadres.parDomaineFormation.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
              {data.ressourcesHumainesCadres.parProfil.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {
                      t(
                        "prefDomainDashboard.affairesFeminines.section6.rh.parProfil",
                        "Profils",
                      ) as string
                    }
                  </h4>
                  {data.ressourcesHumainesCadres.parProfil.map(({ profil, nombre }) => (
                    <div key={profil} className="flex justify-between items-center text-xs">
                      <span className="text-foreground font-medium">{profil}</span>
                      <span className="text-muted-foreground font-bold" dir="ltr">
                        {fmtNum(nombre, lang)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {data.ressourcesHumainesCadres.parDomaineFormation.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {
                      t(
                        "prefDomainDashboard.affairesFeminines.section6.rh.parDomaine",
                        "Domaines de formation",
                      ) as string
                    }
                  </h4>
                  {data.ressourcesHumainesCadres.parDomaineFormation.map(({ domaine, cadres }) => (
                    <div key={domaine} className="flex justify-between items-center text-xs">
                      <span className="text-foreground font-medium">{domaine}</span>
                      <span className="text-muted-foreground font-bold" dir="ltr">
                        {fmtNum(cadres, lang)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ),
    },

    // 6. Réseau & Partenariats
    {
      id: "reseauPartenariats",
      title: t(
        "prefDomainDashboard.affairesFeminines.section6.reseau.title",
        "Réseau & Partenariats",
      ) as string,
      icon: <Handshake className="h-4 w-4 text-indigo-500" />,
      content: (
        <div className="space-y-6">
          <div className="p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex items-center justify-between">
            <span className="font-bold text-indigo-700 dark:text-indigo-400 text-sm">
              {
                t(
                  "prefDomainDashboard.affairesFeminines.section6.reseau.partenariatsSuivis",
                  "Partenariats suivis",
                ) as string
              }
            </span>
            <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400" dir="ltr">
              {fmtNum(data.reseauPartenariats.partenariatsSuivis, lang)}
            </span>
          </div>

          {data.reseauPartenariats.sujetsPartenariats.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {
                  t(
                    "prefDomainDashboard.affairesFeminines.section6.reseau.sujets",
                    "Sujets de partenariats",
                  ) as string
                }
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.reseauPartenariats.sujetsPartenariats.map((s) => (
                  <span
                    key={s}
                    className="text-xs px-2 py-1 rounded-full bg-muted/30 border border-border/50"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {data.reseauPartenariats.mouvements.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {
                  t(
                    "prefDomainDashboard.affairesFeminines.section6.reseau.mouvements",
                    "Mouvements du réseau",
                  ) as string
                }
              </h4>
              {data.reseauPartenariats.mouvements.map(({ type, count }) => (
                <div key={type} className="flex justify-between items-center text-xs">
                  <span className="text-foreground font-medium">{tTypeReseau(type)}</span>
                  <span className="text-muted-foreground font-bold" dir="ltr">
                    {fmtNum(count, lang)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
  ];
};
