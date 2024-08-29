const express = require('express');
const router = express.Router();
const Lyrics = require('../Models/Lyrics'); 
const moment = require('moment');

// Load home page
// Get latest items
router.get('/latest', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query; // Default to page 1 and limit 10

    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    // Fetch the paginated data
    const latestData = await Lyrics.find({approved:true})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    if (!latestData.length) {
      return res.status(404).json({ message: 'Data not found' });
    }

    // Format the createdAt field
    const formattedLatestData = latestData.map(item => ({
      view_count: item.view_count,
      imagePath: item.imagePath,
      createdAt: moment(item.createdAt).format('DD MMMM YYYY'),
      artistName: item.artistName,
      _id: item._id,
      songName: item.songName,
    }));

    // Get the total number of documents
    const totalItems = await Lyrics.countDocuments();

    // Calculate the total number of pages
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      items: formattedLatestData,
      totalPages: totalPages,
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// Trending Item

router.get('/trending', async (req, res) => {
  try {
    const VIEW_POINTS = 1;
    const OLDER_POINTS = 2;
    const currentDate = new Date();

    const items = await Lyrics.find({approved: true}).exec();
    
    items.forEach(item => {
      const daysSinceUpload = Math.floor((currentDate - new Date(item.createdAt)) / (1000 * 60 * 60 * 24));
      const olderPoints = daysSinceUpload * OLDER_POINTS;
      item.score = Math.max((item.view_count * VIEW_POINTS) - olderPoints, 0); // Ensure the score is at least 0
    });

    // Sort items by score in descending order, then by recency (createdAt) in descending order
    const topItems = items
      .sort((a, b) => {
        if (b.score === a.score) {
          return new Date(b.createdAt) - new Date(a.createdAt); // More recent items come first if scores are equal
        }
        return b.score - a.score;
      })
      .slice(0, 6);

    if (!topItems.length) {
      return res.status(404).json({ message: 'Data not found' });
    }

    // Format the createdAt field
    const formattedTrendingData = topItems.map(item => ({
      view_count: item.view_count,
      imagePath: item.imagePath,
      createdAt: moment(item.createdAt).format('DD MMMM YYYY'),
      artistName: item.artistName,
      _id: item._id,
      songName: item.songName
    }));

    res.json(formattedTrendingData);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

 
// get popular item

router.get('/popular', async (req, res) => {
  try {
    const popularData = await Lyrics.find({approved:true}).sort({ view_count: -1 }).limit(6);

    if (!popularData.length) {
      return res.status(404).json({ message: 'Data not found' });
    }
   // Format the createdAt field
   const formattedPopularData = popularData.map(item => ({
    view_count: item.view_count,
    imagePath: item.imagePath,
    createdAt: moment(item.createdAt).format('DD MMMM YYYY'),
    artistName : item.artistName,
    _id : item._id,
    songName: item.songName
  }));
  res.json(formattedPopularData);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search Item
router.get('/search', async (req, res) => {
  const { q } = req.query;
  try {
    const items = await Lyrics.find({ songName: { $regex: q, $options: 'i' } }).limit(5); // Case-insensitive search
    const formattedData = items.map(item => ({
      view_count: item.view_count,
      imagePath: item.imagePath,
      createdAt: moment(item.createdAt).format('DD MMMM YYYY'),
      artistName : item.artistName,
      id : item._id,
      songName: item.songName
    }));
    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
