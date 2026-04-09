import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ListingCard from "@/components/features/marketplace/ListingCard";
import type { ListingDto } from "@/lib/types/marketplace";

jest.mock("next/link", () => {
  const Link = ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>;
  Link.displayName = "Link";
  return { __esModule: true, default: Link };
});

const baseListing: ListingDto = {
  id: 42,
  sellerId: "00000000-0000-0000-0000-000000000001",
  sellerDisplayName: "Ana",
  sellerIsVerified: true,
  bairroId: 1,
  title: "Bicicleta aro 26",
  description: "Seminova, muito boa",
  price: 450.5,
  categoryCode: "esportes",
  subcategoryCode: "bicicleta",
  status: "active",
  createdAt: new Date().toISOString(),
  soldAt: null,
  photos: [
    {
      id: 1,
      orderIndex: 0,
      url: "/uploads/listings/a.jpg",
      thumbnailUrl: "/uploads/listings/a_thumb.jpg",
    },
  ],
  favoriteCount: 0,
  isFavoritedByCurrentUser: false,
};

describe("ListingCard", () => {
  it("renders title, BRL price and verified badge", () => {
    render(<ListingCard listing={baseListing} />);
    expect(screen.getByText("Bicicleta aro 26")).toBeInTheDocument();
    // Intl NumberFormat pt-BR renders "R$ 450,50"
    expect(screen.getByText(/R\$/)).toBeInTheDocument();
    expect(screen.getByText(/450,50/)).toBeInTheDocument();
    expect(screen.getByLabelText("Vizinho verificado")).toBeInTheDocument();
  });

  it("shows VENDIDO overlay when status is sold", () => {
    render(
      <ListingCard listing={{ ...baseListing, status: "sold" }} />
    );
    expect(screen.getByText("VENDIDO")).toBeInTheDocument();
  });

  it("links to listing detail", () => {
    render(<ListingCard listing={baseListing} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/marketplace/42/");
  });
});
