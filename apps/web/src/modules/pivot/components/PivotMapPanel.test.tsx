import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PivotMapPanel } from "@/modules/pivot/components/PivotMapPanel";
import type { Pivot } from "@/modules/pivot/schemas/pivot.schemas";
import { env } from "@/shared/config/env";

vi.mock("@/shared/config/env", () => ({
  env: { VITE_GOOGLE_MAPS_API_KEY: "" },
}));

// Sem o SDK do Google: `useMap`/`useMapsLibrary` nulos fazem o widget pular
// os overlays imperativos; os marcadores viram divs para inspeção.
vi.mock("@vis.gl/react-google-maps", () => ({
  APIProvider: ({
    apiKey,
    children,
  }: {
    apiKey: string;
    children: ReactNode;
  }) => (
    <div data-testid="maps-provider" data-api-key={apiKey}>
      {children}
    </div>
  ),
  Map: ({
    children,
    mapTypeId,
    defaultZoom,
  }: {
    children: ReactNode;
    mapTypeId?: string;
    defaultZoom?: number;
  }) => (
    <div
      data-testid="google-map"
      data-map-type={mapTypeId}
      data-zoom={defaultZoom}
    >
      {children}
    </div>
  ),
  AdvancedMarker: ({
    children,
    title,
  }: {
    children: ReactNode;
    title?: string;
  }) => (
    <div data-testid="map-marker" title={title}>
      {children}
    </div>
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
  latitude: -20.302609,
  longitude: -48.309418,
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

const LEGEND = ["Água", "Seco", "Parado", "Segurança"];

describe("PivotMapPanel", () => {
  beforeEach(() => {
    env.VITE_GOOGLE_MAPS_API_KEY = "";
  });

  it("mostra estado vazio quando o pivô não tem coordenadas", () => {
    render(
      <PivotMapPanel
        pivot={{ ...pivot, latitude: null, longitude: null }}
        canWrite
      />,
    );

    expect(screen.getByText("Sem localização cadastrada")).toBeInTheDocument();
    expect(screen.getByText(/Use "Editar"/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Google Maps/ })).toBeNull();
    expect(screen.queryByTestId("maps-provider")).toBeNull();
    for (const label of LEGEND) {
      expect(screen.queryByText(label)).toBeNull();
    }
  });

  it("usa o fallback no lugar do estado vazio quando ele é informado", () => {
    render(
      <PivotMapPanel
        pivot={{ ...pivot, latitude: null, longitude: null }}
        fallback={<p>Ilustração</p>}
      />,
    );

    expect(screen.getByText("Ilustração")).toBeInTheDocument();
    expect(screen.queryByText("Sem localização cadastrada")).toBeNull();
  });

  it("mostra placeholder com coordenadas quando não há chave da API", () => {
    render(<PivotMapPanel pivot={pivot} />);

    expect(screen.getByText("-20,3026 · -48,3094")).toBeInTheDocument();
    expect(screen.getByText(/Configure/, { selector: "p" })).toHaveTextContent(
      "Configure VITE_GOOGLE_MAPS_API_KEY para exibir o mapa",
    );
    expect(screen.queryByTestId("maps-provider")).toBeNull();
    expect(screen.queryByText("Parado")).toBeNull();
  });

  it("monta o provider, o mapa híbrido e o marcador quando há chave", () => {
    env.VITE_GOOGLE_MAPS_API_KEY = "test-key";

    render(<PivotMapPanel pivot={{ ...pivot, device_id: "dev-42" }} />);

    expect(screen.getByTestId("maps-provider")).toHaveAttribute(
      "data-api-key",
      "test-key",
    );
    expect(screen.getByTestId("google-map")).toHaveAttribute(
      "data-map-type",
      "hybrid",
    );
    expect(screen.getByTestId("google-map")).toHaveAttribute("data-zoom", "15");
    expect(screen.getByTestId("map-marker")).toHaveAttribute(
      "title",
      "Pivô 01",
    );
    expect(screen.getByText("-20,3026 · -48,3094")).toBeInTheDocument();
    expect(screen.queryByText(/Configure/)).toBeNull();
  });

  it("pede o raio irrigado quando ele não foi cadastrado", () => {
    env.VITE_GOOGLE_MAPS_API_KEY = "test-key";

    const { rerender } = render(<PivotMapPanel pivot={pivot} />);
    expect(
      screen.getByText(
        "Informe o raio irrigado no cadastro para desenhar o pivô.",
      ),
    ).toBeInTheDocument();

    rerender(<PivotMapPanel pivot={pivot} canWrite />);
    expect(
      screen.getByText(
        'Use "Editar" para informar o raio irrigado e desenhar o pivô.',
      ),
    ).toBeInTheDocument();

    rerender(<PivotMapPanel pivot={{ ...pivot, radius_m: 535 }} canWrite />);
    expect(screen.queryByText(/raio irrigado/)).toBeNull();
  });

  it("renderiza a legenda das cores e a legenda de estado junto do mapa", () => {
    env.VITE_GOOGLE_MAPS_API_KEY = "test-key";

    const { rerender } = render(
      <PivotMapPanel pivot={{ ...pivot, radius_m: 535 }} />,
    );

    expect(screen.getByTestId("google-map")).toHaveAttribute("data-zoom", "15");
    for (const label of LEGEND) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.queryByText("Carreador")).toBeNull();
    expect(screen.getByText("Aguardando telemetria")).toBeInTheDocument();

    rerender(
      <PivotMapPanel
        pivot={{ ...pivot, radius_m: 100 }}
        state={{ running: true, mode: 2, angle: 137.6 }}
      />,
    );
    expect(screen.getByTestId("google-map")).toHaveAttribute("data-zoom", "17");
    expect(screen.getByText("Em operação com água")).toBeInTheDocument();
    expect(screen.getByText(/138°/)).toBeInTheDocument();
    expect(screen.queryByText(/zero no carreador/)).toBeNull();
  });

  it("mostra o chip, o rótulo e o pino do carreador quando ele é cadastrado", () => {
    env.VITE_GOOGLE_MAPS_API_KEY = "test-key";

    render(
      <PivotMapPanel
        pivot={{
          ...pivot,
          radius_m: 535,
          road_angle: 270,
          road_latitude: -20.3,
          road_longitude: -48.32,
        }}
      />,
    );

    // Chip da legenda + rótulo sobre o mapa.
    expect(screen.getAllByText("Carreador")).toHaveLength(2);
    expect(screen.getByTestId("map-road-label")).toBeInTheDocument();
    expect(screen.getByTestId("map-road-pin")).toBeInTheDocument();
    expect(screen.getAllByTestId("map-marker")).toHaveLength(3);
  });

  it("desenha as torres no braço e avisa que o zero do ângulo está no carreador", () => {
    env.VITE_GOOGLE_MAPS_API_KEY = "test-key";

    const { rerender } = render(
      <PivotMapPanel
        pivot={{
          ...pivot,
          radius_m: 535,
          spans: 3,
          angle_reference: "road",
          road_angle: 270,
        }}
        state={{ running: false, angle: 180 }}
      />,
    );

    expect(screen.getAllByTestId("map-tower")).toHaveLength(3);
    expect(screen.getByText("Pivô parado")).toBeInTheDocument();
    expect(screen.getByText(/zero no carreador, 180°/)).toBeInTheDocument();

    // Sem ângulo na telemetria não há braço nem torres, só campo e carreador.
    rerender(
      <PivotMapPanel
        pivot={{
          ...pivot,
          radius_m: 535,
          spans: 3,
          angle_reference: "road",
          road_angle: 270,
        }}
        state={{ running: false }}
      />,
    );
    expect(screen.queryByTestId("map-tower")).toBeNull();
    expect(screen.getByTestId("map-road-label")).toBeInTheDocument();
    expect(screen.queryByText(/zero no carreador/)).toBeNull();
  });
});
