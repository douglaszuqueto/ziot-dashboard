import { EMPTY_VALUE } from "@/modules/pivot/lib/pivot-state";

const upper = (value: string) => value.trim().toUpperCase();

// Rótulos do histórico de comandos (app legado: SECO / ÁGUA / STOP).
export const formatCommandName = (command?: string | null) => {
  if (!command?.trim()) return EMPTY_VALUE;
  const labels: Record<string, string> = {
    DRY: "Seco",
    WATER: "Água",
    STOP: "Parar",
    START: "Iniciar",
    STATUS: "Status",
    GPS: "Posição",
  };
  return labels[upper(command)] ?? command.trim();
};

// Direção do comando (legado: AVANÇO / N/D).
export const formatCommandDirection = (direction?: string | null) => {
  if (!direction?.trim()) return "N/D";
  const labels: Record<string, string> = {
    FORWARD: "Avanço",
    REVERSE: "Reverso",
  };
  return labels[upper(direction)] ?? direction.trim();
};

export const formatCommandOrigin = (origin?: string | null) => {
  if (!origin?.trim()) return EMPTY_VALUE;
  const labels: Record<string, string> = {
    MANUAL: "Manual",
    AUTO: "Automático",
    SCHEDULE: "Programação",
    AUTORECLOSE: "Religamento automático",
    REQUESTER: "Consulta automática",
  };
  return labels[upper(origin)] ?? origin.trim();
};

// Tipo do alerta (legado: INFO).
export const formatAlertKind = (kind?: string | null) => {
  if (!kind?.trim()) return "Info";
  const labels: Record<string, string> = {
    INFO: "Info",
    WARNING: "Atenção",
    CRITICAL: "Crítico",
  };
  return labels[upper(kind)] ?? kind.trim();
};

// Código curto do UUID para a coluna "Código".
export const shortId = (id: string) => id.split("-")[0] ?? id;

export interface CommandStatusMeta {
  label: string;
  className: string;
}

// Pílula de status do comando (mesma linguagem de cores do app: status =
// verde ok, primary = em andamento, secondary = neutro, alert = falha).
export const commandStatusMeta = (
  status?: string | null,
): CommandStatusMeta => {
  const key = (status ?? "").trim().toLowerCase();
  const metas: Record<string, CommandStatusMeta> = {
    pending: {
      label: "Pendente",
      className: "bg-secondary text-muted-foreground",
    },
    sent: { label: "Enviado", className: "bg-primary/10 text-primary" },
    accepted: { label: "Aceito", className: "bg-status/10 text-status" },
    failed: { label: "Falhou", className: "bg-alert/15 text-alert" },
  };
  return (
    metas[key] ?? {
      label: key ? (status?.trim() ?? EMPTY_VALUE) : "Pendente",
      className: "bg-secondary text-muted-foreground",
    }
  );
};

export const isCommandFailed = (status?: string | null) =>
  (status ?? "").trim().toLowerCase() === "failed";

export const NO_LINKED_DEVICE_ERROR = "no linked device";

// Motivo de falha vindo do backend, em português.
export const formatCommandError = (error?: string | null) => {
  if (!error?.trim()) return null;
  const labels: Record<string, string> = {
    timeout: "Sem resposta do dispositivo (timeout)",
    [NO_LINKED_DEVICE_ERROR]: "Pivô sem dispositivo vinculado",
  };
  return labels[error.trim().toLowerCase()] ?? error.trim();
};
