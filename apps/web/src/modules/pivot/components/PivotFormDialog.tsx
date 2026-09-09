import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  useCreatePivotMutation,
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

const submitErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError && error.status === 409) {
    return "Já existe um pivô com esse nome neste tenant.";
  }

  return translateApiError(error, fallback);
};

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="text-xs text-alert">{message}</p> : null;

// Cria (`pivot` ausente) ou edita um pivô. O mesmo diálogo atende a lista e
// a página de detalhe.
export const PivotFormDialog = ({
  open,
  pivot,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  pivot?: Pivot | null;
  onOpenChange: (open: boolean) => void;
  onSaved?: (pivot: Pivot) => void;
}) => {
  const isEditing = Boolean(pivot);
  const createMutation = useCreatePivotMutation();
  const updateMutation = useUpdatePivotMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  // O resolver do react-hook-form só tipa a entrada; o `parse` no submit
  // aplica defaults/transforms e entrega o tipo de saída do schema.
  const form = useForm<PivotFormInput>({
    resolver: zodResolver(pivotFormSchema),
    defaultValues: toPivotFormInput(pivot),
  });

  useEffect(() => {
    if (open) {
      form.reset(toPivotFormInput(pivot));
    }
  }, [form, open, pivot]);

  const submit = form.handleSubmit(async (raw) => {
    const payload = toPivotPayload(pivotFormSchema.parse(raw));

    try {
      const saved = pivot
        ? await updateMutation.mutateAsync({ id: pivot.id, payload })
        : await createMutation.mutateAsync(payload);

      toast.success(isEditing ? "Pivô atualizado." : "Pivô cadastrado.");
      onOpenChange(false);
      onSaved?.(saved);
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

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto rounded-3xl sm:max-w-lg">
        <form onSubmit={submit} className="space-y-5" noValidate>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar pivô" : "Novo pivô"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Ajuste os dados cadastrais do pivô."
                : "Cadastre um pivô para acompanhar seu estado e, em breve, enviar comandos."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pivot-name">Nome</Label>
              <Input
                id="pivot-name"
                autoFocus
                placeholder="Ex.: Pivô 01 — Talhão norte"
                className="h-11 rounded-xl"
                aria-invalid={Boolean(errors.name)}
                {...form.register("name")}
              />
              <FieldError message={errors.name?.message} />
            </div>

            <div className="space-y-1.5">
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="pivot-latitude">Latitude</Label>
                <Input
                  id="pivot-latitude"
                  inputMode="decimal"
                  placeholder="Ex.: -22.6903"
                  className="h-11 rounded-xl"
                  aria-invalid={Boolean(errors.latitude)}
                  {...form.register("latitude")}
                />
                <FieldError message={errors.latitude?.message} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pivot-longitude">Longitude</Label>
                <Input
                  id="pivot-longitude"
                  inputMode="decimal"
                  placeholder="Ex.: -46.9827"
                  className="h-11 rounded-xl"
                  aria-invalid={Boolean(errors.longitude)}
                  {...form.register("longitude")}
                />
                <FieldError message={errors.longitude?.message} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Coordenadas são opcionais; informe latitude e longitude juntas.
            </p>

            <div className="space-y-4 rounded-2xl border border-border bg-secondary/35 p-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
                  Geometria do campo
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Opcional; desenha o pivô em escala no mapa. Ângulos em graus a
                  partir do norte geográfico, no sentido horário.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pivot-radius">Raio irrigado (m)</Label>
                  <Input
                    id="pivot-radius"
                    inputMode="decimal"
                    placeholder="Ex.: 535"
                    className="h-11 rounded-xl"
                    aria-invalid={Boolean(errors.radius_m)}
                    {...form.register("radius_m")}
                  />
                  <FieldError message={errors.radius_m?.message} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pivot-spans">Lances / torres</Label>
                  <Input
                    id="pivot-spans"
                    inputMode="numeric"
                    placeholder="Ex.: 9"
                    className="h-11 rounded-xl"
                    aria-invalid={Boolean(errors.spans)}
                    {...form.register("spans")}
                  />
                  <FieldError message={errors.spans?.message} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pivot-road-angle">
                    Carreador (ângulo a partir do norte)
                  </Label>
                  <Input
                    id="pivot-road-angle"
                    inputMode="decimal"
                    placeholder="Ex.: 270"
                    className="h-11 rounded-xl"
                    aria-invalid={Boolean(errors.road_angle)}
                    {...form.register("road_angle")}
                  />
                  <FieldError message={errors.road_angle?.message} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pivot-angle-reference">
                    Referência do ângulo do controlador
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
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pivot-road-latitude">
                    Latitude do carreador
                  </Label>
                  <Input
                    id="pivot-road-latitude"
                    inputMode="decimal"
                    placeholder="Opcional"
                    className="h-11 rounded-xl"
                    aria-invalid={Boolean(errors.road_latitude)}
                    {...form.register("road_latitude")}
                  />
                  <FieldError message={errors.road_latitude?.message} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pivot-road-longitude">
                    Longitude do carreador
                  </Label>
                  <Input
                    id="pivot-road-longitude"
                    inputMode="decimal"
                    placeholder="Opcional"
                    className="h-11 rounded-xl"
                    aria-invalid={Boolean(errors.road_longitude)}
                    {...form.register("road_longitude")}
                  />
                  <FieldError message={errors.road_longitude?.message} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pivot-sweep-start">
                    Setor irrigado — ângulo inicial
                  </Label>
                  <Input
                    id="pivot-sweep-start"
                    inputMode="decimal"
                    placeholder="Ex.: 90"
                    className="h-11 rounded-xl"
                    aria-invalid={Boolean(errors.sweep_start_angle)}
                    {...form.register("sweep_start_angle")}
                  />
                  <FieldError message={errors.sweep_start_angle?.message} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pivot-sweep-end">
                    Setor irrigado — ângulo final
                  </Label>
                  <Input
                    id="pivot-sweep-end"
                    inputMode="decimal"
                    placeholder="Ex.: 270"
                    className="h-11 rounded-xl"
                    aria-invalid={Boolean(errors.sweep_end_angle)}
                    {...form.register("sweep_end_angle")}
                  />
                  <FieldError message={errors.sweep_end_angle?.message} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Setor irrigado: do ângulo inicial ao final, no sentido horário.
                Deixe em branco para giro completo.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pivot-pressure-ref">
                Pressão de referência (bar)
              </Label>
              <Input
                id="pivot-pressure-ref"
                inputMode="decimal"
                placeholder="Opcional. Ex.: 3,5"
                className="h-11 rounded-xl"
                aria-invalid={Boolean(errors.pressure_ref)}
                {...form.register("pressure_ref")}
              />
              <FieldError message={errors.pressure_ref?.message} />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="rounded-xl" disabled={isPending}>
              {isPending
                ? "Salvando..."
                : isEditing
                  ? "Salvar alterações"
                  : "Cadastrar pivô"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
