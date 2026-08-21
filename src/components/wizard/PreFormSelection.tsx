import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/common/useAuth';
import { useToast } from '@/hooks/common/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SafeInput } from '@/components/form/SafeInput';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Calendar, Layers, ArrowRight, ArrowLeft, FileText, CheckCircle2, Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export type Quarter = 't1' | 't2' | 't3' | 't4';

export interface ReportSelection {
  year: number;
  quarter?: Quarter;
  domain: string; 
  rapportId?: string;
  directionId?: string;
}

interface Props {
  initial: ReportSelection;
  reportStatus?: string;
  onStatusChange?: (newStatus: string) => void;
  onValidate?: () => Promise<boolean>;
  onReturnCorrection?: (correctionText: string) => Promise<boolean>;
  onComplete: (sel: ReportSelection) => void;
}

interface DomaineItem {
  id: string;
  code: string;
  nom_fr: string;
  nom_ar: string;
  statut: "NON_COMMENCE" | "EN_COURS" | "TERMINE";
}

const QUARTERS: Quarter[] = ['t1', 't2', 't3', 't4'];

export const PreFormSelection = ({ 
  initial, 
  reportStatus,
  onStatusChange,
  onValidate,
  onReturnCorrection,
  onComplete 
}: Props) => {
  const { t, i18n } = useTranslation();
  const { utilisateur, isEquipeRegional } = useAuth();
  const { toast } = useToast();
  const isAr = i18n.language === 'ar';
  
  const [stage, setStage] = useState<1 | 2>(1);
  const [sel, setSel] = useState<ReportSelection>(initial);
  const [loading, setLoading] = useState(false);  

  const [rapportId, setRapportId] = useState<string | null>(null);
  const [domaines, setDomaines] = useState<DomaineItem[]>([]);
  const [canSubmitReport, setCanSubmitReport] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);

  // 🎯 1. Ajout d'un statut interne pour suivre l'état du rapport en direct
  const [internalStatus, setInternalStatus] = useState<string>(reportStatus || 'NON_COMMENCE');

  useEffect(() => {
    if (reportStatus) {
      setInternalStatus(reportStatus);
    }
  }, [reportStatus]);

  useEffect(() => {
    const prefetchDomainesBase = async () => {
      const { data, error } = await supabase.from('domaines').select('code');
      if (!error && data && data.length > 0 && !sel.domain) {
        setSel(s => ({ ...s, domain: data[0].code }));
      }
    };
    prefetchDomainesBase();
  }, []);

  useEffect(() => {
    if (!initial.rapportId) return;
    setRapportId(initial.rapportId);
    loadDomaines(initial.rapportId);
    setStage(2);
  }, [initial.rapportId]);

  const handleNextToDomains = async () => {
    if (!utilisateur?.direction_id) {
      toast({ 
        title: "Erreur", 
        description: "Impossible d'identifier votre direction.", 
        variant: "destructive" 
      });
      return;
    }

    if (!sel.quarter || !sel.year) return;

    setLoading(true);
    try {
      const { data: canCreate, error: checkError } = await supabase.rpc(
        'can_create_next_report',
        {
          p_direction_id: utilisateur.direction_id,
          p_annee: sel.year,
          p_trimestre: sel.quarter,
        }
      );

      if (checkError) throw checkError;

      if (!canCreate) {
        toast({
          title: isAr ? 'غير مسموح' : 'Action non autorisée',
          description: isAr
            ? 'يجب إتمام وإرسال جميع مجالات التقرير السابق أولاً'
            : 'Tous les domaines du rapport précédent doivent être terminés avant.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const previousQuarter =
        sel.quarter === "t2" ? "t1" : 
        sel.quarter === "t3" ? "t2" : 
        sel.quarter === "t4" ? "t3" : null;

      if (previousQuarter) {
        const { data: previousReport } = await supabase
          .from("rapports")
          .select("statut_rapport")
          .eq("direction_id", utilisateur.direction_id)
          .eq("annee", sel.year)
          .eq("trimestre", previousQuarter)
          .maybeSingle();

        if (!previousReport || previousReport.statut_rapport !== "VALIDE") {
          toast({
            title: isAr ? 'غير مسموح' : 'Action non autorisée',
            description: isAr
              ? `يجب المصادقة على تقرير الفصل السابق (${previousQuarter.toUpperCase()}) أولاً.`
              : `Le rapport du trimestre précédent (${previousQuarter.toUpperCase()}) doit être validé d'abord.`,
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
      }

      // 🎯 2. Modification ici : On sélectionne AUSSI statut_rapport
      const query = supabase
        .from('rapports')
        .select('id, statut_rapport')
        .eq('annee', sel.year)
        .eq('trimestre', sel.quarter)
        .eq('direction_id', utilisateur.direction_id);

      const { data: existingRapport, error: fetchError } = await query.maybeSingle();
      if (fetchError) throw fetchError;

      let currentRapportId = existingRapport?.id;

      // 🎯 3. Mise à jour de l'état local si le rapport existe
      if (existingRapport) {
        setInternalStatus(existingRapport.statut_rapport);
        if (onStatusChange) onStatusChange(existingRapport.statut_rapport);
      }

      if (!currentRapportId) {
        const { data: newRapport, error: insertError } = await supabase
          .from('rapports')
          .insert({
            annee: sel.year,
            trimestre: sel.quarter,
            direction_id: utilisateur.direction_id
          })
          .select('id, statut_rapport')
          .single();

        if (insertError) {
            if (insertError.code === '23505') {
                const { data: recoveredRapport } = await query.maybeSingle();
                if (recoveredRapport) {
                  currentRapportId = recoveredRapport.id;
                  setInternalStatus(recoveredRapport.statut_rapport);
                  if (onStatusChange) onStatusChange(recoveredRapport.statut_rapport);
                }
            } else {
                throw insertError;
            }
        } else {
            currentRapportId = newRapport.id;
            setInternalStatus(newRapport.statut_rapport);
            if (onStatusChange) onStatusChange(newRapport.statut_rapport);
        }
      }

      setRapportId(currentRapportId);

      const { count } = await supabase
        .from("suivi_remplissage")
        .select("*", { count: "exact", head: true })
        .eq("rapport_id", currentRapportId);

      if ((count ?? 0) === 0) {
        const { data: masterDomaines, error } = await supabase.from("domaines").select("id");
        if (error) throw error;

        if (masterDomaines && masterDomaines.length > 0) {
          await supabase.from("suivi_remplissage").insert(
            masterDomaines.map((d) => ({
              rapport_id: currentRapportId,
              direction_id: utilisateur?.direction_id,
              domaine_id: d.id,
              statut: "NON_COMMENCE",
              progression_pourcentage: 0,
            }))
          );
        }
      }

      await loadDomaines(currentRapportId!);
      
      setStage(2);

    } catch (error: any) {
      toast({ title: "Erreur de base de données", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadDomaines = async (rId: string) => {
    const { data, error } = await supabase
      .from("suivi_remplissage")
      .select(`
        statut,
        domaine:domaines(id, code, nom_fr, nom_ar)
      `)
      .eq("rapport_id", rId);

    if (error) throw error;

    const formattedDomaines: DomaineItem[] = (data || []).map((row: any) => ({
      id: row.domaine.id,
      code: row.domaine.code.toLowerCase(),
      nom_fr: row.domaine.nom_fr,
      nom_ar: row.domaine.nom_ar,
      statut: row.statut,
    }));

    setDomaines(formattedDomaines);

    const allTermine = formattedDomaines.length > 0 && formattedDomaines.every(d => d.statut === "TERMINE");
    setCanSubmitReport(allTermine);
  };

  const handleSubmitReport = async () => {
    if (!rapportId) return;
    setLoading(true);
    try {
        const { error } = await supabase
            .from('rapports')
            .update({ 
              statut_rapport: 'SOUMIS',
              date_soumission: new Date().toISOString(),
              commentaire_correction: null // Assurez-vous d'avoir renommé la colonne en BDD
            })
            .eq('id', rapportId);
        
        if (error) throw error;
        
        toast({ 
            title: isAr ? "تم بنجاح" : "Succès", 
            description: isAr ? "تم إرسال التقرير بنجاح" : "Le rapport a été soumis avec succès." 
        });

        // 🎯 4. Mise à jour instantanée du statut interne
        setInternalStatus('SOUMIS');
        if (onStatusChange) onStatusChange('SOUMIS');

    } catch (error: any) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  const handleOpenForm = () => {
    if (!rapportId || !sel.domain) return;
    onComplete({ ...sel, rapportId });
  };

  const canNextFromStage1 = !!sel.year && !!sel.quarter;

  const stages = [
    { id: 1, label: isAr ? 'اختيار التقرير' : 'Choisir le rapport', icon: Calendar },
    { id: 2, label: isAr ? 'اختيار المجال' : 'Choisir le domaine', icon: Layers },
    { id: 3, label: isAr ? 'الاستمارة' : 'Formulaire', icon: FileText },
  ];

  // 🎯 5. Condition basée sur le statut INTERNE, garantissant que c'est bien la valeur en base de données
  const shouldShowSubmitButton = 
    !isEquipeRegional && 
    canSubmitReport && 
    internalStatus !== 'SOUMIS' && 
    internalStatus !== 'VALIDE';

  return (
    <div className="space-y-5">
      <Card className="p-4 sm:p-5">
        <ol className="flex items-center justify-between gap-2">
          {stages.map((s, idx) => {
            const Icon = s.icon;
            const active = s.id === stage;
            const done = s.id < stage;
            return (
              <li key={s.id} className="flex-1 flex items-center min-w-0">
                <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                  <div className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center border-2 transition-smooth flex-shrink-0',
                    done && 'bg-primary text-primary-foreground border-primary',
                    active && 'bg-primary-soft text-primary border-primary ring-4 ring-primary/15',
                    !done && !active && 'bg-card text-muted-foreground border-border',
                  )}>
                    {done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={cn(
                    'text-[10px] sm:text-xs font-medium text-center leading-tight',
                    active ? 'text-primary' : done ? 'text-foreground' : 'text-muted-foreground',
                  )}>
                    {s.label}
                  </span>
                </div>
                {idx < stages.length - 1 && (
                  <div className={cn(
                    'h-0.5 flex-1 mx-1 sm:mx-2 transition-smooth',
                    s.id < stage ? 'bg-primary' : 'bg-border',
                  )} />
                )}
              </li>
            );
          })}
        </ol>
      </Card>

      {stage === 1 && (
        <Card className="p-5 sm:p-7 space-y-5">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {isAr ? 'اختيار التقرير' : 'Choisir le rapport'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isAr ? 'حدد السنة والفصل' : 'Sélectionnez l’année et le trimestre'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{isAr ? 'السنة' : 'Année'}</Label>
              <SafeInput
                type="number"
                min={2026}
                max={2099}
                value={sel.year}
                onChange={e => setSel(s => ({ ...s, year: Number(e.target.value) || s.year }))}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                {isAr ? 'الفصل' : 'Trimestre'}
              </Label>
              <Select
                value={sel.quarter}
                onValueChange={(v: Quarter) => setSel(s => ({ ...s, quarter: v }))}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={isAr ? 'اختر الفصل' : 'Choisir le trimestre'} />
                </SelectTrigger>
                <SelectContent>
                  {QUARTERS.map(q => (
                    <SelectItem key={q} value={q}>
                      {t(`PreFormSelection.quarters.${q}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleNextToDomains} disabled={!canNextFromStage1 || loading} className="gap-1.5">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isAr ? 'التالي' : 'Suivant'}
              {isAr ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </Card>
      )}

      {stage === 2 && (
        <Card className="p-5 sm:p-7 space-y-5">
          <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  {isAr ? 'اختيار المجال' : 'Choisir le domaine'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {isAr ? 'اختر المجال المراد تعبئته' : 'Sélectionnez le domaine à renseigner'}
                </p>
              </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {domaines.map((d) => {
              const selected = sel.domain === d.code;
              
              const badgeClass =
                d.statut === "TERMINE" ? "bg-success/15 text-success" :
                d.statut === "EN_COURS" ? "bg-info/15 text-info" :
                "bg-warning/15 text-warning";
                
              const badgeLabel = t(`status.${d.statut}`);

              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSel((s) => ({ ...s, domain: d.code }))}
                  className={cn(
                    "rounded-xl border-2 p-4 text-start transition-smooth flex items-center justify-between",
                    selected
                      ? "border-primary bg-primary-soft ring-4 ring-primary/15"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex flex-col gap-1.5">
                    <p className="font-semibold text-sm">
                      {isAr ? d.nom_ar : d.nom_fr}
                    </p>
                    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider w-fit", badgeClass)}>
                      {badgeLabel}
                    </span>
                  </div>

                  <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                      selected ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                  )}>
                      {d.statut === "TERMINE" ? <CheckCircle2 className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
                  </div>
                </button>
              );
            })}
            
            {domaines.length === 0 && (
                <div className="col-span-1 sm:col-span-2 text-center py-6 text-sm text-muted-foreground border-2 border-dashed rounded-xl">
                    Aucun domaine trouvé dans la base de données.
                </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between pt-4 mt-2 border-t border-border gap-4">
            {!isEquipeRegional ? (
              <Button
                variant="outline"
                onClick={() => setStage(1)}
                className="gap-1.5 h-10"
                disabled={loading}
              >
                {isAr ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                {isAr ? "السابق" : "Précédent"}
              </Button>
            ) : (
              <div className="h-10 w-24" />
            )}
            
            <div className="flex items-center gap-3">
              {/* Le bouton dépendra désormais de la BDD et non d'une variable par défaut */}
              {shouldShowSubmitButton && (
                <Button 
                  onClick={() => setConfirmSubmitOpen(true)}
                  disabled={loading}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5 h-10 px-4 rounded-md font-medium shadow-sm transition-colors"
                >
                  <Send className="h-4 w-4" />
                  {isAr ? 'إرسال التقرير النهائي' : 'Soumettre le rapport'}
                </Button>
              )}
              
              <Button onClick={handleOpenForm} disabled={loading || !sel.domain} className="gap-1.5 h-10 px-4">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isAr ? 'افتح الاستمارة' : 'Accéder au formulaire'}
              </Button>
            </div>
          </div>        
        </Card>
      )}

      <Dialog open={confirmSubmitOpen} onOpenChange={setConfirmSubmitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAr ? 'تأكيد الإرسال النهائي' : 'Confirmation de soumission'}</DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <p className="text-sm text-muted-foreground">
              {isAr 
                ? 'هل أنت متأكد أنك تريد إرسال التقرير النهائي؟ سيتم إرساله إلى الفريق الجهوي ولن تتمكن من تعديل أي مجال.'
                : 'Êtes-vous sûr de vouloir soumettre le rapport final ? Il sera envoyé à l\'équipe régionale et ne pourra plus être modifié.'}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmSubmitOpen(false)} disabled={loading}>
              {isAr ? 'إلغاء' : 'Annuler'}
            </Button>
            <Button 
              onClick={() => { setConfirmSubmitOpen(false); handleSubmitReport(); }} 
              disabled={loading} 
              className="bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              {isAr ? 'تأكيد الإرسال' : 'Confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};