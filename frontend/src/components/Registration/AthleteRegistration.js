import React, { useState } from 'react';

const AthleteRegistration = ({ formData, setFormData, onSubmit, loading, error }) => {
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateField = (name, value) => {
    const errors = { ...validationErrors };
    
    switch (name) {
      case 'name':
        if (!value.trim()) {
          errors.name = 'Full name is required';
        } else if (value.trim().length < 2) {
          errors.name = 'Name must be at least 2 characters';
        } else {
          delete errors.name;
        }
        break;
      
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
          errors.email = 'Email is required';
        } else if (!emailRegex.test(value)) {
          errors.email = 'Please enter a valid email address';
        } else {
          delete errors.email;
        }
        break;
      
      case 'password':
        if (!value) {
          errors.password = 'Password is required';
        } else if (value.length < 8) {
          errors.password = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          errors.password = 'Password must contain uppercase, lowercase, and number';
        } else {
          delete errors.password;
        }
        break;
      
      case 'confirmPassword':
        if (!value) {
          errors.confirmPassword = 'Please confirm your password';
        } else if (value !== formData.password) {
          errors.confirmPassword = 'Passwords do not match';
        } else {
          delete errors.confirmPassword;
        }
        break;
      
      case 'phone':
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!value) {
          errors.phone = 'Phone number is required';
        } else if (!phoneRegex.test(value.replace(/\D/g, ''))) {
          errors.phone = 'Please enter a valid 10-digit phone number';
        } else {
          delete errors.phone;
        }
        break;
      
      case 'dateOfBirth':
        if (!value) {
          errors.dateOfBirth = 'Date of birth is required';
        } else {
          const today = new Date();
          const birthDate = new Date(value);
          const age = today.getFullYear() - birthDate.getFullYear();
          if (age < 8 || age > 35) {
            errors.dateOfBirth = 'Age must be between 8 and 35 years';
          } else {
            delete errors.dateOfBirth;
          }
        }
        break;
      
      default:
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Validate field on change
    validateField(name, value);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  return (
    <form onSubmit={onSubmit} className="auth-form">
      <div className="form-group">
        <label className="form-label">User Type</label>
        <select
          name="userType"
          value={formData.userType}
          onChange={handleChange}
          className="form-input"
          required
        >
          <option value="athlete">Athlete / Student</option>
          <option value="coach">Coach / Trainer</option>
          <option value="sai_official">SAI Official</option>
        </select>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`form-input ${validationErrors.name ? 'error' : ''}`}
            placeholder="Enter your full name"
            required
          />
          {validationErrors.name && (
            <span className="error-message">{validationErrors.name}</span>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">Email Address *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`form-input ${validationErrors.email ? 'error' : ''}`}
            placeholder="Enter your email"
            required
          />
          {validationErrors.email && (
            <span className="error-message">{validationErrors.email}</span>
          )}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Password *</label>
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-input ${validationErrors.password ? 'error' : ''}`}
              placeholder="Create a password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
          {validationErrors.password && (
            <span className="error-message">{validationErrors.password}</span>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">Confirm Password *</label>
          <div className="password-input-container">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-input ${validationErrors.confirmPassword ? 'error' : ''}`}
              placeholder="Confirm your password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
          {validationErrors.confirmPassword && (
            <span className="error-message">{validationErrors.confirmPassword}</span>
          )}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Phone Number *</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`form-input ${validationErrors.phone ? 'error' : ''}`}
            placeholder="Enter your phone number"
            required
          />
          {validationErrors.phone && (
            <span className="error-message">{validationErrors.phone}</span>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">Date of Birth *</label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`form-input ${validationErrors.dateOfBirth ? 'error' : ''}`}
            required
          />
          {validationErrors.dateOfBirth && (
            <span className="error-message">{validationErrors.dateOfBirth}</span>
          )}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Gender *</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="form-input"
            required
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Primary Sport *</label>
          <select
            name="specialization"
            value={formData.specialization}
            onChange={handleChange}
            className="form-input"
            required
          >
            <option value="">Select Sport</option>
            <option value="athletics">Athletics</option>
            <option value="football">Football</option>
            <option value="cricket">Cricket</option>
            <option value="basketball">Basketball</option>
            <option value="badminton">Badminton</option>
            <option value="swimming">Swimming</option>
            <option value="wrestling">Wrestling</option>
            <option value="boxing">Boxing</option>
            <option value="hockey">Hockey</option>
            <option value="volleyball">Volleyball</option>
            <option value="tennis">Tennis</option>
            <option value="weightlifting">Weightlifting</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">State *</label>
          <select
            name="state"
            value={formData.state}
            onChange={handleChange}
            className="form-input"
            required
          >
            <option value="">Select State</option>
            <option value="Andhra Pradesh">Andhra Pradesh</option>
            <option value="Arunachal Pradesh">Arunachal Pradesh</option>
            <option value="Assam">Assam</option>
            <option value="Bihar">Bihar</option>
            <option value="Chhattisgarh">Chhattisgarh</option>
            <option value="Delhi">Delhi</option>
            <option value="Goa">Goa</option>
            <option value="Gujarat">Gujarat</option>
            <option value="Haryana">Haryana</option>
            <option value="Himachal Pradesh">Himachal Pradesh</option>
            <option value="Jharkhand">Jharkhand</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Kerala">Kerala</option>
            <option value="Madhya Pradesh">Madhya Pradesh</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Manipur">Manipur</option>
            <option value="Meghalaya">Meghalaya</option>
            <option value="Mizoram">Mizoram</option>
            <option value="Nagaland">Nagaland</option>
            <option value="Odisha">Odisha</option>
            <option value="Punjab">Punjab</option>
            <option value="Rajasthan">Rajasthan</option>
            <option value="Sikkim">Sikkim</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="Telangana">Telangana</option>
            <option value="Tripura">Tripura</option>
            <option value="Uttar Pradesh">Uttar Pradesh</option>
            <option value="Uttarakhand">Uttarakhand</option>
            <option value="West Bengal">West Bengal</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">City *</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="form-input"
            placeholder="Enter your city"
            required
          />
        </div>
      </div>

      {/* Athlete-specific fields */}
      <div className="athlete-specific-fields">
        <h3 className="section-title">Athletic Information</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Height (cm)</label>
            <input
              type="number"
              name="height"
              value={formData.height || ''}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter height in cm"
              min="100"
              max="250"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Weight (kg)</label>
            <input
              type="number"
              name="weight"
              value={formData.weight || ''}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter weight in kg"
              min="30"
              max="200"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Blood Group</label>
            <select
              name="bloodGroup"
              value={formData.bloodGroup || ''}
              onChange={handleChange}
              className="form-input"
            >
              <option value="">Select Blood Group</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Experience Level</label>
            <select
              name="experienceLevel"
              value={formData.experienceLevel || ''}
              onChange={handleChange}
              className="form-input"
            >
              <option value="">Select Experience</option>
              <option value="beginner">Beginner (0-1 years)</option>
              <option value="intermediate">Intermediate (1-3 years)</option>
              <option value="advanced">Advanced (3-5 years)</option>
              <option value="professional">Professional (5+ years)</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">School/Institution</label>
          <input
            type="text"
            name="institution"
            value={formData.institution || ''}
            onChange={handleChange}
            className="form-input"
            placeholder="Enter your school or institution name"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Coach/Trainer Name (if any)</label>
          <input
            type="text"
            name="coachName"
            value={formData.coachName || ''}
            onChange={handleChange}
            className="form-input"
            placeholder="Enter your coach's name"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Previous Achievements</label>
          <textarea
            name="achievements"
            value={formData.achievements || ''}
            onChange={handleChange}
            className="form-input"
            placeholder="List any medals, records, or notable achievements"
            rows="3"
          />
        </div>
      </div>

      {error && <div className="error-message general-error">{error}</div>}

      <button
        type="submit"
        className="btn btn-primary btn-full"
        disabled={loading}
      >
        {loading ? (
          <span>
            <i className="fas fa-spinner fa-spin"></i> Creating Account...
          </span>
        ) : (
          'Create Athlete Account'
        )}
      </button>
    </form>
  );
};

export default AthleteRegistration;
