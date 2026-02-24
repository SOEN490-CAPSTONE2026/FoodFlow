// ReceiverDashboard.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ReceiverLayout from './ReceiverLayout';
import ReceiverBrowse from './ReceiverBrowse';
import ReceiverWelcome from './ReceiverWelcome';
import ReceiverMyClaims from './ReceiverMyClaims';
import ReceiverSavedDonations from './ReceiverSavedDonations';
import ReceiverAchievements from './ReceiverAchievements';
import ReceiverImpactDashboard from './ReceiverImpactDashboard';
import ReceiverHelp from './ReceiverHelp';
import MessagingDashboard from '../MessagingDashboard/MessagingDashboard';
import Settings from '../Settings';

export default function ReceiverDashboard() {
  return (
    <Routes>
      <Route element={<ReceiverLayout />}>
        <Route index element={<ReceiverBrowse />} />
        <Route path="welcome" element={<ReceiverWelcome />} />
        <Route path="browse" element={<ReceiverBrowse />} />
        <Route path="saved-donations" element={<ReceiverSavedDonations />} />
        <Route path="my-claims" element={<ReceiverMyClaims />} />
        <Route path="achievements" element={<ReceiverAchievements />} />
        <Route path="impact" element={<ReceiverImpactDashboard />} />
        <Route path="messages" element={<MessagingDashboard />} />
        <Route path="settings" element={<Settings />} />
        <Route path="help" element={<ReceiverHelp />} />

        <Route path="*" element={<Navigate to="." replace />} />
      </Route>
    </Routes>
  );
}
