import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const LanguageSwitcher = ({ variant = 'default' }: { variant?: 'default' | 'minimal' }) => {
  const { i18n } = useTranslation();
  const toggle = () => i18n.changeLanguage(i18n.language === 'fr' ? 'ar' : 'fr');
  const next = i18n.language === 'fr' ? 'العربية' : 'Français';

  if (variant === 'minimal') {
    return (
      <button
        onClick={toggle}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth"
      >
        <Languages className="h-4 w-4" />
        {next}
      </button>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={toggle} className="gap-2">
      <Languages className="h-4 w-4" />
      <span className="font-semibold">{next}</span>
    </Button>
  );
};
