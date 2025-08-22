// Import mongoose and bcrypt using the new 'import' syntax
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Define the schema for the User model
const userSchema = new mongoose.Schema({
  // --- Institute Details (for Admin/Signup) ---
  instituteName: {
    type: String,
    required: [function() { return this.role === 'admin'; }, 'Institute name is required for admins']
  },
  instituteType: {
    type: String,
    required: [function() { return this.role === 'admin'; }, 'Institute type is required for admins']
  },
  accreditationBody: {
    type: String,
    required: [function() { return this.role === 'admin'; }, 'Accreditation body is required for admins']
  },
  emailDomain: {
    type: String,
    required: [function() { return this.role === 'admin'; }, 'Email domain is required for admins']
  },

  // --- Common User Details ---
  name: {
    type: String,
    required: [true, 'Please provide a name']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address']
  },
  phone: {
    type: String,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'coordinator', 'hod', 'faculty'],
    required: true
  },
  approved: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// --- Mongoose Middleware for Password Hashing ---
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Create the User model from the schema
const User = mongoose.model('User', userSchema);

// Export the model using the new 'export default' syntax
export default User;
