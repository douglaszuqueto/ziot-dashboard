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
  radius_m: null,
  spans: null,
  angle_reference: "north",
  road_angle: null,
  road_latitude: null,
  road_longitude: null,
  sweep_start_angle: null,
  sweep_end_angle: null,
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
      radius_m: null,
      spans: null,
      angle_reference: "north",
      road_angle: null,
      road_latitude: null,
      road_longitude: null,
      sweep_start_angle: null,
      sweep_end_angle: null,
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
      radius_m: null,
      spans: null,
      angle_reference: "north",
      road_angle: null,
      road_latitude: null,
      road_longitude: null,
      sweep_start_angle: null,
      sweep_end_angle: null,
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
      radius_m: "",
      spans: "",
      angle_reference: "north",
      road_angle: "",
      road_latitude: "",
      road_longitude: "",
      sweep_start_angle: "",
      sweep_end_angle: "",
    });
    expect(toPivotFormInput(null)).toEqual({
      name: "",
      description: "",
      latitude: "",
      longitude: "",
      pressure_ref: "",
      radius_m: "",
      spans: "",
      angle_reference: "north",
      road_angle: "",
      road_latitude: "",
      road_longitude: "",
      sweep_start_angle: "",
      sweep_end_angle: "",
    });
  });
});

describe("pivotFormSchema — geometria do campo", () => {
  const base = {
    name: "Pivô 06",
    description: "",
    latitude: "",
    longitude: "",
  };

  const issuePaths = (input: Record<string, unknown>) => {
    const result = pivotFormSchema.safeParse({ ...base, ...input });
    return result.success
      ? []
      : result.error.issues.map((issue) => issue.path.join("."));
  };

  it("converte raio, lances, carreador e setor aceitando vírgula", () => {
    const valid = pivotFormSchema.parse({
      ...base,
      radius_m: "535,5",
      spans: "9",
      angle_reference: "road",
      road_angle: "270",
      road_latitude: "-20,30",
      road_longitude: "-48.31",
      sweep_start_angle: "350",
      sweep_end_angle: "10",
    });
    expect(toPivotPayload(valid)).toMatchObject({
      radius_m: 535.5,
      spans: 9,
      angle_reference: "road",
      road_angle: 270,
      road_latitude: -20.3,
      road_longitude: -48.31,
      sweep_start_angle: 350,
      sweep_end_angle: 10,
    });
  });

  it("usa norte como referência padrão e envia null nos campos vazios", () => {
    const valid = pivotFormSchema.parse(base);
    expect(valid.angle_reference).toBe("north");
    expect(toPivotPayload(valid)).toMatchObject({
      radius_m: null,
      spans: null,
      angle_reference: "north",
      road_angle: null,
      sweep_start_angle: null,
      sweep_end_angle: null,
    });
  });

  it("valida os limites do raio e dos lances", () => {
    expect(issuePaths({ radius_m: "0" })).toEqual(["radius_m"]);
    expect(issuePaths({ radius_m: "2001" })).toEqual(["radius_m"]);
    expect(issuePaths({ radius_m: "2000" })).toEqual([]);
    expect(issuePaths({ radius_m: "abc" })).toEqual(["radius_m"]);
    expect(issuePaths({ spans: "0" })).toEqual(["spans"]);
    expect(issuePaths({ spans: "31" })).toEqual(["spans"]);
    expect(issuePaths({ spans: "2.5" })).toEqual(["spans"]);
    expect(issuePaths({ spans: "30" })).toEqual([]);
  });

  it("aceita azimutes em [0, 360)", () => {
    expect(issuePaths({ road_angle: "0" })).toEqual([]);
    expect(issuePaths({ road_angle: "359,9" })).toEqual([]);
    expect(issuePaths({ road_angle: "360" })).toEqual(["road_angle"]);
    expect(issuePaths({ road_angle: "-1" })).toEqual(["road_angle"]);
  });

  it("exige o ângulo do carreador quando ele é a referência", () => {
    expect(issuePaths({ angle_reference: "road" })).toEqual(["road_angle"]);
    expect(issuePaths({ angle_reference: "road", road_angle: "0" })).toEqual(
      [],
    );
    expect(issuePaths({ angle_reference: "north" })).toEqual([]);
  });

  it("exige latitude e longitude do carreador juntas", () => {
    expect(issuePaths({ road_latitude: "-20.3" })).toEqual(["road_longitude"]);
    expect(issuePaths({ road_longitude: "-48.3" })).toEqual(["road_latitude"]);
    expect(
      issuePaths({ road_latitude: "-20.3", road_longitude: "-48.3" }),
    ).toEqual([]);
    expect(
      issuePaths({ road_latitude: "95", road_longitude: "-48.3" }),
    ).toEqual(["road_latitude"]);
  });

  it("exige os dois ângulos do setor, diferentes entre si", () => {
    expect(issuePaths({ sweep_start_angle: "90" })).toEqual([
      "sweep_end_angle",
    ]);
    expect(issuePaths({ sweep_end_angle: "90" })).toEqual([
      "sweep_start_angle",
    ]);
    expect(
      issuePaths({ sweep_start_angle: "90", sweep_end_angle: "90,0" }),
    ).toEqual(["sweep_end_angle"]);
    expect(
      issuePaths({ sweep_start_angle: "90", sweep_end_angle: "270" }),
    ).toEqual([]);
  });

  it("preenche e lê de volta a geometria de um pivô existente", () => {
    const parsed = pivotSchema.parse({
      ...apiPivot,
      radius_m: 535,
      spans: 9,
      angle_reference: "road",
      road_angle: 270,
      sweep_start_angle: 350,
      sweep_end_angle: 10,
    });
    expect(toPivotFormInput(parsed)).toMatchObject({
      radius_m: "535",
      spans: "9",
      angle_reference: "road",
      road_angle: "270",
      road_latitude: "",
      road_longitude: "",
      sweep_start_angle: "350",
      sweep_end_angle: "10",
    });
  });

  it("aplica defaults da geometria no contrato da API", () => {
    const { radius_m, angle_reference, ...rest } = apiPivot;
    const parsed = pivotSchema.parse(rest);
    expect(parsed.radius_m).toBeNull();
    expect(parsed.angle_reference).toBe("north");
    expect(radius_m).toBeNull();
    expect(angle_reference).toBe("north");
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
