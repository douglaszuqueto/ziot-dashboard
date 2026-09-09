import { describe, expect, it } from "vitest";
import {
  armPath,
  circlePath,
  DEFAULT_MAP_ZOOM,
  destinationPoint,
  isWithinSweep,
  normalizeAngle,
  pivotBearing,
  sectorPath,
  sweepSpan,
  towerPoints,
  zoomForRadius,
} from "@/modules/pivot/lib/pivot-geometry";

// 1° de latitude sobre a esfera de R = 6371008,8 m.
const ONE_DEGREE_M = (6371008.8 * Math.PI) / 180;
const ORIGIN = { lat: 0, lng: 0 };
const FARM = { lat: -20.302609, lng: -48.309418 };

describe("normalizeAngle", () => {
  it("leva qualquer valor para [0, 360)", () => {
    expect(normalizeAngle(0)).toBe(0);
    expect(normalizeAngle(370)).toBe(10);
    expect(normalizeAngle(-10)).toBe(350);
    expect(normalizeAngle(360)).toBe(0);
    expect(normalizeAngle(-720)).toBe(0);
    expect(normalizeAngle(137.6)).toBeCloseTo(137.6, 6);
  });
});

describe("pivotBearing", () => {
  it("usa o ângulo do controlador como azimute quando a referência é o norte", () => {
    expect(
      pivotBearing({ angle_reference: "north", road_angle: 90 }, 137.6),
    ).toBeCloseTo(137.6, 6);
    expect(
      pivotBearing({ angle_reference: "north", road_angle: null }, -10),
    ).toBe(350);
  });

  it("soma o ângulo do carreador quando a referência é a estrada (com wraparound)", () => {
    expect(pivotBearing({ angle_reference: "road", road_angle: 350 }, 20)).toBe(
      10,
    );
    expect(pivotBearing({ angle_reference: "road", road_angle: 90 }, 180)).toBe(
      270,
    );
    expect(pivotBearing({ angle_reference: "road", road_angle: 0 }, 0)).toBe(0);
  });

  it("cai no azimute puro quando a referência é a estrada mas não há ângulo do carreador", () => {
    expect(
      pivotBearing({ angle_reference: "road", road_angle: null }, 45),
    ).toBe(45);
  });

  it("devolve null sem ângulo do controlador", () => {
    expect(
      pivotBearing({ angle_reference: "north", road_angle: null }, null),
    ).toBe(null);
    expect(
      pivotBearing({ angle_reference: "north", road_angle: null }, undefined),
    ).toBe(null);
    expect(
      pivotBearing({ angle_reference: "road", road_angle: 10 }, Number.NaN),
    ).toBe(null);
  });
});

describe("sweepSpan / isWithinSweep", () => {
  it("mede a abertura horária do setor, inclusive cruzando o norte", () => {
    expect(sweepSpan(0, 180)).toBe(180);
    expect(sweepSpan(10, 350)).toBe(340);
    expect(sweepSpan(350, 10)).toBe(20);
    expect(sweepSpan(0, 360)).toBe(360);
    expect(sweepSpan(90, 90)).toBe(0);
  });

  it("decide se um azimute está dentro do setor", () => {
    expect(isWithinSweep(90, 0, 180)).toBe(true);
    expect(isWithinSweep(270, 0, 180)).toBe(false);
    expect(isWithinSweep(0, 350, 10)).toBe(true);
    expect(isWithinSweep(350, 350, 10)).toBe(true);
    expect(isWithinSweep(10, 350, 10)).toBe(true);
    expect(isWithinSweep(11, 350, 10)).toBe(false);
    expect(isWithinSweep(180, 350, 10)).toBe(false);
    expect(isWithinSweep(123, 0, 360)).toBe(true);
  });
});

describe("destinationPoint", () => {
  it("anda 1° para o norte, leste e sul a partir da origem", () => {
    const north = destinationPoint(ORIGIN, ONE_DEGREE_M, 0);
    expect(north.lat).toBeCloseTo(1, 6);
    expect(north.lng).toBeCloseTo(0, 6);

    const east = destinationPoint(ORIGIN, ONE_DEGREE_M, 90);
    expect(east.lat).toBeCloseTo(0, 6);
    expect(east.lng).toBeCloseTo(1, 6);

    const south = destinationPoint(ORIGIN, ONE_DEGREE_M, 180);
    expect(south.lat).toBeCloseTo(-1, 6);
    expect(south.lng).toBeCloseTo(0, 6);
  });

  it("encurta a longitude com o cosseno da latitude longe do equador", () => {
    const east = destinationPoint(FARM, 500, 90);
    expect(east.lat).toBeCloseTo(FARM.lat, 5);
    const expectedDeltaLng =
      500 / (ONE_DEGREE_M * Math.cos((FARM.lat * Math.PI) / 180));
    expect(east.lng - FARM.lng).toBeCloseTo(expectedDeltaLng, 5);

    const north = destinationPoint(FARM, 500, 0);
    expect(north.lng).toBeCloseTo(FARM.lng, 6);
    expect(north.lat - FARM.lat).toBeCloseTo(500 / ONE_DEGREE_M, 6);
  });

  it("não sai do lugar com distância zero e volta para o ponto de partida", () => {
    expect(destinationPoint(FARM, 0, 45)).toEqual({
      lat: expect.closeTo(FARM.lat, 9),
      lng: expect.closeTo(FARM.lng, 9),
    });

    const away = destinationPoint(FARM, 800, 120);
    const back = destinationPoint(away, 800, 300);
    expect(back.lat).toBeCloseTo(FARM.lat, 6);
    expect(back.lng).toBeCloseTo(FARM.lng, 6);
  });
});

describe("sectorPath / circlePath", () => {
  it("fecha o polígono do setor no centro e percorre o arco em sentido horário", () => {
    const path = sectorPath(ORIGIN, 1000, 0, 90, 30);
    expect(path).toHaveLength(6);
    expect(path[0]).toEqual(ORIGIN);
    expect(path[path.length - 1]).toEqual(ORIGIN);
    // Primeiro ponto do arco ao norte, último a leste.
    expect(path[1]?.lat).toBeGreaterThan(0);
    expect(path[1]?.lng).toBeCloseTo(0, 9);
    expect(path[4]?.lat).toBeCloseTo(0, 9);
    expect(path[4]?.lng).toBeGreaterThan(0);
  });

  it("cruza o norte quando o setor vai de 350° a 10°", () => {
    const path = sectorPath(ORIGIN, 1000, 350, 10, 5);
    expect(path).toHaveLength(7);
    // Ponto do meio do arco (offset 10° a partir de 350°) fica no norte.
    expect(path[3]?.lng).toBeCloseTo(0, 9);
    expect(path[3]?.lat).toBeGreaterThan(0);
    // Extremos do arco de um lado e do outro do norte.
    expect(path[1]?.lng).toBeLessThan(0);
    expect(path[5]?.lng).toBeGreaterThan(0);
  });

  it("devolve o anel completo para giro completo", () => {
    const ring = circlePath(ORIGIN, 1000, 90);
    expect(ring).toHaveLength(5);
    expect(ring[0]?.lat).toBeCloseTo(ring[4]?.lat ?? Number.NaN, 9);
    expect(ring[0]?.lng).toBeCloseTo(ring[4]?.lng ?? Number.NaN, 9);
    expect(ring.some((point) => point.lat === 0 && point.lng === 0)).toBe(
      false,
    );

    expect(sectorPath(ORIGIN, 1000, 0, 360, 90)).toEqual(ring);
  });
});

describe("armPath / towerPoints", () => {
  it("liga o centro à ponta do braço", () => {
    const [start, tip] = armPath(FARM, 535, 90);
    expect(start).toEqual(FARM);
    expect(tip).toEqual(destinationPoint(FARM, 535, 90));
  });

  it("espaça as torres igualmente e coloca a última na ponta", () => {
    const towers = towerPoints(ORIGIN, 300, 90, 3);
    expect(towers).toHaveLength(3);
    expect(towers[2]).toEqual(destinationPoint(ORIGIN, 300, 90));
    const step = towers[0]?.lng ?? 0;
    expect(towers[1]?.lng).toBeCloseTo(step * 2, 9);
    expect(towers[2]?.lng).toBeCloseTo(step * 3, 9);
    expect(towers.every((tower) => Math.abs(tower.lat) < 1e-9)).toBe(true);
  });

  it("não desenha torres sem lances", () => {
    expect(towerPoints(ORIGIN, 300, 90, 0)).toEqual([]);
    expect(towerPoints(ORIGIN, 300, 90, Number.NaN)).toEqual([]);
  });
});

describe("zoomForRadius", () => {
  it("escolhe um zoom em que o círculo cabe no cartão", () => {
    expect(zoomForRadius(535)).toBe(15);
    expect(zoomForRadius(100)).toBe(17);
    expect(zoomForRadius(2000)).toBe(13);
    expect(zoomForRadius(50)).toBe(18);
  });

  it("usa o zoom padrão do cartão sem raio válido", () => {
    expect(zoomForRadius(null)).toBe(DEFAULT_MAP_ZOOM);
    expect(zoomForRadius(undefined)).toBe(DEFAULT_MAP_ZOOM);
    expect(zoomForRadius(0)).toBe(DEFAULT_MAP_ZOOM);
    expect(zoomForRadius(-5)).toBe(DEFAULT_MAP_ZOOM);
  });
});
