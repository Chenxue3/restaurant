import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import * as emailService from '../services/azureEmail.js';
import * as redisService from '../config/redis.js';

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// @desc    Send verification code
// @route   POST /api/auth/send-code
// @access  Public
export const sendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email'
      });
    }

    console.log(`Attempting to send verification code to: ${email}`);

    // Generate a verification code
    const code = redisService.generateCode();
    console.log(`Generated verification code: ${code}`);

    // Save the code to Redis
    try {
      await redisService.storeVerificationCode(email, code);
      console.log(`Verification code stored in Redis for ${email}`);
    } catch (redisError) {
      console.error('Redis storage failed:', redisError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to store verification code. Please check Redis connection.',
        error: redisError.message
      });
    }

    // Send the verification code via email
    try {
      await emailService.sendVerificationEmail(email, code);
      console.log(`Verification email sent to ${email}`);
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please check email service configuration.',
        error: emailError.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verification code sent successfully'
    });
  } catch (error) {
    console.error('Unexpected error in sendVerificationCode:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while sending verification code',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Verify code and login/register user
// @route   POST /api/auth/verify
// @access  Public
export const verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and verification code'
      });
    }

    // Find the verification code in Redis
    const storedCode = await redisService.getVerificationCode(email);

    if (!storedCode || storedCode !== code) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
    }

    // Check if the user already exists
    let user = await User.findOne({ email });
    let isNewUser = false;

    // If the user doesn't exist, create a new account
    if (!user) {
      user = await User.create({
        email
      });
      isNewUser = true;
    }

    // Update last login time
    user.lastLogin = Date.now();
    await user.save();

    // Delete the verification code
    await redisService.deleteVerificationCode(email);

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      isNewUser,
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying code',
      error: error.message
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { name },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
}; 