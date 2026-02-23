import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  BookOpen,
  MessageCircle,
  Phone,
  Mail,
  Heart,
  Clock,
  Shield,
  AlertCircle,
} from 'lucide-react';
import './Donor_Styles/DonorHelp.css';

/**
 * Reusable FAQ Item component with expand/collapse functionality
 */
const FAQItem = ({ question, answer, isOpen, onClick }) => (
  <div
    data-no-animate="true"
    style={{
      border: '2px solid #e5e7eb',
      borderRadius: '10px',
      marginBottom: '12px',
      backgroundColor: '#ffffff',
      overflow: 'visible',
      opacity: 1,
      transform: 'none',
      animation: 'none',
      transition: 'none',
      visibility: 'visible',
      position: 'relative',
      zIndex: 1,
      height: 'auto',
      maxHeight: 'none',
      minHeight: 'auto',
    }}
  >
    <button
      className="faq-question"
      onClick={onClick}
      aria-expanded={isOpen}
      aria-controls={`faq-answer-${question.replace(/\s+/g, '-').toLowerCase()}`}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        backgroundColor: isOpen ? '#e8f5e9' : '#ffffff',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        color: isOpen ? '#2e7d32' : '#1a1a1a',
        fontSize: '16px',
        fontWeight: '600',
        fontFamily: 'inherit',
      }}
    >
      <span
        style={{
          color: isOpen ? '#2e7d32' : '#1a1a1a',
          flex: 1,
          paddingRight: '16px',
        }}
      >
        {question}
      </span>
      {isOpen ? (
        <ChevronUp size={24} style={{ color: '#4caf50', flexShrink: 0 }} />
      ) : (
        <ChevronDown size={24} style={{ color: '#4caf50', flexShrink: 0 }} />
      )}
    </button>
    {isOpen && (
      <div
        className="faq-answer"
        id={`faq-answer-${question.replace(/\s+/g, '-').toLowerCase()}`}
        role="region"
        style={{
          padding: '16px 20px',
          backgroundColor: '#f9fffe',
          color: '#333333',
          fontSize: '15px',
          lineHeight: '1.8',
          borderTop: '1px solid #e8f5e9',
          overflow: 'visible',
          height: 'auto',
          maxHeight: 'none',
          minHeight: 'auto',
          display: 'block',
          opacity: 1,
          visibility: 'visible',
        }}
      >
        {answer}
      </div>
    )}
  </div>
);

/**
 * Donor Help Page Component
 * Displays getting started guide, FAQs, and contact information for donors
 */
export default function DonorHelp() {
  const [openFAQ, setOpenFAQ] = useState(null);
  const { t } = useTranslation();

  const faqs = [
    'q1',
    'q2',
    'q3',
    'q4',
    'q5',
    'q6',
    'q7',
    'q8',
    'q9',
    'q10',
  ].map(key => ({
    question: t(`donorHelp.faq.items.${key}.question`),
    answer: t(`donorHelp.faq.items.${key}.answer`),
  }));

  const steps = [
    {
      key: 'step1',
      icon: <Heart size={20} />,
    },
    {
      key: 'step2',
      icon: <Clock size={20} />,
    },
    {
      key: 'step3',
      icon: <AlertCircle size={20} />,
    },
    {
      key: 'step4',
      icon: <Shield size={20} />,
    },
  ];

  const toggleFAQ = index => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="donor-help">
      <section className="help-section getting-started">
        <div className="section-header">
          <BookOpen size={24} />
          <h2>{t('donorHelp.gettingStarted.title')}</h2>
        </div>
        <p className="section-intro">{t('donorHelp.gettingStarted.intro')}</p>
        <div className="getting-started-content">
          {steps.map((step, index) => (
            <div className="step" key={step.key}>
              <div className="step-number">{index + 1}</div>
              <div className="step-content">
                <div className="step-icon">{step.icon}</div>
                <h4>{t(`donorHelp.gettingStarted.steps.${step.key}.title`)}</h4>
                <p>
                  {t(`donorHelp.gettingStarted.steps.${step.key}.description`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="help-section faq-section">
        <div className="section-header">
          <HelpCircle size={24} />
          <h2>{t('donorHelp.faq.title')}</h2>
        </div>
        <div
          role="list"
          style={{ display: 'flex', flexDirection: 'column', gap: '0' }}
        >
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openFAQ === index}
              onClick={() => toggleFAQ(index)}
            />
          ))}
        </div>
      </section>

      <section className="help-section contact-section">
        <div className="section-header">
          <MessageCircle size={24} />
          <h2>{t('donorHelp.support.title')}</h2>
        </div>
        <p className="section-intro">{t('donorHelp.support.intro')}</p>
        <div className="contact-options">
          <a href="mailto:support@foodflow.com" className="contact-card">
            <div className="contact-icon">
              <Mail size={24} />
            </div>
            <div className="contact-info">
              <h4>{t('donorHelp.support.emailLabel')}</h4>
              <p>support@foodflow.com</p>
              <span className="response-time">
                {t('donorHelp.support.emailResponseTime')}
              </span>
            </div>
          </a>
          <a href="tel:1-800-FOODFLOW" className="contact-card">
            <div className="contact-icon">
              <Phone size={24} />
            </div>
            <div className="contact-info">
              <h4>{t('donorHelp.support.phoneLabel')}</h4>
              <p>1-800-FOODFLOW</p>
              <span className="response-time">
                {t('donorHelp.support.phoneAvailability')}
              </span>
            </div>
          </a>
        </div>
      </section>
    </div>
  );
}
