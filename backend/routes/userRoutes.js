import express from 'express';
const router = express.Router();
import {
  registerUser,
  loginUser,
  getPendingAdmins,
  approveAdmin,
  createInstituteUser,
  getInstituteUsers
} from '../controllers/userController.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';

// --- Public Routes ---
router.post('/register', registerUser);
router.post('/login', loginUser);

// --- Superadmin Routes ---
router.get('/pending', getPendingAdmins);
router.put('/:id/approve', approveAdmin);

// --- Admin Routes (Protected) ---
router.route('/') // Corrected from '/:id' to '/'
    .post(protect, isAdmin, createInstituteUser)
    .get(protect, isAdmin, getInstituteUsers);

export default router;