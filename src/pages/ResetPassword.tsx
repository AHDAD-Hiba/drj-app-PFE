import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Brand } from '@/components/Brand';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword]         = useState('');
  const [confirm, setConfirm]           = useState('');
  const [showPwd, setShowPwd]           = useState(false);
  const [showCfm, setShowCfm]           = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setSessionReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('8 caractères minimum.'); return; }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return; }

    setLoading(true);
    const { error: upErr } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (upErr) {
      setError('Lien expiré ou invalide. Recommencez depuis "Mot de passe oublié".');
      toast.error('Erreur lors de la mise à jour.');
    } else {
      toast.success('Mot de passe mis à jour !');
      await supabase.auth.signOut();
      navigate('/auth', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col gradient-soft">
      <header className="flex items-center justify-between px-4 sm:px-8 py-4">
        <Brand compact />
        <LanguageSwitcher />
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <Card className="p-6 sm:p-8 shadow-elegant border-border/60 bg-card/95 backdrop-blur animate-scale-in">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-primary/10 p-3">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground text-center">Nouveau mot de passe</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-6 text-center">
              Choisissez un mot de passe sécurisé (8 caractères minimum).
            </p>

            {!sessionReady ? (
              <div className="flex flex-col items-center gap-3 py-4 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-sm">Vérification du lien…</p>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="pwd">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Input id="pwd" type={showPwd ? 'text' : 'password'} required
                      value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
                      className="h-11 pe-11" placeholder="8 caractères minimum"
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowPwd(s => !s)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cfm">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Input id="cfm" type={showCfm ? 'text' : 'password'} required
                      value={confirm} onChange={e => { setConfirm(e.target.value); setError(''); }}
                      className="h-11 pe-11" placeholder="Répétez le mot de passe"
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowCfm(s => !s)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showCfm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>
                )}
                <Button type="submit" disabled={loading}
                  className="w-full h-11 gradient-primary hover:opacity-95 text-primary-foreground font-semibold shadow-elegant">
                  {loading
                    ? <><Loader2 className="h-4 w-4 animate-spin me-2" />Mise à jour…</>
                    : 'Enregistrer le nouveau mot de passe'
                  }
                </Button>
              </form>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
