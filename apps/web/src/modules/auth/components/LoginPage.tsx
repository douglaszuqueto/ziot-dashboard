import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoginMutation } from "@/modules/auth/hooks/use-auth";
import { ApiError } from "@/shared/api/error";
import { brandConfig } from "@/shared/brand";
import { BrandLogo } from "@/shared/components/BrandLogo";

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
    <div className="min-h-[100dvh] w-full bg-frame text-frame-foreground lg:grid lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="absolute inset-0 opacity-90"
          style={{ background: "var(--gradient-frame)" }}
          aria-hidden
        />
        <div
          className="absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full opacity-30 blur-3xl"
          style={{ background: "var(--gradient-primary)" }}
          aria-hidden
        />
        <div
          className="absolute -bottom-40 -left-20 h-[420px] w-[420px] rounded-full opacity-20 blur-3xl"
          style={{ background: "var(--gradient-primary)" }}
          aria-hidden
        />

        <div className="relative z-10 flex items-center gap-3">
          <BrandLogo tone="dark" className="h-10 w-auto max-w-[180px]" />
          <div className="leading-tight">
            <p className="text-[11px] uppercase tracking-[0.18em] text-frame-foreground/60">
              {brandConfig.tagline}
            </p>
          </div>
        </div>

        <div className="relative z-10 max-w-md space-y-6">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            {brandConfig.loginTitle}{" "}
            <span className="text-primary-glow">
              {brandConfig.loginHighlight}
            </span>
          </h2>
          <p className="text-base text-frame-foreground/70">
            {brandConfig.loginDescription}
          </p>
          <div className="flex items-center gap-6 pt-4">
            <div>
              <p className="text-2xl font-semibold">24/7</p>
              <p className="text-xs uppercase tracking-wider text-frame-foreground/60">
                Monitoramento
              </p>
            </div>
            <div className="h-10 w-px bg-frame-foreground/15" />
            <div>
              <p className="text-2xl font-semibold">+120</p>
              <p className="text-xs uppercase tracking-wider text-frame-foreground/60">
                Sensores ativos
              </p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-frame-foreground/50">
          © {new Date().getFullYear()} {brandConfig.name}. Todos os direitos
          reservados.
        </p>
      </div>

      <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10 text-foreground lg:min-h-0">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-10 items-center justify-center">
              <BrandLogo tone="light" className="h-7 w-auto max-w-[120px]" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Bem-vindo de volta
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Entrar na plataforma
            </h1>
            <p className="text-sm text-muted-foreground">
              {brandConfig.loginHelp}
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
                  placeholder="operator ou voce@empresa.com"
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
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

            <label
              htmlFor="remember"
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(checked) => {
                  const nextValue = checked === true;
                  setRemember(nextValue);
                  form.setValue("remember", nextValue, {
                    shouldDirty: true,
                    shouldTouch: true,
                  });
                }}
              />
              Manter-me conectado
            </label>

            {loginMutation.isError ? (
              <div className="rounded-2xl border border-alert/20 bg-alert/5 px-4 py-3 text-sm text-alert">
                {errorMessage}
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="h-12 w-full rounded-xl text-sm font-semibold shadow-[var(--shadow-card)]"
            >
              {loginMutation.isPending ? "Entrando..." : "Entrar"}
              {!loginMutation.isPending ? (
                <ArrowRight className="h-4 w-4" />
              ) : null}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Ainda não tem conta?{" "}
            <button
              type="button"
              className="font-medium text-primary hover:underline"
            >
              Fale com o suporte
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
