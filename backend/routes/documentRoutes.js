import express from 'express';
const router = express.Router();
import { 
    createDocument, 
    getDocuments,
    getFacultyDocumentsForHOD,
    getHodApprovedDocuments,
    getReportData,
    generateMergedPdfReport, // Import the new merged PDF function
    updateDocumentStatus
} from '../controllers/documentController.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';

// General routes
router.route('/')
    .post(protect, createDocument)
    .get(protect, getDocuments);

// Role-specific GET routes
router.get('/faculty', protect, getFacultyDocumentsForHOD);
router.get('/hod-approved', protect, getHodApprovedDocuments);

// Admin reporting routes
router.get('/report', protect, isAdmin, getReportData);
// New route for merged PDF booklet. It accepts a parameter for the body (e.g., 'NAAC')
router.get('/report/pdf/:body', protect, isAdmin, generateMergedPdfReport); 

// Route to update status
router.put('/:id/status', protect, updateDocumentStatus);

export default router;
