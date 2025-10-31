import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthGuard } from "./components/AuthGuard";
import { Header } from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Missions from "./pages/Missions";
import Semester from "./pages/Semester";
import XpLog from "./pages/XpLog";
import GlowUp from "./pages/GlowUp";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <Header />
    {children}
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<AuthGuard><AppLayout><Dashboard /></AppLayout></AuthGuard>} />
          <Route path="/missions" element={<AuthGuard><AppLayout><Missions /></AppLayout></AuthGuard>} />
          <Route path="/semester" element={<AuthGuard><AppLayout><Semester /></AppLayout></AuthGuard>} />
          <Route path="/xp-log" element={<AuthGuard><AppLayout><XpLog /></AppLayout></AuthGuard>} />
          <Route path="/glow-up" element={<AuthGuard><AppLayout><GlowUp /></AppLayout></AuthGuard>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
