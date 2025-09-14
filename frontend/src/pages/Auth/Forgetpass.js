import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); 
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);
  const { resetPassword, verifyOTP, resendOTP, completePasswordReset } = useAuth(); 
  const navigate = useNavigate();

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.email) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }


    const result = await resetPassword(formData.email);
    
    if (result.success) {
      setStep(2);
      setCountdown(60); // 60 seconds countdown for resend OTP
      setSuccess('OTP has been sent to your email address');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.otp || formData.otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      setLoading(false);
      return;
    }

    // Use the verifyOTP function from AuthContext
    const result = await verifyOTP(formData.email, formData.otp);
    
    if (result.success) {
      setStep(3);
      setSuccess('OTP verified successfully. Please set your new password.');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setError('');
    // Use the resendOTP function from AuthContext
    const result = await resendOTP(formData.email);
    
    if (result.success) {
      setCountdown(60);
      setSuccess('New OTP has been sent to your email address');
    } else {
      setError(result.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Use the completePasswordReset function from AuthContext
    const result = await completePasswordReset(
      formData.email, 
      formData.otp, 
      formData.newPassword
    );
    
    if (result.success) {
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
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
              <h1>Reset Password</h1>
              <p>
                {step === 1 && 'Enter your email to receive a verification code'}
                {step === 2 && 'Enter the OTP sent to your email'}
                {step === 3 && 'Set your new password'}
              </p>
            </div>

            {error && (
              <div className="alert alert-error">
                <i className="fas fa-exclamation-circle"></i>
                {error}
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                <i className="fas fa-check-circle"></i>
                {success}
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleSendOTP} className="auth-form">
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your registered email"
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
                      <i className="fas fa-spinner fa-spin"></i> Sending OTP...
                    </span>
                  ) : (
                    'Send Verification Code'
                  )}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyOTP} className="auth-form">
                <div className="form-group">
                  <label className="form-label">Verification Code</label>
                  <div className="otp-input-container">
                    <input
                      type="text"
                      name="otp"
                      value={formData.otp}
                      onChange={handleChange}
                      className="form-input otp-input"
                      placeholder="Enter 6-digit code"
                      maxLength="6"
                      required
                    />
                    <div className="otp-timer">
                      {countdown > 0 ? `Resend in ${countdown}s` : 'Didn\'t receive code?'}
                      <button
                        type="button"
                        className="btn-resend"
                        onClick={handleResendOTP}
                        disabled={countdown > 0}
                      >
                        Resend OTP
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={loading}
                >
                  {loading ? (
                    <span>
                      <i className="fas fa-spinner fa-spin"></i> Verifying...
                    </span>
                  ) : (
                    'Verify Code'
                  )}
                </button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleResetPassword} className="auth-form">
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter new password"
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
                    placeholder="Confirm new password"
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
                      <i className="fas fa-spinner fa-spin"></i> Resetting...
                    </span>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            )}

            <div className="auth-footer">
              <p>
                Remember your password?{' '}
                <Link to="/login" className="auth-link">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>

          <div className="auth-info">
            <h2>Secure Password Recovery</h2>
            <div className="info-features">
              <div className="info-feature">
                <i className="fas fa-shield-alt"></i>
                <span>Two-factor authentication</span>
              </div>
              <div className="info-feature">
                <i className="fas fa-envelope"></i>
                <span>OTP sent to your registered email</span>
              </div>
              <div className="info-feature">
                <i className="fas fa-lock"></i>
                <span>Secure password reset process</span>
              </div>
              <div className="info-feature">
                <i className="fas fa-clock"></i>
                <span>Time-sensitive verification code</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;