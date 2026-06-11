import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import "./i18n";

import Index                 from "./pages/Index.tsx";
import Auth                from "./pages/Auth.tsx";
import ForgotPassword      from "./pages/ForgotPassword.tsx";
import ResetPassword       from "./pages/ResetPassword.tsx";
import RegionDashboard     from "./pages/RegDomainDashboard.tsx";
import Directions          from "./pages/Directions.tsx";
import DirectionDetail     from "./pages/DirectionDetail.tsx";
import RegionMapPage       from "./pages/RegionMapPage.tsx";
import DomainDashboard     from "./pages/DomainDashboard.tsx";
import DirectionDomainDetail from "./pages/DirectionDomainDetail.tsx";
import Saisie              from "./pages/Saisie.tsx";
import ImportExcel         from "./pages/ImportExcel.tsx";
import NotFound            from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* ── Public ── */}
            <Route path="/"                      element={<Index />} />
            <Route path="/auth"                  element={<Auth />} />
            <Route path="/forgot-password"       element={<ForgotPassword />} />
            <Route path="/reset-password"        element={<ResetPassword />} />
            
            {/* ── Protected ── */}
            {/* توجيه تلقائي من Vue d'ensemble إلى صفحة المجالات الجديدة */}
            <Route path="/dashboard"             element={<Navigate to="/domain-dashboard" replace />} />
            
            <Route path="/region-dashboard"      element={<ProtectedRoute><RegionDashboard /></ProtectedRoute>} />
            <Route path="/directions"            element={<ProtectedRoute><Directions /></ProtectedRoute>} />
            <Route path="/directions/:id"        element={<ProtectedRoute><DirectionDetail /></ProtectedRoute>} />
            <Route path="/carte"                 element={<ProtectedRoute><RegionMapPage /></ProtectedRoute>} />
            <Route path="/domain-dashboard"      element={<ProtectedRoute><DomainDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/direction/:id" element={<ProtectedRoute><DirectionDomainDetail /></ProtectedRoute>} />
            <Route path="/saisie"                element={<ProtectedRoute><Saisie /></ProtectedRoute>} />
            <Route path="/import"                element={<ProtectedRoute><ImportExcel /></ProtectedRoute>} />

            <Route path="*"                      element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;