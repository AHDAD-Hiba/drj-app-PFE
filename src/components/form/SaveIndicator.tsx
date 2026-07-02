import { useTranslation } from 'react-i18next';
import { Cloud, CloudOff, Loader2, CheckCircle2 } from 'lucide-react';
import type { SaveState } from '@/hooks/useDraftSubmission';
import { cn } from '@/lib/utils';

interface Props {
  state: SaveState;
  lastSavedAt: Date | null;
  errorMsg?: string | null;
}

export const SaveIndicator = ({ state, lastSavedAt, errorMsg }: Props) => {
  const { t, i18n } = useTranslation();

  const fmt = (d: Date) =>
  new Intl.DateTimeFormat(
    i18n.language === 'ar' ? 'ar-MA' : 'fr-FR',
    {
      timeZone: 'Africa/Casablanca',
      hour: '2-digit',
      minute: '2-digit',
    }
  ).format(d);

  if (state === 'saving') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {t('form.save.saving')}
      </span>
    );
  }
  if (state === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-destructive" title={errorMsg ?? ''}>
        <CloudOff className="h-3.5 w-3.5" />
        {t('form.save.error')}
      </span>
    );
  }
  if (state === 'saved' && lastSavedAt) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-success">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {t('form.save.savedJustNow')}
      </span>
    );
  }
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs text-muted-foreground')}>
      <Cloud className="h-3.5 w-3.5" />
      {lastSavedAt
        ? t('form.save.savedAt', { time: fmt(lastSavedAt) })
        : t('form.save.notYetSaved')}
    </span>
  );
};