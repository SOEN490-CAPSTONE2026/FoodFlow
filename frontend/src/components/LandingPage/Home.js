import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import HomeIllustration from "../../assets/illustrations/home-illustration.jpg";
import backgroundVideo from "../../assets/LandingPage_VIDEO.mp4"; // Add your video import
import '../LandingPage/style/Home.css';

const Home = () => {
    const navigate = useNavigate();
    const [line1Completed, setLine1Completed] = useState(false);
    const [line2Completed, setLine2Completed] = useState(false);
    const [showReceiver, setShowReceiver] = useState(false);

    useEffect(() => {
        const timer1 = setTimeout(() => {
            setLine1Completed(true);
        }, 2500);

        const timer2 = setTimeout(() => {
            setLine2Completed(true);
        }, 4500);

        const interval = setInterval(() => {
            setShowReceiver(prev => !prev);
        }, 8000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="home-container">
            <video 
                className="background-video" 
                autoPlay 
                loop 
                muted 
                playsInline
            >
                <source src={backgroundVideo} type="video/mp4" />
            </video>

            <div className="floating-element"></div>
            <div className="floating-element"></div>
            <div className="floating-element"></div>

            <div className="home-content">
                {!showReceiver ? (
                    <div className="home-title">
                        <h1>
                            <span
                                className={`typewriter-text typewriter-line-1 ${line1Completed ? 'completed' : ''}`}
                            >
                                Connect surplus with
                            </span>
                        </h1>
                        <span className="gradient-text">
                            <span
                                className={`typewriter-text typewriter-line-2 ${line2Completed ? 'completed' : ''}`}
                            >
                                those in need
                            </span>
                        </span>
                    </div>
                ) : (
                    <div className="home-title receiver-title">
                        <h1>
                            <span className="typewriter-text typewriter-line-3">
                                Receive quality food
                            </span>
                        </h1>
                        <span className="gradient-text">
                            <span className="typewriter-text typewriter-line-4">
                                for your community
                            </span>
                        </span>
                    </div>
                )}
                
                <div className="home-description">
                    <p>Real-time platform connecting food businesses with verified community organizations. Whether it's event surplus, restaurant excess, or grocery overstock, FoodFlow helps you redistribute quality food quickly and efficiently—turning waste into community impact.</p>
                    <button onClick={() => navigate('/register')}>Join Us Now</button>
                </div>
            </div>
        </div>
    );
};
export default Home;