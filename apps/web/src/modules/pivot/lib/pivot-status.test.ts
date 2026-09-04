import { describe, expect, it } from "vitest";
import {
  isPivotRunning,
  pivotStatusMeta,
} from "@/modules/pivot/lib/pivot-status";

describe("pivotStatusMeta", () => {
  it("mapeia os status do contrato para pílulas no padrão das estufas", () => {
    expect(pivotStatusMeta("running")).toMatchObject({
      label: "Em operação",
      pillClassName: "bg-status/10 text-status",
      caption: "Em operação",
    });
    expect(pivotStatusMeta("stopped")).toMatchObject({
      label: "Parado",
      pillClassName: "bg-secondary text-muted-foreground",
      caption: "Pivô parado",
    });
    expect(pivotStatusMeta("unknown")).toMatchObject({
      label: "Sem status",
      pillClassName: "bg-alert/15 text-alert",
      caption: "Aguardando telemetria",
    });
  });

  it("ignora caixa e espaços e cai em 'Sem status' quando vazio", () => {
    expect(pivotStatusMeta("  RUNNING ").label).toBe("Em operação");
    expect(pivotStatusMeta(null).label).toBe("Sem status");
    expect(pivotStatusMeta("   ").label).toBe("Sem status");
  });

  it("mantém o texto de status fora do contrato com aparência de atenção", () => {
    const meta = pivotStatusMeta("maintenance");
    expect(meta.label).toBe("maintenance");
    expect(meta.pillClassName).toBe(pivotStatusMeta("unknown").pillClassName);
  });

  it("identifica pivô em operação", () => {
    expect(isPivotRunning("running")).toBe(true);
    expect(isPivotRunning("stopped")).toBe(false);
    expect(isPivotRunning(undefined)).toBe(false);
  });
});
