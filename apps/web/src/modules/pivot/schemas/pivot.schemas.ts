import { z } from "zod";

export const PIVOT_STATUSES = ["unknown", "stopped", "running"] as const;

export type PivotStatus = (typeof PIVOT_STATUSES)[number];

// O backend pode introduzir novos estados sem quebrar a listagem: qualquer
// string é aceita e cai no rótulo genérico (ver `pivotStatusMeta`).
export const pivotSchema = z.object({
  id: z.string(),
  tenant_id: z.string(),
  name: z.string(),
  description: z.string().default(""),
  status: z.string().default("unknown"),
  device_id: z.string().nullable().default(null),
  latitude: z.number().nullable().default(null),
  longitude: z.number().nullable().default(null),
  created_at: z.string(),
  updated_at: z.string(),
});

export const pivotListResponseSchema = z.object({
  items: z.array(pivotSchema).default([]),
  total: z.number().default(0),
});

const optionalCoordinate = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .default("")
    .transform((value) => value.replace(",", "."))
    .superRefine((value, context) => {
      if (!value) {
        return;
      }

      const parsed = Number(value);
      if (!Number.isFinite(parsed)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} deve ser numérica`,
        });
        return;
      }

      if (parsed < min || parsed > max) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} deve ficar entre ${min} e ${max}`,
        });
      }
    });

// Formulário de criação/edição. Coordenadas ficam como texto no input e são
// convertidas no payload (`toPivotPayload`).
export const pivotFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Informe o nome do pivô")
      .max(120, "Nome muito longo (máx. 120 caracteres)"),
    description: z
      .string()
      .trim()
      .max(500, "Descrição muito longa (máx. 500 caracteres)")
      .default(""),
    latitude: optionalCoordinate(-90, 90, "Latitude"),
    longitude: optionalCoordinate(-180, 180, "Longitude"),
  })
  .superRefine((value, context) => {
    if (Boolean(value.latitude) !== Boolean(value.longitude)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: value.latitude ? ["longitude"] : ["latitude"],
        message: "Informe latitude e longitude juntas",
      });
    }
  });

export type Pivot = z.infer<typeof pivotSchema>;
export type PivotListResponse = z.infer<typeof pivotListResponseSchema>;
export type PivotFormInput = z.input<typeof pivotFormSchema>;
export type PivotFormValues = z.output<typeof pivotFormSchema>;

export interface PivotPayload {
  name: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
}

const toCoordinate = (value: string) => (value ? Number(value) : null);

export const toPivotPayload = (values: PivotFormValues): PivotPayload => ({
  name: values.name,
  description: values.description,
  latitude: toCoordinate(values.latitude),
  longitude: toCoordinate(values.longitude),
});

const toCoordinateInput = (value: number | null | undefined) =>
  value === null || value === undefined ? "" : String(value);

export const toPivotFormInput = (pivot?: Pivot | null): PivotFormInput => ({
  name: pivot?.name ?? "",
  description: pivot?.description ?? "",
  latitude: toCoordinateInput(pivot?.latitude),
  longitude: toCoordinateInput(pivot?.longitude),
});

// Estado de telemetria do pivô (uplink `status`/`gps` do protocolo legado v2 —
// ver ziot-api/docs/modules/pivot/protocolo-legado-v2.md, seções 4 e 7).
// Convenção de valores: `mode` 1 = seco / 2 = água · `direction` 1 = reverso /
// 2 = avanço · `secure` 1 = ok / 2 = segurança acionada · `motor` 0 / 1.
// A API ainda não expõe estado: todos os campos são opcionais e as telas
// renderizam "—" enquanto o valor não existir.
export const pivotStateSchema = z.object({
  secure: z.number().nullish(),
  motor: z.number().nullish(),
  mode: z.number().nullish(),
  direction: z.number().nullish(),
  running: z.boolean().nullish(),
  pressure: z.number().nullish(),
  pressure_unit: z.enum(["bar", "kPa"]).nullish(),
  voltage: z.number().nullish(),
  angle: z.number().nullish(),
  percentimeter: z.number().nullish(),
  operating_minutes: z.number().nullish(),
  alerts_count: z.number().nullish(),
  last_input: z.string().nullish(),
});

export type PivotState = z.infer<typeof pivotStateSchema>;

// ---------------------------------------------------------------------------
// Contrato das telas do app legado (ziot-api/docs/modules/pivot/README.md,
// "Referência de telas do app legado"). O backend ainda não implementa estes
// endpoints; o front trata 404 como "indisponível" (vazio / "—" / desabilitado).
// ---------------------------------------------------------------------------

// POST /v1/pivots/{id}/commands/manual
export const PIVOT_COMMAND_MODES = ["dry", "water"] as const;
export const PIVOT_COMMAND_DIRECTIONS = ["forward", "reverse"] as const;

export const pivotManualCommandSchema = z
  .object({
    command: z.enum(["start", "stop"]),
    mode: z.enum(PIVOT_COMMAND_MODES).optional(),
    direction: z.enum(PIVOT_COMMAND_DIRECTIONS).optional(),
    percentimeter: z.number().int().min(0).max(100).optional(),
  })
  .superRefine((value, context) => {
    if (value.command !== "start") return;
    if (!value.mode) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mode"],
        message: "Selecione o modo para iniciar",
      });
    }
    if (!value.direction) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["direction"],
        message: "Selecione a direção para iniciar",
      });
    }
  });

export type PivotManualCommand = z.infer<typeof pivotManualCommandSchema>;
export type PivotCommandMode = (typeof PIVOT_COMMAND_MODES)[number];
export type PivotCommandDirection = (typeof PIVOT_COMMAND_DIRECTIONS)[number];

// GET /v1/pivots/{id}/commands?limit=
export const pivotCommandSchema = z.object({
  id: z.string(),
  command: z.string(),
  direction: z.string().nullable().default(null),
  percentimeter: z.number().nullable().default(null),
  origin: z.string().nullable().default(null),
  accepted_at: z.string().nullable().default(null),
  created_at: z.string(),
});

// Paginação: `total` é a contagem completa; `limit`/`offset` ecoam a página.
export const pivotCommandListSchema = z.object({
  items: z.array(pivotCommandSchema).default([]),
  total: z.number().default(0),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

export type PivotCommand = z.infer<typeof pivotCommandSchema>;
export type PivotCommandList = z.infer<typeof pivotCommandListSchema>;

// GET /v1/pivots/{id}/alerts?limit=
export const pivotAlertSchema = z.object({
  id: z.string().optional(),
  kind: z.string().default("info"),
  alert: z.string(),
  code: z.number().nullable().default(null),
  created_at: z.string(),
});

export const pivotAlertListSchema = z.object({
  items: z.array(pivotAlertSchema).default([]),
  total: z.number().default(0),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

export type PivotAlert = z.infer<typeof pivotAlertSchema>;
export type PivotAlertList = z.infer<typeof pivotAlertListSchema>;

// GET /v1/pivots/{id}/history?hours=
export const pivotHistoryPointSchema = z.object({
  time: z.string(),
  pressure: z.number().nullable().default(null),
  voltage: z.number().nullable().default(null),
  angle: z.number().nullable().default(null),
});

export const pivotHistorySeriesSchema = z.object({
  hours: z.number().optional(),
  items: z.array(pivotHistoryPointSchema).default([]),
});

export type PivotHistoryPoint = z.infer<typeof pivotHistoryPointSchema>;
export type PivotHistorySeries = z.infer<typeof pivotHistorySeriesSchema>;
