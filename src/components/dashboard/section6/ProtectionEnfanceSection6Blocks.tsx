import type { TFunction } from "i18next";
import {
  AlertTriangle,
  Baby,
  Banknote,
  Building,
  GraduationCap,
  Handshake,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";
import type { Section6Block } from "./types";
import type { ProtectionEnfanceSection6Data } from "@/services/PrefDomainDashboardProtectionEnfanceDataService";

const fmtNum = (n: number, lang: string) =>
  new Intl.NumberFormat(lang === "ar" ? "ar-MA" : "fr-FR").format(Math.round(n));

/**
 * Construit les blocs détaillés du domaine Protection de l'Enfance pour
 * Section6. Toute l'agrégation vient déjà faite de
 * PrefDomainDashboardProtectionEnfanceDataService ; ce fichier ne fait que
 * construire le JSX de présentation via le shell d'accordéon générique
 * PrefDomainDashboardSection6 (même pattern que Jeunesse / Infrastructure /
 * Affaires Féminines).
 */
export const buildProtectionEnfanceSection6Blocks = (
  data: ProtectionEnfanceSection6Data,
  lang: string,
  t: TFunction,
): Section6Block[] => {
const tCible = (cible: string) =>
    (t(`prefDomainDashboard.protectionEnfance.cibles.${cible}`, cible) as string);

  return [
    // 1. Prise en charge
    {
      id: "priseEnCharge",
      title: t(
        "prefDomainDashboard.protectionEnfance.section6.priseEnCharge.title",
        "Prise en charge",
      ) as string,
      icon: <Users className="h-4 w-4 text-blue-500" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-blue-600" dir="ltr">
                {fmtNum(data.priseEnCharge.total, lang)}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground mt-1">
                {t("prefDomainDashboard.protectionEnfance.section6.priseEnCharge.total", "Total") as string}
              </span>
            </div>
            <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-black text-foreground" dir="ltr">
                {fmtNum(data.priseEnCharge.totalGarcons, lang)}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground mt-1">
                {t("prefDomainDashboard.protectionEnfance.garcons", "Garçons") as string}
              </span>
            </div>
            <div className="p-3 bg-pink-500/10 rounded-xl border border-pink-500/20 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-black text-pink-600" dir="ltr">
                {fmtNum(data.priseEnCharge.totalFilles, lang)}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground mt-1">
                {t("prefDomainDashboard.protectionEnfance.filles", "Filles") as string}
              </span>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-black text-amber-600" dir="ltr">
                {fmtNum(data.priseEnCharge.migrantsNonAccompagnes, lang)}
              </span>
              <span className="text-[10px] font-medium text-amber-600/80 mt-1">
                {t("prefDomainDashboard.protectionEnfance.section6.priseEnCharge.migrants", "Migrants") as string}
              </span>
            </div>
          </div>
          <div className="p-3 bg-muted/20 rounded-xl border border-border/50 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t("prefDomainDashboard.protectionEnfance.section6.priseEnCharge.changementMesure", "Changements de mesure") as string}
            </span>
            <span className="text-lg font-bold text-foreground" dir="ltr">
              {fmtNum(data.priseEnCharge.changementMesure, lang)}
            </span>
          </div>
        </div>
      ),
    },

    // 2. Éducation & Formation
    {
      id: "educationFormation",
      title: t(
        "prefDomainDashboard.protectionEnfance.section6.educationFormation.title",
        "Éducation & Formation",
      ) as string,
      icon: <GraduationCap className="h-4 w-4 text-emerald-500" />,
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t("prefDomainDashboard.protectionEnfance.section6.educationFormation.education", "Éducation") as string}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/30 rounded-xl border border-border/50">
                <span className="text-[11px] font-medium text-muted-foreground block mb-1">
                  {t("prefDomainDashboard.protectionEnfance.section6.educationFormation.educationFormal", "Formel") as string}
                </span>
                <span className="text-lg font-bold text-foreground" dir="ltr">
                  {fmtNum(data.educationFormation.education.formel, lang)}
                </span>
              </div>
              <div className="p-3 bg-muted/30 rounded-xl border border-border/50">
                <span className="text-[11px] font-medium text-muted-foreground block mb-1">
                  {t("prefDomainDashboard.protectionEnfance.section6.educationFormation.educationNonFormal", "Non formel") as string}
                </span>
                <span className="text-lg font-bold text-foreground" dir="ltr">
                  {fmtNum(data.educationFormation.education.nonFormel, lang)}
                </span>
              </div>
              <div className="p-3 bg-muted/30 rounded-xl border border-border/50">
                <span className="text-[11px] font-medium text-muted-foreground block mb-1">
                  {t("prefDomainDashboard.protectionEnfance.section6.educationFormation.educationSoutien", "Soutien") as string}
                </span>
                <span className="text-lg font-bold text-foreground" dir="ltr">
                  {fmtNum(data.educationFormation.education.soutien, lang)}
                </span>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex flex-col items-center justify-center text-center">
                <span className="text-lg font-black text-emerald-600" dir="ltr">
                  {fmtNum(data.educationFormation.education.total, lang)}
                </span>
                <span className="text-[10px] font-medium text-emerald-600/80 mt-1">
                  {t("prefDomainDashboard.protectionEnfance.section6.totalEducation", "Total éducation") as string}
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t("prefDomainDashboard.protectionEnfance.section6.educationFormation.formation", "Formation") as string}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/30 rounded-xl border border-border/50">
                <span className="text-[11px] font-medium text-muted-foreground block mb-1">
                  {t("prefDomainDashboard.protectionEnfance.section6.educationFormation.intra", "Intra-muros") as string}
                </span>
                <span className="text-lg font-bold text-foreground" dir="ltr">
                  {fmtNum(data.educationFormation.formation.intra, lang)}
                </span>
              </div>
              <div className="p-3 bg-muted/30 rounded-xl border border-border/50">
                <span className="text-[11px] font-medium text-muted-foreground block mb-1">
                  {t("prefDomainDashboard.protectionEnfance.section6.educationFormation.extra", "Extra-muros") as string}
                </span>
                <span className="text-lg font-bold text-foreground" dir="ltr">
                  {fmtNum(data.educationFormation.formation.extra, lang)}
                </span>
              </div>
              <div className="p-3 bg-muted/30 rounded-xl border border-border/50">
                <span className="text-[11px] font-medium text-muted-foreground block mb-1">
                  {t("prefDomainDashboard.protectionEnfance.section6.educationFormation.initiation", "Initiation") as string}
                </span>
                <span className="text-lg font-bold text-foreground" dir="ltr">
                  {fmtNum(data.educationFormation.formation.initiation, lang)}
                </span>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex flex-col items-center justify-center text-center">
                <span className="text-lg font-black text-emerald-600" dir="ltr">
                  {fmtNum(data.educationFormation.formation.total, lang)}
                </span>
                <span className="text-[10px] font-medium text-emerald-600/80 mt-1">
                  {t("prefDomainDashboard.protectionEnfance.section6.totalFormation", "Total formation") as string}
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // 3. Ateliers & Activités
    {
      id: "ateliersActivites",
      title: t(
        "prefDomainDashboard.protectionEnfance.section6.ateliersActivites.title",
        "Ateliers & Activités",
      ) as string,
      icon: <Wrench className="h-4 w-4 text-indigo-500" />,
      content: (
        <div className="space-y-6">
          {data.ateliersActivites.ateliers.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("prefDomainDashboard.protectionEnfance.section6.ateliersActivites.ateliers", "Ateliers créés") as string}
              </h4>
              {data.ateliersActivites.ateliers.map((a, i) => (
                <div key={`${a.nom}-${i}`} className="flex justify-between items-center text-xs">
                  <span className="text-foreground font-medium">{a.nom}</span>
                  <span className="text-muted-foreground font-bold" dir="ltr">{fmtNum(a.nombre, lang)}</span>
                </div>
              ))}
            </div>
          )}
          {data.ateliersActivites.activitesParDomaine.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("prefDomainDashboard.protectionEnfance.section6.ateliersActivites.parDomaine", "Bénéficiaires par domaine d'activité") as string}
              </h4>
              {data.ateliersActivites.activitesParDomaine.map((d) => (
                <div key={d.domaine} className="flex justify-between items-center text-xs">
                  <span className="text-foreground font-medium">{d.domaine}</span>
                  <span className="text-muted-foreground font-bold" dir="ltr">{fmtNum(d.nombreBeneficiaires, lang)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },

    // 4. Liberté surveillée
    {
      id: "liberteSurveillee",
      title: t(
        "prefDomainDashboard.protectionEnfance.section6.liberteSurveillee.title",
        "Liberté surveillée",
      ) as string,
      icon: <ShieldCheck className="h-4 w-4 text-cyan-500" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-black text-foreground" dir="ltr">
                {fmtNum(data.liberteSurveillee.scolaire, lang)}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground mt-1">
                {t("prefDomainDashboard.protectionEnfance.section6.liberteSurveillee.scolaire", "Scolaire") as string}
              </span>
            </div>
            <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-black text-foreground" dir="ltr">
                {fmtNum(data.liberteSurveillee.formationPro, lang)}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground mt-1">
                {t("prefDomainDashboard.protectionEnfance.section6.liberteSurveillee.formationPro", "Formation pro") as string}
              </span>
            </div>
            <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-black text-foreground" dir="ltr">
                {fmtNum(data.liberteSurveillee.stage, lang)}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground mt-1">
                {t("prefDomainDashboard.protectionEnfance.section6.liberteSurveillee.stage", "Stage") as string}
              </span>
            </div>
            <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-black text-foreground" dir="ltr">
                {fmtNum(data.liberteSurveillee.associations, lang)}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground mt-1">
                {t("prefDomainDashboard.protectionEnfance.section6.liberteSurveillee.associations", "Associations") as string}
              </span>
            </div>
          </div>
          <div className="p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/20 flex items-center justify-between">
            <span className="font-bold text-cyan-700 dark:text-cyan-400 text-sm">
              {t("prefDomainDashboard.protectionEnfance.section6.liberteSurveillee.total", "Total intégrations") as string}
            </span>
            <span className="text-3xl font-black text-cyan-600 dark:text-cyan-400" dir="ltr">
              {fmtNum(data.liberteSurveillee.total, lang)}
            </span>
          </div>
        </div>
      ),
    },

    // 5. Conseil des enfants
    {
      id: "conseilEnfant",
      title: t(
        "prefDomainDashboard.protectionEnfance.section6.conseilEnfant.title",
        "Conseil des enfants",
      ) as string,
      icon: <Baby className="h-4 w-4 text-violet-500" />,
      content: (
        <div className="p-4 bg-violet-500/10 rounded-xl border border-violet-500/20 flex items-center justify-between">
          <span className="font-bold text-violet-700 dark:text-violet-400 text-sm">
            {t("prefDomainDashboard.protectionEnfance.section6.conseilEnfant.sessions", "Sessions organisées") as string}
          </span>
          <span className="text-3xl font-black text-violet-600 dark:text-violet-400" dir="ltr">
            {fmtNum(data.conseilEnfant.totalSessions, lang)}
          </span>
        </div>
      ),
    },

    // 6. Partenariats
    {
      id: "partenariats",
      title: t(
        "prefDomainDashboard.protectionEnfance.section6.partenariats.title",
        "Partenariats",
      ) as string,
      icon: <Handshake className="h-4 w-4 text-indigo-500" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-indigo-600" dir="ltr">
                {fmtNum(data.partenariats.conventions, lang)}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground mt-1">
                {t("prefDomainDashboard.protectionEnfance.section6.partenariats.conventions", "Conventions") as string}
              </span>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-blue-600" dir="ltr">
                {fmtNum(data.partenariats.projetsExecutes, lang)}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground mt-1">
                {t("prefDomainDashboard.protectionEnfance.section6.partenariats.projets", "Projets exécutés") as string}
              </span>
            </div>
          </div>
          {data.partenariats.partenaires.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("prefDomainDashboard.protectionEnfance.section6.partenariats.partenaires", "Partenaires") as string}
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.partenariats.partenaires.map((p) => (
                  <span key={p} className="text-xs px-2 py-1 rounded-full bg-muted/30 border border-border/50">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
          {data.partenariats.sujets.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("prefDomainDashboard.protectionEnfance.section6.partenariats.sujets", "Sujets") as string}
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.partenariats.sujets.map((s) => (
                  <span key={s} className="text-xs px-2 py-1 rounded-full bg-muted/30 border border-border/50">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    },

    // 7. Formation du personnel
    {
      id: "formationPersonnel",
      title: t(
        "prefDomainDashboard.protectionEnfance.section6.formationPersonnel.title",
        "Formation du personnel",
      ) as string,
      icon: <GraduationCap className="h-4 w-4 text-teal-500" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-teal-500/10 rounded-xl border border-teal-500/20 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-teal-600" dir="ltr">
                {fmtNum(data.formationPersonnel.sessions, lang)}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground mt-1">
                {t("prefDomainDashboard.protectionEnfance.section6.formationPersonnel.sessions", "Sessions") as string}
              </span>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-emerald-600" dir="ltr">
                {fmtNum(data.formationPersonnel.beneficiaires, lang)}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground mt-1">
                {t("prefDomainDashboard.protectionEnfance.section6.formationPersonnel.beneficiaires", "Bénéficiaires") as string}
              </span>
            </div>
          </div>
          {data.formationPersonnel.parCible.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("prefDomainDashboard.protectionEnfance.section6.formationPersonnel.parCible", "Par cible") as string}
              </h4>
              {data.formationPersonnel.parCible.map((c) => (
                <div key={c.cible} className="flex justify-between items-center text-xs">
                  <span className="text-foreground font-medium">{tCible(c.cible)}</span>
                  <span className="text-muted-foreground font-bold" dir="ltr">
                    {fmtNum(c.count, lang)} <span className="text-[10px] font-normal">→ {fmtNum(c.beneficiaires, lang)}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },

    // 8. Visites officielles & Dons
    {
      id: "visitesDons",
      title: t(
        "prefDomainDashboard.protectionEnfance.section6.visitesDons.title",
        "Visites officielles & Dons",
      ) as string,
      icon: <Building className="h-4 w-4 text-amber-500" />,
      content: (
        <div className="space-y-6">
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Building className="h-4 w-4" /> {t("prefDomainDashboard.protectionEnfance.section6.visitesDons.visites", "Visites officielles") as string}
            </h4>
            {data.visitesDons.visites.length === 0 ? (
              <span className="text-sm text-muted-foreground">
                {t("prefDomainDashboard.protectionEnfance.section6.visitesDons.noVisites", "Aucune visite signalée") as string}
              </span>
            ) : (
              data.visitesDons.visites.map((v, i) => (
                <div key={`${v.entite}-${i}`} className="flex justify-between items-center text-xs">
                  <span className="text-foreground font-medium">{v.entite}</span>
                  <span className="text-muted-foreground font-bold" dir="ltr">{fmtNum(v.nombreVisiteurs, lang)}</span>
                </div>
              ))
            )}
            <div className="p-3 bg-muted/20 rounded-xl border border-border/50 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {t("prefDomainDashboard.protectionEnfance.section6.visitesDons.totalVisiteurs", "Total visiteurs") as string}
              </span>
              <span className="text-lg font-bold text-foreground" dir="ltr">
                {fmtNum(data.visitesDons.totalVisiteurs, lang)}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Banknote className="h-4 w-4" /> {t("prefDomainDashboard.protectionEnfance.section6.visitesDons.dons", "Dons reçus") as string}
            </h4>
            {data.visitesDons.dons.length === 0 ? (
              <span className="text-sm text-muted-foreground">
                {t("prefDomainDashboard.protectionEnfance.section6.visitesDons.noDons", "Aucun don signalé") as string}
              </span>
            ) : (
              data.visitesDons.dons.map((d, i) => (
                <div key={`${d.donateur}-${i}`} className="flex justify-between items-center text-xs">
                  <span className="text-foreground font-medium">{d.donateur} — {d.nature}</span>
                  <span className="text-muted-foreground font-bold" dir="ltr">{fmtNum(d.beneficiaires, lang)}</span>
                </div>
              ))
            )}
            <div className="p-3 bg-muted/20 rounded-xl border border-border/50 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {t("prefDomainDashboard.protectionEnfance.section6.visitesDons.totalDons", "Total dons") as string}
              </span>
              <span className="text-lg font-bold text-foreground" dir="ltr">
                {fmtNum(data.visitesDons.totalDons, lang)}
              </span>
            </div>
          </div>
        </div>
      ),
    },

    // 9. Aménagement & Équipement
    {
      id: "amenagementEquipement",
      title: t(
        "prefDomainDashboard.protectionEnfance.section6.amenagementEquipement.title",
        "Aménagement & Équipement",
      ) as string,
      icon: <Wrench className="h-4 w-4 text-slate-500" />,
      content: (
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-foreground" dir="ltr">
              {fmtNum(data.amenagementEquipement.rehabilites, lang)}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground mt-1">
              {t("prefDomainDashboard.protectionEnfance.section6.amenagementEquipement.rehabilites", "Réhabilités") as string}
            </span>
          </div>
          <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-foreground" dir="ltr">
              {fmtNum(data.amenagementEquipement.equipes, lang)}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground mt-1">
              {t("prefDomainDashboard.protectionEnfance.section6.amenagementEquipement.equipes", "Équipés") as string}
            </span>
          </div>
          <div className="p-3 bg-slate-500/10 rounded-xl border border-slate-500/20 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-slate-600" dir="ltr">
              {fmtNum(data.amenagementEquipement.total, lang)}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground mt-1">
              {t("prefDomainDashboard.protectionEnfance.section6.amenagementEquipement.total", "Total") as string}
            </span>
          </div>
        </div>
      ),
    },

    // 10. Incidents & Rapports judiciaires
    {
      id: "incidentsRapports",
      title: t(
        "prefDomainDashboard.protectionEnfance.section6.incidentsRapports.title",
        "Incidents & Rapports judiciaires",
      ) as string,
      icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-red-600" dir="ltr">
                {fmtNum(data.incidentsRapports.totalIncidents, lang)}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground mt-1">
                {t("prefDomainDashboard.protectionEnfance.section6.incidentsRapports.totalIncidents", "Incidents signalés") as string}
              </span>
            </div>
            <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-rose-600" dir="ltr">
                {fmtNum(data.incidentsRapports.rapportsJudiciaires, lang)}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground mt-1">
                {t("prefDomainDashboard.protectionEnfance.section6.incidentsRapports.rapportsJudiciaires", "Rapports judiciaires") as string}
              </span>
            </div>
          </div>
          {data.incidentsRapports.incidentsParType.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("prefDomainDashboard.protectionEnfance.section6.incidentsRapports.parType", "Incidents par type") as string}
              </h4>
              {data.incidentsRapports.incidentsParType.map((inc) => (
                <div key={inc.id} className="flex justify-between items-center text-xs">
                  <span className="text-foreground font-medium">{inc.name}</span>
                  <span className="text-muted-foreground font-bold" dir="ltr">{fmtNum(inc.count, lang)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
  ];
};
