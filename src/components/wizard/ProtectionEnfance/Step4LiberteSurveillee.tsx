import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Scale, Users, FileText, BookOpen } from "lucide-react";
import { StepComponentProps } from "@/config/wizard.types";
import { NumericField } from "@/components/form/NumericField";

// ⚠️ Assure-toi que les imports pointent vers le bon fichier contenant les Hooks ci-dessus
import {
  usePeStatistiquesLS,
  usePeRapportsJudiciaires,
  PeStatsLSEntry,
} from "@/hooks/ProtectionEnfance/usePeStep4";

export const Step4LiberteSurveillee = memo(
  ({ disabled, onActivity, rapportId }: StepComponentProps & { rapportId?: string | null }) => {
    const { i18n } = useTranslation();
    const isAr = i18n.language === "ar";

    const { items: statsItems, add: addStat, update: updateStat } = usePeStatistiquesLS(rapportId);
    const {
      items: rapportItems,
      add: addRapport,
      update: updateRapport,
    } = usePeRapportsJudiciaires(rapportId);

    // Le filtrage fonctionnera parfaitement maintenant car type_prise_charge n'est plus écrasé
    const lsStat = statsItems.find((s) => s.type_prise_charge === "liberte_surveillee");
    const rapportJudiciaire = rapportItems[0];

    const handleStatChange = (field: keyof PeStatsLSEntry, value: number) => {
      if (lsStat) {
        updateStat(lsStat.local_id, { [field]: value });
      } else {
        addStat({
          local_id: crypto.randomUUID(),
          type_prise_charge: "liberte_surveillee",
          garcons: 0,
          filles: 0,
          migrants_non_accompagnes: 0, // Initialisation du nouveau champ
          ls_integres_enseignement: 0,
          ls_integres_formation_pro: 0,
          ls_integres_apprentissage: 0,
          ls_integres_activites_durables: 0,
          [field]: value,
        } as PeStatsLSEntry);
      }
      if (onActivity) onActivity();
    };

    const handleRapportChange = (value: number) => {
      if (rapportJudiciaire) {
        updateRapport(rapportJudiciaire.local_id, { nombre_rapports: value });
      } else {
        addRapport({
          local_id: crypto.randomUUID(),
          nombre_rapports: value,
        } as any);
      }
      if (onActivity) onActivity();
    };

    return (
      <div className="space-y-8">
        {/* ========================================================================= */}
        {/* HEADER SECTION */}
        {/* ========================================================================= */}
        <Card className="p-5 sm:p-6 bg-card border-border shadow-sm border-t-4 border-t-primary">
          <div className="flex items-center gap-3 border-b border-border pb-4 mb-5">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Scale className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isAr ? "نظام الحرية المحروسة" : "Liberté Surveillée"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isAr
                  ? "الإحصائيات، الإدماج، والتقارير القضائية"
                  : "Statistiques, Intégration et Rapports judiciaires"}
              </p>
            </div>
          </div>

          {/* 1. الإحصائيات الديموغرافية */}
          <div className="space-y-4">
            <Label className="text-sm font-bold flex items-center gap-1.5 text-primary">
              <Users className="h-4 w-4" />
              {isAr
                ? "1. الإحصائيات العامة للمستفيدين من الحرية المحروسة"
                : "1. Statistiques Globales des Bénéficiaires"}
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-border/60 p-4 rounded-lg bg-muted/5">
              <NumericField
                label={isAr ? "الذكور المتتبعين" : "Garçons suivis"}
                value={lsStat?.garcons || 0}
                onChange={(v) => handleStatChange("garcons", v)}
                disabled={disabled}
              />
              <NumericField
                label={isAr ? "الإناث المتتبعات" : "Filles suivies"}
                value={lsStat?.filles || 0}
                onChange={(v) => handleStatChange("filles", v)}
                disabled={disabled}
              />
              <NumericField
                label={isAr ? "المهاجرين غير المرفقين" : "Migrants non accompagnés"}
                value={lsStat?.migrants_non_accompagnes || 0}
                onChange={(v) => handleStatChange("migrants_non_accompagnes", v)}
                disabled={disabled}
              />
            </div>
          </div>
        </Card>

        {/* ========================================================================= */}
        {/* SECTION INTEGRATION (Tables 7 & 9) */}
        {/* ========================================================================= */}
        <Card className="p-5 sm:p-6 bg-card border-border shadow-sm">
          <div className="space-y-6">
            <div className="border-b border-border pb-4">
              <Label className="text-sm font-bold flex items-center gap-1.5 text-primary">
                <BookOpen className="h-4 w-4" />
                {isAr
                  ? "2. إدماج الأطفال المحالين على نظام الحرية المحروسة"
                  : "2. Intégration des enfants"}
              </Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <NumericField
                label={isAr ? "المندمجين بالمؤسسات التعليمية" : "Enseignement"}
                value={lsStat?.ls_integres_enseignement || 0}
                onChange={(v) => handleStatChange("ls_integres_enseignement", v)}
                disabled={disabled}
              />
              <NumericField
                label={isAr ? "المندمجين بمؤسسات التكوين المهني" : "Formation professionnelle"}
                value={lsStat?.ls_integres_formation_pro || 0}
                onChange={(v) => handleStatChange("ls_integres_formation_pro", v)}
                disabled={disabled}
              />
              <NumericField
                label={isAr ? "المندمجين في التداريب المهنية" : "Apprentissage professionnel"}
                value={lsStat?.ls_integres_apprentissage || 0}
                onChange={(v) => handleStatChange("ls_integres_apprentissage", v)}
                disabled={disabled}
              />
              <NumericField
                label={
                  isAr
                    ? "المندمجين في الأنشطة المستدامة (جمعيات/نوادي)"
                    : "Activités durables (Clubs)"
                }
                value={lsStat?.ls_integres_activites_durables || 0}
                onChange={(v) => handleStatChange("ls_integres_activites_durables", v)}
                disabled={disabled}
              />
            </div>
          </div>
        </Card>

        {/* ========================================================================= */}
        {/* SECTION RAPPORTS JUDICIAIRES (Table 8) */}
        {/* ========================================================================= */}
        <Card className="p-5 sm:p-6 bg-card border-border shadow-sm">
          <div className="space-y-6">
            <div className="border-b border-border pb-4">
              <Label className="text-sm font-bold flex items-center gap-1.5 text-primary">
                <FileText className="h-4 w-4" />
                {isAr
                  ? "3. عدد التقارير المسلمة للسلطات القضائية"
                  : "3. Rapports soumis à la justice"}
              </Label>
            </div>

            <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/5 w-full md:w-2/3 lg:w-1/2">
              <Label className="font-semibold">
                {isAr
                  ? "التقارير المنجزة من طرف مندوبي الحرية المحروسة"
                  : "Rapports réalisés par les délégués à la LS"}
              </Label>
              <div className="w-32">
                <NumericField
                  label=""
                  value={rapportJudiciaire?.nombre_rapports || 0}
                  onChange={handleRapportChange}
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  },
);

Step4LiberteSurveillee.displayName = "Step4LiberteSurveillee";
