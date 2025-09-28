// DonorDashboard.jsx (unchanged)
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DonorLayout from "./DonorLayout";
import DonorWelcome from "./DonorWelcome";
import DonorDashboardHome from "./DonorDashboardHome";
import DonorListFood from "./DonorListFood";
import DonorRequests from "./DonorRequests";
import DonorSearch from "./DonorSearch";

/** Mount this at /donor/* */
export default function DonorDashboard() {
  return (
    <Routes>
      <Route element={<DonorLayout />}>
        <Route index element={<DonorWelcome />} />
        <Route path="dashboard" element={<DonorDashboardHome />} />
        <Route path="list" element={<DonorListFood />} />
        <Route path="requests" element={<DonorRequests />} />
        <Route path="search" element={<DonorSearch />} />
        {/* anything unknown under /donor -> back to /donor */}
        <Route path="*" element={<Navigate to="." replace />} />
      </Route>
    </Routes>
  );
}