import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Shield, Lock, User } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const loginSchema = z.object({
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual é obrigatória"),
  newPassword: z.string().min(6, "Nova senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string().min(1, "Confirme a nova senha"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function AuthPage() {
  const { user, isLoading, loginMutation, changePasswordMutation } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const changePasswordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (user && user.primeiroAcesso) {
      setShowChangePassword(true);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user && !user.primeiroAcesso) {
    return <Redirect to="/" />;
  }

  const onLogin = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onChangePassword = (data: ChangePasswordFormData) => {
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  if (showChangePassword && user?.primeiroAcesso) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Lock className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl">Primeiro Acesso</CardTitle>
            <CardDescription>
              Por segurança, você precisa alterar sua senha no primeiro acesso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...changePasswordForm}>
              <form onSubmit={changePasswordForm.handleSubmit(onChangePassword)} className="space-y-4">
                <FormField
                  control={changePasswordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha Atual</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Digite sua senha atual"
                          data-testid="input-current-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={changePasswordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova Senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Digite sua nova senha"
                          data-testid="input-new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={changePasswordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Nova Senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Confirme sua nova senha"
                          data-testid="input-confirm-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={changePasswordMutation.isPending}
                  data-testid="button-change-password"
                >
                  {changePasswordMutation.isPending ? "Alterando..." : "Alterar Senha"}
                </Button>
              </form>
            </Form>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Sua senha será criptografada com bcrypt para máxima segurança
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="absolute right-4 top-4 lg:left-4">
        <ThemeToggle />
      </div>
      
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl">Sistema Jurídico</CardTitle>
            <CardDescription>
              Acesse o sistema de gestão de clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usuário</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Digite seu usuário"
                          data-testid="input-username"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Digite sua senha"
                          data-testid="input-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </Form>
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Sistema protegido com criptografia bcrypt, sessões seguras e proteção contra
              SQL Injection, XSS e CSRF
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="hidden bg-sidebar lg:flex lg:items-center lg:justify-center lg:p-8">
        <div className="max-w-md space-y-6 text-center">
          <User className="mx-auto h-24 w-24 text-sidebar-foreground/50" />
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-sidebar-foreground">
              Gestão Profissional de Clientes
            </h2>
            <p className="text-sidebar-foreground/70">
              Gerencie clientes, documentos e processos com segurança e eficiência.
              Sistema desenvolvido especialmente para escritórios de advocacia.
            </p>
          </div>
          <div className="space-y-2 text-left text-sm text-sidebar-foreground/60">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Cadastro completo de pessoas físicas e jurídicas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Gestão de documentos com controle de status</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Editor integrado de documentos jurídicos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Logs de auditoria completos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
