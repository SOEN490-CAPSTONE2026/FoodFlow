import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import PrivateRoutes from "../components/PrivateRoutes";

describe("PrivateRoute", () => {
  test("renders protected content when logged in", () => {
    render(
      <AuthContext.Provider value={{ isLoggedIn: true }}>
        <MemoryRouter initialEntries={["/protected"]}>
          <Routes>
            <Route
              path="/protected"
              element={
                <PrivateRoutes>
                  <div>Protected Content</div>
                </PrivateRoutes>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  test("redirects to login when not logged in", () => {
    render(
      <AuthContext.Provider value={{ isLoggedIn: false }}>
        <MemoryRouter initialEntries={["/protected"]}>
          <Routes>
            <Route
              path="/protected"
              element={
                <PrivateRoutes>
                  <div>Protected Content</div>
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
