import express from 'express';
const router = express.Router();
import {
    createDocument,
    getDocuments,
    getFacultyDocumentsForHOD,
    getHodApprovedDocuments,
    getReportData,
    generateMergedPdfReport,
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
router.get('/report/pdf/:body', protect, isAdmin, generateMergedPdfReport);

// Route to update status
router.put('/:id/status', protect, updateDocumentStatus);

export default router;