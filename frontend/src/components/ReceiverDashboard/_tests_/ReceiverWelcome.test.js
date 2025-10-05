import React from "react";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import ReceiverSearch from "../ReceiverSearch";

const setup = (props = {}) => {
  const defaultItems = [
    {
      id: "1",
      title: "Apples",
      donor: "Fresh Farm",
      category: "Produce",
      qty: 5,
      unit: "kg",
      expiresAt: "2024-01-02",
      distanceKm: 2.5,
    },
  ];
  render(<ReceiverSearch items={defaultItems} total={1} loading={false} onSearch={() => {}} {...props} />);
};

describe("ReceiverSearch (welcome page table)", () => {
  test("renders one row with formatted fields", () => {
    setup();
    const rows = document.querySelectorAll("tbody .row");
    expect(rows.length).toBe(1);
    const first = rows[0];
    expect(within(first).getByText("Apples")).toBeInTheDocument();
    expect(within(first).getByText("Fresh Farm")).toBeInTheDocument();
    expect(within(first).getByText("Produce")).toBeInTheDocument();
    expect(within(first).getByText("5 kg")).toBeInTheDocument();
    const expectedDate = new Date("2024-01-02").toLocaleDateString();
    expect(within(first).getByText(expectedDate)).toBeInTheDocument();
    expect(within(first).getByText("2.5 km")).toBeInTheDocument();
  });

  test("loading shows both button and help as 'Searching…'", () => {
    setup({ loading: true, items: [], total: 10 });
    const matches = screen.getAllByText(/searching…/i);
    expect(matches.length).toBe(2);
    expect(screen.getByRole("button", { name: /searching…/i })).toBeDisabled();
  });
});
