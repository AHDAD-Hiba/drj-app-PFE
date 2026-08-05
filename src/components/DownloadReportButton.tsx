import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DownloadReportButtonProps {
  rapportId: string | null;
  domaineCode?: string;
  disabled?: boolean;
}

export const DownloadReportButton = ({ 
  rapportId, 
  domaineCode = 'infrastructure', 
  disabled 
}: DownloadReportButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!rapportId) return;

    setLoading(true);
    try {
      // 1. Récupération de la session pour inclure le token d'authentification
      const { data: { session } } = await supabase.auth.getSession();
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // 2. Appel direct via fetch pour récupérer un Blob binaire pur
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
          'Authorization': `Bearer ${session?.access_token || anonKey}`,
        },
        body: JSON.stringify({ rapportId, domaineCode }),
      });

      if (!response.ok) {
        let errorMsg = `Erreur serveur HTTP ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson.error) errorMsg = errJson.error;
        } catch {
          /* ignore */
        }
        throw new Error(errorMsg);
      }

      // 3. Récupération directe sous forme de Blob binaire
      const blob = await response.blob();

      // 4. Téléchargement dans le navigateur
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Rapport_${domaineCode}_${new Date().toISOString().slice(0, 10)}.docx`;
      document.body.appendChild(a);
      a.click();
      
      // Nettoyage
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err: any) {
      console.error("Erreur complète :", err);
      alert(`Détail Erreur : ${err.message || 'Impossible de télécharger le rapport'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      type="button"
      onClick={handleDownload} 
      disabled={disabled || loading || !rapportId}
      variant="outline"
      className="gap-2 shadow-sm"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {loading ? 'Génération...' : 'Télécharger (.docx)'}
    </Button>
  );
};