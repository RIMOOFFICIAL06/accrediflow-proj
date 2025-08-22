// Import necessary packages
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const documentRoutes = require('./routes/documentRoutes'); // Import document routes

// Establish the database connection
connectDB();

// Initialize the Express application
const app = express();

// --- Middleware ---
app.use(cors({ origin: '*' })); 
app.use(express.json()); 

// --- API Routes ---
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes); // Use the new document routes

// --- Basic Route ---
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the AccrediFlow API!' });
});

// --- Start the Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
