const mongoose = require('mongoose');

// Define the schema for an image
const LyricsSchema = new mongoose.Schema({
  songName: {
    type: String,
    required: true,
    trim: true
  },
  artistName: {
    type: String,
    required: true,
    trim: true
  },
  songType: {
    type: String,
    enum: ['Bangla Song', 'Rabindra Sangeet', 'Band Music', 'Baul Gaan', 'Lalon Geeti', 'Patriotic Song','Folk Song', 'Adhunik Bangla Gaan','Others'],
    required: true
  },
  youtubeLink: {
    type: String,
    trim: true,
    required: true
  },
  imagePath: {
    type: String,
    required: true,
    trim: true
  },
  imageName: {
    type: String,
    required: true,
    trim: true
  },
  view_count: {
    type: Number,
    default: 0, 
    min: 0 ,
    required: true
  },
  comment_count: {
    type: Number,
    default: 0, 
    min: 0 ,
    required: true
  },
  like_count: {
    type: Number,
    default: 0, 
    min: 0 ,
    required: true
  },
  share_count: {
    type: Number,
    default: 0, 
    min: 0 ,
    required: true
  },
  lyrics: {
    type: String,
    trim: true,
    required:true
  },
  uploadedBy:{
    type:String,
    trim:true,
    required: true
  },
  uploadedBy_ID:{
    type:String,
    trim: true,
    required: true
  },
  approved: {
    type:Boolean,
    default: false,
  }
},
{
    timestamps: true,
});

// Create a model using the schema
const Lyrics = mongoose.model('Lyrics', LyricsSchema);

module.exports = Lyrics;
