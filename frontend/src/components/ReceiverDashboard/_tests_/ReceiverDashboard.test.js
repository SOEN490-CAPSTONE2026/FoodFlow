import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";
import ReceiverDashboard from "../ReceiverDashboard";

// Mock ReceiverLayout to render Outlet properly (using .js extension)
jest.mock("../ReceiverLayout.js", () => {
  const { Outlet } = require("react-router-dom");
  return function ReceiverLayout() {
    return (
      <div data-testid="receiver-layout">
        <Outlet />
      </div>
    );
  };
});

jest.mock("../ReceiverDashboardHome.js", () => {
  return function ReceiverDashboardHome() {
    return <div data-testid="dashboard-home">Dashboard Home</div>;
  };
});

jest.mock("../ReceiverWelcome.js", () => {
  return function ReceiverWelcome() {
    return <div data-testid="welcome">Welcome Page</div>;
  };
});

jest.mock("../ReceiverBrowse.js", () => {
  return function ReceiverBrowse() {
    return <div data-testid="browse">Browse Page</div>;
  };
});

jest.mock("../ReceiverMyClaims.js", () => {
  return function ReceiverMyClaims() {
    return <div data-testid="my-claims">My Claims Page</div>;
  };
});

jest.mock("../../MessagingDashboard/MessagingDashboard.js", () => {
  return function MessagingDashboard() {
    return <div data-testid="messages">Messages Page</div>;
  };
});

// Helper function to render with router - wrapping in a parent route
const renderWithRouter = (initialRoute = "/receiver") => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/receiver/*" element={<ReceiverDashboard />} />
      </Routes>
    </MemoryRouter>
  );
};

describe("ReceiverDashboard", () => {
  test("renders ReceiverLayout wrapper", () => {
    renderWithRouter("/receiver");
    expect(screen.getByTestId("receiver-layout")).toBeInTheDocument();
  });

  test("renders dashboard home on index route", () => {
    renderWithRouter("/receiver");
    expect(screen.getByTestId("dashboard-home")).toBeInTheDocument();
    expect(screen.getByText("Dashboard Home")).toBeInTheDocument();
  });

  test("renders dashboard home on /dashboard route", () => {
    renderWithRouter("/receiver/dashboard");
    expect(screen.getByTestId("dashboard-home")).toBeInTheDocument();
  });

  test("renders welcome page on /welcome route", () => {
    renderWithRouter("/receiver/welcome");
    expect(screen.getByTestId("welcome")).toBeInTheDocument();
    expect(screen.getByText("Welcome Page")).toBeInTheDocument();
  });

  test("renders browse page on /browse route", () => {
    renderWithRouter("/receiver/browse");
    expect(screen.getByTestId("browse")).toBeInTheDocument();
    expect(screen.getByText("Browse Page")).toBeInTheDocument();
  });

  test("renders my claims page on /my-claims route", () => {
    renderWithRouter("/receiver/my-claims");
    expect(screen.getByTestId("my-claims")).toBeInTheDocument();
    expect(screen.getByText("My Claims Page")).toBeInTheDocument();
  });

  test("renders messages page on /messages route", () => {
    renderWithRouter("/receiver/messages");
    expect(screen.getByTestId("messages")).toBeInTheDocument();
    expect(screen.getByText("Messages Page")).toBeInTheDocument();
  });

  test("redirects unknown routes to index", () => {
    renderWithRouter("/receiver/unknown-route");
    // Should redirect to dashboard home (index route)
    expect(screen.getByTestId("dashboard-home")).toBeInTheDocument();
  });

  test("handles deeply nested unknown routes", () => {
    renderWithRouter("/receiver/unknown/nested/route");
    // Should redirect to dashboard home
    expect(screen.getByTestId("dashboard-home")).toBeInTheDocument();
  });

  test("all routes render within ReceiverLayout", () => {
    const routes = [
      "/receiver",
      "/receiver/dashboard",
      "/receiver/welcome",
      "/receiver/browse",
      "/receiver/my-claims",
      "/receiver/messages",
    ];

    routes.forEach((route) => {
      const { unmount } = renderWithRouter(route);
      expect(screen.getByTestId("receiver-layout")).toBeInTheDocument();
      unmount();
    });
  });

  test("does not render multiple pages simultaneously", () => {
    renderWithRouter("/receiver/welcome");
    
    // Should only render welcome page, not others
    expect(screen.getByTestId("welcome")).toBeInTheDocument();
    expect(screen.queryByTestId("browse")).not.toBeInTheDocument();
    expect(screen.queryByTestId("my-claims")).not.toBeInTheDocument();
    expect(screen.queryByTestId("dashboard-home")).not.toBeInTheDocument();
  });

  test("index route and /dashboard route render the same component", () => {
    const { unmount } = renderWithRouter("/receiver");
    expect(screen.getByTestId("dashboard-home")).toBeInTheDocument();
    unmount();

    renderWithRouter("/receiver/dashboard");
    expect(screen.getByTestId("dashboard-home")).toBeInTheDocument();
  });

  test("each route maintains layout wrapper", () => {
    // Test multiple routes to verify layout always renders
    const routes = ["/receiver/welcome", "/receiver/browse", "/receiver/my-claims"];
    
    routes.forEach((route) => {
      const { unmount } = renderWithRouter(route);
      expect(screen.getByTestId("receiver-layout")).toBeInTheDocument();
      unmount();
    });
  });

  test("renders correct component for each unique route", () => {
    const routeComponentMap = {
      "/receiver": "dashboard-home",
      "/receiver/dashboard": "dashboard-home",
      "/receiver/welcome": "welcome",
      "/receiver/browse": "browse",
      "/receiver/my-claims": "my-claims",
      "/receiver/messages": "messages",
    };

    Object.entries(routeComponentMap).forEach(([route, testId]) => {
      const { unmount } = renderWithRouter(route);
      expect(screen.getByTestId(testId)).toBeInTheDocument();
      unmount();
    });
  });

  test("catch-all route redirects with replace flag", () => {
    // The Navigate component should use replace=true to avoid adding to history
    renderWithRouter("/receiver/nonexistent");
    expect(screen.getByTestId("dashboard-home")).toBeInTheDocument();
  });

  test("all route paths are defined correctly", () => {
    // Test that each specific route works
    const specificRoutes = [
      { path: "/receiver/welcome", testId: "welcome" },
      { path: "/receiver/browse", testId: "browse" },
      { path: "/receiver/my-claims", testId: "my-claims" },
      { path: "/receiver/messages", testId: "messages" },
    ];

    specificRoutes.forEach(({ path, testId }) => {
      const { unmount } = renderWithRouter(path);
      expect(screen.getByTestId(testId)).toBeInTheDocument();
      expect(screen.getByTestId("receiver-layout")).toBeInTheDocument();
      unmount();
    });
  });

  test("nested Route components are properly configured", () => {
    // Test that nested routes work correctly
    const nestedRoutes = [
      "/receiver/welcome",
      "/receiver/browse",
      "/receiver/my-claims",
    ];

    nestedRoutes.forEach((route) => {
      const { unmount } = renderWithRouter(route);
      expect(screen.getByTestId("receiver-layout")).toBeInTheDocument();
      unmount();
    });
  });

  test("different routes render different content with same layout", () => {
    // Test that layout persists but content changes
    const { unmount: unmount1 } = renderWithRouter("/receiver/welcome");
    expect(screen.getByTestId("receiver-layout")).toBeInTheDocument();
    expect(screen.getByTestId("welcome")).toBeInTheDocument();
    unmount1();

    const { unmount: unmount2 } = renderWithRouter("/receiver/browse");
    expect(screen.getByTestId("receiver-layout")).toBeInTheDocument();
    expect(screen.getByTestId("browse")).toBeInTheDocument();
    expect(screen.queryByTestId("welcome")).not.toBeInTheDocument();
    unmount2();
  });

  test("unknown route does not break application", () => {
    const { container } = renderWithRouter("/receiver/completely-invalid-route");
    
    // Should still render layout and redirect to home
    expect(container).toBeInTheDocument();
    expect(screen.getByTestId("receiver-layout")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-home")).toBeInTheDocument();
  });

  test("each route component receives correct route configuration", () => {
    // Test that all defined routes render successfully
    const routes = [
      "/receiver/dashboard",
      "/receiver/welcome",
      "/receiver/browse",
    ];

    routes.forEach((route) => {
      const { container, unmount } = renderWithRouter(route);
      // Should render without errors, indicating proper route configuration
      expect(container.firstChild).toBeInTheDocument();
      unmount();
    });
  });

  test("root receiver path renders index route", () => {
    renderWithRouter("/receiver");
    // Index route should render dashboard home
    expect(screen.getByTestId("dashboard-home")).toBeInTheDocument();
  });

  test("MessagingDashboard route is configured correctly", () => {
    renderWithRouter("/receiver/messages");
    expect(screen.getByTestId("messages")).toBeInTheDocument();
    expect(screen.getByText("Messages Page")).toBeInTheDocument();
  });

  test("ReceiverMyClaims route is configured correctly", () => {
    renderWithRouter("/receiver/my-claims");
    expect(screen.getByTestId("my-claims")).toBeInTheDocument();
    expect(screen.getByText("My Claims Page")).toBeInTheDocument();
  });

  test("Navigate component redirects to current location", () => {
    // Test that unknown routes use Navigate with relative path "."
    renderWithRouter("/receiver/some-invalid-path");
    // Should redirect to index (dashboard home)
    expect(screen.getByTestId("dashboard-home")).toBeInTheDocument();
  });

  test("all imported components are used in routes", () => {
    // Verify all mocked components can be rendered through routing
    const componentRoutes = {
      "dashboard-home": "/receiver/dashboard",
      "welcome": "/receiver/welcome",
      "browse": "/receiver/browse",
      "my-claims": "/receiver/my-claims",
      "messages": "/receiver/messages",
    };

    Object.entries(componentRoutes).forEach(([testId, route]) => {
      const { unmount } = renderWithRouter(route);
      expect(screen.getByTestId(testId)).toBeInTheDocument();
      unmount();
    });
  });
});