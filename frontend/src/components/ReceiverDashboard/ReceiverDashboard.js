// ReceiverDashboard.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ReceiverLayout from "./ReceiverLayout";
import ReceiverDashboardHome from "./ReceiverDashboardHome";
import ReceiverBrowse from "./ReceiverBrowse";
import ReceiverRequests from "./ReceiverRequests";
import ReceiverSearch from "./ReceiverSearch";
import ReceiverWelcome from "./ReceiverWelcome";
import ReceiverMyClaims from './ReceiverMyClaims'; 
import Messages from "../Messages";


export default function ReceiverDashboard() {
  return (
    <Routes>
      <Route element={<ReceiverLayout />}>
        
        <Route index element={<ReceiverDashboardHome />} />
        <Route path="dashboard" element={<ReceiverDashboardHome />} />
        <Route path="welcome" element={<ReceiverWelcome />} /> 
        <Route path="browse" element={<ReceiverBrowse />} />
        <Route path="requests" element={<ReceiverRequests />} />
        <Route path="search" element={<ReceiverSearch />} />
        <Route path="my-claims" element={<ReceiverMyClaims />} />
        <Route path="messages" element={<Messages />} />

       
        <Route path="*" element={<Navigate to="." replace />} />
      </Route>
    </Routes>
  );
}
