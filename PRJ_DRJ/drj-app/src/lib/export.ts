import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { computeTotalBeneficiaries, formatNumber, formatDate, getPrefName } from './data';
import { Amiri_Regular } from '@/assets/fonts/Amiri-Regular';
import { Amiri_Bold } from '@/assets/fonts/Amiri-Bold';
import { containsArabic, shapeArabic } from './arabicText';

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const escapeCsv = (v: any) => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const downloadCsv = (rows: (string | number | null)[][], filename: string) => {
  // BOM UTF-8 pour Excel + arabe lisible directement (texte logique, pas de shaping)
  const csv = '\uFEFF' + rows.map(r => r.map(escapeCsv).join(';')).join('\n');
  triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename);
};

// ===== Helpers PDF =====

/**
 * Enregistre les polices Amiri sur l'instance jsPDF fournie.
 * jsPDF est par-instance, donc on doit appeler addFileToVFS / addFont
 * sur chaque nouveau document. Retourne true si l'enregistrement a réussi.
 */
const ensureAmiri = (doc: jsPDF): boolean => {
  try {
    doc.addFileToVFS('Amiri-Regular.ttf', Amiri_Regular);
    doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
    doc.addFileToVFS('Amiri-Bold.ttf', Amiri_Bold);
    doc.addFont('Amiri-Bold.ttf', 'Amiri', 'bold');
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[PDF] Échec du chargement de la police Amiri, fallback Helvetica.', err);
    return false;
  }
};

/** Crée un setter de police qui choisit Amiri pour AR si dispo, sinon Helvetica. */
const fontFor = (lang: string, amiriOk: boolean) =>
  lang === 'ar' && amiriOk ? 'Amiri' : 'helvetica';

/** Prépare un texte pour affichage PDF (shape arabe si nécessaire). */
const T = (s: string | number | null | undefined, lang: string): string => {
  if (s === null || s === undefined) return '';
  const str = String(s);
  if (lang !== 'ar') return str;
  return containsArabic(str) ? shapeArabic(str) : str;
};

const TR = (rows: (string | number | null)[][], lang: string) =>
  rows.map(r => r.map(c => (typeof c === 'string' ? T(c, lang) : c)));

// ===== Dashboard exports =====
export const exportDashboardCsv = (
  ranking: any[],
  lang: string,
  t: (k: string) => string,
) => {
  const header = [
    t('dashboard.rank'),
    t('dashboard.direction'),
    'Code',
    t('dashboard.score'),
    t('detail.beneficiaries'),
    t('detail.associations'),
    t('detail.conventions'),
    t('detail.clubs'),
    t('detail.camping'),
    t('detail.festivals'),
    t('dashboard.completeness') + ' (%)',
    'Statut',
    t('dashboard.lastUpdate'),
  ];
  const rows = ranking.map((r, i) => [
    i + 1,
    getPrefName(r.pref, lang),
    r.pref.code,
    Number(r.global_score).toFixed(1),
    r.total,
    r.perm_associations ?? 0,
    r.perm_conventions ?? 0,
    r.perm_clubs ?? 0,
    r.camping_participants ?? 0,
    r.festivals_participants ?? 0,
    Number(r.completeness_pct).toFixed(0),
    t(`status.${r.status}`),
    formatDate(r.submitted_at, lang),
  ]);
  downloadCsv([header, ...rows], `drj-cs-tableau-de-bord-2025.csv`);
};

export const exportDashboardPdf = (
  ranking: any[],
  kpis: { label: string; value: string }[],
  lang: string,
  t: (k: string) => string,
) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const isAr = lang === 'ar';
  const amiriOk = isAr ? ensureAmiri(doc) : false;
  const font = fontFor(lang, amiriOk);

  // Header bar
  doc.setFillColor(20, 83, 45);
  doc.rect(0, 0, pageWidth, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont(font, 'bold');
  doc.setFontSize(14);
  doc.text(T(isAr ? 'المديرية الجهوية للشباب الدار البيضاء سطات' : 'DRJ Casablanca-Settat', lang), 14, 10);
  doc.setFont(font, 'normal');
  doc.setFontSize(10);
  doc.text(T(t('dashboard.title') + ' - 2025', lang), 14, 17);

  doc.setTextColor(120, 120, 120);
  doc.setFontSize(8);
  doc.text(new Date().toLocaleString(isAr ? 'ar-MA' : 'fr-FR'), pageWidth - 14, 10, { align: 'right' });

  // KPI grid
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.setFont(font, 'bold');
  doc.text(T(isAr ? 'مؤشرات رئيسية' : 'Indicateurs cles', lang), 14, 32);

  const cardW = (pageWidth - 28 - 7 * 3) / 4;
  const cardH = 18;
  let cx = 14;
  let cy = 36;
  kpis.forEach((k, i) => {
    if (i > 0 && i % 4 === 0) {
      cx = 14;
      cy += cardH + 4;
    }
    doc.setFillColor(245, 247, 245);
    doc.roundedRect(cx, cy, cardW, cardH, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 110);
    doc.setFont(font, 'normal');
    doc.text(T(k.label, lang), cx + 4, cy + 6, { maxWidth: cardW - 8 });
    doc.setFontSize(13);
    doc.setTextColor(20, 83, 45);
    doc.setFont(font, 'bold');
    doc.text(T(k.value, lang), cx + 4, cy + 14);
    cx += cardW + 7;
  });

  const tableY = cy + cardH + 8;

  autoTable(doc, {
    startY: tableY,
    head: [TR([[
      '#',
      t('dashboard.direction'),
      t('dashboard.score'),
      t('detail.beneficiaries'),
      t('detail.associations'),
      t('detail.conventions'),
      t('detail.clubs'),
      t('dashboard.completeness') + ' %',
      'Statut',
    ]], lang)[0]],
    body: TR(ranking.map((r, i) => [
      i + 1,
      getPrefName(r.pref, lang),
      Number(r.global_score).toFixed(1),
      formatNumber(r.total, lang),
      r.perm_associations ?? 0,
      r.perm_conventions ?? 0,
      r.perm_clubs ?? 0,
      Number(r.completeness_pct).toFixed(0),
      t(`status.${r.status}`),
    ]), lang),
    headStyles: { fillColor: [20, 83, 45], textColor: 255, fontSize: 9, font, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9, font, fontStyle: 'normal' },
    alternateRowStyles: { fillColor: [248, 250, 248] },
    styles: { cellPadding: 2, font },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont(font, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      T(isAr
        ? `المديرية الجهوية للشباب الدار البيضاء سطات - صفحة ${i}/${pageCount}`
        : `Direction Regionale Jeunesse Casablanca-Settat - Page ${i}/${pageCount}`, lang),
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 6,
      { align: 'center' },
    );
  }

  doc.save('drj-cs-tableau-de-bord-2025.pdf');
};

// ===== Direction detail exports =====
export const exportDirectionCsv = (pref: any, sub: any, lang: string, t: (k: string) => string) => {
  const total = computeTotalBeneficiaries(sub);
  const rows: (string | number)[][] = [
    ['Direction', getPrefName(pref, lang)],
    ['Code', pref.code],
    [t('detail.globalScore'), Number(sub.global_score).toFixed(1)],
    [t('detail.completenessRate') + ' (%)', Number(sub.completeness_pct).toFixed(0)],
    [t('detail.totalBeneficiaries'), total],
    ['Statut', t(`status.${sub.status}`)],
    [t('dashboard.lastUpdate'), formatDate(sub.submitted_at, lang)],
    [],
    [`== ${t('detail.permanent')} ==`],
    [t('detail.associations'), sub.perm_associations ?? 0],
    [t('detail.conventions'), sub.perm_conventions ?? 0],
    [t('detail.clubs'), sub.perm_clubs ?? 0],
    [t('detail.educative'), sub.perm_educative ?? 0],
    [t('detail.cultural'), sub.perm_cultural ?? 0],
    [t('detail.sportive'), sub.perm_sportive ?? 0],
    [t('detail.capacity'), sub.perm_capacity ?? 0],
    [],
    [`== ${t('detail.outreach')} ==`],
    [t('detail.educative'), sub.outreach_educative ?? 0],
    [t('detail.cultural'), sub.outreach_cultural ?? 0],
    [t('detail.sportive'), sub.outreach_sportive ?? 0],
    [t('detail.capacity'), sub.outreach_capacity ?? 0],
    [],
    [`== ${t('detail.camping')} ==`],
    [t('detail.associations'), sub.camping_associations ?? 0],
    [t('detail.participants'), sub.camping_participants ?? 0],
    [t('detail.female'), sub.camping_female ?? 0],
    [t('detail.male'), sub.camping_male ?? 0],
    [t('detail.rural'), sub.camping_rural ?? 0],
    [t('detail.urban'), sub.camping_urban ?? 0],
    [t('detail.facilitators'), sub.camping_facilitators ?? 0],
    [t('detail.trainings'), sub.camping_trainings ?? 0],
    [],
    [`== ${t('detail.festivals')} ==`],
    ['Nb festivals', sub.festivals_count ?? 0],
    [t('detail.participants'), sub.festivals_participants ?? 0],
    [t('detail.qualified'), sub.festivals_qualified ?? 0],
    [],
    [`== ${t('detail.integration')} ==`],
    [t('detail.trainings'), sub.integration_trainings ?? 0],
    [t('detail.beneficiaries'), sub.integration_beneficiaries ?? 0],
    [t('detail.partners'), sub.integration_partners ?? 0],
    [],
    [`== ${t('detail.institutions')} ==`],
    [t('detail.updated'), sub.inst_updated ?? 0],
    [t('detail.inProgress'), sub.inst_in_progress ?? 0],
    [t('detail.dispute'), sub.inst_dispute ?? 0],
    [t('detail.rehabNeeds'), sub.inst_rehab_needs ?? 0],
  ];
  downloadCsv(rows, `drj-cs-${pref.code.toLowerCase()}-2025.csv`);
};

export const exportDirectionPdf = (pref: any, sub: any, lang: string, t: (k: string) => string) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const total = computeTotalBeneficiaries(sub);
  const isAr = lang === 'ar';
  const amiriOk = isAr ? ensureAmiri(doc) : false;
  const font = fontFor(lang, amiriOk);

  // Header
  doc.setFillColor(20, 83, 45);
  doc.rect(0, 0, pageWidth, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont(font, 'normal');
  doc.setFontSize(11);
  doc.text(T(isAr ? 'المديرية الجهوية للشباب - بطاقة المديرية الإقليمية' : 'DRJ Casablanca-Settat - Fiche direction prefectorale', lang), 14, 10);
  doc.setFont(font, 'bold');
  doc.setFontSize(18);
  doc.text(T(getPrefName(pref, lang), lang), 14, 20);
  doc.setFont(font, 'normal');
  doc.setFontSize(10);
  doc.text(T(`Code: ${pref.code}  |  ${t('common.year')} 2025  |  ${t(`status.${sub.status}`)}`, lang), 14, 27);

  // Stats grid
  let y = 42;
  const statW = (pageWidth - 28 - 8) / 3;
  const stats = [
    { label: t('detail.globalScore'), value: Number(sub.global_score).toFixed(1) },
    { label: t('detail.completenessRate'), value: Number(sub.completeness_pct).toFixed(0) + '%' },
    { label: t('detail.totalBeneficiaries'), value: formatNumber(total, lang) },
  ];
  stats.forEach((s, i) => {
    const x = 14 + i * (statW + 4);
    doc.setFillColor(245, 247, 245);
    doc.roundedRect(x, y, statW, 22, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 110);
    doc.setFont(font, 'normal');
    doc.text(T(s.label, lang), x + 4, y + 7, { maxWidth: statW - 8 });
    doc.setFontSize(15);
    doc.setTextColor(20, 83, 45);
    doc.setFont(font, 'bold');
    doc.text(T(s.value, lang), x + 4, y + 17);
    doc.setFont(font, 'normal');
  });

  y += 30;

  const sections: { title: string; rows: [string, any][] }[] = [
    {
      title: t('detail.permanent'),
      rows: [
        [t('detail.associations'), sub.perm_associations],
        [t('detail.conventions'), sub.perm_conventions],
        [t('detail.clubs'), sub.perm_clubs],
        [t('detail.educative'), sub.perm_educative],
        [t('detail.cultural'), sub.perm_cultural],
        [t('detail.sportive'), sub.perm_sportive],
        [t('detail.capacity'), sub.perm_capacity],
      ],
    },
    {
      title: t('detail.outreach'),
      rows: [
        [t('detail.educative'), sub.outreach_educative],
        [t('detail.cultural'), sub.outreach_cultural],
        [t('detail.sportive'), sub.outreach_sportive],
        [t('detail.capacity'), sub.outreach_capacity],
      ],
    },
    {
      title: t('detail.camping'),
      rows: [
        [t('detail.associations'), sub.camping_associations],
        [t('detail.participants'), sub.camping_participants],
        [t('detail.female'), sub.camping_female],
        [t('detail.male'), sub.camping_male],
        [t('detail.rural'), sub.camping_rural],
        [t('detail.urban'), sub.camping_urban],
        [t('detail.facilitators'), sub.camping_facilitators],
        [t('detail.trainings'), sub.camping_trainings],
      ],
    },
    {
      title: t('detail.festivals'),
      rows: [
        [isAr ? 'عدد المهرجانات' : 'Nb festivals', sub.festivals_count],
        [t('detail.participants'), sub.festivals_participants],
        [t('detail.qualified'), sub.festivals_qualified],
      ],
    },
    {
      title: t('detail.integration'),
      rows: [
        [t('detail.trainings'), sub.integration_trainings],
        [t('detail.beneficiaries'), sub.integration_beneficiaries],
        [t('detail.partners'), sub.integration_partners],
      ],
    },
    {
      title: t('detail.institutions'),
      rows: [
        [t('detail.updated'), sub.inst_updated],
        [t('detail.inProgress'), sub.inst_in_progress],
        [t('detail.dispute'), sub.inst_dispute],
        [t('detail.rehabNeeds'), sub.inst_rehab_needs],
      ],
    },
  ];

  sections.forEach((section) => {
    autoTable(doc, {
      startY: y,
      head: [[T(section.title, lang), T(isAr ? 'القيمة' : 'Valeur', lang)]],
      body: section.rows.map(([k, v]) => [T(k, lang), formatNumber(Number(v ?? 0), lang)]),
      headStyles: { fillColor: [20, 83, 45], textColor: 255, fontSize: 9, font, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9, font, fontStyle: 'normal' },
      alternateRowStyles: { fillColor: [248, 250, 248] },
      styles: { cellPadding: 2, font },
      columnStyles: { 1: { halign: 'right', cellWidth: 40 } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 4;
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont(font, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      T(isAr
        ? `${getPrefName(pref, lang)} - صفحة ${i}/${pageCount}`
        : `DRJ Casablanca-Settat - ${getPrefName(pref, lang)} - Page ${i}/${pageCount}`, lang),
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 6,
      { align: 'center' },
    );
  }

  doc.save(`drj-cs-${pref.code.toLowerCase()}-2025.pdf`);
};
