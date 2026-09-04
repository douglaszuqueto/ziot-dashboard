import { ZodError } from "zod";

import { ApiError } from "@/shared/api/error";

// Códigos do envelope de erro da API (`{ error, code }`) com mensagem
// amigável. Sem entrada, cai na mensagem enviada pelo backend.
const KNOWN_CODES: Record<string, string> = {};

const KNOWN_MESSAGES: Record<string, string> = {};

export const translateApiError = (error: unknown, fallback: string) => {
  if (error instanceof ApiError && error.code) {
    return KNOWN_CODES[error.code] ?? error.message;
  }

  // A resposta chegou 2xx mas fora do contrato — tipicamente um serviço
  // desatualizado respondendo no lugar do esperado. A mensagem crua do Zod é
  // um JSON ilegível e não diz o que fazer.
  if (error instanceof ZodError) {
    return "Resposta inesperada do servidor. Confira a versão dos serviços e o estado atual antes de tentar novamente.";
  }

  if (!(error instanceof Error)) {
    return fallback;
  }

  return KNOWN_MESSAGES[error.message] ?? error.message;
};
