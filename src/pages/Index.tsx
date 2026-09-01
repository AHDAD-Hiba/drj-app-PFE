import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/common/useAuth";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, loading, roleRedirectPath } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-soft">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <Navigate to={roleRedirectPath} replace />;
};

export default Index;
