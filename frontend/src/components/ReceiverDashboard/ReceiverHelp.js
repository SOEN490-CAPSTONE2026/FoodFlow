import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Minus,
  BookOpen,
  Phone,
  Mail,
  Search,
  Clock,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { useOnboarding } from '../../contexts/OnboardingContext';
import '../DonorDashboard/Donor_Styles/DonorHelp.css';

/**
 * Reusable FAQ Item component with expand/collapse functionality
 */
const FAQItem = ({ question, answer, isOpen, onClick }) => (
  <div data-no-animate="true" className={`faq-item ${isOpen ? 'open' : ''}`}>
    <button
      className="faq-question"
      onClick={onClick}
      aria-expanded={isOpen}
      aria-controls={`faq-answer-${question.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <span>{question}</span>
      {isOpen ? (
        <Minus size={20} style={{ color: '#1b4965', flexShrink: 0 }} />
      ) : (
        <Plus size={20} style={{ color: '#9ca3af', flexShrink: 0 }} />
      )}
    </button>
    {isOpen && (
      <div
        className="faq-answer"
        id={`faq-answer-${question.replace(/\s+/g, '-').toLowerCase()}`}
        role="region"
      >
        {answer}
      </div>
    )}
  </div>
);

FAQItem.propTypes = {
  question: PropTypes.string.isRequired,
  answer: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

/**
 * Receiver Help Page Component
 * Displays getting started guide, FAQs, and contact information for receivers
 */
export default function ReceiverHelp() {
  const [openFAQ, setOpenFAQ] = useState(null);
  const { t } = useTranslation();
  const {
    canReplayReceiverTutorial,
    startReceiverTutorial,
    isReceiverTutorialActive,
  } = useOnboarding();

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
      icon: <Search size={24} />,
    },
    {
      key: 'step2',
      icon: <Clock size={24} />,
    },
    {
      key: 'step3',
      icon: <CheckCircle size={24} />,
    },
  ];

  const toggleFAQ = index => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="receiver-help">
      {canReplayReceiverTutorial && (
        <section
          className="help-section tutorial-section"
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '1.5rem 2rem',
            margin: '0 auto 1.5rem',
            width: '100%',
            maxWidth: 'calc(1200px + 4rem)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e8e8e8',
          }}
        >
          <div className="section-header">
            <h2
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                margin: 0,
              }}
            >
              <Sparkles size={24} />
              {t('onboarding.help.title')}
            </h2>
          </div>
          <p className="section-intro">{t('onboarding.help.receiverIntro')}</p>
          <button
            type="button"
            className="tutorial-replay-button"
            data-tour="receiver-replay-tutorial"
            onClick={startReceiverTutorial}
            disabled={isReceiverTutorialActive}
          >
            <Sparkles size={18} />
            <span>{t('onboarding.help.replayButton')}</span>
          </button>
        </section>
      )}

      <section className="help-section getting-started">
        <div className="section-header">
          <h2
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              margin: 0,
            }}
          >
            <BookOpen size={24} />
            {t('receiverHelp.gettingStarted.title')}
          </h2>
        </div>
        <p className="section-intro">
          {t('receiverHelp.gettingStarted.intro')}
        </p>
      </section>

      <div className="category-cards">
        {steps.map(step => (
          <div className="category-card" key={step.key}>
            <div className="category-header">
              <div className="category-icon">{step.icon}</div>
              <h3 className="category-title">
                {t(`receiverHelp.gettingStarted.steps.${step.key}.title`)}
              </h3>
            </div>
            <p className="category-description">
              {t(`receiverHelp.gettingStarted.steps.${step.key}.description`)}
            </p>
          </div>
        ))}
      </div>

      <section className="faq-section">
        <div className="faq-header">
          <h2 className="faq-heading">{t('receiverHelp.faq.title')}</h2>
          <p className="faq-subtitle">{t('receiverHelp.faq.subtitle')}</p>
        </div>
        <div className="faq-list">
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

      <section className="help-contact-section">
        <div className="donor-contact-header">
          <h2 className="donor-contact-heading">
            {t('receiverHelp.contact.title')}
          </h2>
          <p className="donor-contact-subtitle">
            {t('receiverHelp.contact.subtitle')}
          </p>
        </div>
        <div className="donor-contact-options">
          <a
            href="mailto:foodflow.group@gmail.com"
            className="donor-contact-card"
          >
            <div className="donor-contact-icon">
              <Mail size={24} />
            </div>
            <div className="donor-contact-info">
              <h4>{t('receiverHelp.support.emailLabel')}</h4>
              <p>foodflow.group@gmail.com</p>
              <span className="response-time">
                {t('receiverHelp.support.emailResponseTime')}
              </span>
            </div>
          </a>
          <a href="tel:1-800-FOODFLOW" className="donor-contact-card">
            <div className="donor-contact-icon">
              <Phone size={24} />
            </div>
            <div className="donor-contact-info">
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
