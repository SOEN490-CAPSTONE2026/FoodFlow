import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import { AuthContext } from "../contexts/AuthContext";
import DonorIllustration from "../assets/illustrations/donor-illustration.jpg";
import "../style/Registration.css";

const DonorRegistration = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    organizationName: "",
    contactPerson: "",
    phone: "",
    address: "",
    organizationType: "RESTAURANT",
    businessLicense: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.businessLicense || formData.businessLicense.trim() === "") {
      errors.businessLicense =
        "Business license is required for donor registration";
    }

    setFieldErrors(errors);

    // Return true if no errors
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Run client-side validation first
    if (!validateForm()) {
      return; // stop submission if validation fails
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await authAPI.registerDonor(formData);
      setSuccess("Registration successful! Welcome to FoodFlow.");

      // Extract token, role, and userId from response
      const token = response?.data?.token;
      const userRole = response?.data?.role;
      const userId = response?.data?.userId;

      if (token && userRole && userId) {
        login(token, userRole, userId); // Store in context and localStorage
      }

      // Redirect after success
      setTimeout(() => {
        navigate("/donor"); // Redirect to donor dashboard
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-page">
      <div className="background-image">
        <img
          src={DonorIllustration}
          alt="Donor Illustration"
          height={500}
          width={900}
        />
        <p>
          Your generosity provides meals, care, and hope for families in need.
          Every donation helps strengthen communities and build a brighter,
          kinder future together, we can make lasting change!
        </p>
      </div>
      <div className="form-container">
        <h1>Register as a Donor</h1>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email address"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              minLength="8"
              placeholder="Enter your password"
              required
            />
            <small>Minimum 8 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="organizationName">Organization Name</label>
            <input
              type="text"
              id="organizationName"
              name="organizationName"
              value={formData.organizationName}
              onChange={handleChange}
              placeholder="Enter your organization name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="contactPerson">Contact Person</label>
            <input
              type="text"
              id="contactPerson"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              placeholder="Enter your contact person's name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
              placeholder="Enter your address"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="organizationType">Organization Type</label>
            <select
              id="organizationType"
              name="organizationType"
              value={formData.organizationType}
              onChange={handleChange}
              placeholder="Select your organization type"
              required
            >
              <option value="RESTAURANT">Restaurant</option>
              <option value="GROCERY_STORE">Grocery Store</option>
              <option value="EVENT_ORGANIZER">Event Organizer</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="businessLicense">
              Business License Number <span style={{ color: "red" }}>*</span>
            </label>
            <input
              type="text"
              id="businessLicense"
              name="businessLicense"
              value={formData.businessLicense}
              onChange={handleChange}
              placeholder="Enter your business license number"
            />
            {fieldErrors.businessLicense && (
              <small style={{ color: "red" }}>
                {fieldErrors.businessLicense}
              </small>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="back-button"
              onClick={() => navigate("/register")}
            >
              Back
            </button>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? "Registering..." : "Register as Donor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DonorRegistration;
