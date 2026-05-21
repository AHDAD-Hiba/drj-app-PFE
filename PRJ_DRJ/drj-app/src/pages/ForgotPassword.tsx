import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Brand } from '@/components/Brand';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, MailCheck } from 'lucide-react';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success(t('auth.forgot.sentToast'));
    }
  };

  return (
    <div className="min-h-screen flex flex-col gradient-soft">
      <header className="flex items-center justify-between px-4 sm:px-8 py-4">
        <Brand compact />
        <LanguageSwitcher />
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md p-6 sm:p-8 shadow-elegant border-border/60 bg-card/95 backdrop-blur animate-scale-in">
          <h2 className="text-2xl font-bold text-foreground">{t('auth.forgot.title')}</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-6">{t('auth.forgot.subtitle')}</p>

          {sent ? (
            <div className="flex flex-col items-center text-center gap-3 py-4">
              <div className="h-12 w-12 rounded-full bg-primary-soft text-primary flex items-center justify-center">
                <MailCheck className="h-6 w-6" />
              </div>
              <p className="text-sm text-foreground">{t('auth.forgot.sent')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="h-11" />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-11 gradient-primary text-primary-foreground font-semibold shadow-elegant">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin me-2" />{t('auth.loading')}</> : t('auth.forgot.send')}
              </Button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-border text-center">
            <Link to="/auth" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-smooth">
              <ArrowLeft className="h-3.5 w-3.5" />
              {t('auth.forgot.backToLogin')}
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default ForgotPassword;
