require('dotenv').config();
const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'VGU Care API is running!',
    database: process.env.DATABASE_URL ? 'Connected' : 'Not configured',
    timestamp: new Date().toISOString()
  });
});

// Routes (to be implemented)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`VGU Care Server running on port ${PORT}`);
});

const { query } = require('./config/database');

// Add this test endpoint
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