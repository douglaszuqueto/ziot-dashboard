import { ApiError } from "@/shared/api/error";

export const isNotFound = (error: unknown) =>
  error instanceof ApiError && error.status === 404;

// Endpoints do contrato legado ainda não existem no backend: 404 vira "sem
// dado" em vez de erro, para a tela degradar (vazio / "—") sem quebrar.
export const nullOn404 = async <T>(request: () => Promise<T>) => {
  try {
    return await request();
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
};
