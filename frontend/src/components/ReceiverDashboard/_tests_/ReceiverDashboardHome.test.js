// import React from "react";
// import { render, screen, within } from "@testing-library/react";
// import "@testing-library/jest-dom";
// import ReceiverDashboardHome from "../ReceiverDashboardHome";

// describe("ReceiverDashboardHome", () => {
//   test("renders empty state when no props provided", () => {
//     render(<ReceiverDashboardHome />);
//     expect(screen.getByRole("heading", { name: /dashboard/i })).toBeInTheDocument();
//     expect(screen.getByText(/no data provided/i)).toBeInTheDocument();
//   });

//   test("renders tiles and charts with provided data (scoped)", () => {
//     const stats = {
//       totalListed: 12,
//       completed: 7,
//       newRequests: 3,
//       rejected: 2,
//       allRequests: 15,
//     };

//     const chartData = {
//       requestStatus: [
//         { status: "Completed", value: 7, color: "#28a745" },
//         { status: "Pending", value: 3, color: "#1b4965" },
//         { status: "Rejected", value: 2, color: "#c1121f" },
//       ],
//       monthlyDonations: [
//         { month: "Jan", value: 5 },
//         { month: "Feb", value: 10 },
//       ],
//       weeklyTrends: [
//         { week: "W1", value: 2 },
//         { week: "W2", value: 4 },
//         { week: "W3", value: 1 },
//       ],
//       foodCategories: [
//         { category: "Fruits", value: 40, color: "#84d2a7" },
//         { category: "Veggies", value: 30, color: "#1b4965" },
//         { category: "Bakery", value: 30, color: "#ffd166" },
//       ],
//     };

//     render(<ReceiverDashboardHome stats={stats} chartData={chartData} />);

//     expect(screen.getByRole("heading", { name: /dashboard/i })).toBeInTheDocument();
//     expect(screen.getByText(/overview of your requests/i)).toBeInTheDocument();

//     const totalTile = screen.getByRole("heading", { name: /total listed food/i }).closest(".tile");
//     expect(within(totalTile).getByText(String(stats.totalListed))).toBeInTheDocument();

//     const completedTile = screen.getByRole("heading", { name: /completed requests/i }).closest(".tile");
//     expect(within(completedTile).getByText(String(stats.completed))).toBeInTheDocument();

//     const pendingTile = screen.getByRole("heading", { name: /pending requests/i }).closest(".tile");
//     expect(within(pendingTile).getByText(String(stats.newRequests))).toBeInTheDocument();

//     const rejectedTile = screen.getByRole("heading", { name: /rejected requests/i }).closest(".tile");
//     expect(within(rejectedTile).getByText(String(stats.rejected))).toBeInTheDocument();

//     const allTile = screen.getByRole("heading", { name: /all requests/i }).closest(".tile");
//     expect(within(allTile).getByText(String(stats.allRequests))).toBeInTheDocument();

//     const barCard = screen.getByRole("heading", { name: /monthly activity/i }).closest(".card");
//     const bars = barCard.querySelectorAll(".css-bar-chart .bar");
//     expect(bars.length).toBe(2);
//     expect(bars[0].getAttribute("style")).toMatch(/height:\s*50%/);
//     expect(bars[1].getAttribute("style")).toMatch(/height:\s*100%/);

//     const statusCard = screen.getByRole("heading", { name: /request status distribution/i }).closest(".card");
//     expect(within(statusCard).getByText(/completed/i)).toBeInTheDocument();
//     expect(within(statusCard).getByText(/pending/i)).toBeInTheDocument();
//     expect(within(statusCard).getByText(/^rejected$/i)).toBeInTheDocument();

//     const lineCard = screen.getByRole("heading", { name: /request trends/i }).closest(".card");
//     const points = lineCard.querySelectorAll(".css-line-chart .line-points .line-point");
//     expect(points.length).toBe(chartData.weeklyTrends.length);
//     expect(within(lineCard).getByText("W1")).toBeInTheDocument();
//     expect(within(lineCard).getByText("W2")).toBeInTheDocument();
//     expect(within(lineCard).getByText("W3")).toBeInTheDocument();

//     const foodCard = screen.getByRole("heading", { name: /food categories/i }).closest(".card");
//     expect(within(foodCard).getByText("100%")).toBeInTheDocument();
//     expect(within(foodCard).getByText(/Fruits \(40%\)/i)).toBeInTheDocument();
//     expect(within(foodCard).getByText(/Veggies \(30%\)/i)).toBeInTheDocument();
//     expect(within(foodCard).getByText(/Bakery \(30%\)/i)).toBeInTheDocument();
//   });
// });
