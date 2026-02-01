import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaPlus, FaMinus } from 'react-icons/fa';
import '../LandingPage/style/FAQ.css';

const FAQ = () => {
  const { t } = useTranslation();
  const [activeIndices, setActiveIndices] = useState([]);
  const containerRef = useRef(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const itemRefs = useRef([]);

  const faqData = [
    {
      question: t('landing.faq.q1.question'),
      answer: t('landing.faq.q1.answer'),
    },
    {
      question: t('landing.faq.q2.question'),
      answer: t('landing.faq.q2.answer'),
    },
    {
      question: t('landing.faq.q3.question'),
      answer: t('landing.faq.q3.answer'),
    },
    {
      question: t('landing.faq.q4.question'),
      answer: t('landing.faq.q4.answer'),
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
    <div ref={containerRef} className="landing-faq-container">
      <div ref={leftRef} className="landing-faq-left">
        <h1>{t('landing.faq.title')}</h1>
      </div>

      <div ref={rightRef} className="landing-faq-right">
        {faqData.map((item, index) => (
          <div
            key={index}
            ref={el => addToItemRefs(el, index)}
            className={`landing-faq-item ${isActive(index) ? 'landing-active' : ''}`}
          >
            <div
              className="landing-faq-question"
              onClick={() => toggleFAQ(index)}
            >
              <span>{item.question}</span>
              {isActive(index) ? (
                <FaMinus className="landing-faq-icon" />
              ) : (
                <FaPlus className="landing-faq-icon" />
              )}
            </div>
            <div className="landing-faq-answer">
              <div className="landing-faq-answer-content">{item.answer}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;
