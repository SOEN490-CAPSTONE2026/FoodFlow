import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import AdminHome from "./AdminHome";
import AdminAnalytics from "./AdminAnalytics";
import AdminCalendar from "./AdminCalendar";
import AdminMessages from "./AdminMessages.js";
import AdminHelp from "./AdminHelp";


export default function AdminDashboard() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminHome />} />
        <Route path="dashboard" element={<AdminHome />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="calendar" element={<AdminCalendar />} />
        <Route path="messages" element={<AdminMessages />} />
        <Route path="help" element={<AdminHelp />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Route>
    </Routes>
  );
}
