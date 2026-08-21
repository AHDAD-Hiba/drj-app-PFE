import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, AppRole } from '@/hooks/common/useAuth';
import { Loader2, ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, utilisateur, loading, roleRedirectPath } = useAuth();

  // 1. Écran de chargement pendant la vérification Auth/Profil
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 2. Si l'utilisateur n'est pas connecté -> Redirection vers /auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const userRole = utilisateur?.role;

  // 3. CONTRÔLE D'ACCÈS BASÉ SUR LES RÔLES (RBAC)
  // Fonctionne désormais pour TOUS les rôles : 'admin', 'directeur_regional', etc.
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md border border-gray-200">
          <ShieldAlert className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès Non Autorisé</h2>
          <p className="text-gray-600 mb-6">
            Votre rôle (<strong className="capitalize">{userRole.replace('_', ' ')}</strong>) ne vous permet pas d'accéder à cette page.
          </p>
          <a 
            href={roleRedirectPath}
            className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors w-full font-medium"
          >
            Retour à votre espace
          </a>
        </div>
      </div>
    );
  }

  // 4. Accès accordé
  return <>{children}</>;
};