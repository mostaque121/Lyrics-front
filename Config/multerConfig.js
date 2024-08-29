const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinaryConfig');

// Storage configuration for lyrics covers
const lyricsCoverStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads', 
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 600, height: 338, crop: 'auto' }, 
      { quality: 'auto', fetch_format: 'auto' }  
    ],
  },
});

// Storage configuration for avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'avatar',
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 600, height: 600, crop: 'auto', }, 
      { quality: 'auto', fetch_format: 'auto' }  
    ],
  },
});

// Storage configuration for message
const messageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'message',
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 600, crop: 'scale', }, 
      { quality: 'auto', fetch_format: 'auto' }  
    ],
  },
});


const uploadAvatar = multer({ storage: avatarStorage });
const uploadLyricsCover = multer({ storage: lyricsCoverStorage });
const uploadMessageImage = multer({ storage: messageStorage });

module.exports = {
  uploadAvatar,
  uploadLyricsCover,
  uploadMessageImage,
};

