import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import DonorSearch from "../DonorSearch";

describe("DonorSearch", () => {
  test("renders header and placeholder text", () => {
    render(<DonorSearch />);
    expect(screen.getByRole("heading", { name: /search/i })).toBeInTheDocument();
    expect(screen.getByText(/find organizations and receivers \(coming soon\)/i)).toBeInTheDocument();
  });
});
