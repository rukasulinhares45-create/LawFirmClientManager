import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { insertClienteSchema, Cliente } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const clienteFormSchema = insertClienteSchema.extend({
  tipo: z.enum(["pf", "pj"]),
  nome: z.string().min(1, "Nome é obrigatório"),
  cpfCnpj: z.string().min(11, "CPF/CNPJ é obrigatório"),
});

type ClienteFormData = z.infer<typeof clienteFormSchema>;

interface ClienteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: Cliente;
}

export function ClienteFormDialog({ open, onOpenChange, cliente }: ClienteFormDialogProps) {
  const { toast } = useToast();
  const isEditing = !!cliente;

  const form = useForm<ClienteFormData>({
    resolver: zodResolver(clienteFormSchema),
    defaultValues: cliente || {
      tipo: "pf",
      nome: "",
      cpfCnpj: "",
      rgInscricaoEstadual: "",
      dataNascimento: "",
      localNascimento: "",
      cep: "",
      endereco: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      telefone: "",
      celular: "",
      email: "",
      ocupacao: "",
      observacoes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ClienteFormData) => {
      const res = await apiRequest("POST", "/api/clientes", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Cliente cadastrado",
        description: "Cliente cadastrado com sucesso",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cadastrar cliente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ClienteFormData) => {
      const res = await apiRequest("PATCH", `/api/clientes/${cliente!.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
      toast({
        title: "Cliente atualizado",
        description: "Cliente atualizado com sucesso",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar cliente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ClienteFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const tipo = form.watch("tipo");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Cliente" : "Novo Cliente"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Cliente *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex gap-4"
                      disabled={isEditing}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pf" id="pf" data-testid="radio-pf" />
                        <Label htmlFor="pf" className="font-normal cursor-pointer">
                          Pessoa Física
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pj" id="pj" data-testid="radio-pj" />
                        <Label htmlFor="pj" className="font-normal cursor-pointer">
                          Pessoa Jurídica
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Tabs defaultValue="dados" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="dados">Dados Cadastrais</TabsTrigger>
                <TabsTrigger value="endereco">Endereço</TabsTrigger>
                <TabsTrigger value="outros">Outros</TabsTrigger>
              </TabsList>

              <TabsContent value="dados" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>
                          {tipo === "pf" ? "Nome Completo" : "Razão Social"} *
                        </FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-nome" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cpfCnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tipo === "pf" ? "CPF" : "CNPJ"} *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={tipo === "pf" ? "000.000.000-00" : "00.000.000/0000-00"}
                            data-testid="input-cpf-cnpj"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rgInscricaoEstadual"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {tipo === "pf" ? "RG" : "Inscrição Estadual"}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-rg-ie" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {tipo === "pf" && (
                    <>
                      <FormField
                        control={form.control}
                        name="dataNascimento"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Nascimento</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                type="date"
                                data-testid="input-data-nascimento"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="localNascimento"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Local de Nascimento</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                data-testid="input-local-nascimento"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="(00) 0000-0000"
                            data-testid="input-telefone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="celular"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Celular</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="(00) 00000-0000"
                            data-testid="input-celular"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            type="email"
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="endereco" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="cep"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="00000-000"
                            data-testid="input-cep"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endereco"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-endereco" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="numero"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-numero" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="complemento"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Complemento</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-complemento" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bairro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bairro</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-bairro" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-cidade" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="UF"
                            maxLength={2}
                            data-testid="input-estado"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="outros" className="space-y-4">
                <FormField
                  control={form.control}
                  name="ocupacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {tipo === "pf" ? "Ocupação" : "Ramo de Atuação"}
                      </FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} data-testid="input-ocupacao" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ""}
                          rows={5}
                          data-testid="input-observacoes"
                        />
                      </FormControl>
                      <FormDescription>
                        Informações adicionais sobre o cliente
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-submit-cliente">
                {isPending ? "Salvando..." : isEditing ? "Salvar Alterações" : "Cadastrar Cliente"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
