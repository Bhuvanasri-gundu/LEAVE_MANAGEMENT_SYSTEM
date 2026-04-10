const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');
require("./dnsFix");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express
const app = express();

// Global Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: '🚀 SmartLeave API is running!',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/leave-types', require('./routes/leaveTypeRoutes'));
app.use('/api/holidays', require('./routes/holidayRoutes'));

// Error Handler (must be LAST)
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 SmartLeave API Server`);
  console.log(`   Environment : ${process.env.NODE_ENV}`);
  console.log(`   Port        : ${PORT}`);
  console.log(`   Health Check: http://localhost:${PORT}/api/health\n`);
});
