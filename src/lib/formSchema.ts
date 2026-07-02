/**
 * Schéma du formulaire de saisie annuelle (sections A à I).
 * Mobile-first, calculs auto, validation numérique.
 */
import { SUBMISSION_NUMERIC_FIELDS, type SubmissionNumericField } from './submissionFields';
export type SectionId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I';

export interface FieldDef {
  key: SubmissionNumericField;
  /** Champ calculé automatiquement, non éditable. */
  computed?: (values: Partial<Record<SubmissionNumericField, number>>) => number;
  /** Aide affichée sous le champ. */
  hintFr?: string;
  hintAr?: string;
  /** Libellé court (override si différent du dictionnaire FIELD_LABELS_FR). */
  labelFr?: string;
  labelAr?: string;
}

export interface SectionDef {
  id: SectionId;
  titleFr: string;
  titleAr: string;
  /** Lucide icon name (résolu côté UI). */
  icon: 'Building2' | 'Sparkles' | 'Tent' | 'Trophy' | 'GraduationCap' | 'Landmark' | 'MessageSquare' | 'CheckCircle2' | 'BookOpen';
  fields: FieldDef[];
  /** Clé i18n vers une description courte de la section. */
  descriptionFr?: string;
  descriptionAr?: string;
}

/**
 * Sections A → I.
 * NB : la base actuelle ne contient pas tous les champs détaillés,
 * on s'aligne donc strictement sur SUBMISSION_NUMERIC_FIELDS.
 * Les futures extensions (genre ventilé par activité, etc.) viendront
 * via migration ALTER TABLE + ajout ici.
 */
export const FORM_SECTIONS: SectionDef[] = [
  {
    id: 'A',
    titleFr: 'A. Activités permanentes',
    titleAr: 'أ. الأنشطة الدائمة',
    descriptionFr: 'Activités menées en continu dans les établissements de jeunesse.',
    descriptionAr: 'الأنشطة المنجزة بشكل مستمر داخل مؤسسات الشباب.',
    icon: 'Building2',
    fields: [
      { key: 'perm_associations', labelFr: 'Associations partenaires', labelAr: 'الجمعيات الشريكة' },
      { key: 'perm_conventions', labelFr: 'Conventions signées', labelAr: 'الاتفاقيات الموقعة' },
      { key: 'perm_clubs', labelFr: 'Clubs actifs', labelAr: 'النوادي النشطة' },
      { key: 'perm_educative', labelFr: 'Bénéficiaires – éducatives', labelAr: 'المستفيدون – تربوية' },
      { key: 'perm_cultural', labelFr: 'Bénéficiaires – culturelles', labelAr: 'المستفيدون – ثقافية' },
      { key: 'perm_sportive', labelFr: 'Bénéficiaires – sportives', labelAr: 'المستفيدون – رياضية' },
      { key: 'perm_capacity', labelFr: 'Bénéficiaires – renforcement capacités', labelAr: 'المستفيدون – تعزيز القدرات' },
    ],
  },
  {
    id: 'B',
    titleFr: 'B. Activités rayonnantes',
    titleAr: 'ب. الأنشطة الإشعاعية',
    descriptionFr: 'Activités menées hors les murs (quartiers, écoles, événements).',
    descriptionAr: 'أنشطة خارج المؤسسة (أحياء، مدارس، فعاليات).',
    icon: 'Sparkles',
    fields: [
      { key: 'outreach_educative', labelFr: 'Bénéficiaires – éducatives', labelAr: 'المستفيدون – تربوية' },
      { key: 'outreach_cultural', labelFr: 'Bénéficiaires – culturelles', labelAr: 'المستفيدون – ثقافية' },
      { key: 'outreach_sportive', labelFr: 'Bénéficiaires – sportives', labelAr: 'المستفيدون – رياضية' },
      { key: 'outreach_capacity', labelFr: 'Bénéficiaires – renforcement capacités', labelAr: 'المستفيدون – تعزيز القدرات' },
    ],
  },
  {
    id: 'C',
    titleFr: 'C. Programme camping',
    titleAr: 'ج. برنامج التخييم',
    descriptionFr: 'Camps d’été, ventilés par genre et milieu.',
    descriptionAr: 'مخيمات صيفية موزعة حسب الجنس والوسط.',
    icon: 'Tent',
    fields: [
      { key: 'camping_associations', labelFr: 'Associations partenaires', labelAr: 'الجمعيات الشريكة' },
      {
        key: 'camping_participants',
        labelFr: 'Total participants (calculé)',
        labelAr: 'مجموع المشاركين (محسوب)',
        computed: v => (v.camping_female ?? 0) + (v.camping_male ?? 0),
        hintFr: '= Filles + Garçons',
        hintAr: '= الإناث + الذكور',
      },
      { key: 'camping_female', labelFr: 'Filles', labelAr: 'الإناث' },
      { key: 'camping_male', labelFr: 'Garçons', labelAr: 'الذكور' },
      { key: 'camping_rural', labelFr: 'Rural', labelAr: 'قروي' },
      { key: 'camping_urban', labelFr: 'Urbain', labelAr: 'حضري' },
      { key: 'camping_facilitators', labelFr: 'Encadrants', labelAr: 'مؤطرون' },
      { key: 'camping_trainings', labelFr: 'Formations encadrants', labelAr: 'تكوينات للمؤطرين' },
    ],
  },
  {
    id: 'D',
    titleFr: 'D. Festivals jeunesse',
    titleAr: 'د. مهرجانات الشباب',
    icon: 'Trophy',
    fields: [
      { key: 'festivals_count', labelFr: 'Nombre de festivals', labelAr: 'عدد المهرجانات' },
      { key: 'festivals_participants', labelFr: 'Participants', labelAr: 'المشاركون' },
      { key: 'festivals_qualified', labelFr: 'Jeunes qualifiés', labelAr: 'الشباب المتأهلون' },
    ],
  },
  {
    id: 'E',
    titleFr: 'E. Intégration socio-économique',
    titleAr: 'هـ. الإدماج السوسيو-اقتصادي',
    icon: 'GraduationCap',
    fields: [
      { key: 'integration_trainings', labelFr: 'Formations dispensées', labelAr: 'التكوينات المقدمة' },
      { key: 'integration_beneficiaries', labelFr: 'Bénéficiaires', labelAr: 'المستفيدون' },
      { key: 'integration_partners', labelFr: 'Partenaires mobilisés', labelAr: 'الشركاء المعبَّؤون' },
    ],
  },
  {
    id: 'F',
    titleFr: 'F. État des établissements',
    titleAr: 'و. وضعية المؤسسات',
    descriptionFr: 'Photographie du parc des établissements de jeunesse de la préfecture.',
    descriptionAr: 'صورة عن حالة مؤسسات الشباب بالإقليم.',
    icon: 'Landmark',
    fields: [
      { key: 'inst_updated', labelFr: 'Mises à jour cette année', labelAr: 'محدّثة هذه السنة' },
      { key: 'inst_in_progress', labelFr: 'Travaux en cours', labelAr: 'أشغال قيد الإنجاز' },
      { key: 'inst_dispute', labelFr: 'En litige', labelAr: 'في نزاع' },
      { key: 'inst_rehab_needs', labelFr: 'Besoins de réhabilitation', labelAr: 'تحتاج إعادة تأهيل' },
    ],
  },
];

/** Sections G/H/I : non chiffrées (commentaires + récap + soumission). */
export const META_SECTIONS = {
  G: {
    id: 'G' as const,
    titleFr: 'G. Commentaires & contexte',
    titleAr: 'ز. تعليقات وسياق',
    descriptionFr: 'Précisez les faits marquants, difficultés rencontrées et perspectives 2027.',
    descriptionAr: 'حدّد أبرز الوقائع والصعوبات وآفاق 2027.',
    icon: 'MessageSquare' as const,
  },
  H: {
    id: 'H' as const,
    titleFr: 'H. Récapitulatif',
    titleAr: 'ح. ملخص',
    descriptionFr: 'Vérifiez les totaux calculés automatiquement avant soumission.',
    descriptionAr: 'تحقق من المجاميع المحسوبة تلقائياً قبل الإرسال.',
    icon: 'CheckCircle2' as const,
  },
  I: {
    id: 'I' as const,
    titleFr: 'I. Soumission',
    titleAr: 'ط. الإرسال',
    descriptionFr: 'Confirmez et envoyez votre rapport à l’équipe régionale.',
    descriptionAr: 'أكّد التقرير وأرسله إلى الفريق الجهوي.',
    icon: 'BookOpen' as const,
  },
};

/** Liste exhaustive des champs numériques rangés par section (utile pour reset). */
export const ALL_FORM_FIELDS: SubmissionNumericField[] = FORM_SECTIONS.flatMap(s => s.fields.map(f => f.key));

/** Vérifie qu'aucun champ de la BDD n'a été oublié dans le schéma. */
const missing = SUBMISSION_NUMERIC_FIELDS.filter(f => !ALL_FORM_FIELDS.includes(f));
if (missing.length && import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.warn('[formSchema] Champs BDD non couverts par le formulaire :', missing);
}

/** Validation d'une valeur numérique : entier ≥ 0, < 10 millions. */
export const validateNumericField = (raw: string): { value: number; error: string | null } => {
  if (raw === '' || raw === null || raw === undefined) return { value: 0, error: null };
  const n = Number(String(raw).replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(n)) return { value: 0, error: 'invalid' };
  if (n < 0) return { value: 0, error: 'negative' };
  if (n > 10_000_000) return { value: 0, error: 'tooLarge' };
  if (!Number.isInteger(n)) return { value: Math.round(n), error: null };
  return { value: n, error: null };
};

/** Calcule le pourcentage de complétude (champs > 0 sur total). */
/** Completion is now measured with logical fields, not raw numeric magnitude. */
export interface StepCompletion {
  completedFields: number;
  totalFields: number;
}

export const clampPercentage = (value: number): number =>
  Math.max(0, Math.min(100, Math.round(value)));

export const hasValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

export const hasPositiveNumber = (value: number | null | undefined): boolean =>
  Number(value ?? 0) > 0;

export const hasText = (value?: string | null): boolean =>
  typeof value === 'string' && value.trim().length > 0;

export const countCompleted = (checks: boolean[]): StepCompletion => ({
  completedFields: checks.filter(Boolean).length,
  totalFields: checks.length,
});

/**
 * Completion is based on meaningful filled data, not quantitative totals.
 * Each step contributes completed/total logical fields; numeric magnitudes never
 * increase the weight of a completed section.
 */
export const computeCompleteness = (steps: StepCompletion[]): number => {
  const totals = steps.reduce(
    (acc, step) => ({
      completedFields: acc.completedFields + Math.max(0, step.completedFields),
      totalFields: acc.totalFields + Math.max(0, step.totalFields),
    }),
    { completedFields: 0, totalFields: 0 },
  );

  if (totals.totalFields === 0) return 0;
  return clampPercentage((totals.completedFields / totals.totalFields) * 100);
};

/** Legacy numeric coverage used only by the score formula, not form completion. */
const computeNumericFieldCompleteness = (values: Partial<Record<SubmissionNumericField, number>>): number => {
  const filled = ALL_FORM_FIELDS.filter(k => Number(values[k] ?? 0) > 0).length;
  return Math.round((filled / ALL_FORM_FIELDS.length) * 100);
};

/** Score global pondéré (mêmes pondérations que la formule affichée). */
export const computeGlobalScore = (values: Partial<Record<SubmissionNumericField, number>>): number => {
  const v = (k: SubmissionNumericField) => Number(values[k] ?? 0);
  const volume = v('perm_clubs') * 2 + v('outreach_capacity') + v('festivals_count') * 5 + v('camping_trainings') * 3;
  const benef =
    v('perm_educative') + v('perm_cultural') + v('perm_sportive') + v('perm_capacity') +
    v('outreach_educative') + v('outreach_cultural') + v('outreach_sportive') + v('outreach_capacity') +
    v('camping_participants') + v('festivals_participants') + v('integration_beneficiaries');
  const partners = v('perm_associations') * 3 + v('perm_conventions') * 5 + v('integration_partners') * 4;
  const training = v('integration_trainings') * 5 + v('camping_trainings') * 3;
  const completeness = computeNumericFieldCompleteness(values);
  // Normalisation simple, sortie 0–100
  const raw =
    Math.min(100, volume / 5) * 0.4 +
    Math.min(100, benef / 500) * 0.25 +
    Math.min(100, partners / 5) * 0.15 +
    Math.min(100, training / 5) * 0.1 +
    completeness * 0.1;
  return Math.round(raw * 10) / 10;
};