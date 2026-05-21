import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Plus, Trash2, ArrowDownToLine, ArrowUpFromLine,
} from 'lucide-react';
import type { MouvementAssociation } from '@/hooks/useMouvementsAssociations';
import { Card } from '@/components/ui/card';

interface MouvementsSectionProps {
  items: MouvementAssociation[];
  onAdd: (entry: MouvementAssociation) => Promise<boolean> | void;
  onUpdate: (
    local_id: string,
    patch: Partial<MouvementAssociation>
  ) => void;
  onRemove: (local_id: string) => Promise<boolean> | void;
  disabled?: boolean;
}

export const MouvementsSection = ({
  items,
  onAdd,
  onUpdate,
  onRemove,
  disabled,
}: MouvementsSectionProps) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <Card className="p-5 sm:p-6 space-y-4 bg-background">  
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-base font-semibold">
              {isAr ? 'الجمعيات (واردة / مغادرة)' : 'Associations (entrantes / sortantes)'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isAr ? 'سجل الجمعيات الواردة والمغادرة' : 'Enregistrez les associations entrantes et sortantes'}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() =>
              void onAdd({
                local_id: crypto.randomUUID(),
                nom_association: '',
                type_mouvement: 'entrante',
                date_mouvement: new Date().toISOString().split('T')[0],
              })
            }
            disabled={disabled}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            {isAr ? 'إضافة' : 'Ajouter'}
          </Button>
        </div>
        {items.length === 0 ? (
          <div className="text-center py-4 text-xs text-muted-foreground border-2 border-dashed border-border rounded-lg">
            {isAr ? 'لا توجد حركات مسجلة' : 'Aucun mouvement enregistré'}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((m, idx) => (
              <div
                key={m.local_id}
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
                    onClick={() => void onRemove(m.local_id)}
                    disabled={disabled}
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-5 space-y-1.5">
                  <Label className="text-xs">{isAr ? 'الاسم' : 'Nom'}</Label>
                  <Input
                    value={m.nom_association}
                    className="h-9"
                    disabled={disabled}
                    onChange={(e) =>
                      onUpdate(m.local_id, {
                        nom_association: e.target.value.slice(0, 200),
                      })
                    }
                  />
                </div>
                <div className="sm:col-span-3 space-y-1.5">
                  <Label className="text-xs">{isAr ? 'النوع' : 'Type'}</Label>
                  <Select
                    value={m.type_mouvement || 'entrante'}
                    onValueChange={(v) =>
                      onUpdate(m.local_id, {
                        type_mouvement: v as 'entrante' | 'sortante',
                      })
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrante">
                        <span className="inline-flex items-center gap-1.5">
                          <ArrowDownToLine className="h-3.5 w-3.5" />
                          {isAr ? 'واردة' : 'Entrante'}
                        </span>
                      </SelectItem>
                      <SelectItem value="sortante">
                        <span className="inline-flex items-center gap-1.5">
                          <ArrowUpFromLine className="h-3.5 w-3.5" />
                          {isAr ? 'مغادرة' : 'Sortante'}
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-3 space-y-1.5">
                  <Label className="text-xs">{isAr ? 'التاريخ' : 'Date'}</Label>
                  <Input
                    type="date"
                    value={m.date_mouvement}
                    className="h-9"
                    disabled={disabled}
                    onChange={(e) =>
                      onUpdate(m.local_id, { date_mouvement: e.target.value })
                    }
                  />
                </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
