import {
  Droplets,
  Play,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Satellite,
  Square,
  Sun,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import {
  useManualCommandMutation,
  useRequestGpsMutation,
  useRequestStatusMutation,
} from "@/modules/pivot/hooks/use-pivot-commands";
import { isNotFound } from "@/modules/pivot/lib/api-fallback";
import {
  formatCommandError,
  NO_LINKED_DEVICE_ERROR,
} from "@/modules/pivot/lib/pivot-commands";
import {
  type PivotCommandAck,
  type PivotCommandDirection,
  type PivotCommandMode,
  pivotManualCommandSchema,
} from "@/modules/pivot/schemas/pivot.schemas";
import { translateApiError } from "@/shared/api/error-messages";

export const COMMANDS_UNAVAILABLE_MESSAGE =
  "Comandos ainda não disponíveis no backend";
export const START_VALIDATION_MESSAGE =
  "Selecione direção e modo para iniciar.";
export const NO_LINKED_DEVICE_MESSAGE =
  "Pivô sem dispositivo vinculado; comando ficou pendente";

// 202 com `status: "pending"` e `error`: o comando foi guardado mas não
// chegou a ser publicado (ex.: pivô sem dispositivo vinculado).
export const pendingCommandWarning = (ack: PivotCommandAck) => {
  if (!ack?.error) return null;
  if (ack.error.trim().toLowerCase() === NO_LINKED_DEVICE_ERROR) {
    return NO_LINKED_DEVICE_MESSAGE;
  }
  return `Comando ficou pendente: ${formatCommandError(ack.error)}`;
};

const commandErrorMessage = (error: unknown) =>
  isNotFound(error)
    ? COMMANDS_UNAVAILABLE_MESSAGE
    : translateApiError(error, "Não foi possível enviar o comando.");

const toggleItemClassName =
  "h-10 flex-1 gap-2 rounded-lg text-sm font-medium text-muted-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm hover:bg-card hover:text-foreground";

// "Programação manual" do app legado, adaptada ao desktop: DIREÇÃO, MODO e
// VELOCIDADE lado a lado, ação Parar / Iniciar e os pedidos de status e
// posição. Contrato: POST /v1/pivots/{id}/commands/{manual|status|gps}.
export const PivotCommandsCard = ({ pivotId }: { pivotId: string }) => {
  const [direction, setDirection] = useState<PivotCommandDirection | "">("");
  const [mode, setMode] = useState<PivotCommandMode | "">("");
  const [speed, setSpeed] = useState(100);
  const [validation, setValidation] = useState<string | null>(null);
  const manual = useManualCommandMutation(pivotId);
  const status = useRequestStatusMutation(pivotId);
  const gps = useRequestGpsMutation(pivotId);
  const busy = manual.isPending || status.isPending || gps.isPending;

  const send = async (
    successMessage: string,
    request: () => Promise<PivotCommandAck>,
  ) => {
    try {
      const ack = await request();
      const warning = pendingCommandWarning(ack);
      if (warning) {
        toast.warning(warning);
        return;
      }
      toast.success(successMessage);
    } catch (error) {
      toast.error(commandErrorMessage(error));
    }
  };

  const start = () => {
    const parsed = pivotManualCommandSchema.safeParse({
      command: "start",
      mode: mode || undefined,
      direction: direction || undefined,
      percentimeter: speed,
    });
    if (!parsed.success) {
      setValidation(START_VALIDATION_MESSAGE);
      return;
    }
    setValidation(null);
    void send("Comando de início enviado.", () =>
      manual.mutateAsync(parsed.data),
    );
  };

  const stop = () => {
    setValidation(null);
    void send("Comando de parada enviado.", () =>
      manual.mutateAsync({ command: "stop" }),
    );
  };

  return (
    <section className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)] lg:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
            Comandos
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Programação manual: direção, modo e velocidade do pivô.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            className="h-10 rounded-xl px-4 text-sm font-medium"
            disabled={busy}
            onClick={() =>
              void send("Pedido de status enviado.", () => status.mutateAsync())
            }
          >
            <RefreshCw
              className={cn("h-4 w-4", status.isPending && "animate-spin")}
            />
            Obter status
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-10 rounded-xl px-4 text-sm font-medium"
            disabled={busy}
            onClick={() =>
              void send("Pedido de posição enviado.", () => gps.mutateAsync())
            }
          >
            <Satellite className="h-4 w-4" />
            Obter posição
          </Button>
        </div>
      </header>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <CommandGroup label="Direção">
          <ToggleGroup
            type="single"
            value={direction}
            aria-label="Direção"
            onValueChange={(value) => {
              setDirection(value as PivotCommandDirection | "");
              setValidation(null);
            }}
            className="grid grid-cols-2 gap-1 rounded-xl bg-secondary/60 p-1"
          >
            <ToggleGroupItem value="reverse" className={toggleItemClassName}>
              <RotateCcw className="h-4 w-4" />
              Reverso
            </ToggleGroupItem>
            <ToggleGroupItem value="forward" className={toggleItemClassName}>
              <RotateCw className="h-4 w-4" />
              Avanço
            </ToggleGroupItem>
          </ToggleGroup>
        </CommandGroup>

        <CommandGroup label="Modo">
          <ToggleGroup
            type="single"
            value={mode}
            aria-label="Modo"
            onValueChange={(value) => {
              setMode(value as PivotCommandMode | "");
              setValidation(null);
            }}
            className="grid grid-cols-2 gap-1 rounded-xl bg-secondary/60 p-1"
          >
            <ToggleGroupItem value="dry" className={toggleItemClassName}>
              <Sun className="h-4 w-4" />
              Seco
            </ToggleGroupItem>
            <ToggleGroupItem value="water" className={toggleItemClassName}>
              <Droplets className="h-4 w-4" />
              Água
            </ToggleGroupItem>
          </ToggleGroup>
        </CommandGroup>

        <CommandGroup label="Velocidade (%)" value={`${speed}%`}>
          <div className="flex h-12 items-center rounded-xl bg-secondary/60 px-4">
            <Slider
              aria-label="Velocidade"
              min={0}
              max={100}
              step={1}
              value={[speed]}
              onValueChange={([value]) => setSpeed(value ?? 0)}
            />
          </div>
          <div className="mt-1 flex justify-between px-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </CommandGroup>
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
            Enviar comando
          </p>
          <p
            className={cn(
              "mt-1 text-sm",
              validation ? "text-alert" : "text-muted-foreground",
            )}
            role={validation ? "alert" : undefined}
          >
            {validation ??
              "Iniciar exige direção e modo; Parar envia a parada imediatamente."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="h-11 rounded-xl bg-alert px-5 text-sm font-medium text-white hover:bg-alert/90"
            disabled={busy}
            onClick={stop}
          >
            <Square className="h-4 w-4" />
            Parar
          </Button>
          <Button
            type="button"
            className="h-11 rounded-xl px-5 text-sm font-medium"
            disabled={busy}
            onClick={start}
          >
            <Play className="h-4 w-4" />
            Iniciar
          </Button>
        </div>
      </div>
    </section>
  );
};

const CommandGroup = ({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children: ReactNode;
}) => (
  <div className="rounded-3xl border border-border bg-card p-4">
    <div className="flex items-baseline justify-between gap-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
        {label}
      </p>
      {value ? (
        <span className="text-sm font-semibold text-foreground">{value}</span>
      ) : null}
    </div>
    <div className="mt-3">{children}</div>
  </div>
);
