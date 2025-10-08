import React from "react";
import SurplusFormModal from "./SurplusFormModal";
import { useState } from "react";

function Surplus() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
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
    );
}

export default Surplus;