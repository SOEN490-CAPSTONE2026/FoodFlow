import React, { useState } from "react";
import { LoadScript } from "@react-google-maps/api";
import SurplusFormModal from "./SurplusFormModal";

const libraries = ["places"];

function Surplus() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <LoadScript
            googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
            libraries={libraries}
        >
            <div className="surplus-container">
                <h1>Surplus</h1>
                <button
                    className="surplus-cta"
                    onClick={() => setIsModalOpen(true)}
                >
                    + Donate More
                </button>
                <SurplusFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />
            </div>
        </LoadScript>
    );
}

export default Surplus;