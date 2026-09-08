import { env } from "@/shared/config/env";

// Uma marca por build (VITE_APP_BRAND). Hoje só existe a Ziot; a estrutura por
// chave fica para permitir white-label no futuro sem tocar nos componentes.
const brandByKey = {
  ziot: {
    key: "ziot",
    name: "Ziot",
    tagline: "IoT Platform",
    documentTitle: "Ziot · Plataforma IoT para o campo",
    description:
      "Monitore e comande pivôs, irrigação e operação em campo com a plataforma Ziot.",
    loginTitle: "Gestão IoT para operação em campo.",
    loginHighlight: "Decida com dados.",
    loginDescription:
      "Monitore pivôs, dispositivos e operação em uma única plataforma.",
    loginHelp: "Acesse sua conta para continuar acompanhando sua operação.",
    assets: {
      logoWhite: "/brands/ziot-logo-white.png",
      logoColor: "/brands/ziot-logo-color.png",
      iconWhite: "/brands/ziot-icon-white.png",
      iconColor: "/brands/ziot-icon-color.png",
      favicon: "/brands/ziot-icon-color.png",
    },
    pwa: {
      manifest: "/manifest-ziot.webmanifest",
      appleTouchIcon: "/brands/ziot-apple-touch-180.png",
      themeColor: "#102860",
    },
  },
} as const;

export const brandConfig = brandByKey[env.VITE_APP_BRAND];

export const applyBrandTheme = () => {
  document.documentElement.dataset.brand = brandConfig.key;
  document.title = brandConfig.documentTitle;

  document
    .querySelector('meta[name="description"]')
    ?.setAttribute("content", brandConfig.description);
  document
    .querySelector('meta[name="author"]')
    ?.setAttribute("content", brandConfig.name);
  document
    .querySelector('meta[property="og:title"]')
    ?.setAttribute("content", `${brandConfig.name} · Plataforma IoT`);

  document
    .querySelector('link[rel="icon"]')
    ?.setAttribute("href", brandConfig.assets.favicon);

  document
    .querySelector('link[rel="manifest"]')
    ?.setAttribute("href", brandConfig.pwa.manifest);
  document
    .querySelector('link[rel="apple-touch-icon"]')
    ?.setAttribute("href", brandConfig.pwa.appleTouchIcon);
  document
    .querySelector('meta[name="apple-mobile-web-app-title"]')
    ?.setAttribute("content", brandConfig.name);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", brandConfig.pwa.themeColor);
};
