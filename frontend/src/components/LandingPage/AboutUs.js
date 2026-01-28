import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from 'react-i18next';
import { FaCheckCircle, FaBell, FaLightbulb } from "react-icons/fa";
import "../LandingPage/style/AboutUs.css";

export default function AboutUs() {
  const { t } = useTranslation();
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const missionRef = useRef(null);
  const carouselRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const cards = [
    {
      icon: <FaCheckCircle />,
      title: t('landing.about.verifiedOrgs.title'),
      content: t('landing.about.verifiedOrgs.content')
    },
    {
      icon: <FaBell />,
      title: t('landing.about.realTimeNotifications.title'),
      content: t('landing.about.realTimeNotifications.content')
    },
    {
      icon: <FaLightbulb />,
      title: t('landing.about.smartMatching.title'),
      content: t('landing.about.smartMatching.content')
    }
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

    if (titleRef.current) {
      observer.observe(titleRef.current);
    }
    if (subtitleRef.current) {
      observer.observe(subtitleRef.current);
    }
    if (missionRef.current) {
      observer.observe(missionRef.current);
    }
    if (carouselRef.current) {
      observer.observe(carouselRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % cards.length);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + cards.length) % cards.length);
  };

  const goToSlide = index => {
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
        <h1 ref={titleRef} className="about-title">{t('landing.about.title')}</h1>
        <p ref={subtitleRef} className="about-subtitle">
          {t('landing.about.subtitle')}
        </p>
      </div>

      {/* Carousel Section */}
      <div ref={carouselRef} className="carousel-container">
        <div className="carousel-wrapper">
          <button
            className="carousel-btn prev"
            onClick={prevSlide}
            aria-label="Previous slide"
          >
            ‹
          </button>

          <div className="carousel-track">
            {cards.map((card, index) => (
              <div
                key={index}
                className={`carousel-slide ${
                  index === currentSlide
                    ? 'active'
                    : index === (currentSlide - 1 + cards.length) % cards.length
                      ? 'prev'
                      : index === (currentSlide + 1) % cards.length
                        ? 'next'
                        : ''
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

          <button
            className="carousel-btn next"
            onClick={nextSlide}
            aria-label="Next slide"
          >
            ›
          </button>
        </div>

        <div className="carousel-dots">
          {cards.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
