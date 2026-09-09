import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PivotOverview } from "@/modules/pivot/components/PivotOverview";
import type { Pivot } from "@/modules/pivot/schemas/pivot.schemas";
import { env } from "@/shared/config/env";

vi.mock("@/shared/config/env", () => ({
  env: { VITE_GOOGLE_MAPS_API_KEY: "" },
}));

vi.mock("@vis.gl/react-google-maps", () => ({
  APIProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="maps-provider">{children}</div>
  ),
  Map: ({ children }: { children: ReactNode }) => (
    <div data-testid="google-map">{children}</div>
  ),
  AdvancedMarker: ({ children }: { children: ReactNode }) => (
    <div data-testid="map-marker">{children}</div>
  ),
  useMap: () => null,
  useMapsLibrary: () => null,
}));

const pivot: Pivot = {
  id: "pv-1",
  tenant_id: "t-1",
  name: "Pivô 01",
  description: "",
  status: "unknown",
  device_id: null,
  latitude: null,
  longitude: null,
  pressure_ref: null,
  radius_m: null,
  spans: null,
  angle_reference: "north",
  road_angle: null,
  road_latitude: null,
  road_longitude: null,
  sweep_start_angle: null,
  sweep_end_angle: null,
  created_at: "2026-09-01T10:00:00Z",
  updated_at: "2026-09-02T10:00:00Z",
};

describe("PivotOverview", () => {
  beforeEach(() => {
    env.VITE_GOOGLE_MAPS_API_KEY = "";
  });

  it("mostra as três seções com placeholders sem telemetria", () => {
    render(<PivotOverview pivot={pivot} />);

    expect(screen.getByText("Estado")).toBeInTheDocument();
    expect(screen.getAllByText("Pivô")).toHaveLength(2);
    expect(screen.getByText("Hidráulica e elétrica")).toBeInTheDocument();

    for (const label of [
      "Modo",
      "Direção",
      "Motor",
      "Segurança",
      "Pressão",
      "Tensão",
      "Tempo de operação",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }

    expect(screen.getByText("—°")).toBeInTheDocument();
    expect(screen.getByText("—%")).toBeInTheDocument();
    expect(screen.getByText("Alertas")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("Dispositivo vinculado")).toBeInTheDocument();
    expect(screen.getByText("Não vinculado")).toBeInTheDocument();
    expect(screen.getByText("Aguardando telemetria")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Ilustração de um pivô central" }),
    ).toBeInTheDocument();
  });

  it("preenche os tiles e a legenda com o estado do pivô", () => {
    render(
      <PivotOverview
        pivot={{ ...pivot, status: "running", device_id: "dev-42" }}
        state={{
          mode: 2,
          direction: 1,
          motor: 1,
          secure: 1,
          running: true,
          pressure: 3.92,
          voltage: 502.39,
          angle: 90,
          percentimeter: 55,
          operating_minutes: 200,
          alerts_count: 2,
        }}
      />,
    );

    expect(screen.getByText("Água")).toBeInTheDocument();
    expect(screen.getByText("Reverso")).toBeInTheDocument();
    // "Ligado" aparece no tile Pivô (running) e no tile Motor.
    expect(screen.getAllByText("Ligado")).toHaveLength(2);
    expect(screen.getByText("Seguro")).toBeInTheDocument();
    expect(screen.getByText("3,9")).toBeInTheDocument();
    expect(screen.getByText("502")).toBeInTheDocument();
    expect(screen.getByText("3h 20min")).toBeInTheDocument();
    expect(screen.getByText("90°")).toBeInTheDocument();
    expect(screen.getByText("55%")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Em operação com água")).toBeInTheDocument();
  });

  it("troca a ilustração pelo pivô no mapa quando há coordenadas e chave", () => {
    env.VITE_GOOGLE_MAPS_API_KEY = "test-key";

    render(
      <PivotOverview
        pivot={{
          ...pivot,
          latitude: -20.302609,
          longitude: -48.309418,
          radius_m: 535,
        }}
        state={{ running: true, mode: 2, angle: 275 }}
      />,
    );

    expect(screen.getByTestId("google-map")).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: "Ilustração de um pivô central" }),
    ).toBeNull();
    // "Água" aparece no tile Modo e na legenda do mapa.
    expect(screen.getAllByText("Água")).toHaveLength(2);
    expect(screen.getByText("Em operação com água")).toBeInTheDocument();
    expect(screen.getByText("-20,3026 · -48,3094")).toBeInTheDocument();
  });
});
