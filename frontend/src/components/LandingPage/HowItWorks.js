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
      className={`hiw-container ${isInView ? "hiw-animate-in" : ""}`} 
      ref={sectionRef}
    >
      <div className="hiw-header">
        <h1>{t('landing.howItWorks.title')}</h1>
        <p>
          {t('landing.howItWorks.subtitle')}
        </p>
      </div>

      <div className="hiw-steps-wrapper">
        <div className="hiw-steps-container">
          {steps.map((step, i) => (
            <div key={i} className="hiw-step-column">
              <div className={`hiw-step-card ${i === currentStep ? "hiw-active" : ""}`}>
                <div className="hiw-step-visual">
                  <div className="hiw-step-icon">
                    <div className="hiw-icon-circle">{step.icon}</div>
                  </div>
                </div>
                <div className="hiw-step-content">
                  <div className="hiw-step-number">{step.number}</div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </div>
              <div className="hiw-progress-container">
                <div 
                  className={`hiw-progress-bar ${
                    i < currentStep ? "hiw-completed" : 
                    i === currentStep && isAnimating ? "hiw-animating" : ""
                  }`}
                  style={i === currentStep && isAnimating ? {animationDuration: `${duration}ms`} : {}}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="hiw-floating-food hiw-food-1">🍎</div>
      <div className="hiw-floating-food hiw-food-2">🥖</div>
      <div className="hiw-floating-food hiw-food-3">🥦</div>
      <div className="hiw-floating-food hiw-food-4">🚚</div>
    </div>
  );
};

export default HowItWorks;