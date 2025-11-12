import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LogAuditoria } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const acaoLabels: Record<string, string> = {
  login: "Login",
  logout: "Logout",
  criar_cliente: "Criar Cliente",
  editar_cliente: "Editar Cliente",
  excluir_cliente: "Excluir Cliente",
  upload_documento: "Upload de Documento",
  excluir_documento: "Excluir Documento",
  criar_documento_juridico: "Criar Documento Jurídico",
  criar_usuario: "Criar Usuário",
  editar_usuario: "Editar Usuario",
  alterar_senha: "Alterar Senha",
};

export default function LogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [acaoFilter, setAcaoFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: logs, isLoading } = useQuery<LogAuditoria[]>({
    queryKey: ["/api/logs"],
  });

  const filteredLogs = logs?.filter((log) => {
    const matchesSearch =
      log.usuarioNome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.acao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.detalhes?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAcao = acaoFilter === "all" || log.acao === acaoFilter;

    return matchesSearch && matchesAcao;
  });

  const handleExportPDF = () => {
    toast({
      title: "Exportando logs",
      description: "Funcionalidade em desenvolvimento",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Logs de Auditoria"
        description="Histórico de ações realizadas no sistema"
        action={
          <Button variant="outline" onClick={handleExportPDF} data-testid="button-export-logs">
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        }
      />

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-logs"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={acaoFilter} onValueChange={setAcaoFilter}>
                <SelectTrigger className="w-[200px]" data-testid="select-acao-filter">
                  <SelectValue placeholder="Filtrar por ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Ações</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="criar_cliente">Criar Cliente</SelectItem>
                  <SelectItem value="editar_cliente">Editar Cliente</SelectItem>
                  <SelectItem value="upload_documento">Upload de Documento</SelectItem>
                  <SelectItem value="criar_usuario">Criar Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-6">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredLogs && filteredLogs.length > 0 ? (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Data/Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Entidade</TableHead>
                      <TableHead>Detalhes</TableHead>
                      <TableHead className="w-[120px]">IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                        <TableCell className="font-mono text-xs">
                          {format(new Date(log.dataHora), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="font-medium">
                          {log.usuarioNome || "Sistema"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {acaoLabels[log.acao] || log.acao}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.entidade || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-md truncate">
                          {log.detalhes || "-"}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {log.ipAddress || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">Nenhum log encontrado</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchTerm || acaoFilter !== "all"
                    ? "Tente ajustar os filtros de busca"
                    : "Os logs de auditoria aparecerão aqui"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
