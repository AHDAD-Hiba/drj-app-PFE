import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SafeInput } from '@/components/form/SafeInput';
import { SafeTextarea } from '@/components/form/SafeTextarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, AlertOctagon } from 'lucide-react';
import { StepComponentProps } from '@/config/wizard.types';

import { useAfEtablissements } from '@/hooks/common/useAfEtablissements';
import { useAuth } from '@/hooks/common/useAuth';
import { useInfraProjetsSouffrance } from '@/hooks/Infrastructure/useInfraProjetsSouffrance';

export const Step5ProjetsEnSouffrance = memo(({ disabled, onActivity, rapportId }: StepComponentProps & { rapportId?: string | null }) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  
  const { utilisateur } = useAuth();
  const directionId = utilisateur?.direction_id;
  
  const { items: etablissements, typesDisponibles, loading: loadingEtab } = useAfEtablissements(directionId);
  const { items: projets, add: addEntry, remove: removeEntry, update: updateEntry, loading } = useInfraProjetsSouffrance(rapportId || null);

  const addProjet = () => {
    void addEntry({
      local_id: crypto.randomUUID(),
      id: undefined as any,
      type_filtre: '',
      etablissement_id: '',
      causes_blocage: '',
      solutions_proposees: '',
      observations: ''
    });
    if (onActivity) void onActivity();
  };

  const removeProjet = (id: string) => {
    void removeEntry(id);
    if (onActivity) void onActivity();
  };

  const updateProjet = (id: string, data: any) => {
    const patch = { ...data };
    if (patch.type_filtre) {
      patch.etablissement_id = '';
    }
    void updateEntry(id, patch);
    if (onActivity) void onActivity();
  };

  return (
    <Card className="p-5 sm:p-6 space-y-4 bg-background">
      {/* HEADER DE L'ÉTAPE */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertOctagon className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h3 className="text-base font-semibold">
              {isAr ? 'المشاريع المتعثرة' : 'Projets en Souffrance'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isAr ? 'تتبع المشاريع المتوقفة وتحديد أسباب التعثر والحلول' : 'Suivi des projets bloqués, causes et solutions proposées'}
            </p>
          </div>
        </div>
        <Button
          type="button" size="sm" onClick={addProjet}
          disabled={disabled || loadingEtab || loading || !directionId}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          {isAr ? 'إضافة مشروع متعثر' : 'Ajouter un projet'}
        </Button>
      </div>

      {/* GESTION DE CHARGEMENT */}
      {loading ? (
        <div className="text-center py-10 text-sm text-muted-foreground">
          {isAr ? 'جاري التحميل...' : 'Chargement...'}
        </div>
      ) : projets.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border rounded-lg bg-muted/5">
          {isAr ? 'لم يتم تسجيل أي مشروع متعثر' : 'Aucun projet en souffrance enregistré'}
        </div>
      ) : (
        <div className="space-y-4 pt-2">
          {projets.map((proj, pIdx) => {
            
            const typeFiltreActuel = 
              proj.type_filtre || 
              etablissements.find(e => e.id === proj.etablissement_id)?.type_etablissement || 
              '';

            const filteredEtablissements = typeFiltreActuel 
              ? etablissements.filter(e => e.type_etablissement === typeFiltreActuel)
              : [];

            return (
              <div
                key={proj.local_id}
                className="border border-border rounded-lg p-4 bg-muted/20 space-y-4 transition-colors hover:border-destructive/30"
              >
                {/* EN-TÊTE DU PROJET */}
                <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-3">
                  <span className="text-xs font-bold text-foreground bg-background border shadow-sm px-2 py-1 rounded-md">
                    {isAr ? `المشروع #${pIdx + 1}` : `Projet #${pIdx + 1}`}
                  </span>
                  <Button
                    type="button" size="icon" variant="ghost" onClick={() => removeProjet(proj.local_id)}
                    disabled={disabled} className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* ROW 1: Type d'établissement & Nom de l'établissement */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      {isAr ? 'نوع المؤسسة' : "Type d'établissement"}
                    </Label>
                    <Select
                      value={typeFiltreActuel}
                      disabled={disabled}
                      onValueChange={(v) => updateProjet(proj.local_id, { type_filtre: v })}
                    >
                      <SelectTrigger className="h-9 bg-background">
                        <SelectValue placeholder={isAr ? 'اختر النوع' : 'Choisir le type'} />
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
                    <Label className="text-xs font-medium">
                      {isAr ? 'اسم المؤسسة' : "Nom de l'établissement"}
                    </Label>
                    <Select
                      value={proj.etablissement_id}
                      disabled={disabled || !typeFiltreActuel}
                      onValueChange={(v) => updateProjet(proj.local_id, { etablissement_id: v })}
                    >
                      <SelectTrigger className="h-9 bg-background border-destructive/20 focus:ring-destructive">
                        <SelectValue placeholder={isAr ? 'اختر المؤسسة' : 'Choisir l\'établissement'} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredEtablissements.length === 0 ? (
                          <div className="p-2 text-xs text-muted-foreground text-center">
                            {!typeFiltreActuel 
                              ? (isAr ? 'اختر نوع المؤسسة أولاً' : 'Choisir d\'abord un type')
                              : (isAr ? 'لا توجد مؤسسات من هذا النوع' : 'Aucun établissement')}
                          </div>
                        ) : (
                          filteredEtablissements.map((e) => (
                            <SelectItem key={e.id} value={e.id}>
                              {e.nom}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* ROW 2: Causes de blocage & Solutions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border/40 pt-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      {isAr ? 'أسباب تعثر المشروع' : 'Causes de blocage'}
                    </Label>
                    <SafeInput
                      placeholder={isAr ? 'اذكر الأسباب...' : 'Causes...'}
                      value={proj.causes_blocage}
                      onValueChange={(val) => updateProjet(proj.local_id, { causes_blocage: val })}
                      disabled={disabled} className="h-9 bg-background"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      {isAr ? 'الحلول المقترحة' : 'Solutions proposées'}
                    </Label>
                    <SafeInput
                      placeholder={isAr ? 'الحلول...' : 'Solutions...'}
                      value={proj.solutions_proposees}
                      onValueChange={(val) => updateProjet(proj.local_id, { solutions_proposees: val })}
                      disabled={disabled} className="h-9 bg-background"
                    />
                  </div>
                </div>

                {/* ROW 3: Observations */}
                <div className="pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      {isAr ? 'ملاحظات' : 'Observations'}
                    </Label>
                    <SafeTextarea
                      placeholder={isAr ? 'أضف ملاحظات (اختياري)...' : 'Ajouter des observations...'}
                      value={proj.observations || ''}
                      onValueChange={(val) => updateProjet(proj.local_id, { observations: val })}
                      disabled={disabled}
                    />
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
});

Step5ProjetsEnSouffrance.displayName = 'Step5ProjetsEnSouffrance';