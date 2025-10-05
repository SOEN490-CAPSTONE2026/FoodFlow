import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ReceiverLayout from "../ReceiverLayout";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderAt(path = "/receiver") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/receiver/*" element={<ReceiverLayout />}>
          <Route index element={<div>Index</div>} />
          <Route path="dashboard" element={<div>Dashboard</div>} />
          <Route path="welcome" element={<div>Welcome</div>} />
          <Route path="browse" element={<div>Browse</div>} />
          <Route path="requests" element={<div>Requests</div>} />
          <Route path="search" element={<div>Search</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe("ReceiverLayout", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    localStorage.clear();
    sessionStorage.clear();
  });

  test("renders dashboard title/description at /receiver", () => {
    renderAt("/receiver");
    expect(screen.getByRole("heading", { name: /receiver dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/overview of nearby food and your activity/i)).toBeInTheDocument();
    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    expect(dashboardLink).toHaveClass("receiver-nav-link");
    expect(dashboardLink).toHaveClass("active");
  });

  test("renders welcome title/description at /receiver/welcome", () => {
    renderAt("/receiver/welcome");
    expect(screen.getByRole("heading", { name: /welcome/i })).toBeInTheDocument();
    expect(screen.getByText(/start here: search the map or browse nearby food/i)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /welcome/i });
    expect(link).toHaveClass("active");
  });

  test("renders browse title/description at /receiver/browse", () => {
    renderAt("/receiver/browse");
    expect(screen.getByRole("heading", { name: /browse available food/i })).toBeInTheDocument();
    expect(screen.getByText(/browse available food listings/i)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /find food/i });
    expect(link).toHaveClass("active");
  });

  test("renders requests title/description at /receiver/requests", () => {
    renderAt("/receiver/requests");
    expect(screen.getByRole("heading", { name: /my requests/i })).toBeInTheDocument();
    expect(screen.getByText(/manage your food requests/i)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /my requests/i });
    expect(link).toHaveClass("active");
  });

  test("renders search title/description at /receiver/search", () => {
    renderAt("/receiver/search");
    expect(screen.getByRole("heading", { name: /search organizations/i })).toBeInTheDocument();
    expect(screen.getByText(/search for food donors/i)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /search/i });
    expect(link).toHaveClass("active");
  });

  test("opens dropdown and logs out via navigate", () => {
    renderAt("/receiver");
    localStorage.setItem("token", "abc123");
    const clearSpy = jest.spyOn(window.sessionStorage.__proto__, "clear");
    const menu = screen.getByText(/receiver account/i);
    fireEvent.click(menu);
    const logout = screen.getByText(/log out/i);
    fireEvent.click(logout);
    expect(mockNavigate).toHaveBeenCalledWith("/", expect.objectContaining({ replace: true, state: { scrollTo: "home" } }));
    expect(localStorage.getItem("token")).toBeNull();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  test("dropdown closes on outside click", () => {
    renderAt("/receiver");
    const menu = screen.getByText(/receiver account/i);
    fireEvent.click(menu);
    expect(screen.getByText(/log out/i)).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText(/log out/i)).not.toBeInTheDocument();
  });
});
