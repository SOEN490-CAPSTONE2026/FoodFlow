import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminAnalytics from "../AdminAnalytics"; 

test("renders Analytics heading", () => {
  render(<AdminAnalytics />);
  expect(screen.getByRole("heading", { name: /analytics/i })).toBeInTheDocument();
});
