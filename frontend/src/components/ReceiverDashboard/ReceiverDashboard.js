// ReceiverDashboard.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ReceiverLayout from "./ReceiverLayout";
import ReceiverDashboardHome from "./ReceiverDashboardHome";
import ReceiverBrowse from "./ReceiverBrowse";
import ReceiverRequests from "./ReceiverRequests";
import ReceiverSearch from "./ReceiverSearch";
import ReceiverWelcome from "./ReceiverWelcome"; 


export default function ReceiverDashboard() {
  return (
    <Routes>
      <Route element={<ReceiverLayout />}>
        {/* Keep Dashboard as the default (index) */}
        <Route index element={<ReceiverDashboardHome />} />
        <Route path="dashboard" element={<ReceiverDashboardHome />} />

        {/* NEW Welcome page */}
        <Route path="welcome" element={<ReceiverWelcome />} /> 

        {/* Other pages */}
        <Route path="browse" element={<ReceiverBrowse />} />
        <Route path="requests" element={<ReceiverRequests />} />
        <Route path="search" element={<ReceiverSearch />} />

       
        <Route path="*" element={<Navigate to="." replace />} />
      </Route>
    </Routes>
  );
}
