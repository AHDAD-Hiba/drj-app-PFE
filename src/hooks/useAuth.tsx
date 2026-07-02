import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'directeur_regional' | 'directeur_prefectoral';

interface Utilisateur {
  id: string;
  auth_user_id: string;  // ← ajoute cette ligne
  nom: string;
  email: string;
  role: AppRole | null;
  direction_id: string | null;
}
interface AuthContextValue {
  user: User | null;
  session: Session | null;
  utilisateur: Utilisateur | null;
  role: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isRegional: boolean;
  isPrefectoral: boolean;
  roleRedirectPath: string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession]       = useState<Session | null>(null);
  const [user, setUser]             = useState<User | null>(null);
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [loading, setLoading]       = useState(true);

  const fetchUtilisateur = async (userId: string) => {
  const { data, error } = await (supabase as any)
    .from('utilisateurs')
    .select('*')
    .eq('auth_user_id', userId)
    .maybeSingle();

  setUtilisateur((data as Utilisateur) ?? null);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        setTimeout(() => fetchUtilisateur(newSession.user.id), 0);
      } else {
        setUtilisateur(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchUtilisateur(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUtilisateur(null);
  };

  const role           = utilisateur?.role ?? null;
  const isRegional     = role === 'directeur_regional';
  const isPrefectoral  = role === 'directeur_prefectoral';

  const roleRedirectPath =
    role === 'directeur_regional'    ? '/dashboard' :
    role === 'directeur_prefectoral' ? '/saisie'    :
    '/dashboard';

  return (
    <AuthContext.Provider value={{
      user, session, utilisateur, role,
      loading, signOut,
      isRegional, isPrefectoral,
      roleRedirectPath,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
