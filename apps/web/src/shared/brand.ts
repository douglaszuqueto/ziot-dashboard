import { env } from "@/shared/config/env";

const brandByKey = {
  hortishop: {
    key: "hortishop",
    name: "HortiShop",
    tagline: "IoT Platform",
    documentTitle: "HortiShop · Plataforma IoT para campo conectado",
    description:
      "Monitore sensores, dispositivos e estações em tempo real com a plataforma HortiShop.",
    loginTitle: "Cultive com inteligência.",
    loginHighlight: "Monitore em tempo real.",
    loginDescription:
      "Acompanhe sensores, dispositivos e alertas em uma única plataforma operacional.",
    loginHelp: "Acesse sua conta para continuar monitorando sua operação.",
    assets: {
      logoWhite: "/brands/hortishop-logo-white.png",
      logoColor: "/brands/hortishop-logo-color.png",
      iconWhite: "/brands/hortishop-icon-white.png",
      iconColor: "/brands/hortishop-icon-color.png",
      favicon: "/brands/hortishop-icon-color.png",
    },
    pwa: {
      manifest: "/manifest-hortishop.webmanifest",
      appleTouchIcon: "/brands/hortishop-apple-touch-180.png",
      themeColor: "#143428",
    },
  },
  vizeos: {
    key: "vizeos",
    name: "Vizeos",
    tagline: "IoT Platform",
    documentTitle: "Vizeos · Plataforma IoT para campo conectado",
    description:
      "Monitore sensores, dispositivos e operação em campo com a plataforma Vizeos.",
    loginTitle: "Gestão IoT para operação em campo.",
    loginHighlight: "Decida com dados.",
    loginDescription:
      "Monitore sensores, dispositivos e operação em uma única plataforma.",
    loginHelp: "Acesse sua conta para continuar acompanhando sua operação.",
    assets: {
      logoWhite: "/brands/vizeos-logo-white.png",
      logoColor: "/brands/vizeos-logo-color.png",
      iconWhite: "/brands/vizeos-icon-white.png",
      iconColor: "/brands/vizeos-icon-color.png",
      favicon: "/brands/vizeos-icon-color.png",
    },
    pwa: {
      manifest: "/manifest-vizeos.webmanifest",
      appleTouchIcon: "/brands/vizeos-apple-touch-180.png",
      themeColor: "#0F2942",
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
