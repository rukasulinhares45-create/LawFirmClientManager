import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Save, FileDown, Printer } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Cliente } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

export default function EditorPage() {
  const { toast } = useToast();
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [selectedClienteId, setSelectedClienteId] = useState<string>("");

  const { data: clientes } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { titulo: string; conteudo: string; clienteId?: string }) => {
      const res = await apiRequest("POST", "/api/documentos-juridicos", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documentos-juridicos"] });
      toast({
        title: "Documento salvo",
        description: "Documento jurídico salvo com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const selectedCliente = clientes?.find(c => c.id === selectedClienteId);

  const inserirDadosCliente = (campo: string) => {
    if (!selectedCliente) {
      toast({
        title: "Selecione um cliente",
        description: "Selecione um cliente para inserir dados",
        variant: "destructive",
      });
      return;
    }

    const valores: Record<string, string> = {
      nome: selectedCliente.nome,
      cpfCnpj: selectedCliente.cpfCnpj,
      endereco: selectedCliente.endereco ? `${selectedCliente.endereco}, ${selectedCliente.numero || ""}` : "",
      cidade: selectedCliente.cidade || "",
      estado: selectedCliente.estado || "",
      email: selectedCliente.email || "",
      telefone: selectedCliente.celular || selectedCliente.telefone || "",
    };

    const valor = valores[campo] || "";
    setConteudo((prev) => prev + valor);
  };

  const handleSave = () => {
    if (!titulo.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Informe um título para o documento",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate({
      titulo,
      conteudo,
      clienteId: selectedClienteId || undefined,
    });
  };

  const handleExportPDF = () => {
    toast({
      title: "Exportando PDF",
      description: "Funcionalidade em desenvolvimento",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editor de Documentos Jurídicos"
        description="Crie e edite documentos com inserção automática de dados do cliente"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Input
                  placeholder="Título do Documento"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="text-lg font-medium"
                  data-testid="input-titulo-documento"
                />

                <Separator />

                <div className="flex flex-wrap gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    data-testid="button-bold"
                    aria-label="Negrito"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    data-testid="button-italic"
                    aria-label="Itálico"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Separator orientation="vertical" className="mx-1 h-9" />
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    data-testid="button-align-left"
                    aria-label="Alinhar à esquerda"
                  >
                    <AlignLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    data-testid="button-align-center"
                    aria-label="Alinhar ao centro"
                  >
                    <AlignCenter className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    data-testid="button-align-right"
                    aria-label="Alinhar à direita"
                  >
                    <AlignRight className="h-4 w-4" />
                  </Button>
                  <Separator orientation="vertical" className="mx-1 h-9" />
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    data-testid="button-list"
                    aria-label="Lista com marcadores"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    data-testid="button-list-ordered"
                    aria-label="Lista numerada"
                  >
                    <ListOrdered className="h-4 w-4" />
                  </Button>
                </div>

                <Textarea
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                  placeholder="Digite o conteúdo do documento aqui..."
                  className="min-h-[400px] font-serif text-base"
                  data-testid="textarea-conteudo"
                />

                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save">
                    <Save className="mr-2 h-4 w-4" />
                    {saveMutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                  <Button variant="outline" onClick={handleExportPDF} data-testid="button-export-pdf">
                    <FileDown className="mr-2 h-4 w-4" />
                    Exportar PDF
                  </Button>
                  <Button variant="outline" onClick={handlePrint} data-testid="button-print">
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold mb-4">Inserir Dados do Cliente</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Selecionar Cliente</label>
                  <Select value={selectedClienteId} onValueChange={setSelectedClienteId}>
                    <SelectTrigger data-testid="select-cliente-editor">
                      <SelectValue placeholder="Escolha um cliente" />
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

                {selectedCliente && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground mb-2">
                        Clique para inserir no documento:
                      </p>
                      <div className="grid gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="justify-start"
                          onClick={() => inserirDadosCliente("nome")}
                          data-testid="button-insert-nome"
                        >
                          Nome
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="justify-start"
                          onClick={() => inserirDadosCliente("cpfCnpj")}
                          data-testid="button-insert-cpf"
                        >
                          CPF/CNPJ
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="justify-start"
                          onClick={() => inserirDadosCliente("endereco")}
                          data-testid="button-insert-endereco"
                        >
                          Endereço
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="justify-start"
                          onClick={() => inserirDadosCliente("cidade")}
                          data-testid="button-insert-cidade"
                        >
                          Cidade
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="justify-start"
                          onClick={() => inserirDadosCliente("email")}
                          data-testid="button-insert-email"
                        >
                          Email
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="justify-start"
                          onClick={() => inserirDadosCliente("telefone")}
                          data-testid="button-insert-telefone"
                        >
                          Telefone
                        </Button>
                      </div>
                    </div>

                    <Separator />
                    <div className="rounded-lg bg-muted p-3 text-xs">
                      <p className="font-medium mb-1">Cliente Selecionado:</p>
                      <p className="text-muted-foreground">{selectedCliente.nome}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
