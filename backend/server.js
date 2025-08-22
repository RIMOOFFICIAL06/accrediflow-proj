// Import necessary packages using the new 'import' syntax
import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import connectDB from './config/db.js'; // Note the '.js' extension is often needed with imports
import userRoutes from './routes/userRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

// Configure dotenv
dotenv.config();

// Establish the database connection
connectDB();

// Initialize the Express application
const app = express();

// --- Middleware ---
app.use(cors({ origin: '*' })); 
app.use(express.json()); 

// --- API Routes ---
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/upload', uploadRoutes);

// --- Serve Static Files ---
const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));


// --- Basic Route ---
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the AccrediFlow API!' });
});

// --- Start the Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
