import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['Uploaded', 'Approved', 'Rejected', 'Commented']
  },
  by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  comment: {
    type: String
  }
});

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a document title'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please provide a category (e.g., NAAC 1.1.1)']
  },
  status: {
    type: String,
    required: true,
    // BUGFIX: Add all possible statuses to the allowed list
    enum: [
        'Pending HOD Approval', 
        'Pending Coordinator Approval', 
        'Approved', 
        'Rejected'
    ],
    default: 'Pending HOD Approval'
  },
  filePath: {
    type: String,
    required: [true, 'File path is required']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  instituteName: {
    type: String,
    required: true
  },
  history: [historySchema]
}, {
  timestamps: true
});

const Document = mongoose.model('Document', documentSchema);
export default Document;
