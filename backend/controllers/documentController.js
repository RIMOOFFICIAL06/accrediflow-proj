import Document from '../models/documentModel.js';
import User from '../models/userModel.js';

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

    const newDocument = await Document.create({
      title,
      category,
      filePath,
      owner: req.user._id,
      instituteName: req.user.instituteName,
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

        const documents = await Document.find({ owner: { $in: facultyIds } })
            .populate('owner', 'name email');
        
        res.status(200).json(documents);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Get all documents approved by HODs for a Coordinator to review
 * @route   GET /api/documents/hod-approved
 * @access  Private (Coordinator)
 */
export const getHodApprovedDocuments = async (req, res) => {
    try {
        const documents = await Document.find({ 
            instituteName: req.user.instituteName,
            status: 'Approved' 
        }).populate('owner', 'name email');
        
        res.status(200).json(documents);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Get all fully approved documents for an Admin report
 * @route   GET /api/documents/report
 * @access  Private (Admin)
 */
export const getReportData = async (req, res) => {
    try {
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
        
        document.status = status;
        document.history.push({
            action: status,
            by: req.user._id,
            comment: comment || `Status updated by ${req.user.role}`
        });

        const updatedDocument = await document.save();
        res.status(200).json(updatedDocument);

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
