import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Import DB and routes
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// --- API Routes ---
// All API calls will be prefixed with /api
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/upload', uploadRoutes);

// --- Deployment Preparation ---

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve the 'uploads' folder statically
// This makes uploaded files accessible via URL
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Serve the frontend static files in production
app.use(express.static(path.join(__dirname, '../'))); // Serve files from the root folder

// For any other route, serve the index.html
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../', 'index.html'));
});


// --- Server Initialization ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));