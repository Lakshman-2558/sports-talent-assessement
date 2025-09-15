import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AthleteDashboard from './AthleteDashboard';
import CoachDashboard from './CoachDashboard';
import SAIOfficialDashboard from './SAIOfficialDashboard';
import './Dashboard.css';

const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="dashboard-page">
        <div className="container">
          <div className="error-message">
            <h2>Access Denied</h2>
            <p>Please log in to access your dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  // Route to appropriate dashboard based on user type
  switch (user.userType) {
    case 'athlete':
      return <AthleteDashboard />;
    case 'coach':
      return <CoachDashboard />;
    case 'sai_official':
      return <SAIOfficialDashboard />;
    default:
      return (
        <div className="dashboard-page">
          <div className="container">
            <div className="error-message">
              <h2>Invalid User Type</h2>
              <p>Unable to determine dashboard type for user: {user.userType}</p>
            </div>
          </div>
        </div>
      );
  }
};

export default Dashboard;
