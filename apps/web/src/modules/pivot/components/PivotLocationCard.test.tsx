import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PivotLocationCard } from "@/modules/pivot/components/PivotLocationCard";
import type { Pivot } from "@/modules/pivot/schemas/pivot.schemas";
import { env } from "@/shared/config/env";

vi.mock("@/shared/config/env", () => ({
  env: { VITE_GOOGLE_MAPS_API_KEY: "" },
}));

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
  AdvancedMarker: ({ children }: { children: ReactNode }) => (
    <div data-testid="map-marker">{children}</div>
  ),
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

describe("PivotLocationCard", () => {
  beforeEach(() => {
    env.VITE_GOOGLE_MAPS_API_KEY = "";
  });

  it("mostra estado vazio quando o pivô não tem coordenadas", () => {
    render(
      <PivotLocationCard
        pivot={{ ...pivot, latitude: null, longitude: null }}
        canWrite
      />,
    );

    expect(screen.getByText("Localização")).toBeInTheDocument();
    expect(screen.getAllByText("Sem localização cadastrada")).toHaveLength(2);
    expect(screen.getByText(/Use "Editar"/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Google Maps/ })).toBeNull();
    expect(screen.queryByTestId("maps-provider")).toBeNull();
  });

  it("mostra placeholder com coordenadas quando não há chave da API", () => {
    render(<PivotLocationCard pivot={pivot} />);

    expect(screen.getAllByText("-20,3026 · -48,3094").length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText(/Configure/, { selector: "p" })).toHaveTextContent(
      "Configure VITE_GOOGLE_MAPS_API_KEY para exibir o mapa",
    );
    expect(screen.queryByTestId("maps-provider")).toBeNull();
  });

  it("monta o provider, o mapa híbrido e o marcador quando há chave", () => {
    env.VITE_GOOGLE_MAPS_API_KEY = "test-key";

    render(<PivotLocationCard pivot={{ ...pivot, device_id: "dev-42" }} />);

    expect(screen.getByTestId("maps-provider")).toHaveAttribute(
      "data-api-key",
      "test-key",
    );
    expect(screen.getByTestId("google-map")).toHaveAttribute(
      "data-map-type",
      "hybrid",
    );
    expect(screen.getByTestId("google-map")).toHaveAttribute("data-zoom", "15");
    expect(screen.getByTestId("map-marker")).toBeInTheDocument();
    expect(screen.queryByText(/Configure/)).toBeNull();
  });
});
