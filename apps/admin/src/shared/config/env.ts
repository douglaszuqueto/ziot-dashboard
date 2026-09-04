import { z } from "zod";

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().min(1).default("/api"),
  VITE_GOOGLE_MAPS_API_KEY: z.string().default(""),
});

const resolveApiBaseUrl = () => {
  const configured = import.meta.env.VITE_API_BASE_URL ?? "/api";

  if (!import.meta.env.DEV) {
    return configured;
  }

  if (!/^https?:\/\//i.test(configured)) {
    return configured;
  }

  try {
    const baseUrl = new URL(configured);
    const currentUrl = new URL(window.location.origin);

    const isLocalApi =
      ["localhost", "127.0.0.1"].includes(baseUrl.hostname) &&
      baseUrl.origin !== currentUrl.origin;

    return isLocalApi ? "/api" : configured;
  } catch {
    return configured;
  }
};

export const env = envSchema.parse({
  VITE_API_BASE_URL: resolveApiBaseUrl(),
  VITE_GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "",
});
