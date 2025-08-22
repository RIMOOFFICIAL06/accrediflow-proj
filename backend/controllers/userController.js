import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// --- TOKEN GENERATION ---
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// --- PUBLIC ROUTES ---

/** @desc Register a new user (Institute Admin Signup) */
export const registerUser = async (req, res) => {
  try {
    const { instituteName, instituteType, accreditationBody, emailDomain, name, email, phone, password } = req.body;
    if (!name || !email || !password || !instituteName) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    const user = await User.create({
      instituteName, instituteType, accreditationBody, emailDomain, name, email, phone, password,
      role: 'admin', approved: false
    });
    if (user) {
      res.status(201).json({ message: 'Registration successful! Awaiting Superadmin approval.' });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/** @desc Authenticate a user & get token (Login) */
export const loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.approved) {
      return res.status(403).json({ message: 'Your account is pending approval.' });
    }
    if (user.role !== role) {
      return res.status(403).json({ message: `You do not have permissions for the '${role}' role.` });
    }
    res.status(200).json({
      _id: user._id, name: user.name, email: user.email, role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// --- SUPERADMIN ROUTES ---

/** @desc Get all pending admin accounts */
export const getPendingAdmins = async (req, res) => {
  try {
    const pendingAdmins = await User.find({ role: 'admin', approved: false });
    res.status(200).json(pendingAdmins);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/** @desc Approve an admin account */
export const approveAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      user.approved = true;
      const updatedUser = await user.save();
      res.status(200).json({ message: `User ${updatedUser.name} approved.` });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// --- ADMIN ROUTES ---

/** @desc Create a new user (HOD, Faculty, etc.) by an Admin */
export const createInstituteUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'Please provide name, email, password, and role.' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }
        
        const newUser = await User.create({
            name, email, password, role,
            instituteName: req.user.instituteName,
            approved: true,
            createdBy: req.user._id
        });

        if (newUser) {
            res.status(201).json({
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/** @desc Get all users for the logged-in admin's institute */
export const getInstituteUsers = async (req, res) => {
    try {
        const users = await User.find({ instituteName: req.user.instituteName });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
