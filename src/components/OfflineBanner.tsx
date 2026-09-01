import { useOnlineStatus } from "@/hooks/common/useOnlineStatus";

export const OfflineBanner = () => {
  const isOnline = useOnlineStatus();

  // Si tout va bien, on n'affiche rien
  if (isOnline) return null;

  // Si coupure réseau, on affiche la bannière d'alerte
  return (
    <div className="fixed top-0 left-0 w-full bg-red-500 text-white text-center py-2 z-50 shadow-md font-medium text-sm flex items-center justify-center gap-3">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
      </span>
      Connexion Internet perdue. Ne quittez pas cette page, vos données sont en attente de
      synchronisation.
    </div>
  );
};
