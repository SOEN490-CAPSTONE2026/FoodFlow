import React from "react";
import { useNavigate } from 'react-router-dom';
import HomeIllustration from "../assets/home-illustration.jpg";
import './Home.css';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            <div className="floating-element"></div>
            <div className="floating-element"></div>
            <div className="floating-element"></div>
            
            <div className="home-content">
                <div className="home-title">
                    <h1>Connect surplus with</h1>
                    <span>those in need</span>
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