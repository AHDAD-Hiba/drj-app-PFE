import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileSpreadsheet, Download, CheckCircle2, AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';
import { useEffect } from 'react';
import {
  generateImportTemplate,
  parseImportFile,
  SUBMISSION_NUMERIC_FIELDS,
} from '@/lib/excelTemplate';

interface ParsedRow {
  raw: Record<string, any>;
  prefecture_id?: string;
  prefecture_label?: string;
  errors: string[];
  warnings: string[];
  payload?: Record<string, any>;
}

const STATUSES = ['brouillon', 'soumise', 'validee'];

const ImportExcel = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { profile, isAdmin, isDirector } = useAuth();
  const navigate = useNavigate();

  const [prefectures, setPrefectures] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);

  useEffect(() => {
    supabase.from('prefectures').select('*').then(({ data }) => {
      setPrefectures(data ?? []);
    });
  }, []);

  const codeMap = useMemo(
    () => new Map(prefectures.map(p => [p.code.toUpperCase(), p])),
    [prefectures],
  );

  // Permissions : admin ou directeur uniquement (rendu conditionnel APRÈS tous les hooks)
  const canImport = isAdmin || isDirector;

  const validateRow = (raw: Record<string, any>): ParsedRow => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const code = String(raw.code_prefecture ?? raw.code ?? '').trim().toUpperCase();
    const pref = codeMap.get(code);
    if (!code) errors.push(t('import.errCodeMissing'));
    else if (!pref) errors.push(t('import.errCodeUnknown', { code }));

    // Permission directeur : ne peut importer que sa préfecture
    if (isDirector && !isAdmin && pref && profile?.prefecture_id && pref.id !== profile.prefecture_id) {
      errors.push(t('import.errNotYourDp'));
    }

    const year = Number(raw.year);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      errors.push(t('import.errYear'));
    }

    const status = String(raw.status ?? 'brouillon').trim().toLowerCase();
    if (!STATUSES.includes(status)) {
      errors.push(t('import.errStatus'));
    }

    const payload: Record<string, any> = {
      prefecture_id: pref?.id,
      year,
      status,
    };

    SUBMISSION_NUMERIC_FIELDS.forEach(f => {
      const v = raw[f];
      if (v === null || v === undefined || v === '') {
        payload[f] = 0;
        return;
      }
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0) {
        warnings.push(`${f}: ${v} → 0`);
        payload[f] = 0;
      } else {
        payload[f] = Math.round(n);
      }
    });

    return {
      raw,
      prefecture_id: pref?.id,
      prefecture_label: pref?.name_fr ?? code,
      errors,
      warnings,
      payload: errors.length ? undefined : payload,
    };
  };

  const handleFile = async (f: File) => {
    setFile(f);
    setParsing(true);
    setRows([]);
    try {
      const raw = await parseImportFile(f);
      if (!raw.length) {
        toast({ title: t('import.errEmpty'), variant: 'destructive' });
        return;
      }
      setRows(raw.map(validateRow));
    } catch (e: any) {
      toast({ title: t('import.errParse'), description: e?.message, variant: 'destructive' });
    } finally {
      setParsing(false);
    }
  };

  const validRows = rows.filter(r => r.errors.length === 0);
  const invalidRows = rows.filter(r => r.errors.length > 0);

  const handleImport = async () => {
    if (!validRows.length) return;
    setImporting(true);
    try {
      const payloads = validRows.map(r => r.payload!);
      // Upsert sur (prefecture_id, year) — supabase ne sait le faire que par PK,
      // donc on supprime puis insère par lot.
      const keys = payloads.map(p => ({ prefecture_id: p.prefecture_id, year: p.year }));
      // Supprimer les existantes correspondantes
      for (const k of keys) {
        await supabase.from('submissions')
          .delete()
          .eq('prefecture_id', k.prefecture_id)
          .eq('year', k.year);
      }
      const inserts = payloads.map(p => ({
        prefecture_id: p.prefecture_id as string,
        year: p.year as number,
        status: p.status,
        submitted_by: profile?.id ?? null,
        ...Object.fromEntries(SUBMISSION_NUMERIC_FIELDS.map(f => [f, p[f]])),
      }));
      const { error } = await supabase.from('submissions').insert(inserts as any);
      if (error) throw error;
      toast({
        title: t('import.successTitle'),
        description: t('import.successBody', { count: payloads.length }),
      });
      setRows([]);
      setFile(null);
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (e: any) {
      toast({ title: t('import.errImport'), description: e?.message, variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  if (!canImport) {
    return (
      <AppLayout>
        <Card className="p-8 text-center">
          <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h2 className="font-bold text-lg">{t('import.forbiddenTitle')}</h2>
          <p className="text-sm text-muted-foreground mt-2">{t('import.forbiddenBody')}</p>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl gradient-hero p-6 sm:p-8 text-primary-foreground shadow-elegant">
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80 flex items-center gap-2">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              {t('import.eyebrow')}
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">{t('import.title')}</h1>
            <p className="text-sm sm:text-base opacity-90 mt-1 max-w-2xl">{t('import.subtitle')}</p>
          </div>
          <div className="absolute -top-12 -end-12 w-48 h-48 rounded-full bg-secondary/30 blur-3xl" />
        </div>

        {/* Étape 1 : modèle */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                <h2 className="font-bold text-foreground">{t('import.step1')}</h2>
              </div>
              <p className="text-sm text-muted-foreground">{t('import.step1Hint')}</p>
            </div>
            <Button
              onClick={() => generateImportTemplate(prefectures, new Date().getFullYear())}
              variant="outline"
              className="gap-2 flex-shrink-0"
              disabled={!prefectures.length}
            >
              <Download className="h-4 w-4" />
              {t('import.downloadTemplate')}
            </Button>
          </div>
        </Card>

        {/* Étape 2 : upload */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
            <h2 className="font-bold text-foreground">{t('import.step2')}</h2>
          </div>
          <label
            htmlFor="excel-file"
            className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-primary/60 rounded-xl py-10 px-4 cursor-pointer transition-smooth bg-muted/20"
          >
            <Upload className="h-8 w-8 text-muted-foreground mb-3" />
            <span className="text-sm font-semibold text-foreground">{t('import.dropZone')}</span>
            <span className="text-xs text-muted-foreground mt-1">.xlsx · {t('import.maxSize')}</span>
            {file && (
              <Badge variant="outline" className="mt-3 gap-1.5">
                <FileSpreadsheet className="h-3 w-3" />
                {file.name}
              </Badge>
            )}
          </label>
          <input
            id="excel-file"
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {parsing && (
            <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('import.parsing')}
            </div>
          )}
        </Card>

        {/* Étape 3 : aperçu et validation */}
        {rows.length > 0 && (
          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                <h2 className="font-bold text-foreground">{t('import.step3')}</h2>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-success/15 text-success border-success/30 gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {validRows.length} {t('import.valid')}
                </Badge>
                {invalidRows.length > 0 && (
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {invalidRows.length} {t('import.invalid')}
                  </Badge>
                )}
              </div>
            </div>

            {invalidRows.length > 0 && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{t('import.fixErrorsHint')}</AlertDescription>
              </Alert>
            )}

            <div className="overflow-x-auto -mx-5 sm:-mx-6">
              <table className="w-full text-sm min-w-[680px]">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-start ps-5 sm:ps-6 py-2.5 font-semibold">{t('import.colStatus')}</th>
                    <th className="text-start py-2.5 font-semibold">{t('import.colDp')}</th>
                    <th className="text-start py-2.5 font-semibold">{t('common.year')}</th>
                    <th className="text-start py-2.5 font-semibold">Statut</th>
                    <th className="text-end pe-5 sm:pe-6 py-2.5 font-semibold">{t('import.colDetail')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-t border-border align-top">
                      <td className="ps-5 sm:ps-6 py-3">
                        {r.errors.length === 0 ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                      </td>
                      <td className="py-3">
                        <div className="font-medium text-foreground">{r.prefecture_label}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {String(r.raw.code_prefecture ?? r.raw.code ?? '—')}
                        </div>
                      </td>
                      <td className="py-3 tabular-nums">{r.raw.year ?? '—'}</td>
                      <td className="py-3">{r.raw.status ?? '—'}</td>
                      <td className="pe-5 sm:pe-6 py-3 text-end">
                        {r.errors.length > 0 ? (
                          <div className="text-[11px] text-destructive space-y-0.5">
                            {r.errors.map((e, j) => <div key={j}>• {e}</div>)}
                          </div>
                        ) : r.warnings.length > 0 ? (
                          <div className="text-[11px] text-warning">{r.warnings.length} avertissement(s)</div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">OK</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-5">
              <Button
                onClick={handleImport}
                disabled={!validRows.length || importing}
                className="gap-2"
              >
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {t('import.confirmImport', { count: validRows.length })}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default ImportExcel;
