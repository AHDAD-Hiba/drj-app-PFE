import type { TFunction } from "i18next";
import {
  Baby,
  BriefcaseBusiness,
  Building,
  Handshake,
  HousePlus,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import type { Section6Block } from "./types";
import type { EnfanceCrechesSection6Data } from "@/services/PrefDomainDashboardEnfanceCrechesDataService";

const fmtNum = (n: number, lang: string) =>
  new Intl.NumberFormat(lang === "ar" ? "ar-MA" : "fr-FR").format(Math.round(n));

export const buildEnfanceCrechesSection6Blocks = (
  data: EnfanceCrechesSection6Data,
  lang: string,
  t: TFunction,
): Section6Block[] => [
  {
    id: "licencesDemandes",
    title: t(
      "prefDomainDashboard.enfanceCreches.section6.licencesDemandes.title",
      "Licences & Demandes",
    ) as string,
    icon: <ShieldCheck className="h-4 w-4 text-blue-500" />,
    content: (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-blue-600" dir="ltr">
              {fmtNum(data.licences.traitement.demandesTraitees, lang)}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground mt-1">
              {
                t(
                  "prefDomainDashboard.enfanceCreches.section6.licencesDemandes.demandesTraitees",
                  "Demandes traitées",
                ) as string
              }
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-emerald-600" dir="ltr">
              {fmtNum(data.licences.traitement.delaiMoyen, lang)}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground mt-1">
              {
                t(
                  "prefDomainDashboard.enfanceCreches.section6.licencesDemandes.delaiMoyen",
                  "Délai moyen (jours)",
                ) as string
              }
            </span>
          </div>
        </div>
        {data.licences.demandesParType.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {
                t(
                  "prefDomainDashboard.enfanceCreches.section6.licencesDemandes.parType",
                  "Par type",
                ) as string
              }
            </h4>
            {data.licences.demandesParType.map((item) => (
              <div key={item.id} className="flex justify-between text-xs">
                <span className="text-foreground font-medium">{item.name}</span>
                <span className="text-muted-foreground font-bold" dir="ltr">
                  {fmtNum(item.value, lang)}
                </span>
              </div>
            ))}
          </div>
        )}
        {data.licences.demandesParStatut.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {
                t(
                  "prefDomainDashboard.enfanceCreches.section6.licencesDemandes.parStatut",
                  "Par statut",
                ) as string
              }
            </h4>
            {data.licences.demandesParStatut.map((item) => (
              <div key={item.id} className="flex justify-between text-xs">
                <span className="text-foreground font-medium">{item.name}</span>
                <span className="text-muted-foreground font-bold" dir="ltr">
                  {fmtNum(item.value, lang)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    ),
  },
  {
    id: "enfantsPrisesEnCharge",
    title: t(
      "prefDomainDashboard.enfanceCreches.section6.enfants.title",
      "Enfants pris en charge",
    ) as string,
    icon: <Baby className="h-4 w-4 text-pink-500" />,
    content: (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-foreground" dir="ltr">
              {fmtNum(data.enfants.total, lang)}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground mt-1">
              {t("prefDomainDashboard.enfanceCreches.section6.enfants.total", "Total") as string}
            </span>
          </div>
          <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-foreground" dir="ltr">
              {fmtNum(data.enfants.urbain, lang)}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground mt-1">
              {t("prefDomainDashboard.enfanceCreches.section6.enfants.urbain", "Urbain") as string}
            </span>
          </div>
          <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-foreground" dir="ltr">
              {fmtNum(data.enfants.rural, lang)}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground mt-1">
              {t("prefDomainDashboard.enfanceCreches.section6.enfants.rural", "Rural") as string}
            </span>
          </div>
        </div>
        {data.enfants.activites.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {
                t(
                  "prefDomainDashboard.enfanceCreches.section6.enfants.activites",
                  "Activités",
                ) as string
              }
            </h4>
            {data.enfants.activites.map((item) => (
              <div key={item.nom} className="flex justify-between text-xs">
                <span className="text-foreground font-medium">{item.nom}</span>
                <span className="text-muted-foreground font-bold" dir="ltr">
                  {fmtNum(item.garcons + item.filles, lang)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    ),
  },
  {
    id: "infrastructureQualite",
    title: t(
      "prefDomainDashboard.enfanceCreches.section6.infrastructureQualite.title",
      "Infrastructure & Qualité",
    ) as string,
    icon: <HousePlus className="h-4 w-4 text-amber-500" />,
    content: (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-foreground" dir="ltr">
              {fmtNum(data.infrastructureQualite.crechesCreees, lang)}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground mt-1">
              {
                t(
                  "prefDomainDashboard.enfanceCreches.section6.infrastructureQualite.crechesCreees",
                  "Créées",
                ) as string
              }
            </span>
          </div>
          <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-foreground" dir="ltr">
              {fmtNum(data.infrastructureQualite.crechesEquipees, lang)}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground mt-1">
              {
                t(
                  "prefDomainDashboard.enfanceCreches.section6.infrastructureQualite.crechesEquipees",
                  "Équipées",
                ) as string
              }
            </span>
          </div>
          <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-foreground" dir="ltr">
              {fmtNum(data.infrastructureQualite.crechesQualifiees, lang)}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground mt-1">
              {
                t(
                  "prefDomainDashboard.enfanceCreches.section6.infrastructureQualite.crechesQualifiees",
                  "Qualifiées",
                ) as string
              }
            </span>
          </div>
        </div>
        <div className="p-3 bg-muted/20 rounded-xl border border-border/50 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {
              t(
                "prefDomainDashboard.enfanceCreches.section6.infrastructureQualite.labelsObtenus",
                "Labels obtenus",
              ) as string
            }
          </span>
          <span className="text-lg font-bold text-foreground" dir="ltr">
            {fmtNum(data.infrastructureQualite.labelsObtenus, lang)}
          </span>
        </div>
        {data.infrastructureQualite.controles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {
                t(
                  "prefDomainDashboard.enfanceCreches.section6.infrastructureQualite.controles",
                  "Contrôles",
                ) as string
              }
            </h4>
            {data.infrastructureQualite.controles.map((item, idx) => (
              <div key={`${item.nom}-${idx}`} className="flex justify-between text-xs">
                <span className="text-foreground font-medium">{item.nom}</span>
                <span className="text-muted-foreground font-bold" dir="ltr">
                  {item.resultat || "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    ),
  },
  {
    id: "mouvements",
    title: t(
      "prefDomainDashboard.enfanceCreches.section6.mouvements.title",
      "Mouvements & Fermetures",
    ) as string,
    icon: <Wrench className="h-4 w-4 text-orange-500" />,
    content: (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-orange-600" dir="ltr">
              {fmtNum(data.mouvements.totalFermetures, lang)}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground mt-1">
              {
                t(
                  "prefDomainDashboard.enfanceCreches.section6.mouvements.fermetures",
                  "Fermetures",
                ) as string
              }
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-emerald-600" dir="ltr">
              {fmtNum(data.mouvements.totalReouvertures, lang)}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground mt-1">
              {
                t(
                  "prefDomainDashboard.enfanceCreches.section6.mouvements.reouvertures",
                  "Réouvertures",
                ) as string
              }
            </span>
          </div>
        </div>
        {data.mouvements.details.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {
                t(
                  "prefDomainDashboard.enfanceCreches.section6.mouvements.details",
                  "Détails",
                ) as string
              }
            </h4>
            {data.mouvements.details.map((item, idx) => (
              <div key={`${item.type}-${idx}`} className="flex justify-between text-xs">
                <span className="text-foreground font-medium">{item.type}</span>
                <span className="text-muted-foreground font-bold" dir="ltr">
                  {fmtNum(item.nombre, lang)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    ),
  },
  {
    id: "cadresFormations",
    title: t(
      "prefDomainDashboard.enfanceCreches.section6.cadresFormations.title",
      "Cadres & Formations",
    ) as string,
    icon: <BriefcaseBusiness className="h-4 w-4 text-indigo-500" />,
    content: (
      <div className="space-y-6">
        <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {
              t(
                "prefDomainDashboard.enfanceCreches.section6.cadresFormations.totalCadres",
                "Cadres assermentés",
              ) as string
            }
          </span>
          <span className="text-lg font-bold text-foreground" dir="ltr">
            {fmtNum(data.cadres.totalCadres, lang)}
          </span>
        </div>
        {data.cadres.statuts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {
                t(
                  "prefDomainDashboard.enfanceCreches.section6.cadresFormations.statuts",
                  "Par statut",
                ) as string
              }
            </h4>
            {data.cadres.statuts.map((item) => (
              <div key={item.statut} className="flex justify-between text-xs">
                <span className="text-foreground font-medium">{item.statut}</span>
                <span className="text-muted-foreground font-bold" dir="ltr">
                  {fmtNum(item.count, lang)}
                </span>
              </div>
            ))}
          </div>
        )}
        {data.cadres.formations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {
                t(
                  "prefDomainDashboard.enfanceCreches.section6.cadresFormations.formations",
                  "Formations",
                ) as string
              }
            </h4>
            {data.cadres.formations.map((item) => (
              <div key={item.domaine} className="flex justify-between text-xs">
                <span className="text-foreground font-medium">{item.domaine}</span>
                <span className="text-muted-foreground font-bold" dir="ltr">
                  {fmtNum(item.nombreCadres, lang)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    ),
  },
  {
    id: "partenariatsEtudes",
    title: t(
      "prefDomainDashboard.enfanceCreches.section6.partenariatsEtudes.title",
      "Partenariats & Études",
    ) as string,
    icon: <Handshake className="h-4 w-4 text-teal-500" />,
    content: (
      <div className="space-y-6">
        {data.partenariats.conventions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {
                t(
                  "prefDomainDashboard.enfanceCreches.section6.partenariatsEtudes.conventions",
                  "Conventions",
                ) as string
              }
            </h4>
            {data.partenariats.conventions.map((item, idx) => (
              <div key={`${item.partenaire}-${idx}`} className="flex justify-between text-xs">
                <span className="text-foreground font-medium">{item.partenaire}</span>
                <span className="text-muted-foreground font-bold" dir="ltr">
                  {fmtNum(item.nombre, lang)}
                </span>
              </div>
            ))}
          </div>
        )}
        {data.partenariats.analyses.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {
                t(
                  "prefDomainDashboard.enfanceCreches.section6.partenariatsEtudes.analyses",
                  "Analyses ponctuelles",
                ) as string
              }
            </h4>
            {data.partenariats.analyses.map((item) => (
              <div key={item.sujet} className="flex justify-between text-xs">
                <span className="text-foreground font-medium">{item.sujet}</span>
                <span className="text-muted-foreground font-bold" dir="ltr">
                  {fmtNum(item.beneficiaires, lang)}
                </span>
              </div>
            ))}
          </div>
        )}
        {data.partenariats.sondages.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {
                t(
                  "prefDomainDashboard.enfanceCreches.section6.partenariatsEtudes.sondages",
                  "Sondages / études",
                ) as string
              }
            </h4>
            {data.partenariats.sondages.map((item) => (
              <div key={item.type} className="flex justify-between text-xs">
                <span className="text-foreground font-medium">{item.type}</span>
                <span className="text-muted-foreground font-bold" dir="ltr">
                  {fmtNum(item.participants, lang)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    ),
  },
];
