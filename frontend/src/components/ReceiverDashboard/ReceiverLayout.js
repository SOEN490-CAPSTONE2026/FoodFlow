import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import "../DonorDashboard/Dashboards.css";
import brand from "../../assets/Logo_light_background.png"; // your logo

export default function ReceiverLayout(){
  return (
    <div className="ff-shell">
      {/* Sidebar */}
      <aside className="ff-side">
        <div className="brand">
          <img src={brand} alt="FoodFlow" />
          <span>RECEIVER</span>
        </div>

        <nav className="ff-nav">
          <NavLink end to="/receiver" className={({isActive})=>`ff-link ${isActive?'active':''}`}>Dashboard</NavLink>
          <NavLink to="/receiver/browse" className={({isActive})=>`ff-link ${isActive?'active':''}`}>Find Food</NavLink>
          <NavLink to="/receiver/requests" className={({isActive})=>`ff-link ${isActive?'active':''}`}>My Requests</NavLink>
          <NavLink to="/receiver/search" className={({isActive})=>`ff-link ${isActive?'active':''}`}>Search</NavLink>
        </nav>
      </aside>

      {/* Main */}
      <div>
        <header className="ff-topbar">
          <strong>FoodFlow</strong>
          <div className="spacer" />
          <span className="ff-dot" title="Notifications" />
          <span style={{fontWeight:700}}>Jane Smith</span>
          <span className="ff-avatar" />
        </header>

        <main className="ff-wrap">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
