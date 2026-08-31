import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, History, Search, Activity, Eye, FileJson } from 'lucide-react';

export const AuditAdmin = () => {
    const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['admin_audit_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          utilisateur:utilisateurs!audit_logs_utilisateur_id_fkey ( nom, email )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('audit_logs')
          .select('*, utilisateur:utilisateurs(nom, email)')
          .order('created_at', { ascending: false })
          .limit(100);

        if (fallbackError) throw fallbackError;
        return fallbackData;
      }

      return data;
    },
  });

  const filtered = logs.filter((log: any) => {
    const searchLower = searchQuery.toLowerCase();
    const userName = log.utilisateur?.nom?.toLowerCase() || '';
    const userEmail = log.utilisateur?.email?.toLowerCase() || '';
    const tableName = log.table_name?.toLowerCase() || '';
    const action = log.action?.toLowerCase() || '';

    return (
      userName.includes(searchLower) ||
      userEmail.includes(searchLower) ||
      tableName.includes(searchLower) ||
      action.includes(searchLower)
    );
  });

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'bg-emerald-600 text-white';
      case 'UPDATE':
        return 'bg-amber-500 text-white';
      case 'DELETE':
        return 'bg-red-600 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };
  const ACTION_LABELS: Record<string, { fr: string; ar: string }> = {
  INSERT: { fr: "CRÉATION", ar: "إضافة" },
  UPDATE: { fr: "MODIFICATION", ar: "تعديل" },
  DELETE: { fr: "SUPPRESSION", ar: "حذف" },
};

  return (
    <AppLayout>
      <div className="space-y-6">
        
        <div className="relative overflow-hidden rounded-2xl gradient-hero p-6 sm:p-8 text-primary-foreground shadow-elegant">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="text-xs sm:text-sm font-semibold tracking-wider opacity-80 uppercase mb-1">
                {isAr ? 'الأمان والمراقبة' : 'Sécurité & Traçabilité'}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2">
                <History className="h-7 w-7" />
                {isAr ? 'سجل العمليات والأنشطة' : 'Journal d\'Audit Système'}
              </h1>
              <p className="text-sm sm:text-base opacity-90 mt-1">
                {isAr
                  ? 'متابعة الدقيقة لجميع عمليات الإضافة والتعديل والحذف في النظام'
                  : 'Consultez l\'historique détaillé des opérations (INSERT, UPDATE, DELETE) sur toutes les tables.'}
              </p>
            </div>
          </div>
          <div className="absolute -top-12 -end-12 w-48 h-48 rounded-full bg-secondary/30 blur-3xl pointer-events-none" />
        </div>

        <Card className="border-border/60">
          <CardContent className="p-4 sm:p-5 space-y-4">
            
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isAr ? 'البحث عن مستخدم أو جدول...' : 'Rechercher par utilisateur, table...'}
                className="pl-9 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className={`text-xs font-medium uppercase tracking-wider ${isAr ? 'text-right' : 'text-left'}`}>{isAr ? 'التاريخ والوقت' : 'Horodatage'}</TableHead>
                    <TableHead className={`text-xs font-medium uppercase tracking-wider ${isAr ? 'text-right' : 'text-left'}`}>{isAr ? 'المستخدم' : 'Utilisateur'}</TableHead>
                    <TableHead className={`text-xs font-medium uppercase tracking-wider ${isAr ? 'text-right' : 'text-left'}`}>{isAr ? 'العملية' : 'Action'}</TableHead>
                    <TableHead className={`text-xs font-medium uppercase tracking-wider ${isAr ? 'text-right' : 'text-left'}`}>{isAr ? 'الجدول المستهدف' : 'Table Cible'}</TableHead>
                    <TableHead className={`text-xs font-medium uppercase tracking-wider ${isAr ? 'text-right' : 'text-left'}`}>{isAr ? 'معرف السجل' : 'Record ID'}</TableHead>
                    <TableHead className={`text-xs font-medium uppercase tracking-wider ${isAr ? 'text-left' : 'text-right'}`}>{isAr ? 'التفاصيل (JSON)' : 'Détails JSON'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-10">
                        {isAr ? 'لم يتم تسجيل أي عملية.' : 'Aucun log trouvé dans le journal.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((log: any) => (
                      <TableRow key={log.id} className="transition-colors hover:bg-muted/40">
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {log.created_at ? new Date(log.created_at).toLocaleString(isAr ? 'ar-MA' : 'fr-FR') : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-xs text-foreground">
                            {log.utilisateur?.nom || (isAr ? 'النظام / غير معروف' : 'Système / Inconnu')}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {log.utilisateur?.email || ''}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`gap-1 text-[10px] font-semibold ${getActionBadgeVariant(log.action)}`}>
                            <Activity className="h-3 w-3" />
                            {isAr 
                            ? (ACTION_LABELS[log.action]?.ar || log.action) 
                            : (ACTION_LABELS[log.action]?.fr || log.action)}
                        </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-primary font-medium">
                          {log.table_name}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground truncate max-w-[120px]">
                          {log.record_id || '—'}
                        </TableCell>
                        <TableCell className={isAr ? 'text-left' : 'text-right'}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 gap-1.5 text-xs text-blue-600 hover:text-blue-700 flex ${isAr ? 'mr-auto' : 'ml-auto'}`}
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            {isAr ? 'معاينة' : 'Inspecter'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileJson className="h-5 w-5 text-primary" />
                {isAr ? 'تفاصيل التعديل — ' : 'Détails de la modification — '} <span className="font-mono text-sm">{selectedLog?.table_name}</span>
              </DialogTitle>
            </DialogHeader>

            {selectedLog && (
              <div className="space-y-4 py-2 text-start">
                <div className="grid grid-cols-2 gap-4 text-xs bg-muted/30 p-3 rounded-lg border">
                  <div><strong>{isAr ? 'العملية:' : 'Action :'}</strong> {selectedLog.action}</div>
                  <div><strong>{isAr ? 'الجدول:' : 'Table :'}</strong> {selectedLog.table_name}</div>
                  <div><strong>{isAr ? 'تم التنفيذ بواسطة:' : 'Exécuté par :'}</strong> {selectedLog.utilisateur?.nom || (isAr ? 'غير معروف' : 'Inconnu')}</div>
                  <div><strong>{isAr ? 'التاريخ:' : 'Date :'}</strong> {new Date(selectedLog.created_at).toLocaleString(isAr ? 'ar-MA' : 'fr-FR')}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-red-600 flex items-center gap-1">
                      {isAr ? 'البيانات القديمة (old_data)' : 'Anciennes Données (old_data)'}
                    </label>
                    <pre className="p-3 bg-red-950/5 text-red-900 border border-red-200 rounded-md text-[11px] font-mono overflow-x-auto max-h-60" dir="ltr">
                      {selectedLog.old_data 
                        ? JSON.stringify(selectedLog.old_data, null, 2) 
                        : (isAr ? 'null (إنشاء)' : 'null (Création)')}
                    </pre>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      {isAr ? 'البيانات الجديدة (new_data)' : 'Nouvelles Données (new_data)'}
                    </label>
                    <pre className="p-3 bg-emerald-950/5 text-emerald-900 border border-emerald-200 rounded-md text-[11px] font-mono overflow-x-auto max-h-60" dir="ltr">
                      {selectedLog.new_data 
                        ? JSON.stringify(selectedLog.new_data, null, 2) 
                        : (isAr ? 'null (حذف)' : 'null (Suppression)')}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  );
};

export default AuditAdmin;