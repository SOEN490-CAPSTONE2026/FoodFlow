import React from "react";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import DonorDashboardHome from "../DonorDashboardHome";

describe("DonorDashboardHome", () => {
  test("renders empty state when no props provided", () => {
    render(<DonorDashboardHome />);
    expect(screen.getByRole("heading", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/overview of your donations/i)).toBeInTheDocument();
    expect(screen.getByText(/no data provided/i)).toBeInTheDocument();
  });

  test("renders metrics and charts with provided data (scoped queries)", () => {
    const stats = {
      totalListed: 12,
      completed: 7,
      newRequests: 3,
      rejected: 2,
      allRequests: 15,
    };

    const chartData = {
      requestStatus: [
        { status: "Completed", value: 7, color: "#28a745" },
        { status: "Pending", value: 3, color: "#1b4965" },
        { status: "Rejected", value: 2, color: "#c1121f" },
      ],
      monthlyDonations: [
        { month: "Jan", value: 5 },
        { month: "Feb", value: 10 },
      ],
      weeklyTrends: [
        { week: "W1", value: 2 },
        { week: "W2", value: 4 },
        { week: "W3", value: 1 },
      ],
      foodCategories: [
        { category: "Fruits", value: 40, color: "#84d2a7" },
        { category: "Veggies", value: 30, color: "#1b4965" },
        { category: "Bakery", value: 30, color: "#ffd166" },
      ],
    };

    render(<DonorDashboardHome stats={stats} chartData={chartData} />);

    // Header
    expect(screen.getByRole("heading", { name: /dashboard/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/analytics & insights/i)).toBeInTheDocument();

    // Metrics (scoped to avoid collisions with tiles)
    const metricsEl = document.querySelector(".donor-metrics-overview");
    expect(metricsEl).not.toBeNull();

    const totalListedCard = within(metricsEl).getByText(/total listed items/i).closest(".metric-card");
    expect(totalListedCard).not.toBeNull();
    expect(within(totalListedCard).getByText(String(stats.totalListed))).toBeInTheDocument();

    const completedCard = within(metricsEl).getByText(/completed requests/i).closest(".metric-card");
    expect(completedCard).not.toBeNull();
    expect(within(completedCard).getByText(String(stats.completed))).toBeInTheDocument();

    const pendingCard = within(metricsEl).getByText(/pending requests/i).closest(".metric-card");
    expect(pendingCard).not.toBeNull();
    expect(within(pendingCard).getByText(String(stats.newRequests))).toBeInTheDocument();

    const rejectedLabel = within(metricsEl).getByText(/rejected requests/i);
    const rejectedCard = rejectedLabel.closest(".metric-card");
    expect(rejectedCard).not.toBeNull();
    expect(within(rejectedCard).getByText(String(stats.rejected))).toBeInTheDocument();

    // Tiles
    const totalListedTile = screen.getByRole("heading", { name: /total listed food/i }).closest(".donor-tile");
    expect(totalListedTile).not.toBeNull();
    expect(within(totalListedTile).getByText(String(stats.totalListed))).toBeInTheDocument();

    const completedTile = screen
      .getByRole("heading", { name: /take away \/ request completed/i })
      .closest(".donor-tile");
    expect(completedTile).not.toBeNull();
    expect(within(completedTile).getByText(String(stats.completed))).toBeInTheDocument();

    const rejectedTile = screen.getByRole("heading", { name: /^rejected requests$/i }).closest(".donor-tile");
    expect(rejectedTile).not.toBeNull();
    expect(within(rejectedTile).getByText(String(stats.rejected))).toBeInTheDocument();

    const allRequestsTile = screen.getByRole("heading", { name: /all requests/i }).closest(".donor-tile");
    expect(allRequestsTile).not.toBeNull();
    expect(within(allRequestsTile).getByText(String(stats.allRequests))).toBeInTheDocument();

    const newRequestsTile = screen.getByRole("heading", { name: /new requests/i }).closest(".donor-tile");
    expect(newRequestsTile).not.toBeNull();
    expect(within(newRequestsTile).getByText(String(stats.newRequests))).toBeInTheDocument();

    // Bar chart heights
    const bars = document.querySelectorAll(".css-bar-chart .bar");
    expect(bars.length).toBe(2);
    expect(bars[0].getAttribute("style")).toMatch(/height:\s*50%/);
    expect(bars[1].getAttribute("style")).toMatch(/height:\s*100%/);

    // Doughnut legends — scope to the "Request Status Distribution" card to avoid collisions
    const statusCard = screen
      .getByRole("heading", { name: /request status distribution/i })
      .closest(".donor-chart-card");
    expect(statusCard).not.toBeNull();

    expect(within(statusCard).getByText(/^Completed$/i)).toBeInTheDocument();
    expect(within(statusCard).getByText(/^Pending$/i)).toBeInTheDocument();
    expect(within(statusCard).getByText(/^Rejected$/i)).toBeInTheDocument();

    // Line chart points + labels
    const points = document.querySelectorAll(".css-line-chart .line-points .line-point");
    expect(points.length).toBe(chartData.weeklyTrends.length);
    expect(screen.getByText("W1")).toBeInTheDocument();
    expect(screen.getByText("W2")).toBeInTheDocument();
    expect(screen.getByText("W3")).toBeInTheDocument();

    // Food categories doughnut
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText(/Fruits \(40%\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Veggies \(30%\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Bakery \(30%\)/i)).toBeInTheDocument();
  });
});
