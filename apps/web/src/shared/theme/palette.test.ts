import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyPalette,
  DEFAULT_PALETTE,
  PALETTE_STORAGE_KEY,
  PALETTES,
  readStoredPalette,
  usePalette,
} from "./palette";

describe("palette", () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.palette;
    applyPalette(DEFAULT_PALETTE);
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("usa o verde HortiShop quando nada foi salvo", () => {
    expect(readStoredPalette()).toBe("hortishop");
    expect(PALETTES.hortishop.label).toBe("Verde HortiShop");
    expect(PALETTES.ziot.label).toBe("Azul Ziot");
  });

  it("aplica o data-palette no <html> e persiste no localStorage", () => {
    applyPalette("ziot");

    expect(document.documentElement.dataset.palette).toBe("ziot");
    expect(window.localStorage.getItem(PALETTE_STORAGE_KEY)).toBe("ziot");
    expect(readStoredPalette()).toBe("ziot");
  });

  it("na carga inicial aplica sem persistir, para o padrão poder mudar depois", () => {
    expect(applyPalette(readStoredPalette(), { persist: false })).toBe(
      "hortishop",
    );
    expect(document.documentElement.dataset.palette).toBe("hortishop");
    expect(window.localStorage.getItem(PALETTE_STORAGE_KEY)).toBeNull();
  });

  it("cai no padrão para valores desconhecidos", () => {
    window.localStorage.setItem(PALETTE_STORAGE_KEY, "roxo");
    expect(readStoredPalette()).toBe("hortishop");

    expect(applyPalette("roxo")).toBe("hortishop");
    expect(document.documentElement.dataset.palette).toBe("hortishop");
    expect(window.localStorage.getItem(PALETTE_STORAGE_KEY)).toBe("hortishop");
  });

  it("segue funcionando quando o storage falha", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage indisponível");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage indisponível");
    });

    expect(readStoredPalette()).toBe("hortishop");
    expect(applyPalette("solo")).toBe("solo");
    expect(document.documentElement.dataset.palette).toBe("solo");
  });

  it("expõe a paleta ativa pelo hook e reage a setPalette", () => {
    const { result } = renderHook(() => usePalette());
    expect(result.current.palette).toBe("hortishop");

    act(() => {
      result.current.setPalette("solo");
    });

    expect(result.current.palette).toBe("solo");
    expect(document.documentElement.dataset.palette).toBe("solo");
  });
});
