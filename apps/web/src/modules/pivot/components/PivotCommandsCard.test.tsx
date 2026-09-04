import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  NO_LINKED_DEVICE_MESSAGE,
  PivotCommandsCard,
  START_VALIDATION_MESSAGE,
} from "@/modules/pivot/components/PivotCommandsCard";

const manualMutate = vi.fn();
const statusMutate = vi.fn();
const gpsMutate = vi.fn();

vi.mock("@/modules/pivot/hooks/use-pivot-commands", () => ({
  useManualCommandMutation: () => ({
    mutateAsync: manualMutate,
    isPending: false,
  }),
  useRequestStatusMutation: () => ({
    mutateAsync: statusMutate,
    isPending: false,
  }),
  useRequestGpsMutation: () => ({ mutateAsync: gpsMutate, isPending: false }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

describe("PivotCommandsCard", () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.warning).mockClear();
    manualMutate.mockReset().mockResolvedValue(undefined);
    statusMutate.mockReset().mockResolvedValue(undefined);
    gpsMutate.mockReset().mockResolvedValue(undefined);
  });

  it("renderiza os grupos da programação manual e as ações", () => {
    render(<PivotCommandsCard pivotId="pv-1" />);

    expect(screen.getByText("Comandos")).toBeInTheDocument();
    for (const label of [
      "Direção",
      "Modo",
      "Velocidade (%)",
      "Enviar comando",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByRole("radio", { name: /Reverso/ })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Avanço/ })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Seco/ })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Água/ })).toBeInTheDocument();
    // valor do slider + rótulo da escala
    expect(screen.getAllByText("100%")).toHaveLength(2);
    for (const name of ["Parar", "Iniciar", "Obter status", "Obter posição"]) {
      expect(screen.getByRole("button", { name })).toBeEnabled();
    }
  });

  it("exige direção e modo para iniciar", () => {
    render(<PivotCommandsCard pivotId="pv-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Iniciar" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      START_VALIDATION_MESSAGE,
    );
    expect(manualMutate).not.toHaveBeenCalled();
  });

  it("envia start com modo, direção e percentímetro", () => {
    render(<PivotCommandsCard pivotId="pv-1" />);

    fireEvent.click(screen.getByRole("radio", { name: /Avanço/ }));
    fireEvent.click(screen.getByRole("radio", { name: /Água/ }));
    fireEvent.click(screen.getByRole("button", { name: "Iniciar" }));

    expect(manualMutate).toHaveBeenCalledWith({
      command: "start",
      mode: "water",
      direction: "forward",
      percentimeter: 100,
    });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("envia stop sem exigir seleção e dispara status e posição", () => {
    render(<PivotCommandsCard pivotId="pv-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Parar" }));
    fireEvent.click(screen.getByRole("button", { name: "Obter status" }));
    fireEvent.click(screen.getByRole("button", { name: "Obter posição" }));

    expect(manualMutate).toHaveBeenCalledWith({ command: "stop" });
    expect(statusMutate).toHaveBeenCalledTimes(1);
    expect(gpsMutate).toHaveBeenCalledTimes(1);
  });

  it("avisa quando o comando fica pendente por falta de dispositivo", async () => {
    manualMutate.mockResolvedValue({
      id: "cmd-1",
      status: "pending",
      error: "no linked device",
    });

    render(<PivotCommandsCard pivotId="pv-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Parar" }));

    await waitFor(() =>
      expect(toast.warning).toHaveBeenCalledWith(NO_LINKED_DEVICE_MESSAGE),
    );
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("confirma o envio quando o backend aceita o comando", async () => {
    manualMutate.mockResolvedValue({ id: "cmd-2", status: "sent" });

    render(<PivotCommandsCard pivotId="pv-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Parar" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
    expect(toast.warning).not.toHaveBeenCalled();
  });
});
