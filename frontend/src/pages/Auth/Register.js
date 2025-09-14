import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'athlete',
    phone: '',
    dateOfBirth: '',
    gender: '',
    state: '',
    city: '',
    specialization: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const { register } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    const type = searchParams.get('type');
    if (type) {
      setFormData(prev => ({ ...prev, userType: type }));
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    const result = await register(formData);
    
    if (result.success) {
      navigate('/login');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <h1>Create Account</h1>
              <p>Join the SAI Sports Talent Assessment Platform</p>
            </div>

            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
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
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Create a password"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Gender</label>
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
                  <label className="form-label">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your state"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">City</label>
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
                <div className="form-group">
                  <label className="form-label">
                    {formData.userType === 'athlete' ? 'Sport Specialization' : 
                     formData.userType === 'coach' ? 'Coaching Specialization' : 
                     'Department'}
                  </label>
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    className="form-input"
                    placeholder={
                      formData.userType === 'athlete' ? 'e.g., Athletics, Swimming' : 
                      formData.userType === 'coach' ? 'e.g., Track & Field, Swimming' : 
                      'e.g., Talent Identification'
                    }
                    required
                  />
                </div>
              </div>

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
                  'Create Account'
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Already have an account?{' '}
                <Link to="/login" className="auth-link">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>

          <div className="auth-info">
            <h2>Join the Revolution</h2>
            <div className="info-features">
              <div className="info-feature">
                <i className="fas fa-mobile-alt"></i>
                <span>Mobile-first platform</span>
              </div>
              <div className="info-feature">
                <i className="fas fa-brain"></i>
                <span>AI-powered analysis</span>
              </div>
              <div className="info-feature">
                <i className="fas fa-users"></i>
                <span>Connect with coaches</span>
              </div>
              <div className="info-feature">
                <i className="fas fa-medal"></i>
                <span>Showcase your talent</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
