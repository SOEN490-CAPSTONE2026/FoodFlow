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
  Search,
  Clock,
  CheckCircle,
  Settings,
} from 'lucide-react';
import './Receiver_Styles/ReceiverHelp.css';

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
        backgroundColor: isOpen ? '#e0f2fe' : '#ffffff',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        color: isOpen ? '#1B4965' : '#1a1a1a',
        fontSize: '16px',
        fontWeight: '600',
        fontFamily: 'inherit',
      }}
    >
      <span
        style={{
          color: isOpen ? '#1B4965' : '#1a1a1a',
          flex: 1,
          paddingRight: '16px',
        }}
      >
        {question}
      </span>
      {isOpen ? (
        <ChevronUp size={24} style={{ color: '#62B6CB', flexShrink: 0 }} />
      ) : (
        <ChevronDown size={24} style={{ color: '#62B6CB', flexShrink: 0 }} />
      )}
    </button>
    {isOpen && (
      <div
        className="faq-answer"
        id={`faq-answer-${question.replace(/\s+/g, '-').toLowerCase()}`}
        role="region"
        style={{
          padding: '16px 20px',
          backgroundColor: '#f8fafc',
          color: '#333333',
          fontSize: '15px',
          lineHeight: '1.8',
          borderTop: '1px solid #e0f2fe',
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
 * Receiver Help Page Component
 * Displays getting started guide, FAQs, and contact information for receivers
 */
export default function ReceiverHelp() {
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
    question: t(`receiverHelp.faq.items.${key}.question`),
    answer: t(`receiverHelp.faq.items.${key}.answer`),
  }));

  const steps = [
    {
      key: 'step1',
      icon: <Search size={20} />,
    },
    {
      key: 'step2',
      icon: <Clock size={20} />,
    },
    {
      key: 'step3',
      icon: <CheckCircle size={20} />,
    },
    {
      key: 'step4',
      icon: <Settings size={20} />,
    },
  ];

  const toggleFAQ = index => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="receiver-help">
      <section className="help-section getting-started">
        <div className="section-header">
          <BookOpen size={24} />
          <h2>{t('receiverHelp.gettingStarted.title')}</h2>
        </div>
        <p className="section-intro">
          {t('receiverHelp.gettingStarted.intro')}
        </p>
        <div className="getting-started-content">
          {steps.map((step, index) => (
            <div className="step" key={step.key}>
              <div className="step-number">{index + 1}</div>
              <div className="step-content">
                <div className="step-icon">{step.icon}</div>
                <h4>
                  {t(`receiverHelp.gettingStarted.steps.${step.key}.title`)}
                </h4>
                <p>
                  {t(
                    `receiverHelp.gettingStarted.steps.${step.key}.description`
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="help-section faq-section">
        <div className="section-header">
          <HelpCircle size={24} />
          <h2>{t('receiverHelp.faq.title')}</h2>
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
          <h2>{t('receiverHelp.support.title')}</h2>
        </div>
        <p className="section-intro">{t('receiverHelp.support.intro')}</p>
        <div className="contact-options">
          <a href="mailto:support@foodflow.com" className="contact-card">
            <div className="contact-icon">
              <Mail size={24} />
            </div>
            <div className="contact-info">
              <h4>{t('receiverHelp.support.emailLabel')}</h4>
              <p>support@foodflow.com</p>
              <span className="response-time">
                {t('receiverHelp.support.emailResponseTime')}
              </span>
            </div>
          </a>
          <a href="tel:1-800-FOODFLOW" className="contact-card">
            <div className="contact-icon">
              <Phone size={24} />
            </div>
            <div className="contact-info">
              <h4>{t('receiverHelp.support.phoneLabel')}</h4>
              <p>1-800-FOODFLOW</p>
              <span className="response-time">
                {t('receiverHelp.support.phoneAvailability')}
              </span>
            </div>
          </a>
        </div>
      </section>
    </div>
  );
}
