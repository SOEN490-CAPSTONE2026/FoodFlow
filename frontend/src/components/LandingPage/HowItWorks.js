import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from 'react-i18next';
import { FaMobileAlt, FaBell, FaShieldAlt } from "react-icons/fa";
import "../LandingPage/style/HowItWorks.css";

const HowItWorks = () => {
  const { t } = useTranslation();
  
  const steps = [
    {
      number: t('landing.howItWorks.step1.number'),
      title: t('landing.howItWorks.step1.title'),
      text: t('landing.howItWorks.step1.text'),
      icon: <FaMobileAlt />
    },
    {
      number: t('landing.howItWorks.step2.number'),
      title: t('landing.howItWorks.step2.title'),
      text: t('landing.howItWorks.step2.text'),
      icon: <FaBell />
    },
    {
      number: t('landing.howItWorks.step3.number'),
      title: t('landing.howItWorks.step3.title'),
      text: t('landing.howItWorks.step3.text'),
      icon: <FaShieldAlt />
    }
  ];
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const sectionRef = useRef(null);
  const duration = 3000;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Logic for the Step animation 
  useEffect(() => {
    if (!isInView) return;
    
    setIsAnimating(true);
    
    const animationTimer = setTimeout(() => {
      setIsAnimating(false);
    }, duration);

    const stepTimer = setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        setCurrentStep(0); 
      }
    }, duration + 500);
    
    return () => {
      clearTimeout(animationTimer);
      clearTimeout(stepTimer);
    };
  }, [currentStep, isInView]);

  return (
    <div 
      className={`how-it-works-container ${isInView ? "animate-in" : ""}`} 
      ref={sectionRef}
    >
      <div className="how-it-works-header">
        <h1>{t('landing.howItWorks.title')}</h1>
        <p>
          {t('landing.howItWorks.subtitle')}
        </p>
      </div>

      <div className="steps-wrapper">
        <div className="steps-container">
          {steps.map((step, i) => (
            <div key={i} className="step-column">
              <div className={`step-card ${i === currentStep ? "active" : ""}`}>
                <div className="step-visual">
                  <div className="step-icon">
                    <div className="icon-circle">{step.icon}</div>
                  </div>
                </div>
                <div className="step-content">
                  <div className="step-number">{step.number}</div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </div>
              <div className="progress-container">
                <div 
                  className={`progress-bar ${
                    i < currentStep ? "completed" : 
                    i === currentStep && isAnimating ? "animating" : ""
                  }`}
                  style={i === currentStep && isAnimating ? {animationDuration: `${duration}ms`} : {}}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="floating-food food-1">🍎</div>
      <div className="floating-food food-2">🥖</div>
      <div className="floating-food food-3">🥦</div>
      <div className="floating-food food-4">🚚</div>
    </div>
  );
};

export default HowItWorks;