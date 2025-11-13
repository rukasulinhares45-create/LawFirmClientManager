import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, FileText, Download, Trash2, Upload, Edit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Documento, StatusDocumento, Cliente } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DocumentoUploadDialog } from "@/components/documento-upload-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";


export default function DocumentosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [documentoToDelete, setDocumentoToDelete] = useState<Documento | null>(null);
  const [documentoToEdit, setDocumentoToEdit] = useState<Documento | null>(null);
  const [newStatusId, setNewStatusId] = useState<string>("");
  const { toast } = useToast();

  const { data: documentos, isLoading } = useQuery<Documento[]>({
    queryKey: ["/api/documentos"],
  });

  const { data: statusList } = useQuery<StatusDocumento[]>({
    queryKey: ["/api/status-documentos"],
  });

  const { data: clientes } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/documentos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documentos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Documento excluído",
        description: "Documento excluído com sucesso",
      });
      setDocumentoToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir documento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, statusId }: { id: string; statusId: string }) => {
      await apiRequest("PATCH", `/api/documentos/${id}`, { statusId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documentos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Status atualizado",
        description: "Status do documento atualizado com sucesso",
      });
      setDocumentoToEdit(null);
      setNewStatusId("");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredDocumentos = documentos?.filter((doc) => {
    const matchesSearch =
      doc.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.descricao?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || doc.statusId === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusNome = (statusId: string | null) => {
    if (!statusId) return "Sem Status";
    const status = statusList?.find(s => s.id === statusId);
    return status?.nome || "Status Desconhecido";
  };

  const getClienteNome = (clienteId: string) => {
    const cliente = clientes?.find(c => c.id === clienteId);
    return cliente?.nome || "Cliente Desconhecido";
  };

  const getFileIcon = (tipo: string) => {
    return <FileText className="h-8 w-8" />;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentos"
        description="Gerencie os documentos dos clientes"
        action={
          <Button onClick={() => setShowUploadDialog(true)} data-testid="button-upload-documento">
            <Upload className="mr-2 h-4 w-4" />
            Upload Documento
          </Button>
        }
      />

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-documentos"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  {statusList?.filter(s => s.ativo).map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-6">
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-48 w-full" />
                ))}
              </div>
            ) : filteredDocumentos && filteredDocumentos.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredDocumentos.map((doc) => (
                  <Card key={doc.id} className="hover-elevate" data-testid={`card-documento-${doc.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            {getFileIcon(doc.tipoArquivo)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{doc.nome}</h3>
                            <p className="text-xs text-muted-foreground">
                              {getClienteNome(doc.clienteId)}
                            </p>
                            <p className="text-xs text-muted-foreground uppercase">
                              {doc.tipoArquivo}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {getStatusNome(doc.statusId)}
                        </Badge>
                      </div>

                      {doc.descricao && (
                        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                          {doc.descricao}
                        </p>
                      )}

                      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {formatDistanceToNow(new Date(doc.uploadEm), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                        <span>{(doc.tamanhoBytes / 1024).toFixed(1)} KB</span>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          data-testid={`button-download-${doc.id}`}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setDocumentoToEdit(doc);
                            setNewStatusId(doc.statusId || "");
                          }}
                          data-testid={`button-edit-status-${doc.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setDocumentoToDelete(doc)}
                          data-testid={`button-delete-${doc.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">Nenhum documento encontrado</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchTerm || statusFilter !== "all"
                    ? "Tente ajustar os filtros de busca"
                    : "Faça upload do primeiro documento"}
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <Button
                    className="mt-4"
                    onClick={() => setShowUploadDialog(true)}
                    data-testid="button-upload-empty"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Documento
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <DocumentoUploadDialog open={showUploadDialog} onOpenChange={setShowUploadDialog} />

      <AlertDialog
        open={!!documentoToDelete}
        onOpenChange={(open) => !open && setDocumentoToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Documento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o documento "{documentoToDelete?.nome}"? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => documentoToDelete && deleteMutation.mutate(documentoToDelete.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!documentoToEdit} onOpenChange={(open) => !open && setDocumentoToEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Status do Documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-status">Novo Status</Label>
              <Select value={newStatusId} onValueChange={setNewStatusId}>
                <SelectTrigger id="edit-status" data-testid="select-edit-status">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {statusList?.filter(s => s.ativo).map((statusItem) => (
                    <SelectItem key={statusItem.id} value={statusItem.id}>
                      {statusItem.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDocumentoToEdit(null);
                  setNewStatusId("");
                }}
                disabled={updateStatusMutation.isPending}
                data-testid="button-cancel-edit-status"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => documentoToEdit && updateStatusMutation.mutate({ id: documentoToEdit.id, statusId: newStatusId })}
                disabled={updateStatusMutation.isPending || !newStatusId}
                data-testid="button-confirm-edit-status"
              >
                {updateStatusMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
