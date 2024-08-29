const { Server } = require('socket.io');
const Message = require('../Models/Message');
const User = require('../Models/Users');

const setupSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  const users = {}; 

  io.on('connection', (socket) => {

    // Register the user with their user ID
    socket.on('register', (userId) => {
      users[userId] = socket.id;

      // Update user's active status and last active time when they connect
      User.findByIdAndUpdate(userId, {
        $set: { isOnline: true, lastActive: Date.now() },
      })
      .then(() => console.log(`User ${userId} status updated to active`))
      .catch(err => console.error('Error updating user status:', err));
    });


    // Join a specific room (conversation)
    socket.on('join-room', ({ roomId }) => {
      socket.join(roomId);
    });

    // Handle messaging within a conversation
    socket.on('send-message', ({ msg,senderId, conversationId }) => {
      io.to(conversationId).emit('new-message', { msg, senderId });
    });

    // Handle typing status within a conversation
    socket.on('typing-status', ({ userId, isTyping, conversationId }) => {
      io.to(conversationId).emit('typing-status', { userId, isTyping });
    });

    // Handle message seen status
    socket.on('message-seen', async ({ messageIds, conversationId, seenBy }) => {
      try {
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $set: { status: 'seen' } }
        );
        io.to(conversationId).emit('message-seen', { messageIds,conversationId, seenBy });
      } catch (error) {
        console.error('Error updating message status:', error);
      }
    });

    // Handle user disconnect
    socket.on('disconnect', async () => {
    for (let userId in users) {
      if (users[userId] === socket.id) {
        delete users[userId];
        // Update user's last active time and set active status to false
        try {
          await User.findByIdAndUpdate(userId, {
            $set: { lastActive: Date.now(), isOnline: false },
          });
          console.log("User" ,userId ,"Status updated to inactive")
        } catch (error) {
          console.error('Error updating user status on disconnect:', error);
        }
        break;
      }
    }
  });

  });

  return io;
};

module.exports = setupSocketIO;
