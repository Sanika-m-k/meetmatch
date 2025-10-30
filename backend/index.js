// server.js - Backend Setup
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb+srv://sanikakadam604:VOxtcVz4RymAjgJ7@cluster0.dfa7ukh.mongodb.net/college-events', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Event Schema
const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  category: { type: String, required: true },
  organizer: { type: String, required: true },
  image: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Event = mongoose.model('Event', eventSchema);

// Sample events data
const sampleEvents = [
  {
    title: 'Tech Fest 2025',
    description: 'Annual technical festival featuring hackathons, coding competitions, and tech talks',
    date: new Date('2025-11-15'),
    location: 'Main Auditorium',
    category: 'Technical',
    organizer: 'Tech Club',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400'
  },
  {
    title: 'Cultural Night',
    description: 'Showcase of music, dance, and drama performances by students',
    date: new Date('2025-11-20'),
    location: 'Open Air Theatre',
    category: 'Cultural',
    organizer: 'Cultural Committee',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400'
  },
  {
    title: 'Sports Meet',
    description: 'Inter-college sports competition including cricket, football, and athletics',
    date: new Date('2025-11-25'),
    location: 'Sports Complex',
    category: 'Sports',
    organizer: 'Sports Department',
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400'
  },
  {
    title: 'Career Fair',
    description: 'Meet with top recruiters and explore career opportunities',
    date: new Date('2025-12-01'),
    location: 'Convention Center',
    category: 'Career',
    organizer: 'Placement Cell',
    image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400'
  },
  {
    title: 'Hackathon 2025',
    description: '24-hour coding marathon to build innovative solutions',
    date: new Date('2025-12-05'),
    location: 'Computer Science Building',
    category: 'Technical',
    organizer: 'Coding Club',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400'
  },
  {
    title: 'Art Exhibition',
    description: 'Student artwork showcase featuring paintings, sculptures, and digital art',
    date: new Date('2025-12-10'),
    location: 'Art Gallery',
    category: 'Cultural',
    organizer: 'Fine Arts Department',
    image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400'
  }
];

// Initialize database with sample events
async function initializeDatabase() {
  try {
    const eventCount = await Event.countDocuments();
    if (eventCount === 0) {
      await Event.insertMany(sampleEvents);
      console.log('Sample events added to database');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access denied' });

  jwt.verify(token, 'your-secret-key', (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    // Generate token
    const token = jwt.sign({ userId: user._id, email: user.email }, 'your-secret-key', { expiresIn: '24h' });

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ userId: user._id, email: user.email }, 'your-secret-key', { expiresIn: '24h' });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Event Routes
app.get('/api/events', authenticateToken, async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events', error: error.message });
  }
});

app.post('/api/events', authenticateToken, async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.status(201).json({ message: 'Event created successfully', event });
  } catch (error) {
    res.status(500).json({ message: 'Error creating event', error: error.message });
  }
});

// Manual seed endpoint (optional - for adding more events later)
app.post('/api/events/seed', async (req, res) => {
  try {
    await Event.deleteMany({}); // Clear existing events
    await Event.insertMany(sampleEvents);
    res.json({ message: 'Sample events created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error seeding events', error: error.message });
  }
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start server
mongoose.connection.once('open', async () => {
  console.log('Connected to MongoDB');
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});