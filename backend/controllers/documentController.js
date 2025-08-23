import Document from '../models/documentModel.js';
import User from '../models/userModel.js';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

/**
 * @desc    Upload (create) a new document
 * @route   POST /api/documents
 * @access  Private (All authenticated users)
 */
export const createDocument = async (req, res) => {
  try {
    const { title, category, filePath } = req.body;

    if (!title || !category || !filePath) {
      return res.status(400).json({ message: 'Please provide a title, category, and file path.' });
    }

    // Set initial status based on the uploader's role
    let initialStatus;
    if (req.user.role === 'faculty') {
        initialStatus = 'Pending HOD Approval';
    } else {
        // HODs and Coordinators bypass the first approval step
        initialStatus = 'Pending Coordinator Approval';
    }

    const newDocument = await Document.create({
      title,
      category,
      filePath,
      owner: req.user._id,
      instituteName: req.user.instituteName,
      status: initialStatus,
      history: [{
        action: 'Uploaded',
        by: req.user._id,
      }]
    });

    res.status(201).json(newDocument);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * @desc    Get documents based on user role
 * @route   GET /api/documents
 * @access  Private (All authenticated users)
 */
export const getDocuments = async (req, res) => {
  try {
    let documents;
    if (req.user.role === 'admin') {
      documents = await Document.find({ instituteName: req.user.instituteName })
        .populate('owner', 'name email');
    } else {
      documents = await Document.find({ owner: req.user._id })
        .populate('owner', 'name email');
    }
    res.status(200).json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * @desc    Get all faculty documents for an HOD to review
 * @route   GET /api/documents/faculty
 * @access  Private (HOD)
 */
export const getFacultyDocumentsForHOD = async (req, res) => {
    try {
        const facultyUsers = await User.find({
            instituteName: req.user.instituteName,
            role: 'faculty'
        }).select('_id');

        const facultyIds = facultyUsers.map(user => user._id);

        // HODs only see documents awaiting their specific approval
        const documents = await Document.find({ 
            owner: { $in: facultyIds },
            status: 'Pending HOD Approval' 
        }).populate('owner', 'name email');
        
        res.status(200).json(documents);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Get documents for a Coordinator to review
 * @route   GET /api/documents/hod-approved
 * @access  Private (Coordinator)
 */
export const getHodApprovedDocuments = async (req, res) => {
    try {
        // Coordinators see all documents awaiting their specific approval
        const documents = await Document.find({ 
            instituteName: req.user.instituteName,
            status: 'Pending Coordinator Approval',
        }).populate('owner', 'name email');
        
        res.status(200).json(documents);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


/**
 * @desc    Get all fully approved documents for an Admin report (for the UI table)
 * @route   GET /api/documents/report
 * @access  Private (Admin)
 */
export const getReportData = async (req, res) => {
    try {
        // Reports should only contain documents with the final 'Approved' status
        const documents = await Document.find({ 
            instituteName: req.user.instituteName,
            status: 'Approved' 
        }).populate('owner', 'name email role');
        
        res.status(200).json(documents);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


/**
 * @desc    Generate a merged PDF booklet for a specific accreditation body
 * @route   GET /api/documents/report/pdf/:body
 * @access  Private (Admin)
 */
export const generateMergedPdfReport = async (req, res) => {
    try {
        const accreditationBody = req.params.body.toUpperCase();

        // Only merge documents with the final 'Approved' status
        const documents = await Document.find({ 
            instituteName: req.user.instituteName,
            status: 'Approved',
            category: { $regex: `^${accreditationBody}`, $options: 'i' }
        }).sort({ category: 1 });

        if (documents.length === 0) {
            return res.status(404).json({ message: `No approved documents found for ${accreditationBody}.` });
        }

        const mergedPdf = await PDFDocument.create();

        for (const doc of documents) {
            const filePath = path.join(path.resolve(), doc.filePath);
            try {
                const pdfBytes = await fs.readFile(filePath);
                const pdfToMerge = await PDFDocument.load(pdfBytes);
                const copiedPages = await mergedPdf.copyPages(pdfToMerge, pdfToMerge.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            } catch (err) {
                console.warn(`Could not read or merge file: ${doc.filePath}. Skipping. Error: ${err.message}`);
            }
        }

        const pdfBytes = await mergedPdf.save();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=AccrediFlow-Report-${accreditationBody}.pdf`);
        res.send(Buffer.from(pdfBytes));

    } catch (error) {
        console.error("PDF Merging Error:", error);
        res.status(500).json({ message: 'Server Error during PDF generation.' });
    }
};


/**
 * @desc    Update a document's status (Approve/Reject)
 * @route   PUT /api/documents/:id/status
 * @access  Private (HOD/Coordinator/Admin)
 */
export const updateDocumentStatus = async (req, res) => {
    try {
        const { status, comment } = req.body;
        if (!status || !['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status provided.' });
        }

        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found.' });
        }
        
        let nextStatus = status; // Default to the provided status ('Rejected')

        // Implement the multi-level approval logic
        if (status === 'Approved') {
            if (req.user.role === 'hod' && document.status === 'Pending HOD Approval') {
                nextStatus = 'Pending Coordinator Approval';
            } else if (req.user.role === 'coordinator' && document.status === 'Pending Coordinator Approval') {
                nextStatus = 'Approved'; // Final approval
            } else {
                // Prevent users from approving documents not in their queue
                return res.status(403).json({ message: 'This document is not awaiting your approval.' });
            }
        }
        
        document.status = nextStatus;
        document.history.push({
            action: status, // Log the intended action ('Approved' or 'Rejected')
            by: req.user._id,
            comment: comment || `Status updated to ${nextStatus} by ${req.user.role}`
        });

        const updatedDocument = await document.save();
        res.status(200).json(updatedDocument);

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
