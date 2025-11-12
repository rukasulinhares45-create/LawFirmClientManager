import {
  LayoutDashboard,
  Users,
  FileText,
  FileEdit,
  Shield,
  ClipboardList,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function AppSidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const menuItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
      testId: "nav-dashboard",
    },
    {
      title: "Clientes",
      url: "/clientes",
      icon: Users,
      testId: "nav-clientes",
    },
    {
      title: "Documentos",
      url: "/documentos",
      icon: FileText,
      testId: "nav-documentos",
    },
    {
      title: "Editor",
      url: "/editor",
      icon: FileEdit,
      testId: "nav-editor",
    },
  ];

  const adminItems = [
    {
      title: "Usuários",
      url: "/usuarios",
      icon: Shield,
      testId: "nav-usuarios",
    },
    {
      title: "Logs de Auditoria",
      url: "/logs",
      icon: ClipboardList,
      testId: "nav-logs",
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Shield className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Sistema Jurídico</span>
            <span className="text-xs text-muted-foreground">Gestão de Clientes</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={item.testId}
                  >
                    <a href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user?.role === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={item.testId}
                    >
                      <a href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex flex-col gap-4">
          <Separator />
          <div className="flex items-center justify-between gap-2 px-2">
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-medium" data-testid="text-user-name">
                {user?.nome}
              </span>
              <span className="text-xs text-muted-foreground">
                {user?.role === "admin" ? "Administrador" : "Usuário"}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              data-testid="button-logout"
              aria-label="Sair"
              className="shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
