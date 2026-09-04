import {
  AdvancedMarker,
  APIProvider,
  Map as GoogleMap,
} from "@vis.gl/react-google-maps";
import { MapPin, RadioTower } from "lucide-react";
import type { ReactNode } from "react";
import type { Pivot } from "@/modules/pivot/schemas/pivot.schemas";
import { env } from "@/shared/config/env";
import { formatCoordinates } from "@/shared/lib/format";

const MAP_HEIGHT = "h-[280px] lg:h-[320px]";

const pivotPosition = (pivot: Pick<Pivot, "latitude" | "longitude">) =>
  pivot.latitude !== null && pivot.longitude !== null
    ? { lat: pivot.latitude, lng: pivot.longitude }
    : null;

// Cartão de localização: só o mapa satélite com o marcador na posição do pivô,
// com as coordenadas no cabeçalho. Sem
// coordenadas ou sem chave do Google Maps, mostra um estado vazio dentro do
// cartão em vez de montar o provider.
export const PivotLocationCard = ({
  pivot,
  canWrite = false,
}: {
  pivot: Pivot;
  canWrite?: boolean;
}) => {
  const position = pivotPosition(pivot);
  const coordinates = formatCoordinates(
    position ? { lat: position.lat, lng: position.lng } : null,
  );
  const apiKey = env.VITE_GOOGLE_MAPS_API_KEY;

  return (
    <section className="rounded-3xl bg-card p-4 shadow-[var(--shadow-card)] lg:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
            Localização
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {position ? coordinates : "Sem localização cadastrada"}
          </p>
        </div>
      </div>

      <div
        className={`relative overflow-hidden rounded-3xl border border-border bg-secondary/35 ${MAP_HEIGHT}`}
      >
        {!position ? (
          <MapEmptyState
            title="Sem localização cadastrada"
            description={
              canWrite
                ? 'Use "Editar" para informar latitude e longitude do pivô.'
                : "Informe latitude e longitude no cadastro do pivô."
            }
          />
        ) : !apiKey ? (
          <MapEmptyState
            title={coordinates}
            description={
              <>
                Configure <code>VITE_GOOGLE_MAPS_API_KEY</code> para exibir o
                mapa
              </>
            }
          />
        ) : (
          <APIProvider apiKey={apiKey}>
            <GoogleMap
              mapId="DEMO_MAP_ID"
              defaultCenter={position}
              defaultZoom={15}
              mapTypeId="hybrid"
              gestureHandling="cooperative"
              disableDefaultUI
              zoomControl
              fullscreenControl={false}
              streetViewControl={false}
              style={{ width: "100%", height: "100%" }}
            >
              <AdvancedMarker position={position} title={pivot.name}>
                <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-primary text-primary-foreground shadow-[var(--shadow-elevated)]">
                  <RadioTower className="h-4 w-4" />
                </span>
              </AdvancedMarker>
            </GoogleMap>
          </APIProvider>
        )}
      </div>
    </section>
  );
};

const MapEmptyState = ({
  title,
  description,
}: {
  title: string;
  description: ReactNode;
}) => (
  <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
      <MapPin className="h-6 w-6" />
    </span>
    <p className="text-sm font-semibold text-foreground">{title}</p>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);
