import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { Chatbot } from "./components/Chatbot";
import Landing from "./pages/Landing";
import SiteAnalysisComplete from "./pages/SiteAnalysisComplete";
import PlanningDashboard from "./pages/PlanningDashboard";
import PlantingDashboard from "./pages/PlantingDashboard";
import MonitoringDashboard from "./pages/MonitoringDashboard";
import PredictionDashboard from "./pages/PredictionDashboard";
import InterventionDashboard from "./pages/InterventionDashboard";
import ReportingDashboard from "./pages/ReportingDashboard";
import LandHealthAnalytics from "./pages/LandHealthAnalytics";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
      <Toaster />
      <Sonner />
      <Chatbot />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/site-analysis" element={<SiteAnalysisComplete />} />
          <Route path="/planning" element={<PlanningDashboard />} />
          <Route path="/planting" element={<PlantingDashboard />} />
          <Route path="/monitoring" element={<MonitoringDashboard />} />
          <Route path="/prediction" element={<PredictionDashboard />} />
          <Route path="/intervention" element={<InterventionDashboard />} />
          <Route path="/reporting" element={<ReportingDashboard />} />
          <Route path="/land-health" element={<LandHealthAnalytics />} />
          <Route path="/dashboard" element={<Index />} />
          <Route path="/management" element={<MonitoringDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
