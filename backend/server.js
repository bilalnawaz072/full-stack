const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const db = require('./db');
const apiRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for dev/testing
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('dev')); // Dev logger

// Root route for Render health checks (HEAD / or GET /)
app.get('/', (req, res) => {
  res.status(200).send('TaskFlow Express API Server is live and healthy!');
});

// Base API route check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    database: 'postgresql (prisma)',
    timestamp: new Date().toISOString()
  });
});

// Routing
app.use('/api', apiRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Initialize database, then start listening
async function startServer() {
  try {
    await db.initDatabase();
    app.listen(PORT, () => {
      console.log(`========================================`);
      console.log(`🚀 TaskFlow Backend running on port ${PORT}`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`========================================`);
    });
  } catch (err) {
    console.error('Failed to initialize application server:', err);
    process.exit(1);
  }
}

startServer();
