import { describe, expect, it } from "vitest";
import {
  formatOperatingTime,
  formatPivotAngle,
  formatPivotDirection,
  formatPivotLastInput,
  formatPivotMode,
  formatPivotMotor,
  formatPivotPercent,
  formatPivotPressure,
  formatPivotRunning,
  formatPivotSecure,
  formatPivotVoltage,
  pivotCaption,
} from "@/modules/pivot/lib/pivot-state";

describe("pivot-state formatters", () => {
  it("traduz os códigos do protocolo v2 e usa '—' quando ausentes", () => {
    expect(formatPivotMode(1)).toBe("Seco");
    expect(formatPivotMode(2)).toBe("Água");
    expect(formatPivotMode(undefined)).toBe("—");
    expect(formatPivotMode(0)).toBe("—");

    expect(formatPivotDirection(1)).toBe("Reverso");
    expect(formatPivotDirection(2)).toBe("Avanço");
    expect(formatPivotDirection(null)).toBe("—");

    expect(formatPivotMotor(0)).toBe("Desligado");
    expect(formatPivotMotor(1)).toBe("Ligado");
    expect(formatPivotMotor(undefined)).toBe("—");

    expect(formatPivotSecure(1)).toBe("Seguro");
    expect(formatPivotSecure(2)).toBe("Segurança");
    expect(formatPivotSecure(undefined)).toBe("—");

    expect(formatPivotRunning(true)).toBe("Ligado");
    expect(formatPivotRunning(false)).toBe("Desligado");
    expect(formatPivotRunning(null)).toBe("—");
  });

  it("formata ângulo e percentímetro com unidade mesmo sem valor", () => {
    expect(formatPivotAngle(undefined)).toBe("—°");
    expect(formatPivotAngle(137.6)).toBe("138°");
    expect(formatPivotPercent(undefined)).toBe("—%");
    expect(formatPivotPercent(55)).toBe("55%");
  });

  it("formata pressão e tensão com unidade padrão", () => {
    expect(formatPivotPressure(undefined)).toEqual({ value: "—", unit: "bar" });
    expect(
      formatPivotPressure({ pressure: 3.92, pressure_unit: "kPa" }),
    ).toEqual({ value: "3,9", unit: "kPa" });
    expect(formatPivotVoltage(undefined)).toEqual({ value: "—", unit: "V" });
    expect(formatPivotVoltage({ voltage: 502.39 })).toEqual({
      value: "502",
      unit: "V",
    });
  });

  it("formata a última atualização no padrão do app legado", () => {
    expect(formatPivotLastInput("2026-09-03T15:42:10Z")).toMatch(
      /^Última atualização: 03\/09\/2026, \d{2}:42:10$/,
    );
    expect(formatPivotLastInput(null)).toBeNull();
    expect(formatPivotLastInput("nope")).toBeNull();
  });

  it("formata tempo de operação em horas e minutos", () => {
    expect(formatOperatingTime(undefined)).toBe("—");
    expect(formatOperatingTime(45)).toBe("45min");
    expect(formatOperatingTime(200)).toBe("3h 20min");
  });

  it("prioriza a telemetria sobre o status cadastral na legenda", () => {
    expect(pivotCaption("Aguardando telemetria", undefined)).toBe(
      "Aguardando telemetria",
    );
    expect(pivotCaption("Aguardando telemetria", { secure: 2 })).toBe(
      "Segurança acionada",
    );
    expect(pivotCaption("Parado", { running: true, mode: 2 })).toBe(
      "Em operação com água",
    );
    expect(pivotCaption("Parado", { running: true, mode: 1 })).toBe(
      "Em operação a seco",
    );
    expect(pivotCaption("Em operação", { running: false })).toBe("Pivô parado");
  });
});
