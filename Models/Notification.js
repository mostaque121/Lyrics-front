const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // References the User model
    required: false
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // References the User model; could be null if system-generated
    required: false
  },
  type: {
    type: String,
    enum: ['post', 'approve', 'delete', 'like', 'comment', 'share'],
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lyrics', // References the Post model; the post related to the notification
    required: false
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  imagePath:{
    type: String,
    required:false
  },
  link: {
    type: String,
    required: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
