import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import "./i18n";

import Index                 from "./pages/Index";
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
            <Route path="/dashboard"             element={<Navigate to="/domain-dashboard" replace />} />
            
            <Route path="/region-dashboard"      element={<ProtectedRoute><RegionDashboard /></ProtectedRoute>} />
            <Route path="/directions"            element={<ProtectedRoute><Directions /></ProtectedRoute>} />
            <Route path="/directions/:id"        element={<ProtectedRoute><DirectionDetail /></ProtectedRoute>} />
            <Route path="/carte"                 element={<ProtectedRoute><RegionMapPage /></ProtectedRoute>} />
            <Route path="/domain-dashboard"      element={<ProtectedRoute><DomainDashboard /></ProtectedRoute>} />
            <Route path="/saisie"                element={<ProtectedRoute><Saisie /></ProtectedRoute>} />

            <Route path="*"                      element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;