import { useState, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, FileText } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Cliente } from "@shared/schema";

interface DocumentoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentoUploadDialog({ open, onOpenChange }: DocumentoUploadDialogProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [status, setStatus] = useState("em_analise");
  const [isDragging, setIsDragging] = useState(false);

  const { data: clientes } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes"],
    enabled: open,
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/documentos/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Erro ao fazer upload");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documentos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Upload realizado",
        description: "Documento enviado com sucesso",
      });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFile(null);
    setNome("");
    setDescricao("");
    setClienteId("");
    setStatus("em_analise");
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const validTypes = ["application/pdf", "image/jpeg", "image/png"];
      if (validTypes.includes(droppedFile.type)) {
        setFile(droppedFile);
        if (!nome) {
          setNome(droppedFile.name.replace(/\.[^/.]+$/, ""));
        }
      } else {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Apenas arquivos PDF, JPG e PNG são permitidos",
          variant: "destructive",
        });
      }
    }
  }, [nome, toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!nome) {
        setNome(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !nome || !clienteId) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("nome", nome);
    formData.append("descricao", descricao);
    formData.append("clienteId", clienteId);
    formData.append("status", status);

    uploadMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload de Documento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div
            className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="flex items-center justify-center gap-4">
                <FileText className="h-12 w-12 text-primary" />
                <div className="flex-1 text-left">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setFile(null)}
                  data-testid="button-remove-file"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Arraste um arquivo ou clique para selecionar</p>
                  <p className="text-xs text-muted-foreground">PDF, JPG ou PNG (máx. 10MB)</p>
                </div>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  data-testid="input-file"
                />
                <Label htmlFor="file-upload">
                  <Button type="button" variant="outline" asChild>
                    <span>Selecionar Arquivo</span>
                  </Button>
                </Label>
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Documento *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Contrato de Prestação de Serviços"
                required
                data-testid="input-nome-documento"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente *</Label>
              <Select value={clienteId} onValueChange={setClienteId} required>
                <SelectTrigger id="cliente" data-testid="select-cliente">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes?.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status Inicial</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status" data-testid="select-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="em_analise">Em Análise</SelectItem>
                <SelectItem value="em_uso">Em Uso</SelectItem>
                <SelectItem value="devolvido">Devolvido ao Cliente</SelectItem>
                <SelectItem value="arquivado">Arquivado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Informações adicionais sobre o documento"
              rows={3}
              data-testid="input-descricao-documento"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={uploadMutation.isPending}
              data-testid="button-cancel-upload"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={uploadMutation.isPending || !file}
              data-testid="button-submit-upload"
            >
              {uploadMutation.isPending ? "Enviando..." : "Fazer Upload"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
