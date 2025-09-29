import React, { useEffect, useRef, useState } from "react";
import "./AboutUs.css";

export default function AboutUs() {
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const missionRef = useRef(null);
  const carouselRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const cards = [
    {
      icon: "✓",
      title: "Verified Organizations",
      content: "All our partner organizations undergo thorough verification and background checks to ensure safety, legitimacy, and compliance with food safety standards."
    },
    {
      icon: "🔔",
      title: "Real-Time Notifications",
      content: "Instant alerts when food donations become available. Our system tracks temperature, pickup times, and compliance automatically for complete transparency."
    },
    {
      icon: "💡",
      title: "Smart Matching",
      content: "Our intelligent algorithm matches food type, quantity, and location with the most suitable nearby organization to maximize efficiency and impact."
    }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { 
        threshold: 0.3,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    if (titleRef.current) observer.observe(titleRef.current);
    if (subtitleRef.current) observer.observe(subtitleRef.current);
    if (missionRef.current) observer.observe(missionRef.current);
    if (carouselRef.current) observer.observe(carouselRef.current);

    return () => observer.disconnect();
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % cards.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="about-container">
      <div className="about-hero">
        <h1 ref={titleRef} className="about-title">About FoodFlow</h1>
        <p ref={subtitleRef} className="about-subtitle">
          Our platform connects food donors with verified organizations to reduce waste 
          and fight hunger through smart technology and community collaboration.
        </p>
      </div>

      {/* Carousel Section */}
      <div ref={carouselRef} className="carousel-container">
        <div className="carousel-wrapper">
          <button className="carousel-btn prev" onClick={prevSlide} aria-label="Previous slide">
            ‹
          </button>
          
          <div className="carousel-track">
            {cards.map((card, index) => (
              <div
                key={index}
                className={`carousel-slide ${
                  index === currentSlide ? "active" : 
                  index === (currentSlide - 1 + cards.length) % cards.length ? "prev" :
                  index === (currentSlide + 1) % cards.length ? "next" : ""
                }`}
              >
                <div className="about-card">
                  <div className="card-icon">{card.icon}</div>
                  <h2>{card.title}</h2>
                  <p>{card.content}</p>
                </div>
              </div>
            ))}
          </div>
          
          <button className="carousel-btn next" onClick={nextSlide} aria-label="Next slide">
            ›
          </button>
        </div>

        <div className="carousel-dots">
          {cards.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentSlide ? "active" : ""}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

    </div>
  );
}