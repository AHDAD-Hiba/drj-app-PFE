import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DownloadReportButtonProps {
  rapportId?: string | null;
  annee?: string | number | null;
  mode?: 'trimestriel' | 'annuel';
  domaineCode?: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const DownloadReportButton = ({ 
  rapportId, 
  annee,
  mode = 'trimestriel',
  domaineCode = 'infrastructure', 
  disabled,
  variant = 'outline',
  size = 'default',
  className = '',
}: DownloadReportButtonProps) => {
  const [loading, setLoading] = useState(false);
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const handleDownload = async () => {
    // En mode trimestriel il faut rapportId, en mode annuel il faut au moins rapportId OU annee
    if (mode === 'trimestriel' && !rapportId) return;
    if (mode === 'annuel' && !rapportId && !annee) return;

    setLoading(true);
    try {
      // 1. Récupération de la session pour inclure le token d'authentification
      const { data: { session } } = await supabase.auth.getSession();
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // 2. Appel direct via fetch vers l'Edge Function
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
          'Authorization': `Bearer ${session?.access_token || anonKey}`,
        },
        // 🆕 Transmission explicite du MODE (trimestriel/annuel), de l'année et du rapportId
        body: JSON.stringify({ 
          rapportId, 
          annee: String(annee || ''),
          mode,
          domaineCode 
        }),
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

      // 3. Extraction du nom de fichier transmis par l'Edge Function dans les headers
      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = mode === 'annuel' 
        ? `Rapport_Annuel_${annee || 'Consolide'}.docx` 
        : `Rapport_Global.docx`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) {
          fileName = match[1];
        }
      }

      // 4. Conversion et Téléchargement du Blob binaire
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Nettoyage
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err: any) {
      console.error("Erreur téléchargement rapport :", err);
      alert(isAr 
        ? `خطأ: ${err.message || 'تعذر تحميل التقرير'}` 
        : `Détail Erreur : ${err.message || 'Impossible de télécharger le rapport'}`);
    } finally {
      setLoading(false);
    }
  };

  // Libellé du bouton selon le mode et la langue
  const getButtonText = () => {
    if (loading) {
      return isAr ? 'جاري التوليد...' : 'Génération...';
    }
    if (mode === 'annuel') {
      return isAr ? 'تحميل التقرير السنوي (.docx)' : 'Rapport Annuel (.docx)';
    }
    return isAr ? 'تحميل التقرير (.docx)' : 'Télécharger (.docx)';
  };

  return (
    <Button 
      type="button"
      onClick={handleDownload} 
      disabled={disabled || loading || (mode === 'trimestriel' ? !rapportId : (!rapportId && !annee))}
      variant={variant}
      size={size}
      className={`gap-2 shadow-sm ${className}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : mode === 'annuel' ? (
        <Calendar className="h-4 w-4 text-primary" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {getButtonText()}
    </Button>
  );
};