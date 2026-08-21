import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
export type AppRole = 'directeur_regional' | 'directeur_prefectoral' | 'equipe_regional' | 'admin';

interface Utilisateur {
  id: string;
  auth_user_id: string;
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
  isAdmin: boolean;
  isRegional: boolean;
  isPrefectoral: boolean;
  isEquipeRegional: boolean;
  roleRedirectPath: string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authInitializing, setAuthInitializing] = useState(true);

  // 1. Écoute dynamique de la session Supabase
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setAuthInitializing(false);
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setAuthInitializing(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // 2. Récupération & Caching du profil Utilisateur avec React Query
  const {
    data: utilisateur = null,
    isLoading: isProfileLoading,
  } = useQuery({
    queryKey: ['utilisateur_profil', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await (supabase as any)
        .from('utilisateurs')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (data && data.est_actif === false) {
        toast.error("Votre compte a été désactivé par l'administrateur.");
        await supabase.auth.signOut();
        throw new Error("Compte désactivé");
      }
      if (error) {
        console.error('[useAuth] Erreur chargement profil utilisateur:', error);
        throw error;
      }

      return (data as Utilisateur) ?? null;
    },
    enabled: Boolean(user?.id), // Ne s'exécute que si un utilisateur Supabase Auth est connecté
    staleTime: Infinity, // Garde le profil en mémoire indéfiniment pendant toute la session
    gcTime: 1000 * 60 * 60 * 24, // 24 heures de rétention dans le cache
    refetchOnWindowFocus: false,
  });

  // 3. Déconnexion avec vidage du cache
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    queryClient.removeQueries({ queryKey: ['utilisateur_profil'] });
  };

  const loading = authInitializing || (Boolean(user) && isProfileLoading);

  const role = utilisateur?.role ?? null;
  const isRegional = role === 'directeur_regional';
  const isPrefectoral = role === 'directeur_prefectoral';
  const isEquipeRegional = role === 'equipe_regional';
  const isAdmin = role === 'admin';

  const roleRedirectPath =
    role === 'equipe_regional'
      ? '/regional-dashboard'
      : role === 'admin'
      ? '/admin/users'
      : role === 'directeur_regional'
      ? '/domain-dashboard'
      : role === 'directeur_prefectoral'
      ? '/saisie'
      : '/auth';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        utilisateur,
        role,
        loading,
        signOut,
        isAdmin,
        isRegional,
        isPrefectoral,
        isEquipeRegional,
        roleRedirectPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};