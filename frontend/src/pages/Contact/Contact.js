import React, { useState } from 'react';
import axios from 'axios';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    contactType: 'general'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

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

    try {
      await axios.post('/contact', formData);
      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        contactType: 'general'
      });
    } catch (error) {
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      <div className="container">
        {/* Header */}
        <section className="contact-header">
          <h1>Contact Us</h1>
          <p>Get in touch with the SAI Sports Talent Assessment Platform team</p>
        </section>

        <div className="contact-content">
          {/* Contact Form */}
          <div className="contact-form-section">
            <div className="form-container">
              <h2>Send us a Message</h2>
              
              {success && (
                <div className="alert alert-success">
                  Thank you for your message! We'll get back to you soon.
                </div>
              )}
              
              {error && (
                <div className="alert alert-error">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Type</label>
                  <select
                    name="contactType"
                    value={formData.contactType}
                    onChange={handleChange}
                    className="form-input"
                    required
                  >
                    <option value="general">General Inquiry</option>
                    <option value="technical">Technical Support</option>
                    <option value="assessment">Assessment Help</option>
                    <option value="partnership">Partnership</option>
                    <option value="feedback">Feedback</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Brief description of your inquiry"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    className="form-textarea"
                    placeholder="Please provide details about your inquiry..."
                    rows="6"
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Sending...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i>
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Contact Information */}
          <div className="contact-info-section">
            <div className="info-container">
              <h2>Get in Touch</h2>
              <p>We're here to help you with any questions about the platform.</p>

              <div className="contact-methods">
                <div className="contact-method">
                  <div className="method-icon">
                    <i className="fas fa-envelope"></i>
                  </div>
                  <div className="method-info">
                    <h4>Email Support</h4>
                    <p>support@sai-talent.gov.in</p>
                    <small>Response within 24 hours</small>
                  </div>
                </div>

                <div className="contact-method">
                  <div className="method-icon">
                    <i className="fas fa-phone"></i>
                  </div>
                  <div className="method-info">
                    <h4>Phone Support</h4>
                    <p>+91-11-2436-8500</p>
                    <small>Mon-Fri, 9:00 AM - 6:00 PM IST</small>
                  </div>
                </div>

                <div className="contact-method">
                  <div className="method-icon">
                    <i className="fas fa-map-marker-alt"></i>
                  </div>
                  <div className="method-info">
                    <h4>Office Address</h4>
                    <p>Sports Authority of India<br />
                    Jawaharlal Nehru Stadium<br />
                    New Delhi - 110003</p>
                  </div>
                </div>

                <div className="contact-method">
                  <div className="method-icon">
                    <i className="fas fa-clock"></i>
                  </div>
                  <div className="method-info">
                    <h4>Support Hours</h4>
                    <p>Monday - Friday: 9:00 AM - 6:00 PM<br />
                    Saturday: 10:00 AM - 4:00 PM<br />
                    Sunday: Closed</p>
                  </div>
                </div>
              </div>

              <div className="social-links">
                <h4>Follow SAI</h4>
                <div className="social-buttons">
                  <a href="https://twitter.com/sportsauthority" className="social-btn" target="_blank" rel="noopener noreferrer" aria-label="Follow SAI on Twitter">
                    <i className="fab fa-twitter"></i>
                  </a>
                  <a href="https://facebook.com/sportsauthorityofindia" className="social-btn" target="_blank" rel="noopener noreferrer" aria-label="Follow SAI on Facebook">
                    <i className="fab fa-facebook"></i>
                  </a>
                  <a href="https://instagram.com/sportsauthorityofindia" className="social-btn" target="_blank" rel="noopener noreferrer" aria-label="Follow SAI on Instagram">
                    <i className="fab fa-instagram"></i>
                  </a>
                  <a href="https://youtube.com/sportsauthorityofindia" className="social-btn" target="_blank" rel="noopener noreferrer" aria-label="Follow SAI on YouTube">
                    <i className="fab fa-youtube"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="faq-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h4>How does the AI assessment work?</h4>
              <p>Our AI system analyzes your recorded videos using computer vision and machine learning to evaluate your performance, detect proper form, and provide accurate measurements.</p>
            </div>
            <div className="faq-item">
              <h4>What equipment do I need?</h4>
              <p>You only need a smartphone with a camera. The app works on most modern devices and doesn't require any special equipment.</p>
            </div>
            <div className="faq-item">
              <h4>How accurate are the assessments?</h4>
              <p>Our AI system has been trained on thousands of assessment videos and achieves over 95% accuracy in most fitness tests when proper recording guidelines are followed.</p>
            </div>
            <div className="faq-item">
              <h4>Can I retake an assessment?</h4>
              <p>Yes, you can retake assessments. However, there may be waiting periods between attempts to ensure fair evaluation.</p>
            </div>
            <div className="faq-item">
              <h4>How is my data protected?</h4>
              <p>We follow strict data protection protocols. Your personal information and assessment videos are encrypted and stored securely according to government standards.</p>
            </div>
            <div className="faq-item">
              <h4>Who can access my assessment results?</h4>
              <p>Only you, your assigned coaches (if any), and authorized SAI officials can access your assessment results. Data privacy is our top priority.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Contact;
