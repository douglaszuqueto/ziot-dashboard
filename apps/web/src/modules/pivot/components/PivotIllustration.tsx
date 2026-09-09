import { useId } from "react";
import {
  CARD_FIELD_PALETTE,
  PivotFieldDrawing,
  type PivotFieldDrawingProps,
} from "@/modules/pivot/components/PivotFieldDrawing";

// Ilustração do card (fallback do mapa quando não há coordenadas ou chave):
// o mesmo desenho do pivô, com a sombra do solo e as cores do tema.
export const PivotIllustration = ({
  className,
  angle = 40,
  spans,
  armColor = "hsl(var(--primary))",
  drops = true,
  sweep,
  roadAngle,
}: {
  className?: string;
  // Azimute do braço (0° = norte, sentido horário). Só visual.
  angle?: number;
} & Partial<
  Pick<
    PivotFieldDrawingProps,
    "spans" | "armColor" | "drops" | "sweep" | "roadAngle"
  >
>) => {
  const titleId = useId();
  return (
    <PivotFieldDrawing
      bearing={angle}
      spans={spans}
      armColor={armColor}
      drops={drops}
      sweep={sweep}
      roadAngle={roadAngle}
      palette={CARD_FIELD_PALETTE}
      shadow
      title="Ilustração de um pivô central"
      titleId={titleId}
      className={className}
    />
  );
};
