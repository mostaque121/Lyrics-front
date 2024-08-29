const express = require('express');
const router = express.Router();
const Lyrics = require('../Models/Lyrics');
const moment = require('moment');

// Load home page
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const data = await Lyrics.findById(id);

    if (!data) {
      return res.status(404).json({ message: 'Data not found' });
    }
    if(data.approved){
    // Increment views count
    data.view_count += 1;
    await data.save();
    const formattedData = {
      view_count: data.view_count,
      imagePath: data.imagePath,
      uploadDate: moment(data.createdAt).format('DD MMMM YYYY'),
      lyrics: data.lyrics,
      artistName: data.artistName,
      id: data._id,
      songName: data.songName,
      youtubeLink: data.youtubeLink,
      songType: data.songType,
      uploadedBy: data.uploadedBy,
    };
    res.json(formattedData);
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;