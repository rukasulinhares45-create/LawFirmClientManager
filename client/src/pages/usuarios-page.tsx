import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Plus, Shield, UserCog } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "@shared/schema";
import { UsuarioFormDialog } from "@/components/usuario-form-dialog";
import { StatusDocumentosManager } from "@/components/status-documentos-manager";
import { Switch } from "@/components/ui/switch";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function UsuariosPage() {
  const [showNewUserDialog, setShowNewUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();

  const { data: usuarios, isLoading } = useQuery<User[]>({
    queryKey: ["/api/usuarios"],
  });

  const toggleAtivoMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const res = await apiRequest("PATCH", `/api/usuarios/${id}/toggle-ativo`, { ativo });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/usuarios"] });
      toast({
        title: "Status atualizado",
        description: "Status do usuário atualizado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gerenciamento de Usuários"
        description="Gerencie usuários e permissões do sistema"
        action={
          <Button onClick={() => setShowNewUserDialog(true)} data-testid="button-novo-usuario">
            <Plus className="mr-2 h-4 w-4" />
            Novo Usuário
          </Button>
        }
      />

      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : usuarios && usuarios.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((usuario) => (
                  <TableRow key={usuario.id} data-testid={`row-usuario-${usuario.id}`}>
                    <TableCell className="font-medium">{usuario.nome}</TableCell>
                    <TableCell className="font-mono text-sm">{usuario.username}</TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>
                      <Badge variant={usuario.role === "admin" ? "default" : "secondary"}>
                        {usuario.role === "admin" ? (
                          <><Shield className="mr-1 h-3 w-3" /> Administrador</>
                        ) : (
                          <><UserCog className="mr-1 h-3 w-3" /> Usuário</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {usuario.ultimoAcesso
                        ? formatDistanceToNow(new Date(usuario.ultimoAcesso), {
                            addSuffix: true,
                            locale: ptBR,
                          })
                        : "Nunca"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={usuario.ativo}
                          onCheckedChange={(checked) =>
                            toggleAtivoMutation.mutate({ id: usuario.id, ativo: checked })
                          }
                          disabled={toggleAtivoMutation.isPending}
                          data-testid={`switch-ativo-${usuario.id}`}
                        />
                        <span className="text-sm text-muted-foreground">
                          {usuario.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedUser(usuario)}
                        data-testid={`button-edit-${usuario.id}`}
                      >
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Shield className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">Nenhum usuário encontrado</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Comece criando o primeiro usuário do sistema
              </p>
              <Button
                className="mt-4"
                onClick={() => setShowNewUserDialog(true)}
                data-testid="button-novo-usuario-empty"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <UsuarioFormDialog
        open={showNewUserDialog || !!selectedUser}
        onOpenChange={(open) => {
          if (!open) {
            setShowNewUserDialog(false);
            setSelectedUser(null);
          }
        }}
        usuario={selectedUser || undefined}
      />

      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Status de Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusDocumentosManager />
        </CardContent>
      </Card>
    </div>
  );
}
