import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import HomeIllustration from "../../assets/illustrations/home-illustration.jpg";
import '../LandingPage/style/Home.css';

const Home = () => {
    const navigate = useNavigate();
    const [line1Completed, setLine1Completed] = useState(false);
    const [line2Completed, setLine2Completed] = useState(false);

    useEffect(() => {
        
        const timer1 = setTimeout(() => {
            setLine1Completed(true);
        }, 2500);

        const timer2 = setTimeout(() => {
            setLine2Completed(true);
        }, 4500);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, []);

    return (
        <div className="home-container">
            <div className="floating-element"></div>
            <div className="floating-element"></div>
            <div className="floating-element"></div>
            
            <div className="home-content">
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
                <div className="home-description">
                    <p>FoodFlow connects restaurants, grocery stores, and event venues with verified community organizations in real-time. Redistribute surplus food before it spoils—from conferences to restaurants, ensure good food gets eaten, not wasted.</p>
                    <button onClick={() => navigate('/register')}>Donate Surplus Food now</button>
                </div>
            </div>
            
            <div className="home-image">
                <img src={HomeIllustration} alt="Food donation community" width={"700px"} height={"550px"} />
            </div>
        </div>
    );
};
export default Home;