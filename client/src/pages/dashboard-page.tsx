import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Users, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardStats {
  totalClientes: number;
}

interface AtividadeRecente {
  id: string;
  acao: string;
  usuarioNome: string;
  dataHora: string;
  detalhes: string;
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: atividades, isLoading: atividadesLoading } = useQuery<AtividadeRecente[]>({
    queryKey: ["/api/dashboard/atividades-recentes"],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visão geral do sistema de gestão de clientes"
      />

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1 max-w-sm">
        {statsLoading ? (
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ) : (
          <StatCard
            title="Total de Clientes"
            value={stats?.totalClientes ?? 0}
            icon={Users}
            testId="stat-total-clientes"
          />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {atividadesLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : atividades && atividades.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ação</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Detalhes</TableHead>
                  <TableHead className="text-right">Quando</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atividades.map((atividade) => (
                  <TableRow key={atividade.id}>
                    <TableCell>
                      <Badge variant="outline" data-testid={`badge-acao-${atividade.id}`}>
                        {atividade.acao.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{atividade.usuarioNome}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {atividade.detalhes}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(atividade.dataHora), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">Nenhuma atividade recente</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                As atividades do sistema aparecerão aqui
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
