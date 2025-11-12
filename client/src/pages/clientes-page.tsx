import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ClienteFormDialog } from "@/components/cliente-form-dialog";
import { ClienteDetailDialog } from "@/components/cliente-detail-dialog";
import { Cliente } from "@shared/schema";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export default function ClientesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState<"all" | "pf" | "pj">("all");
  const [showNewClienteDialog, setShowNewClienteDialog] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  const { data: clientes, isLoading } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes"],
  });

  const filteredClientes = clientes?.filter((cliente) => {
    const matchesSearch = 
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.cpfCnpj.includes(searchTerm) ||
      cliente.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipo = tipoFilter === "all" || cliente.tipo === tipoFilter;
    
    return matchesSearch && matchesTipo;
  });

  const formatCpfCnpj = (value: string) => {
    if (value.length === 11) {
      return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    } else if (value.length === 14) {
      return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
    return value;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Gerencie os clientes do escritório"
        action={
          <Button onClick={() => setShowNewClienteDialog(true)} data-testid="button-novo-cliente">
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        }
      />

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF/CNPJ ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-clientes"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <ToggleGroup
                type="single"
                value={tipoFilter}
                onValueChange={(value) => value && setTipoFilter(value as typeof tipoFilter)}
                data-testid="filter-tipo-cliente"
              >
                <ToggleGroupItem value="all" aria-label="Todos" data-testid="filter-all">
                  Todos
                </ToggleGroupItem>
                <ToggleGroupItem value="pf" aria-label="Pessoa Física" data-testid="filter-pf">
                  Pessoa Física
                </ToggleGroupItem>
                <ToggleGroupItem value="pj" aria-label="Pessoa Jurídica" data-testid="filter-pj">
                  Pessoa Jurídica
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          <div className="mt-6">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : filteredClientes && filteredClientes.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClientes.map((cliente) => (
                    <TableRow
                      key={cliente.id}
                      className="cursor-pointer hover-elevate"
                      onClick={() => setSelectedCliente(cliente)}
                      data-testid={`row-cliente-${cliente.id}`}
                    >
                      <TableCell className="font-medium">{cliente.nome}</TableCell>
                      <TableCell>
                        <Badge variant={cliente.tipo === "pf" ? "default" : "secondary"}>
                          {cliente.tipo === "pf" ? "Pessoa Física" : "Pessoa Jurídica"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatCpfCnpj(cliente.cpfCnpj)}
                      </TableCell>
                      <TableCell>{cliente.celular || cliente.telefone || "-"}</TableCell>
                      <TableCell>{cliente.email || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCliente(cliente);
                          }}
                          data-testid={`button-view-${cliente.id}`}
                        >
                          Ver detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">Nenhum cliente encontrado</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchTerm || tipoFilter !== "all"
                    ? "Tente ajustar os filtros de busca"
                    : "Comece cadastrando o primeiro cliente"}
                </p>
                {!searchTerm && tipoFilter === "all" && (
                  <Button
                    className="mt-4"
                    onClick={() => setShowNewClienteDialog(true)}
                    data-testid="button-novo-cliente-empty"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Cliente
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ClienteFormDialog
        open={showNewClienteDialog}
        onOpenChange={setShowNewClienteDialog}
      />

      {selectedCliente && (
        <ClienteDetailDialog
          cliente={selectedCliente}
          open={!!selectedCliente}
          onOpenChange={(open) => !open && setSelectedCliente(null)}
        />
      )}
    </div>
  );
}
