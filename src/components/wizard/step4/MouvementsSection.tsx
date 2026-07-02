import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { format } from "date-fns";
import { ar, fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ArrowDownToLine, ArrowUpFromLine,CalendarIcon } from 'lucide-react';
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
              {isAr ? 'سجل الجمعيات الواردة والمغادرة والمستفيدين منها' : 'Enregistrez les mouvements et le nombre de bénéficiaires'}
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
                beneficiaires: '', // 💡 Initialisation du nouveau champ
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

                {/*  Réajustement des colonnes (4 + 3 + 3 + 2 = 12) pour intégrer les bénéficiaires */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  
                  {/* Champ Nom */}
                  <div className="sm:col-span-4 space-y-1.5">
                    <Label className="text-xs">{isAr ? 'الاسم' : 'Nom'}</Label>
                    <Input
                      value={m.nom_association}
                      className="h-9"
                      disabled={disabled}
                      placeholder={isAr ? 'اسم الجمعية...' : 'Nom de l\'association...'}
                      onChange={(e) =>
                        onUpdate(m.local_id, {
                          nom_association: e.target.value.slice(0, 200),
                        })
                      }
                    />
                  </div>

                  {/* Champ Type */}
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
                            {isAr ? 'واردة (جديدة)' : 'Entrante (Nouvelle)'}
                          </span>
                        </SelectItem>
                        <SelectItem value="sortante">
                          <span className="inline-flex items-center gap-1.5">
                            <ArrowUpFromLine className="h-3.5 w-3.5" />
                            {isAr ? 'مغادرة (منسحبة)' : 'Sortante (Retrait)'}
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs">{isAr ? 'المستفيدين' : 'Bénéficiaires'}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={m.beneficiaires}
                      className="h-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" // Masque les flèches pour un style plus "tech clean"
                      placeholder="0"
                      disabled={disabled}
                      onKeyDown={(e) => {
                        if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, ''); // Ne garde QUE les chiffres
                        onUpdate(m.local_id, { 
                          beneficiaires: val === '' ? '' : Number(val) 
                        });
                      }}
                    />
                  </div>
                  {/* Champ Date (Custom DatePicker) */}
                <div className="sm:col-span-3 space-y-1.5">
                  <Label className="text-xs">{isAr ? 'التاريخ' : 'Date'}</Label>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full h-9 justify-start text-left font-normal",
                          !m.date_mouvement && "text-muted-foreground",
                          isAr && "text-right flex-row-reverse"
                        )}
                        disabled={disabled}
                      >
                        <CalendarIcon className={cn("h-4 w-4", isAr ? "ml-2" : "mr-2")} />
                        {m.date_mouvement ? (
                          format(new Date(m.date_mouvement), "PPP", { locale: isAr ? ar : fr })
                        ) : (
                          <span>{isAr ? "اختر التاريخ" : "Sélectionner une date"}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    
                    <PopoverContent className="w-auto p-0" align={isAr ? "end" : "start"}>
                      <Calendar
                        mode="single"
                        selected={m.date_mouvement ? new Date(m.date_mouvement) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const dateString = format(date, "yyyy-MM-dd");
                            onUpdate(m.local_id, { date_mouvement: dateString });
                          }
                        }}
                        initialFocus
                        locale={isAr ? ar : fr} 
                        dir={isAr ? "rtl" : "ltr"}
                      />
                    </PopoverContent>
                  </Popover>
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
