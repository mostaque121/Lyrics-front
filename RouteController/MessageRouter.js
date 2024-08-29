const express = require('express');
const router = express.Router();
const Conversation = require('../Models/Conversation');
const Message = require('../Models/Message');
const User = require('../Models/Users')
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const {uploadMessageImage} = require('../Config/multerConfig');


//Middleware
const Middleware = (req, res, next) => {
    const token = req.cookies.loggedInUser;
    if (!token) {
      return res.status(200).json({ loggedIn: false });
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded; 
      next(); 
    } catch (err) {
      return res.status(401).json({ loggedIn: false });
    }
  };

// Router to get the number of new message when load
router.get('/new', Middleware, async (req, res) => {
  try {
    const currentUserId = req.user.user_id;

    const newMessagesCount = await Message.countDocuments({
      receiver: currentUserId,
      status: "sent"
    });

    res.status(200).json({ newMessagesCount });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});
    

// Router to get all users
router.get('/users',Middleware, async (req, res) => {

  try {
    const currentUserId = req.user.user_id;

    const users = await User.find({ _id: { $ne: currentUserId } })
      .sort({ lastActive: -1 })
      .select('lastActive isOnline userName _id avatar');
    if (!users) {
      return res.status(404).json({ message: 'No users found' });
    }
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});  

// Route to get or create a conversation based on participants
router.post('/conversation', async (req, res) => {
  const { senderId, targetUserId } = req.body;
  try {
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, targetUserId] }
    });
    if (!conversation) {
      conversation = new Conversation({
        participants: [senderId, targetUserId]
      });
      await conversation.save();
    }

    res.status(200).json({ conversationId: conversation._id });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Route for get all conversation of user
router.get('/conversations/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const conversations = await Conversation.find({ participants: userId })
    .populate('lastMessage')
    .populate('participants', 'userName isOnline lastActive avatar _id')
    .exec();
  
  // Manual sorting based on populated field
  const filteredConversations = conversations.filter(conversation => conversation.lastMessage);

  // Sort the filtered conversations based on the timestamp of lastMessage
  filteredConversations.sort((a, b) => {
    const timestampA = a.lastMessage.timestamp;
    const timestampB = b.lastMessage.timestamp;
    return timestampB - timestampA; 
  });
  
  // Return the filtered and sorted conversations as a JSON response
  res.json(filteredConversations);

  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Route to get a conversation and fetch all related messages
router.get('/:conversationId', Middleware, async (req, res) => {
  const { conversationId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;
  try {
    const messages = await Message.find({ conversationId:conversationId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Route for send message
router.post('/', Middleware, uploadMessageImage.single('image'), async (req, res) => {
  const { senderId, targetUserId, content } = req.body;

  try {
    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, targetUserId] }
    });


    if (!content && !req.file) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    const messageData = {
      content: content || null,
      sender: senderId,
      receiver: targetUserId,
      conversationId: conversation._id,
      image: req.file ? req.file.path : null,
      imageName: req.file ? req.file.filename : null,
    };

    const newMessage = new Message(messageData);
    await newMessage.save();

    conversation.lastMessage = newMessage._id;
    await conversation.save();

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: 'Error saving message', error: error.message });
  }
});



  
  module.exports = router;
