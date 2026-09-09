import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  FIELD_CENTER,
  FIELD_EXTENT_FACTOR,
  FIELD_RADIUS,
  fieldPoint,
  fieldSectorPath,
  PivotFieldDrawing,
} from "@/modules/pivot/components/PivotFieldDrawing";

const base = {
  armColor: "#0284c7",
  title: "Pivô de teste",
  titleId: "t",
};

describe("fieldPoint", () => {
  it("segue a bússola: 0° para cima, 90° para a direita", () => {
    const north = fieldPoint(0, FIELD_RADIUS);
    expect(north.x).toBeCloseTo(FIELD_CENTER);
    expect(north.y).toBeCloseTo(FIELD_CENTER - FIELD_RADIUS);

    const east = fieldPoint(90, FIELD_RADIUS);
    expect(east.x).toBeCloseTo(FIELD_CENTER + FIELD_RADIUS);
    expect(east.y).toBeCloseTo(FIELD_CENTER);
  });

  it("expõe o fator que converte o raio na meia-largura do desenho", () => {
    expect(FIELD_EXTENT_FACTOR).toBeCloseTo(FIELD_CENTER / FIELD_RADIUS);
  });
});

describe("fieldSectorPath", () => {
  it("usa arco grande acima de 180° e devolve nulo sem abertura", () => {
    expect(fieldSectorPath(0, 90, 10)).toContain("A 10 10 0 0 1");
    expect(fieldSectorPath(270, 90, 10)).toContain("A 10 10 0 0 1");
    expect(fieldSectorPath(0, 270, 10)).toContain("A 10 10 0 1 1");
    expect(fieldSectorPath(45, 45, 10)).toBeNull();
  });

  it("vira o círculo inteiro quando os ângulos coincidem depois de normalizar", () => {
    expect(fieldSectorPath(0, 360, 10)).toContain("A 10 10 0 1 1");
  });
});

describe("PivotFieldDrawing", () => {
  it("desenha o braço, as torres e o setor varrido quando há azimute", () => {
    render(<PivotFieldDrawing {...base} bearing={120} spans={9} drops />);

    expect(screen.getByRole("img", { name: "Pivô de teste" })).toBeVisible();
    expect(screen.getByTestId("field-arm")).toBeInTheDocument();
    expect(screen.getAllByTestId("field-tower")).toHaveLength(9);
    expect(screen.getAllByTestId("field-drop")).toHaveLength(9);
    expect(screen.getByTestId("field-irrigated")).toBeInTheDocument();
    expect(screen.getByTestId("field-circle")).toBeInTheDocument();
  });

  it("sem azimute desenha só o campo (e o carreador, se houver)", () => {
    render(<PivotFieldDrawing {...base} bearing={null} roadAngle={180} />);

    expect(screen.queryByTestId("field-arm")).toBeNull();
    expect(screen.queryByTestId("field-tower")).toBeNull();
    expect(screen.queryByTestId("field-irrigated")).toBeNull();
    expect(screen.getByTestId("field-road")).toBeInTheDocument();
  });

  it("no modo seco não há gotas e nos meia-lua o resto do círculo fica apagado", () => {
    render(
      <PivotFieldDrawing
        {...base}
        bearing={0}
        spans={2}
        drops={false}
        sweep={{ start: 270, end: 90 }}
      />,
    );

    expect(screen.queryByTestId("field-drop")).toBeNull();
    expect(screen.getByTestId("field-outside")).toBeInTheDocument();
    expect(screen.getByTestId("field-sector")).toBeInTheDocument();
    expect(screen.queryByTestId("field-circle")).toBeNull();
    // Varrido do início do setor (270°) até o braço (0°).
    expect(screen.getByTestId("field-irrigated")).toBeInTheDocument();
  });
});
