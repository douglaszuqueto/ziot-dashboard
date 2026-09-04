import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { PivotCard } from "@/modules/pivot/components/PivotCard";
import type { Pivot } from "@/modules/pivot/schemas/pivot.schemas";

const pivot: Pivot = {
  id: "pv-1",
  tenant_id: "t-1",
  name: "Pivô 01",
  description: "Talhão norte",
  status: "running",
  device_id: null,
  latitude: -22.69,
  longitude: -46.98,
  created_at: "2026-09-01T10:00:00Z",
  updated_at: "2026-09-02T10:00:00Z",
};

const renderCard = (props: Partial<Parameters<typeof PivotCard>[0]> = {}) => {
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  render(
    <MemoryRouter>
      <PivotCard
        pivot={pivot}
        canWrite={false}
        onEdit={onEdit}
        onDelete={onDelete}
        {...props}
      />
    </MemoryRouter>,
  );
  return { onEdit, onDelete };
};

describe("PivotCard", () => {
  it("mostra nome, descrição, pílula de status e link para o detalhe", () => {
    renderCard();

    expect(screen.getByText("Pivô 01")).toBeInTheDocument();
    expect(screen.getByText("Talhão norte")).toBeInTheDocument();
    expect(screen.getByText("Em operação")).toHaveClass("uppercase");
    expect(screen.getByRole("link", { name: /Pivô 01/ })).toHaveAttribute(
      "href",
      "/pivos/pv-1",
    );
  });

  it("renderiza os tiles com '—' enquanto não há telemetria", () => {
    renderCard();

    for (const label of ["Modo", "Direção", "Pressão", "Tensão"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getAllByText("—")).toHaveLength(2);
    expect(screen.getByText("— bar")).toBeInTheDocument();
    expect(screen.getByText("— V")).toBeInTheDocument();
    expect(screen.getByText("Percentímetro")).toBeInTheDocument();
    expect(screen.getByText("—%")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Ângulo do pivô: —°" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/^Atualizado .* atrás$/)).toBeInTheDocument();
  });

  it("preenche os tiles, o gauge, a pílula e a última atualização com o estado", () => {
    renderCard({
      pivot: { ...pivot, status: "unknown" },
      state: {
        running: true,
        mode: 2,
        direction: 2,
        pressure: 3.92,
        voltage: 502.39,
        angle: 137.6,
        percentimeter: 55,
        last_input: "2026-09-03T15:42:10Z",
      },
    });

    expect(screen.getByText("Ligado")).toBeInTheDocument();
    expect(screen.getByText("Água")).toBeInTheDocument();
    expect(screen.getByText("Avanço")).toBeInTheDocument();
    expect(screen.getByText("3,9 bar")).toBeInTheDocument();
    expect(screen.getByText("502 V")).toBeInTheDocument();
    expect(screen.getByText("138°")).toBeInTheDocument();
    expect(screen.getByText("55%")).toBeInTheDocument();
    expect(
      screen.getByText(/^Última atualização: 03\/09\/2026, /),
    ).toBeInTheDocument();
  });

  it("mostra DESLIGADO quando a telemetria diz que o pivô está parado", () => {
    renderCard({ state: { running: false } });

    expect(screen.getByText("Desligado")).toBeInTheDocument();
    expect(screen.queryByText("Em operação")).toBeNull();
  });

  it("esconde ações de escrita sem pivot.write", () => {
    renderCard({ canWrite: false });

    expect(screen.queryByRole("button", { name: /Editar/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Excluir/ })).toBeNull();
  });

  it("dispara editar e excluir com pivot.write", () => {
    const { onEdit, onDelete } = renderCard({ canWrite: true });

    fireEvent.click(screen.getByRole("button", { name: "Editar Pivô 01" }));
    fireEvent.click(screen.getByRole("button", { name: "Excluir Pivô 01" }));

    expect(onEdit).toHaveBeenCalledWith(pivot);
    expect(onDelete).toHaveBeenCalledWith(pivot);
  });

  it("usa fallback para descrição ausente e status fora do contrato", () => {
    renderCard({ pivot: { ...pivot, description: "", status: "unknown" } });

    expect(screen.getByText("Sem descrição")).toBeInTheDocument();
    expect(screen.getByText("Sem status")).toBeInTheDocument();
  });
});
