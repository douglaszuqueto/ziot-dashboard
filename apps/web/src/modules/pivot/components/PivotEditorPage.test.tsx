import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  PivotEditorPage,
  previewPivot,
} from "@/modules/pivot/components/PivotEditorPage";
import type { Pivot } from "@/modules/pivot/schemas/pivot.schemas";

const createMutate = vi.fn();
const updateMutate = vi.fn();
let loadedPivot: Pivot | null = null;

vi.mock("@/modules/pivot/hooks/use-pivots", () => ({
  usePivotQuery: () => ({
    data: loadedPivot,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useCreatePivotMutation: () => ({
    mutateAsync: createMutate,
    isPending: false,
  }),
  useUpdatePivotMutation: () => ({
    mutateAsync: updateMutate,
    isPending: false,
  }),
}));

vi.mock("@/components/layout/AppShell", () => ({
  AppShell: ({ title, children }: { title: string; children: ReactNode }) => (
    <main aria-label={title}>{children}</main>
  ),
}));

vi.mock("@/shared/config/env", () => ({
  env: { VITE_GOOGLE_MAPS_API_KEY: "" },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const pivot: Pivot = {
  id: "pv-1",
  tenant_id: "t-1",
  name: "Pivô 01",
  description: "Talhão norte",
  status: "running",
  device_id: null,
  latitude: -20.302609,
  longitude: -48.309418,
  pressure_ref: 2,
  radius_m: 535.08,
  spans: 9,
  angle_reference: "north",
  road_angle: 180,
  road_latitude: null,
  road_longitude: null,
  sweep_start_angle: null,
  sweep_end_angle: null,
  created_at: "2026-09-01T10:00:00Z",
  updated_at: "2026-09-02T10:00:00Z",
};

const Landing = () => <p>tela do pivô</p>;

const renderEditor = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/pivos/novo" element={<PivotEditorPage />} />
        <Route path="/pivos/:id/editar" element={<PivotEditorPage />} />
        <Route path="/pivos/:id" element={<Landing />} />
      </Routes>
    </MemoryRouter>,
  );

describe("previewPivot", () => {
  it("monta o pivô da prévia a partir do texto digitado", () => {
    const preview = previewPivot(
      {
        name: "  Pivô X ",
        latitude: "-20,5",
        longitude: "-48,1",
        radius_m: "535,08",
        spans: "9",
        angle_reference: "road",
        road_angle: "180",
        sweep_start_angle: "",
        sweep_end_angle: "abc",
      },
      pivot,
    );

    expect(preview.name).toBe("Pivô X");
    expect(preview.latitude).toBe(-20.5);
    expect(preview.longitude).toBe(-48.1);
    expect(preview.radius_m).toBe(535.08);
    expect(preview.spans).toBe(9);
    expect(preview.angle_reference).toBe("road");
    expect(preview.road_angle).toBe(180);
    expect(preview.sweep_start_angle).toBeNull();
    expect(preview.sweep_end_angle).toBeNull();
    expect(preview.status).toBe("running");
  });
});

describe("PivotEditorPage", () => {
  beforeEach(() => {
    loadedPivot = null;
    createMutate.mockReset().mockResolvedValue({ ...pivot, id: "pv-new" });
    updateMutate.mockReset().mockResolvedValue(pivot);
    vi.mocked(toast.success).mockClear();
  });

  it("cadastra um pivô novo e vai para a tela dele", async () => {
    renderEditor("/pivos/novo");

    expect(screen.getByText("Cadastrar pivô")).toBeInTheDocument();
    expect(screen.getByText("Geometria do campo")).toBeInTheDocument();
    expect(screen.getByText("Sem localização cadastrada")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Salvar pivô" }));
    expect(await screen.findByText("Informe o nome do pivô")).toBeVisible();
    expect(createMutate).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Pivô 04" },
    });
    fireEvent.change(screen.getByLabelText("Raio irrigado (m)"), {
      target: { value: "420" },
    });
    fireEvent.change(screen.getByLabelText("Lances / torres"), {
      target: { value: "7" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar pivô" }));

    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    expect(createMutate.mock.calls[0]?.[0]).toMatchObject({
      name: "Pivô 04",
      radius_m: 420,
      spans: 7,
      angle_reference: "north",
      latitude: null,
      longitude: null,
    });
    expect(toast.success).toHaveBeenCalledWith("Pivô cadastrado.");
    expect(await screen.findByText("tela do pivô")).toBeInTheDocument();
  });

  it("edita um pivô existente com os valores carregados", async () => {
    loadedPivot = pivot;
    renderEditor("/pivos/pv-1/editar");

    expect(screen.getByText("Editar Pivô 01")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByLabelText("Nome")).toHaveValue("Pivô 01"),
    );
    expect(screen.getByLabelText("Raio irrigado (m)")).toHaveValue("535.08");

    fireEvent.change(screen.getByLabelText("Lances / torres"), {
      target: { value: "10" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar pivô" }));

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate.mock.calls[0]?.[0]).toMatchObject({
      id: "pv-1",
      payload: { name: "Pivô 01", spans: 10, radius_m: 535.08 },
    });
    expect(toast.success).toHaveBeenCalledWith("Pivô atualizado.");
  });

  it("aponta o erro de setor incompleto no campo certo", async () => {
    renderEditor("/pivos/novo");

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Pivô 05" },
    });
    fireEvent.change(screen.getByLabelText("Ângulo inicial"), {
      target: { value: "90" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar pivô" }));

    expect(
      await screen.findByText(
        "Informe os ângulos inicial e final do setor juntos",
      ),
    ).toBeVisible();
    expect(createMutate).not.toHaveBeenCalled();
  });
});
