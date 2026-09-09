import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import { type ReactNode, useEffect, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PivotMapPanel } from "@/modules/pivot/components/PivotMapPanel";
import {
  useCreatePivotMutation,
  usePivotQuery,
  useUpdatePivotMutation,
} from "@/modules/pivot/hooks/use-pivots";
import {
  type Pivot,
  type PivotFormInput,
  pivotFormSchema,
  toPivotFormInput,
  toPivotPayload,
} from "@/modules/pivot/schemas/pivot.schemas";
import { ApiError } from "@/shared/api/error";
import { translateApiError } from "@/shared/api/error-messages";
import {
  SectionEmpty,
  SectionError,
  SectionLoading,
} from "@/shared/components/states/QueryState";

const submitErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError && error.status === 409) {
    return "Já existe um pivô com esse nome neste tenant.";
  }
  return translateApiError(error, fallback);
};

const toNumber = (value: string | undefined) => {
  const normalized = (value ?? "").trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

// Pivô "de mentira" montado a partir do que está digitado, para a prévia no
// mapa acompanhar o formulário. Campos que o formulário não edita (status,
// dispositivo) vêm do pivô carregado ou de valores neutros.
export const previewPivot = (
  values: Partial<PivotFormInput>,
  base?: Pivot | null,
): Pivot => ({
  id: base?.id ?? "preview",
  tenant_id: base?.tenant_id ?? "",
  name: values.name?.trim() || base?.name || "Novo pivô",
  description: values.description ?? "",
  status: base?.status ?? "unknown",
  device_id: base?.device_id ?? null,
  latitude: toNumber(values.latitude),
  longitude: toNumber(values.longitude),
  pressure_ref: toNumber(values.pressure_ref),
  radius_m: toNumber(values.radius_m),
  spans: toNumber(values.spans),
  angle_reference: values.angle_reference === "road" ? "road" : "north",
  road_angle: toNumber(values.road_angle),
  road_latitude: toNumber(values.road_latitude),
  road_longitude: toNumber(values.road_longitude),
  sweep_start_angle: toNumber(values.sweep_start_angle),
  sweep_end_angle: toNumber(values.sweep_end_angle),
  created_at: base?.created_at ?? "",
  updated_at: base?.updated_at ?? "",
});

// Tela de cadastro/edição do pivô (mesma composição do editor de estufas da
// Vizeos): cartão de cabeçalho com voltar, título e Salvar; coluna principal
// com os dados e a localização (com a prévia do pivô no mapa); coluna lateral
// com a geometria do campo. Rotas: /pivos/novo e /pivos/:id/editar.
export const PivotEditorPage = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const query = usePivotQuery(id);
  const pivot = query.data ?? null;
  const createMutation = useCreatePivotMutation();
  const updateMutation = useUpdatePivotMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const title = isEditing ? "Editar pivô" : "Novo pivô";

  const form = useForm<PivotFormInput>({
    resolver: zodResolver(pivotFormSchema),
    defaultValues: toPivotFormInput(pivot),
  });

  // Ao carregar o pivô (edição), repovoa o formulário uma vez.
  useEffect(() => {
    if (pivot) form.reset(toPivotFormInput(pivot));
  }, [form, pivot]);

  const watched = useWatch({ control: form.control });
  const preview = useMemo(() => previewPivot(watched, pivot), [watched, pivot]);

  const submit = form.handleSubmit(async (raw) => {
    const payload = toPivotPayload(pivotFormSchema.parse(raw));
    try {
      const saved =
        isEditing && id
          ? await updateMutation.mutateAsync({ id, payload })
          : await createMutation.mutateAsync(payload);
      toast.success(isEditing ? "Pivô atualizado." : "Pivô cadastrado.");
      navigate(`/pivos/${saved.id}`);
    } catch (error) {
      toast.error(
        submitErrorMessage(
          error,
          isEditing
            ? "Não foi possível atualizar o pivô."
            : "Não foi possível cadastrar o pivô.",
        ),
      );
    }
  });

  if (isEditing && query.isLoading) {
    return (
      <AppShell title={title}>
        <SectionLoading lines={6} screen variant="detail" />
      </AppShell>
    );
  }

  if (
    isEditing &&
    query.error instanceof ApiError &&
    query.error.status === 404
  ) {
    return (
      <AppShell title={title}>
        <SectionEmpty
          title="Pivô não encontrado"
          description="Ele pode ter sido removido ou pertencer a outro tenant."
        />
      </AppShell>
    );
  }

  if (isEditing && (query.isError || !pivot)) {
    return (
      <AppShell title={title}>
        <SectionError
          message="Não foi possível carregar o pivô para edição."
          onRetry={() => void query.refetch()}
        />
      </AppShell>
    );
  }

  const errors = form.formState.errors;
  const backTo = isEditing && id ? `/pivos/${id}` : "/pivos";

  return (
    <AppShell title={title}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <section className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)] lg:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <Link
                to={backTo}
                aria-label="Voltar"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground transition-colors hover:bg-secondary/70"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="min-w-0">
                <h2 className="mt-1 text-2xl font-semibold tracking-tight lg:text-3xl">
                  {isEditing
                    ? `Editar ${pivot?.name ?? "pivô"}`
                    : "Cadastrar pivô"}
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Dados principais, localização e geometria do campo no mesmo
                  cadastro. A prévia no mapa acompanha o que você preenche.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                asChild
                type="button"
                variant="ghost"
                className="h-11 rounded-xl px-5 text-sm font-medium"
              >
                <Link to={backTo}>Cancelar</Link>
              </Button>
              <Button
                type="submit"
                className="h-11 rounded-xl px-5 text-sm font-medium"
                disabled={isPending}
              >
                <Save className="h-4 w-4" />
                {isPending ? "Salvando..." : "Salvar pivô"}
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_440px] xl:grid-cols-[minmax(0,1fr)_480px]">
          <div className="space-y-4">
            <FormCard title="Informações principais">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_200px]">
                <Field
                  id="pivot-name"
                  label="Nome"
                  placeholder="Ex.: Pivô 01 — Talhão norte"
                  error={errors.name?.message}
                  autoFocus
                  {...form.register("name")}
                />
                <Field
                  id="pivot-pressure-ref"
                  label="Pressão de referência (bar)"
                  placeholder="Ex.: 2,0"
                  inputMode="decimal"
                  error={errors.pressure_ref?.message}
                  {...form.register("pressure_ref")}
                />
              </div>
              <div className="mt-4 space-y-1.5">
                <Label htmlFor="pivot-description">Descrição</Label>
                <Textarea
                  id="pivot-description"
                  placeholder="Opcional. Ex.: área irrigada, cultura, observações."
                  className="min-h-[88px] rounded-xl"
                  aria-invalid={Boolean(errors.description)}
                  {...form.register("description")}
                />
                <FieldError message={errors.description?.message} />
              </div>
            </FormCard>

            <FormCard
              title="Localização"
              subtitle="Centro do pivô. Coordenadas são opcionais; informe latitude e longitude juntas."
            >
              <div className="mb-4 grid gap-4 md:grid-cols-2">
                <Field
                  id="pivot-latitude"
                  label="Latitude do centro"
                  placeholder="Ex.: -20.302609"
                  inputMode="decimal"
                  error={errors.latitude?.message}
                  {...form.register("latitude")}
                />
                <Field
                  id="pivot-longitude"
                  label="Longitude do centro"
                  placeholder="Ex.: -48.309418"
                  inputMode="decimal"
                  error={errors.longitude?.message}
                  {...form.register("longitude")}
                />
              </div>
              <PivotMapPanel pivot={preview} canWrite={false} />
            </FormCard>
          </div>

          <aside className="space-y-4">
            <FormCard
              title="Geometria do campo"
              subtitle="Opcional; desenha o pivô em escala no mapa. Ângulos em graus a partir do norte geográfico, no sentido horário."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="pivot-radius"
                  label="Raio irrigado (m)"
                  placeholder="Ex.: 535"
                  inputMode="decimal"
                  error={errors.radius_m?.message}
                  {...form.register("radius_m")}
                />
                <Field
                  id="pivot-spans"
                  label="Lances / torres"
                  placeholder="Ex.: 9"
                  inputMode="numeric"
                  error={errors.spans?.message}
                  {...form.register("spans")}
                />
              </div>
            </FormCard>

            <FormCard
              title="Carreador"
              subtitle="Estrada de acesso ao centro do pivô. O ângulo basta; as coordenadas são só referência."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="pivot-road-angle"
                  label="Ângulo a partir do norte"
                  placeholder="Ex.: 270"
                  inputMode="decimal"
                  error={errors.road_angle?.message}
                  {...form.register("road_angle")}
                />
                <div className="space-y-1.5">
                  <Label htmlFor="pivot-angle-reference">
                    Zero do ângulo do controlador
                  </Label>
                  <Controller
                    control={form.control}
                    name="angle_reference"
                    render={({ field }) => (
                      <Select
                        value={field.value ?? "north"}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id="pivot-angle-reference"
                          className="h-11 rounded-xl bg-background"
                          aria-invalid={Boolean(errors.angle_reference)}
                          onBlur={field.onBlur}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="north">
                            Norte geográfico
                          </SelectItem>
                          <SelectItem value="road">Carreador</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError message={errors.angle_reference?.message} />
                </div>
                <Field
                  id="pivot-road-latitude"
                  label="Latitude do carreador"
                  placeholder="Opcional"
                  inputMode="decimal"
                  error={errors.road_latitude?.message}
                  {...form.register("road_latitude")}
                />
                <Field
                  id="pivot-road-longitude"
                  label="Longitude do carreador"
                  placeholder="Opcional"
                  inputMode="decimal"
                  error={errors.road_longitude?.message}
                  {...form.register("road_longitude")}
                />
              </div>
            </FormCard>

            <FormCard
              title="Setor irrigado"
              subtitle='Pivôs "meia-lua": do ângulo inicial ao final, no sentido horário. Deixe em branco para giro completo.'
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="pivot-sweep-start"
                  label="Ângulo inicial"
                  placeholder="Ex.: 90"
                  inputMode="decimal"
                  error={errors.sweep_start_angle?.message}
                  {...form.register("sweep_start_angle")}
                />
                <Field
                  id="pivot-sweep-end"
                  label="Ângulo final"
                  placeholder="Ex.: 270"
                  inputMode="decimal"
                  error={errors.sweep_end_angle?.message}
                  {...form.register("sweep_end_angle")}
                />
              </div>
            </FormCard>
          </aside>
        </section>
      </form>
    </AppShell>
  );
};

const FormCard = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) => (
  <section className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)] lg:p-6">
    <header className="mb-4">
      <h3 className="text-base font-semibold tracking-tight lg:text-lg">
        {title}
      </h3>
      {subtitle ? (
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
    </header>
    {children}
  </section>
);

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="text-xs text-alert">{message}</p> : null;

type FieldProps = Omit<React.ComponentProps<typeof Input>, "id"> & {
  id: string;
  label: string;
  error?: string;
};

const Field = ({ id, label, error, className, ...props }: FieldProps) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>{label}</Label>
    <Input
      id={id}
      className={`h-11 rounded-xl ${className ?? ""}`}
      aria-invalid={Boolean(error)}
      {...props}
    />
    <FieldError message={error} />
  </div>
);
