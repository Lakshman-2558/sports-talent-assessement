import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Configure axios base URL with enhanced debugging
  useEffect(() => {
    console.log('🔍 Checking environment variables...');
    console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    console.log('REACT_APP_ENVIRONMENT:', process.env.REACT_APP_ENVIRONMENT);
    
    // Clean and validate API URL
    let apiUrl = process.env.REACT_APP_API_URL;
    
    if (apiUrl) {
      // Remove any trailing spaces and slashes
      apiUrl = apiUrl.trim().replace(/\s+$/, '').replace(/\/$/, '');
      console.log('🌐 Cleaned API URL:', `"${apiUrl}"`);
      console.log('📏 URL length:', apiUrl.length);
      
      // Check for spaces in the URL
      if (/\s/.test(apiUrl)) {
        console.error('🚨 WARNING: Spaces detected in API URL!');
        console.log('🔤 URL characters:', Array.from(apiUrl).map(char => 
          char === ' ' ? '[SPACE]' : char
        ));
      }
      
      axios.defaults.baseURL = apiUrl;
      console.log('✅ Axios baseURL set to:', axios.defaults.baseURL);
    } else {
      console.error('❌ REACT_APP_API_URL is not defined!');
    }

    // Add request interceptor to debug URLs
    axios.interceptors.request.use(
      (config) => {
        let fullUrl;
        
        if (config.url.startsWith('http')) {
          // If URL is already absolute, use it as-is
          fullUrl = config.url;
        } else if (config.baseURL) {
          // If we have a baseURL, construct the full URL properly
          const base = config.baseURL.endsWith('/') ? config.baseURL.slice(0, -1) : config.baseURL;
          const path = config.url.startsWith('/') ? config.url : `/${config.url}`;
          fullUrl = `${base}${path}`;
        } else {
          // No baseURL, just use the relative URL
          fullUrl = config.url;
        }
        
        console.log('📤 API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          fullURL: fullUrl,
          hasSpaces: /\s/.test(fullUrl),
          isAbsolute: config.url.startsWith('http')
        });
        
        return config;
      },
      (error) => {
        console.error('❌ Request error:', error);
        return Promise.reject(error);
      }
    );
    
    // Add response interceptor to debug responses
    axios.interceptors.response.use(
      (response) => {
        let fullUrl;
        if (response.config.url.startsWith('http')) {
          fullUrl = response.config.url;
        } else if (response.config.baseURL) {
          const base = response.config.baseURL.endsWith('/') ? response.config.baseURL.slice(0, -1) : response.config.baseURL;
          const path = response.config.url.startsWith('/') ? response.config.url : `/${response.config.url}`;
          fullUrl = `${base}${path}`;
        } else {
          fullUrl = response.config.url;
        }
        
        console.log('📥 API Response:', {
          url: response.config.url,
          fullURL: fullUrl,
          status: response.status,
          success: response.data.success
        });
        return response;
      },
      (error) => {
        let fullUrl;
        if (error.config?.url?.startsWith('http')) {
          fullUrl = error.config.url;
        } else if (error.config?.baseURL) {
          const base = error.config.baseURL.endsWith('/') ? error.config.baseURL.slice(0, -1) : error.config.baseURL;
          const path = error.config.url?.startsWith('/') ? error.config.url : `/${error.config.url}`;
          fullUrl = `${base}${path}`;
        } else {
          fullUrl = error.config?.url;
        }
        
        console.error('❌ Response error:', {
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          fullURL: fullUrl,
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }, []);

  const fetchUser = async () => {
    try {
      console.log('🔄 Fetching user data...');
      const response = await axios.get('/auth/me');
      console.log('✅ User data fetched:', response.data.user);
      setUser(response.data.user);
    } catch (error) {
      console.error('❌ Error fetching user:', {
        message: error.response?.data?.message,
        status: error.response?.status,
        url: error.config?.url
      });
      
      // Only clear token for authentication-related errors (401, 403)
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('🔑 Token expired or invalid, clearing authentication');
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password, userType) => {
    try {
      console.log('🔐 Attempting login:', { email, userType });
      
      // Double-check URL before making request
      const currentBaseUrl = axios.defaults.baseURL;
      console.log('🌐 Current baseURL:', `"${currentBaseUrl}"`);
      
      const response = await axios.post('/auth/login', {
        email,
        password,
        userType
      });

      console.log('✅ Login successful:', response.data.user.email);

      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      return { success: true, user: userData };
    } catch (error) {
      console.error('❌ Login failed:', {
        message: error.response?.data?.message,
        status: error.response?.status,
        url: error.config?.baseURL + error.config?.url,
        fullError: error.response?.data
      });
      
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
        status: error.response?.status,
        details: error.response?.data
      };
    }
  };

  const register = async (userData) => {
    try {
      console.log('📝 Attempting registration:', userData.email);
      const response = await axios.post('/auth/register', userData);
      
      console.log('✅ Registration successful:', response.data.user.email);

      // Don't auto-login after registration - let user login manually
      return { success: true, user: response.data.user };
    } catch (error) {
      console.error('❌ Registration failed:', error.response?.data);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
        errors: error.response?.data?.errors,
        status: error.response?.status
      };
    }
  };

  const logout = () => {
    console.log('🚪 Logging out user');
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setLoading(false);
    delete axios.defaults.headers.common['Authorization'];
    
    // Redirect to login page after logout
    window.location.href = '/login';
  };

  // Password reset functions
  const resetPassword = async (email) => {
    try {
      console.log('📧 Requesting password reset for:', email);
      const response = await axios.post('/auth/forgot-password', { 
        email 
      });
      return { 
        success: true, 
        message: response.data.message,
        debugOtp: response.data.debug_otp // For development
      };
    } catch (error) {
      console.error('❌ Reset password error:', error.response?.data);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send OTP',
        status: error.response?.status
      };
    }
  };

  const verifyOTP = async (email, otp) => {
    try {
      console.log('🔢 Verifying OTP for:', email);
      const response = await axios.post('/auth/verify-otp', { 
        email, 
        otp 
      });
      return { 
        success: true, 
        message: response.data.message 
      };
    } catch (error) {
      console.error('❌ OTP verification error:', error.response?.data);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to verify OTP',
        attemptsRemaining: error.response?.data?.attemptsRemaining,
        status: error.response?.status
      };
    }
  };

  const resendOTP = async (email) => {
    try {
      console.log('🔄 Resending OTP for:', email);
      const response = await axios.post('/auth/resend-otp', { 
        email 
      });
      return { 
        success: true, 
        message: response.data.message,
        debugOtp: response.data.debug_otp // For development
      };
    } catch (error) {
      console.error('❌ Resend OTP error:', error.response?.data);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to resend OTP',
        status: error.response?.status
      };
    }
  };

  const completePasswordReset = async (email, otp, newPassword) => {
    try {
      console.log('🔄 Completing password reset for:', email);
      const response = await axios.post('/auth/reset-password', {
        email,
        otp,
        newPassword
      });
      return { 
        success: true, 
        message: response.data.message 
      };
    } catch (error) {
      console.error('❌ Complete password reset error:', error.response?.data);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to reset password',
        status: error.response?.status
      };
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
    resetPassword,
    verifyOTP,
    resendOTP,
    completePasswordReset
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};