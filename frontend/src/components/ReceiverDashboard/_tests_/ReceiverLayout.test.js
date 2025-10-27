import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ReceiverLayout from "../ReceiverLayout";
import { AuthContext } from "../../../contexts/AuthContext";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockLogout = jest.fn();

function renderAt(path = "/receiver") {
  return render(
    <AuthContext.Provider value={{ logout: mockLogout }}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/receiver/*" element={<ReceiverLayout />}>
            <Route index element={<div>Index</div>} />
            <Route path="dashboard" element={<div>Dashboard</div>} />
            <Route path="welcome" element={<div>Welcome</div>} />
            <Route path="browse" element={<div>Browse</div>} />
            <Route path="my-claims" element={<div>My Claims</div>} />
            <Route path="requests" element={<div>Requests</div>} />
            <Route path="search" element={<div>Search</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe("ReceiverLayout", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockLogout.mockReset();
  });

  test("renders dashboard title/description at /receiver and marks 'My Claims' active", () => {
    renderAt("/receiver");
    expect(screen.getByRole("heading", { name: /receiver dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/overview of nearby food and your activity/i)).toBeInTheDocument();

    const nav = screen.getByText(/my claims/i).closest("a");
    expect(nav).toHaveClass("receiver-nav-link");
    expect(nav).toHaveClass("active");
  });

  test("renders welcome title/description at /receiver/welcome and marks 'Saved Donations' active", () => {
    renderAt("/receiver/welcome");
    expect(screen.getByRole("heading", { name: /welcome/i })).toBeInTheDocument();
    expect(screen.getByText(/start here: search the map or browse nearby food/i)).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /saved donations/i });
    expect(link).toHaveClass("active");
  });

  test("renders browse title/description at /receiver/browse and marks 'Donations' active", () => {
    renderAt("/receiver/browse");
    expect(screen.getByRole("heading", { name: /browse available food/i })).toBeInTheDocument();
    expect(screen.getByText(/browse available food listings/i)).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /^donations$/i });
    expect(link).toHaveClass("active");
  });

  test("renders requests title/description at /receiver/requests and marks 'Messages' active", () => {
    renderAt("/receiver/requests");
    expect(screen.getByRole("heading", { name: /my requests/i })).toBeInTheDocument();
    expect(screen.getByText(/manage your food requests/i)).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /^messages$/i });
    expect(link).toHaveClass("active");
  });

  test("renders search title/description at /receiver/search", () => {
    renderAt("/receiver/search");
    expect(screen.getByRole("heading", { name: /search organizations/i })).toBeInTheDocument();
    expect(screen.getByText(/search for food donors/i)).toBeInTheDocument();
  });

  test("opens account menu via avatar button and logs out", async () => {
    renderAt("/receiver");

    const avatarBtn = screen.getByRole("button", { name: /account menu/i });
    fireEvent.click(avatarBtn);

    const menu = screen.getByText(/logout/i).closest(".dropdown-menu");
    expect(menu).toBeInTheDocument();

    const logoutBtn = within(menu).getByText(/logout/i);
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/", {
        replace: true,
        state: { scrollTo: "home" },
      });
    });
  });

  test("account menu closes on outside click", () => {
    renderAt("/receiver");
    const avatarBtn = screen.getByRole("button", { name: /account menu/i });

    fireEvent.click(avatarBtn);
    expect(screen.getByText(/logout/i)).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText(/logout/i)).not.toBeInTheDocument();
  });
});