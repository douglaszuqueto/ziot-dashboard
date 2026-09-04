// Rota inicial por `tenant.home_module`. Módulos verticais registram aqui a
// tela que substitui a Home padrão; sem entrada, cai na Home (`/`).
const ROUTE_BY_HOME_MODULE: Record<string, string> = {
  pivot: "/pivos",
};

export const homeRoute = (homeModule: string | null | undefined) =>
  ROUTE_BY_HOME_MODULE[homeModule ?? ""] ?? "/";
