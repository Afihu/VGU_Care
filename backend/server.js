require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Import query first (before using it)
const { query } = require('./config/database');

// Middleware
app.use(express.json());
app.use(cors());

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'VGU Care API is running!',
    database: process.env.DATABASE_URL ? 'Configured' : 'Not configured',
    timestamp: new Date().toISOString()
  });
});

// Database test endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await query('SELECT NOW() as current_time');
    res.json({
      status: 'success',
      message: 'Database connected successfully',
      timestamp: result.rows[0].current_time
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Routes - Add error handling for all routes
try {
  app.use('/api', require('./routes/authRoutes'));
  console.log('✅ authRoutes loaded');
} catch (error) {
  console.error('❌ authRoutes failed:', error.message);
}

try {
  app.use('/api/users', require('./routes/userRoutes'));
  console.log('✅ userRoutes loaded');
} catch (error) {
  console.error('❌ userRoutes failed:', error.message);
}

// Medical staff route
try {
  app.use('/api/medical-staff', require('./routes/medicalStaffRoutes'));
  console.log('✅ medicalStaffRoutes loaded');
} catch (error) {
  console.error('❌ medicalStaffRoutes failed:', error.message);
}

try {
  app.use('/api/admin', require('./routes/adminRoutes'));
  console.log('✅ adminRoutes loaded');
} catch (error) {
  console.error('❌ adminRoutes failed:', error.message);
}

try {
  app.use('/api/appointments', require('./routes/appointmentRoutes'));
  console.log('✅ appointmentRoutes loaded');
} catch (error) {
  console.error('❌ appointmentRoutes failed:', error.message);
}

try {
  app.use('/api/mood', require('./routes/moodRoutes'));
  console.log('✅ moodRoutes loaded');
} catch (error) {
  console.error('❌ moodRoutes failed:', error.message);
}

try {
  app.use('/api/advice', require('./routes/adviceRoutes'));
  console.log('✅ adviceRoutes loaded');
} catch (error) {
  console.error('❌ adviceRoutes failed:', error.message);
}

try {
  app.use('/api/reports', require('./routes/reportRoutes'));
  console.log('✅ reportRoutes loaded');
} catch (error) {
  console.error('❌ reportRoutes failed:', error.message);
}

// Start server
const PORT = process.env.PORT || 5001;  // Changed fallback from 5001 to 5001
app.listen(PORT, () => {
  console.log(`VGU Care Server running on port ${PORT}`);
});