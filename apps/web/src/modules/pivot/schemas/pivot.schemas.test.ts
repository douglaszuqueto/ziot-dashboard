import { describe, expect, it } from "vitest";
import {
  pivotAlertListSchema,
  pivotCommandAckSchema,
  pivotCommandListSchema,
  pivotFormSchema,
  pivotHistorySeriesSchema,
  pivotListResponseSchema,
  pivotManualCommandSchema,
  pivotSchema,
  pivotStateSchema,
  toPivotFormInput,
  toPivotPayload,
} from "@/modules/pivot/schemas/pivot.schemas";

const apiPivot = {
  id: "pv-1",
  tenant_id: "t-1",
  name: "Pivô 01",
  description: "Talhão norte",
  status: "running",
  device_id: null,
  latitude: -22.69,
  longitude: -46.98,
  pressure_ref: null,
  created_at: "2026-09-01T10:00:00Z",
  updated_at: "2026-09-02T10:00:00Z",
};

describe("pivotSchema", () => {
  it("aceita o contrato da API", () => {
    expect(pivotSchema.parse(apiPivot)).toEqual(apiPivot);
  });

  it("aceita status desconhecidos sem quebrar a listagem", () => {
    const parsed = pivotSchema.parse({ ...apiPivot, status: "maintenance" });
    expect(parsed.status).toBe("maintenance");
  });

  it("normaliza a listagem com items e total", () => {
    const parsed = pivotListResponseSchema.parse({
      items: [apiPivot],
      total: 1,
    });
    expect(parsed.total).toBe(1);
    expect(parsed.items[0]?.name).toBe("Pivô 01");
  });
});

describe("pivotFormSchema", () => {
  it("exige nome e mantém coordenadas opcionais", () => {
    const result = pivotFormSchema.safeParse({
      name: "  ",
      description: "",
      latitude: "",
      longitude: "",
    });
    expect(result.success).toBe(false);

    const valid = pivotFormSchema.parse({
      name: "Pivô 02",
      description: "",
      latitude: "",
      longitude: "",
    });
    expect(toPivotPayload(valid)).toEqual({
      name: "Pivô 02",
      description: "",
      latitude: null,
      longitude: null,
      pressure_ref: null,
    });
  });

  it("converte coordenadas em número aceitando vírgula decimal", () => {
    const valid = pivotFormSchema.parse({
      name: "Pivô 03",
      description: "Área irrigada",
      latitude: "-22,69",
      longitude: "-46.98",
    });
    expect(toPivotPayload(valid)).toEqual({
      name: "Pivô 03",
      description: "Área irrigada",
      latitude: -22.69,
      longitude: -46.98,
      pressure_ref: null,
    });
  });

  it("aceita pressão de referência opcional (vírgula, mínimo 0)", () => {
    const valid = pivotFormSchema.parse({
      name: "Pivô 05",
      description: "",
      latitude: "",
      longitude: "",
      pressure_ref: "3,5",
    });
    expect(toPivotPayload(valid).pressure_ref).toBe(3.5);
    expect(
      pivotFormSchema.safeParse({
        name: "Pivô 05",
        description: "",
        latitude: "",
        longitude: "",
        pressure_ref: "-1",
      }).success,
    ).toBe(false);
    expect(
      toPivotFormInput(pivotSchema.parse({ ...apiPivot, pressure_ref: 2 }))
        .pressure_ref,
    ).toBe("2");
  });

  it("rejeita coordenadas fora do intervalo ou incompletas", () => {
    expect(
      pivotFormSchema.safeParse({
        name: "Pivô 04",
        description: "",
        latitude: "120",
        longitude: "-46.98",
      }).success,
    ).toBe(false);

    const partial = pivotFormSchema.safeParse({
      name: "Pivô 04",
      description: "",
      latitude: "-22.69",
      longitude: "",
    });
    expect(partial.success).toBe(false);
    if (!partial.success) {
      expect(partial.error.issues[0]?.path).toEqual(["longitude"]);
    }
  });

  it("preenche o formulário a partir de um pivô existente", () => {
    expect(toPivotFormInput(pivotSchema.parse(apiPivot))).toEqual({
      name: "Pivô 01",
      description: "Talhão norte",
      latitude: "-22.69",
      longitude: "-46.98",
      pressure_ref: "",
    });
    expect(toPivotFormInput(null)).toEqual({
      name: "",
      description: "",
      latitude: "",
      longitude: "",
      pressure_ref: "",
    });
  });
});

describe("contrato legado: comandos, alertas, histórico", () => {
  it("exige modo e direção para start e aceita stop sem seleção", () => {
    const start = pivotManualCommandSchema.safeParse({ command: "start" });
    expect(start.success).toBe(false);
    if (!start.success) {
      expect(start.error.issues.map((issue) => issue.path[0])).toEqual([
        "mode",
        "direction",
      ]);
    }

    expect(
      pivotManualCommandSchema.safeParse({
        command: "start",
        mode: "water",
        direction: "forward",
        percentimeter: 50,
      }).success,
    ).toBe(true);
    expect(
      pivotManualCommandSchema.safeParse({ command: "stop" }).success,
    ).toBe(true);
    expect(
      pivotManualCommandSchema.safeParse({
        command: "stop",
        percentimeter: 120,
      }).success,
    ).toBe(false);
  });

  it("normaliza listas de comandos e alertas com defaults", () => {
    const commands = pivotCommandListSchema.parse({
      items: [
        {
          id: "cmd-1",
          command: "water",
          created_at: "2026-09-03T15:40:00Z",
        },
      ],
    });
    expect(commands.total).toBe(0);
    expect(commands.items[0]).toEqual({
      id: "cmd-1",
      command: "water",
      status: "pending",
      seq: null,
      direction: null,
      percentimeter: null,
      origin: null,
      error: null,
      sent_at: null,
      accepted_at: null,
      created_at: "2026-09-03T15:40:00Z",
    });

    const failed = pivotCommandListSchema.parse({
      items: [
        {
          id: "cmd-2",
          command: "stop",
          status: "failed",
          seq: 7,
          error: "timeout",
          sent_at: "2026-09-03T15:40:01Z",
          created_at: "2026-09-03T15:40:00Z",
        },
      ],
    }).items[0];
    expect(failed).toMatchObject({
      status: "failed",
      seq: 7,
      error: "timeout",
    });

    expect(pivotCommandAckSchema.parse(null)).toBeNull();
    expect(
      pivotCommandAckSchema.parse({
        id: "cmd-3",
        status: "pending",
        error: "no linked device",
      }),
    ).toMatchObject({ status: "pending", error: "no linked device" });

    const alerts = pivotAlertListSchema.parse({
      items: [{ alert: "Pivô parado", created_at: "2026-09-03T15:40:00Z" }],
    });
    expect(alerts.items[0]?.kind).toBe("info");
    expect(alerts.items[0]?.code).toBeNull();
    expect(pivotAlertListSchema.parse({})).toEqual({ items: [], total: 0 });

    const paged = pivotAlertListSchema.parse({
      items: [],
      total: 34,
      limit: 10,
      offset: 20,
    });
    expect(paged).toMatchObject({ total: 34, limit: 10, offset: 20 });
  });

  it("aceita o estado com last_input e a série do histórico", () => {
    expect(
      pivotStateSchema.parse({
        running: true,
        secure: 1,
        angle: 249,
        last_input: "2026-09-03T15:42:10Z",
      }).last_input,
    ).toBe("2026-09-03T15:42:10Z");

    const history = pivotHistorySeriesSchema.parse({
      hours: 24,
      items: [{ time: "2026-09-03T15:00:00Z", pressure: 3.9 }],
    });
    expect(history.items[0]).toEqual({
      time: "2026-09-03T15:00:00Z",
      pressure: 3.9,
      voltage: null,
      angle: null,
    });
  });
});
