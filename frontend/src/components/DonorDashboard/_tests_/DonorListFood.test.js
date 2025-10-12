import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

// Mock the problematic dependencies
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

jest.mock('@react-google-maps/api', () => ({
  LoadScript: ({ children }) => children,
}));

jest.mock('../../SurplusFormModal', () => {
  return function MockSurplusFormModal({ isOpen, onClose }) {
    return isOpen ? <div data-testid="surplus-form-modal">Mock Modal</div> : null;
  };
});

jest.mock('lucide-react', () => ({
  Calendar: () => 'CalendarIcon',
  Clock: () => 'ClockIcon',
  MapPin: () => 'MapPinIcon',
  Edit: () => 'EditIcon',
  Trash2: () => 'TrashIcon',
  AlertTriangle: () => 'AlertIcon',
  X: () => 'XIcon',
  Package: () => 'PackageIcon',
}));

import DonorListFood from "../DonorListFood";

describe("DonorListFood", () => {
  const setup = () => render(<DonorListFood />);

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

  test("renders empty state when no donations exist", () => {
    setup();
    expect(screen.getByText(/you haven't posted anything yet/i)).toBeInTheDocument();
    expect(screen.getByText(/create your first donation post to start helping/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /load sample data \(for testing\)/i })).toBeInTheDocument();
  });

  test("renders donation listings with header after loading data", async () => {
    const user = userEvent.setup();
    setup();
    
    // Load sample data
    await user.click(screen.getByRole("button", { name: /load sample data \(for testing\)/i }));
    
    expect(screen.getByRole("button", { name: /\+ donate more/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /donations list/i })).toBeInTheDocument();
  });

  test("renders all donation cards after loading data", async () => {
    const user = userEvent.setup();
    setup();
    
    // Load sample data
    await user.click(screen.getByRole("button", { name: /load sample data \(for testing\)/i }));
    
    expect(screen.getByRole("heading", { name: /fresh apples/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /artisan bread selection/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /seasonal vegetable mix/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /dairy & protein pack/i })).toBeInTheDocument();
  });

  test("displays correct donation information after loading data", async () => {
    const user = userEvent.setup();
    setup();
    
    // Load sample data
    await user.click(screen.getByRole("button", { name: /load sample data \(for testing\)/i }));
    
    const appleCard = screen.getByLabelText(/fresh apples/i);
    expect(within(appleCard).getByText(/5 kg/i)).toBeInTheDocument();
    expect(within(appleCard).getByText(/available/i)).toBeInTheDocument();
    expect(within(appleCard).getByText(/fruits/i)).toBeInTheDocument();
    expect(within(appleCard).getByText(/organic/i)).toBeInTheDocument();
  });

  test("shows status badges correctly after loading data", async () => {
    const user = userEvent.setup();
    setup();
    
    // Load sample data
    await user.click(screen.getByRole("button", { name: /load sample data \(for testing\)/i }));
    
    expect(screen.getByText(/available/i)).toBeInTheDocument();
    expect(screen.getByText(/expiring soon/i)).toBeInTheDocument();
    expect(screen.getByText(/claimed/i)).toBeInTheDocument();
    expect(screen.getByText(/expired/i)).toBeInTheDocument();
  });

  test("displays donation details like time and location after loading data", async () => {
    const user = userEvent.setup();
    setup();
    
    // Load sample data
    await user.click(screen.getByRole("button", { name: /load sample data \(for testing\)/i }));
    
    const appleCard = screen.getByLabelText(/fresh apples/i);
    expect(within(appleCard).getByText(/2:00–5:00 PM/i)).toBeInTheDocument();
    expect(within(appleCard).getByText(/Expires Oct 8, 2025/i)).toBeInTheDocument();
  });

  test("shows edit and delete buttons for each donation after loading data", async () => {
    const user = userEvent.setup();
    setup();
    
    // Load sample data
    await user.click(screen.getByRole("button", { name: /load sample data \(for testing\)/i }));
    
    const editButtons = screen.getAllByRole("button", { name: /edit/i });
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    
    expect(editButtons.length).toBeGreaterThan(0);
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  test("edit button shows alert when clicked", async () => {
    const user = userEvent.setup();
    setup();
    
    // Load sample data
    await user.click(screen.getByRole("button", { name: /load sample data \(for testing\)/i }));
    
    const editButtons = screen.getAllByRole("button", { name: /edit/i });
    await user.click(editButtons[0]);
    
    expect(window.alert).toHaveBeenCalledWith(
      expect.stringContaining("Opening edit form for: Fresh Apples")
    );
  });

  test("delete button shows confirmation and deletes item when confirmed", async () => {
    window.confirm = jest.fn(() => true);
    const user = userEvent.setup();
    
    setup();
    
    // Load sample data
    await user.click(screen.getByRole("button", { name: /load sample data \(for testing\)/i }));
    
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await user.click(deleteButtons[0]);
    
    expect(window.confirm).toHaveBeenCalledWith("Are you sure you want to delete this post?");
    expect(window.alert).toHaveBeenCalledWith("Post deleted successfully.");
  });

  test("delete button does not delete when confirmation is cancelled", async () => {
    window.confirm = jest.fn(() => false);
    const user = userEvent.setup();
    
    setup();
    
    // Load sample data
    await user.click(screen.getByRole("button", { name: /load sample data \(for testing\)/i }));
    
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await user.click(deleteButtons[0]);
    
    expect(window.confirm).toHaveBeenCalledWith("Are you sure you want to delete this post?");
    expect(window.alert).not.toHaveBeenCalledWith("Post deleted successfully.");
  });

  test("renders donation notes after loading data", async () => {
    const user = userEvent.setup();
    setup();
    
    // Load sample data
    await user.click(screen.getByRole("button", { name: /load sample data \(for testing\)/i }));
    
    expect(screen.getByText(/Red Delicious apples, perfect for snacking or baking/i)).toBeInTheDocument();
    expect(screen.getByText(/Fresh sourdough, whole wheat, and gluten-free options/i)).toBeInTheDocument();
  });

  test("location links open in new tab after loading data", async () => {
    const user = userEvent.setup();
    setup();
    
    // Load sample data
    await user.click(screen.getByRole("button", { name: /load sample data \(for testing\)/i }));
    
    const locationLinks = screen.getAllByRole("link");
    
    locationLinks.forEach(link => {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(link.href).toContain("google.com/maps");
    });
  });
});