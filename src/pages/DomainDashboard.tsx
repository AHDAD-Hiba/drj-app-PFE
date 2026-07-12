import { useAuth } from '@/hooks/common/useAuth';
import { Navigate } from "react-router-dom";
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

  // (Le Routage Interne)
  if (isRegional) {
    return <RegDomainDashboard />;
 }
 
 if (isPrefectoral) {
    return <PrefDomainDashboard />;
 }
 
 return <Navigate to="/auth" replace />;
};

export default DomainDashboard;