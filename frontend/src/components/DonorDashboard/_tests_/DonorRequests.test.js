import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import DonorRequests from "../DonorRequests";

describe("DonorRequests", () => {
  test("renders header and placeholder text", () => {
    render(<DonorRequests />);
    expect(screen.getByRole("heading", { name: /requests/i })).toBeInTheDocument();
    expect(screen.getByText(/manage incoming requests for your donations \(coming soon\)/i)).toBeInTheDocument();
  });

  test("renders consistently", () => {
    render(<DonorRequests />);
    expect(screen.getByRole("heading", { name: /requests/i })).toBeInTheDocument();
  });
});
