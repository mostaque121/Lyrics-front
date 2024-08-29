const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const Lyrics = require ('../Models/Lyrics');
const User = require('../Models/Users');
const Notification = require('../Models/Notification');
const { uploadLyricsCover } = require("../Config/multerConfig");
const deleteResource = require('../Config/DeleteCloudinary');


// Middleware

const Middleware = (req, res, next) => {
  const token = req.cookies.loggedInUser;
  if (!token) {
    return null
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; 
    next(); 
  } catch (err) {
    return res.status(401).json({ loggedIn: false });
  }
};

// Fetch User when load 
router.get('/',Middleware, async (req, res) => {
const user = req.user;
  res.json(user);
});

// Handle the file upload and form data
router.post('/upload', Middleware, uploadLyricsCover.single('imagePath'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { songName, artistName, songType, youtubeLink, lyrics } = req.body;

  try {
    const dbUser = await User.findById(req.user.user_id);
    const approved = dbUser.userType === "boss";

    // Create new lyrics document
    const newLyrics = new Lyrics({
      songName,
      artistName,
      songType,
      youtubeLink,
      imagePath: req.file.path,
      imageName: req.file.filename,
      view_count: 0,
      like_count: 0,
      comment_count: 0,
      share_count: 0,
      uploadedBy_ID: req.user.user_id,
      uploadedBy: req.user.userName,
      lyrics,
      approved
    });

    await newLyrics.save();

    // If the user is not "boss", notify all admins for approval
    if (!approved) {
      const admins = await User.find({ userType: 'boss' });
      
      const notifications = admins.map(admin => ({
        recipient: admin._id,
        sender: req.user.user_id,
        type: 'post',
        imagePath: req.user?.avatar || "",
        post: newLyrics._id,
        message: `${req.user.userName} uploaded lyrics "${songName}" and it requires your approval.`,
        link: `/ViewPending/${newLyrics._id}`,
      }));

      await Notification.insertMany(notifications);
    }

    // Send success response
    res.json({
      message: 'Upload successful',
      songName,
      artistName,
      songType,
      youtubeLink,
      lyrics,
      imagePath: req.file.path,
      approved,
    });

  } catch (error) {
    // Delete the uploaded file if saving the lyrics failed
    deleteResource(req.file.filename);
    console.error('Error uploading lyrics:', error);
    res.status(500).json({ message: 'Lyrics not uploaded' });
  }
});

//Get the Edit Lyrics
router.get('/editlyrics/:id',Middleware, async (req, res) => {
  try {
    const user = req.user
    const lyrics = await Lyrics.findById(req.params.id);
    if (!lyrics) {
      return res.status(404).json({ message: 'Lyrics not found' });
    }
    if (user.userType !== "boss" && (lyrics.uploadedBy_ID !== user.user_id || lyrics.approved === true)) {
      return res.status(403).json({ message: "Not permitted" });
    }
    res.json(lyrics);
  } catch (error) {
    console.error('Error fetching lyrics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to Edit specific lyrics by ID
router.put('/editlyrics/:id', Middleware, uploadLyricsCover.single('imagePath'), async (req, res) => {
  try {
    const oldLyrics = await Lyrics.findById(req.params.id);
    const user = req.user;

    if (user.userType !== "boss" && (oldLyrics.uploadedBy_ID !== user.user_id || oldLyrics.approved === true)) {
      return res.status(403).json({ message: "Not permitted" });
    }

    let imageName = oldLyrics.imageName;
    let imagePath = oldLyrics.imagePath;

    if (req.file) {
      deleteResource(imageName);
      imageName = req.file.filename;
      imagePath = req.file.path;
    }

    const { songName, songType, lyrics, youtubeLink, artistName } = req.body;

    const updatedLyrics = await Lyrics.findByIdAndUpdate(
      req.params.id,
      { songName, songType, lyrics, imagePath, imageName, youtubeLink, artistName },
      { new: true }
    );

    if (!updatedLyrics) {
      return res.status(404).json({ message: 'Lyrics not found' });
    }

    res.json({ message: 'Lyrics updated successfully', updatedLyrics });
  } catch (error) {
    console.error('Error updating lyrics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



  

module.exports = router;
