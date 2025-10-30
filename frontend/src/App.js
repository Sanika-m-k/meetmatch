import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, LogOut, User } from 'lucide-react';
import './App.css';

const API_URL = 'https://meetmatch.onrender.com/api';

export default function CollegeEventsApp() {
  const [view, setView] = useState('login');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setView('dashboard');
      fetchEvents(storedToken);
    }
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleAuth = async (e, type) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = type === 'login' ? '/auth/login' : '/auth/signup';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message);
        setLoading(false);
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setView('dashboard');
      await fetchEvents(data.token);
      setLoading(false);
    } catch (err) {
      setError('Connection error. Please ensure backend is running on port 5000.');
      setLoading(false);
    }
  };

  const fetchEvents = async (authToken) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/events`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const data = await response.json();
      console.log('Fetched events:', data);
      setEvents(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setView('login');
    setEvents([]);
    setFormData({ name: '', email: '', password: '' });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (view === 'login' || view === 'signup') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>MeetMatch</h1>
            <p>{view === 'login' ? 'Welcome back!' : 'Create your account'}</p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="auth-form">
            {view === 'signup' && (
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>

            <button
              onClick={(e) => handleAuth(e, view)}
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Loading...' : (view === 'login' ? 'Login' : 'Sign Up')}
            </button>
          </div>

          <div className="auth-footer">
            <button
              onClick={() => {
                setView(view === 'login' ? 'signup' : 'login');
                setError('');
              }}
              className="link-button"
            >
              {view === 'login' 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Login"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="header">
        <div className="header-content">
          <h1>MeetMatch Dashboard</h1>
          <div className="header-actions">
            <div className="user-info">
              <User size={20} />
              <span>{user?.name}</span>
            </div>
            <button onClick={handleLogout} className="btn-logout">
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="page-header">
          <h2>Upcoming Events</h2>
          <p>Discover and participate in exciting college events</p>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <Calendar size={64} />
            <p>No events found. Check back later!</p>
          </div>
        ) : (
          <div className="events-grid">
            {events.map((event) => (
              <div key={event._id} className="event-card">
                {event.image && (
                  <img
                    src={event.image}
                    alt={event.title}
                    className="event-image"
                  />
                )}
                <div className="event-content">
                  <span className="event-category">{event.category}</span>
                  <h3>{event.title}</h3>
                  <p className="event-description">{event.description}</p>
                  
                  <div className="event-details">
                    <div className="event-detail">
                      <Calendar size={16} />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="event-detail">
                      <MapPin size={16} />
                      <span>{event.location}</span>
                    </div>
                    <div className="event-detail">
                      <Users size={16} />
                      <span>Organized by {event.organizer}</span>
                    </div>
                  </div>

                  <button className="btn-register">Register Now</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
