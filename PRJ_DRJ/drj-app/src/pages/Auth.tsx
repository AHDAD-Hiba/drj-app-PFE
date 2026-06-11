import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Brand, BrandMark } from '@/components/Brand';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';

const Auth = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, utilisateur, loading: authLoading, roleRedirectPath } = useAuth();

  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [loading, setLoading]           = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');


  useEffect(() => {
  // 2. كنوجهوه فقط ملي يكون user كاين، و utilisateur (البروفايل ديالو) حتى هو كاين
  if (!authLoading && user && utilisateur) {
    navigate(roleRedirectPath, { replace: true });
  }
}, [user, utilisateur, authLoading, navigate, roleRedirectPath]);

  const handleSignIn = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  setLoading(false);
  
  if (authError) {
    const msg = t('auth.errorInvalid');
    setError(msg);
    toast.error(msg);
  } else {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col gradient-soft">
      <header className="flex items-center justify-between px-4 sm:px-8 py-4">
        <Brand compact />
        <LanguageSwitcher />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
          {/* Hero side */}
          <div className="hidden lg:flex flex-col gap-6 p-8">
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight text-foreground">
              {t('app.fullName')}
              <span className="block text-gradient mt-2">Casablanca-Settat</span>
            </h1>
            <p className="text-lg text-muted-foreground">{t('auth.loginSubtitle')}</p>
          </div>

          {/* Form */}
          <Card className="p-6 sm:p-8 shadow-elegant border-border/60 bg-card/95 backdrop-blur animate-scale-in">
            <div className="lg:hidden flex justify-center mb-4">
              <BrandMark size="lg" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">{t('auth.loginTitle')}</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-6">{t('auth.loginSubtitle')}</p>

            <form onSubmit={handleSignIn} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  className="h-11"
                  placeholder="votre@email.ma"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    className="h-11 pe-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? t('common.hide') : t('common.show')}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 gradient-primary hover:opacity-95 text-primary-foreground font-semibold shadow-elegant"
              >
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin me-2" />{t('auth.loading')}</>
                  : t('auth.signIn')
                }
              </Button>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Auth;
