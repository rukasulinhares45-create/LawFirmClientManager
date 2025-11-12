import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/components/theme-provider";
import { ProtectedRoute } from "@/lib/protected-route";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import ClientesPage from "@/pages/clientes-page";
import DocumentosPage from "@/pages/documentos-page";
import EditorPage from "@/pages/editor-page";
import UsuariosPage from "@/pages/usuarios-page";
import LogsPage from "@/pages/logs-page";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/clientes" component={ClientesPage} />
      <ProtectedRoute path="/documentos" component={DocumentosPage} />
      <ProtectedRoute path="/editor" component={EditorPage} />
      <ProtectedRoute path="/usuarios" component={UsuariosPage} />
      <ProtectedRoute path="/logs" component={LogsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <AuthProvider>
            <SidebarProvider style={style as React.CSSProperties}>
              <div className="flex h-screen w-full">
                <AppSidebar />
                <div className="flex flex-1 flex-col overflow-hidden">
                  <header className="flex items-center justify-between border-b p-4">
                    <SidebarTrigger data-testid="button-sidebar-toggle" />
                    <ThemeToggle />
                  </header>
                  <main className="flex-1 overflow-auto">
                    <div className="container mx-auto max-w-7xl p-6">
                      <Router />
                    </div>
                  </main>
                </div>
              </div>
            </SidebarProvider>
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
