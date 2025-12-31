import React, { useState, useEffect, useRef } from "react";
import { FaMobileAlt, FaBell, FaShieldAlt } from "react-icons/fa";
import "../LandingPage/style/HowItWorks.css";

const steps = [
  {
    number: "01",
    title: "Post Surplus Instantly",
    text: "Restaurants, events, and stores post surplus food with quantity, pickup location, and time window before it spoils.",
    icon: <FaMobileAlt />
  },
  {
    number: "02",
    title: "Smart Instant Matching",
    text: "Our algorithm instantly alerts the nearest verified charity, shelter, or volunteer who can pick up within the time window.",
    icon: <FaBell />
  },
  {
    number: "03",
    title: "Tracked Safe Pickup",
    text: "Built-in food safety tracking logs temperature, expiry dates, and pickup times for compliance while ensuring meals reach people fast.",
    icon: <FaShieldAlt />
  }
];

const HowItWorks = () => {
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
        <h1>How FoodFlow Works</h1>
        <p>
          Surplus food reaches charities in minutes, not hours. Our smart
          matching prevents good food from going to waste.
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