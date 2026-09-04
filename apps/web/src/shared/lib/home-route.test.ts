import { describe, expect, it } from "vitest";
import { homeRoute } from "./home-route";

describe("homeRoute", () => {
  it("usa a Home quando o tenant não define home_module", () => {
    expect(homeRoute("")).toBe("/");
    expect(homeRoute(undefined)).toBe("/");
    expect(homeRoute(null)).toBe("/");
  });

  it("ignora valores desconhecidos", () => {
    expect(homeRoute("wells")).toBe("/");
  });

  it("leva o tenant de pivôs direto para a lista de pivôs", () => {
    expect(homeRoute("pivot")).toBe("/pivos");
  });
});
