import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import DonorRequests from "../DonorRequests";

describe("DonorRequests", () => {
  test("renders header and empty state", () => {
    render(<DonorRequests items={[]} total={0} loading={false} />);
    expect(screen.getByRole("heading", { name: /requests/i })).toBeInTheDocument();
    expect(screen.getByText(/no requests\./i)).toBeInTheDocument();
    expect(screen.getByText("0 / 0")).toBeInTheDocument();
  });

  test("shows loading helper text when loading=true", () => {
    render(<DonorRequests items={[]} total={5} loading={true} />);
    expect(screen.getByText(/loading…/i)).toBeInTheDocument();
  });

  test("renders rows with status classes and enables actions only for pending", () => {
    const items = [
      { id: "1", receiver: "Org A", itemTitle: "Bread", qty: 5, status: "pending" },
      { id: "2", receiver: "Org B", itemTitle: "Milk", qty: 2, status: "approved" },
      { id: "3", receiver: "Org C", itemTitle: "Apples", qty: 10, status: "rejected" },
    ];
    render(<DonorRequests items={items} total={3} loading={false} />);

    const rows = screen.getAllByRole("row");
    const bodyRows = rows.slice(1);

    const r1 = within(bodyRows[0]);
    expect(r1.getByText("Org A")).toBeInTheDocument();
    expect(r1.getByText("Bread")).toBeInTheDocument();
    expect(r1.getByText("5")).toBeInTheDocument();
    const st1 = r1.getByText(/pending/i);
    expect(st1).toHaveClass("status", "st-active");
    expect(r1.getByRole("button", { name: /approve/i })).toBeEnabled();
    expect(r1.getByRole("button", { name: /reject/i })).toBeEnabled();

    const r2 = within(bodyRows[1]);
    const st2 = r2.getByText(/approved/i);
    expect(st2).toHaveClass("status", "st-claimed");
    expect(r2.getByRole("button", { name: /approve/i })).toBeDisabled();
    expect(r2.getByRole("button", { name: /reject/i })).toBeDisabled();

    const r3 = within(bodyRows[2]);
    const st3 = r3.getByText(/rejected/i);
    expect(st3).toHaveClass("status", "st-closed");
    expect(r3.getByRole("button", { name: /approve/i })).toBeDisabled();
    expect(r3.getByRole("button", { name: /reject/i })).toBeDisabled();

    expect(screen.getByText("3 / 3")).toBeInTheDocument();
  });

  test("clicking approve/reject calls handlers with item id", async () => {
    const user = userEvent.setup();
    const onApprove = jest.fn();
    const onReject = jest.fn();
    const items = [
      { id: "10", receiver: "Org X", itemTitle: "Rice", qty: 1, status: "pending" },
    ];
    render(
      <DonorRequests
        items={items}
        total={1}
        loading={false}
        onApprove={onApprove}
        onReject={onReject}
      />
    );

    const row = screen.getByRole("row", { name: /org x/i });
    await user.click(within(row).getByRole("button", { name: /approve/i }));
    await user.click(within(row).getByRole("button", { name: /reject/i }));

    expect(onApprove).toHaveBeenCalledWith("10");
    expect(onReject).toHaveBeenCalledWith("10");
  });
});
