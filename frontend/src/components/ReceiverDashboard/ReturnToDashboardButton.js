import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Receiver_Styles/ReturnToDashboardButton.css";

export default function ReturnToDashboardButton({ onNavigate }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [from, setFrom] = useState(() => location.state?.from || sessionStorage.getItem("returnFrom") || null);

  useEffect(() => {
    if (location.state?.from) {
      sessionStorage.setItem("returnFrom", location.state.from);
      setFrom(location.state.from);
    }
  }, [location.state?.from]);

  const target =
    from === "receiver" ? "/receiver/dashboard" :
    from === "donor"    ? "/donor" :
    from === "admin"    ? "/admin/dashboard" :
    null;

  if (!target) return null;

  const handleClick = () => {
    sessionStorage.removeItem("returnFrom");
    navigate(target);
    if (onNavigate) onNavigate();
  };

  return (
    <button onClick={handleClick} className="return-chip" aria-label="Return to your dashboard">
      <span className="return-chip-avatar" />
      <span className="return-chip-text">
        Back to {from === "receiver" ? "Receiver" : "Donor"} Dashboard
      </span>
    </button>
  );
}