import { useMutation, useQuery } from "@tanstack/react-query";
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
import { CPFCNPJMask, PhoneMask, CEPMask, stripNonDigits } from "@/components/masked-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";

const clienteFormSchema = insertClienteSchema;

type ClienteFormData = z.infer<typeof clienteFormSchema>;

interface ClienteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: Cliente;
}

export function ClienteFormDialog({ open, onOpenChange, cliente }: ClienteFormDialogProps) {
  const { toast } = useToast();
  const isEditing = !!cliente;
  const [naturalidadeEstado, setNaturalidadeEstado] = useState<string>("");
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const form = useForm<ClienteFormData>({
    resolver: zodResolver(clienteFormSchema),
    defaultValues: cliente ? {
      ...cliente,
      celular: cliente.celular || "",
      rgInscricaoEstadual: cliente.rgInscricaoEstadual || "",
      dataNascimento: cliente.dataNascimento || "",
      localNascimento: cliente.localNascimento || "",
      cep: cliente.cep || "",
      endereco: cliente.endereco || "",
      numero: cliente.numero || "",
      complemento: cliente.complemento || "",
      bairro: cliente.bairro || "",
      cidade: cliente.cidade || "",
      estado: cliente.estado || "",
      telefone: cliente.telefone || "",
      email: cliente.email || "",
      ocupacao: cliente.ocupacao || "",
      observacoes: cliente.observacoes || "",
    } : {
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

  const { data: estados } = useQuery<{ sigla: string; nome: string }[]>({
    queryKey: ["/api/ibge/estados"],
    enabled: open,
  });

  const { data: municipios } = useQuery<{ id: number; nome: string }[]>({
    queryKey: ["/api/ibge/municipios", naturalidadeEstado],
    enabled: !!naturalidadeEstado,
  });

  const buscarEnderecoPorCEP = async (cep: string) => {
    const cleaned = stripNonDigits(cep);
    if (cleaned.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(`/api/viacep/${cleaned}`);
      if (!response.ok) throw new Error("CEP não encontrado");
      
      const data = await response.json();
      if (data.erro) {
        toast({
          title: "CEP não encontrado",
          description: "Verifique o CEP digitado e tente novamente",
          variant: "destructive",
        });
        return;
      }

      form.setValue("endereco", data.logradouro || "");
      form.setValue("bairro", data.bairro || "");
      form.setValue("cidade", data.localidade || "");
      form.setValue("estado", data.uf || "");
      
      toast({
        title: "Endereço encontrado",
        description: "Os campos foram preenchidos automaticamente",
      });
    } catch (error) {
      toast({
        title: "Erro ao buscar CEP",
        description: "Não foi possível buscar o endereço",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCep(false);
    }
  };

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
    const cleanedData = {
      ...data,
      cpfCnpj: stripNonDigits(data.cpfCnpj),
      telefone: data.telefone ? stripNonDigits(data.telefone) : "",
      celular: stripNonDigits(data.celular),
      cep: data.cep ? stripNonDigits(data.cep) : "",
    };
    
    if (isEditing) {
      updateMutation.mutate(cleanedData);
    } else {
      createMutation.mutate(cleanedData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const tipo = form.watch("tipo");

  useEffect(() => {
    if (!open) {
      form.reset();
      setNaturalidadeEstado("");
    } else if (cliente) {
      const estadoFromNaturalidade = cliente.localNascimento && cliente.localNascimento.includes(" - ")
        ? cliente.localNascimento.split(" - ")[1]
        : "";
      
      setNaturalidadeEstado(estadoFromNaturalidade);
      
      form.reset({
        ...cliente,
        celular: cliente.celular || "",
        rgInscricaoEstadual: cliente.rgInscricaoEstadual || "",
        dataNascimento: cliente.dataNascimento || "",
        localNascimento: cliente.localNascimento || "",
        cep: cliente.cep || "",
        endereco: cliente.endereco || "",
        numero: cliente.numero || "",
        complemento: cliente.complemento || "",
        bairro: cliente.bairro || "",
        cidade: cliente.cidade || "",
        estado: cliente.estado || "",
        telefone: cliente.telefone || "",
        email: cliente.email || "",
        ocupacao: cliente.ocupacao || "",
        observacoes: cliente.observacoes || "",
      });
    } else if (open) {
      form.reset({
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
      });
    }
  }, [open, cliente, form]);

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
                          <CPFCNPJMask
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
                            <FormLabel>Data de Nascimento *</FormLabel>
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
                          <FormItem className="md:col-span-2">
                            <FormLabel>Local de Nascimento (Naturalidade)</FormLabel>
                            <div className="grid gap-2 md:grid-cols-2">
                              <Select
                                value={naturalidadeEstado}
                                onValueChange={(value) => {
                                  setNaturalidadeEstado(value);
                                  field.onChange("");
                                }}
                              >
                                <SelectTrigger data-testid="select-estado-naturalidade">
                                  <SelectValue placeholder="Selecione o estado" />
                                </SelectTrigger>
                                <SelectContent>
                                  {estados?.map((estado) => (
                                    <SelectItem key={estado.sigla} value={estado.sigla}>
                                      {estado.nome}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select
                                value={field.value ? field.value.split(" - ")[0] : ""}
                                onValueChange={(value) => field.onChange(`${value} - ${naturalidadeEstado}`)}
                                disabled={!naturalidadeEstado}
                              >
                                <SelectTrigger data-testid="select-municipio-naturalidade">
                                  <SelectValue placeholder={naturalidadeEstado ? "Selecione o município" : "Primeiro selecione o estado"} />
                                </SelectTrigger>
                                <SelectContent>
                                  {municipios?.map((municipio) => (
                                    <SelectItem key={municipio.id} value={municipio.nome}>
                                      {municipio.nome}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
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
                          <PhoneMask
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
                        <FormLabel>Celular *</FormLabel>
                        <FormControl>
                          <PhoneMask
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
                        <div className="flex gap-2">
                          <FormControl>
                            <CEPMask
                              {...field}
                              value={field.value || ""}
                              placeholder="00000-000"
                              data-testid="input-cep"
                              onBlur={() => {
                                if (field.value) {
                                  buscarEnderecoPorCEP(field.value);
                                }
                              }}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => buscarEnderecoPorCEP(field.value || "")}
                            disabled={isLoadingCep || !field.value}
                            data-testid="button-buscar-cep"
                          >
                            {isLoadingCep ? "Buscando..." : "Buscar"}
                          </Button>
                        </div>
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
