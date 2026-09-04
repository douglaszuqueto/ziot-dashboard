import {
  type PivotManualCommand,
  type PivotPayload,
  pivotAlertListSchema,
  pivotCommandListSchema,
  pivotHistorySeriesSchema,
  pivotListResponseSchema,
  pivotSchema,
  pivotStateSchema,
} from "@/modules/pivot/schemas/pivot.schemas";
import { httpRequest } from "@/shared/api/http-client";

export const fetchPivots = (token: string) =>
  httpRequest("/v1/pivots", {
    authToken: token,
    schema: pivotListResponseSchema,
  });

export const fetchPivot = (token: string, id: string) =>
  httpRequest(`/v1/pivots/${encodeURIComponent(id)}`, {
    authToken: token,
    schema: pivotSchema,
  });

export const createPivot = (token: string, payload: PivotPayload) =>
  httpRequest("/v1/pivots", {
    method: "POST",
    authToken: token,
    body: payload,
    schema: pivotSchema,
  });

export const updatePivot = (
  token: string,
  id: string,
  payload: Partial<PivotPayload>,
) =>
  httpRequest(`/v1/pivots/${encodeURIComponent(id)}`, {
    method: "PATCH",
    authToken: token,
    body: payload,
    schema: pivotSchema,
  });

export const deletePivot = (token: string, id: string) =>
  httpRequest<void>(`/v1/pivots/${encodeURIComponent(id)}`, {
    method: "DELETE",
    authToken: token,
  });

// ---------------------------------------------------------------------------
// Telemetria, comandos e histórico — contrato em ziot-api/docs/modules/pivot/
// README.md ("Referência de telas do app legado"). Ainda não implementado no
// backend: os hooks tratam 404 como indisponível.
// ---------------------------------------------------------------------------

const pivotPath = (id: string, suffix: string) =>
  `/v1/pivots/${encodeURIComponent(id)}${suffix}`;

export const fetchPivotState = (token: string, id: string) =>
  httpRequest(pivotPath(id, "/state"), {
    authToken: token,
    schema: pivotStateSchema,
  });

export interface HistoryPage {
  limit: number;
  offset: number;
}

const pageQuery = ({ limit, offset }: HistoryPage) =>
  `?limit=${limit}&offset=${offset}`;

export const fetchPivotAlerts = (
  token: string,
  id: string,
  page: HistoryPage,
) =>
  httpRequest(pivotPath(id, `/alerts${pageQuery(page)}`), {
    authToken: token,
    schema: pivotAlertListSchema,
  });

export const fetchPivotCommands = (
  token: string,
  id: string,
  page: HistoryPage,
) =>
  httpRequest(pivotPath(id, `/commands${pageQuery(page)}`), {
    authToken: token,
    schema: pivotCommandListSchema,
  });

export const fetchPivotHistory = (token: string, id: string, hours = 24) =>
  httpRequest(pivotPath(id, `/history?hours=${hours}`), {
    authToken: token,
    schema: pivotHistorySeriesSchema,
  });

export const sendPivotManualCommand = (
  token: string,
  id: string,
  payload: PivotManualCommand,
) =>
  httpRequest<unknown>(pivotPath(id, "/commands/manual"), {
    method: "POST",
    authToken: token,
    body: payload,
  });

export const requestPivotStatus = (token: string, id: string) =>
  httpRequest<unknown>(pivotPath(id, "/commands/status"), {
    method: "POST",
    authToken: token,
  });

export const requestPivotGps = (token: string, id: string) =>
  httpRequest<unknown>(pivotPath(id, "/commands/gps"), {
    method: "POST",
    authToken: token,
  });
