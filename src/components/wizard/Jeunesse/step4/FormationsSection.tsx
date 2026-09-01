import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { NumericField } from "@/components/form/NumericField";
import { useAfEtablissements } from "@/hooks/common/useAfEtablissements";
import { useAuth } from "@/hooks/common/useAuth";
import type { FormationEntry } from "@/hooks/Jeunesse/useFormationEntries";

interface FormationsSectionProps {
  items: FormationEntry[];
  onAdd: (entry: FormationEntry) => Promise<boolean> | void;
  onUpdate: (local_id: string, patch: Partial<FormationEntry>) => void;
  onRemove: (local_id: string) => Promise<boolean> | void;
  disabled?: boolean;
}

export const FormationsSection = ({
  items,
  onAdd,
  onUpdate,
  onRemove,
  disabled,
}: FormationsSectionProps) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  // Récupération des établissements selon la direction de l'utilisateur
  const { utilisateur } = useAuth();
  const directionId = utilisateur?.direction_id;
  const {
    items: etablissements,
    typesDisponibles,
    loading: loadingEtab,
  } = useAfEtablissements(directionId);

  return (
    <Card className="p-5 sm:p-6 space-y-4 bg-background">
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-base font-semibold">
              {isAr ? "التكوينات المنجزة" : "Formations réalisées"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isAr
                ? "سجل التكوينات المنجزة مع التفاصيل"
                : "Enregistrez les formations réalisées avec les détails"}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() =>
              void onAdd({
                local_id: crypto.randomUUID(),
                numero_session: 1,
                type_filtre: "", // Initialisation du champ de filtrage
                centre: "", // Stockera l'UUID de l'établissement
                beneficiaries_girls: 0,
                beneficiaries_boys: 0,
                trainers_girls: 0,
                trainers_boys: 0,
              })
            }
            disabled={disabled || loadingEtab}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            {isAr ? "إضافة تكوين" : "Ajouter une formation"}
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-4 text-xs text-muted-foreground border-2 border-dashed border-border rounded-lg">
            {isAr ? "لا توجد تكوينات" : "Aucune formation enregistrée"}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((fr, idx) => {
              // Logique de filtrage des établissements
              const typeFiltreActuel =
                fr.type_filtre ||
                etablissements.find((e) => e.id === fr.centre)?.type_etablissement ||
                "";

              const filteredEtablissements = etablissements.filter(
                (e) => e.type_etablissement === typeFiltreActuel,
              );

              return (
                <div
                  key={fr.local_id}
                  className="border border-border rounded-lg p-4 bg-muted/20 space-y-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">#{idx + 1}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => void onRemove(fr.local_id)}
                      disabled={disabled}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Ligne 1 : N° Session, Type d'établissement, Centre */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <NumericField
                        label={isAr ? "رقم الدورة" : "Numéro de session"}
                        value={fr.numero_session}
                        onChange={(v) => onUpdate(fr.local_id, { numero_session: v })}
                        disabled={disabled}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">
                        {isAr ? "نوع المؤسسة" : "Type d'établissement"}
                      </Label>
                      <Select
                        value={typeFiltreActuel}
                        disabled={disabled}
                        onValueChange={(v) => onUpdate(fr.local_id, { type_filtre: v, centre: "" })}
                      >
                        <SelectTrigger className="h-9 bg-background">
                          <SelectValue
                            placeholder={isAr ? "اختر نوع المؤسسة" : "Choisir le type"}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {typesDisponibles.map((typeVal) => (
                            <SelectItem key={typeVal} value={typeVal}>
                              {t(`etablissements.types.${typeVal}`, { defaultValue: typeVal })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">
                        {isAr ? "المركز / المؤسسة" : "Centre / Établissement"}
                      </Label>
                      <Select
                        value={fr.centre}
                        disabled={disabled || loadingEtab || !typeFiltreActuel}
                        onValueChange={(v) => onUpdate(fr.local_id, { centre: v })}
                      >
                        <SelectTrigger className="h-9 bg-background">
                          <SelectValue
                            placeholder={isAr ? "اختر المؤسسة" : "Choisir l'établissement"}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredEtablissements.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground text-center">
                              {!typeFiltreActuel
                                ? isAr
                                  ? "اختر نوع المؤسسة أولاً"
                                  : "Choisir d'abord un type"
                                : isAr
                                  ? "لا توجد مؤسسات"
                                  : "Aucun établissement"}
                            </div>
                          ) : (
                            filteredEtablissements.map((etab) => (
                              <SelectItem key={etab.id} value={etab.id}>
                                {etab.nom}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Ligne 2 : Données statistiques */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border/50">
                    <NumericField
                      label={isAr ? "مستفيدات (فتيات)" : "Bénéficiaires (Filles)"}
                      value={fr.beneficiaries_girls}
                      onChange={(v) => onUpdate(fr.local_id, { beneficiaries_girls: v })}
                      disabled={disabled}
                    />
                    <NumericField
                      label={isAr ? "مستفيدون (فتيان)" : "Bénéficiaires (Garçons)"}
                      value={fr.beneficiaries_boys}
                      onChange={(v) => onUpdate(fr.local_id, { beneficiaries_boys: v })}
                      disabled={disabled}
                    />
                    <NumericField
                      label={isAr ? "مكوّنات (فتيات)" : "Formatrices (Filles)"}
                      value={fr.trainers_girls}
                      onChange={(v) => onUpdate(fr.local_id, { trainers_girls: v })}
                      disabled={disabled}
                    />
                    <NumericField
                      label={isAr ? "مكوّنون (فتيان)" : "Formateurs (Garçons)"}
                      value={fr.trainers_boys}
                      onChange={(v) => onUpdate(fr.local_id, { trainers_boys: v })}
                      disabled={disabled}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};
