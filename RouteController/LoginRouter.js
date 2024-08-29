const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../Models/Users');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const Middleware = (req,res,next) => {
  const token = req.cookies.loggedInUser;
  if (token) {
    return res.status(401).json({ error: 'You already logged in.' });
  }else{
    next();
  }
}

router.post('/',Middleware, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "Invalid email.",path:"email" });
      }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "No account found with this email.",path:"email" });
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: "Incorrect password.",path:"password" });
    }
    const loggedInUser = {
      user_id: user._id,
      userName: user.userName,
      email: user.email,
      avatar: user.avatar,
      imageName: user.imageName,
      userType: user.userType
    };

    const token = jwt.sign(loggedInUser, JWT_SECRET, { expiresIn: '30d' });

    res.cookie('loggedInUser', token, {
      httpOnly: true,
      secure: true, 
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.status(200).json(loggedInUser);
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

router.post('/logout', (req, res) => {
  // Clear the 'loggedInUser' cookie
  res.clearCookie('loggedInUser', {
    httpOnly: true,
    secure: true, 
    sameSite: 'none',
  });

  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
