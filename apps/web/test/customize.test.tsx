/**
 * Behavioral port of the legacy CustomizeProductControllerSpec (54 specs asserted on $scope internals;
 * here: what the customer sees and what gets added to the cart).
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CustomizeProductForm } from "@/features/store/CustomizeProductDialog";
import { burger, pizza } from "./fixtures";

const setup = (product = pizza, initial?: Parameters<typeof CustomizeProductForm>[0]["initial"]) => {
  const onConfirm = vi.fn();
  render(<CustomizeProductForm product={product} initial={initial} onConfirm={onConfirm} onClose={vi.fn()} />);
  return { onConfirm, user: userEvent.setup() };
};

describe("customize product", () => {
  it("starts with the default option selected, toggles off, quantity 1", () => {
    setup();
    expect(screen.getByLabelText("Sem borda")).toBeChecked();
    expect(screen.getByLabelText(/^Orégano extra/)).not.toBeChecked();
    expect(screen.getByLabelText("Quantidade:")).toHaveValue(1);
  });

  it("requires a flavor and blocks more flavors than allowed", async () => {
    const { user } = setup();
    expect(screen.getByRole("button", { name: "Adicionar ao Pedido" })).toBeDisabled();
    expect(screen.getAllByText("Você precisa escolher pelo menos um sabor!").length).toBeGreaterThan(0);
    await user.click(screen.getByLabelText(/^Calabresa/));
    expect(screen.getByText("Você pode escolher até 2 sabores")).toBeInTheDocument();
    await user.click(screen.getByLabelText(/^Quatro queijos/));
    expect(screen.getByLabelText(/^Marguerita/)).toBeDisabled();
    expect(screen.getByText("Sabores (2/2)")).toBeInTheDocument();
  });

  it("updates the total with the billing type, options, extras and quantity", async () => {
    const { user } = setup();
    await user.click(screen.getByLabelText(/^Calabresa/));
    await user.click(screen.getByLabelText(/^Quatro queijos/)); // HIGHEST -> 49,90
    expect(screen.getByText("R$ 49,90")).toBeInTheDocument();
    await user.click(screen.getByLabelText(/^Catupiry/)); // +8,00
    await user.click(screen.getByLabelText(/^Orégano extra/)); // +1,50
    expect(screen.getByText("R$ 59,40")).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Quantidade:"));
    await user.type(screen.getByLabelText("Quantidade:"), "3");
    expect(screen.getByText("R$ 178,20")).toBeInTheDocument();
  });

  it("blocks an empty or zero quantity with the legacy messages", async () => {
    const { user } = setup(burger);
    const qty = screen.getByLabelText("Quantidade:");
    await user.clear(qty);
    expect(screen.getByText("Você precisa informar uma quantidade!")).toBeInTheDocument();
    await user.type(qty, "0");
    expect(screen.getByText("Você precisa informar uma quantidade maior que zero!")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Adicionar ao Pedido" })).toBeDisabled();
  });

  it("emits ids and choices only (what the API receives)", async () => {
    const { user, onConfirm } = setup();
    await user.click(screen.getByLabelText(/^Quatro queijos/));
    await user.click(screen.getByLabelText(/^Calabresa/));
    await user.type(screen.getByLabelText("Instruções adicionais"), "bem assada");
    await user.click(screen.getByRole("button", { name: "Adicionar ao Pedido" }));
    expect(onConfirm).toHaveBeenCalledWith({
      productId: "201", quantity: 1, instructions: "bem assada", flavorIds: ["2012", "2011"],
      components: [{ componentId: "2014", optionId: "20141" }, { componentId: "2015", on: false }],
    });
  });

  it("editing restores the previous choices (legacy extractOrderItem)", () => {
    setup(pizza, { productId: "201", quantity: 2, instructions: "x", flavorIds: ["2013"], components: [{ componentId: "2014", optionId: "20142" }, { componentId: "2015", on: true }] });
    expect(screen.getByLabelText(/^Marguerita/)).toBeChecked();
    expect(screen.getByLabelText(/^Catupiry/)).toBeChecked();
    expect(screen.getByLabelText(/^Orégano extra/)).toBeChecked();
    expect(screen.getByLabelText("Quantidade:")).toHaveValue(2);
    expect(screen.getByRole("button", { name: "Atualizar item" })).toBeEnabled();
  });
});
