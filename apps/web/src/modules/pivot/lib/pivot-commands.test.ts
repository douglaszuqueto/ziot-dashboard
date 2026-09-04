import { describe, expect, it } from "vitest";
import {
  commandStatusMeta,
  formatAlertKind,
  formatCommandDirection,
  formatCommandError,
  formatCommandName,
  formatCommandOrigin,
  isCommandFailed,
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

  it("mapeia o status do comando para a pílula e traduz o erro", () => {
    expect(commandStatusMeta("pending").label).toBe("Pendente");
    expect(commandStatusMeta("sent").label).toBe("Enviado");
    expect(commandStatusMeta("accepted")).toEqual({
      label: "Aceito",
      className: "bg-status/10 text-status",
    });
    expect(commandStatusMeta("failed").className).toBe(
      "bg-alert/15 text-alert",
    );
    expect(commandStatusMeta(undefined).label).toBe("Pendente");
    expect(commandStatusMeta("weird").label).toBe("weird");

    expect(isCommandFailed("failed")).toBe(true);
    expect(isCommandFailed("sent")).toBe(false);

    expect(formatCommandError("timeout")).toBe(
      "Sem resposta do dispositivo (timeout)",
    );
    expect(formatCommandError("no linked device")).toBe(
      "Pivô sem dispositivo vinculado",
    );
    expect(formatCommandError("boom")).toBe("boom");
    expect(formatCommandError(null)).toBeNull();
  });
});
