import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SafeInput } from "@/components/form/SafeInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Wallet } from "lucide-react";
import { StepComponentProps } from "@/config/wizard.types";
import { NumericField } from "@/components/form/NumericField";
import { useInfraDepenses } from "@/hooks/Infrastructure/useInfraDepenses";

export const Step1Depenses = memo(
  ({ disabled, onActivity, rapportId }: StepComponentProps & { rapportId?: string | null }) => {
    const { i18n } = useTranslation();
    const isAr = i18n.language === "ar";

    // Liaison avec le Hook
    const {
      items,
      add: addEntry,
      remove: removeEntry,
      update: updateEntry,
      loading,
    } = useInfraDepenses(rapportId || null);

    const handleAdd = () => {
      void addEntry({
        local_id: crypto.randomUUID(),
        type_depense: "fonctionnement",
        projet_budgetaire: "",
        credits_ouverts: 0,
        credits_engages: 0,
        credits_payes: 0,
      });
      if (onActivity) void onActivity();
    };

    const handleRemove = (local_id: string) => {
      void removeEntry(local_id);
      if (onActivity) void onActivity();
    };

    const handleUpdate = (local_id: string, patch: Partial<any>) => {
      void updateEntry(local_id, patch);
      if (onActivity) void onActivity();
    };

    return (
      <div className="space-y-5">
        <Card className="p-5 sm:p-6 space-y-5 bg-card">
          {/* EN-TÊTE */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold">
                  {isAr
                    ? "نفقات التسيير والاستثمار"
                    : "Dépenses de Fonctionnement et Investissement"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isAr
                    ? "تدبير الاعتمادات المالية والمشاريع الميزانياتية"
                    : "Gestion des crédits financiers par projet budgétaire"}
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleAdd}
              disabled={disabled || loading}
              className="gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              {isAr ? "إضافة نفقة" : "Ajouter une dépense"}
            </Button>
          </div>

          {/* LISTE DES DÉPENSES */}
          {loading ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              {isAr ? "جاري التحميل..." : "Chargement..."}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/10">
              {isAr ? "لا توجد نفقات مسجلة" : "Aucune dépense enregistrée."}
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {items.map((item, idx) => (
                <div
                  key={item.local_id}
                  className="border border-border rounded-xl p-4 bg-muted/5 space-y-4 transition-colors hover:border-primary/30"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-muted-foreground">#{idx + 1}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemove(item.local_id)}
                      disabled={disabled}
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">
                        {isAr ? "نوع النفقة" : "Type de dépense"}
                      </Label>
                      <Select
                        value={item.type_depense}
                        disabled={disabled}
                        onValueChange={(v) => handleUpdate(item.local_id, { type_depense: v })}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder={isAr ? "اختر النوع" : "Choisir"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fonctionnement">
                            {isAr ? "نفقات التسيير" : "Fonctionnement"}
                          </SelectItem>
                          <SelectItem value="investissement">
                            {isAr ? "نفقات الاستثمار" : "Investissement"}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <Label className="text-xs font-semibold">
                        {isAr ? "المشروع الميزانياتي / البيان" : "Projet budgétaire / Description"}
                      </Label>
                      <SafeInput
                        placeholder={
                          isAr ? "مثال: 800، 801، شراء أدوات..." : "Ex: 800, Achat de matériel..."
                        }
                        value={item.projet_budgetaire}
                        onValueChange={(val) =>
                          handleUpdate(item.local_id, { projet_budgetaire: val })
                        }
                        disabled={disabled}
                        className="h-10 bg-background"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-border/50 pt-4">
                    <div className="space-y-1.5">
                      <NumericField
                        label={isAr ? "الاعتمادات المفتوحة (درهم)" : "Crédits Ouverts (DH)"}
                        value={item.credits_ouverts || 0}
                        onChange={(val) => handleUpdate(item.local_id, { credits_ouverts: val })}
                        disabled={disabled}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <NumericField
                        label={isAr ? "الاعتمادات الملتزم بها (درهم)" : "Crédits Engagés (DH)"}
                        value={item.credits_engages || 0}
                        onChange={(val) => handleUpdate(item.local_id, { credits_engages: val })}
                        disabled={disabled}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <NumericField
                        label={isAr ? "الاعتمادات المؤداة (درهم)" : "Crédits Payés (DH)"}
                        value={item.credits_payes || 0}
                        onChange={(val) => handleUpdate(item.local_id, { credits_payes: val })}
                        disabled={disabled}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  },
);

Step1Depenses.displayName = "Step1Depenses";
