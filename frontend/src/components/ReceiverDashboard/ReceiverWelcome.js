import React, { useEffect, useRef } from "react";
import { useTranslation } from 'react-i18next';
import "./Receiver_Styles/ReceiverWelcome.css";


export default function ReceiverWelcome() {
  const { t } = useTranslation();
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
        <h1>{t('receiverWelcome.title')}</h1>
        <p>
          {t('receiverWelcome.subtitle')}
        </p>
      </div>

      {/* Notice */}
      <div ref={noticeRef} className="rw-notice animate-on-scroll">
        <p>{t('receiverWelcome.tip')}</p>
      </div>

      {/* Content */}
      <div className="rw-content">
        <div ref={addToRefs} className="rw-section animate-on-scroll">
          <div className="rw-icon">🗺️</div>
          <h2>{t('receiverWelcome.searchMap.title')}</h2>
          <p>
            {t('receiverWelcome.searchMap.description')}
          </p>

          <a href="/receiver/search#org-search" className="rw-btn primary">
            {t('receiverWelcome.searchMap.button')}
          </a>
        </div>

        <div ref={addToRefs} className="rw-section animate-on-scroll">
          <div className="rw-icon">📩</div>
          <h2>{t('receiverWelcome.needAssistance.title')}</h2>
          <p>
            {t('receiverWelcome.needAssistance.description').replace('{{email}}', '')}{' '}
            <a href="mailto:foodflow.group@gmail.com">foodflow.group@gmail.com</a>
            {' '}and we'll help you coordinate a pickup.
          </p>
          <p className="rw-small">{t('receiverWelcome.needAssistance.newHere')}</p>
          <a href="/receiver/faq" className="rw-btn secondary">{t('receiverWelcome.needAssistance.button')}</a>
        </div>
      </div>
    </div>
  );
}
