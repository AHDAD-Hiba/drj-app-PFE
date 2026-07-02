import { useAuth } from '@/hooks/useAuth';
import PrefDomainDashboard from './PrefDomainDashboard';
import RegDomainDashboard from './RegDomainDashboard';
import { Loader2 } from 'lucide-react';

const DomainDashboard = () => {
  const { isRegional, isPrefectoral, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // التوجيه الذاتي (Le Routage Interne)
  if (isRegional) {
    return <RegDomainDashboard />;
  }

  if (isPrefectoral) {
    return <PrefDomainDashboard />;
  }

  // إيلا كان Admin مثلاً، نعطيوه حتى هو ديال الجهة أو لي بغيتي
  return <RegDomainDashboard />;
};

export default DomainDashboard;