import { memo, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Building2, Search } from 'lucide-react';
import { StepComponentProps } from '@/config/wizard.types';

export const Step6Infra = memo(({ rapportId, disabled, onActivity }: StepComponentProps) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  // ==========================================
  // ÉTATS LOCAUX (SIMULATION DU HOOK AF)
  // ==========================================
  const [mouvements, setMouvements] = useState<any[]>([
    { 
      local_id: crypto.randomUUID(), 
      is_new_entry: false, 
      etablissement_id: 'etab_1', 
      nom_etablissement: isAr ? 'النادي النسوي درب القاضي' : 'Foyer Féminin Derb El Kadi', 
      type_mise_a_jour: 'sans_changement', 
      statut_juridique: '', date_mouvement: '', raisons: '', suggestions: '', observations: '' 
    },
    { 
      local_id: crypto.randomUUID(), 
      is_new_entry: false, 
      etablissement_id: 'etab_2', 
      nom_etablissement: isAr ? 'مركز التأهيل حي عادل' : 'Centre de Qualification Hay Adel', 
      type_mise_a_jour: 'sans_changement', 
      statut_juridique: '', date_mouvement: '', raisons: '', suggestions: '', observations: '' 
    }
  ]);

  // ==========================================
  // BARRE DE RECHERCHE
  // ==========================================
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    return mouvements.filter((item) =>
      item.is_new_entry || item.nom_etablissement?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [mouvements, searchTerm]);

  // ==========================================
  // ACTIONS
  // ==========================================
  const handleAddMouvement = () => {
    setMouvements(prev => [
      { 
        local_id: crypto.randomUUID(), 
        is_new_entry: true, 
        etablissement_id: '', 
        nom_etablissement: '', 
        type_mise_a_jour: 'nouvel', 
        statut_juridique: '', 
        date_mouvement: '', 
        raisons: '', 
        suggestions: '', 
        observations: '' 
      },
      ...prev
    ]);
    if (onActivity) onActivity();
  };

  const handleUpdateMouvement = (local_id: string, patch: any) => {
    setMouvements(prev => prev.map(m => m.local_id === local_id ? { ...m, ...patch } : m));
    if (onActivity) onActivity();
  };

  const handleRemoveMouvement = (local_id: string) => {
    setMouvements(prev => prev.filter(m => m.local_id !== local_id));
    if (onActivity) onActivity();
  };

  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-6 space-y-5 bg-card">
        
        {/* EN-TÊTE */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{isAr ? 'تحيين شبكة المؤسسات' : 'Mise à jour du réseau'}</h2>
              <p className="text-sm text-muted-foreground">{isAr ? 'تتبع حركية المؤسسات (إحداث، إغلاق، إعادة فتح)' : 'Suivi des mouvements d\'établissements'}</p>
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleAddMouvement} disabled={disabled} className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            {isAr ? 'إضافة مؤسسة جديدة' : 'Ajouter un nouveau centre'}
          </Button>
        </div>

        {/* 🔍 BARRE DE RECHERCHE */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={isAr ? 'ابحث عن اسم المؤسسة لتغيير وضعيتها...' : 'Rechercher un centre existant pour changer son statut...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 bg-muted/20 focus-visible:ring-primary"
          />
        </div>

        {/* LISTE DES ÉTABLISSEMENTS */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/10">
            {searchTerm 
              ? (isAr ? 'لا توجد مؤسسة تطابق هذا البحث' : 'Aucun établissement ne correspond à votre recherche.')
              : (isAr ? 'لا توجد مؤسسات مسجلة' : 'Aucun établissement enregistré.')}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item, idx) => (
              <div 
                key={item.local_id} 
                className="border border-border rounded-xl p-4 bg-muted/10 space-y-4 transition-colors hover:border-primary/30"
              >
                
                {/* En-tête de la carte */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {item.is_new_entry ? (isAr ? 'مؤسسة جديدة' : 'Nouveau centre') : `#${idx + 1}`}
                  </span>
                  {item.is_new_entry && (
                    <Button type="button" size="icon" variant="ghost" onClick={() => handleRemoveMouvement(item.local_id)} disabled={disabled} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  
                  {/* 1. Nom du bâtiment */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-semibold">{isAr ? 'اسم المؤسسة' : "Nom de l'établissement"}</Label>
                    {item.is_new_entry ? (
                      <Input 
                        placeholder={isAr ? 'أدخل اسم المؤسسة الجديدة...' : 'Tapez le nom du nouveau centre...'}
                        value={item.nom_etablissement} 
                        onChange={e => handleUpdateMouvement(item.local_id, { nom_etablissement: e.target.value })} 
                        disabled={disabled} 
                        className="h-10 bg-background" 
                      />
                    ) : (
                      <div className="h-10 px-3 py-2 bg-background/50 border border-input rounded-md flex items-center text-sm font-medium text-foreground">
                        {item.nom_etablissement}
                      </div>
                    )}
                  </div>

                  {/* 2. Sélecteur de Mouvement */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-primary">{isAr ? 'نوع الحركة' : "Type de mouvement"}</Label>
                    <Select 
                      value={item.type_mise_a_jour} 
                      disabled={disabled}
                      onValueChange={(v) => handleUpdateMouvement(item.local_id, { type_mise_a_jour: v })}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder={isAr ? 'اختر الحركة' : 'Choisir'} />
                      </SelectTrigger>
                      <SelectContent>
                        {!item.is_new_entry && (
                          <SelectItem value="sans_changement" className="text-muted-foreground font-medium">
                            {isAr ? 'بدون تغيير (مفتوحة)' : 'Sans changement (Ouverte)'}
                          </SelectItem>
                        )}
                        {!item.is_new_entry && <SelectItem value="fermeture_temporaire">{isAr ? 'إغلاق مؤقت' : 'Fermeture temporaire'}</SelectItem>}
                        {!item.is_new_entry && <SelectItem value="reouverture">{isAr ? 'إعادة فتح' : 'Réouverture'}</SelectItem>}

                        {item.is_new_entry && <SelectItem value="nouvel">{isAr ? 'مؤسسة محدثة' : 'Nouvellement créée'}</SelectItem>}
                        {item.is_new_entry && <SelectItem value="creation_en_cours">{isAr ? 'في طور الإحداث' : 'En cours de création'}</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* ========================================================= */}
                  {/* CHAMPS DYNAMIQUES SELON LE TYPE DE MOUVEMENT              */}
                  {/* ========================================================= */}

                  {/* SI NOUVELLE OU EN CRÉATION */}
                  {(item.type_mise_a_jour === 'nouvel' || item.type_mise_a_jour === 'creation_en_cours') && (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">{isAr ? 'الوضعية القانونية (الملكية)' : 'Statut juridique'}</Label>
                        <Input placeholder={isAr ? 'ملك مخزني، كراء...' : 'Ex: Propriété, Location...'} value={item.statut_juridique} onChange={e => handleUpdateMouvement(item.local_id, { statut_juridique: e.target.value })} disabled={disabled} className="h-10 bg-background" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">{isAr ? 'تاريخ الفتح (أو المتوقع)' : 'Date (Prévue ou réelle)'}</Label>
                        <Input type="date" value={item.date_mouvement} onChange={e => handleUpdateMouvement(item.local_id, { date_mouvement: e.target.value })} disabled={disabled} className="h-10 bg-background" />
                      </div>
                    </>
                  )}

                  {/* SI FERMETURE TEMPORAIRE */}
                  {item.type_mise_a_jour === 'fermeture_temporaire' && (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">{isAr ? 'تاريخ الإغلاق' : 'Date de fermeture'}</Label>
                        <Input type="date" value={item.date_mouvement} onChange={e => handleUpdateMouvement(item.local_id, { date_mouvement: e.target.value })} disabled={disabled} className="h-10 bg-background" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">{isAr ? 'سبب الإغلاق' : 'Raisons de fermeture'}</Label>
                        <Input value={item.raisons} onChange={e => handleUpdateMouvement(item.local_id, { raisons: e.target.value })} disabled={disabled} className="h-10 bg-background" />
                      </div>
                      <div className="space-y-1.5 lg:col-span-1">
                        <Label className="text-xs font-semibold">{isAr ? 'اقتراحات' : 'Suggestions'}</Label>
                        <Input value={item.suggestions} onChange={e => handleUpdateMouvement(item.local_id, { suggestions: e.target.value })} disabled={disabled} className="h-10 bg-background" />
                      </div>
                    </>
                  )}

                  {/* SI RÉOUVERTURE */}
                  {item.type_mise_a_jour === 'reouverture' && (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">{isAr ? 'تاريخ إعادة الفتح' : 'Date de réouverture'}</Label>
                        <Input type="date" value={item.date_mouvement} onChange={e => handleUpdateMouvement(item.local_id, { date_mouvement: e.target.value })} disabled={disabled} className="h-10 bg-background" />
                      </div>
                      <div className="space-y-1.5 lg:col-span-2">
                        <Label className="text-xs font-semibold">{isAr ? 'ذكر الأسباب (أسباب إعادة الفتح)' : 'Raisons de réouverture'}</Label>
                        <Input value={item.raisons} onChange={e => handleUpdateMouvement(item.local_id, { raisons: e.target.value })} disabled={disabled} className="h-10 bg-background" />
                      </div>
                    </>
                  )}

                  {/* OBSERVATIONS (Toujours visible si statut modifié) */}
                  {item.type_mise_a_jour !== 'sans_changement' && (
                    <div className="space-y-1.5 sm:col-span-2 lg:col-span-3 border-t border-border/50 pt-3 mt-1">
                      <Label className="text-xs font-semibold">{isAr ? 'ملاحظات' : 'Observations'}</Label>
                      <Input value={item.observations} onChange={e => handleUpdateMouvement(item.local_id, { observations: e.target.value })} disabled={disabled} className="h-10 bg-background" />
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

Step6Infra.displayName = 'Step6Infra';