import React, { useState } from "react";
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
  AlertCircle
} from "lucide-react";
import "./Donor_Styles/DonorHelp.css";

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
      minHeight: 'auto'
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
        fontFamily: 'inherit'
      }}
    >
      <span style={{ 
        color: isOpen ? '#2e7d32' : '#1a1a1a', 
        flex: 1,
        paddingRight: '16px'
      }}>
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
          visibility: 'visible'
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

  const faqs = [
    {
      question: "How do I create a donation?",
      answer: "Navigate to 'Donate Now' from the sidebar, click 'Add Donation', fill in the food details including title, food type, quantity, expiry date, and pickup time slots. Click 'Submit' to publish your donation. Your listing will be visible to verified receivers in your area."
    },
    {
      question: "How does pickup confirmation work?",
      answer: "When a receiver claims your donation and arrives at the pickup location during the scheduled time, you'll need to confirm the handoff. An OTP (One-Time Password) is generated for each claimed donation. The receiver will provide this code - enter it in the app to mark the donation as successfully completed."
    },
    {
      question: "What is an OTP code?",
      answer: "OTP stands for One-Time Password. It's a unique 6-digit code automatically generated when your donation status changes to 'Ready for Pickup'. This code ensures secure verification that the correct receiver has picked up the food. Share this code only with the receiver who claimed your donation."
    },
    {
      question: "Can I edit or delete a donation?",
      answer: "Yes, you can edit or delete donations that haven't been claimed yet. Navigate to 'Donate Now' to view your active listings. Click on a listing to see edit and delete options. Important: Once a donation is claimed by a receiver, it cannot be modified or deleted to ensure commitment to the receiver."
    },
    {
      question: "How do I message a receiver?",
      answer: "Click 'Messages' in the sidebar to access your conversations. You can communicate with receivers who have claimed your donations to coordinate pickup details, clarify food information, or handle any issues. Messages are sent in real-time and you'll receive notifications for new messages."
    },
    {
      question: "What food types can I donate?",
      answer: "FoodFlow supports various food categories: Prepared Food (cooked meals), Packaged Items (canned goods, sealed products), Fruits & Vegetables (fresh produce), Dairy & Cold items (requires refrigeration), Pastry & Bakery (breads, pastries), and Frozen Food. Select all applicable categories when creating your listing for better matching with receivers."
    },
    {
      question: "How do I set pickup time slots?",
      answer: "When creating a donation, you can add multiple pickup time slots to give receivers flexibility. Specify the date, start time, and end time for each slot. Receivers will select one of your available slots when claiming the donation. Make sure the times are when you or your staff will be available to hand over the food."
    },
    {
      question: "What happens if a receiver doesn't show up?",
      answer: "If a receiver fails to pick up the claimed donation within the scheduled time window, you can wait for a reasonable period and then the claim may expire. The donation will become available again for other receivers to claim. You can also contact the receiver through messages to check on their status."
    },
    {
      question: "How is my organization verified?",
      answer: "When you register, your organization details are submitted for verification. Our admin team reviews your business license, address, and other details. You'll see your verification status in your profile. Verified organizations build trust with receivers and may have access to additional features."
    },
    {
      question: "Can I see who claimed my donation?",
      answer: "Yes, once a receiver claims your donation, you can see their organization name and contact information. This helps you prepare for the pickup and coordinate if needed. Receiver organizations are also verified to ensure food goes to legitimate charitable causes."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="donor-help">
      {/* Getting Started Section */}
      <section className="help-section getting-started">
        <div className="section-header">
          <BookOpen size={24} />
          <h2>Getting Started</h2>
        </div>
        <p className="section-intro">
          Welcome to FoodFlow! Follow these steps to start making a difference by donating your surplus food to those in need.
        </p>
        <div className="getting-started-content">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <div className="step-icon">
                <Heart size={20} />
              </div>
              <h4>Create Your First Donation</h4>
              <p>Click "Donate Now" in the sidebar and fill out the donation form with your surplus food details including food type, quantity, and description.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <div className="step-icon">
                <Clock size={20} />
              </div>
              <h4>Set Pickup Times</h4>
              <p>Choose available time slots when receivers can pick up the food from your location. You can add multiple slots for flexibility.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <div className="step-icon">
                <AlertCircle size={20} />
              </div>
              <h4>Wait for Claims</h4>
              <p>Verified receivers will see your donation and can claim it. You'll be notified instantly when someone claims your listing.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <div className="step-icon">
                <Shield size={20} />
              </div>
              <h4>Confirm Pickup with OTP</h4>
              <p>When the receiver arrives during the pickup window, they'll provide an OTP code. Enter it to confirm the successful handoff.</p>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
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
          Can't find what you're looking for? Our support team is here to help you.
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
