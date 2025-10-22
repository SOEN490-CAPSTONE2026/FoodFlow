import React, { useEffect, useRef } from "react";
import "./Donor_Styles/DonorWelcome.css";

export default function DonorWelcome() {
  const headerRef = useRef(null);
  const noticeRef = useRef(null);
  const sectionRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
          }
        });
      },
      { threshold: 0.1 }
    );

    [headerRef.current, noticeRef.current, ...sectionRefs.current].forEach(
      (el) => {
        if (el) observer.observe(el);
      }
    );

    return () => observer.disconnect();
  }, []);

  const addToRefs = (el) => {
    if (el && !sectionRefs.current.includes(el)) {
      sectionRefs.current.push(el);
    }
  };

  return (
    <div className="donate-page">
      {/* Main header with animation */}
      <div ref={headerRef} className="donate-header animate-on-scroll">
        <h1>Donate Food Now</h1>
        <p>
          Every gift makes a difference. If you have food to donate, we'll help
          you get it to organizations that can use it today.
        </p>
      </div>

     
      <div ref={noticeRef} className="donate-notice animate-on-scroll">
        <p>Make a change starting today.</p>
      </div>

      {/* Content sections with staggered animation */}
      <div className="donate-content">
        <div ref={addToRefs} className="donate-section animate-on-scroll">
          <div className="section-icon">🗺️</div>
          <h2>Smaller donations</h2>
          <p>
            Are you an individual or a company with a small quantity of food
            (less than a pallet)? Use our interactive map to find the
            organization closest to you.
          </p>

          <a href="/donor/search#org-search" className="donate-btn primary">
            Map of organizations
          </a>
        </div>

        <div ref={addToRefs} className="donate-section animate-on-scroll">
          <div className="section-icon">⏰</div>
          <h2>Need to donate right now?</h2>
          <p>
            You can also make a donation by email at{" "}
            <a href="mailto:foodflow.group@gmail.com">
              foodflow.group@gmail.com
            </a>
            .
          </p>
          <p className="small-text">Questions about your donation?</p>
          <button className="donate-btn secondary">Find answers here</button>
        </div>
      </div>
    </div>
  );
}
