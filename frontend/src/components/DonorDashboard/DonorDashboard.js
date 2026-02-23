import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DonorLayout from './DonorLayout';
import DonorWelcome from './DonorWelcome';
import DonorDashboardHome from './DonorDashboardHome';
import DonorListFood from './DonorListFood';
import DonorImpactDashboard from './DonorImpactDashboard';
import DonorAchievements from './DonorAchievements';
import MessagingDashboard from '../MessagingDashboard/MessagingDashboard';
import Settings from '../Settings';
import CalendarSettings from '../CalendarSettings';
import DonorHelp from './DonorHelp';
import AIDonationForm from './AIDonationForm';

export default function DonorDashboard() {
  return (
    <Routes>
      <Route element={<DonorLayout />}>
        <Route index element={<DonorWelcome />} />
        <Route path="dashboard" element={<DonorDashboardHome />} />
        <Route path="list" element={<DonorListFood />} />
        <Route path="ai-donation" element={<AIDonationForm />} />
        <Route path="impact" element={<DonorImpactDashboard />} />
        <Route path="achievements" element={<DonorAchievements />} />
        <Route path="messages" element={<MessagingDashboard />} />
        <Route path="settings" element={<Settings />} />
        <Route path="calendar" element={<CalendarSettings />} />
        <Route path="help" element={<DonorHelp />} />
        {/* anything unknown under /donor -> back to /donor */}
        <Route path="*" element={<Navigate to="." replace />} />
      </Route>
    </Routes>
  );
}
