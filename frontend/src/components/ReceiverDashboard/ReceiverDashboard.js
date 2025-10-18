// ReceiverDashboard.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ReceiverLayout from "./ReceiverLayout";
import ReceiverClaimedDonations from "./ReceiverClaimedDonations";
import ReceiverBrowse from "./ReceiverBrowse";
import ReceiverRequests from "./ReceiverRequests";
import ReceiverSearch from "./ReceiverSearch";
import ReceiverWelcome from "./ReceiverWelcome"; 


export default function ReceiverDashboard() {
  return (
    <Routes>
      <Route element={<ReceiverLayout />}>
        
        <Route index element={<ReceiverClaimedDonations />} />
        <Route path="dashboard" element={<ReceiverClaimedDonations />} />
        <Route path="welcome" element={<ReceiverBrowse />} /> 
        <Route path="browse" element={<ReceiverWelcome />} />
        <Route path="requests" element={<ReceiverRequests />} />
        <Route path="search" element={<ReceiverSearch />} />

       
        <Route path="*" element={<Navigate to="." replace />} />
      </Route>
    </Routes>
  );
}
