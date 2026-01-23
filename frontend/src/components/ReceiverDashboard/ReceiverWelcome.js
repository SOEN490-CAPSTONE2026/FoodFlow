import React, { useEffect, useRef } from 'react';
import './Receiver_Styles/ReceiverWelcome.css';

export default function ReceiverWelcome() {
  const headerRef = useRef(null);
  const noticeRef = useRef(null);
  const sectionRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    [headerRef.current, noticeRef.current, ...sectionRefs.current].forEach(
      el => {
        if (el) {
          observer.observe(el);
        }
      }
    );

    return () => observer.disconnect();
  }, []);

  const addToRefs = el => {
    if (el && !sectionRefs.current.includes(el)) {
      sectionRefs.current.push(el);
    }
  };

  return (
    <div className="receiver-welcome">
      {/* Header */}
      <div ref={headerRef} className="rw-header animate-on-scroll">
        <h1>Find Food Near You</h1>
        <p>
          We help organizations connect with available food—quickly and
          reliably. Start with the map to see nearby donations and request what
          you need today.
        </p>
      </div>

      {/* Notice */}
      <div ref={noticeRef} className="rw-notice animate-on-scroll">
        <p>Tip: Set your pickup hours and capacity to get matched faster.</p>
      </div>

      {/* Content */}
      <div className="rw-content">
        <div ref={addToRefs} className="rw-section animate-on-scroll">
          <div className="rw-icon">🗺️</div>
          <h2>Search the map</h2>
          <p>
            Browse current listings and filter by category or expiry to quickly
            find the items your organization needs.
          </p>

          <a href="/receiver/search#org-search" className="rw-btn primary">
            Open map & search
          </a>
        </div>

        <div ref={addToRefs} className="rw-section animate-on-scroll">
          <div className="rw-icon">📩</div>
          <h2>Need assistance?</h2>
          <p>
            Email us at{' '}
            <a href="mailto:foodflow.group@gmail.com">
              foodflow.group@gmail.com
            </a>{' '}
            and we’ll help you coordinate a pickup.
          </p>
          <p className="rw-small">New here? Read common questions.</p>
          <a href="/receiver/faq" className="rw-btn secondary">
            View FAQs
          </a>
        </div>
      </div>
    </div>
  );
}
