import React from "react";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import ReceiverRequests from "../ReceiverRequests";

const setup = (props = {}) => {
  const items = [
    {
      id: "1",
      itemTitle: "Bread",
      donor: "Baker",
      qty: 2,
      status: "pending",
      requestedAt: "2024-01-02",
    },
    {
      id: "2",
      itemTitle: "Milk",
      donor: "Dairy",
      qty: 1,
      status: "approved",
      requestedAt: "2024-01-05",
    },
    {
      id: "3",
      itemTitle: "Cakes",
      donor: "Bakery",
      qty: 4,
      status: "rejected",
      requestedAt: "2024-01-10",
    },
  ];
  render(<ReceiverRequests items={items} total={10} loading={false} onCancel={() => {}} {...props} />);
};

describe("ReceiverRequests", () => {
  test("renders rows and status classes, cancel enabled only for pending", () => {
    setup();

    const rows = document.querySelectorAll("tbody .row");
    expect(rows.length).toBe(3);

    const rowPending = rows[0];
    expect(within(rowPending).getByText("Bread")).toBeInTheDocument();
    expect(within(rowPending).getByText("Baker")).toBeInTheDocument();
    expect(within(rowPending).getByText("2")).toBeInTheDocument();
    const pendingBadge = within(rowPending).getByText(/pending/i);
    expect(pendingBadge).toHaveClass("status", "st-active");
    const expectedPendingDate = new Date("2024-01-02").toLocaleDateString();
    expect(within(rowPending).getByText(expectedPendingDate)).toBeInTheDocument();
    expect(within(rowPending).getByRole("button", { name: /cancel/i })).toBeEnabled();

    const rowApproved = rows[1];
    expect(within(rowApproved).getByText("Milk")).toBeInTheDocument();
    expect(within(rowApproved).getByText("Dairy")).toBeInTheDocument();
    expect(within(rowApproved).getByText("1")).toBeInTheDocument();
    const approvedBadge = within(rowApproved).getByText(/approved/i);
    expect(approvedBadge).toHaveClass("status", "st-claimed");
    expect(within(rowApproved).getByRole("button", { name: /cancel/i })).toBeDisabled();

    const rowRejected = rows[2];
    const rejectedBadge = within(rowRejected).getByText(/rejected/i);
    expect(rejectedBadge).toHaveClass("status", "st-closed");
    expect(within(rowRejected).getByRole("button", { name: /cancel/i })).toBeDisabled();

    expect(screen.getByText("3 / 10")).toBeInTheDocument();
  });

  test("renders empty state when no items and not loading", () => {
    render(<ReceiverRequests items={[]} total={0} loading={false} onCancel={() => {}} />);
    expect(screen.getByText(/no requests yet\./i)).toBeInTheDocument();
  });
});
