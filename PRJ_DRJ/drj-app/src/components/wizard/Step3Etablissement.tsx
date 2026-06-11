import { memo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTypesFermeture } from '@/hooks/useTypesFermeture';
import { Plus, Trash2, Building2 } from 'lucide-react';

export interface FacilityEntry {
  local_id: string;
  id?: string;
  name: string;
  project_status: string;
  other_status: string;
  closure_status: string;
}

const PROJECT_STATUS_FR = [
  { v: 'nouvel', l: 'Nouvellement créée' },
  { v: 'en_cours', l: 'En cours de réalisation' },
  { v: 'ferme', l: 'Fermée' },
];

const PROJECT_STATUS_AR = [
  { v: 'nouvel', l: 'حديثة الإنشاء' },
  { v: 'en_cours', l: 'قيد الإنجاز' },
  { v: 'ferme', l: 'مغلقة' },
];


interface Props {
  items: FacilityEntry[];

  onAdd: (item: FacilityEntry) => void | Promise<void>;

  onUpdate: (
    local_id: string,
    patch: Partial<FacilityEntry>
  ) => void | Promise<void>;

  onRemove: (local_id: string) => void | Promise<void>;

  disabled?: boolean;
}


export const Step3Etablissement = memo(({
  items,
  onAdd,
  onUpdate,
  onRemove,
  disabled,
}: Props) => {
  const { i18n } = useTranslation();

  const isAr = i18n.language === 'ar';

  const projectStatuses = isAr
    ? PROJECT_STATUS_AR
    : PROJECT_STATUS_FR;

  const { items: fermetureTypes } = useTypesFermeture();

    useEffect(() => {
    console.log('Step3Etablissement MOUNT');

    return () => {
      console.log('Step3Etablissement UNMOUNT');
    };
  }, []);

  console.count('Step3Etablissement render');
  
  const otherStatuses =
    fermetureTypes?.map((t) => ({ v: t.id, l: t.nom }))
    ?? [];

  return (
    <Card className="p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {isAr
              ? 'وضعية مؤسسات الشباب'
              : 'État des établissements de jeunesse'}
          </h2>

          <p className="text-sm text-muted-foreground">
            {isAr
              ? 'أضف كل مؤسسة على حدة'
              : 'Ajoutez chaque établissement'}
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          disabled={disabled}
          className="gap-1.5"
          onClick={() =>
            void onAdd({
              local_id: crypto.randomUUID(),
              name: '',
              project_status: '',
              other_status: '',
              closure_status: '',
            })
          }
        >
          <Plus className="h-4 w-4" />
          {isAr ? 'إضافة' : 'Ajouter'}
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border rounded-lg">
          {isAr
            ? 'لا توجد مؤسسات مسجلة'
            : 'Aucun établissement enregistré'}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it, idx) => (
              <div
                key={it.local_id}
                className="border border-border rounded-lg p-4 bg-muted/20 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    #{idx + 1}
                  </span>

                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={disabled}
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => void onRemove(it.local_id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs">
                      {isAr
                        ? 'اسم المؤسسة'
                        : "Nom de l'établissement"}
                    </Label>

                    <Input
                      value={it.name}
                      disabled={disabled}
                      className="h-9"
                      maxLength={200}
                      onChange={(e) =>
                        void onUpdate(it.local_id, {
                          name: e.target.value.slice(0, 200),
                        })
                      }
                    />
                  </div>

                  <div
                    className={`space-y-1.5 ${
                      it.project_status !== 'ferme'
                        ? 'sm:col-span-2'
                        : ''
                    }`}
                  >
                    <Label className="text-xs">
                      {isAr
                        ? 'حالة المؤسسة'
                        : "Statut de l'établissement"}
                    </Label>

                    <Select
                      value={it.project_status ?? ''}
                      disabled={disabled}
                      onValueChange={(v) => {
                        if (v !== 'ferme') {
                          void onUpdate(it.local_id, {
                            project_status: v,
                            other_status: '',
                            closure_status: '',
                          });
                        } else {
                          void onUpdate(it.local_id, {
                            project_status: v,
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue
                          placeholder={
                            isAr ? 'اختر' : 'Choisir'
                          }
                        />
                      </SelectTrigger>

                      <SelectContent>
                        {projectStatuses.map((s) => (
                          <SelectItem
                            key={s.v}
                            value={s.v}
                          >
                            {s.l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {it.project_status === 'ferme' && (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          {isAr
                            ? 'سبب الإغلاق'
                            : 'Cause de fermeture'}
                        </Label>

                        <Select
                          value={it.other_status ?? ''}
                          disabled={disabled}
                          onValueChange={(v) =>
                            void onUpdate(it.local_id, {
                              other_status: v,
                            })
                          }
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue
                              placeholder={
                                isAr
                                  ? 'اختر السبب'
                                  : 'Choisir la cause'
                              }
                            />
                          </SelectTrigger>

                          <SelectContent>
                            {otherStatuses.map((s) => (
                              <SelectItem
                                key={s.v}
                                value={s.v}
                              >
                                {s.l}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </Card>
  );
});

Step3Etablissement.displayName = 'Step3Etablissement';