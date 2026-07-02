import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, XCircle, LogOut } from 'lucide-react'; // <-- زدت LogOut باش نديرو أيكون فالبوطون
import { supabase } from '@/integrations/supabase/client'; // <-- ضروري نعيطو لـ supabase باش نديرو signout

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, utilisateur, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 1. Si pas connecté, retour à la page de connexion
  if (!user) return <Navigate to="/auth" replace />;

  // 2. BLOCAGE DE L'ADMINISTRATEUR TECHNIQUE 
  if ((utilisateur?.role as string) === 'admin') {
    
    // هاد الفانكشن هي لي غاتحل المشكل، كتمسح الـ session وكتردنا لصفحة الدخول
    const handleLogout = async () => {
      await supabase.auth.signOut();
    };

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md border border-gray-200">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès Interface Refusé</h2>
          <p className="text-gray-600 mb-6">
            Votre compte dispose de privilèges d'administration technique. 
            Vous n'avez pas d'interface dédiée sur le client web. 
            Veuillez gérer l'infrastructure directement depuis la console Supabase.
          </p>
          
          {/* زدنا هاد البوطونة باش يقدر يدير تسجيل الخروج ويرجع لـ /auth */}
          <button 
            onClick={handleLogout}
            className="inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors w-full font-medium"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Retour à la connexion
          </button>

        </div>
      </div>
    );
  }

  // 3. Si c'est un directeur, on affiche la route normale
  return <>{children}</>;
};