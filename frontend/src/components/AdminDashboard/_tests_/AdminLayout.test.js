import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Routes, Route } from "react-router-dom";

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
    localStorage.setItem("token", "abc123");
    jest.spyOn(Storage.prototype, "removeItem");
    jest.spyOn(Storage.prototype, "clear");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

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
    const active = within(nav).getByRole("link", { name: /compliance queue/i });
    expect(active).toHaveClass("active");
    const donations = within(nav).getByRole("link", { name: /donations/i });
    expect(donations).not.toHaveClass("active");
  });

  it("toggles the user dropdown via kebab and logs out", () => {
    renderWithRoutes("/admin/messages");
    const kebab = screen.getByRole("button", { name: /menu/i });
    fireEvent.click(kebab);
    const logoutBtn = screen.getByRole("button", { name: /logout/i });
    expect(logoutBtn).toBeInTheDocument();
    fireEvent.click(logoutBtn);
    expect(localStorage.removeItem).toHaveBeenCalledWith("token");
    expect(sessionStorage.clear).toHaveBeenCalled();
    expect(mockedNavigate).toHaveBeenCalledWith("/", {
      replace: true,
      state: { scrollTo: "home" },
    });
  });

  it("closes the dropdown by toggling the menu button", () => {
    renderWithRoutes("/admin");
    const kebab = screen.getByRole("button", { name: /menu/i });
    fireEvent.click(kebab);
    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
    fireEvent.click(kebab);
    expect(screen.queryByRole("button", { name: /logout/i })).not.toBeInTheDocument();
  });
});
