import React, { useState } from 'react';
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

  const faqs = [
    {
      question: 'How do I claim a donation?',
      answer:
        "Browse available donations on the main page. When you find a listing you want, click 'Claim' on the donation card. Select a pickup time slot from the available options provided by the donor. Once confirmed, the donation is reserved for your organization. You'll receive notifications about the pickup status.",
    },
    {
      question: 'How do I confirm pickup?',
      answer:
        "When you arrive at the donor's location during your scheduled pickup time, you'll need to provide an OTP (One-Time Password) code to the donor. This code is visible in your 'My Claims' section under the donation details. The donor enters this code to confirm the successful handoff, completing the transaction.",
    },
    {
      question: 'What is the OTP code?',
      answer:
        "The OTP (One-Time Password) is a unique 6-digit verification code assigned to each claimed donation. It appears in your claim details once the donation status changes to 'Ready for Pickup'. You'll need to show or tell this code to the donor when collecting the food. This ensures secure verification of the pickup.",
    },
    {
      question: 'What are food preferences?',
      answer:
        "Food preferences allow you to customize what types of donations you're interested in receiving. You can set preferences for food categories (prepared food, produce, dairy, etc.), donation sizes (small, medium, large), and dietary requirements (vegetarian, halal, kosher, etc.). Donors may be able to see your preferences to better match donations to your needs.",
    },
    {
      question: 'How do I set my food preferences?',
      answer:
        "Click on your profile avatar in the top right corner and select 'Preferences' from the dropdown menu. You can select your preferred food types, specify dietary restrictions, set your pickup capacity, and indicate your operating hours. These preferences help match you with suitable donations.",
    },
    {
      question: 'How do I message a donor?',
      answer:
        "Click 'Messages' in the navigation bar to access your conversations. You can send messages to donors whose donations you've claimed to coordinate pickup details, ask questions about the food, or handle any issues. Messages are delivered in real-time and you'll receive notifications for new messages.",
    },
    {
      question: 'What do the donation statuses mean?',
      answer:
        "Donations go through several statuses: 'Available' means the food is open for claims. 'Claimed' means someone has reserved it. 'Ready for Pickup' indicates it's time to collect the food - you'll see your OTP code at this stage. 'Completed' means the pickup was successful. 'Cancelled' means the claim was cancelled.",
    },
    {
      question: 'Can I cancel a claim?',
      answer:
        "Yes, you can cancel a claim that hasn't been picked up yet. Go to 'My Claims', find the donation, and click the cancel option. Please try to cancel as early as possible so the food can be made available to other receivers. Frequent cancellations may affect your organization's reputation on the platform.",
    },
    {
      question: 'How do I find donations near me?',
      answer:
        "The Donations page shows available food listings in your area. You can browse all listings or use the filters to narrow down by food type, distance, or pickup time. The map view helps you visualize locations. Your organization's registered address is used to calculate distances to donations.",
    },
    {
      question: 'How is my organization verified?',
      answer:
        "When you register, your organization details are submitted for verification. Our admin team reviews your charitable status, registration documents, and contact information. You'll see your verification status in your profile. Some features may be limited until verification is complete.",
    },
  ];

  const toggleFAQ = index => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="receiver-help">
      {/* Getting Started Section */}
      <section className="help-section getting-started">
        <div className="section-header">
          <BookOpen size={24} />
          <h2>Getting Started</h2>
        </div>
        <p className="section-intro">
          Welcome to FoodFlow! As a receiver, you can claim surplus food
          donations from local businesses and organizations. Here's how to get
          started.
        </p>
        <div className="getting-started-content">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <div className="step-icon">
                <Search size={20} />
              </div>
              <h4>Browse Available Donations</h4>
              <p>
                Explore the Donations page to find surplus food listings near
                you. Use filters to find food that matches your organization's
                needs.
              </p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <div className="step-icon">
                <Clock size={20} />
              </div>
              <h4>Claim & Schedule Pickup</h4>
              <p>
                Click 'Claim' on a donation and select a pickup time from the
                available slots. The donation will be reserved for your
                organization.
              </p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <div className="step-icon">
                <CheckCircle size={20} />
              </div>
              <h4>Pickup with OTP</h4>
              <p>
                Arrive at the scheduled time and provide your OTP code to the
                donor. They'll confirm the handoff, completing the donation
                process.
              </p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <div className="step-icon">
                <Settings size={20} />
              </div>
              <h4>Set Your Preferences</h4>
              <p>
                Update your food preferences in your profile to get better
                matches and help donors understand your organization's needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="help-section faq-section">
        <div className="section-header">
          <HelpCircle size={24} />
          <h2>Frequently Asked Questions</h2>
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

      {/* Contact Support Section */}
      <section className="help-section contact-section">
        <div className="section-header">
          <MessageCircle size={24} />
          <h2>Need More Help?</h2>
        </div>
        <p className="section-intro">
          Can't find what you're looking for? Our support team is here to help
          you.
        </p>
        <div className="contact-options">
          <a href="mailto:support@foodflow.com" className="contact-card">
            <div className="contact-icon">
              <Mail size={24} />
            </div>
            <div className="contact-info">
              <h4>Email Support</h4>
              <p>support@foodflow.com</p>
              <span className="response-time">Response within 24 hours</span>
            </div>
          </a>
          <a href="tel:1-800-FOODFLOW" className="contact-card">
            <div className="contact-icon">
              <Phone size={24} />
            </div>
            <div className="contact-info">
              <h4>Phone Support</h4>
              <p>1-800-FOODFLOW</p>
              <span className="response-time">Mon-Fri, 9AM-6PM EST</span>
            </div>
          </a>
        </div>
      </section>
    </div>
  );
}
