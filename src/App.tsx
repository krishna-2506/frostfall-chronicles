import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthGuard } from "./components/AuthGuard";
import { AppSidebar } from "./components/AppSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "./components/ui/sidebar";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import DsaTracker from "./pages/DsaTracker";
import DsCourse from "./pages/DsCourse";
import Semester from "./pages/Semester";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider>
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <SidebarInset className="flex-1">
        <header className="sticky top-0 z-40 flex h-12 items-center border-b border-border/50 bg-background/95 backdrop-blur px-4">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </SidebarInset>
    </div>
  </SidebarProvider>
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
          <Route path="/dsa" element={<AuthGuard><AppLayout><DsaTracker /></AppLayout></AuthGuard>} />
          <Route path="/ml-course" element={<AuthGuard><AppLayout><DsCourse /></AppLayout></AuthGuard>} />
          <Route path="/semester" element={<AuthGuard><AppLayout><Semester /></AppLayout></AuthGuard>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;