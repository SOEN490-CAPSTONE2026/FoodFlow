// ReceiverDashboard.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ReceiverLayout from './ReceiverLayout';
import ReceiverBrowse from './ReceiverBrowse';
import ReceiverWelcome from './ReceiverWelcome';
import ReceiverMyClaims from './ReceiverMyClaims';
import MessagingDashboard from '../MessagingDashboard/MessagingDashboard';
import Settings from '../Settings';

export default function ReceiverDashboard() {
  return (
    <Routes>
      <Route element={<ReceiverLayout />}>
        <Route index element={<ReceiverBrowse />} />
        <Route path="welcome" element={<ReceiverWelcome />} />
        <Route path="browse" element={<ReceiverBrowse />} />
        <Route path="my-claims" element={<ReceiverMyClaims />} />
        <Route path="messages" element={<MessagingDashboard />} />
        <Route path="settings" element={<Settings />} />

        <Route path="*" element={<Navigate to="." replace />} />
      </Route>
    </Routes>
  );
}
