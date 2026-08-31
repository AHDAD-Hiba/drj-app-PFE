import { useTranslation } from 'react-i18next';

export type Submission = any;

export const getPrefName = (pref: { name_fr: string; name_ar: string }, lang: string) =>
  lang === 'ar' ? pref.name_ar : pref.name_fr;

export const computeTotalBeneficiaries = (s: Submission) =>
  (s.perm_educative ?? 0) + (s.perm_cultural ?? 0) + (s.perm_sportive ?? 0) + (s.perm_capacity ?? 0) +
  (s.outreach_educative ?? 0) + (s.outreach_cultural ?? 0) + (s.outreach_sportive ?? 0) + (s.outreach_capacity ?? 0) +
  (s.camping_participants ?? 0) + (s.festivals_participants ?? 0) + (s.integration_beneficiaries ?? 0);

export const usePrefName = () => {
  const { i18n } = useTranslation();
  return (pref: { name_fr: string; name_ar: string }) => getPrefName(pref, i18n.language);
};

export const formatNumber = (n: number, lang: string) =>
  new Intl.NumberFormat(lang === 'ar' ? 'ar-MA' : 'fr-FR').format(n);

export const formatDate = (d: string | null, lang: string) => {
  if (!d) return '—';
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-MA' : 'fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(d));
};
