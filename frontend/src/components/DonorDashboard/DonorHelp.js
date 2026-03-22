import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Minus,
  BookOpen,
  Phone,
  Mail,
  Shield,
  Rocket,
  Users,
  Sparkles,
} from 'lucide-react';
import { useOnboarding } from '../../contexts/OnboardingContext';
import './Donor_Styles/DonorHelp.css';

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
 * Donor Help Page Component
 * Displays getting started guide, FAQs, and contact information for donors
 */
export default function DonorHelp() {
  const [openFAQ, setOpenFAQ] = useState(null);
  const { t } = useTranslation();
  const { canReplayDonorTutorial, startDonorTutorial, isDonorTutorialActive } =
    useOnboarding();

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

  const categories = [
    {
      icon: <Rocket size={24} />,
      title: t('donorHelp.gettingStarted.title'),
      description: t('donorHelp.gettingStarted.intro'),
    },
    {
      icon: <Shield size={24} />,
      title: t('donorHelp.foodSafety.title'),
      description: t('donorHelp.foodSafety.intro'),
    },
    {
      icon: <Users size={24} />,
      title: t('donorHelp.support.title'),
      description: t('donorHelp.support.intro'),
    },
  ];

  const toggleFAQ = index => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="donor-help">
      {canReplayDonorTutorial && (
        <section className="help-section tutorial-section">
          <div className="section-header">
            <Sparkles size={24} />
            <h2>{t('onboarding.help.title')}</h2>
          </div>
          <p className="section-intro">{t('onboarding.help.donorIntro')}</p>
          <button
            type="button"
            className="tutorial-replay-button"
            data-tour="donor-replay-tutorial"
            onClick={startDonorTutorial}
            disabled={isDonorTutorialActive}
          >
            <Sparkles size={18} />
            <span>{t('onboarding.help.replayButton')}</span>
          </button>
        </section>
      )}

      <section className="help-section getting-started">
        <div className="section-header">
          <BookOpen size={24} />
          <h2>{t('donorHelp.gettingStarted.title')}</h2>
        </div>
        <p className="section-intro">{t('donorHelp.gettingStarted.intro')}</p>
      </section>

      {/* Category Cards */}
      <div className="category-cards">
        {categories.map((category, index) => (
          <div className="category-card" key={index}>
            <div className="category-header">
              <div className="category-icon">{category.icon}</div>
              <h3 className="category-title">{category.title}</h3>
            </div>
            <p className="category-description">{category.description}</p>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="faq-header">
          <h2 className="faq-heading">{t('donorHelp.faq.title')}</h2>
          <p className="faq-subtitle">{t('donorHelp.faq.subtitle')}</p>
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

      {/* Contact Support */}
      <section className="help-contact-section">
        <div className="donor-contact-header">
          <h2 className="donor-contact-heading">
            {t('donorHelp.contact.title')}
          </h2>
          <p className="donor-contact-subtitle">
            {t('donorHelp.contact.subtitle')}
          </p>
        </div>
        <div className="donor-contact-options">
          <a href="mailto:support@foodflow.com" className="donor-contact-card">
            <div className="donor-contact-icon">
              <Mail size={24} />
            </div>
            <div className="donor-contact-info">
              <h4>{t('donorHelp.support.emailLabel')}</h4>
              <p>foodflow.group@gmail.com</p>
              <span className="response-time">
                {t('donorHelp.support.emailResponseTime')}
              </span>
            </div>
          </a>
          <a href="tel:1-800-FOODFLOW" className="donor-contact-card">
            <div className="donor-contact-icon">
              <Phone size={24} />
            </div>
            <div className="donor-contact-info">
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
