import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  PivotHistoryCard,
  pageRange,
} from "@/modules/pivot/components/PivotHistoryCard";

type QueryStub = {
  data?: { items: unknown[]; total: number };
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => Promise<unknown>;
};

const alertsQuery: QueryStub = {
  data: { items: [], total: 0 },
  isLoading: false,
  isFetching: false,
  isError: false,
  refetch: vi.fn(async () => undefined),
};
const commandsQuery: QueryStub = {
  ...alertsQuery,
  refetch: vi.fn(async () => undefined),
};
type HistoryOptions = { limit: number; offset: number };
const useAlertsMock = vi.fn(
  (_id: string, _options?: HistoryOptions) => alertsQuery,
);
const useCommandsMock = vi.fn(
  (_id: string, _options?: HistoryOptions) => commandsQuery,
);

vi.mock("@/modules/pivot/hooks/use-pivot-history", () => ({
  HISTORY_PAGE_SIZE: 10,
  usePivotAlerts: (id: string, options?: HistoryOptions) =>
    useAlertsMock(id, options),
  usePivotCommands: (id: string, options?: HistoryOptions) =>
    useCommandsMock(id, options),
}));

const alertItems = (count: number, start = 0) =>
  Array.from({ length: count }, (_, index) => ({
    id: `al-${start + index}`,
    kind: "info",
    alert: `Alerta ${start + index + 1}`,
    code: index,
    created_at: "2026-09-03T15:42:10Z",
  }));

const lastAlertsOptions = () => useAlertsMock.mock.calls.at(-1)?.[1];

const selectTab = (name: string) => {
  fireEvent.mouseDown(screen.getByRole("tab", { name }));
  fireEvent.click(screen.getByRole("tab", { name }));
};

describe("PivotHistoryCard", () => {
  beforeEach(() => {
    useAlertsMock.mockClear();
    useCommandsMock.mockClear();
    Object.assign(alertsQuery, {
      data: { items: [], total: 0 },
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(async () => undefined),
    });
    Object.assign(commandsQuery, {
      data: { items: [], total: 0 },
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(async () => undefined),
    });
  });

  it("mostra o estado vazio dos alertas sem paginação", () => {
    render(<PivotHistoryCard pivotId="pv-1" />);

    expect(screen.getByText("Histórico de alertas")).toBeInTheDocument();
    expect(screen.getByText("Nenhum alerta registrado")).toBeInTheDocument();
    for (const column of ["Tipo", "Alerta", "Data"]) {
      expect(
        screen.getByRole("columnheader", { name: column }),
      ).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: /Próxima/ })).toBeNull();
    expect(lastAlertsOptions()).toEqual({ limit: 10, offset: 0 });
  });

  it("mostra o estado vazio dos comandos na aba Comandos", () => {
    render(<PivotHistoryCard pivotId="pv-1" />);

    selectTab("Comandos");

    expect(screen.getByText("Histórico de comandos")).toBeInTheDocument();
    expect(screen.getByText("Nenhum comando enviado")).toBeInTheDocument();
    for (const column of [
      "Código",
      "Comando",
      "Status",
      "Direção",
      "Velocidade",
      "Origem",
      "Aceito",
      "Data",
    ]) {
      expect(
        screen.getByRole("columnheader", { name: column }),
      ).toBeInTheDocument();
    }
  });

  it("pagina de 10 em 10 respeitando os limites", () => {
    alertsQuery.data = { items: alertItems(10), total: 34 };

    render(<PivotHistoryCard pivotId="pv-1" />);

    expect(screen.getByText("1–10 de 34")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Anterior/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Próxima/ })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: /Próxima/ }));
    expect(screen.getByText("11–20 de 34")).toBeInTheDocument();
    expect(lastAlertsOptions()).toEqual({ limit: 10, offset: 10 });
    expect(screen.getByRole("button", { name: /Anterior/ })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: /Próxima/ }));
    fireEvent.click(screen.getByRole("button", { name: /Próxima/ }));
    expect(screen.getByText("31–34 de 34")).toBeInTheDocument();
    expect(lastAlertsOptions()).toEqual({ limit: 10, offset: 30 });
    expect(screen.getByRole("button", { name: /Próxima/ })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /Anterior/ }));
    expect(screen.getByText("21–30 de 34")).toBeInTheDocument();
  });

  it("volta à primeira página ao trocar de aba e ao atualizar", () => {
    alertsQuery.data = { items: alertItems(10), total: 12 };

    render(<PivotHistoryCard pivotId="pv-1" />);

    fireEvent.click(screen.getByRole("button", { name: /Próxima/ }));
    expect(screen.getByText("11–12 de 12")).toBeInTheDocument();

    selectTab("Comandos");
    selectTab("Alertas");
    expect(screen.getByText("1–10 de 12")).toBeInTheDocument();
    expect(lastAlertsOptions()).toEqual({ limit: 10, offset: 0 });

    fireEvent.click(screen.getByRole("button", { name: /Próxima/ }));
    expect(screen.getByText("11–12 de 12")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Atualizar histórico de alertas" }),
    );
    expect(screen.getByText("1–10 de 12")).toBeInTheDocument();
    expect(alertsQuery.refetch).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", { name: "Atualizar histórico de alertas" }),
    );
    expect(alertsQuery.refetch).toHaveBeenCalledTimes(1);
  });

  it("renderiza linhas de alerta e comando quando há dados", () => {
    alertsQuery.data = {
      items: [
        {
          id: "al-1",
          kind: "info",
          alert: "Motobomba ligou",
          code: 2,
          created_at: "2026-09-03T15:42:10Z",
        },
      ],
      total: 1,
    };
    commandsQuery.data = {
      items: [
        {
          id: "3f2a9c11-0000-4000-8000-000000000000",
          command: "water",
          status: "sent",
          seq: 12,
          direction: "forward",
          percentimeter: 50,
          origin: "manual",
          error: null,
          sent_at: "2026-09-03T15:40:01Z",
          accepted_at: null,
          created_at: "2026-09-03T15:40:00Z",
        },
        {
          id: "9b1c0000-0000-4000-8000-000000000000",
          command: "stop",
          status: "failed",
          seq: 13,
          direction: null,
          percentimeter: null,
          origin: "manual",
          error: "timeout",
          sent_at: "2026-09-03T15:41:01Z",
          accepted_at: null,
          created_at: "2026-09-03T15:41:00Z",
        },
      ],
      total: 2,
    };

    render(<PivotHistoryCard pivotId="pv-1" />);

    expect(screen.getByText("Motobomba ligou")).toBeInTheDocument();
    expect(screen.getByText("Info")).toBeInTheDocument();
    expect(screen.getByText("1–1 de 1")).toBeInTheDocument();

    selectTab("Comandos");

    expect(screen.getByText("3f2a9c11")).toBeInTheDocument();
    expect(screen.getByText("Água")).toBeInTheDocument();
    expect(screen.getByText("Avanço")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getAllByText("Manual")).toHaveLength(2);
    expect(screen.getByText("Enviado")).toBeInTheDocument();
    expect(screen.getByText("Falhou")).toBeInTheDocument();
    expect(
      screen.getByText("Sem resposta do dispositivo (timeout)"),
    ).toBeInTheDocument();
  });

  it("mostra erro quando a consulta falha", () => {
    alertsQuery.isError = true;
    alertsQuery.data = undefined;

    render(<PivotHistoryCard pivotId="pv-1" />);

    expect(screen.getByText("Falha ao carregar dados")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Próxima/ })).toBeNull();
  });
});

describe("pageRange", () => {
  it("calcula o intervalo exibido", () => {
    expect(pageRange(1, 34)).toEqual({ from: 1, to: 10 });
    expect(pageRange(4, 34)).toEqual({ from: 31, to: 34 });
    expect(pageRange(1, 0)).toEqual({ from: 0, to: 0 });
    expect(pageRange(3, 12)).toEqual({ from: 12, to: 12 });
  });
});
