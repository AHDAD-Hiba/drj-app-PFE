import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { NumericField } from "@/components/form/NumericField";
import { StepComponentProps } from "@/config/wizard.types";
import { useActivitesEntries, ActiviteEntry } from "@/hooks/Jeunesse/useActivitesEntries";

export const Step2Rayonante = memo(({ rapportId, disabled, onActivity }: StepComponentProps) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const { items, add, update } = useActivitesEntries(rapportId);
  const data = items.find((x) => x.type_activite === "rayonnante");

  const handleChange = (field: keyof ActiviteEntry, value: number) => {
    const safeVal = Math.max(0, Number(value) || 0);
    if (data) {
      update(data.local_id, { [field]: safeVal });
    } else {
      add({
        local_id: crypto.randomUUID(),
        type_activite: "rayonnante",
        nombre_associations: 0,
        nombre_clubs: 0,
        nombre_conventions: 0,
        activites_educatives: 0,
        activites_culturelles: 0,
        activites_sportives: 0,
        renforcement_capacites: 0,
        [field]: safeVal,
      });
    }
    if (onActivity) void onActivity();
  };

  return (
    <Card className="p-5 sm:p-6 shadow-sm border-border/60">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-foreground">
          {isAr ? "الأنشطة الإشعاعية" : "Activités rayonnantes"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {isAr ? "الأنشطة الإشعاعية حسب النوع" : "Activités rayonnantes par type"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        <NumericField
          label={t("form.permanent.activitesEducatives")}
          value={data?.activites_educatives || 0}
          onChange={(v) => handleChange("activites_educatives", v)}
          disabled={disabled}
        />

        <NumericField
          label={t("form.permanent.activitesCulturelles")}
          value={data?.activites_culturelles || 0}
          onChange={(v) => handleChange("activites_culturelles", v)}
          disabled={disabled}
        />

        <NumericField
          label={t("form.permanent.activitesSportives")}
          value={data?.activites_sportives || 0}
          onChange={(v) => handleChange("activites_sportives", v)}
          disabled={disabled}
        />

        <NumericField
          label={t("form.permanent.renforcementCapacites")}
          value={data?.renforcement_capacites || 0}
          onChange={(v) => handleChange("renforcement_capacites", v)}
          disabled={disabled}
        />
      </div>
    </Card>
  );
});

Step2Rayonante.displayName = "Step2Rayonante";
