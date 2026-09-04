import { format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const fallback = "—";

const toDate = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const date = parseISO(value);
  return isValid(date) ? date : null;
};

export const formatDateTime = (value?: string | null) => {
  const date = toDate(value);
  return date ? format(date, "dd/MM/yyyy HH:mm", { locale: ptBR }) : fallback;
};

// "dd/MM/yyyy, HH:mm:ss" — mesmo formato de "Última atualização" do app legado.
export const formatDateTimeSeconds = (value?: string | null) => {
  const date = toDate(value);
  return date
    ? format(date, "dd/MM/yyyy, HH:mm:ss", { locale: ptBR })
    : fallback;
};

export const formatDate = (value?: string | null, pattern = "dd/MM") => {
  const date = toDate(value);
  return date ? format(date, pattern, { locale: ptBR }) : fallback;
};

export const formatRelative = (value?: string | null) => {
  const date = toDate(value);
  return date
    ? `${formatDistanceToNowStrict(date, { locale: ptBR })} atrás`
    : fallback;
};

export const formatNumber = (value?: number | null, decimals = 1) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return fallback;
  }

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

export const formatInteger = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return fallback;
  }

  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatCompactNumber = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return fallback;
  }

  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
};

export const formatCoordinates = (
  value?: { lat?: number | null; lng?: number | null } | null,
) => {
  if (
    !value ||
    value.lat === null ||
    value.lat === undefined ||
    value.lng === null ||
    value.lng === undefined
  ) {
    return fallback;
  }

  return `${formatNumber(value.lat, 4)} · ${formatNumber(value.lng, 4)}`;
};

export const getInitials = (name?: string | null) => {
  if (!name) {
    return "US";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
};
