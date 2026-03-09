import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Minus,
  HelpCircle,
  BookOpen,
  MessageCircle,
  Phone,
  Mail,
  Heart,
  Clock,
  Shield,
  AlertCircle,
  Search,
  Rocket,
  Users,
} from 'lucide-react';
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

/**
 * Donor Help Page Component
 * Displays getting started guide, FAQs, and contact information for donors
 */
export default function DonorHelp() {
  const [openFAQ, setOpenFAQ] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredFAQs = faqs.filter(
    faq =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="donor-help">
      {/* Hero Section with Search */}
      <div className="help-hero">
        <h1 className="donor-help-title">{t('donorHelp.hero.title')}</h1>
        <p className="help-subtitle">{t('donorHelp.hero.subtitle')}</p>
        <div className="search-container">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder={t('donorHelp.hero.searchPlaceholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

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
          {(searchQuery ? filteredFAQs : faqs).map((faq, index) => (
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
              <p>support@foodflow.com</p>
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
