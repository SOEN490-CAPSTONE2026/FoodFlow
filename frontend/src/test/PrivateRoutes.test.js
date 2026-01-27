import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import PrivateRoutes from "../components/PrivateRoutes";

describe("PrivateRoutes", () => {
  test("renders protected content when logged in with correct role", () => {
    render(
      <AuthContext.Provider value={{ isLoggedIn: true, role: "DONOR" }}>
        <MemoryRouter initialEntries={["/donor/*"]}>
          <Routes>
            <Route
              path="/donor/*"
              element={
                <PrivateRoutes>
                  <div>Donor Dashboard</div>
                </PrivateRoutes>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText("Donor Dashboard")).toBeInTheDocument();
  });

  test("redirects to login when logged in but role does not match", () => {
    render(
      <AuthContext.Provider value={{ isLoggedIn: true, role: "DONOR" }}>
        <MemoryRouter initialEntries={["/admin"]}>
          <Routes>
            <Route
              path="/admin"
              element={
                <PrivateRoutes>
                  <div>Admin Dashboard</div>
                </PrivateRoutes>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  test("redirects to login when not logged in", () => {
    render(
      <AuthContext.Provider value={{ isLoggedIn: false, role: null }}>
        <MemoryRouter initialEntries={["/donor/*"]}>
          <Routes>
            <Route
              path="/donor/*"
              element={
                <PrivateRoutes>
                  <div>Donor Dashboard</div>
                </PrivateRoutes>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });
});
