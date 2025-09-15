import React, { useState } from 'react';

const SAIOfficialRegistration = ({ formData, setFormData, onSubmit, loading, error }) => {
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
          if (age < 21 || age > 65) {
            errors.dateOfBirth = 'Age must be between 21 and 65 years';
          } else {
            delete errors.dateOfBirth;
          }
        }
        break;
      
      case 'employeeId':
        if (!value.trim()) {
          errors.employeeId = 'Employee ID is required';
        } else if (value.trim().length < 3) {
          errors.employeeId = 'Employee ID must be at least 3 characters';
        } else {
          delete errors.employeeId;
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
          <label className="form-label">Official Email Address *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`form-input ${validationErrors.email ? 'error' : ''}`}
            placeholder="Enter your official SAI email"
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
          <label className="form-label">Department/Division *</label>
          <select
            name="specialization"
            value={formData.specialization}
            onChange={handleChange}
            className="form-input"
            required
          >
            <option value="">Select Department</option>
            <option value="talent_identification">Talent Identification</option>
            <option value="sports_development">Sports Development</option>
            <option value="coaching_education">Coaching Education</option>
            <option value="sports_science">Sports Science & Medicine</option>
            <option value="infrastructure">Infrastructure Development</option>
            <option value="elite_sports">Elite Sports</option>
            <option value="grassroots">Grassroots Development</option>
            <option value="administration">Administration</option>
            <option value="finance">Finance & Planning</option>
            <option value="media_communications">Media & Communications</option>
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

      {/* SAI Official-specific fields */}
      <div className="sai-official-specific-fields">
        <h3 className="section-title">Official Information</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Employee ID *</label>
            <input
              type="text"
              name="employeeId"
              value={formData.employeeId || ''}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-input ${validationErrors.employeeId ? 'error' : ''}`}
              placeholder="Enter your SAI employee ID"
              required
            />
            {validationErrors.employeeId && (
              <span className="error-message">{validationErrors.employeeId}</span>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Designation *</label>
            <select
              name="designation"
              value={formData.designation || ''}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="">Select Designation</option>
              <option value="director">Director</option>
              <option value="joint_director">Joint Director</option>
              <option value="deputy_director">Deputy Director</option>
              <option value="assistant_director">Assistant Director</option>
              <option value="sports_officer">Sports Officer</option>
              <option value="assistant_sports_officer">Assistant Sports Officer</option>
              <option value="coach">Coach</option>
              <option value="assistant_coach">Assistant Coach</option>
              <option value="sports_scientist">Sports Scientist</option>
              <option value="medical_officer">Medical Officer</option>
              <option value="physiotherapist">Physiotherapist</option>
              <option value="administrative_officer">Administrative Officer</option>
              <option value="accounts_officer">Accounts Officer</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">SAI Center/Office *</label>
            <select
              name="saiCenter"
              value={formData.saiCenter || ''}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="">Select SAI Center</option>
              <option value="sai_headquarters">SAI Headquarters, New Delhi</option>
              <option value="nsnis_patiala">NSNIS Patiala</option>
              <option value="nsnis_bangalore">NSNIS Bangalore</option>
              <option value="nsnis_kolkata">NSNIS Kolkata</option>
              <option value="nsnis_guwahati">NSNIS Guwahati</option>
              <option value="nsnis_gandhinagar">NSNIS Gandhinagar</option>
              <option value="nsnis_sonipat">NSNIS Sonipat</option>
              <option value="lnipe_gwalior">LNIPE Gwalior</option>
              <option value="ncoe_bhopal">NCOE Bhopal</option>
              <option value="ncoe_imphal">NCOE Imphal</option>
              <option value="ncoe_rae_bareli">NCOE Rae Bareli</option>
              <option value="regional_center">Regional Center</option>
              <option value="extension_center">Extension Center</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Years of Service *</label>
            <select
              name="yearsOfService"
              value={formData.yearsOfService || ''}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="">Select Experience</option>
              <option value="0-2">0-2 years</option>
              <option value="2-5">2-5 years</option>
              <option value="5-10">5-10 years</option>
              <option value="10-15">10-15 years</option>
              <option value="15-20">15-20 years</option>
              <option value="20+">20+ years</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Access Level *</label>
            <select
              name="accessLevel"
              value={formData.accessLevel || ''}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="">Select Access Level</option>
              <option value="basic">Basic Access</option>
              <option value="regional">Regional Access</option>
              <option value="national">National Access</option>
              <option value="admin">Administrative Access</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Reporting Manager</label>
            <input
              type="text"
              name="reportingManager"
              value={formData.reportingManager || ''}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter reporting manager's name"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Educational Qualifications *</label>
          <select
            name="education"
            value={formData.education || ''}
            onChange={handleChange}
            className="form-input"
            required
          >
            <option value="">Select Education</option>
            <option value="bachelor_pe">Bachelor's in Physical Education</option>
            <option value="master_pe">Master's in Physical Education</option>
            <option value="bachelor_sports_science">Bachelor's in Sports Science</option>
            <option value="master_sports_science">Master's in Sports Science</option>
            <option value="bachelor_sports_management">Bachelor's in Sports Management</option>
            <option value="master_sports_management">Master's in Sports Management</option>
            <option value="medical_degree">Medical Degree (MBBS/BDS)</option>
            <option value="engineering">Engineering Degree</option>
            <option value="management">Management Degree (MBA/PGDM)</option>
            <option value="other_bachelor">Other Bachelor's Degree</option>
            <option value="other_master">Other Master's Degree</option>
            <option value="phd">PhD</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Areas of Expertise</label>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="expertise"
                value="talent_identification"
                checked={formData.expertise?.includes('talent_identification') || false}
                onChange={(e) => {
                  const expertise = formData.expertise || [];
                  if (e.target.checked) {
                    setFormData({...formData, expertise: [...expertise, 'talent_identification']});
                  } else {
                    setFormData({...formData, expertise: expertise.filter(exp => exp !== 'talent_identification')});
                  }
                }}
              />
              Talent Identification
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="expertise"
                value="sports_psychology"
                checked={formData.expertise?.includes('sports_psychology') || false}
                onChange={(e) => {
                  const expertise = formData.expertise || [];
                  if (e.target.checked) {
                    setFormData({...formData, expertise: [...expertise, 'sports_psychology']});
                  } else {
                    setFormData({...formData, expertise: expertise.filter(exp => exp !== 'sports_psychology')});
                  }
                }}
              />
              Sports Psychology
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="expertise"
                value="biomechanics"
                checked={formData.expertise?.includes('biomechanics') || false}
                onChange={(e) => {
                  const expertise = formData.expertise || [];
                  if (e.target.checked) {
                    setFormData({...formData, expertise: [...expertise, 'biomechanics']});
                  } else {
                    setFormData({...formData, expertise: expertise.filter(exp => exp !== 'biomechanics')});
                  }
                }}
              />
              Biomechanics
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="expertise"
                value="nutrition"
                checked={formData.expertise?.includes('nutrition') || false}
                onChange={(e) => {
                  const expertise = formData.expertise || [];
                  if (e.target.checked) {
                    setFormData({...formData, expertise: [...expertise, 'nutrition']});
                  } else {
                    setFormData({...formData, expertise: expertise.filter(exp => exp !== 'nutrition')});
                  }
                }}
              />
              Sports Nutrition
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="expertise"
                value="data_analysis"
                checked={formData.expertise?.includes('data_analysis') || false}
                onChange={(e) => {
                  const expertise = formData.expertise || [];
                  if (e.target.checked) {
                    setFormData({...formData, expertise: [...expertise, 'data_analysis']});
                  } else {
                    setFormData({...formData, expertise: expertise.filter(exp => exp !== 'data_analysis')});
                  }
                }}
              />
              Data Analysis
            </label>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Previous Experience</label>
          <textarea
            name="previousExperience"
            value={formData.previousExperience || ''}
            onChange={handleChange}
            className="form-input"
            placeholder="Describe your previous experience in sports administration, coaching, or related fields"
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
          'Create SAI Official Account'
        )}
      </button>
    </form>
  );
};

export default SAIOfficialRegistration;
