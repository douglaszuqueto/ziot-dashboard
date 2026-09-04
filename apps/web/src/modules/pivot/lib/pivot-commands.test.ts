import { describe, expect, it } from "vitest";
import {
  formatAlertKind,
  formatCommandDirection,
  formatCommandName,
  formatCommandOrigin,
  shortId,
} from "@/modules/pivot/lib/pivot-commands";

describe("pivot-commands formatters", () => {
  it("traduz comando, direção, origem e tipo do alerta", () => {
    expect(formatCommandName("dry")).toBe("Seco");
    expect(formatCommandName("WATER")).toBe("Água");
    expect(formatCommandName("stop")).toBe("Parar");
    expect(formatCommandName("custom")).toBe("custom");
    expect(formatCommandName(null)).toBe("—");

    expect(formatCommandDirection("forward")).toBe("Avanço");
    expect(formatCommandDirection("reverse")).toBe("Reverso");
    expect(formatCommandDirection(null)).toBe("N/D");

    expect(formatCommandOrigin("manual")).toBe("Manual");
    expect(formatCommandOrigin(undefined)).toBe("—");

    expect(formatAlertKind("info")).toBe("Info");
    expect(formatAlertKind("critical")).toBe("Crítico");
    expect(formatAlertKind("")).toBe("Info");
  });

  it("encurta o UUID para a coluna Código", () => {
    expect(shortId("3f2a9c11-0000-4000-8000-000000000000")).toBe("3f2a9c11");
    expect(shortId("abc")).toBe("abc");
  });
});
