// ReceiverDashboard.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ReceiverLayout from "./ReceiverLayout";
import ReceiverDashboardHome from "./ReceiverDashboardHome";
import ReceiverBrowse from "./ReceiverBrowse";
import ReceiverRequests from "./ReceiverRequests";
import ReceiverSearch from "./ReceiverSearch";

/** Mount this at /receiver/* */
export default function ReceiverDashboard() {
  return (
    <Routes>
      <Route element={<ReceiverLayout />}>
        {/* Default landing page */}
        <Route index element={<ReceiverDashboardHome />} />
        <Route path="dashboard" element={<ReceiverDashboardHome />} />
        <Route path="browse" element={<ReceiverBrowse />} />
        <Route path="requests" element={<ReceiverRequests />} />
        <Route path="search" element={<ReceiverSearch />} />
        {/* anything unknown under /receiver -> back to /receiver */}
        <Route path="*" element={<Navigate to="." replace />} />
      </Route>
    </Routes>
  );
}
