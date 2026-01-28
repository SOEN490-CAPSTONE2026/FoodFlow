import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminWelcome from "../AdminWelcome";

describe("AdminWelcome", () => {
  it("renders the heading and description", () => {
    render(<AdminWelcome />);
    expect(screen.getByRole("heading", { level: 2, name: /welcome/i })).toBeInTheDocument();
    expect(screen.getByText(/this is the welcome page for admin\./i)).toBeInTheDocument();
  });

  it("has the wrapper element with the correct class", () => {
    render(<AdminWelcome />);
    const heading = screen.getByRole("heading", { level: 2, name: /welcome/i });
    expect(heading.closest(".admin-welcome")).toBeInTheDocument();
  });
});
