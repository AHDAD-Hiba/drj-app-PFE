import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input'; //Search
import { handleExportExcel } from '@/lib/export';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Send,
  Download,
  Eye,
  Search, FileSpreadsheet, Clock, AlertCircle
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/common/useAuth';
import { useToast } from '@/hooks/common/use-toast';

// Statuts 
type StatutRapport = 'NON_COMMENCE' | 'EN_COURS' | 'SOUMIS' | 'RETOUR_CORRECTION' | 'VALIDE';

interface RapportAvecDirection {
  id: string;
  annee: number;
  trimestre: string;
  date_soumission: string | null;
  statut_rapport: StatutRapport;
  directions: {
    nom_fr: string;
    nom_ar: string;
  } | null;
}

const CAN_REVIEW_STATUSES: StatutRapport[] = [
  'SOUMIS',
  'RETOUR_CORRECTION',
  'VALIDE',
];

const STATUS_META: Record<StatutRapport, { label: string; icon: any; cls: string }> = {
  NON_COMMENCE: {
    label: 'Non commencé',
    icon: AlertCircle, 
    cls: 'bg-destructive/10 ring-1 ring-destructive/20 text-destructive border-0',
  },
  EN_COURS: {
    label: 'En cours',
    icon: Clock, 
    cls: 'bg-warning/10 ring-1 ring-warning/20 text-warning border-0',
  },
  SOUMIS: {
    label: 'Soumis',
    icon: Send,
    cls: 'bg-success/10 ring-1 ring-success/20 text-success border-0', 
  },
  RETOUR_CORRECTION: {
    label: 'Correction demandée',
    icon: AlertTriangle,
    cls: 'bg-orange-500/10 ring-1 ring-orange-500/20 text-orange-600 border-0', 
  },
  VALIDE: {
    label: 'Validé',
    icon: CheckCircle2,
    cls: 'bg-emerald-500/10 ring-1 ring-emerald-500/20 text-emerald-600 border-0',
  },
};

const QUARTERS = [1, 2, 3, 4];

interface StatCardProps {
  icon: any;
  label: string;
  value: number;
  subtitle: string;
  tone: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
}

const StatCard = ({ icon: Icon, label, value, subtitle, tone }: StatCardProps) => (
  <Card className="group border-border/60 hover:border-border hover:shadow-sm transition-all duration-200">
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-105"
          style={{
            background: `hsl(var(--kpi-${tone}-soft))`,
            color: `hsl(var(--kpi-${tone}))`,
          }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4">
        <div className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
          {value}
        </div>
        <div className="text-sm font-medium text-foreground mt-1">{label}</div>
        <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
      </div>
    </CardContent>
  </Card>
);

const ProvincialReports = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [quarter, setQuarter] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState(''); // 🔎 
  
  const [reports, setReports] = useState<RapportAvecDirection[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const { utilisateur: profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      
      // (Jointure)
      const { data, error } = await supabase
        .from('rapports')
        .select(`
          id,
          annee,
          trimestre,
          date_soumission,
          statut_rapport,
          directions (
            nom_fr,
            nom_ar
          )
        `)
        .eq('annee', year)
        .eq('trimestre', `t${quarter}` as "t1" | "t2" | "t3" | "t4");
      if (error) {
        console.error("Erreur de chargement des rapports:", error);
      } else {
        setReports(data as unknown as RapportAvecDirection[]);
      }
      
      setLoading(false);
    };

    fetchReports();
  }, [year, quarter]); 

  const filteredReports = reports.filter((r) => {
    const matchesSearch = 
      r.directions?.nom_fr.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.directions?.nom_ar.includes(searchQuery);
      
    const matchesStatus = statusFilter === 'ALL' || r.statut_rapport === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: filteredReports.length,
    submitted: filteredReports.filter(r => r.statut_rapport === 'SOUMIS').length,
    corrections: filteredReports.filter(r => r.statut_rapport === 'RETOUR_CORRECTION').length,
    validated: filteredReports.filter(r => r.statut_rapport === 'VALIDE').length,
  };

  const handleValidateReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('rapports')
        .update({
          statut_rapport: 'VALIDE',
          date_validation: new Date().toISOString(),
          validateur_id: profile?.id ?? null,
        })
        .eq('id', reportId)
        .select();

      if (error) throw error;

      toast({
        title: 'Validé',
        description: 'Le rapport a été validé avec succès.',
      });

      setReports((current) =>
        current.map((report) =>
          report.id === reportId
            ? { ...report, statut_rapport: 'VALIDE' }
            : report
        )
      );
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl gradient-hero p-6 sm:p-8 text-primary-foreground shadow-elegant mb-6 md:mb-8">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="text-xs sm:text-sm font-semibold tracking-wider opacity-80 uppercase mb-1">
                Équipe Régionale
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold">
                {t("equipeRegional.title", "Gestion des rapports provinciaux")}
              </h1>
              <p className="text-sm sm:text-base opacity-90 mt-1">
                {t("equipeRegional.subtitle", "Suivi, vérification et validation des rapports provinciaux.")}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleExportExcel(`t${quarter}`)}
              className="gap-1.5 bg-white/15 hover:bg-white/25 text-white border-0 backdrop-blur-sm font-bold transition-smooth"
            >
              <FileSpreadsheet className="h-4 w-4" />
              {t("button.exportExcel", "Exporter Excel")}
            </Button>
            </div>
          </div>

          <div className="absolute -top-12 -end-12 w-48 h-48 rounded-full bg-secondary/30 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -start-8 w-40 h-40 rounded-full bg-primary-glow/40 blur-2xl pointer-events-none" />
        </div>

        {/* Filters & Search */}
        <Card className="border-border/60">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-end justify-between gap-4">
              
              {/* Selects: Année & Trimestre */}
              <div className="flex gap-3 w-full sm:w-auto">
                
                <div className="space-y-1.5 w-full sm:w-[140px]">
                  <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Année
                  </label>
                  <input
                    id="year-selector"
                    title="Sélectionner l'année"
                    placeholder="Année"
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value) || new Date().getFullYear())}
                    min={2020}
                    max={2099}
                    className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>

                {/* Trimestre  */}
                <div className="space-y-1.5 w-full sm:w-[140px]">
                  <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Trimestre
                  </label>
                  <Select value={String(quarter)} onValueChange={(v) => setQuarter(Number(v))}>
                    <SelectTrigger className="h-9 bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QUARTERS.map((q) => (
                        <SelectItem key={q} value={String(q)}>T{q}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Barre de recherche  */}
              <div className="w-full sm:w-[300px] relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une direction..."
                  className="pl-9 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={FileText}
            label="Total des rapports"
            value={stats.total}
            subtitle="Rapports de la période"
            tone={4}
          />
          <StatCard
            icon={Send}
            label="Rapports soumis"
            value={stats.submitted}
            subtitle="Transmis par les directions"
            tone={2}
          />
          <StatCard
            icon={AlertTriangle}
            label="Retours de correction"
            value={stats.corrections}
            subtitle="En attente de révision"
            tone={3}
          />
          <StatCard
            icon={CheckCircle2}
            label="Rapports validés"
            value={stats.validated}
            subtitle="Approuvés par l'équipe régionale"
            tone={1}
          />
        </div>

        {/* Main table */}
        <Card className="overflow-hidden border-border/60">
          
          <CardHeader className="px-5 py-4 border-b border-border/60 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Liste des rapports
            </CardTitle>
            <div className="w-[180px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-xs bg-card">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les statuts</SelectItem>
                  <SelectItem value="NON_COMMENCE">Non commencé</SelectItem>
                  <SelectItem value="EN_COURS">Brouillon (En cours)</SelectItem>
                  <SelectItem value="SOUMIS">Soumis</SelectItem>
                  <SelectItem value="RETOUR_CORRECTION">Correction demandée</SelectItem>
                  <SelectItem value="VALIDE">Validé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-medium uppercase tracking-wider">Direction</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider">Année</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider">Trimestre</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider">Date de soumission</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider">Statut</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      Chargement des données...
                    </TableCell>
                  </TableRow>
                ) : filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-10">
                      Aucun rapport trouvé pour ces critères.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.map((report) => {
                    const meta = STATUS_META[report.statut_rapport];
                    const StatusIcon = meta?.icon || FileText;
                    
                    return (
                      <TableRow key={report.id} className="transition-colors hover:bg-muted/40">
                        <TableCell className="font-medium text-foreground">
                          {report.directions?.nom_fr || 'Direction inconnue'}
                        </TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {report.annee}
                        </TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {report.trimestre}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {report.date_soumission
                            ? new Date(report.date_soumission).toLocaleDateString('fr-FR')
                            : '—'}
                        </TableCell>
                        <TableCell>
                        <Badge variant="outline" className={`gap-1.5 px-2.5 py-1 shadow-none ${meta?.cls}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          <span className="font-semibold text-xs tracking-wide">
                            {meta?.label || report.statut_rapport}
                          </span>
                        </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {CAN_REVIEW_STATUSES.includes(report.statut_rapport) && (
                            <Button
                              size="sm"
                              variant="default"
                              className="h-8 gap-1.5"
                              onClick={() => navigate(`/saisie?mode=review&rapport=${report.id}`)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Examiner
                            </Button>
                          )}
                          {report.statut_rapport === 'SOUMIS' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-8 gap-1.5"
                              onClick={() => handleValidateReport(report.id)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Valider
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};
export default ProvincialReports;