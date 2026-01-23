import React, { useState, useEffect, useRef } from 'react';
import { FaPlus, FaMinus } from 'react-icons/fa';
import '../LandingPage/style/FAQ.css';

const FAQ = () => {
  const [activeIndices, setActiveIndices] = useState([]);
  const containerRef = useRef(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const itemRefs = useRef([]);

  const faqData = [
    {
      question: 'How can I use FoodFlow to donate my surplus food?',
      answer:
        'Donating surplus food through FoodFlow is simple! First, create an account on our platform. Once logged in, you can quickly post available surplus food by providing details like food type, quantity, pickup location, and time window. Nearby charities and community organizations will be instantly notified and can claim the donation.',
    },
    {
      question: 'What kind of organizations can receive food through FoodFlow?',
      answer:
        'FoodFlow works with verified charitable organizations including food banks, homeless shelters, community kitchens, schools, and non-profits serving vulnerable populations. All receiving organizations undergo a verification process to ensure they can properly handle and distribute food according to safety standards.',
    },
    {
      question: 'Is there any cost to use FoodFlow?',
      answer:
        "FoodFlow is completely free for both food donors and receiving organizations. Our mission is to reduce food waste and help communities, so we've designed the platform to be accessible to everyone.",
    },
    {
      question: 'How does FoodFlow ensure food safety?',
      answer:
        'Food safety is our top priority. Our platform includes built-in safety guidelines and tracking features. Donors provide information about storage conditions, preparation time, and expiration dates. We also provide temperature logging for perishable items and ensure all pickups happen within safe time windows.',
    },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    if (leftRef.current) {
      observer.observe(leftRef.current);
    }
    if (rightRef.current) {
      observer.observe(rightRef.current);
    }

    itemRefs.current.forEach(item => {
      if (item) {
        observer.observe(item);
      }
    });

    return () => observer.disconnect();
  }, []);

  const toggleFAQ = index => {
    setActiveIndices(prevIndices => {
      if (prevIndices.includes(index)) {
        return prevIndices.filter(i => i !== index);
      } else {
        return [...prevIndices, index];
      }
    });
  };

  const isActive = index => activeIndices.includes(index);

  const addToItemRefs = (el, index) => {
    if (el && !itemRefs.current.includes(el)) {
      itemRefs.current[index] = el;
    }
  };

  return (
    <div ref={containerRef} className="faq-container">
      <div ref={leftRef} className="faq-left">
        <h1>Frequently Asked Questions</h1>
      </div>

      <div ref={rightRef} className="faq-right">
        {faqData.map((item, index) => (
          <div
            key={index}
            ref={el => addToItemRefs(el, index)}
            className={`faq-item ${isActive(index) ? 'active' : ''}`}
          >
            <div className="faq-question" onClick={() => toggleFAQ(index)}>
              <span>{item.question}</span>
              {isActive(index) ? (
                <FaMinus className="faq-icon" />
              ) : (
                <FaPlus className="faq-icon" />
              )}
            </div>
            <div className="faq-answer">
              <div className="faq-answer-content">{item.answer}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;
