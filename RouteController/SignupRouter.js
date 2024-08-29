const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET
const { handleValidationErrors, validateUser } = require('../Helper/Validate');
const { sendOtpToUser,resendOtpToUser,validateOtp,sendOtpToUserTemp } = require("../Helper/EmailVerify");
const User = require('../Models/Users')
const {uploadAvatar} = require('../Config/multerConfig')


// Route for user registration and sending OTP
router.post('/', validateUser, handleValidationErrors, sendOtpToUser, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = {
      userName: req.body.userName,
      email: req.body.email,
      password: hashedPassword,
    };
    req.session.user = user;
    res.json({ message: 'OTP sent to your email.', user });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});


// Route for OTP verification and saving the user in the database
router.post('/verify', validateOtp, async (req, res) => {
  try {
    const userSession = req.session.user;

    if (!userSession) {
      return res.status(401).json({ error: 'User not found.' });
    }

    const userData = {
      ...userSession, 
      lastActive: Date.now() 
    };

    // Create and save the new user
    const newUser = new User(userData);
    await newUser.save();

    // Store the user's ID and authenticated status in the session
    req.session.user = {
      _id: newUser._id,
      userName: newUser.userName,
      email: newUser.email,
      avatar: newUser.avatar,
      authenticated: true,
    };

    res.status(200).json({ message: 'User verified and saved successfully.', user: req.session.user });
  } catch (err) {
    console.error('Error saving user after OTP verification:', err);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});


// Middleware to check if the user is authenticated
const ensureAuthenticated = (req, res, next) => {
  const user = req.session.user;
  if (!user) {
    return res.status(401).json({ error: 'User not found.' });
  }
  if (user.authenticated) {
    next();
  } else {
    return res.status(401).json({ error: 'User not authenticated.' });
  }
};


// Route for avatar upload
router.post('/avatar', ensureAuthenticated, uploadAvatar.single('avatar'), async (req, res) => {
  const user = req.session.user;

  if (!req.file) {
    return res.status(400).json({ error: 'No avatar file uploaded.' });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { avatar: req.file.path,imageName: req.file.filename },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Create a JWT token for the updated user
    const loggedInUser = {
      user_id: updatedUser._id,
      userName: updatedUser.userName,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      imageName: updatedUser.imageName,
      userType: updatedUser.userType,
    };

    const token = jwt.sign(loggedInUser, JWT_SECRET, { expiresIn: '30d' });

    // Set the JWT token as a cookie
    res.cookie('loggedInUser', token, {
      httpOnly: true,
      secure: true, // Set to true in production
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Destroy session after setting the cookie
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Could not delete session.' });
      }

      res.json({ message: 'Avatar updated successfully.', user: loggedInUser });
    });

  } catch (error) {
    console.error('Error updating avatar:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});


// Route for skip avatar upload
router.post('/skip', ensureAuthenticated, (req, res) => {
  const user = req.session.user;

  // Create the payload for the JWT token
  const loggedInUser = {
    user_id: user._id,
    userName: user.userName,
    email: user.email,
  };

  // Generate the JWT token
  const token = jwt.sign(loggedInUser, JWT_SECRET, { expiresIn: '30d' });

  // Set the JWT token as an HTTP-only cookie
  res.cookie('loggedInUser', token, {
    httpOnly: true,
    secure: true, // Set to true in production
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  // Destroy the session after setting the cookie
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ error: 'Could not delete session' });
    }

    // Send success response after session is destroyed
    res.json({ message: 'Session deleted successfully and user logged in with JWT.' });
  });
});






module.exports = router;