import { ApiError } from "./error";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions<T> {
  method?: HttpMethod;
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
  authToken?: string | null;
  baseUrl?: string;
  schema?: {
    parse: (value: unknown) => T;
  };
}

// Lê VITE_API_BASE_URL sem depender dos tipos de vite/client no pacote —
// cada app injeta a var no build.
const apiBaseUrl = () => {
  const env = (import.meta as unknown as { env?: Record<string, string> }).env;
  return env?.VITE_API_BASE_URL ?? "";
};

const buildHeaders = ({
  authToken,
  headers,
  hasBody,
}: {
  authToken?: string | null;
  headers?: HeadersInit;
  hasBody: boolean;
}) => {
  const merged = new Headers(headers);
  merged.set("Accept", "application/json");

  if (hasBody && !merged.has("Content-Type")) {
    merged.set("Content-Type", "application/json");
  }

  if (authToken) {
    merged.set("Authorization", `Bearer ${authToken}`);
  }

  return merged;
};

const parseResponse = async (response: Response) => {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
};

export const httpRequest = async <T>(
  path: string,
  {
    method = "GET",
    body,
    headers,
    signal,
    authToken,
    baseUrl,
    schema,
  }: RequestOptions<T> = {},
): Promise<T> => {
  const hasBody = body !== undefined;
  const response = await fetch(`${baseUrl ?? apiBaseUrl()}${path}`, {
    method,
    headers: buildHeaders({ authToken, headers, hasBody }),
    body: hasBody ? JSON.stringify(body) : undefined,
    signal,
    credentials: "omit",
    mode: "cors",
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, payload);
  }

  if (!schema) {
    return payload as T;
  }

  try {
    return schema.parse(payload);
  } catch (error) {
    // Sem o corpo cru, uma violação de contrato em campo é indiagnosticável —
    // o erro do parser não diz o que respondeu nem de onde veio.
    console.error("resposta fora do contrato", {
      path,
      status: response.status,
      payload,
    });
    throw error;
  }
};
