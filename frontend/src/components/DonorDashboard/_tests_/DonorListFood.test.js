import React from "react";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import DonorListFood from "../DonorListFood";

describe("DonorListFood", () => {
  const setup = (props = {}) =>
    render(
      <DonorListFood
        items={[]}
        loading={false}
        saving={false}
        onCreate={jest.fn()}
        onDelete={jest.fn()}
        {...props}
      />
    );

  let originalAlert;
  let originalConfirm;
  beforeAll(() => {
    originalAlert = window.alert;
    originalConfirm = window.confirm;
  });
  beforeEach(() => {
    window.alert = jest.fn();
    window.confirm = jest.fn();
  });
  afterAll(() => {
    window.alert = originalAlert;
    window.confirm = originalConfirm;
  });

  test("renders form and empty state by default", () => {
    setup();
    expect(screen.getByRole("heading", { name: /create new food listing/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/fresh bread, assorted vegetables/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create listing/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /my listings/i })).toBeInTheDocument();
    expect(screen.getByText(/no listings yet/i)).toBeInTheDocument();
  });

  test("shows loading helper text when loading=true", () => {
    setup({ loading: true });
    expect(screen.getByText(/loading listings/i)).toBeInTheDocument();
  });

  test("validation: alerts when Title/Location missing", async () => {
    const onCreate = jest.fn();
    setup({ onCreate });
    await userEvent.click(screen.getByRole("button", { name: /create listing/i }));
    expect(window.alert).toHaveBeenCalledWith("Please fill in required fields: Title and Location");
    expect(onCreate).not.toHaveBeenCalled();
  });

  test("creates item and clears form (using placeholders/roles/display values)", async () => {
    const onCreate = jest.fn().mockResolvedValue(undefined);
    const { container } = setup({ onCreate });

    const title = screen.getByPlaceholderText(/fresh bread, assorted vegetables/i);
    const qty = screen.getByRole("spinbutton");
    const unit = screen.getByDisplayValue("kg");
    const category = screen.getByDisplayValue("Prepared Meals");
    const expiresAt = container.querySelector('input[type="datetime-local"]');
    const pickupWindow = screen.getByPlaceholderText(/3-6 pm.*9 am-12 pm/i);
    const location = screen.getByPlaceholderText(/full address or specific location details/i);

    await userEvent.type(title, "Fresh Bread");
    await userEvent.clear(qty);
    await userEvent.type(qty, "5");
    await userEvent.selectOptions(unit, "boxes");
    await userEvent.selectOptions(category, "Bakery");
    await userEvent.type(expiresAt, "2025-01-15T10:30");
    await userEvent.type(pickupWindow, "3-6 PM");
    await userEvent.type(location, "123 Main St");

    await userEvent.click(screen.getByRole("button", { name: /create listing/i }));

    await waitFor(() =>
      expect(onCreate).toHaveBeenCalledWith({
        title: "Fresh Bread",
        category: "Bakery",
        quantity: 5,
        unit: "boxes",
        pickupWindow: "3-6 PM",
        location: "123 Main St",
        expiresAt: "2025-01-15T10:30",
      })
    );

    await waitFor(() => {
      expect(title).toHaveValue("");
      // number inputs return string values from .value
      expect(qty).toHaveValue(1);
      expect(unit).toHaveDisplayValue("kg");
      expect(category).toHaveDisplayValue("Prepared Meals");
      expect(expiresAt).toHaveValue("");
      expect(pickupWindow).toHaveValue("");
      expect(location).toHaveValue("");
    });
  });

  test("create button disabled and shows Creating… when saving=true", () => {
    setup({ saving: true });
    const btn = screen.getByRole("button", { name: /creating/i });
    expect(btn).toBeDisabled();
  });

  test("renders listings and delete flow honors confirm", async () => {
    const onDelete = jest.fn().mockResolvedValue(undefined);
    const items = [
      {
        id: "a1",
        title: "Tomatoes",
        category: "Produce",
        qty: 10,
        unit: "kg",
        status: "Active",
        pickupWindow: "9-11 AM",
        location: "Warehouse A",
        createdAt: "2025-01-10T09:00:00.000Z",
        expiresAt: "2025-01-12T12:00:00.000Z",
      },
    ];

    render(<DonorListFood items={items} onDelete={onDelete} />);

    const card = screen.getByRole("heading", { name: /my listings/i }).closest(".card");
    expect(within(card).getByText(/tomatoes/i)).toBeInTheDocument();
    expect(within(card).getByText(/produce/i)).toBeInTheDocument();
    expect(within(card).getByText(/10 kg/i)).toBeInTheDocument();
    expect(within(card).getByText(/9-11 am/i)).toBeInTheDocument();
    expect(within(card).getByText(/warehouse a/i)).toBeInTheDocument();
    expect(within(card).getByText(/active/i)).toHaveClass("status-badge", "st-active");


    window.confirm = jest.fn(() => true);
    await userEvent.click(within(card).getByRole("button", { name: /delete/i }));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith("a1"));
  });

  test("does not delete when confirm is cancelled", async () => {
    const onDelete = jest.fn();
    const items = [
      {
        id: "b2",
        title: "Milk",
        category: "Dairy",
        qty: 4,
        unit: "units",
        status: "Pending",
        pickupWindow: "",
        location: "Storefront",
        createdAt: "2025-01-10T09:00:00.000Z",
        expiresAt: "",
      },
    ];

    render(<DonorListFood items={items} onDelete={onDelete} />);

    window.confirm = jest.fn(() => false);
    await userEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(onDelete).not.toHaveBeenCalled();
  });

  test("clear form resets inputs", async () => {
    const { container } = setup();

    const title = screen.getByPlaceholderText(/fresh bread, assorted vegetables/i);
    const location = screen.getByPlaceholderText(/full address or specific location details/i);
    const clearBtn = screen.getByRole("button", { name: /clear form/i });
    const expiresAt = container.querySelector('input[type="datetime-local"]');

    await userEvent.type(title, "Test Item");
    await userEvent.type(location, "Somewhere");
    await userEvent.type(expiresAt, "2025-02-01T09:00");

    await userEvent.click(clearBtn);

    expect(title).toHaveValue("");
    expect(location).toHaveValue("");
    expect(expiresAt).toHaveValue("");
  });
});
