import { SafeInput } from "@/components/form/SafeInput";
import { SafeTextarea } from "@/components/form/SafeTextarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StepComponentProps } from "@/config/wizard.types";
import { supabase } from "@/integrations/supabase/client"; // Nécessaire pour l'insertion directe dans la table 'etablissements'
import { Building2, Plus, Search, Trash2 } from "lucide-react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  AfMouvementEntry,
  useAfMiseAJourReseau,
} from "@/hooks/AffairesFeminines/useAfMiseAJourReseau";
import { useAfEtablissements } from "@/hooks/common/useAfEtablissements";
import { useAuth } from "@/hooks/common/useAuth";
import { useRapportDirection } from "@/hooks/common/useRapport";

export const Step6Infra = memo(({ rapportId, disabled, onActivity }: StepComponentProps) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { utilisateur } = useAuth();
  const directionId = utilisateur?.direction_id;

  const { data: rapport } = useRapportDirection(rapportId);
  const effectiveDirectionId = rapport?.direction_id || directionId;

  const { items: tousLesEtablissements, loading: loadingEtabs } =
    useAfEtablissements(effectiveDirectionId);
  const reseau = useAfMiseAJourReseau(rapportId);

  const [searchTerm, setSearchTerm] = useState("");

  // 🕒 1. SOLUTION PROPRE : Timer pour attendre la fin de la saisie avant de créer l'établissement
  const debounceTimerRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    // Nettoyage des timers lors du démontage du composant
    return () => {
      Object.values(debounceTimerRef.current).forEach(clearTimeout);
    };
  }, []);

  const combinedItems = useMemo(() => {
    const etabsDeBase = tousLesEtablissements.filter(
      (e) => e.type_etablissement === "club_feminin" || e.type_etablissement === "ofppt",
    );

    const nouveauxDansCeRapport = reseau.items.filter(
      (m) =>
        m.is_new_entry ||
        m.type_mise_a_jour === "nouvel" ||
        m.type_mise_a_jour === "creation_en_cours" ||
        !m.etablissement_id,
    );

    const nouveauxIds = new Set(
      nouveauxDansCeRapport.map((m) => m.etablissement_id).filter(Boolean),
    );
    const etabsAnciens = etabsDeBase.filter((e) => !nouveauxIds.has(e.id));

    const baseList: AfMouvementEntry[] = etabsAnciens.map((etab) => {
      const mouvementExistant = reseau.items.find((m) => m.etablissement_id === etab.id);
      if (mouvementExistant) {
        return {
          ...mouvementExistant,
          nom_etablissement: etab.nom,
          type_etablissement: etab.type_etablissement,
          is_new_entry: false,
        };
      }
      
      // Entrée par défaut pour les établissements existants
      return {
        local_id: etab.id,
        is_new_entry: false,
        etablissement_id: etab.id,
        nom_etablissement: etab.nom,
        type_etablissement: etab.type_etablissement,
        type_mise_a_jour: "sans_changement",
        statut_juridique: "",
        date_mouvement: "",
        raisons: "",
        suggestions: "",
        observations: "",
      };
    });

    const nouveauxList: AfMouvementEntry[] = nouveauxDansCeRapport.map((m) => {
      const baseEtab = etabsDeBase.find((e) => e.id === m.etablissement_id);
      return {
        ...m,
        is_new_entry: true,
        nom_etablissement: baseEtab?.nom || m.nom_etablissement || "",
        type_etablissement: baseEtab?.type_etablissement || m.type_etablissement || "club_feminin",
      };
    });

    return [...nouveauxList, ...baseList];
  }, [tousLesEtablissements, reseau.items]);

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    
    // Si la recherche est vide, on affiche tout
    if (!term) return combinedItems;

    // Recherche par nom de l'établissement
    return combinedItems.filter((item) =>
      (item.nom_etablissement || "").toLowerCase().includes(term)
    );
  }, [combinedItems, searchTerm]);

  // ACTIONS ET SYNCHRONISATION
  const handleAddMouvement = async () => {
    const newEntry: AfMouvementEntry = {
      local_id: crypto.randomUUID(),
      is_new_entry: true,
      etablissement_id: null,
      type_etablissement: "club_feminin",
      nom_etablissement: "",
      type_mise_a_jour: "nouvel",
      statut_juridique: "",
      date_mouvement: "",
      raisons: "",
      suggestions: "",
      observations: "",
    };

    // Il suffit de l'ajouter au Hook, le useMemo s'occupe du reste instantanément
    await reseau.add(newEntry);
    if (onActivity) void onActivity();
  };

  const handleUpdateMouvement = async (local_id: string, patch: Partial<AfMouvementEntry>) => {
    const existingInReseau = reseau.items.find(
      (m) => m.local_id === local_id || m.etablissement_id === local_id
    );

    const isNowSansChangement = patch.type_mise_a_jour === "sans_changement";

    if (existingInReseau) {
      if (isNowSansChangement) {
        await reseau.remove(existingInReseau.local_id);
      } else {
        // 1. Mise à jour des données dans le Hook (pour une réactivité immédiate de l'UI)
        await reseau.update(existingInReseau.local_id, patch);

        // 2. Enregistrement silencieux de l'établissement sans duplication de frappes (Debouncing)
        const isNewOrUnlinked = existingInReseau.is_new_entry || !existingInReseau.etablissement_id;
        const nameOrTypeChanged = patch.nom_etablissement !== undefined || patch.type_etablissement !== undefined;

        if (isNewOrUnlinked && nameOrTypeChanged && effectiveDirectionId) {
          const nomToSave = patch.nom_etablissement !== undefined ? patch.nom_etablissement : existingInReseau.nom_etablissement;
          const typeToSave = patch.type_etablissement !== undefined ? patch.type_etablissement : existingInReseau.type_etablissement;

          if (nomToSave && nomToSave.trim() !== "") {
            // Annulation du timer précédent si l'utilisateur continue de taper
            if (debounceTimerRef.current[local_id]) {
              clearTimeout(debounceTimerRef.current[local_id]);
            }

            // Attendre 1.2 seconde (fin de frappe) avant d'envoyer la requête à Supabase
            debounceTimerRef.current[local_id] = setTimeout(async () => {
              try {
                const { data, error } = await supabase
                  .from("etablissements")
                  .upsert({
                    ...(existingInReseau.etablissement_id ? { id: existingInReseau.etablissement_id } : {}),
                    nom: nomToSave.trim(),
                    type_etablissement: (typeToSave || "club_feminin") as any,
                    direction_id: effectiveDirectionId,
                    est_actif: true,
                  }, { onConflict: existingInReseau.etablissement_id ? "id" : "direction_id,nom" })
                  .select("id")
                  .single();

                if (data?.id && data.id !== existingInReseau.etablissement_id) {
                  // Lier le nouvel ID de l'établissement au mouvement dans le Hook
                  await reseau.update(existingInReseau.local_id, { etablissement_id: data.id });
                }
              } catch (err) {
                console.error("Erreur de synchronisation de l'établissement :", err);
              }
            }, 1200);
          }
        }
      }
    } else {
      // C'est un établissement existant dont on modifie le statut pour la première fois
      if (!isNowSansChangement) {
        const etabDeBase = tousLesEtablissements.find((e) => e.id === local_id);
        if (etabDeBase) {
          await reseau.add({
            local_id: crypto.randomUUID(),
            etablissement_id: etabDeBase.id,
            nom_etablissement: etabDeBase.nom,
            type_etablissement: etabDeBase.type_etablissement,
            type_mise_a_jour: patch.type_mise_a_jour || "fermeture_temporaire",
            statut_juridique: "",
            date_mouvement: "",
            raisons: "",
            suggestions: "",
            observations: "",
            is_new_entry: false,
            ...patch,
          });
        }
      }
    }
    if (onActivity) void onActivity();
  };

  const handleRemoveMouvement = async (local_id: string) => {
    // Recherche de l'élément réel dans le Hook pour le supprimer
    const existing = reseau.items.find(m => m.local_id === local_id || m.etablissement_id === local_id);
    if (existing) {
      await reseau.remove(existing.local_id);
    }
    if (onActivity) void onActivity();
  };

  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-6 space-y-5 bg-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isAr ? "تحيين شبكة المؤسسات" : "Mise à jour du réseau"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isAr
                  ? "تتبع حركية المؤسسات (إحداث، إغلاق، إعادة فتح)"
                  : "Suivi des mouvements d'établissements"}
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleAddMouvement}
            disabled={disabled}
            className="gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            {isAr ? "إضافة مؤسسة جديدة" : "Ajouter un nouveau centre"}
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <SafeInput
            type="text"
            placeholder={
              isAr
                ? "ابحث عن اسم المؤسسة لتغيير وضعيتها..."
                : "Rechercher un centre existant pour changer son statut..."
            }
            value={searchTerm}
            onValueChange={(val) => setSearchTerm(val)}
            className="pl-9 h-10 bg-muted/20 focus-visible:ring-primary"
          />
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/10">
            {searchTerm
              ? isAr
                ? "لا توجد مؤسسة تطابق هذا البحث"
                : "Aucun établissement ne correspond à votre recherche."
              : isAr
                ? "لا توجد مؤسسات مسجلة"
                : "Aucun établissement enregistré."}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item, idx) => (
              <div
                key={item.local_id}
                className={`border rounded-xl p-4 space-y-4 transition-colors ${item.type_mise_a_jour !== "sans_changement" ? "bg-primary/5 border-primary/30 shadow-sm" : "bg-muted/10 border-border hover:border-primary/30"}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {item.is_new_entry ? (isAr ? "مؤسسة جديدة" : "Nouveau centre") : `#${idx + 1}`}
                  </span>
                  {item.is_new_entry && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveMouvement(item.local_id)}
                      disabled={disabled}
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-semibold">
                      {isAr ? "اسم المؤسسة" : "Nom de l'établissement"}
                    </Label>
                    {item.is_new_entry ? (
                      <SafeInput
                        placeholder={
                          isAr ? "أدخل اسم المؤسسة الجديدة..." : "Tapez le nom du nouveau centre..."
                        }
                        value={item.nom_etablissement}
                        onValueChange={(val) => {
                          handleUpdateMouvement(item.local_id, { nom_etablissement: val });
                        }}
                        disabled={disabled}
                        className="h-10 bg-background"
                      />
                    ) : (
                      <div className="h-10 px-3 py-2 bg-background/50 border border-input rounded-md flex items-center text-sm font-medium text-foreground">
                        {item.nom_etablissement}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-primary">
                      {isAr ? "نوع الحركة" : "Type de mouvement"}
                    </Label>
                    <Select
                      value={item.type_mise_a_jour}
                      disabled={disabled}
                      onValueChange={(v) =>
                        handleUpdateMouvement(item.local_id, { type_mise_a_jour: v })
                      }
                    >
                      <SelectTrigger className="h-10 border-primary/30 font-medium">
                        <SelectValue placeholder={isAr ? "اختر الحركة" : "Choisir"} />
                      </SelectTrigger>
                      <SelectContent>
                        {!item.is_new_entry && (
                          <SelectItem
                            value="sans_changement"
                            className="text-muted-foreground font-medium"
                          >
                            {isAr ? "بدون تغيير (مفتوحة)" : "Sans changement (Ouverte)"}
                          </SelectItem>
                        )}
                        {!item.is_new_entry && (
                          <SelectItem value="fermeture_temporaire">
                            {isAr ? "إغلاق مؤقت" : "Fermeture temporaire"}
                          </SelectItem>
                        )}
                        {!item.is_new_entry && (
                          <SelectItem value="reouverture">
                            {isAr ? "إعادة فتح" : "Réouverture"}
                          </SelectItem>
                        )}

                        {item.is_new_entry && (
                          <SelectItem value="nouvel">
                            {isAr ? "مؤسسة محدثة" : "Nouvellement créée"}
                          </SelectItem>
                        )}
                        {item.is_new_entry && (
                          <SelectItem value="creation_en_cours">
                            {isAr ? "في طور الإحداث" : "En cours de création"}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {(item.type_mise_a_jour === "nouvel" ||
                    item.type_mise_a_jour === "creation_en_cours") && (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">
                          {isAr ? "نوع المؤسسة" : "Type d'établissement"}
                        </Label>
                        <Select
                          value={item.type_etablissement}
                          disabled={disabled}
                          onValueChange={(v) =>
                            handleUpdateMouvement(item.local_id, { type_etablissement: v })
                          }
                        >
                          <SelectTrigger className="h-10 bg-background">
                            <SelectValue placeholder={isAr ? "اختر النوع" : "Choisir le type"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="club_feminin">
                              {isAr ? "نادي نسوي" : "Club Féminin"}
                            </SelectItem>
                            <SelectItem value="ofppt">
                              {isAr ? "مكتب التكوين المهني" : "OFPPT"}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">
                          {isAr ? "الوضعية القانونية (الملكية)" : "Statut juridique"}
                        </Label>
                        <SafeInput
                          placeholder={isAr ? "ملك مخزني، كراء..." : "Ex: Propriété, Location..."}
                          value={item.statut_juridique}
                          onValueChange={(val) =>
                            handleUpdateMouvement(item.local_id, { statut_juridique: val })
                          }
                          disabled={disabled}
                          className="h-10 bg-background"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">
                          {isAr ? "تاريخ الفتح (أو المتوقع)" : "Date (Prévue ou réelle)"}
                        </Label>
                        <SafeInput
                          type="date"
                          value={item.date_mouvement}
                          onValueChange={(val) =>
                            handleUpdateMouvement(item.local_id, { date_mouvement: val })
                          }
                          disabled={disabled}
                          className="h-10 bg-background"
                        />
                      </div>
                    </>
                  )}

                  {item.type_mise_a_jour === "fermeture_temporaire" && (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">
                          {isAr ? "تاريخ الإغلاق" : "Date de fermeture"}
                        </Label>
                        <SafeInput
                          type="date"
                          value={item.date_mouvement}
                          onValueChange={(val) =>
                            handleUpdateMouvement(item.local_id, { date_mouvement: val })
                          }
                          disabled={disabled}
                          className="h-10 bg-background"
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                        <Label className="text-xs font-semibold">
                          {isAr ? "سبب الإغلاق" : "Raisons de fermeture"}
                        </Label>
                        <SafeTextarea
                          value={item.raisons}
                          onValueChange={(val) =>
                            handleUpdateMouvement(item.local_id, { raisons: val })
                          }
                          disabled={disabled}
                          placeholder={isAr ? "أسباب الإغلاق..." : "Raisons de fermeture..."}
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                        <Label className="text-xs font-semibold">
                          {isAr ? "اقتراحات" : "Suggestions"}
                        </Label>
                        <SafeTextarea
                          value={item.suggestions}
                          onValueChange={(val) =>
                            handleUpdateMouvement(item.local_id, { suggestions: val })
                          }
                          disabled={disabled}
                          placeholder={isAr ? "اقتراحات..." : "Suggestions..."}
                        />
                      </div>
                    </>
                  )}

                  {item.type_mise_a_jour === "reouverture" && (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">
                          {isAr ? "تاريخ إعادة الفتح" : "Date de réouverture"}
                        </Label>
                        <SafeInput
                          type="date"
                          value={item.date_mouvement}
                          onValueChange={(val) =>
                            handleUpdateMouvement(item.local_id, { date_mouvement: val })
                          }
                          disabled={disabled}
                          className="h-10 bg-background"
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
                        <Label className="text-xs font-semibold">
                          {isAr ? "ذكر الأسباب (أسباب إعادة الفتح)" : "Raisons de réouverture"}
                        </Label>
                        <SafeTextarea
                          value={item.raisons}
                          onValueChange={(val) =>
                            handleUpdateMouvement(item.local_id, { raisons: val })
                          }
                          disabled={disabled}
                          placeholder={isAr ? "أسباب إعادة الفتح..." : "Raisons de réouverture..."}
                        />
                      </div>
                    </>
                  )}

                  {item.type_mise_a_jour !== "sans_changement" && (
                    <div className="space-y-1.5 sm:col-span-2 lg:col-span-3 border-t border-border/50 pt-3 mt-1">
                      <Label className="text-xs font-semibold">
                        {isAr ? "ملاحظات" : "Observations"}
                      </Label>
                      <SafeTextarea
                        value={item.observations}
                        onValueChange={(val) =>
                          handleUpdateMouvement(item.local_id, { observations: val })
                        }
                        disabled={disabled}
                        placeholder={isAr ? "ملاحظات..." : "Observations..."}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
});

Step6Infra.displayName = "Step6Infra";