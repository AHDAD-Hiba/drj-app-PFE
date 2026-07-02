import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import mjccLogo from '@/assets/mjcc-official-logo.jpeg';

export const BrandMark = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const dim = size === 'sm' ? 'h-10 w-10' : size === 'lg' ? 'h-16 w-16' : 'h-12 w-12';
  return (
    <div className={cn('relative flex items-center justify-center rounded-xl bg-white p-1 shadow-elegant ring-1 ring-border', dim)}>
      <img src={mjccLogo} alt="MJCC" className="h-full w-full object-contain" />
    </div>
  );
};

export const Brand = ({ compact = false }: { compact?: boolean }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3">
      <BrandMark size={compact ? 'sm' : 'md'} />
      <div className="flex flex-col leading-tight">
        <span className={cn('font-bold text-foreground', compact ? 'text-sm' : 'text-base')}>
          {t('app.name')}
        </span>
        {!compact && (
          <span className="text-[11px] text-muted-foreground">{t('app.subtitle')}</span>
        )}
      </div>
    </div>
  );
};
