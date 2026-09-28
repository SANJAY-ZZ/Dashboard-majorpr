const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Routes
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB and auto-seed if empty
const Employee = require('./models/Employee');
const seedDatabase = require('./seed/seedData');

connectDB().then(async () => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const count = await Employee.countDocuments();
      if (count === 0) {
        console.log('[Server] Database is empty. Auto-seeding initial dataset...');
        await seedDatabase(false);
      }
    } catch (e) {
      console.warn('[Server] Auto-seed check failed:', e.message);
    }
  }
});

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger (Development)
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    project: 'Employee Task & Project Management Web Application',
    module5: 'Dashboard Module Active',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Start server
let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Employee Task & Project Management API Server running on port ${PORT}`);
    console.log(`📡 Health Check:     http://localhost:${PORT}/api/health`);
    console.log(`📊 Dashboard API:    http://localhost:${PORT}/api/dashboard/stats`);
    console.log(`📋 Tasks API:        http://localhost:${PORT}/api/tasks`);
    console.log(`👥 Employees API:    http://localhost:${PORT}/api/employees`);
    console.log(`📁 Projects API:     http://localhost:${PORT}/api/projects`);
    console.log(`🔐 Auth API:         http://localhost:${PORT}/api/auth`);
    console.log(`======================================================\n`);
  });
}

module.exports = { app, server };
