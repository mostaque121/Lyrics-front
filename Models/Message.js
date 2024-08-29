const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // Add this field
  content: { type: String, trim: true },
  image: { type: String },
  imageName: { type: String },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ["sent", "seen"], default: "sent" },
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' }
});

  module.exports = mongoose.model('Message', messageSchema);
  