import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: 'athlete'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
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

    const result = await login(formData.email, formData.password, formData.userType);
    
    if (result.success) {
      navigate('/dashboard');
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
              <h1>Welcome Back</h1>
              <p>Sign in to your account to continue your athletic journey</p>
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

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={loading}
              >
                {loading ? (
                  <span>
                    <i className="fas fa-spinner fa-spin"></i> Signing In...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Don't have an account?{' '}
                <Link to="/register" className="auth-link">
                  Register here
                </Link>
              </p>
              <Link to="/forgot-password" className="auth-link">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div className="auth-info">
            <h2>AI-Powered Sports Assessment</h2>
            <div className="info-features">
              <div className="info-feature">
                <i className="fas fa-video"></i>
                <span>Video-based fitness assessments</span>
              </div>
              <div className="info-feature">
                <i className="fas fa-chart-line"></i>
                <span>Real-time performance analytics</span>
              </div>
              <div className="info-feature">
                <i className="fas fa-shield-alt"></i>
                <span>AI-powered cheat detection</span>
              </div>
              <div className="info-feature">
                <i className="fas fa-trophy"></i>
                <span>Gamified progress tracking</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
