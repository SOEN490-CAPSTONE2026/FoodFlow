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
    {
      id: "2",
      title: "Milk",
      donor: "Dairy Co",
      category: "Dairy",
      qty: 10,
      unit: "liters",
      expiresAt: "2024-03-15",
      distanceKm: 5,
    },
  ];
  render(<ReceiverSearch items={defaultItems} total={2} loading={false} onSearch={() => {}} {...props} />);
};

describe("ReceiverSearch", () => {
  test("renders rows with formatted fields", () => {
    setup();
    const rows = document.querySelectorAll("tbody .row");
    expect(rows.length).toBe(2);

    const first = rows[0];
    expect(within(first).getByText("Apples")).toBeInTheDocument();
    expect(within(first).getByText("Fresh Farm")).toBeInTheDocument();
    expect(within(first).getByText("Produce")).toBeInTheDocument();
    expect(within(first).getByText("5 kg")).toBeInTheDocument();

    const expected1 = new Date("2024-01-02").toLocaleDateString();
    expect(within(first).getByText(expected1)).toBeInTheDocument();
    expect(within(first).getByText("2.5 km")).toBeInTheDocument();

    const second = rows[1];
    expect(within(second).getByText("Milk")).toBeInTheDocument();
    expect(within(second).getByText("Dairy Co")).toBeInTheDocument();
    expect(within(second).getByText("Dairy")).toBeInTheDocument();
    expect(within(second).getByText("10 liters")).toBeInTheDocument();

    const expected2 = new Date("2024-03-15").toLocaleDateString();
    expect(within(second).getByText(expected2)).toBeInTheDocument();
    expect(within(second).getByText("5 km")).toBeInTheDocument();
  });

  test("shows loading state text in button and help", () => {
    setup({ loading: true, total: 10, items: [] });
    const allSearching = screen.getAllByText(/searching…/i);
    expect(allSearching.length).toBe(2);
    expect(screen.getByRole("button", { name: /searching…/i })).toBeDisabled();
    const tbody = document.querySelector("tbody");
    expect(within(tbody).queryByText(/no results\./i)).not.toBeInTheDocument();
  });

  test("renders empty state when no results and not loading", () => {
    setup({ items: [], total: 0, loading: false });
    expect(screen.getByText(/no results\./i)).toBeInTheDocument();
  });
});
