const express = require('express');
const router = express.Router();
const Lyrics = require('../Models/Lyrics');
const Notification = require('../Models/Notification');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

//Middleware
const Middleware = (req, res, next) => {
    const token = req.cookies.loggedInUser;
    if (!token) {
      return res.status(200).json({ loggedIn: false });
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded; 
      if(req.user.userType !=="boss"){
        return res.status(200).json({ Boss: false });
      }
      next(); 
    } catch (err) {
      return res.status(401).json({ Boss: false });
    }
  };

router.get('/pendingcount',Middleware, async (req, res) => {
    try{
        const pendingCount = await Lyrics.countDocuments({ approved: false })
        res.json({pendingCount: pendingCount});
    }catch(error){
        console.error('Error counting items:', err);
    }
  });



module.exports = router;