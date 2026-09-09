import { z } from "zod";

export const PIVOT_STATUSES = ["unknown", "stopped", "running"] as const;

export type PivotStatus = (typeof PIVOT_STATUSES)[number];

// Onde fica o zero do ângulo reportado pelo controlador: no norte geográfico
// ou no carreador (estrada de acesso). Ver `pivotBearing` em
// `lib/pivot-geometry.ts`.
export const PIVOT_ANGLE_REFERENCES = ["north", "road"] as const;

export type PivotAngleReference = (typeof PIVOT_ANGLE_REFERENCES)[number];

// O backend pode introduzir novos estados sem quebrar a listagem: qualquer
// string é aceita e cai no rótulo genérico (ver `pivotStatusMeta`).
//
// Geometria do campo (todos opcionais): ângulos do cadastro são azimutes
// geográficos (0° = norte, sentido horário). `road_angle` é a direção do
// carreador a partir do centro; `sweep_*` delimitam o setor irrigado dos
// pivôs "meia-lua" (do inicial ao final, sentido horário; ambos nulos = giro
// completo).
export const pivotSchema = z.object({
  id: z.string(),
  tenant_id: z.string(),
  name: z.string(),
  description: z.string().default(""),
  status: z.string().default("unknown"),
  device_id: z.string().nullable().default(null),
  latitude: z.number().nullable().default(null),
  longitude: z.number().nullable().default(null),
  // Pressão de referência (bar) informada no cadastro; opcional.
  pressure_ref: z.number().nullable().default(null),
  // Raio irrigado em metros.
  radius_m: z.number().nullable().default(null),
  // Quantidade de lances/torres ao longo do braço.
  spans: z.number().nullable().default(null),
  angle_reference: z.enum(PIVOT_ANGLE_REFERENCES).default("north"),
  road_angle: z.number().nullable().default(null),
  road_latitude: z.number().nullable().default(null),
  road_longitude: z.number().nullable().default(null),
  sweep_start_angle: z.number().nullable().default(null),
  sweep_end_angle: z.number().nullable().default(null),
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

// Número opcional (texto no input, vírgula aceita) com limites. `exclusive*`
// troca "maior ou igual a" por "maior que" (idem para o máximo).
const optionalNumber = (
  min: number,
  label: string,
  options: {
    max?: number;
    exclusiveMin?: boolean;
    exclusiveMax?: boolean;
    integer?: boolean;
  } = {},
) =>
  z
    .string()
    .trim()
    .default("")
    .transform((value) => value.replace(",", "."))
    .superRefine((value, context) => {
      if (!value) return;
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} deve ser um número`,
        });
        return;
      }
      if (options.integer && !Number.isInteger(parsed)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} deve ser um número inteiro`,
        });
        return;
      }
      if (options.exclusiveMin ? parsed <= min : parsed < min) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: options.exclusiveMin
            ? `${label} deve ser maior que ${min}`
            : `${label} deve ser maior ou igual a ${min}`,
        });
        return;
      }
      const { max } = options;
      if (
        max !== undefined &&
        (options.exclusiveMax ? parsed >= max : parsed > max)
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: options.exclusiveMax
            ? `${label} deve ser menor que ${max}`
            : `${label} deve ser menor ou igual a ${max}`,
        });
      }
    });

// Azimute opcional em graus: 0 ≤ x < 360.
const optionalBearing = (label: string) =>
  optionalNumber(0, label, { max: 360, exclusiveMax: true });

// Formulário de criação/edição. Coordenadas e pressão ficam como texto no
// input e são convertidas no payload (`toPivotPayload`).
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
    pressure_ref: optionalNumber(0, "Pressão de referência"),
    // Geometria do campo (ver comentário em `pivotSchema`).
    radius_m: optionalNumber(0, "Raio irrigado", {
      max: 2000,
      exclusiveMin: true,
    }),
    spans: optionalNumber(1, "Número de lances", { max: 30, integer: true }),
    angle_reference: z.enum(PIVOT_ANGLE_REFERENCES).default("north"),
    road_angle: optionalBearing("Ângulo do carreador"),
    road_latitude: optionalCoordinate(-90, 90, "Latitude do carreador"),
    road_longitude: optionalCoordinate(-180, 180, "Longitude do carreador"),
    sweep_start_angle: optionalBearing("Ângulo inicial do setor"),
    sweep_end_angle: optionalBearing("Ângulo final do setor"),
  })
  .superRefine((value, context) => {
    if (Boolean(value.latitude) !== Boolean(value.longitude)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: value.latitude ? ["longitude"] : ["latitude"],
        message: "Informe latitude e longitude juntas",
      });
    }

    // Mesmas regras cruzadas do backend (POST/PATCH /v1/pivots).
    if (Boolean(value.road_latitude) !== Boolean(value.road_longitude)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: value.road_latitude ? ["road_longitude"] : ["road_latitude"],
        message: "Informe latitude e longitude do carreador juntas",
      });
    }

    if (value.angle_reference === "road" && !value.road_angle) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["road_angle"],
        message: "Informe o ângulo do carreador para usá-lo como referência",
      });
    }

    const hasStart = Boolean(value.sweep_start_angle);
    const hasEnd = Boolean(value.sweep_end_angle);
    if (hasStart !== hasEnd) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: hasStart ? ["sweep_end_angle"] : ["sweep_start_angle"],
        message: "Informe os ângulos inicial e final do setor juntos",
      });
    } else if (
      hasStart &&
      Number(value.sweep_start_angle) === Number(value.sweep_end_angle)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sweep_end_angle"],
        message: "Os ângulos inicial e final do setor devem ser diferentes",
      });
    }
  });

export type Pivot = z.infer<typeof pivotSchema>;
export type PivotListResponse = z.infer<typeof pivotListResponseSchema>;
export type PivotFormInput = z.input<typeof pivotFormSchema>;
export type PivotFormValues = z.output<typeof pivotFormSchema>;

// Payload de POST/PATCH: todos os campos vão sempre (null quando vazio), para
// que limpar um campo no formulário também o limpe no backend.
export interface PivotPayload {
  name: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  pressure_ref: number | null;
  radius_m: number | null;
  spans: number | null;
  angle_reference: PivotAngleReference;
  road_angle: number | null;
  road_latitude: number | null;
  road_longitude: number | null;
  sweep_start_angle: number | null;
  sweep_end_angle: number | null;
}

const toCoordinate = (value: string) => (value ? Number(value) : null);

export const toPivotPayload = (values: PivotFormValues): PivotPayload => ({
  name: values.name,
  description: values.description,
  latitude: toCoordinate(values.latitude),
  longitude: toCoordinate(values.longitude),
  pressure_ref: toCoordinate(values.pressure_ref),
  radius_m: toCoordinate(values.radius_m),
  spans: toCoordinate(values.spans),
  angle_reference: values.angle_reference,
  road_angle: toCoordinate(values.road_angle),
  road_latitude: toCoordinate(values.road_latitude),
  road_longitude: toCoordinate(values.road_longitude),
  sweep_start_angle: toCoordinate(values.sweep_start_angle),
  sweep_end_angle: toCoordinate(values.sweep_end_angle),
});

const toCoordinateInput = (value: number | null | undefined) =>
  value === null || value === undefined ? "" : String(value);

export const toPivotFormInput = (pivot?: Pivot | null): PivotFormInput => ({
  name: pivot?.name ?? "",
  description: pivot?.description ?? "",
  latitude: toCoordinateInput(pivot?.latitude),
  longitude: toCoordinateInput(pivot?.longitude),
  pressure_ref: toCoordinateInput(pivot?.pressure_ref),
  radius_m: toCoordinateInput(pivot?.radius_m),
  spans: toCoordinateInput(pivot?.spans),
  angle_reference: pivot?.angle_reference ?? "north",
  road_angle: toCoordinateInput(pivot?.road_angle),
  road_latitude: toCoordinateInput(pivot?.road_latitude),
  road_longitude: toCoordinateInput(pivot?.road_longitude),
  sweep_start_angle: toCoordinateInput(pivot?.sweep_start_angle),
  sweep_end_angle: toCoordinateInput(pivot?.sweep_end_angle),
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
// Ciclo do comando (protocolo-mqtt-v2.md §6): pending → sent (downlink
// publicado) → accepted (ack 00) | failed (ack 01/02 ou timeout de 30 s).
export const PIVOT_COMMAND_STATUSES = [
  "pending",
  "sent",
  "accepted",
  "failed",
] as const;

export const pivotCommandSchema = z.object({
  id: z.string(),
  command: z.string(),
  status: z.string().default("pending"),
  seq: z.number().nullable().default(null),
  direction: z.string().nullable().default(null),
  percentimeter: z.number().nullable().default(null),
  origin: z.string().nullable().default(null),
  error: z.string().nullable().default(null),
  sent_at: z.string().nullable().default(null),
  accepted_at: z.string().nullable().default(null),
  created_at: z.string(),
});

// Resposta dos POST .../commands/* (202). Pode vir vazia; com `error` e
// `status: "pending"` o pivô não tem dispositivo vinculado.
export const pivotCommandAckSchema = z
  .object({
    id: z.string().optional(),
    status: z.string().optional(),
    error: z.string().nullable().optional(),
  })
  .passthrough()
  .nullable();

export type PivotCommandAck = z.infer<typeof pivotCommandAckSchema>;

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
