import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Cliente } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Mail, Phone, MapPin, Calendar, Briefcase } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ClienteFormDialog } from "./cliente-form-dialog";

interface ClienteDetailDialogProps {
  cliente: Cliente;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClienteDetailDialog({ cliente, open, onOpenChange }: ClienteDetailDialogProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);

  const formatCpfCnpj = (value: string) => {
    if (value.length === 11) {
      return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    } else if (value.length === 14) {
      return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
    return value;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <DialogTitle className="text-2xl">{cliente.nome}</DialogTitle>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant={cliente.tipo === "pf" ? "default" : "secondary"}>
                    {cliente.tipo === "pf" ? "Pessoa Física" : "Pessoa Jurídica"}
                  </Badge>
                  <span className="text-sm text-muted-foreground font-mono">
                    {formatCpfCnpj(cliente.cpfCnpj)}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditDialog(true)}
                data-testid="button-edit-cliente"
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </div>
          </DialogHeader>

          <Tabs defaultValue="dados" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dados">Dados Cadastrais</TabsTrigger>
              <TabsTrigger value="documentos">Documentos Vinculados</TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Informações Básicas
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium">{cliente.tipo === "pf" ? "CPF" : "CNPJ"}</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {formatCpfCnpj(cliente.cpfCnpj)}
                      </p>
                    </div>
                    {cliente.rgInscricaoEstadual && (
                      <div>
                        <p className="text-sm font-medium">
                          {cliente.tipo === "pf" ? "RG" : "Inscrição Estadual"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {cliente.rgInscricaoEstadual}
                        </p>
                      </div>
                    )}
                    {cliente.tipo === "pf" && cliente.dataNascimento && (
                      <div>
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Data de Nascimento
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(cliente.dataNascimento)}
                        </p>
                      </div>
                    )}
                    {cliente.tipo === "pf" && cliente.localNascimento && (
                      <div>
                        <p className="text-sm font-medium">Local de Nascimento</p>
                        <p className="text-sm text-muted-foreground">
                          {cliente.localNascimento}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Contato</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {cliente.telefone && (
                      <div>
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Telefone
                        </p>
                        <p className="text-sm text-muted-foreground">{cliente.telefone}</p>
                      </div>
                    )}
                    {cliente.celular && (
                      <div>
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Celular
                        </p>
                        <p className="text-sm text-muted-foreground">{cliente.celular}</p>
                      </div>
                    )}
                    {cliente.email && (
                      <div className="md:col-span-2">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </p>
                        <p className="text-sm text-muted-foreground">{cliente.email}</p>
                      </div>
                    )}
                  </div>
                </div>

                {(cliente.endereco || cliente.cidade) && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Endereço
                      </h3>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {cliente.endereco && (
                          <p>
                            {cliente.endereco}
                            {cliente.numero && `, ${cliente.numero}`}
                            {cliente.complemento && ` - ${cliente.complemento}`}
                          </p>
                        )}
                        {cliente.bairro && <p>{cliente.bairro}</p>}
                        {cliente.cidade && (
                          <p>
                            {cliente.cidade}
                            {cliente.estado && ` - ${cliente.estado}`}
                          </p>
                        )}
                        {cliente.cep && <p>CEP: {cliente.cep}</p>}
                      </div>
                    </div>
                  </>
                )}

                {cliente.ocupacao && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        {cliente.tipo === "pf" ? "Ocupação" : "Ramo de Atuação"}
                      </p>
                      <p className="text-sm text-muted-foreground">{cliente.ocupacao}</p>
                    </div>
                  </>
                )}

                {cliente.observacoes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium">Observações</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {cliente.observacoes}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="documentos">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  Documentos vinculados a este cliente aparecerão aqui
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {showEditDialog && (
        <ClienteFormDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          cliente={cliente}
        />
      )}
    </>
  );
}
