import { describe, expect, it } from "vitest";
import {
  axisDomain,
  buildEmptySeries24h,
} from "@/modules/pivot/components/PivotCharts";

describe("buildEmptySeries24h", () => {
  it("gera 25 pontos horários terminando na hora cheia atual, sem valores", () => {
    const series = buildEmptySeries24h(new Date("2026-09-03T15:42:10Z"));

    expect(series).toHaveLength(25);
    expect(series[0]?.time).toBe("2026-09-02T15:00:00.000Z");
    expect(series[24]?.time).toBe("2026-09-03T15:00:00.000Z");
    expect(series.every((point) => point.pressure === undefined)).toBe(true);
  });
});

describe("axisDomain", () => {
  it("usa o máximo dos dados quando existe e o fallback quando não", () => {
    expect(axisDomain(10)([0, 4.2])).toEqual([0, 4.2]);
    expect(
      axisDomain(10)([Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]),
    ).toEqual([0, 10]);
    expect(axisDomain(600)([0, 0])).toEqual([0, 600]);
  });
});
