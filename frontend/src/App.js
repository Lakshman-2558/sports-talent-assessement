import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import SportsCategory from './pages/SportsCategory/SportsCategory';
import Contact from './pages/Contact/Contact';
import About from './pages/About/About';
import PuzzleGames from './pages/PuzzleGames/PuzzleGames';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import SAIDashboard from './pages/SAIDashboard/SAIDashboard';
import VideoAssessment from './pages/VideoAssessment/VideoAssessment';
import GestureRecordingPage from './pages/GestureRecording/GestureRecordingPage';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';
import ForgotPassword from './pages/Auth/Forgetpass';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/sports-category" element={<SportsCategory />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/about" element={<About />} />
              <Route path="/puzzle-games" element={<PuzzleGames />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/sai-dashboard" element={<SAIDashboard />} />
              <Route path="/video-assessment" element={<VideoAssessment />} />
              <Route path="/gesture-recording" element={<GestureRecordingPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
