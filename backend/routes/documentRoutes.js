import express from 'express';
const router = express.Router();
import { 
    createDocument, 
    getDocuments,
    getFacultyDocumentsForHOD,
    getHodApprovedDocuments,
    updateDocumentStatus
} from '../controllers/documentController.js';
import { protect } from '../middleware/authMiddleware.js';

// General routes for creating and fetching personal documents
router.route('/')
    .post(protect, createDocument)
    .get(protect, getDocuments);

// Route for an HOD to get all documents from faculty
router.route('/faculty')
    .get(protect, getFacultyDocumentsForHOD);

// Route for a Coordinator to get documents approved by HODs
router.route('/hod-approved')
    .get(protect, getHodApprovedDocuments);

// Route to update the status of a specific document
router.route('/:id/status')
    .put(protect, updateDocumentStatus);

export default router;
