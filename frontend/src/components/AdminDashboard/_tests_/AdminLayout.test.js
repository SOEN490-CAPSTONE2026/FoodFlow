import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Routes, Route } from "react-router-dom";

// Mock only useNavigate
const mockedNavigate = jest.fn();
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

import AdminLayout from "../AdminLayout";

function Stub({ label }) {
  return <div data-testid="stub-outlet">{label}</div>;
}

describe("AdminLayout", () => {
  beforeEach(() => {
    mockedNavigate.mockClear();
    // seed storages to verify logout clears them
    localStorage.setItem("token", "abc123");
    jest.spyOn(Storage.prototype, "removeItem");
    jest.spyOn(Storage.prototype, "clear");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  // parent route MUST have a path ("/admin/*") and children must be relative
  const renderWithRoutes = (initialPath = "/admin") =>
    render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/admin/*" element={<AdminLayout />}>
            <Route index element={<Stub label="Dashboard Content" />} />
            <Route path="dashboard" element={<Stub label="Dashboard Content" />} />
            <Route path="analytics" element={<Stub label="Analytics Content" />} />
            <Route path="calendar" element={<Stub label="Calendar Content" />} />
            <Route path="messages" element={<Stub label="Messages Content" />} />
            <Route path="help" element={<Stub label="Help Content" />} />
          </Route>
          <Route path="/" element={<div>Home</div>} />
        </Routes>
      </MemoryRouter>
    );

  it("renders sidebar and topbar basics", () => {
    renderWithRoutes("/admin");
    expect(screen.getByText("FoodFlow")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /admin dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/overview and quick actions/i)).toBeInTheDocument();
    expect(screen.getByTestId("stub-outlet")).toHaveTextContent("Dashboard Content");
  });

  it("shows correct title/desc for Analytics route", () => {
    renderWithRoutes("/admin/analytics");
    expect(screen.getByRole("heading", { name: /analytics/i })).toBeInTheDocument();
    expect(screen.getByText(/metrics and insights/i)).toBeInTheDocument();
    expect(screen.getByTestId("stub-outlet")).toHaveTextContent("Analytics Content");
  });

  it("applies active class to the current nav link", () => {
    renderWithRoutes("/admin/calendar");
    const nav = screen.getByRole("navigation");
    const active = within(nav).getByRole("link", { name: /calendar/i });
    expect(active).toHaveClass("active");
    const analytics = within(nav).getByRole("link", { name: /analytics/i });
    expect(analytics).not.toHaveClass("active");
  });

  it("toggles the user dropdown and logs out", () => {
    renderWithRoutes("/admin/messages");

    // open dropdown
    const chip = screen.getByRole("button", { name: /admin account/i });
    fireEvent.click(chip);
    const logoutBtn = screen.getByRole("button", { name: /log out/i });
    expect(logoutBtn).toBeInTheDocument();

    // click logout
    fireEvent.click(logoutBtn);

    // storage cleared
    expect(localStorage.removeItem).toHaveBeenCalledWith("token");
    expect(sessionStorage.clear).toHaveBeenCalled();

    // navigated home
    expect(mockedNavigate).toHaveBeenCalledWith("/", {
      replace: true,
      state: { scrollTo: "home" },
    });
  });

  it("closes the dropdown by toggling the chip", () => {
    renderWithRoutes("/admin");
    const chip = screen.getByRole("button", { name: /admin account/i });

    fireEvent.click(chip); // open
    expect(screen.getByRole("button", { name: /profile/i })).toBeInTheDocument();

    fireEvent.click(chip); // close
    expect(screen.queryByRole("button", { name: /profile/i })).not.toBeInTheDocument();
  });
});
