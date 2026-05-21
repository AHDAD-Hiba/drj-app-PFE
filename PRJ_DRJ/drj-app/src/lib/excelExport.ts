import * as XLSX from 'xlsx';
import { computeTotalBeneficiaries, getPrefName } from './data';
import { SUBMISSION_NUMERIC_FIELDS, FIELD_LABELS_FR } from './excelTemplate';

const fitCols = (rows: any[][]) =>
  rows[0].map((_, i) => ({
    wch: Math.min(48, Math.max(8, ...rows.map(r => String(r[i] ?? '').length + 2))),
  }));

/**
 * Export Excel — UNE SEULE FEUILLE plate, exploitable directement
 * (un tableau croisé Excel suffit pour analyser).
 * Une ligne = une direction préfectorale, toutes les colonnes alignées.
 */
export const exportDashboardXlsx = (
  ranking: any[],
  _kpis: { label: string; value: string }[],
  lang: string,
  t: (k: string) => string,
  year: number,
) => {
  const wb = XLSX.utils.book_new();

  const header = [
    'Rang',
    'Code',
    t('dashboard.direction'),
    'Année',
    'Statut',
    t('dashboard.score'),
    t('dashboard.completeness') + ' (%)',
    t('detail.totalBeneficiaries'),
    ...SUBMISSION_NUMERIC_FIELDS.map(f => FIELD_LABELS_FR[f] ?? f),
  ];

  const body = ranking.map((r, i) => [
    i + 1,
    r.pref.code,
    getPrefName(r.pref, lang),
    year,
    t(`status.${r.status}`),
    Number(r.global_score),
    Number(r.completeness_pct),
    r.total,
    ...SUBMISSION_NUMERIC_FIELDS.map(f => r[f] ?? 0),
  ]);

  const rows = [header, ...body];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = fitCols(rows);
  // Fige la première ligne (en-tête) pour faciliter l'analyse
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };
  XLSX.utils.book_append_sheet(wb, ws, `DRJ-CS ${year}`);

  XLSX.writeFile(wb, `drj-cs-tableau-de-bord-${year}.xlsx`);
};

/**
 * Export Excel d'une fiche direction — UNE SEULE FEUILLE :
 * synthèse en haut + indicateurs détaillés dessous.
 */
export const exportDirectionXlsx = (
  pref: any,
  sub: any,
  lang: string,
  t: (k: string) => string,
  year: number,
) => {
  const wb = XLSX.utils.book_new();
  const total = computeTotalBeneficiaries(sub);

  const rows: any[][] = [
    ['Direction Régionale de la Jeunesse Casablanca-Settat'],
    [],
    ['Direction préfectorale', getPrefName(pref, lang)],
    ['Code', pref.code],
    ['Année', year],
    ['Statut', t(`status.${sub.status}`)],
    ['Score global', Number(sub.global_score)],
    ['Complétude (%)', Number(sub.completeness_pct)],
    ['Total bénéficiaires', total],
    [],
    ['Champ', 'Libellé', 'Valeur'],
    ...SUBMISSION_NUMERIC_FIELDS.map(f => [f, FIELD_LABELS_FR[f] ?? f, sub[f] ?? 0]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 28 }, { wch: 48 }, { wch: 18 }];
  // Fusionne le titre sur 3 colonnes
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
  XLSX.utils.book_append_sheet(wb, ws, `${pref.code} ${year}`);

  XLSX.writeFile(wb, `drj-cs-${pref.code.toLowerCase()}-${year}.xlsx`);
};
