import express from 'express';
import multer from 'multer';
import path from 'path';
const router = express.Router();

// --- Multer Storage Configuration ---
const storage = multer.diskStorage({
  // Set the destination folder where files will be saved
  destination(req, file, cb) {
    cb(null, 'uploads/'); // Save files to a folder named 'uploads'
  },
  // Set the filename to be unique to avoid conflicts
  filename(req, file, cb) {
    // filename = fieldname-timestamp.extension
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// --- Multer Upload Middleware ---
// Initialize multer with the storage configuration
const upload = multer({
  storage,
});

// --- Define the Upload Route ---
// When a POST request is made to '/api/upload', it will use the 'upload' middleware
// 'document' is the name of the form field for the file input
router.post('/', upload.single('document'), (req, res) => {
  // If the file is uploaded successfully, multer adds a 'file' object to the request.
  // We send back the path of the uploaded file.
  res.send({
    message: 'File uploaded successfully',
    filePath: `/${req.file.path.replace(/\\/g, '/')}`, // Standardize path separators
  });
});

export default router;
