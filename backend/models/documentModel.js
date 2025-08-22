import mongoose from 'mongoose';

// Define the schema for the approval history sub-document
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

// Define the main schema for the Document model
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
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
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

// Create the Document model from the schema
const Document = mongoose.model('Document', documentSchema);

// Export the model using the new 'export default' syntax
export default Document;
