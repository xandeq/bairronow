import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import FilterChips from "@/components/features/marketplace/FilterChips";

describe("FilterChips", () => {
  it("defaults verifiedOnly ON and toggling OFF shows warning (D-10)", () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <FilterChips
        filters={{ verifiedOnly: true, sort: "recent" }}
        onChange={onChange}
      />
    );

    const checkbox = screen.getByRole("checkbox", {
      name: /Apenas verificados/,
    });
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledWith({ verifiedOnly: false });

    rerender(
      <FilterChips
        filters={{ verifiedOnly: false, sort: "recent" }}
        onChange={onChange}
      />
    );
    expect(
      screen.getByText(/Vendedor não verificado/)
    ).toBeInTheDocument();
  });

  it("clicking a category chip fires onChange with that code", () => {
    const onChange = jest.fn();
    render(
      <FilterChips
        filters={{ verifiedOnly: true, sort: "recent" }}
        onChange={onChange}
      />
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Eletrônicos & Informática/ })
    );
    expect(onChange).toHaveBeenCalledWith({ category: "eletronicos" });
  });
});
