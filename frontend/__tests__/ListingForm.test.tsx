import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ListingForm from "@/components/features/marketplace/ListingForm";

// react-dropzone uses browser APIs jsdom can stub; we'll mock the module to
// render a simple file input we can drive synchronously.
jest.mock("react-dropzone", () => ({
  useDropzone: ({ onDrop }: { onDrop: (files: File[]) => void }) => ({
    getRootProps: () => ({}),
    getInputProps: () => ({
      "data-testid": "photo-input",
      type: "file",
      multiple: true,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        onDrop(Array.from(e.target.files ?? [])),
    }),
    isDragActive: false,
  }),
}));

describe("ListingForm", () => {
  it("shows zod validation errors when submitting empty", async () => {
    const onSubmit = jest.fn();
    render(<ListingForm mode="create" onSubmit={onSubmit} />);
    fireEvent.click(
      screen.getByRole("button", { name: /Publicar anúncio/ })
    );
    await waitFor(() => {
      expect(
        screen.getByText(/Mínimo 3 caracteres/)
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/Mínimo 10 caracteres/)).toBeInTheDocument();
    expect(
      screen.getByText(/Adicione pelo menos 1 foto/)
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
