import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/common/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { OfflineBanner } from "@/components/OfflineBanner";
import "./i18n";

import Index               from "./pages/Index";
import Auth                from "./pages/Auth";
import ForgotPassword      from "./pages/ForgotPassword";
import ResetPassword       from "./pages/ResetPassword";
import RegionDashboard     from "./pages/RegDomainDashboard";
import Directions          from "./pages/Directions";
import DirectionDetail     from "./pages/DirectionDetail";
import RegionMapPage       from "./pages/RegionMapPage";
import DomainDashboard     from "./pages/DomainDashboard";
import Saisie              from "./pages/Saisie";
import NotFound            from "./pages/NotFound";
import ProvincialReports   from './pages/ProvincialReports';
import UsersAdmin          from './pages/UsersAdmin';
import EtablissementsAdmin from './pages/EtablissementsAdmin';
import AuditAdmin          from './pages/AuditAdmin';
import { AuditDashboard, useAuditToggle } from "@/SupabaseAuditDashboard";
import { auditStats } from "@/integrations/supabase/client";

// Configuration optimisée de React Query pour la résilience réseau
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

const AppWithAudit = () => {
  const { isVisible } = useAuditToggle();

  return (
    <>
      <Routes>
        {/* ── Routes Publiques ── */}
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* ── 1. Espace Équipe Régionale ── */}
        <Route 
          path="/regional-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['equipe_regional']}>
              <ProvincialReports />
            </ProtectedRoute>
          } 
        />

        {/* ── 2. Espace Directeur Régional ── */}
        <Route 
          path="/region-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['directeur_regional']}>
              <RegionDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/directions" 
          element={
            <ProtectedRoute allowedRoles={['directeur_regional']}>
              <Directions />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/directions/:id" 
          element={
            <ProtectedRoute allowedRoles={['directeur_regional']}>
              <DirectionDetail />
            </ProtectedRoute>
          } 
        />

        {/* ── 3. Initialisation de Saisie ── */}
        <Route 
          path="/saisie" 
          element={
            <ProtectedRoute allowedRoles={['directeur_prefectoral', 'equipe_regional']}>
              <Saisie />
            </ProtectedRoute>
          } 
        />

        {/* ── 4. Consultation/Édition d'un Rapport Précis (Préfectoral + Consultation Équipe Régionale) ── */}
        <Route 
          path="/saisie/:rapportId" 
          element={
            <ProtectedRoute allowedRoles={['directeur_prefectoral', 'equipe_regional']}>
              <Saisie />
            </ProtectedRoute>
          } 
        />

        {/* ── 5. Tableaux de bord Préfectoraux (Préfectoral + Régional) ── */}
        <Route 
          path="/domain-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['directeur_prefectoral', 'directeur_regional']}>
              <DomainDashboard />
            </ProtectedRoute>
          } 
        />

        {/* ── 6. Carte Interactive (Préfectoral + Régional) ── */}
        <Route 
          path="/carte" 
          element={
            <ProtectedRoute allowedRoles={['directeur_prefectoral', 'directeur_regional']}>
              <RegionMapPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UsersAdmin />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin/etablissements" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <EtablissementsAdmin />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin/audit" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AuditAdmin />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <AuditDashboard auditData={auditStats} isVisible={isVisible} />
    </>
  );
};
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <OfflineBanner />
          <AppWithAudit />  {/* ← utilise le wrapper */}
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;