import { memo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SafeInput } from "@/components/form/SafeInput";
import { SafeTextarea } from "@/components/form/SafeTextarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, FileSearch, PieChart, ShieldCheck } from "lucide-react";
import { StepComponentProps } from "@/config/wizard.types";
import { NumericField } from "@/components/form/NumericField";
import { supabase } from "@/integrations/supabase/client";
import { useRapportDirection } from "@/hooks/common/useRapport";

import { useCrAnalysesPonctuelles, useCrSondagesEtudes } from "@/hooks/Creches/useCrStep4";
import { useCrControleCreches } from "@/hooks/Creches/useCrStep2";

export const Step4EtudesAnalyses = memo(
  ({ disabled, onActivity, rapportId }: StepComponentProps) => {
    const { i18n } = useTranslation();
    const isAr = i18n.language === "ar";

    const [crechesPrivees, setCrechesPrivees] = useState<any[]>([]);

    const { data: rapport } = useRapportDirection(rapportId);

    useEffect(() => {
      const fetchCreches = async () => {
        if (!rapportId) return;

        if (rapport?.direction_id) {
          const { data } = await supabase
            .from("dir_creches_privees")
            .select("*")
            .eq("direction_id", rapport.direction_id);

          if (data) setCrechesPrivees(data);
        }
      };
      void fetchCreches();
    }, [rapportId]);

    // 2. تهيئة الـ Hooks
    const {
      items: analyses,
      add: addAnalyse,
      update: updateAnalyse,
      remove: removeAnalyse,
    } = useCrAnalysesPonctuelles(rapportId || null);
    const {
      items: sondages,
      add: addSondage,
      update: updateSondage,
      remove: removeSondage,
    } = useCrSondagesEtudes(rapportId || null);
    const {
      items: controles,
      add: addControle,
      update: updateControle,
      remove: removeControle,
    } = useCrControleCreches(rapportId || null);

    // 3. Handlers
    const handleAddAnalyse = () => {
      if (!rapportId) return;
      addAnalyse({
        local_id: crypto.randomUUID(),
        sujet: "",
        nombre_beneficiaires: 0,
        explications: "",
        observations: "",
      });
      if (onActivity) void onActivity();
    };

    const handleAddSondage = () => {
      if (!rapportId) return;
      addSondage({
        local_id: crypto.randomUUID(),
        type_sondage: "",
        nombre_participants: 0,
        resultats: "",
        observations: "",
      });
      if (onActivity) void onActivity();
    };

    const handleAddControle = () => {
      if (!rapportId) return;
      addControle({
        local_id: crypto.randomUUID(),
        creche_privee_id: "",
        resultats_controle: "",
        observations: "",
      });
      if (onActivity) void onActivity();
    };

    return (
      <div className="space-y-8">
        {/* ========================================================================= */}
        {/* CARTE 1 : Analyses Approfondies (Tableau 14) */}
        {/* ========================================================================= */}
        <Card className="p-5 sm:p-6 bg-card border-border shadow-sm border-t-4 border-t-primary">
          <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-border pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FileSearch className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold">
                  {isAr
                    ? "1. تحليل معمق حول نقطة محددة عند الطلب"
                    : "1. Analyses approfondies / Rapports ponctuels"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isAr
                    ? "تقرير عن وضعية مستثمر، دراسة حالة، أنشطة استثنائية..."
                    : "Étude de cas, activités exceptionnelles..."}
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleAddAnalyse}
              disabled={disabled || !rapportId}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" /> {isAr ? "إضافة تحليل" : "Ajouter une analyse"}
            </Button>
          </div>

          <div className="space-y-3">
            {analyses.map((analyse) => (
              <div
                key={analyse.local_id}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 border border-border p-4 rounded-lg bg-muted/5 items-start"
              >
                <div className="md:col-span-11 grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-8 space-y-1.5">
                    <Label className="text-xs">{isAr ? "الموضوع" : "Sujet"}</Label>
                    <SafeInput
                      value={analyse.sujet}
                      onValueChange={(val) => {
                        updateAnalyse(analyse.local_id, { sujet: val });
                        if (onActivity) void onActivity();
                      }}
                      disabled={disabled}
                      placeholder={isAr ? "الموضوع..." : "Sujet..."}
                      className="h-9 text-xs bg-background"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <NumericField
                      label={isAr ? "عدد المستفيدين" : "Bénéficiaires"}
                      value={analyse.nombre_beneficiaires}
                      onChange={(v) => {
                        updateAnalyse(analyse.local_id, { nombre_beneficiaires: v });
                        if (onActivity) void onActivity();
                      }}
                      disabled={disabled}
                    />
                  </div>

                  <div className="md:col-span-6 space-y-1.5">
                    <Label className="text-xs">
                      {isAr ? "توضيحات في الموضوع" : "Explications"}
                    </Label>
                    <SafeTextarea
                      value={analyse.explications || ""}
                      onValueChange={(val) => {
                        updateAnalyse(analyse.local_id, { explications: val });
                        if (onActivity) void onActivity();
                      }}
                      disabled={disabled}
                      placeholder={isAr ? "توضيحات..." : "Explications..."}
                    />
                  </div>

                  <div className="md:col-span-6 space-y-1.5">
                    <Label className="text-xs">{isAr ? "ملاحظات" : "Observations"}</Label>
                    <SafeTextarea
                      value={analyse.observations || ""}
                      onValueChange={(val) => {
                        updateAnalyse(analyse.local_id, { observations: val });
                        if (onActivity) void onActivity();
                      }}
                      disabled={disabled}
                      placeholder={isAr ? "ملاحظات..." : "Observations..."}
                    />
                  </div>
                </div>
                <div className="md:col-span-1 flex justify-end">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      removeAnalyse(analyse.local_id);
                      if (onActivity) void onActivity();
                    }}
                    disabled={disabled}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {analyses.length === 0 && (
              <div className="text-center py-4 text-xs text-muted-foreground border border-dashed rounded-lg">
                {isAr ? "لا توجد تحليلات مسجلة" : "Aucune analyse enregistrée"}
              </div>
            )}
          </div>
        </Card>

        {/* ========================================================================= */}
        {/* CARTE 2 : Sondages et Études Terrain (Tableau 15) */}
        {/* ========================================================================= */}
        <Card className="p-5 sm:p-6 bg-card border-border shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-border pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <PieChart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold">
                  {isAr
                    ? "2. تقارير عن نتائج استطلاعات الرأي أو دراسات ميدانية مفاجئة"
                    : "2. Sondages et études de terrain"}
                </h2>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleAddSondage}
              disabled={disabled || !rapportId}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" /> {isAr ? "إضافة استطلاع" : "Ajouter un sondage"}
            </Button>
          </div>

          <div className="space-y-3">
            {sondages.map((sondage) => (
              <div
                key={sondage.local_id}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 border border-border p-4 rounded-lg bg-muted/5 items-start"
              >
                <div className="md:col-span-11 grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-8 space-y-1.5">
                    <Label className="text-xs">{isAr ? "نوع الاستطلاع" : "Type de sondage"}</Label>
                    <SafeInput
                      value={sondage.type_sondage}
                      onValueChange={(val) => {
                        updateSondage(sondage.local_id, { type_sondage: val });
                        if (onActivity) void onActivity();
                      }}
                      disabled={disabled}
                      placeholder={isAr ? "نوع الاستطلاع..." : "Type de sondage..."}
                      className="h-9 text-xs bg-background"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <NumericField
                      label={isAr ? "عدد المشاركين" : "Participants"}
                      value={sondage.nombre_participants}
                      onChange={(v) => {
                        updateSondage(sondage.local_id, { nombre_participants: v });
                        if (onActivity) void onActivity();
                      }}
                      disabled={disabled}
                    />
                  </div>

                  <div className="md:col-span-6 space-y-1.5">
                    <Label className="text-xs">{isAr ? "النتائج" : "Résultats"}</Label>
                    <SafeTextarea
                      value={sondage.resultats || ""}
                      onValueChange={(val) => {
                        updateSondage(sondage.local_id, { resultats: val });
                        if (onActivity) void onActivity();
                      }}
                      disabled={disabled}
                      placeholder={isAr ? "النتائج..." : "Résultats..."}
                    />
                  </div>

                  <div className="md:col-span-6 space-y-1.5">
                    <Label className="text-xs">{isAr ? "ملاحظات" : "Observations"}</Label>
                    <SafeTextarea
                      value={sondage.observations || ""}
                      onValueChange={(val) => {
                        updateSondage(sondage.local_id, { observations: val });
                        if (onActivity) void onActivity();
                      }}
                      disabled={disabled}
                      placeholder={isAr ? "ملاحظات..." : "Observations..."}
                    />
                  </div>
                </div>
                <div className="md:col-span-1 flex justify-end">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      removeSondage(sondage.local_id);
                      if (onActivity) void onActivity();
                    }}
                    disabled={disabled}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {sondages.length === 0 && (
              <div className="text-center py-4 text-xs text-muted-foreground border border-dashed rounded-lg">
                {isAr ? "لا توجد استطلاعات مسجلة" : "Aucun sondage enregistré"}
              </div>
            )}
          </div>
        </Card>

        {/* ========================================================================= */}
        {/* CARTE 3 : Contrôle des Crèches Privées (Tableau المراقبة) */}
        {/* ========================================================================= */}
        <Card className="p-5 sm:p-6 bg-card border-border shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-border pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h2 className="text-lg font-bold">
                  {isAr
                    ? "3. عدد دور الحضانة الخاصة التي تمت مراقبتها"
                    : "3. Contrôle des Crèches Privées"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isAr
                    ? "عمليات المراقبة المنجزة من طرف الأطر المحلفة"
                    : "Inspections réalisées par les cadres assermentés"}
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleAddControle}
              disabled={disabled || !rapportId}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" /> {isAr ? "إضافة عملية مراقبة" : "Ajouter un contrôle"}
            </Button>
          </div>

          <div className="space-y-3">
            {controles.map((controle) => (
              <div
                key={controle.local_id}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 border border-border p-4 rounded-lg bg-muted/5 items-start"
              >
                <div className="md:col-span-11 grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-4 space-y-1.5">
                    <Label className="text-xs">
                      {isAr ? "دار الحضانة الخاصة التي تمت مراقبتها" : "Crèche privée contrôlée"}
                    </Label>
                    <Select
                      value={controle.creche_privee_id}
                      disabled={disabled}
                      onValueChange={(v) => {
                        updateControle(controle.local_id, { creche_privee_id: v });
                        if (onActivity) void onActivity();
                      }}
                    >
                      <SelectTrigger className="h-9 text-xs bg-background">
                        <SelectValue
                          placeholder={isAr ? "اختر دار الحضانة..." : "Choisir la crèche..."}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {crechesPrivees.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nom_creche}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-4 space-y-1.5">
                    <Label className="text-xs">
                      {isAr ? "مخرجات المراقبة" : "Résultats du contrôle"}
                    </Label>
                    <SafeTextarea
                      value={controle.resultats_controle || ""}
                      onValueChange={(val) => {
                        updateControle(controle.local_id, { resultats_controle: val });
                        if (onActivity) void onActivity();
                      }}
                      disabled={disabled}
                      placeholder={
                        isAr ? "أهم التوجيهات أو الإنذارات..." : "Résultats et directives..."
                      }
                    />
                  </div>

                  <div className="md:col-span-4 space-y-1.5">
                    <Label className="text-xs">{isAr ? "ملاحظات" : "Observations"}</Label>
                    <SafeTextarea
                      value={controle.observations || ""}
                      onValueChange={(val) => {
                        updateControle(controle.local_id, { observations: val });
                        if (onActivity) void onActivity();
                      }}
                      disabled={disabled}
                      placeholder={isAr ? "ملاحظات إضافية..." : "Observations..."}
                    />
                  </div>
                </div>
                <div className="md:col-span-1 flex justify-end">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      removeControle(controle.local_id);
                      if (onActivity) void onActivity();
                    }}
                    disabled={disabled}
                    className="text-destructive mt-6"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {controles.length === 0 && (
              <div className="text-center py-4 text-xs text-muted-foreground border border-dashed border-destructive/30 rounded-lg">
                {isAr ? "لا توجد عمليات مراقبة مسجلة" : "Aucune inspection enregistrée"}
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  },
);

Step4EtudesAnalyses.displayName = "Step4EtudesAnalyses";
