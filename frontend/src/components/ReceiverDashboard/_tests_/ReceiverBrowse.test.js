import React from "react";
import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import ReceiverBrowse from "../ReceiverBrowse";

describe("ReceiverBrowse", () => {
  const makeItems = (n) =>
    Array.from({ length: n }).map((_, i) => ({
      id: `id-${i + 1}`,
      title: `Item ${i + 1}`,
      donor: `Donor ${i + 1}`,
      qty: i + 1,
      unit: "kg",
      expiresAt: "2024-01-05T00:00:00.000Z",
      distanceKm: i + 0.5,
    }));

  test("renders empty state with counts and disabled pagination", () => {
    render(<ReceiverBrowse items={[]} total={0} page={1} pageSize={10} />);

    // Searchbar help shows count
    expect(screen.getByText("0 / 0")).toBeInTheDocument();

    // Table shows "No results."
    expect(screen.getByText(/no results\./i)).toBeInTheDocument();

    // Pagination info and disabled buttons
    expect(screen.getByText(/page 1/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /prev/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });

  test("shows loading state in searchbar and disables search button", () => {
    render(<ReceiverBrowse loading items={[]} total={20} />);

    expect(screen.getByRole("button", { name: /searching…/i })).toBeDisabled();
    expect(screen.getByText(/loading…/i)).toBeInTheDocument();
  });

  test("typing + clicking Search calls onSearch with the query", async () => {
    const user = userEvent.setup();
    const onSearch = jest.fn();

    render(<ReceiverBrowse onSearch={onSearch} />);

    const input = screen.getByPlaceholderText(/search available food/i);
    await user.type(input, "rice");
    await user.click(screen.getByRole("button", { name: /search/i }));

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("rice");
  });

  test("pressing Enter triggers search", async () => {
    const user = userEvent.setup();
    const onSearch = jest.fn();

    render(<ReceiverBrowse onSearch={onSearch} />);

    const input = screen.getByPlaceholderText(/search available food/i);
    await user.type(input, "beans{Enter}");

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("beans");
  });

  test("renders rows with formatted fields and invokes onRequestClick", async () => {
    const user = userEvent.setup();
    const items = [
      {
        id: "a",
        title: "Apples",
        donor: "Farm Co",
        qty: 5,
        unit: "kg",
        expiresAt: "2024-01-05T00:00:00.000Z",
        distanceKm: 3.2,
      },
      {
        id: "b",
        title: "—missing— demo",
    
        qty: 1,
        unit: "boxes",
        
      },
    ];
    const onRequestClick = jest.fn();

    render(<ReceiverBrowse items={items} total={2} onRequestClick={onRequestClick} />);

    const rows = screen.getAllByRole("row");
    // rows[0] is header; ensure we have 2 data rows after header
    const bodyRows = rows.slice(1);
    expect(bodyRows).toHaveLength(2);

    // Row 1 assertions (fully populated)
    const r1 = bodyRows[0];
    const c1 = within(r1).getAllByRole("cell");
    expect(c1[0]).toHaveTextContent("Apples");
    expect(c1[1]).toHaveTextContent("Farm Co");
    expect(c1[2]).toHaveTextContent("5 kg");

    // Date formatting should match environment locale; compute expected string
    const expectedDate = new Date("2024-01-05T00:00:00.000Z").toLocaleDateString();
    expect(c1[3]).toHaveTextContent(expectedDate);
    expect(c1[4]).toHaveTextContent("3.2 km");

    // Click Request on row 1
    await user.click(within(r1).getByRole("button", { name: /request/i }));
    expect(onRequestClick).toHaveBeenCalledTimes(1);
    expect(onRequestClick).toHaveBeenCalledWith(items[0]);

    // Row 2 assertions (missing values)
    const r2 = bodyRows[1];
    const c2 = within(r2).getAllByRole("cell");
    expect(c2[0]).toHaveTextContent("—missing— demo");
    expect(c2[1]).toHaveTextContent("—");
    expect(c2[2]).toHaveTextContent("1 boxes");
    expect(c2[3]).toHaveTextContent("—");
    expect(c2[4]).toHaveTextContent("—");
  });

  test("pagination: next enabled when page is full; prev enabled when page > 1", async () => {
    const user = userEvent.setup();
    const onPageChange = jest.fn();

    const fullPageItems = makeItems(10); // pageSize = 10
    render(
      <ReceiverBrowse
        items={fullPageItems}
        total={25}
        page={2}
        pageSize={10}
        onPageChange={onPageChange}
      />
    );

    const prevBtn = screen.getByRole("button", { name: /prev/i });
    const nextBtn = screen.getByRole("button", { name: /next/i });

    expect(prevBtn).toBeEnabled();
    expect(nextBtn).toBeEnabled();

    await user.click(prevBtn);
    expect(onPageChange).toHaveBeenCalledWith(1);

    await user.click(nextBtn);
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  test("pagination: next disabled when fewer than pageSize results; prev disabled at page 1", async () => {
    const user = userEvent.setup();
    const onPageChange = jest.fn();

    const partialItems = makeItems(3);
    render(
      <ReceiverBrowse
        items={partialItems}
        total={3}
        page={1}
        pageSize={10}
        onPageChange={onPageChange}
      />
    );

    const prevBtn = screen.getByRole("button", { name: /prev/i });
    const nextBtn = screen.getByRole("button", { name: /next/i });

    expect(prevBtn).toBeDisabled();
    expect(nextBtn).toBeDisabled();

    // Clicking when disabled should not call handler
    await user.click(prevBtn);
    await user.click(nextBtn);
    expect(onPageChange).not.toHaveBeenCalled();
  });

  test("guards: non-array items do not crash and show 0 / total", () => {
    render(<ReceiverBrowse items={null} total={9} />);
    expect(screen.getByText("0 / 9")).toBeInTheDocument();
    expect(screen.getByText(/no results\./i)).toBeInTheDocument();
  });
});
