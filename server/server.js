const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const apiRoutes = require('./routes/api');
const seedDatabase = require('./seed/seedData');
const startTelemetrySimulator = require('./services/simulator');

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || '*';
const corsOrigin = CLIENT_URL === '*' ? '*' : CLIENT_URL.split(',').map(s => s.trim());

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  }
});

app.set('io', io);

// Middleware
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ONLINE', 
    timestamp: new Date().toISOString(),
    service: 'Hydrogen Storage Monitoring & Safety API'
  });
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Database & Server Startup
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hydrogen_safety';

const startServer = async () => {
  try {
    console.log(`Connecting to MongoDB at: ${MONGO_URI}`);
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('Connected to MongoDB successfully.');

    // Seed database if empty
    await seedDatabase();

    // Start background simulator if not disabled
    if (process.env.ENABLE_SIMULATOR !== 'false') {
      startTelemetrySimulator(io);
    }

    server.listen(PORT, () => {
      console.log(`Hydrogen Safety API Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.log('Starting HTTP server in offline mode...');
    server.listen(PORT, () => {
      console.log(`Hydrogen Safety API Server running (offline fallback) on port ${PORT}`);
    });
  }
};

startServer();
