import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FIELD_EXTENT_FACTOR } from "@/modules/pivot/components/PivotFieldDrawing";
import {
  destinationPoint,
  type LatLng,
} from "@/modules/pivot/lib/pivot-geometry";

// Camada geográfica do Google Maps que ancora um quadrado (o viewBox do
// `PivotFieldDrawing`) aos limites reais do campo: `radius_m` vira a
// meia-largura em metros pelo `FIELD_EXTENT_FACTOR`, e a cada `draw()` o
// contêiner é reposicionado em pixels — assim o desenho acompanha zoom e
// arrasto como qualquer polígono. Os filhos são renderizados via portal no
// contêiner, no painel `overlayLayer` (sem eventos de mouse; os marcadores
// continuam por cima).
export const PivotFieldOverlay = ({
  map,
  maps,
  center,
  radiusM,
  children,
}: {
  map: google.maps.Map | null;
  maps: google.maps.MapsLibrary | null;
  center: LatLng;
  radiusM: number;
  children: ReactNode;
}) => {
  const [container] = useState(() => {
    const element = document.createElement("div");
    element.style.position = "absolute";
    element.style.pointerEvents = "none";
    return element;
  });

  useEffect(() => {
    if (!map || !maps) return;

    // Cantos do quadrado pelas diagonais (a área é pequena o bastante para o
    // modelo esférico e para tratar o quadrado em metros como quadrado na
    // projeção).
    const half = radiusM * FIELD_EXTENT_FACTOR;
    const northEast = destinationPoint(center, half * Math.SQRT2, 45);
    const southWest = destinationPoint(center, half * Math.SQRT2, 225);

    class FieldOverlay extends maps.OverlayView {
      onAdd() {
        this.getPanes()?.overlayLayer.appendChild(container);
      }

      draw() {
        const projection = this.getProjection();
        if (!projection) return;
        const sw = projection.fromLatLngToDivPixel(southWest);
        const ne = projection.fromLatLngToDivPixel(northEast);
        if (!sw || !ne) return;
        container.style.left = `${sw.x}px`;
        container.style.top = `${ne.y}px`;
        container.style.width = `${ne.x - sw.x}px`;
        container.style.height = `${sw.y - ne.y}px`;
      }

      onRemove() {
        container.remove();
      }
    }

    const overlay = new FieldOverlay();
    overlay.setMap(map);
    return () => {
      overlay.setMap(null);
    };
  }, [map, maps, center, radiusM, container]);

  return createPortal(children, container);
};
