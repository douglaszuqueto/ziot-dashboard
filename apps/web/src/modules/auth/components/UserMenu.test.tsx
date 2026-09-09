import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserMenu } from "@/modules/auth/components/UserMenu";
import { applyPalette } from "@/shared/theme/palette";

const logout = vi.fn();

vi.mock("@/modules/auth/hooks/use-auth", () => ({
  useLogout: () => logout,
}));

vi.mock("@/modules/auth/store/auth.store", () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({
      user: { name: "Douglas Zuqueto", email: "douglas@ziot.com" },
      tenant: { name: "Ziot" },
    }),
}));

const openMenu = () => {
  const trigger = screen.getByRole("button", { name: "DZ" });
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
  fireEvent.keyDown(trigger, { key: "Enter" });
};

describe("UserMenu", () => {
  beforeEach(() => {
    window.localStorage.clear();
    applyPalette("ziot");
    logout.mockClear();
  });

  it("lista as três paletas com a ativa marcada e mantém o logout por último", () => {
    render(<UserMenu />);
    openMenu();

    const items = screen.getAllByRole("menuitemradio");
    expect(items.map((item) => item.textContent)).toEqual([
      "Azul Ziot",
      "Verde HortiShop",
      "Verde Solo Digital",
    ]);
    expect(
      screen.getByRole("menuitemradio", { name: "Azul Ziot" }),
    ).toHaveAttribute("aria-checked", "true");

    const menuItems = Array.from(
      screen.getByRole("menu").querySelectorAll('[role^="menuitem"]'),
    );
    expect(menuItems.at(-1)).toHaveTextContent("Sair da plataforma");
  });

  it("aplica a paleta escolhida no <html> e persiste", () => {
    render(<UserMenu />);
    openMenu();

    fireEvent.click(
      screen.getByRole("menuitemradio", { name: "Verde Solo Digital" }),
    );

    expect(document.documentElement.dataset.palette).toBe("solo");
    expect(window.localStorage.getItem("ziot.palette")).toBe("solo");
  });
});
