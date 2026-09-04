import type { PivotState } from "@/modules/pivot/schemas/pivot.schemas";
import { formatDateTimeSeconds, formatNumber } from "@/shared/lib/format";

export const EMPTY_VALUE = "—";

const labelFor = (
  value: number | null | undefined,
  labels: Record<number, string>,
) =>
  (value === null || value === undefined ? EMPTY_VALUE : labels[value]) ??
  EMPTY_VALUE;

// Convenções do protocolo legado v2 (seção 4): 1 = seco / 2 = água.
export const formatPivotMode = (mode?: number | null) =>
  labelFor(mode, { 1: "Seco", 2: "Água" });

// 1 = reverso / 2 = avanço.
export const formatPivotDirection = (direction?: number | null) =>
  labelFor(direction, { 1: "Reverso", 2: "Avanço" });

// 0 = desligado / 1 = ligado.
export const formatPivotMotor = (motor?: number | null) =>
  labelFor(motor, { 0: "Desligado", 1: "Ligado" });

// 1 = ok / 2 = segurança acionada (legado: "Seguro" / "Segurança").
export const formatPivotSecure = (secure?: number | null) =>
  labelFor(secure, { 1: "Seguro", 2: "Segurança" });

// `running` do estado (legado: LIGADO / DESLIGADO).
export const formatPivotRunning = (running?: boolean | null) =>
  running === true ? "Ligado" : running === false ? "Desligado" : EMPTY_VALUE;

// "Última atualização: dd/mm/aaaa, hh:mm:ss" a partir de `last_input`;
// `null` quando não há telemetria (o chamador escolhe o fallback).
export const formatPivotLastInput = (lastInput?: string | null) => {
  if (!lastInput) return null;
  const formatted = formatDateTimeSeconds(lastInput);
  return formatted === EMPTY_VALUE ? null : `Última atualização: ${formatted}`;
};

export const formatPivotAngle = (angle?: number | null) =>
  `${formatNumber(angle, 0)}°`;

export const formatPivotPercent = (value?: number | null) =>
  `${formatNumber(value, 0)}%`;

export const formatPivotPressure = (state?: PivotState) => ({
  value: formatNumber(state?.pressure, 1),
  unit: state?.pressure_unit ?? "bar",
});

export const formatPivotVoltage = (state?: PivotState) => ({
  value: formatNumber(state?.voltage, 0),
  unit: "V",
});

export const formatOperatingTime = (minutes?: number | null) => {
  if (minutes === null || minutes === undefined || Number.isNaN(minutes)) {
    return EMPTY_VALUE;
  }

  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return hours > 0 ? `${hours}h ${rest}min` : `${rest}min`;
};

export const isSecurityTriggered = (state?: PivotState) => state?.secure === 2;

// Legenda abaixo da ilustração: a telemetria (quando existir) tem prioridade
// sobre o status cadastral.
export const pivotCaption = (fallback: string, state?: PivotState): string => {
  if (isSecurityTriggered(state)) return "Segurança acionada";
  if (state?.running === true) {
    return state.mode === 1 ? "Em operação a seco" : "Em operação com água";
  }
  if (state?.running === false) return "Pivô parado";
  return fallback;
};
