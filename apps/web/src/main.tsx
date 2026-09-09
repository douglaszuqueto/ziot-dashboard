import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";
import { applyBrandTheme } from "@/shared/brand";
import { applyPalette, readStoredPalette } from "@/shared/theme/palette";

registerSW({ immediate: true });

applyBrandTheme();
// A paleta escolhida pelo usuário sobrepõe os tokens da marca (ver index.css).
applyPalette(readStoredPalette(), { persist: false });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
