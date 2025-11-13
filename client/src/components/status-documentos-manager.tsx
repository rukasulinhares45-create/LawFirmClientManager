import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import type { StatusDocumento } from "@shared/schema";

const statusFormSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida (use formato #RRGGBB)"),
  ordem: z.number().int().min(0),
  ativo: z.boolean().default(true),
});

type StatusFormData = z.infer<typeof statusFormSchema>;

export function StatusDocumentosManager() {
  const { toast } = useToast();
  const [editingStatus, setEditingStatus] = useState<StatusDocumento | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: statusList, isLoading } = useQuery<StatusDocumento[]>({
    queryKey: ["/api/status-documentos"],
  });

  const form = useForm<StatusFormData>({
    resolver: zodResolver(statusFormSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      cor: "#6b7280",
      ordem: 0,
      ativo: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: StatusFormData) => {
      const res = await apiRequest("POST", "/api/status-documentos", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/status-documentos"] });
      toast({
        title: "Status criado",
        description: "Status criado com sucesso",
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: StatusFormData) => {
      const res = await apiRequest("PATCH", `/api/status-documentos/${editingStatus!.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/status-documentos"] });
      toast({
        title: "Status atualizado",
        description: "Status atualizado com sucesso",
      });
      setDialogOpen(false);
      setEditingStatus(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/status-documentos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/status-documentos"] });
      toast({
        title: "Status deletado",
        description: "Status deletado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao deletar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: StatusFormData) => {
    if (editingStatus) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (status: StatusDocumento) => {
    setEditingStatus(status);
    form.reset({
      nome: status.nome,
      descricao: status.descricao || "",
      cor: status.cor,
      ordem: status.ordem,
      ativo: status.ativo,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja deletar este status?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingStatus(null);
      form.reset();
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Status de Documentos</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os status customizáveis para documentos
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button data-testid="button-novo-status">
              <Plus className="h-4 w-4 mr-2" />
              Novo Status
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingStatus ? "Editar Status" : "Novo Status"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-nome-status" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} data-testid="input-descricao-status" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor *</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            {...field}
                            type="color"
                            className="h-10 w-20"
                            data-testid="input-cor-status"
                          />
                        </FormControl>
                        <Input
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="#6b7280"
                          className="flex-1"
                          data-testid="input-cor-hex-status"
                        />
                      </div>
                      <FormDescription>
                        Cor de exibição do status (formato hexadecimal)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ordem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordem *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-ordem-status"
                        />
                      </FormControl>
                      <FormDescription>
                        Define a ordem de exibição dos status
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDialogClose(false)}
                    data-testid="button-cancelar-status"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-salvar-status"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Salvando..."
                      : "Salvar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statusList?.map((status) => (
          <Card key={status.id} data-testid={`card-status-${status.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: status.cor }}
                  />
                  <CardTitle className="text-lg">{status.nome}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(status)}
                    data-testid={`button-editar-status-${status.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(status.id)}
                    data-testid={`button-deletar-status-${status.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {status.descricao && (
                <CardDescription>{status.descricao}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Ordem: {status.ordem}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
