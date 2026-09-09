import { useSyncExternalStore } from "react";

// Paletas disponíveis para comparação em runtime. Cada chave vira um
// `data-palette` no <html>; o CSS em index.css decide as cores por token, então
// nenhuma tela precisa conhecer a paleta ativa. "ziot" é o padrão e não
// escreve atributo extra — os tokens de [data-brand="ziot"] já valem.
export const PALETTES = {
  ziot: { key: "ziot", label: "Azul Ziot" },
  hortishop: { key: "hortishop", label: "Verde HortiShop" },
  solo: { key: "solo", label: "Verde Solo Digital" },
} as const;

export type PaletteKey = keyof typeof PALETTES;

export const DEFAULT_PALETTE: PaletteKey = "ziot";

export const PALETTE_STORAGE_KEY = "ziot.palette";

export const paletteOptions = Object.values(PALETTES);

export const isPaletteKey = (value: unknown): value is PaletteKey =>
  typeof value === "string" && value in PALETTES;

// localStorage pode estar indisponível (modo privado, storage cheio, SSR);
// a paleta é só preferência visual, então falhas viram o padrão em silêncio.
export const readStoredPalette = (): PaletteKey => {
  try {
    const stored = window.localStorage.getItem(PALETTE_STORAGE_KEY);
    return isPaletteKey(stored) ? stored : DEFAULT_PALETTE;
  } catch {
    return DEFAULT_PALETTE;
  }
};

const persistPalette = (palette: PaletteKey) => {
  try {
    window.localStorage.setItem(PALETTE_STORAGE_KEY, palette);
  } catch {
    // preferência não persiste, mas a paleta segue aplicada na sessão
  }
};

let currentPalette: PaletteKey = DEFAULT_PALETTE;
const listeners = new Set<() => void>();

export const applyPalette = (key: unknown) => {
  const palette = isPaletteKey(key) ? key : DEFAULT_PALETTE;
  document.documentElement.dataset.palette = palette;
  persistPalette(palette);

  if (palette !== currentPalette) {
    currentPalette = palette;
    for (const listener of listeners) {
      listener();
    }
  }

  return palette;
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => currentPalette;

export const usePalette = () => {
  const palette = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { palette, setPalette: applyPalette };
};
