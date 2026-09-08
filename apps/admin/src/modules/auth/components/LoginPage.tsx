import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Lock, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoginMutation } from "@/modules/auth/hooks/use-auth";
import { ApiError } from "@/shared/api/error";

const loginFormSchema = z.object({
  login: z.string().min(1, "Informe e-mail ou usuário"),
  password: z.string().min(1, "Informe senha"),
  remember: z.boolean().default(false),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export const LoginPage = () => {
  const loginMutation = useLoginMutation();
  const [remember, setRemember] = useState(false);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      login: "",
      password: "",
      remember: false,
    },
  });

  const submit = form.handleSubmit((values) => {
    loginMutation.mutate({
      login: values.login,
      password: values.password,
      persistence: remember ? "local" : "session",
    });
  });

  const errorMessage =
    loginMutation.error instanceof ApiError
      ? loginMutation.error.message
      : "Não foi possível autenticar agora.";

  return (
    <div className="min-h-[100dvh] w-full bg-frame text-frame-foreground lg:grid lg:grid-cols-[0.9fr_1.1fr]">
      <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="absolute inset-0 opacity-95"
          style={{ background: "var(--gradient-frame)" }}
          aria-hidden
        />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-lg font-semibold">Ziot Admin</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-frame-foreground/60">
              Platform Console
            </p>
          </div>
        </div>

        <div className="relative z-10 max-w-md space-y-5">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Operação administrativa da plataforma Ziot.
          </h1>
          <p className="text-base text-frame-foreground/70">
            Gerencie clientes, tenants, usuários, inventário e saúde dos devices
            em uma interface conectada à API administrativa.
          </p>
        </div>

        <p className="relative z-10 text-xs text-frame-foreground/50">
          © {new Date().getFullYear()} Ziot.
        </p>
      </div>

      <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10 text-foreground lg:min-h-0">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="text-base font-semibold">Ziot Admin</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Acesso administrativo
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">
              Entrar no console
            </h2>
            <p className="text-sm text-muted-foreground">
              Use sua conta de administrador da plataforma.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="login">E-mail ou usuário</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="login"
                  autoComplete="username"
                  placeholder="admin@ziot.com"
                  className="h-12 rounded-xl pl-10"
                  {...form.register("login")}
                />
              </div>
              {form.formState.errors.login ? (
                <p className="text-xs text-alert">
                  {form.formState.errors.login.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-12 rounded-xl pl-10"
                  {...form.register("password")}
                />
              </div>
              {form.formState.errors.password ? (
                <p className="text-xs text-alert">
                  {form.formState.errors.password.message}
                </p>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(checked) => setRemember(checked === true)}
              />
              <Label
                htmlFor="remember"
                className="text-sm font-normal text-muted-foreground"
              >
                Manter conectado neste navegador
              </Label>
            </div>

            {loginMutation.isError ? (
              <p className="rounded-lg border border-alert/20 bg-alert/10 px-3 py-2 text-sm text-alert">
                {errorMessage}
              </p>
            ) : null}

            <Button
              type="submit"
              className="h-12 w-full rounded-xl"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Entrando..." : "Entrar"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
